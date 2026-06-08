/**
 * Cadence database seeder.
 * Run with:  npm run db:seed   (which calls `tsx prisma/seeder.ts`)
 *
 * Idempotent: clears the three tables, then loads people, the task tree, and a
 * week of entries across the team — the Demo user included every day.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ------------------------------- helpers ------------------------------- */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

/* ------------------------------- people -------------------------------- */
const people = [
  { id: "demo", pin: "0000", name: "Demo User", role: "Guest", defaultPlace: "Main Office", tint: 1 },
  { id: "p1", pin: "4821", name: "Andrew", role: "Engineer", defaultPlace: "Main Office", tint: 1 },
  { id: "p2", pin: "2470", name: "Matsumoto", role: "Manager", defaultPlace: "Sugimoto", tint: 2 },
  { id: "p3", pin: "1009", name: "Inaba", role: "Developer", defaultPlace: "Izumi", tint: 3 },
  { id: "p4", pin: "3388", name: "Nate", role: "Designer", defaultPlace: "Main Office", tint: 4 },
  { id: "p5", pin: "7777", name: "Prakhar", role: "Engineer", defaultPlace: "Remote", tint: 5 },
  { id: "p6", pin: "1111", name: "Nishinaga", role: "Developer", defaultPlace: "Main Office", tint: 1 },
  { id: "p7", pin: "2222", name: "Kevin", role: "Engineer", defaultPlace: "Main Office", tint: 2 },
  { id: "p8", pin: "3333", name: "Martin", role: "Analyst", defaultPlace: "Izumi", tint: 3 },
  { id: "p9", pin: "4444", name: "Ambrose", role: "Developer", defaultPlace: "Ogasawara Site", tint: 4 },
];

/* ------------------------------- tasks --------------------------------- */
// level 1 = initiative, level 2 = workstream (parentId set)
const initiatives = [
  { id: "t1", title: "Ogasawara Project", priority: "high", place: "Ogasawara Site", deadline: "2026-06-30", description: "Build-out of the new Ogasawara site.", assignees: ["p1", "p9", "p5"] },
  { id: "t2", title: "June Product Launch", priority: "high", place: "Main Office", deadline: "2026-06-15", description: "Ship the v1 dashboard and launch comms.", assignees: ["p2", "p4", "p6"] },
  { id: "t3", title: "Office Operations", priority: "medium", place: "Main Office", deadline: null as string | null, description: "Keep the offices and vendors running smoothly.", assignees: ["p3", "p7"] },
  { id: "t4", title: "Customer Success", priority: "medium", place: "Main Office", deadline: null as string | null, description: "Onboarding and ongoing support for accounts.", assignees: ["p2", "p8"] },
];
const workstreams = [
  { id: "t11", parentId: "t1", title: "Site Construction", priority: "high", place: "Ogasawara Site", assignees: ["p1", "p9"] },
  { id: "t12", parentId: "t1", title: "Permits & Documentation", priority: "medium", place: "Izumi", assignees: ["p3"] },
  { id: "t13", parentId: "t1", title: "Equipment & Logistics", priority: "medium", place: "Sugimoto", assignees: ["p5", "p9"] },
  { id: "t21", parentId: "t2", title: "Dashboard Build", priority: "high", place: "Main Office", assignees: ["p2", "p6", "p7"] },
  { id: "t22", parentId: "t2", title: "Data Migration", priority: "high", place: "Main Office", assignees: ["p6", "p8"] },
  { id: "t23", parentId: "t2", title: "Launch Marketing", priority: "medium", place: "Main Office", assignees: ["p4", "p8"] },
  { id: "t31", parentId: "t3", title: "Facilities", priority: "low", place: "Main Office", assignees: ["p3"] },
  { id: "t32", parentId: "t3", title: "Vendor Coordination", priority: "medium", place: "Main Office", assignees: ["p3", "p7"] },
  { id: "t41", parentId: "t4", title: "Onboarding", priority: "medium", place: "Main Office", assignees: ["p2"] },
  { id: "t42", parentId: "t4", title: "Support Playbook", priority: "low", place: "Remote", assignees: ["p8"] },
];

/* ------------------------------ entries -------------------------------- */
const PLACES = ["Main Office", "Izumi", "Sugimoto", "Remote", "Ogasawara Site"];
const STARTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];
const DURS = [30, 60, 60, 90, 120];
const PRIOS = ["high", "medium", "low"];
const NOTES = [
  "Review and align on scope",
  "Draft the plan for the week",
  "Sync with the wider team",
  "Site walkthrough and checklist",
  "Prepare the status report",
  "Clear outstanding issues",
  "Client call and follow-ups",
  "Polish the remaining details",
  "Pair on the tricky parts",
  "Write up notes and next steps",
  "Inspect deliveries on site",
  "Refine designs from feedback",
];

const wsIds = workstreams.map((w) => w.id);

function buildEntries() {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return ymd(d);
  });

  const entries: {
    id: string;
    personId: string;
    taskId: string;
    note: string | null;
    date: string;
    start: string;
    durationMins: number;
    place: string;
    priority: string;
    attendees: string[];
  }[] = [];
  let n = 0;

  for (const date of dates) {
    for (const person of people) {
      // Demo always gets a day; others occasionally take a day off.
      if (person.id !== "demo" && chance(0.2)) continue;
      const count = person.id === "demo" ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 3);
      const used = new Set<string>();
      for (let k = 0; k < count; k++) {
        let start = pick(STARTS);
        // try to avoid exact duplicate start times for the same person/day
        let guard = 0;
        while (used.has(start) && guard++ < 5) start = pick(STARTS);
        used.add(start);
        entries.push({
          id: `e${++n}`,
          personId: person.id,
          taskId: pick(wsIds),
          note: chance(0.7) ? pick(NOTES) : null,
          date,
          start,
          durationMins: pick(DURS),
          place: chance(0.6) ? person.defaultPlace : pick(PLACES),
          priority: pick(PRIOS),
          attendees: [],
        });
      }
    }
  }

  // A couple of meetings on today's date (Demo included).
  const todayStr = dates[0];
  entries.push({
    id: `e${++n}`,
    personId: "demo",
    taskId: "t21",
    note: "Launch standup with the build team",
    date: todayStr,
    start: "11:00",
    durationMins: 60,
    place: "Main Office",
    priority: "high",
    attendees: ["demo", "p2", "p6", "p7"],
  });
  entries.push({
    id: `e${++n}`,
    personId: "p1",
    taskId: "t11",
    note: "Ogasawara site sync",
    date: todayStr,
    start: "15:00",
    durationMins: 60,
    place: "Ogasawara Site",
    priority: "high",
    attendees: ["p1", "p3", "p9", "demo"],
  });

  return entries;
}

/* -------------------------------- run ---------------------------------- */
async function main() {
  console.log("Clearing existing data…");
  await prisma.entry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.person.deleteMany();

  console.log(`Inserting ${people.length} people…`);
  await prisma.person.createMany({ data: people });

  console.log(`Inserting ${initiatives.length} initiatives…`);
  await prisma.task.createMany({
    data: initiatives.map((t, i) => ({
      id: t.id,
      level: 1,
      parentId: null,
      title: t.title,
      description: t.description ?? null,
      priority: t.priority,
      deadline: t.deadline ?? null,
      place: t.place,
      assignees: t.assignees,
      position: i,
    })),
  });

  console.log(`Inserting ${workstreams.length} workstreams…`);
  await prisma.task.createMany({
    data: workstreams.map((t, i) => ({
      id: t.id,
      level: 2,
      parentId: t.parentId,
      title: t.title,
      description: null,
      priority: t.priority,
      place: t.place,
      assignees: t.assignees,
      position: i,
    })),
  });

  const entries = buildEntries();
  console.log(`Inserting ${entries.length} entries…`);
  await prisma.entry.createMany({ data: entries });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
