"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Avatar, Brand, Chevron, LoadingScreen, ProfileMenu, Users } from "@/components/ui";
import { clearPerson, useRequirePerson } from "@/lib/session";
import {
  DAY_END,
  DAY_START,
  anchors,
  demoDate,
  endOf,
  fmtDuration,
  fmtLongDate,
  hourTicks,
  priorityMeta,
  toHHMM,
  toMin,
} from "@/lib/data";
import { fetchEntries } from "@/lib/api";
import { usePeople } from "@/lib/people";
import { flattenTasks, taskStore } from "@/lib/tasks";
import type { Entry, Priority } from "@/lib/types";

const PX = 2;
const COL = 200;
const ROW = 96; // uniform row height for every person
const PAD = 16; // breathing room before 00:00 and after the last hour
const WORK_START = 7 * 60;
const TRACK = (DAY_END - DAY_START) * PX + PAD * 2;
const xOf = (m: number) => PAD + (m - DAY_START) * PX;

/** Greedy interval layout: assign each entry to the first lane it doesn't overlap. */
function laneLayout(list: Entry[]) {
  const sorted = [...list].sort((a, b) => toMin(a.start) - toMin(b.start));
  const laneEnd: number[] = [];
  const placed = sorted.map((e) => {
    const s = toMin(e.start);
    const end = s + e.durationMins;
    let lane = laneEnd.findIndex((le) => le <= s);
    if (lane === -1) {
      lane = laneEnd.length;
      laneEnd.push(end);
    } else {
      laneEnd[lane] = end;
    }
    return { e, lane };
  });
  return { placed, lanes: Math.max(laneEnd.length, 1) };
}

/** Faint shading over the early-morning hours (before 7am) so the working day stands out. */
function OffHours() {
  return (
    <div style={{ left: 0, width: xOf(WORK_START) }} className="pointer-events-none absolute inset-y-0 bg-surface-2/60" />
  );
}
const shift = (iso: string, d: number) => {
  const x = new Date(iso + "T00:00:00");
  x.setDate(x.getDate() + d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export default function CalendarPage() {
  const personId = useRequirePerson();
  const router = useRouter();
  const { people, getPerson } = usePeople();
  const [date, setDate] = useState(demoDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !personId) return;
    const d = new Date();
    const now = d.getHours() * 60 + d.getMinutes();
    // center the current time of day within the visible track
    el.scrollLeft = Math.max(0, COL + xOf(now) - el.clientWidth / 2);
  }, [personId, people]);

  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [taskTitles, setTaskTitles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskStore
      .load()
      .then((tree) => {
        const m = new Map<string, string>();
        for (const t of flattenTasks(tree)) m.set(t.id, t.title);
        setTaskTitles(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    fetchEntries(date)
      .then((es) => setDayEntries(es))
      .catch(() => setDayEntries([]))
      .finally(() => setLoading(false));
  }, [date, personId]);

  const stats = useMemo(() => {
    const active = people.filter((p) =>
      dayEntries.some((e) => e.personId === p.id || e.attendees?.includes(p.id)),
    ).length;
    const high = dayEntries.filter((e) => e.priority === "high").length;
    return { active, blocks: dayEntries.length, high };
  }, [dayEntries, people]);

  if (!personId) return <LoadingScreen />;
  const person = getPerson(personId);
  if (!person) return <LoadingScreen />;
  const forPerson = (id: string) =>
    dayEntries.filter((e) => e.personId === id || e.attendees?.includes(id));

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* slim toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Brand />
          <span className="hidden h-5 w-px bg-hairline sm:block" />
          <h1 className="hidden truncate font-display text-lg text-ink sm:block">Team calendar</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface p-1">
            <button onClick={() => setDate((d) => shift(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Previous day">
              <ArrowLeft />
            </button>
            <DateMenu date={date} onPick={setDate} />
            <button onClick={() => setDate((d) => shift(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Next day">
              <ArrowRight />
            </button>
          </div>
          <span className="hidden h-5 w-px bg-hairline md:block" />
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/" className="navlink">
              Today
              <ArrowUpRight width={14} height={14} />
            </Link>
            <Link href="/manage" className="navlink">
              Tasks
              <ArrowUpRight width={14} height={14} />
            </Link>
          </nav>
          <span className="hidden h-5 w-px bg-hairline sm:block" />
          <ProfileMenu
            person={{ name: person.name, tint: person.tint }}
            onSignOut={() => {
              clearPerson();
              router.push("/");
            }}
          />
        </div>
      </header>

      {/* calendar fills the rest */}
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="scroll-quiet h-full overflow-auto">
          <div style={{ width: COL + TRACK }} className="relative">
            {/* time header */}
            <div className="sticky top-0 z-30 flex h-11 items-stretch border-b border-hairline bg-surface-2">
              <div style={{ width: COL }} className="sticky left-0 z-40 flex items-center border-r border-hairline bg-surface-2 px-5 text-xs font-medium text-muted shadow-[8px_0_12px_-10px_rgba(27,28,32,0.22)]">
                Team
              </div>
              <div className="relative" style={{ width: TRACK }}>
                <OffHours />
                {hourTicks.map((m) => (
                  <div key={m} style={{ left: xOf(m) }} className="absolute top-0 flex h-full items-center">
                    <span className="tnum -translate-x-1/2 text-[11px] font-medium text-muted">{toHHMM(m)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* rows */}
            {people.map((p, i) => {
              const { placed, lanes } = laneLayout(forPerson(p.id));
              const pad = 6;
              const gap = 6;
              const rowHeight = ROW; // every row is the same height
              const blockH = Math.max(20, (rowHeight - pad * 2 - (lanes - 1) * gap) / lanes);
              return (
                <div
                  key={p.id}
                  className={`flex ${i < people.length - 1 ? "border-b border-hairline" : ""}`}
                  style={{ height: rowHeight }}
                >
                  <div
                    style={{ width: COL }}
                    className="sticky left-0 z-20 flex items-center gap-3 border-r border-hairline bg-surface px-5 shadow-[8px_0_12px_-10px_rgba(27,28,32,0.22)]"
                  >
                    <Avatar name={p.name} tint={p.tint} tip={false} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                      <div className="truncate text-[11px] text-muted">{p.role}</div>
                    </div>
                  </div>
                  <div className="relative" style={{ width: TRACK }}>
                    <OffHours />
                    {hourTicks.map((m) => (
                      <div key={m} style={{ left: xOf(m) }} className="absolute inset-y-0 w-px bg-hairline/70" />
                    ))}
                    <NowLine date={date} />
                    {anchors.map((a) => (
                      <Anchor key={a.label} label={a.label} start={a.start} dur={a.durationMins} />
                    ))}
                    {placed.map(({ e, lane }) => (
                      <Block
                        key={e.id + p.id}
                        e={e}
                        top={pad + lane * (blockH + gap)}
                        height={blockH}
                        title={taskTitles.get(e.taskId) ?? ""}
                        names={(e.attendees ?? []).map((id) => getPerson(id)?.name).filter((n): n is string => Boolean(n))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(loading || dayEntries.length === 0) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-hairline bg-surface/95 px-4 py-2.5 text-sm text-muted shadow-sm">
              {loading ? "Loading…" : "No plans recorded for this day yet."}
            </div>
          </div>
        )}
      </div>

      {/* footer: stats + legend */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline px-4 py-2 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Stat value={stats.active} label="people scheduled" />
          <Stat value={stats.blocks} label="time blocks" />
          <Stat value={stats.high} label="high priority" />
        </div>
        <Legend />
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-muted">
      {value} {label}
    </span>
  );
}

/** Date picker showing the last 7 days. */
function DateMenu({ date, onPick }: { date: string; onPick: (d: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const days = Array.from({ length: 7 }, (_, i) => shift(demoDate, -i));
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[140px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 sm:min-w-[176px]"
      >
        {fmtLongDate(date)}
        <Chevron width={14} height={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 z-50 mt-1.5 w-60 -translate-x-1/2 rounded-xl border border-hairline bg-surface p-1 shadow-[0_12px_32px_rgba(27,27,31,0.14)]">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => {
                onPick(d);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                d === date ? "bg-accent-soft text-accent-hover" : "text-ink hover:bg-surface-2"
              }`}
            >
              <span>{fmtLongDate(d)}</span>
              {d === demoDate && <span className="text-[10px] font-medium text-muted">Today</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NowLine({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (date !== demoDate) return setNow(null);
    const d = new Date();
    setNow(d.getHours() * 60 + d.getMinutes());
  }, [date]);
  if (now === null || now < DAY_START || now > DAY_END) return null;
  return (
    <div style={{ left: xOf(now) }} className="absolute inset-y-0 z-10 w-px bg-accent">
      <span className="absolute -top-px -left-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

function Anchor({ label, start, dur }: { label: string; start: string; dur: number }) {
  return (
    <div
      style={{ left: xOf(toMin(start)), width: dur * PX }}
      className="pointer-events-none absolute inset-y-0 border-x border-dashed border-hairline-2 bg-surface-2/50"
      title={`${label} · ${start}`}
    >
      <span className="absolute inset-x-1 top-1 truncate text-[9px] font-medium text-muted">{label}</span>
    </div>
  );
}

function Block({
  e,
  top,
  height,
  title,
  names,
}: {
  e: Entry;
  top: number;
  height: number;
  title: string;
  names: string[];
}) {
  const m = priorityMeta[e.priority as Priority];
  const isMeeting = (e.attendees?.length ?? 0) > 1;
  const note = e.note?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const showNote = height >= 56 && !!note;
  const showMeta = height >= 38;
  const tip = [
    title,
    note,
    `${e.start}–${endOf(e)} · ${fmtDuration(e.durationMins)}`,
    `Place: ${e.place}`,
    isMeeting ? `Meeting with ${names.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <div
      style={{ left: xOf(toMin(e.start)), width: Math.max(e.durationMins * PX - 4, 44), top, height }}
      className={`group absolute overflow-hidden rounded-lg border ${m.line} ${m.soft} px-2.5 py-1.5`}
      title={tip}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} aria-hidden />
        <span className="truncate text-xs font-semibold text-ink">{title}</span>
        {isMeeting && <Users width={12} height={12} className="ml-auto shrink-0 text-accent" />}
      </div>
      {showNote && <div className="truncate text-[11px] text-ink-2">{note}</div>}
      {showMeta && (
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="tnum text-[10px] text-muted">
            {e.start} · {fmtDuration(e.durationMins)}
          </span>
          <span className="text-[10px] text-muted">·</span>
          <span className="truncate text-[10px] text-muted">{e.place}</span>
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      <span className="overline">Legend</span>
      {(["high", "medium", "low"] as const).map((p) => (
        <span key={p} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${priorityMeta[p].dot}`} />
          {priorityMeta[p].label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <Users width={14} height={14} className="text-accent" /> Meeting
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded border border-dashed border-hairline-2 bg-surface-2" /> Daily anchor
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded bg-surface-2" /> Outside work hours
      </span>
    </div>
  );
}
