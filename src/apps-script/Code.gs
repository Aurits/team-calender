/**
 * Cadence — Google Sheets backend (Apps Script Web App).
 *
 * This script is BOUND to the Cadence spreadsheet and deployed as a Web App.
 * The Next.js server POSTs JSON { secret, action, ...payload } to the /exec URL;
 * we run as the sheet owner, so no Google credentials live in the Next.js app.
 *
 * Setup (see docs/sheets-setup.md):
 *   1. Create a Google Sheet, Extensions → Apps Script, paste this file.
 *   2. Project Settings → Script Properties → add  SHARED_SECRET = <a long random string>.
 *   3. Run setupAndSeed() once (authorize when prompted) to create + fill the tabs.
 *   4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *   5. Put the /exec URL and the same secret in the Next.js .env (SHEETS_WEBAPP_URL, SHEETS_SHARED_SECRET).
 */

/* ------------------------------- config -------------------------------- */
var PEOPLE = "People";
var TASKS = "Tasks";
var ENTRIES = "Entries";
var NOTES = "Notes";

var PEOPLE_COLS = ["id", "pin", "name", "role", "defaultPlace", "tint"];
var TASK_COLS = ["id", "level", "parentId", "title", "description", "priority", "deadline", "place", "assignees", "position"];
var ENTRY_COLS = ["id", "personId", "taskId", "note", "date", "start", "durationMins", "place", "priority", "attendees"];
var NOTE_COLS = ["personId", "date", "content"];

// 1-based column indices that must stay plain text (so Sheets never reformats dates/times).
var TASK_TEXT_COLS = [7]; // deadline
var ENTRY_TEXT_COLS = [5, 6]; // date, start

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty("SHARED_SECRET") || "";
}

/* ------------------------------ web entry ------------------------------ */
var ACTIONS = {
  getPeople: actionGetPeople_,
  verifyPin: actionVerifyPin_,
  getTasks: actionGetTasks_,
  saveTasks: actionSaveTasks_,
  getEntries: actionGetEntries_,
  getDay: actionGetDay_,
  saveDay: actionSaveDay_,
  getNote: actionGetNote_,
  saveNote: actionSaveNote_,
};

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = getSecret_();
    if (!secret || body.secret !== secret) return err_("Unauthorized");
    var fn = ACTIONS[body.action];
    if (!fn) return err_("Unknown action: " + body.action);
    return ok_(fn(body));
  } catch (err) {
    return err_(String((err && err.message) || err));
  }
}

// Visiting the URL in a browser confirms the deployment is live.
function doGet() {
  return ok_({ status: "cadence apps script up" });
}

function ok_(data) {
  return ContentService.createTextOutput(JSON.stringify({ data: data })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
function err_(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/* ------------------------------- actions ------------------------------- */
function actionGetPeople_() {
  return readObjects_(PEOPLE)
    .map(toPersonPublic_)
    .sort(function (a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
}

function actionVerifyPin_(body) {
  var pin = String(body.pin == null ? "" : body.pin);
  var rows = readObjects_(PEOPLE);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].pin) === pin) return toPersonPublic_(rows[i]);
  }
  return null;
}

function actionGetTasks_() {
  return readObjects_(TASKS)
    .map(toFlatTask_)
    .sort(function (a, b) {
      return a.position - b.position;
    });
}

function actionSaveTasks_(body) {
  var tasks = body.tasks || [];
  var rows = tasks.map(function (t) {
    return {
      id: t.id,
      level: t.level,
      parentId: t.parentId || "",
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      deadline: t.deadline || "",
      place: t.place || "",
      assignees: JSON.stringify(t.assignees || []),
      position: t.position,
    };
  });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    writeObjects_(TASKS, TASK_COLS, rows, TASK_TEXT_COLS);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function actionGetEntries_(body) {
  var date = String(body.date);
  return readObjects_(ENTRIES)
    .map(toEntryApi_)
    .filter(function (e) {
      return e.date === date;
    })
    .sort(sortByStart_);
}

function actionGetDay_(body) {
  var personId = String(body.personId);
  var date = String(body.date);
  return readObjects_(ENTRIES)
    .filter(function (e) {
      return String(e.personId) === personId && String(e.date) === date;
    })
    .map(toEntryApi_)
    .sort(sortByStart_);
}

function actionGetNote_(body) {
  var personId = String(body.personId);
  var date = String(body.date);
  var rows = readObjects_(NOTES);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].personId) === personId && String(rows[i].date) === date) {
      return { content: String(rows[i].content || "") };
    }
  }
  return { content: "" };
}

function actionSaveNote_(body) {
  var personId = String(body.personId);
  var date = String(body.date);
  var content = String(body.content);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var rows = readObjects_(NOTES);
    var found = false;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].personId) === personId && String(rows[i].date) === date) {
        rows[i].content = content;
        found = true;
        break;
      }
    }
    if (!found) {
      rows.push({ personId: personId, date: date, content: content });
    }
    writeObjects_(NOTES, NOTE_COLS, rows);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

// Replace only the rows this person owns on this date; meetings they merely attend stay put.
function actionSaveDay_(body) {
  var personId = String(body.personId);
  var date = String(body.date);
  var entries = body.entries || [];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var kept = readObjects_(ENTRIES)
      .map(normEntryStore_)
      .filter(function (e) {
        return !(e.personId === personId && e.date === date);
      });
    var fresh = entries.map(function (e) {
      return {
        id: "e" + Utilities.getUuid().slice(0, 8),
        personId: personId,
        taskId: e.taskId,
        note: e.note || "",
        date: date,
        start: e.start,
        durationMins: Number(e.durationMins) || 0,
        place: e.place || "",
        priority: e.priority || "medium",
        attendees: JSON.stringify(e.attendees || []),
      };
    });
    writeObjects_(ENTRIES, ENTRY_COLS, kept.concat(fresh), ENTRY_TEXT_COLS);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/* ------------------------------- mappers ------------------------------- */
function toPersonPublic_(o) {
  return {
    id: String(o.id),
    name: String(o.name),
    role: String(o.role),
    defaultPlace: String(o.defaultPlace),
    tint: Number(o.tint) || 1,
  };
}

function toFlatTask_(o) {
  return {
    id: String(o.id),
    level: Number(o.level) || 1,
    parentId: o.parentId ? String(o.parentId) : null,
    title: String(o.title),
    description: o.description ? String(o.description) : null,
    priority: o.priority ? String(o.priority) : "medium",
    deadline: o.deadline ? asDateStr_(o.deadline) : null,
    place: o.place == null ? "" : String(o.place),
    assignees: parseArr_(o.assignees),
    position: Number(o.position) || 0,
  };
}

// API shape (attendees parsed to an array) — what the Next.js app expects.
function toEntryApi_(o) {
  return {
    id: String(o.id),
    personId: String(o.personId),
    taskId: String(o.taskId),
    note: o.note == null ? "" : String(o.note),
    date: asDateStr_(o.date),
    start: asTimeStr_(o.start),
    durationMins: Number(o.durationMins) || 0,
    place: o.place == null ? "" : String(o.place),
    priority: o.priority ? String(o.priority) : "medium",
    attendees: parseArr_(o.attendees),
  };
}

// Storage shape (attendees kept as a JSON string) — what we write back to cells.
function normEntryStore_(o) {
  return {
    id: String(o.id),
    personId: String(o.personId),
    taskId: String(o.taskId),
    note: o.note == null ? "" : String(o.note),
    date: asDateStr_(o.date),
    start: asTimeStr_(o.start),
    durationMins: Number(o.durationMins) || 0,
    place: o.place == null ? "" : String(o.place),
    priority: o.priority ? String(o.priority) : "medium",
    attendees: typeof o.attendees === "string" ? o.attendees || "[]" : JSON.stringify(o.attendees || []),
  };
}

function sortByStart_(a, b) {
  return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
}

/* ----------------------------- sheet helpers --------------------------- */
function getSheet_(name) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function readObjects_(name) {
  var sh = getSheet_(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.join("") === "") continue; // skip blank rows
    var o = {};
    for (var c = 0; c < headers.length; c++) o[headers[c]] = row[c];
    out.push(o);
  }
  return out;
}

function writeObjects_(name, cols, rows, textCols) {
  var sh = getSheet_(name);
  sh.clearContents();
  var out = [cols];
  for (var i = 0; i < rows.length; i++) {
    var line = [];
    for (var c = 0; c < cols.length; c++) line.push(rows[i][cols[c]]);
    out.push(line);
  }
  var n = out.length;
  // Force text columns BEFORE writing, so "2026-06-09" / "09:00" stay strings.
  (textCols || []).forEach(function (ci) {
    sh.getRange(1, ci, n, 1).setNumberFormat("@");
  });
  sh.getRange(1, 1, n, cols.length).setValues(out);
  sh.setFrozenRows(1);
}

/* ------------------------------ coercion ------------------------------- */
function asDateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return v == null ? "" : String(v);
}
function asTimeStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "HH:mm");
  return v == null ? "" : String(v);
}
function parseArr_(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  var s = String(v).trim();
  if (!s) return [];
  if (s.charAt(0) === "[") {
    try {
      return JSON.parse(s);
    } catch (e) {
      /* fall through */
    }
  }
  return s
    .split(",")
    .map(function (x) {
      return x.trim();
    })
    .filter(String);
}

/* =============================== seeding =============================== */
// Run this ONCE from the Apps Script editor to create + fill the three tabs.
// Idempotent: it overwrites the tabs each run.

function setupAndSeed() {
  writeObjects_(PEOPLE, PEOPLE_COLS, SEED_PEOPLE, []);
  writeObjects_(
    TASKS,
    TASK_COLS,
    SEED_TASKS.map(function (t) {
      return {
        id: t.id,
        level: t.level,
        parentId: t.parentId || "",
        title: t.title,
        description: t.description || "",
        priority: t.priority,
        deadline: t.deadline || "",
        place: t.place,
        assignees: JSON.stringify(t.assignees || []),
        position: t.position,
      };
    }),
    TASK_TEXT_COLS,
  );
  writeObjects_(ENTRIES, ENTRY_COLS, buildSeedEntries_(), ENTRY_TEXT_COLS);
  writeObjects_(NOTES, NOTE_COLS, [], []);
  SpreadsheetApp.getActive().toast("Cadence: tabs created and seeded.");
}

var SEED_PEOPLE = [
  { id: "demo", pin: "0000", name: "Demo User", role: "Guest", defaultPlace: "Main Office", tint: 1 },
  { id: "p1", pin: "1111", name: "Andrew", role: "Engineer", defaultPlace: "Main Office", tint: 1 },
  { id: "p2", pin: "2222", name: "Matsumoto", role: "Manager", defaultPlace: "Sugimoto", tint: 2 },
  { id: "p3", pin: "3333", name: "Inaba", role: "Manager", defaultPlace: "Izumi", tint: 3 },
  { id: "p4", pin: "4444", name: "Nate", role: "Manager", defaultPlace: "Main Office", tint: 4 },
  { id: "p5", pin: "5555", name: "Prakhar", role: "Manager", defaultPlace: "Remote", tint: 5 },
  { id: "p6", pin: "6666", name: "Nishinaga", role: "Manager", defaultPlace: "Main Office", tint: 1 },
  { id: "p7", pin: "7777", name: "Kevin", role: "Engineer", defaultPlace: "Main Office", tint: 2 },
  { id: "p8", pin: "8888", name: "Martin", role: "Engineer", defaultPlace: "Izumi", tint: 3 },
  { id: "p9", pin: "9999", name: "Ambrose", role: "Engineer", defaultPlace: "Ogasawara Site", tint: 4 },
];

var SEED_TASKS = [
  // level 1 — initiatives
  { id: "t1", level: 1, parentId: null, title: "Ogasawara Project", priority: "high", place: "Ogasawara Site", deadline: "2026-06-30", description: "Build-out of the new Ogasawara site.", assignees: ["p1", "p9", "p5"], position: 0 },
  { id: "t2", level: 1, parentId: null, title: "June Product Launch", priority: "high", place: "Main Office", deadline: "2026-06-15", description: "Ship the v1 dashboard and launch comms.", assignees: ["p2", "p4", "p6"], position: 1 },
  { id: "t3", level: 1, parentId: null, title: "Office Operations", priority: "medium", place: "Main Office", deadline: "", description: "Keep the offices and vendors running smoothly.", assignees: ["p3", "p7"], position: 2 },
  { id: "t4", level: 1, parentId: null, title: "Customer Success", priority: "medium", place: "Main Office", deadline: "", description: "Onboarding and ongoing support for accounts.", assignees: ["p2", "p8"], position: 3 },
  // level 2 — workstreams
  { id: "t11", level: 2, parentId: "t1", title: "Site Construction", priority: "high", place: "Ogasawara Site", deadline: "", description: "", assignees: ["p1", "p9"], position: 0 },
  { id: "t12", level: 2, parentId: "t1", title: "Permits & Documentation", priority: "medium", place: "Izumi", deadline: "", description: "", assignees: ["p3"], position: 1 },
  { id: "t13", level: 2, parentId: "t1", title: "Equipment & Logistics", priority: "medium", place: "Sugimoto", deadline: "", description: "", assignees: ["p5", "p9"], position: 2 },
  { id: "t21", level: 2, parentId: "t2", title: "Dashboard Build", priority: "high", place: "Main Office", deadline: "", description: "", assignees: ["p2", "p6", "p7"], position: 3 },
  { id: "t22", level: 2, parentId: "t2", title: "Data Migration", priority: "high", place: "Main Office", deadline: "", description: "", assignees: ["p6", "p8"], position: 4 },
  { id: "t23", level: 2, parentId: "t2", title: "Launch Marketing", priority: "medium", place: "Main Office", deadline: "", description: "", assignees: ["p4", "p8"], position: 5 },
  { id: "t31", level: 2, parentId: "t3", title: "Facilities", priority: "low", place: "Main Office", deadline: "", description: "", assignees: ["p3"], position: 6 },
  { id: "t32", level: 2, parentId: "t3", title: "Vendor Coordination", priority: "medium", place: "Main Office", deadline: "", description: "", assignees: ["p3", "p7"], position: 7 },
  { id: "t41", level: 2, parentId: "t4", title: "Onboarding", priority: "medium", place: "Main Office", deadline: "", description: "", assignees: ["p2"], position: 8 },
  { id: "t42", level: 2, parentId: "t4", title: "Support Playbook", priority: "low", place: "Remote", deadline: "", description: "", assignees: ["p8"], position: 9 },
];

function buildSeedEntries_() {
  var DURS = [30, 60, 60, 90, 120, 120, 180, 240];
  var GAPS = [0, 15, 30, 30, 45, 60, 90];
  var PRIOS = ["high", "medium", "low"];
  var PLACES = ["Main Office", "Izumi", "Sugimoto", "Remote", "Ogasawara Site"];
  var NOTES = [
    "Review and align on scope", "Draft the plan for the week", "Sync with the wider team",
    "Site walkthrough and checklist", "Prepare the status report", "Clear outstanding issues",
    "Client call and follow-ups", "Polish the remaining details", "Pair on the tricky parts",
    "Write up notes and next steps", "Inspect deliveries on site", "Refine designs from feedback",
  ];
  var wsIds = SEED_TASKS.filter(function (t) {
    return t.level === 2;
  }).map(function (t) {
    return t.id;
  });

  var today = new Date();
  var dates = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(ymd_(d));
  }
  var todayStr = dates[0];
  var rows = [];
  var n = 0;

  dates.forEach(function (date) {
    var isToday = date === todayStr;
    SEED_PEOPLE.forEach(function (person) {
      if (person.id !== "demo" && Math.random() < 0.2) return; // occasional day off
      var lateWorker = Math.random() < 0.3;
      var dayEnd = lateWorker ? pick_([20 * 60, 22 * 60, 24 * 60]) : 18 * 60;
      var maxBlocks = person.id === "demo" ? 5 : 4;
      var cursor = 9 * 60 + pick_([0, 30, 60]);
      for (var k = 0; k < maxBlocks; k++) {
        var meeting = isToday && k === 0 && (person.id === "demo" || person.id === "p1");
        var dur = meeting ? 60 : pick_(DURS);
        if (cursor + dur > dayEnd) break;
        rows.push({
          id: "e" + ++n,
          personId: person.id,
          taskId: meeting ? (person.id === "demo" ? "t21" : "t11") : pick_(wsIds),
          note: meeting
            ? person.id === "demo"
              ? "Launch standup with the build team"
              : "Ogasawara site sync"
            : Math.random() < 0.7
              ? pick_(NOTES)
              : "",
          date: date,
          start: hhmm_(cursor),
          durationMins: dur,
          place: meeting || Math.random() < 0.6 ? person.defaultPlace : pick_(PLACES),
          priority: meeting ? "high" : pick_(PRIOS),
          attendees: JSON.stringify(
            meeting ? (person.id === "demo" ? ["demo", "p2", "p6", "p7"] : ["p1", "p3", "p9", "demo"]) : [],
          ),
        });
        cursor += dur + pick_(GAPS);
        if (cursor >= dayEnd) break;
      }
    });
  });
  return rows;
}

function ymd_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
function hhmm_(min) {
  var h = Math.floor(min / 60);
  var m = min % 60;
  return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
}
function pick_(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
