import type { Entry } from "@/lib/types";
import type { Initiative } from "@/lib/tasks";
import { buildTree, flattenTree, type Backend, type FlatTask, type PersonPublic } from "./backend";

/**
 * Google Sheets backend. All work happens in an Apps Script Web App bound to the
 * Sheet (see apps-script/Code.gs); here we just POST to its URL with a shared
 * secret. No Google credentials live in this app — the script runs as the sheet
 * owner. Enable with DATA_BACKEND=sheets.
 */

/** One round-trip to the Apps Script web app. Returns the `data` payload it sends back. */
async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const url = process.env.SHEETS_WEBAPP_URL;
  const secret = process.env.SHEETS_SHARED_SECRET;
  if (!url) throw new Error("SHEETS_WEBAPP_URL is not set");

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, action, ...payload }),
    // Apps Script /exec answers with a 302 to googleusercontent; fetch follows it.
    redirect: "follow",
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Sheets backend HTTP ${r.status}`);
  const json = (await r.json()) as { data?: T; error?: string };
  if (json.error) throw new Error(`Sheets backend: ${json.error}`);
  return json.data as T;
}

export const sheetsBackend: Backend = {
  name: "sheets",

  getPeople() {
    return call<PersonPublic[]>("getPeople");
  },

  verifyPin(pin: string) {
    return call<PersonPublic | null>("verifyPin", { pin });
  },

  async updatePin(personId: string, newPin: string): Promise<void> {
    await call("updatePin", { personId, newPin });
  },

  async getTasks(): Promise<Initiative[]> {
    const flat = await call<FlatTask[]>("getTasks");
    return buildTree(flat);
  },

  async saveTasks(tree: Initiative[]): Promise<void> {
    await call("saveTasks", { tasks: flattenTree(tree) });
  },

  getEntries(date: string) {
    return call<Entry[]>("getEntries", { date });
  },

  async getDay(personId: string, date: string): Promise<Entry[]> {
    return call<Entry[]>("getDay", { personId, date });
  },

  async saveDay(personId: string, date: string, entries: Entry[]): Promise<void> {
    await call("saveDay", { personId, date, entries });
  },

  async getNote(personId: string, date: string): Promise<string> {
    const res = await call<{ content: string }>("getNote", { personId, date });
    return res.content;
  },

  async saveNote(personId: string, date: string, content: string): Promise<void> {
    await call("saveNote", { personId, date, content });
  },
};
