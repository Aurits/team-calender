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
 *   3. Run setupAndSeed() once (authorize when prompted) to format + fill the tabs.
 *   4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *   5. Put the /exec URL and the same secret in the Next.js .env (SHEETS_WEBAPP_URL, SHEETS_SHARED_SECRET).
 *
 * After editing this file later: Save → re-run setupAndSeed() (or formatAllSheets_)
 * → Deploy → Manage deployments → New version, so the live web app picks up changes.
 */

/* ------------------------------- config -------------------------------- */
var PEOPLE = "People";
var TASKS = "Tasks";
var ENTRIES = "Entries";

var PEOPLE_COLS = ["id", "pin", "name", "role", "defaultPlace", "tint"];
var TASK_COLS = ["id", "level", "parentId", "title", "description", "priority", "deadline", "place", "assignees", "position"];
var ENTRY_COLS = ["id", "personId", "taskId", "note", "date", "start", "durationMins", "place", "priority", "attendees"];

// Per-tab presentation. `mono`/`text`/etc. are 1-based column indices.
// `text` columns are forced to plain-text format so "0000" (pin) keeps its
// leading zeros and "2026-06-30" / "09:00" never become Dates.
var STYLE = {};
STYLE[PEOPLE] = {
  widths: [78, 70, 168, 132, 150, 64],
  align: ["center", "center", "left", "left", "left", "center"],
  mono: [1, 2, 6],
  text: [1, 2], // id, pin
  tab: "#6366F1",
};
STYLE[TASKS] = {
  widths: [72, 60, 86, 230, 300, 100, 110, 140, 196, 84],
  align: ["center", "center", "center", "left", "left", "center", "center", "left", "left", "center"],
  mono: [1, 2, 3, 7, 10],
  text: [1, 3, 7], // id, parentId, deadline
  priorityCol: 6,
  levelCol: 2,
  titleCol: 4,
  tab: "#0EA5A4",
};
STYLE[ENTRIES] = {
  widths: [104, 88, 74, 300, 108, 74, 104, 140, 100, 200],
  align: ["center", "center", "center", "left", "center", "center", "center", "left", "center", "left"],
  mono: [1, 2, 3, 5, 6, 7],
  text: [1, 2, 3, 5, 6], // id, personId, taskId, date, start
  priorityCol: 9,
  tab: "#F59E0B",
};

// Palette (kept in sync with the app's priority colors).
var INK = "#23272F";
var HEADER_BG = "#1F2430";
var HEADER_FG = "#FFFFFF";
var ZEBRA = "#F6F7F9";
var FONT_BODY = "Roboto";
var FONT_HEAD = "Montserrat";
var FONT_MONO = "Roboto Mono";
var PRIO = {
  high: { bg: "#FCE9E7", fg: "#B42318" },
  medium: { bg: "#FCEFD2", fg: "#8A5A00" },
  low: { bg: "#EDEFF2", fg: "#5B6470" },
};
var L1_HILITE = { bg: "#ECEEFF", fg: "#3730A3" };

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
    writeObjects_(TASKS, TASK_COLS, rows);
    rebuildOverview_();
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
    .map(toEntryApi_)
    .filter(function (e) {
      return e.personId === personId && e.date === date;
    })
    .sort(sortByStart_);
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
    writeObjects_(ENTRIES, ENTRY_COLS, kept.concat(fresh));
    rebuildOverview_();
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

/**
 * Overwrite-then-trim: write the new header+rows in place, then clear any
 * leftover rows below. The sheet is never momentarily emptied, so a concurrent
 * read can only ever see the old full data or the new full data. Cell/column
 * formatting and conditional rules (applied once by styleSheet_) persist.
 */
function writeObjects_(name, cols, rows) {
  var sh = getSheet_(name);
  var prevLast = sh.getLastRow();
  var out = [cols];
  for (var i = 0; i < rows.length; i++) {
    var line = [];
    for (var c = 0; c < cols.length; c++) line.push(rows[i][cols[c]]);
    out.push(line);
  }
  var n = out.length;
  sh.getRange(1, 1, n, cols.length).setValues(out);
  if (prevLast > n) sh.getRange(n + 1, 1, prevLast - n, cols.length).clearContent();
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

/* ============================== formatting ============================= */
// Run formatAllSheets_ any time to (re)apply the look without touching data.
// setupAndSeed formats first (so text columns exist before values are written),
// then fills the tabs.

function formatAllSheets_() {
  styleSheet_(PEOPLE, PEOPLE_COLS);
  styleSheet_(TASKS, TASK_COLS);
  styleSheet_(ENTRIES, ENTRY_COLS);
}

function styleSheet_(name, cols) {
  var sh = getSheet_(name);
  var spec = STYLE[name];
  var nCols = cols.length;
  var maxRows = sh.getMaxRows();
  var dataRows = maxRows - 1;

  sh.setHiddenGridlines(true);
  if (spec.tab) sh.setTabColor(spec.tab);

  // Base look for the whole grid.
  sh.getRange(1, 1, maxRows, nCols)
    .setFontFamily(FONT_BODY)
    .setFontSize(10)
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  // Per-column: width, alignment, monospace, plain-text format.
  for (var c = 1; c <= nCols; c++) {
    sh.setColumnWidth(c, spec.widths[c - 1]);
    sh.getRange(1, c, maxRows, 1).setHorizontalAlignment(spec.align[c - 1]);
  }
  (spec.mono || []).forEach(function (c) {
    sh.getRange(1, c, maxRows, 1).setFontFamily(FONT_MONO);
  });
  (spec.text || []).forEach(function (c) {
    sh.getRange(1, c, maxRows, 1).setNumberFormat("@");
  });

  // Header band.
  var header = sh.getRange(1, 1, 1, nCols);
  header
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG)
    .setFontFamily(FONT_HEAD)
    .setFontWeight("bold")
    .setFontSize(10)
    .setVerticalAlignment("middle");
  header.setBorder(null, null, true, null, null, null, "#0F1117", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.setRowHeight(1, 36);
  if (dataRows > 0) sh.setRowHeights(2, dataRows, 28);
  sh.setFrozenRows(1);

  // Conditional formatting — range-based, so it survives every data write.
  var rules = [];
  var all = sh.getRange(2, 1, dataRows, nCols);

  if (spec.priorityCol) {
    var pcol = sh.getRange(2, spec.priorityCol, dataRows, 1);
    ["high", "medium", "low"].forEach(function (key) {
      rules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(key)
          .setBackground(PRIO[key].bg)
          .setFontColor(PRIO[key].fg)
          .setBold(true)
          .setRanges([pcol])
          .build(),
      );
    });
  }

  if (spec.levelCol && spec.titleCol) {
    // Make initiative (level 1) titles stand out from workstreams.
    var titleCol = sh.getRange(2, spec.titleCol, dataRows, 1);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied("=$B2=1")
        .setBackground(L1_HILITE.bg)
        .setFontColor(L1_HILITE.fg)
        .setBold(true)
        .setRanges([titleCol])
        .build(),
    );
  }

  // Zebra striping (only on populated rows) — listed last so the colored
  // priority / initiative cells win over it.
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(ISEVEN(ROW()),$A2<>"")')
      .setBackground(ZEBRA)
      .setRanges([all])
      .build(),
  );

  sh.setConditionalFormatRules(rules);
}

/* ============================== overview ============================== */
// A human-friendly daily snapshot (names & titles, no ids) rebuilt after every
// write. Presentation only — the app never reads this tab. Repurposes the default
// "Sheet1" and pins it as the first tab.

var OVERVIEW = "Overview";

function overviewSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(OVERVIEW);
  if (!sh) {
    var s1 = ss.getSheetByName("Sheet1");
    if (s1 && s1.getLastRow() === 0) {
      s1.setName(OVERVIEW); // reuse the empty default sheet
      sh = s1;
    } else {
      sh = ss.insertSheet(OVERVIEW);
    }
  }
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1); // keep it leftmost — the first thing people see
  return sh;
}

function personMap_() {
  var m = {};
  readObjects_(PEOPLE).forEach(function (o) {
    m[String(o.id)] = { name: String(o.name), role: String(o.role) };
  });
  return m;
}

// id → "Initiative › Workstream" (or just the title), matching the app's labels.
function taskLabelMap_() {
  var by = {};
  readObjects_(TASKS).forEach(function (o) {
    by[String(o.id)] = { title: String(o.title), parentId: o.parentId ? String(o.parentId) : null };
  });
  var label = {};
  Object.keys(by).forEach(function (id) {
    var t = by[id];
    label[id] = t.parentId && by[t.parentId] ? by[t.parentId].title + " › " + t.title : t.title;
  });
  return label;
}

// Rich-text note (HTML) → clean plain text. `struck` is true when the whole note
// is wrapped in a strike tag, so the overview can show a real strikethrough cell.
function cleanNote_(html) {
  if (!html) return { text: "", struck: false };
  var s = String(html).trim();
  var struck = /^<(strike|s|del)>[\s\S]*<\/(strike|s|del)>$/i.test(s);
  s = s.replace(/<li[^>]*>/gi, "• ").replace(/<\/(div|p|li)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
  s = s.replace(/\n{2,}/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  return { text: s, struck: struck };
}

function endTime_(start, dur) {
  var p = String(start).split(":");
  var m = (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0) + (Number(dur) || 0);
  m = ((m % 1440) + 1440) % 1440;
  var h = Math.floor(m / 60), mm = m % 60;
  return (h < 10 ? "0" + h : "" + h) + ":" + (mm < 10 ? "0" + mm : "" + mm);
}

function fmtLongDate_(ymd) {
  var p = String(ymd).split("-");
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "EEEE, d MMMM yyyy");
}

function cap_(s) {
  s = String(s || "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rebuildOverview_() {
  var sh = overviewSheet_();
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.setConditionalFormatRules([]);
  sh.setHiddenGridlines(true);
  sh.setTabColor("#111827");

  var W = [120, 152, 244, 140, 96, 340];
  for (var c = 0; c < W.length; c++) sh.setColumnWidth(c + 1, W[c]);

  var people = personMap_();
  var label = taskLabelMap_();
  var today = ymd_(new Date());
  var nm = function (id) {
    return (people[id] && people[id].name) || id;
  };

  var entries = readObjects_(ENTRIES)
    .map(toEntryApi_)
    .filter(function (e) {
      return e.date === today;
    });
  entries.sort(function (a, b) {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return nm(a.personId) < nm(b.personId) ? -1 : 1;
  });

  var present = {};
  entries.forEach(function (e) {
    present[e.personId] = 1;
    (e.attendees || []).forEach(function (id) {
      present[id] = 1;
    });
  });
  var nHigh = entries.filter(function (e) {
    return e.priority === "high";
  }).length;
  var nMeet = entries.filter(function (e) {
    return (e.attendees || []).length > 1;
  }).length;

  var rows = [];
  var merges = [];
  var prio = {};
  var struck = [];
  var entryFirst = 0, entryLast = 0;
  function push(a) {
    rows.push(a);
    return rows.length;
  }
  function full(r) {
    merges.push({ row: r, from: 1, len: 6 });
  }

  var rHero = push(["Cadence · Daily Overview", "", "", "", "", ""]); full(rHero);
  var rSub = push([
    fmtLongDate_(today) + "    ·    Updated " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm"),
    "", "", "", "", "",
  ]); full(rSub);
  push(["", "", "", "", "", ""]);
  var rStat = push([
    "👥  " + Object.keys(present).length + " people scheduled        🗓  " + entries.length +
      " blocks        🔴  " + nHigh + " high priority        🤝  " + nMeet + " meetings",
    "", "", "", "", "",
  ]); full(rStat);
  push(["", "", "", "", "", ""]);
  var rSec1 = push(["Today’s schedule", "", "", "", "", ""]); full(rSec1);
  var rHead = push(["Time", "Person", "Task", "Place", "Priority", "Details"]);

  if (!entries.length) {
    var rE = push(["No plans recorded for today yet.", "", "", "", "", ""]); full(rE);
  } else {
    entries.forEach(function (e) {
      var note = cleanNote_(e.note);
      var details = note.text;
      if ((e.attendees || []).length > 1) {
        details = "🤝 Meeting · with " + (e.attendees || []).map(nm).join(", ") + (note.text ? "  —  " + note.text : "");
      }
      var r = push([
        e.start + "–" + endTime_(e.start, e.durationMins),
        nm(e.personId),
        label[e.taskId] || e.taskId,
        e.place,
        cap_(e.priority),
        details,
      ]);
      if (!entryFirst) entryFirst = r;
      entryLast = r;
      prio[r] = e.priority;
      if (note.struck) struck.push(r);
    });
  }

  push(["", "", "", "", "", ""]);
  var rSec2 = push(["Where people are today", "", "", "", "", ""]); full(rSec2);
  var byPlace = {};
  entries.forEach(function (e) {
    var p = e.place || "—";
    byPlace[p] = byPlace[p] || {};
    byPlace[p][nm(e.personId)] = 1;
  });
  var places = Object.keys(byPlace).sort();
  var placeRows = [];
  if (!places.length) {
    var rNp = push(["—", "", "", "", "", ""]); full(rNp);
  } else {
    places.forEach(function (p) {
      var r = push([p, Object.keys(byPlace[p]).sort().join(", "), "", "", "", ""]);
      merges.push({ row: r, from: 2, len: 5 });
      placeRows.push(r);
    });
  }

  /* ---- write values, then format ---- */
  sh.getRange(1, 1, rows.length, 6).setValues(rows);
  sh.getRange(1, 1, rows.length, 6)
    .setFontFamily(FONT_BODY)
    .setFontSize(10)
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  merges.forEach(function (m) {
    sh.getRange(m.row, m.from, 1, m.len).merge();
  });

  sh.getRange(rHero, 1, 1, 6)
    .setBackground(HEADER_BG).setFontColor("#FFFFFF").setFontFamily(FONT_HEAD)
    .setFontWeight("bold").setFontSize(16).setHorizontalAlignment("center");
  sh.setRowHeight(rHero, 48);
  sh.getRange(rSub, 1, 1, 6).setFontColor("#5B6470").setHorizontalAlignment("center");
  sh.getRange(rStat, 1, 1, 6).setFontSize(11).setHorizontalAlignment("center");
  sh.setRowHeight(rStat, 28);

  [rSec1, rSec2].forEach(function (r) {
    sh.getRange(r, 1, 1, 6).setFontFamily(FONT_HEAD).setFontWeight("bold").setFontSize(12);
    sh.setRowHeight(r, 30);
  });

  sh.getRange(rHead, 1, 1, 6)
    .setBackground(HEADER_BG).setFontColor("#FFFFFF").setFontFamily(FONT_HEAD)
    .setFontWeight("bold").setFontSize(10);
  sh.setRowHeight(rHead, 28);

  if (entryFirst) {
    var count = entryLast - entryFirst + 1;
    sh.getRange(entryFirst, 1, count, 1).setFontFamily(FONT_MONO).setHorizontalAlignment("center"); // Time
    sh.getRange(entryFirst, 5, count, 1).setHorizontalAlignment("center"); // Priority
    sh.getRange(entryFirst, 6, count, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); // Details
    var bg = [], fg = [], fw = [];
    for (var i = entryFirst; i <= entryLast; i++) {
      var col = PRIO[prio[i]] || { bg: "#FFFFFF", fg: INK };
      bg.push([col.bg]);
      fg.push([col.fg]);
      fw.push(["bold"]);
    }
    sh.getRange(entryFirst, 5, count, 1).setBackgrounds(bg).setFontColors(fg).setFontWeights(fw);
  }
  struck.forEach(function (r) {
    sh.getRange(r, 6).setFontLine("line-through");
  });
  placeRows.forEach(function (r) {
    sh.getRange(r, 1).setFontWeight("bold");
    sh.getRange(r, 2).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  });

  sh.setFrozenRows(0);
}

/* =============================== seeding =============================== */
// Run this ONCE from the Apps Script editor to format + fill the three tabs.
// Idempotent: it overwrites the tabs each run.

function setupAndSeed() {
  formatAllSheets_(); // sets text columns BEFORE values, so "0000" / dates stay text
  writeObjects_(PEOPLE, PEOPLE_COLS, SEED_PEOPLE);
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
  );
  writeObjects_(ENTRIES, ENTRY_COLS, buildSeedEntries_());
  rebuildOverview_();
  SpreadsheetApp.getActive().toast("Cadence: tabs formatted, seeded, and overview built.");
}

var SEED_PEOPLE = [
  { id: "demo", pin: "0000", name: "Demo User", role: "Guest", defaultPlace: "Main Office", tint: 1 },
  { id: "p1", pin: "4821", name: "Andrew", role: "Engineer", defaultPlace: "Main Office", tint: 1 },
  { id: "p2", pin: "2470", name: "Matsumoto", role: "Manager", defaultPlace: "Sugimoto", tint: 2 },
  { id: "p3", pin: "1009", name: "Inaba", role: "Manager", defaultPlace: "Izumi", tint: 3 },
  { id: "p4", pin: "3388", name: "Nate", role: "Manager", defaultPlace: "Main Office", tint: 4 },
  { id: "p5", pin: "7777", name: "Prakhar", role: "Manager", defaultPlace: "Remote", tint: 5 },
  { id: "p6", pin: "1111", name: "Nishinaga", role: "Manager", defaultPlace: "Main Office", tint: 1 },
  { id: "p7", pin: "2222", name: "Kevin", role: "Engineer", defaultPlace: "Main Office", tint: 2 },
  { id: "p8", pin: "3333", name: "Martin", role: "Engineer", defaultPlace: "Izumi", tint: 3 },
  { id: "p9", pin: "4444", name: "Ambrose", role: "Engineer", defaultPlace: "Ogasawara Site", tint: 4 },
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
