"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Card, PageHeader } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, UsersIcon } from "@/components/icons";
import {
  DAY_END,
  DAY_START,
  anchors,
  demoDate,
  endOf,
  entries,
  fmtLongDate,
  getPerson,
  getTask,
  hourTicks,
  people,
  priorityMeta,
  toHHMM,
  toMin,
} from "@/lib/data";
import type { Entry } from "@/lib/types";

const PX_PER_MIN = 2;
const PERSON_COL = 184;
const ROW_H = 78;
const TRACK_W = (DAY_END - DAY_START) * PX_PER_MIN;
const xOf = (min: number) => (min - DAY_START) * PX_PER_MIN;

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function OverviewPage() {
  const [date, setDate] = useState(demoDate);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const dayEntries = useMemo(() => entries.filter((e) => e.date === date), [date]);
  const hasPlans = dayEntries.length > 0;

  const entriesForPerson = (personId: string) =>
    dayEntries.filter((e) => e.personId === personId || e.attendees?.includes(personId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        subtitle="Everyone's day at a glance — where they are, what they're on, and what matters most."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface p-1">
            <button
              onClick={() => setDate((d) => shiftDate(d, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Previous day"
            >
              <ArrowLeftIcon />
            </button>
            <button
              onClick={() => setDate(demoDate)}
              className="min-w-[168px] rounded-lg px-3 py-1.5 text-center text-sm font-medium text-ink hover:bg-surface-2"
            >
              {fmtLongDate(date)}
            </button>
            <button
              onClick={() => setDate((d) => shiftDate(d, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Next day"
            >
              <ArrowRightIcon />
            </button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="scroll-quiet overflow-x-auto">
          <div style={{ width: PERSON_COL + TRACK_W }} className="relative">
            {/* time header */}
            <div className="flex h-11 items-stretch border-b border-hairline bg-surface-2">
              <div
                style={{ width: PERSON_COL }}
                className="sticky left-0 z-20 flex items-center border-r border-hairline bg-surface-2 px-4 text-xs font-medium text-muted"
              >
                Team
              </div>
              <div className="relative" style={{ width: TRACK_W }}>
                {hourTicks.map((m) => (
                  <div
                    key={m}
                    style={{ left: xOf(m) }}
                    className="absolute top-0 flex h-full items-center"
                  >
                    <span className="tnum -translate-x-1/2 text-[11px] font-medium text-muted">
                      {toHHMM(m)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* rows */}
            <div className="relative">
              {people.map((person, i) => {
                const list = entriesForPerson(person.id);
                return (
                  <div
                    key={person.id}
                    className={`flex ${i < people.length - 1 ? "border-b border-hairline" : ""}`}
                    style={{ height: ROW_H }}
                  >
                    {/* person cell */}
                    <div
                      style={{ width: PERSON_COL }}
                      className="sticky left-0 z-10 flex items-center gap-3 border-r border-hairline bg-surface px-4"
                    >
                      <Avatar name={person.name} tint={person.tint} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink">{person.name}</div>
                        <div className="truncate text-[11px] text-muted">{person.role}</div>
                      </div>
                    </div>

                    {/* track */}
                    <div className="relative" style={{ width: TRACK_W }}>
                      {/* hour gridlines */}
                      {hourTicks.map((m) => (
                        <div
                          key={m}
                          style={{ left: xOf(m) }}
                          className="absolute inset-y-0 w-px bg-hairline/70"
                        />
                      ))}

                      {/* now line */}
                      {today === date && <NowLine />}

                      {/* anchors (shared) */}
                      {anchors.map((a) => (
                        <AnchorBlock key={a.label} label={a.label} start={a.start} dur={a.durationMins} />
                      ))}

                      {/* entries */}
                      {list.map((e) => (
                        <EntryBlock key={e.id + person.id} e={e} viewerId={person.id} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {!hasPlans && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="pointer-events-auto rounded-xl border border-hairline bg-surface/95 px-4 py-2.5 text-sm text-muted shadow-sm">
                    No plans recorded for this day yet.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Legend />
    </div>
  );
}

function NowLine() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date();
    setNow(d.getHours() * 60 + d.getMinutes());
  }, []);
  if (now === null || now < DAY_START || now > DAY_END) return null;
  return (
    <div style={{ left: xOf(now) }} className="absolute inset-y-0 z-10 w-px bg-accent">
      <span className="absolute -top-px -left-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

function AnchorBlock({ label, start, dur }: { label: string; start: string; dur: number }) {
  const left = xOf(toMin(start));
  const width = dur * PX_PER_MIN;
  return (
    <div
      style={{ left, width }}
      className="absolute inset-y-2 flex items-center justify-center rounded-lg border border-dashed border-hairline-strong bg-surface-2 px-1"
      title={`${label} · ${start}`}
    >
      <span className="truncate text-[10px] font-medium text-muted">{label}</span>
    </div>
  );
}

function EntryBlock({ e, viewerId }: { e: Entry; viewerId: string }) {
  const left = xOf(toMin(e.start));
  const width = Math.max(e.durationMins * PX_PER_MIN - 4, 40);
  const m = priorityMeta[e.priority];
  const task = getTask(e.taskId);
  const isMeeting = (e.attendees?.length ?? 0) > 1;
  const others = (e.attendees ?? []).filter((id) => id !== viewerId);

  return (
    <div
      style={{ left, width }}
      className={`group absolute inset-y-2 overflow-hidden rounded-lg border ${m.line} ${m.soft} px-2.5 py-1.5`}
      title={`${task?.title ?? ""}${e.note ? " · " + e.note : ""} · ${e.start}–${endOf(e)} · ${e.place}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${m.bar}`} aria-hidden />
      <div className="flex items-center gap-1.5 pl-1">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} aria-hidden />
        <span className="truncate text-xs font-semibold text-ink">{task?.title}</span>
      </div>
      <div className="truncate pl-2.5 text-[11px] text-ink-2">{e.note}</div>
      <div className="mt-0.5 flex items-center gap-2 pl-2.5">
        <span className="tnum text-[10px] text-muted">
          {e.start}–{endOf(e)}
        </span>
        <span className="text-[10px] text-muted">·</span>
        <span className="truncate text-[10px] text-muted">{e.place}</span>
        {isMeeting && (
          <span className="ml-auto flex items-center gap-1 text-accent" title="Meeting">
            <UsersIcon width={12} height={12} />
            {others.slice(0, 2).map((id) => {
              const p = getPerson(id);
              return p ? <Avatar key={id} name={p.name} tint={p.tint} size="sm" ring /> : null;
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1 text-xs text-muted">
      <span className="font-medium text-ink-2">Legend</span>
      {(["high", "medium", "low"] as const).map((p) => (
        <span key={p} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${priorityMeta[p].dot}`} />
          {priorityMeta[p].label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <UsersIcon width={14} height={14} className="text-accent" />
        Meeting (shared block)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded border border-dashed border-hairline-strong bg-surface-2" />
        Daily anchor
      </span>
    </div>
  );
}
