import { childrenOf, initiatives } from "./data";
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

/** Initial tree from the JSON seed (data.json via lib/data). */
function seed(): Initiative[] {
  return initiatives.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    deadline: t.deadline,
    place: t.defaultPlace ?? "",
    assignees: t.assignees ?? [],
    children: childrenOf(t.id).map((c) => ({
      id: c.id,
      title: c.title,
      priority: c.priority,
      place: c.defaultPlace ?? t.defaultPlace ?? "",
      assignees: c.assignees ?? [],
    })),
  }));
}

/**
 * Storage adapter. The UI depends only on this interface, so swapping the
 * backend (e.g. a Google Sheets API) later is a one-line change to `taskStore`.
 */
export interface TaskStore {
  load(): Initiative[];
  save(tree: Initiative[]): void;
}

const KEY = "cadence:initiatives";

/** Local adapter: seeds from JSON, persists changes to localStorage. */
export const localStore: TaskStore = {
  load() {
    if (typeof window === "undefined") return seed();
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Initiative[]) : seed();
    } catch {
      return seed();
    }
  },
  save(tree) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(tree));
  },
};

/** The active backend. To connect Google Sheets, implement TaskStore and assign it here. */
export const taskStore: TaskStore = localStore;
