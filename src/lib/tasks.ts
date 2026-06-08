import type { Priority } from "./types";

export interface TaskNode {
  id: string;
  title: string;
  priority: Priority;
  deadline?: string;
  place: string;
  assignees: string[];
  description?: string;
}
export interface Initiative extends TaskNode {
  children: TaskNode[];
}

/**
 * Storage adapter. The UI depends only on this async interface, so the backend
 * is a one-line swap (Postgres API ⇄ anything else).
 */
export interface TaskStore {
  load(): Promise<Initiative[]>;
  save(tree: Initiative[]): Promise<void>;
}

/** Postgres-backed adapter via the REST API. */
export const apiStore: TaskStore = {
  async load() {
    const r = await fetch("/api/tasks");
    if (!r.ok) throw new Error("Failed to load tasks");
    return r.json();
  },
  async save(tree) {
    const r = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tree),
    });
    if (!r.ok) throw new Error("Failed to save tasks");
  },
};

/** The active backend. */
export const taskStore: TaskStore = apiStore;

/** A flat, selectable view of the tree — used by the Capture and Calendar pages. */
export interface TaskRef {
  id: string;
  title: string;
  label: string; // "Initiative › Workstream" or just the title
  priority: Priority;
  place: string;
}
export function flattenTasks(tree: Initiative[]): TaskRef[] {
  const out: TaskRef[] = [];
  for (const init of tree) {
    out.push({ id: init.id, title: init.title, label: init.title, priority: init.priority, place: init.place });
    for (const c of init.children ?? []) {
      out.push({ id: c.id, title: c.title, label: `${init.title} › ${c.title}`, priority: c.priority, place: c.place });
    }
  }
  return out;
}
