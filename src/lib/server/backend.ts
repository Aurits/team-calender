import type { Entry, Priority } from "@/lib/types";
import type { Initiative, TaskNode } from "@/lib/tasks";

/** A person without their PIN — the only shape we ever send to the client. */
export interface PersonPublic {
  id: string;
  name: string;
  role: string;
  defaultPlace: string;
  tint: number;
  /** True once the person has personalized their PIN — used to stop re-prompting them. */
  pinChanged: boolean;
}

/**
 * The server-side storage boundary. Every API route depends only on this, so
 * the backend is a one-env-var swap (Postgres ⇄ Google Sheets via Apps Script).
 */
export interface Backend {
  /** Which storage this is — surfaced by /api/health so you can confirm what's live. */
  readonly name: "postgres" | "sheets";
  getPeople(): Promise<PersonPublic[]>;
  verifyPin(pin: string): Promise<PersonPublic | null>;
  updatePin(personId: string, newPin: string): Promise<void>;
  getTasks(): Promise<Initiative[]>;
  saveTasks(tree: Initiative[]): Promise<void>;
  getEntries(date: string): Promise<Entry[]>;
  getDay(personId: string, date: string): Promise<Entry[]>;
  saveDay(personId: string, date: string, entries: Entry[]): Promise<void>;
  getNote(personId: string, date: string): Promise<string>;
  saveNote(personId: string, date: string, content: string): Promise<void>;
}

/** A task flattened to a single row — the neutral shape both backends store. */
export interface FlatTask {
  id: string;
  level: number; // 1 = initiative, 2 = workstream
  parentId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  deadline: string | null;
  place: string;
  assignees: string[];
  position: number;
}

/** Initiative tree → flat rows (level 1 then its level-2 children), with order baked into `position`. */
export function flattenTree(tree: Initiative[]): FlatTask[] {
  const flat: FlatTask[] = [];
  tree.forEach((init, i) => {
    flat.push({
      id: init.id,
      level: 1,
      parentId: null,
      title: init.title,
      description: init.description ?? null,
      priority: init.priority,
      deadline: init.deadline ?? null,
      place: init.place,
      assignees: init.assignees ?? [],
      position: i,
    });
    (init.children ?? []).forEach((c, j) => {
      flat.push({
        id: c.id,
        level: 2,
        parentId: init.id,
        title: c.title,
        description: c.description ?? null,
        priority: c.priority,
        deadline: c.deadline ?? null,
        place: c.place,
        assignees: c.assignees ?? [],
        position: j,
      });
    });
  });
  return flat;
}

/** Flat rows → initiative tree, ordered by `position`. */
export function buildTree(flat: FlatTask[]): Initiative[] {
  const sorted = [...flat].sort((a, b) => a.position - b.position);
  const toNode = (t: FlatTask): TaskNode => ({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    priority: t.priority,
    deadline: t.deadline ?? undefined,
    place: t.place,
    assignees: t.assignees ?? [],
  });
  return sorted
    .filter((t) => t.level === 1)
    .map((t) => ({
      ...toNode(t),
      children: sorted.filter((c) => c.parentId === t.id).map(toNode),
    }));
}

/**
 * Pick the active backend from DATA_BACKEND (default: postgres). Dynamically
 * imported so selecting Sheets never instantiates the Prisma client, and vice-versa.
 */
export async function getBackend(): Promise<Backend> {
  if (process.env.DATA_BACKEND === "sheets") {
    return (await import("./sheets-backend")).sheetsBackend;
  }
  return (await import("./prisma-backend")).prismaBackend;
}
