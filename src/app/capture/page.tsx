"use client";

import { useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, PageHeader, PriorityTag } from "@/components/ui";
import { CheckIcon, ClockIcon, PlusIcon, XIcon } from "@/components/icons";
import {
  demoDate,
  durationChoices,
  fmtDuration,
  fmtLongDate,
  getPerson,
  placeChoices,
  people,
  taskOptions,
  toMin,
} from "@/lib/data";
import type { Priority } from "@/lib/types";

interface Row {
  id: number;
  taskId: string;
  note: string;
  start: string;
  durationMins: number;
  place: string;
  priority: Priority;
}

const fieldCls =
  "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

export default function CapturePage() {
  const [personId, setPersonId] = useState<string | null>(null);
  const person = personId ? getPerson(personId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Capture"
        subtitle="Add your blocks for the day. A few taps, mostly defaults."
        actions={
          person ? (
            <button
              onClick={() => setPersonId(null)}
              className="flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              <Avatar name={person.name} tint={person.tint} size="sm" />
              <span className="font-medium text-ink">{person.name}</span>
              <span className="text-muted">· Sign out</span>
            </button>
          ) : null
        }
      />

      {!person ? (
        <PinSignIn onSignIn={setPersonId} />
      ) : (
        <DayEditor key={person.id} personId={person.id} />
      )}
    </div>
  );
}

/* ------------------------------ PIN sign-in ----------------------------- */

function PinSignIn({ onSignIn }: { onSignIn: (id: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (value: string) => {
    const match = people.find((p) => p.pin === value);
    if (match) {
      onSignIn(match.id);
    } else {
      setError(true);
      setTimeout(() => {
        setError(false);
        setPin("");
      }, 600);
    }
  };

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <Card className="p-7">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ClockIcon />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Enter your PIN</h2>
          <p className="mt-1 text-sm text-muted">
            Your 4-digit PIN signs you in. It is remembered on your device.
          </p>
        </div>

        <div className={`mt-6 flex justify-center gap-3 ${error ? "animate-pulse" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`flex h-12 w-11 items-center justify-center rounded-xl border text-lg font-semibold ${
                error
                  ? "border-high-line bg-high-soft text-high-ink"
                  : pin[i]
                    ? "border-accent bg-accent-soft text-accent-hover"
                    : "border-hairline-strong bg-surface text-muted"
              }`}
            >
              {pin[i] ? "•" : ""}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-6 grid max-w-[240px] grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeypadKey key={d} onClick={() => press(d)}>
              {d}
            </KeypadKey>
          ))}
          <KeypadKey onClick={() => setPin("")} muted>
            Clear
          </KeypadKey>
          <KeypadKey onClick={() => press("0")}>0</KeypadKey>
          <KeypadKey onClick={() => setPin((p) => p.slice(0, -1))} muted>
            ⌫
          </KeypadKey>
        </div>
      </Card>

      <div className="mt-4 rounded-xl border border-hairline bg-surface-2 px-4 py-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Demo PINs
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => onSignIn(p.id)}
              className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs hover:bg-surface-2"
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

function KeypadKey({
  children,
  onClick,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-14 items-center justify-center rounded-xl border border-hairline-strong text-lg font-medium transition-colors hover:bg-surface-2 active:bg-accent-soft ${
        muted ? "text-sm text-muted" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Day editor ------------------------------ */

let rowSeq = 1;
const newRow = (): Row => ({
  id: rowSeq++,
  taskId: "",
  note: "",
  start: "10:00",
  durationMins: 60,
  place: "",
  priority: "medium",
});

function DayEditor({ personId }: { personId: string }) {
  const person = getPerson(personId)!;
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [saved, setSaved] = useState(false);
  const savedCount = useRef(0);

  const update = (id: number, patch: Partial<Row>) => {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const selectTask = (id: number, taskId: string) => {
    const opt = taskOptions.find((o) => o.id === taskId);
    update(id, {
      taskId,
      place: opt?.place || person.defaultPlace,
      priority: opt?.priority ?? "medium",
    });
  };

  const filled = rows.filter((r) => r.taskId);

  const overlaps = useMemo(() => {
    const sorted = [...filled].sort((a, b) => toMin(a.start) - toMin(b.start));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      if (toMin(sorted[i].start) < toMin(prev.start) + prev.durationMins) return true;
    }
    return false;
  }, [filled]);

  const save = () => {
    savedCount.current = filled.length;
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* context bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={person.name} tint={person.tint} size="lg" />
          <div>
            <div className="text-sm font-semibold text-ink">{person.name}</div>
            <div className="text-xs text-muted">
              {person.role} · {fmtLongDate(demoDate)}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted">
          {filled.length} block{filled.length === 1 ? "" : "s"} planned
        </span>
      </div>

      {/* desktop column header */}
      <div className="hidden px-1 lg:grid lg:grid-cols-[1.5fr_1.5fr_96px_116px_140px_128px_36px] lg:gap-3">
        {["Task", "Detail (optional)", "Start", "Duration", "Place", "Priority", ""].map((h) => (
          <div key={h} className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {h}
          </div>
        ))}
      </div>

      {/* rows */}
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-3 lg:border-hairline">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.5fr_1.5fr_96px_116px_140px_128px_36px] lg:items-center">
              <Field label="Task" className="col-span-2 lg:col-span-1">
                <select
                  value={r.taskId}
                  onChange={(e) => selectTask(r.id, e.target.value)}
                  className={`${fieldCls} ${!r.taskId ? "text-muted" : ""}`}
                >
                  <option value="">Select a task…</option>
                  {taskOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Detail (optional)" className="col-span-2 lg:col-span-1">
                <input
                  value={r.note}
                  onChange={(e) => update(r.id, { note: e.target.value })}
                  placeholder="What exactly…"
                  className={fieldCls}
                />
              </Field>

              <Field label="Start">
                <input
                  type="time"
                  value={r.start}
                  onChange={(e) => update(r.id, { start: e.target.value })}
                  className={`${fieldCls} tnum`}
                />
              </Field>

              <Field label="Duration">
                <select
                  value={r.durationMins}
                  onChange={(e) => update(r.id, { durationMins: Number(e.target.value) })}
                  className={fieldCls}
                >
                  {durationChoices.map((d) => (
                    <option key={d} value={d}>
                      {fmtDuration(d)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Place">
                <select
                  value={r.place}
                  onChange={(e) => update(r.id, { place: e.target.value })}
                  className={`${fieldCls} ${!r.place ? "text-muted" : ""}`}
                >
                  <option value="">Place…</option>
                  {placeChoices.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={r.priority}
                  onChange={(e) => update(r.id, { priority: e.target.value as Priority })}
                  className={fieldCls}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>

              <div className="col-span-2 flex justify-end lg:col-span-1 lg:justify-center">
                <button
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs))}
                  disabled={rows.length === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-high-soft hover:text-high-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Remove block"
                >
                  <XIcon />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <Button variant="ghost" icon={<PlusIcon />} onClick={() => setRows((rs) => [...rs, newRow()])}>
          Add block
        </Button>
      </div>

      {/* anchors */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-hairline-strong bg-surface-2 px-4 py-3 text-xs text-muted">
        <span className="font-medium text-ink-2">Auto-added for everyone:</span>
        <span className="tnum rounded-full bg-surface px-2 py-0.5">09:00 Stand-up</span>
        <span className="tnum rounded-full bg-surface px-2 py-0.5">17:30 Evening meeting</span>
      </div>

      {/* footer / save */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <div className="text-xs">
          {overlaps ? (
            <span className="text-med-ink">Heads up: two of your blocks overlap in time.</span>
          ) : (
            <span className="text-muted">Defaults come from the task. Change anything you like.</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
              <CheckIcon width={16} height={16} />
              Saved {savedCount.current} block{savedCount.current === 1 ? "" : "s"}
            </span>
          )}
          <Button variant="primary" onClick={save} disabled={filled.length === 0}>
            Save day
          </Button>
        </div>
      </div>

      {/* preview */}
      {filled.length > 0 && (
        <Card className="mt-2 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Today, as it will show on the board
          </div>
          <div className="flex flex-col gap-2">
            {[...filled]
              .sort((a, b) => toMin(a.start) - toMin(b.start))
              .map((r) => {
                const opt = taskOptions.find((o) => o.id === r.taskId);
                return (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <span className="tnum w-12 shrink-0 text-muted">{r.start}</span>
                    <PriorityTag priority={r.priority} />
                    <span className="font-medium text-ink">{opt?.label}</span>
                    {r.note && <span className="truncate text-muted">· {r.note}</span>}
                    <span className="ml-auto shrink-0 text-xs text-muted">{r.place || "—"}</span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-medium text-muted lg:hidden">{label}</span>
      {children}
    </label>
  );
}
