"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, ArrowRight, Brand, Check, Pencil, PageFrame, Plus, PriorityTag, X } from "@/components/ui";
import { loadDay, saveDay, useSession } from "@/lib/session";
import {
  demoDate,
  durationChoices,
  fmtDuration,
  fmtLongDate,
  getPerson,
  people,
  placeChoices,
  taskOptions,
  toMin,
} from "@/lib/data";
import type { Entry, Priority } from "@/lib/types";

export default function Home() {
  const { personId, setPersonId } = useSession();

  if (personId === undefined) {
    return <div className="min-h-dvh" />; // first paint, before localStorage read
  }
  if (personId === null) {
    return <SignIn onSignIn={setPersonId} />;
  }
  return <Today key={personId} personId={personId} onSignOut={() => setPersonId(null)} />;
}

/* =============================== Sign in ================================ */

function SignIn({ onSignIn }: { onSignIn: (id: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (value: string) => {
    const match = people.find((p) => p.pin === value);
    if (match) onSignIn(match.id);
    else {
      setError(true);
      setTimeout(() => {
        setError(false);
        setPin("");
      }, 550);
    }
  };
  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="mb-8">
        <Brand />
      </div>

      <div className="card w-full max-w-sm p-7">
        <h1 className="font-display text-2xl text-ink">Plan your day</h1>
        <p className="mt-1.5 text-sm text-muted">
          Enter your 4-digit PIN. It is remembered on this device.
        </p>

        <div className={`mt-6 flex gap-3 ${error ? "animate-pulse" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`flex h-14 flex-1 items-center justify-center rounded-xl border text-xl font-semibold ${
                error
                  ? "border-high-line bg-high-soft text-high-ink"
                  : pin[i]
                    ? "border-accent bg-accent-soft text-accent-hover"
                    : "border-hairline-2 bg-surface text-muted"
              }`}
            >
              {pin[i] ? "•" : ""}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Key key={d} onClick={() => press(d)}>{d}</Key>
          ))}
          <Key onClick={() => setPin("")} muted>Clear</Key>
          <Key onClick={() => press("0")}>0</Key>
          <Key onClick={() => setPin((p) => p.slice(0, -1))} muted>⌫</Key>
        </div>
      </div>

      <div className="mt-5 w-full max-w-sm rounded-2xl border border-hairline bg-surface-2 px-4 py-3">
        <div className="overline">Demo PINs</div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => onSignIn(p.id)}
              className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs hover:bg-canvas"
            >
              <Avatar name={p.name} tint={p.tint} size="sm" />
              <span className="font-medium text-ink">{p.name}</span>
              <span className="tnum text-muted">{p.pin}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Key({ children, onClick, muted }: { children: React.ReactNode; onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-14 items-center justify-center rounded-xl border border-hairline-2 text-lg font-medium transition-colors hover:bg-surface-2 active:bg-accent-soft ${
        muted ? "text-sm text-muted" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* ================================ Today ================================= */

interface Row {
  id: number;
  taskId: string;
  note: string;
  start: string;
  durationMins: number;
  place: string;
  priority: Priority;
}

let seq = 1;
const blank = (): Row => ({
  id: seq++,
  taskId: "",
  note: "",
  start: "10:00",
  durationMins: 60,
  place: "",
  priority: "medium",
});
const toRows = (es: Entry[]): Row[] =>
  es.map((e) => ({
    id: seq++,
    taskId: e.taskId,
    note: e.note ?? "",
    start: e.start,
    durationMins: e.durationMins,
    place: e.place,
    priority: e.priority,
  }));
const toEntries = (personId: string, rows: Row[]): Entry[] =>
  rows
    .filter((r) => r.taskId)
    .map((r, i) => ({
      id: `${personId}-${i}`,
      personId,
      taskId: r.taskId,
      note: r.note || undefined,
      date: demoDate,
      start: r.start,
      durationMins: r.durationMins,
      place: r.place,
      priority: r.priority,
    }));

function Today({ personId, onSignOut }: { personId: string; onSignOut: () => void }) {
  const person = getPerson(personId)!;
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Entry[]>([]);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [rows, setRows] = useState<Row[]>([blank()]);

  useEffect(() => {
    const s = loadDay(personId) ?? [];
    setSaved(s);
    if (s.length) {
      setMode("view");
      setRows(toRows(s));
    } else {
      setMode("edit");
      setRows([blank()]);
    }
    setReady(true);
  }, [personId]);

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const selectTask = (id: number, taskId: string) => {
    const o = taskOptions.find((x) => x.id === taskId);
    update(id, { taskId, place: o?.place || person.defaultPlace, priority: o?.priority ?? "medium" });
  };
  const filled = rows.filter((r) => r.taskId);
  const overlaps = useMemo(() => {
    const s = [...filled].sort((a, b) => toMin(a.start) - toMin(b.start));
    return s.some((r, i) => i > 0 && toMin(r.start) < toMin(s[i - 1].start) + s[i - 1].durationMins);
  }, [filled]);

  const save = () => {
    const es = toEntries(personId, rows);
    saveDay(personId, es);
    setSaved(es);
    setMode("view");
  };

  const frame = (children: React.ReactNode, subtitle: string, actions?: React.ReactNode) => (
    <PageFrame
      here="today"
      overline={fmtLongDate(demoDate)}
      title={`Hi, ${person.name}`}
      subtitle={subtitle}
      person={{ name: person.name, tint: person.tint }}
      onSignOut={onSignOut}
      actions={actions}
    >
      {children}
    </PageFrame>
  );

  if (!ready) return frame(<div className="h-40" />, "");

  /* ---- view: the plan they already entered ---- */
  if (mode === "view") {
    const sorted = [...saved].sort((a, b) => toMin(a.start) - toMin(b.start));
    return frame(
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
            <span className="overline">Your plan · {sorted.length} blocks</span>
            <button onClick={() => setMode("edit")} className="navlink text-accent-hover">
              <Pencil width={15} height={15} /> Edit
            </button>
          </div>
          <ul className="divide-y divide-hairline">
            {sorted.map((e) => {
              const o = taskOptions.find((x) => x.id === e.taskId);
              return (
                <li key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="tnum w-12 shrink-0 text-sm font-medium text-ink">{e.start}</span>
                  <span className="h-8 w-px bg-hairline" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{o?.label}</span>
                      <PriorityTag priority={e.priority} />
                    </div>
                    {e.note && <div className="truncate text-xs text-muted">{e.note}</div>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{e.place}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card flex flex-col justify-between p-6">
          <div>
            <h2 className="font-display text-xl text-ink">All set for today.</h2>
            <p className="mt-2 text-sm text-muted">
              Your plan is shared with the team. See how your day fits alongside everyone else.
            </p>
          </div>
          <Link href="/calendar" className="btn btn-primary mt-6">
            See the team calendar
            <ArrowRight width={16} height={16} />
          </Link>
        </div>
      </div>,
      "Here is your plan for today. You can edit it any time.",
    );
  }

  /* ---- edit: create / change the plan ---- */
  return frame(
    <div className="flex flex-col gap-4">
      <div className="hidden px-1 lg:grid lg:grid-cols-[1.5fr_1.4fr_104px_120px_150px_132px_40px] lg:gap-3">
        {["Task", "Detail (optional)", "Start", "Duration", "Place", "Priority", ""].map((h, i) => (
          <div key={i} className="overline">{h}</div>
        ))}
      </div>

      {rows.map((r) => (
        <div key={r.id} className="card p-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.5fr_1.4fr_104px_120px_150px_132px_40px] lg:items-center">
            <Field label="Task" wide>
              <select
                value={r.taskId}
                onChange={(e) => selectTask(r.id, e.target.value)}
                className={`field ${!r.taskId ? "text-muted" : ""}`}
              >
                <option value="">Select a task…</option>
                {taskOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Detail (optional)" wide>
              <input
                value={r.note}
                onChange={(e) => update(r.id, { note: e.target.value })}
                placeholder="What exactly…"
                className="field"
              />
            </Field>
            <Field label="Start">
              <input type="time" value={r.start} onChange={(e) => update(r.id, { start: e.target.value })} className="field tnum" />
            </Field>
            <Field label="Duration">
              <select value={r.durationMins} onChange={(e) => update(r.id, { durationMins: Number(e.target.value) })} className="field">
                {durationChoices.map((d) => (
                  <option key={d} value={d}>{fmtDuration(d)}</option>
                ))}
              </select>
            </Field>
            <Field label="Place">
              <select value={r.place} onChange={(e) => update(r.id, { place: e.target.value })} className={`field ${!r.place ? "text-muted" : ""}`}>
                <option value="">Place…</option>
                {placeChoices.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={r.priority} onChange={(e) => update(r.id, { priority: e.target.value as Priority })} className="field">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <div className="col-span-2 flex justify-end lg:col-span-1 lg:justify-center">
              <button
                onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs))}
                disabled={rows.length === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-high-soft hover:text-high-ink disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Remove block"
              >
                <X />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div>
        <button onClick={() => setRows((rs) => [...rs, blank()])} className="btn btn-ghost">
          <Plus width={16} height={16} /> Add block
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-hairline-2 bg-surface-2 px-4 py-3 text-xs text-muted">
        <span className="font-medium text-ink-2">Auto-added for everyone:</span>
        <span className="tnum rounded-full bg-surface px-2 py-0.5">09:00 Stand-up</span>
        <span className="tnum rounded-full bg-surface px-2 py-0.5">17:30 Evening meeting</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <span className="text-xs">
          {overlaps ? (
            <span className="text-med-ink">Heads up: two of your blocks overlap in time.</span>
          ) : (
            <span className="text-muted">Defaults come from the task. Change anything you like.</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {saved.length > 0 && (
            <button onClick={() => { setRows(toRows(saved)); setMode("view"); }} className="btn btn-ghost">
              Cancel
            </button>
          )}
          <button onClick={save} disabled={filled.length === 0} className="btn btn-primary">
            <Check width={16} height={16} /> Save day
          </button>
        </div>
      </div>
    </div>,
    "Add your blocks for the day. A few taps, mostly defaults.",
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "col-span-2 lg:col-span-1" : ""}`}>
      <span className="text-[11px] font-medium text-muted lg:hidden">{label}</span>
      {children}
    </label>
  );
}
