import type { Entry, Priority } from "./types";

type DbEntry = {
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
};

/** Map a Prisma entry row to the app's Entry shape. */
export const toEntry = (e: DbEntry): Entry => ({
  id: e.id,
  personId: e.personId,
  taskId: e.taskId,
  note: e.note ?? undefined,
  date: e.date,
  start: e.start,
  durationMins: e.durationMins,
  place: e.place,
  priority: e.priority as Priority,
  attendees: e.attendees,
});
