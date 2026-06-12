"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Brand, Check, Clock, LoadingScreen, NoteArea, PageFrame, Pencil, Plus, PriorityTag, Select, Spinner, X, ChangePinModal } from "@/components/ui";
import { useSession } from "@/lib/session";
import { fetchDay, fetchNote, saveDayApi, saveNoteApi, verifyPin } from "@/lib/api";
import { usePeople } from "@/lib/people";
import { flattenTasks, taskStore, type TaskRef } from "@/lib/tasks";
import {
  anchors,
  demoDate,
  durationChoices,
  fmtDuration,
  fmtLongDate,
  fmtTime12,
  placeChoices,
  priorityMeta,
  toHHMM,
  toMin,
} from "@/lib/data";
import type { Entry, Priority } from "@/lib/types";

export default function Home() {
  const { personId, setPersonId } = useSession();
  const [justSignedInPin, setJustSignedInPin] = useState("");

  if (personId === undefined) {
    return <LoadingScreen />; // first paint, before localStorage read
  }
  if (personId === null) {
    return <SignIn onSignIn={(id, pin) => { setPersonId(id); setJustSignedInPin(pin); }} />;
  }
  return <Today key={personId} personId={personId} onSignOut={() => setPersonId(null)} justSignedInPin={justSignedInPin} onDismissPinPrompt={() => setJustSignedInPin("")} />;
}

/* =============================== Sign in ================================ */

function SignIn({ onSignIn }: { onSignIn: (id: string, pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const press = (d: string) => {
    if (pin.length >= 4 || checking) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setChecking(true);
      verifyPin(next)
        .then((person) => {
          if (person) onSignIn(person.id, next);
          else {
            setError(true);
            setPin("");
          }
        })
        .catch(() => {
          setError(true);
          setPin("");
        })
        .finally(() => setChecking(false));
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center overflow-hidden px-5 py-4">
      <div className="mb-5 sm:mb-7">
        <Brand />
      </div>

      <div className="card w-full max-w-sm p-6 sm:p-7">
        <h1 className="font-display text-2xl text-ink">Plan your day</h1>
        <p className="mt-1.5 text-sm text-muted">
          Enter your 4-digit PIN. It is remembered on this device.
        </p>

        <div className="mt-5 flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`flex h-12 flex-1 items-center justify-center rounded-xl border text-xl font-semibold sm:h-14 ${
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

        <p
          className={`mt-3 h-4 text-center text-xs font-medium transition-opacity ${
            error ? "text-high-ink opacity-100" : checking ? "text-muted opacity-100" : "opacity-0"
          }`}
        >
          {error ? "Incorrect PIN. Try again." : "Checking…"}
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Key key={d} onClick={() => press(d)}>{d}</Key>
          ))}
          <Key onClick={() => setPin("")} muted>Clear</Key>
          <Key onClick={() => press("0")}>0</Key>
          <Key onClick={() => setPin((p) => p.slice(0, -1))} muted>⌫</Key>
        </div>
      </div>
    </div>
  );
}

function Key({ children, onClick, muted }: { children: React.ReactNode; onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-xl border border-hairline-2 text-lg font-medium transition-colors hover:bg-surface-2 active:bg-accent-soft sm:h-14 ${
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
// TODO: Capture has no attendee picker, so saving a day rewrites the person's
// blocks without `attendees`. If they own a meeting (a block with >1 attendee),
// re-saving drops its attendees on both backends. Add an attendee picker here (or
// preserve attendees from the previously-saved entry) so meetings survive a re-save.
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

const placeOpts = placeChoices.map((p) => ({ value: p, label: p }));
const prioOpts = (["high", "medium", "low"] as const).map((p) => ({
  value: p,
  label: (
    <span className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta[p].dot}`} />
      {priorityMeta[p].label}
    </span>
  ),
}));
const durOpts = durationChoices.map((d) => ({ value: String(d), label: fmtDuration(d) }));
const timeOpts = (() => {
  const out: { value: string; label: string }[] = [];
  for (let m = 8 * 60; m < 24 * 60; m += 15) {
    const hhmm = toHHMM(m);
    out.push({ value: hhmm, label: fmtTime12(hhmm) });
  }
  return out;
})();

function Today({ personId, onSignOut, justSignedInPin, onDismissPinPrompt }: { personId: string; onSignOut: () => void; justSignedInPin?: string; onDismissPinPrompt?: () => void }) {
  const { getPerson } = usePeople();
  const person = getPerson(personId);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Entry[]>([]);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [taskRefs, setTaskRefs] = useState<TaskRef[]>([]);
  const [showChangePin, setShowChangePin] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch today's note
  useEffect(() => {
    fetchNote(personId, demoDate).then(setNoteContent).catch(() => {});
  }, [personId]);

  // Auto-save note with debounce
  const handleNoteChange = useCallback(
    (v: string) => {
      setNoteContent(v);
      setNoteSaved(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setNoteSaving(true);
        saveNoteApi(personId, demoDate, v)
          .then(() => { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); })
          .catch(() => {})
          .finally(() => setNoteSaving(false));
      }, 800);
    },
    [personId],
  );

  useEffect(() => {
    if (justSignedInPin && localStorage.getItem("pinPromptDismissed") !== "true") {
      setShowChangePin(true);
    }
  }, [justSignedInPin]);

  useEffect(() => {
    const h = () => setShowChangePin(true);
    window.addEventListener("open-change-pin", h);
    return () => window.removeEventListener("open-change-pin", h);
  }, []);

  useEffect(() => {
    taskStore
      .load()
      .then((tree) => setTaskRefs(flattenTasks(tree)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    fetchDay(personId, demoDate)
      .then((s) => {
        if (cancelled) return;
        setSaved(s);
        if (s.length) {
          setMode("view");
          setRows(toRows(s));
        } else {
          setMode("edit");
          setRows([blank()]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSaved([]);
        setMode("edit");
        setRows([blank()]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const taskOpts = taskRefs.map((t) => ({ value: t.id, label: t.label }));

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const selectTask = (id: number, taskId: string) => {
    const o = taskRefs.find((x) => x.id === taskId);
    update(id, { taskId, place: o?.place || person?.defaultPlace || "Main Office", priority: o?.priority ?? "medium" });
  };
  const filled = rows.filter((r) => r.taskId);
  const conflictIds = useMemo(() => {
    const ids = new Set<number>();
    const list = rows.filter((r) => r.taskId).map((r) => ({ id: r.id, s: toMin(r.start), e: toMin(r.start) + r.durationMins }));
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        if (list[i].s < list[j].e && list[j].s < list[i].e) {
          ids.add(list[i].id);
          ids.add(list[j].id);
        }
    return ids;
  }, [rows]);

  const save = async () => {
    const es = toEntries(personId, rows);
    setSaved(es);
    setMode("view");
    await saveDayApi(personId, demoDate, es).catch((e) => console.error("Couldn't save day", e));
  };

  const frame = (children: React.ReactNode, sub: string) => (
    <PageFrame
      here="today"
      wide
      date={fmtLongDate(demoDate)}
      lead={
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-2xl text-ink sm:text-[26px]">Hi, {person?.name}</span>
          {sub && <span className="text-sm text-muted">· {sub}</span>}
        </div>
      }
      person={{ name: person?.name ?? "", tint: person?.tint ?? 1 }}
      onSignOut={onSignOut}
    >
      {children}
      <ChangePinModal isOpen={showChangePin} onClose={() => { setShowChangePin(false); onDismissPinPrompt?.(); localStorage.setItem("pinPromptDismissed", "true"); }} initialOldPin={justSignedInPin} />
    </PageFrame>
  );

  if (!person) return <LoadingScreen />;
  if (!ready)
    return frame(
      <div className="flex h-40 items-center justify-center">
        <Spinner className="text-muted" />
      </div>,
      "",
    );

  /* ---- view: the plan they already entered ---- */
  if (mode === "view") {
    const items = [
      ...saved.map((e) => ({ kind: "entry" as const, start: e.start, e })),
      ...anchors.map((a) => ({ kind: "anchor" as const, start: a.start, a })),
    ].sort((x, y) => toMin(x.start) - toMin(y.start));
    return frame(
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
            <span className="overline">Your plan · {saved.length} blocks</span>
            <button onClick={() => setMode("edit")} className="navlink text-accent-hover">
              <Pencil width={15} height={15} /> Edit
            </button>
          </div>
          <ul className="divide-y divide-hairline">
            {items.map((it, idx) =>
              it.kind === "anchor" ? (
                <li key={`a-${idx}`} className="flex items-center gap-4 bg-surface-2/40 px-5 py-3">
                  <span className="tnum w-16 shrink-0 text-sm font-medium text-muted">{fmtTime12(it.a.start)}</span>
                  <span className="h-7 w-px bg-hairline" />
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-sm font-medium text-ink-2">{it.a.label}</span>
                    <span className="rounded-full border border-dashed border-hairline-2 px-1.5 py-0.5 text-[10px] text-muted">
                      Auto · everyone
                    </span>
                  </div>
                </li>
              ) : (
                <li key={it.e.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="tnum w-16 shrink-0 text-sm font-medium text-ink">{fmtTime12(it.e.start)}</span>
                  <span className="h-8 w-px bg-hairline" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {taskRefs.find((x) => x.id === it.e.taskId)?.label}
                      </span>
                      <PriorityTag priority={it.e.priority} />
                    </div>
                    {it.e.note && (
                      <div
                        className="note-area mt-1 text-[13px]"
                        dangerouslySetInnerHTML={{ __html: it.e.note }}
                      />
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{it.e.place}</span>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-5 self-start">
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink">All set for today.</h2>
            <p className="mt-2 text-sm text-muted">
              Your plan is shared with the team. See how your day fits alongside everyone else.
            </p>
            <Link href="/calendar" className="btn btn-primary mt-5 w-full">
              See the team calendar
              <ArrowRight width={16} height={16} />
            </Link>
          </div>

          <div className="notes-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-hairline/50 px-5 py-3.5 bg-surface/30">
              <span className="overline flex items-center gap-2">
                <span className="text-base">📝</span> Notes & Feedback
              </span>
              <span className={`text-[11px] font-medium transition-opacity duration-300 ${
                noteSaving ? "text-muted opacity-100" : noteSaved ? "text-accent opacity-100" : "opacity-0"
              }`}>
                {noteSaving ? "Saving…" : "✓ Saved"}
              </span>
            </div>
            <div className="px-5 pb-5 pt-4" style={{ minHeight: 140 }}>
              <NoteArea
                value={noteContent}
                onChange={handleNoteChange}
                bullets={true}
                placeholder="Jot down thoughts, blockers, or feedback…"
              />
            </div>
          </div>
        </div>
      </div>,
      "Here's your plan for today.",
    );
  }

  /* ---- edit: create / change the plan ---- */
  return frame(
    <div className="flex flex-col gap-4">
      <div className="card divide-y divide-hairline">
        <div className="hidden grid-cols-[1.6fr_140px_120px_140px_132px_40px] gap-2 px-4 pb-2 pt-3 lg:grid">
          {["Task", "Start", "Duration", "Place", "Priority", ""].map((h, i) => (
            <div key={i} className="overline px-3">{h}</div>
          ))}
        </div>

        {rows.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 lg:grid-cols-[1.6fr_140px_120px_140px_132px_40px] lg:items-center lg:gap-2">
              <div className="col-span-2 lg:col-span-1">
                <span className="overline mb-1 block lg:hidden">Task</span>
                <Select value={r.taskId} onChange={(v) => selectTask(r.id, v)} placeholder="Select a task…" options={taskOpts} />
                {conflictIds.has(r.id) && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-med-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-med" /> Overlaps another block
                  </span>
                )}
              </div>
              <div>
                <span className="overline mb-1 block lg:hidden">Start</span>
                <Select
                  value={r.start}
                  onChange={(v) => update(r.id, { start: v })}
                  options={timeOpts}
                  variant="ghost"
                  icon={<Clock width={15} height={15} className="text-muted" />}
                />
              </div>
              <div>
                <span className="overline mb-1 block lg:hidden">Duration</span>
                <Select value={String(r.durationMins)} onChange={(v) => update(r.id, { durationMins: Number(v) })} options={durOpts} variant="ghost" />
              </div>
              <div>
                <span className="overline mb-1 block lg:hidden">Place</span>
                <Select value={r.place} onChange={(v) => update(r.id, { place: v })} placeholder="Place…" options={placeOpts} align="right" variant="ghost" />
              </div>
              <div>
                <span className="overline mb-1 block lg:hidden">Priority</span>
                <Select value={r.priority} onChange={(v) => update(r.id, { priority: v as Priority })} options={prioOpts} align="right" variant="ghost" />
              </div>
              <div className="col-span-2 flex justify-end lg:col-span-1 lg:justify-center">
                <button
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs))}
                  disabled={rows.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-high-soft hover:text-high-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Remove block"
                >
                  <X width={16} height={16} />
                </button>
              </div>
            </div>

            <BlockDescription value={r.note} onChange={(v) => update(r.id, { note: v })} />
          </div>
        ))}
      </div>

      <div>
        <button
          onClick={() =>
            setRows((rs) => {
              const next = blank();
              const last = rs[rs.length - 1];
              if (last) next.start = toHHMM(Math.min(toMin(last.start) + last.durationMins, 23 * 60 + 45));
              return [...rs, next];
            })
          }
          className="btn btn-ghost"
        >
          <Plus width={16} height={16} /> Add block
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-hairline-2 bg-surface-2 px-4 py-3 text-xs text-muted">
        <span className="font-medium text-ink-2">Auto-added for everyone:</span>
        {anchors.map((a) => (
          <span key={a.label} className="tnum rounded-full bg-surface px-2 py-0.5">
            {a.start} {a.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <span className="text-xs">
          {conflictIds.size > 0 ? (
            <span className="text-med-ink">
              Heads up: {conflictIds.size} block{conflictIds.size === 1 ? "" : "s"} overlap in time.
            </span>
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
    "Add your blocks for the day.",
  );
}

/** Description is hidden until needed; opens automatically when it already has content. */
function BlockDescription({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent-hover"
      >
        <Plus width={13} height={13} /> Add description
      </button>
    );
  }
  return (
    <div className="mt-2 max-w-2xl">
      <NoteArea value={value} onChange={onChange} />
    </div>
  );
}
