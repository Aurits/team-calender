import { prisma } from "@/lib/prisma";
import { toEntry } from "@/lib/serialize";
import type { Entry, Priority } from "@/lib/types";
import type { Initiative } from "@/lib/tasks";
import { buildTree, flattenTree, type Backend, type FlatTask, type PersonPublic } from "./backend";

const PUBLIC = { id: true, name: true, role: true, defaultPlace: true, tint: true } as const;

type DbTask = {
  id: string;
  level: number;
  parentId: string | null;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  place: string;
  assignees: string[];
  position: number;
};

const toFlat = (t: DbTask): FlatTask => ({
  id: t.id,
  level: t.level,
  parentId: t.parentId,
  title: t.title,
  description: t.description,
  priority: t.priority as Priority,
  deadline: t.deadline,
  place: t.place,
  assignees: t.assignees,
  position: t.position,
});

/** Postgres backend (the original implementation, behind the Backend interface). */
export const prismaBackend: Backend = {
  name: "postgres",

  async getPeople(): Promise<PersonPublic[]> {
    return prisma.person.findMany({ orderBy: { name: "asc" }, select: PUBLIC });
  },

  async verifyPin(pin: string): Promise<PersonPublic | null> {
    return prisma.person.findUnique({ where: { pin }, select: PUBLIC });
  },

  async updatePin(personId: string, newPin: string): Promise<void> {
    await prisma.person.update({ where: { id: personId }, data: { pin: newPin } });
  },

  async getTasks(): Promise<Initiative[]> {
    const tasks = (await prisma.task.findMany({ orderBy: { position: "asc" } })) as DbTask[];
    return buildTree(tasks.map(toFlat));
  },

  async saveTasks(tree: Initiative[]): Promise<void> {
    // Upsert every node (IDs preserved so entries keep their task links), prune the rest.
    const flat = flattenTree(tree);
    const keep = flat.map((f) => f.id);
    await prisma.$transaction([
      ...flat.map((f) => prisma.task.upsert({ where: { id: f.id }, create: f, update: f })),
      prisma.task.deleteMany({ where: { id: { notIn: keep } } }),
    ]);
  },

  async getEntries(date: string): Promise<Entry[]> {
    const entries = await prisma.entry.findMany({ where: { date }, orderBy: { start: "asc" } });
    return entries.map(toEntry);
  },

  async getDay(personId: string, date: string): Promise<Entry[]> {
    const entries = await prisma.entry.findMany({ where: { personId, date }, orderBy: { start: "asc" } });
    return entries.map(toEntry);
  },

  async saveDay(personId: string, date: string, entries: Entry[]): Promise<void> {
    // Replace only the rows this person owns on this date; meetings they merely attend stay put.
    await prisma.$transaction([
      prisma.entry.deleteMany({ where: { personId, date } }),
      prisma.entry.createMany({
        data: entries.map((e) => ({
          personId,
          taskId: e.taskId,
          note: e.note ?? null,
          date,
          start: e.start,
          durationMins: e.durationMins,
          place: e.place,
          priority: e.priority,
          attendees: e.attendees ?? [],
        })),
      }),
    ]);
  },

  async getNote(personId: string, date: string): Promise<string> {
    const note = await prisma.note.findUnique({
      where: { personId_date: { personId, date } },
    });
    return note?.content ?? "";
  },

  async saveNote(personId: string, date: string, content: string): Promise<void> {
    await prisma.note.upsert({
      where: { personId_date: { personId, date } },
      update: { content },
      create: { personId, date, content },
    });
  },
};
