import type { Priority } from "./types";

/** The app's "today" — the real current date (local). */
export const demoDate: string = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

/* ----------------------------- time helpers ----------------------------- */

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
export const endOf = (e: { start: string; durationMins: number }) =>
  toHHMM(toMin(e.start) + e.durationMins);

export const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const fmtTime12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ap}`;
};

/** The visible day window on the calendar — full 24 hours. */
export const DAY_START = 0; // 00:00
export const DAY_END = 24 * 60; // 24:00
export const hourTicks = Array.from(
  { length: Math.floor((DAY_END - DAY_START) / 60) },
  (_, i) => DAY_START + i * 60,
);

/** Fixed daily anchors everyone shares. */
export const anchors = [
  { label: "Stand-up", start: "08:45", durationMins: 30 },
  { label: "Lunch", start: "12:00", durationMins: 60 },
  { label: "Evening meeting", start: "17:30", durationMins: 30 },
];

export const durationChoices = [15, 30, 45, 60, 90, 120, 180, 240];
export const placeChoices = ["Main Office", "Izumi", "Sugimoto", "Remote", "Ogasawara Site", "Outside"];

/* ----------------------------- priority meta ---------------------------- */

export const priorityMeta: Record<
  Priority,
  { label: string; dot: string; text: string; soft: string; line: string; bar: string }
> = {
  high: {
    label: "High",
    dot: "bg-high",
    text: "text-high-ink",
    soft: "bg-high-soft",
    line: "border-high-line",
    bar: "bg-high",
  },
  medium: {
    label: "Medium",
    dot: "bg-med",
    text: "text-med-ink",
    soft: "bg-med-soft",
    line: "border-med-line",
    bar: "bg-med",
  },
  low: {
    label: "Low",
    dot: "bg-low",
    text: "text-low-ink",
    soft: "bg-low-soft",
    line: "border-low-line",
    bar: "bg-low",
  },
};

export const priorityOrder: Priority[] = ["high", "medium", "low"];

/* ----------------------------- avatar tints ----------------------------- */

export const tintClass: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-av1-bg", text: "text-av1-ink" },
  2: { bg: "bg-av2-bg", text: "text-av2-ink" },
  3: { bg: "bg-av3-bg", text: "text-av3-ink" },
  4: { bg: "bg-av4-bg", text: "text-av4-ink" },
  5: { bg: "bg-av5-bg", text: "text-av5-ink" },
};

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ----------------------------- date helpers ----------------------------- */

export const fmtLongDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export const fmtShortDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};
