export type Priority = "high" | "medium" | "low";

export interface Person {
  id: string;
  pin: string;
  name: string;
  role: string;
  defaultPlace: string;
  /** 1-5, maps to an avatar tint */
  tint: 1 | 2 | 3 | 4 | 5;
}

export interface Task {
  id: string;
  level: 1 | 2;
  parentId: string | null;
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string; // ISO date
  defaultPlace?: string;
}

export interface Entry {
  id: string;
  personId: string; // owner / organizer
  taskId: string; // an L1 or L2 task
  note?: string; // optional Level-3 detail
  date: string; // ISO date
  start: string; // "HH:MM"
  durationMins: number;
  place: string;
  priority: Priority;
  /** person ids; when more than one, this block is a meeting */
  attendees?: string[];
}
