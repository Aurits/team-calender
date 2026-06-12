import type { Entry } from "./types";

export interface PersonProfile {
  id: string;
  name: string;
  role: string;
  defaultPlace: string;
  tint: number;
}

/** All entries on a date (every person + meetings) — for the calendar. */
export async function fetchEntries(date: string): Promise<Entry[]> {
  const r = await fetch(`/api/entries?date=${date}`);
  if (!r.ok) throw new Error("Failed to load entries");
  return r.json();
}

/** A person's own entries for a date — for the capture page. */
export async function fetchDay(personId: string, date: string): Promise<Entry[]> {
  const r = await fetch(`/api/days/${personId}?date=${date}`);
  if (!r.ok) throw new Error("Failed to load day");
  return r.json();
}

/** Replace a person's entries for a date. */
export async function saveDayApi(personId: string, date: string, entries: Entry[]): Promise<void> {
  const r = await fetch(`/api/days/${personId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, entries }),
  });
  if (!r.ok) throw new Error("Failed to save day");
}

/** Verify a PIN server-side. Returns the person, or null when the PIN is wrong. */
export async function verifyPin(pin: string): Promise<PersonProfile | null> {
  const r = await fetch("/api/auth/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error("Sign-in failed");
  return r.json();
}

/** Change the user's PIN using their old PIN. */
export async function changePinApi(oldPin: string, newPin: string): Promise<void> {
  const r = await fetch("/api/auth/pin/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPin, newPin }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || "Failed to change PIN");
  }
}
