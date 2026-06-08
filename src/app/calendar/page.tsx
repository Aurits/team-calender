"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Avatar, PageFrame, Users } from "@/components/ui";
import { clearPerson, loadDay, useRequirePerson } from "@/lib/session";
import {
  DAY_END,
  DAY_START,
  anchors,
  demoDate,
  endOf,
  entries as seed,
  fmtDuration,
  fmtLongDate,
  getPerson,
  getTask,
  hourTicks,
  people,
  priorityMeta,
  toHHMM,
  toMin,
} from "@/lib/data";
import type { Entry, Priority } from "@/lib/types";

const PX = 2;
const COL = 200;
const ROW = 80;
const TRACK = (DAY_END - DAY_START) * PX;
const xOf = (m: number) => (m - DAY_START) * PX;
const shift = (iso: string, d: number) => {
  const x = new Date(iso + "T00:00:00");
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

export default function CalendarPage() {
  const personId = useRequirePerson();
  const router = useRouter();
  const [date, setDate] = useState(demoDate);

  const dayEntries = useMemo(() => {
    const out: Entry[] = [];
    for (const p of people) {
      const saved = loadDay(p.id);
      if (saved) out.push(...saved.filter((e) => e.date === date));
      else out.push(...seed.filter((e) => e.date === date && e.personId === p.id));
    }
    return out;
  }, [date]);

  const stats = useMemo(() => {
    const active = people.filter((p) =>
      dayEntries.some((e) => e.personId === p.id || e.attendees?.includes(p.id)),
    ).length;
    const high = dayEntries.filter((e) => e.priority === "high").length;
    return { active, blocks: dayEntries.length, high };
  }, [dayEntries]);

  if (!personId) return <div className="min-h-dvh" />;
  const person = getPerson(personId)!;
  const forPerson = (id: string) =>
    dayEntries.filter((e) => e.personId === id || e.attendees?.includes(id));

  return (
    <PageFrame
      here="calendar"
      wide
      overline="Overview"
      title="Team calendar"
      subtitle="See where everyone is, what they're working on, and what matters most today."
      person={{ name: person.name, tint: person.tint }}
      onSignOut={() => {
        clearPerson();
        router.push("/");
      }}
      actions={
        <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface p-1">
          <button onClick={() => setDate((d) => shift(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Previous day">
            <ArrowLeft />
          </button>
          <button onClick={() => setDate(demoDate)} className="min-w-[176px] rounded-lg px-3 py-1.5 text-center text-sm font-medium text-ink hover:bg-surface-2">
            {fmtLongDate(date)}
          </button>
          <button onClick={() => setDate((d) => shift(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Next day">
            <ArrowRight />
          </button>
        </div>
      }
    >
      {/* summary chips */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        <Stat value={stats.active} label="people scheduled" />
        <Stat value={stats.blocks} label="time blocks" />
        <Stat value={stats.high} label="high priority" tone="high" />
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-quiet overflow-x-auto">
          <div style={{ width: COL + TRACK }} className="relative">
            {/* time header */}
            <div className="flex h-11 items-stretch border-b border-hairline bg-surface-2">
              <div style={{ width: COL }} className="sticky left-0 z-20 flex items-center border-r border-hairline bg-surface-2 px-5 text-xs font-medium text-muted">
                Team
              </div>
              <div className="relative" style={{ width: TRACK }}>
                {hourTicks.map((m) => (
                  <div key={m} style={{ left: xOf(m) }} className="absolute top-0 flex h-full items-center">
                    <span className="tnum -translate-x-1/2 text-[11px] font-medium text-muted">{toHHMM(m)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* rows */}
            {people.map((p, i) => (
              <div key={p.id} className={`flex ${i < people.length - 1 ? "border-b border-hairline" : ""}`} style={{ height: ROW }}>
                <div style={{ width: COL }} className="sticky left-0 z-10 flex items-center gap-3 border-r border-hairline bg-surface px-5">
                  <Avatar name={p.name} tint={p.tint} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                    <div className="truncate text-[11px] text-muted">{p.role}</div>
                  </div>
                </div>
                <div className="relative" style={{ width: TRACK }}>
                  {hourTicks.map((m) => (
                    <div key={m} style={{ left: xOf(m) }} className="absolute inset-y-0 w-px bg-hairline/70" />
                  ))}
                  <NowLine date={date} />
                  {anchors.map((a) => (
                    <Anchor key={a.label} label={a.label} start={a.start} dur={a.durationMins} />
                  ))}
                  {forPerson(p.id).map((e) => (
                    <Block key={e.id + p.id} e={e} viewer={p.id} />
                  ))}
                </div>
              </div>
            ))}

            {dayEntries.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-hairline bg-surface/95 px-4 py-2.5 text-sm text-muted shadow-sm">
                  No plans recorded for this day yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Legend />
    </PageFrame>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "high" }) {
  return (
    <div className="flex items-baseline gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-2">
      <span className={`font-display text-xl ${tone === "high" ? "text-high-ink" : "text-accent"}`}>{value}</span>
      <span className="text-xs text-muted">{label}</span>
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
      className="absolute inset-y-2 flex items-center justify-center rounded-lg border border-dashed border-hairline-2 bg-surface-2 px-1"
      title={`${label} · ${start}`}
    >
      <span className="truncate text-[10px] font-medium text-muted">{label}</span>
    </div>
  );
}

function Block({ e, viewer }: { e: Entry; viewer: string }) {
  const m = priorityMeta[e.priority as Priority];
  const task = getTask(e.taskId);
  const isMeeting = (e.attendees?.length ?? 0) > 1;
  const others = (e.attendees ?? []).filter((id) => id !== viewer);
  return (
    <div
      style={{ left: xOf(toMin(e.start)), width: Math.max(e.durationMins * PX - 4, 44) }}
      className={`group absolute inset-y-2 overflow-hidden rounded-lg border ${m.line} ${m.soft} pl-3 pr-2 py-1.5`}
      title={`${task?.title ?? ""}${e.note ? " · " + e.note : ""} · ${e.start} to ${endOf(e)} · ${e.place}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${m.bar}`} aria-hidden />
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} aria-hidden />
        <span className="truncate text-xs font-semibold text-ink">{task?.title}</span>
      </div>
      {e.note && <div className="truncate text-[11px] text-ink-2">{e.note.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</div>}
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="tnum text-[10px] text-muted">{e.start} · {fmtDuration(e.durationMins)}</span>
        <span className="text-[10px] text-muted">·</span>
        <span className="truncate text-[10px] text-muted">{e.place}</span>
        {isMeeting && (
          <span className="ml-auto flex items-center gap-1 text-accent" title="Meeting">
            <Users width={12} height={12} />
            {others.slice(0, 2).map((id) => {
              const p = getPerson(id);
              return p ? <Avatar key={id} name={p.name} tint={p.tint} size="sm" /> : null;
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted">
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
    </div>
  );
}
