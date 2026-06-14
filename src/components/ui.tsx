"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import type { Priority } from "@/lib/types";
import { initialsOf, priorityMeta, tintClass } from "@/lib/data";
import { usePeople } from "@/lib/people";
import { useTheme } from "@/lib/theme";
import { changePinApi } from "@/lib/api";

/* -------------------------------- icons -------------------------------- */

const ico = (p: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const Pencil = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
);
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.8 12a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-12" /><path d="M10 11v6M14 11v6" /></svg>
);
export const Users = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-2-4.3" /></svg>
);
export const Pin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></svg>
);
export const Chevron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const ArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const Grip = (p: SVGProps<SVGSVGElement>) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="9" cy="5" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="15" cy="5" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="15" cy="19" r="1.4" />
  </svg>
);
export const Sun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const Moon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...ico(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
);
export const Spinner = ({ className = "", ...p }: SVGProps<SVGSVGElement>) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* ---------------------------- LoadingScreen ---------------------------- */

/** Full-height centered loader for page-level data fetches. */
export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-canvas">
      <Spinner className="text-accent" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

/* ------------------------------- Avatar -------------------------------- */

export function Avatar({
  name,
  tint,
  size = "md",
  tip = true,
}: {
  name: string;
  tint: number;
  size?: "sm" | "md" | "lg";
  tip?: boolean;
}) {
  const t = tintClass[tint] ?? tintClass[1];
  const dim =
    size === "sm"
      ? "h-6 w-6 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-9 w-9 text-xs";
  return (
    <span className="group/av relative inline-flex shrink-0" aria-label={name}>
      <span
        className={`inline-flex items-center justify-center rounded-full font-semibold ${t.bg} ${t.text} ${dim}`}
      >
        {initialsOf(name)}
      </span>
      {tip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-tip-bg px-1.5 py-0.5 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-100 group-hover/av:opacity-100">
          {name}
        </span>
      )}
    </span>
  );
}

/* ----------------------------- PriorityTag ----------------------------- */

export function PriorityTag({ priority }: { priority: Priority }) {
  const m = priorityMeta[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${m.soft} ${m.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden />
      {m.label}
    </span>
  );
}

/* ------------------------------- Select -------------------------------- */

export interface Option {
  value: string;
  label: ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  icon,
  align = "left",
  variant = "solid",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: ReactNode;
  align?: "left" | "right";
  variant?: "solid" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          variant === "ghost"
            ? "justify-start border border-transparent hover:bg-surface-2"
            : "justify-between border border-hairline-2 bg-surface hover:border-ink-2/40"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className={`truncate ${current ? "text-ink" : "text-muted"}`}>
            {current ? current.label : placeholder}
          </span>
        </span>
        <Chevron width={15} height={15} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-1.5 max-h-60 w-max min-w-full max-w-[min(22rem,80vw)] overflow-auto rounded-xl border border-hairline bg-surface p-1 shadow-[0_12px_32px_rgba(27,27,31,0.14)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                o.value === value ? "bg-accent-soft text-accent-hover" : "text-ink hover:bg-surface-2"
              }`}
            >
              <span className="whitespace-normal break-words">{o.label}</span>
              {o.value === value && <Check width={15} height={15} className="mt-0.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ NoteArea ------------------------------- */

/** Borderless rich-text note. Enter = new line; highlight to strike through. Optional bullet gutter. */
export function NoteArea({
  value,
  onChange,
  bullets = true,
  placeholder = "Write a note… press Enter for a new line",
}: {
  value: string;
  onChange: (v: string) => void;
  bullets?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onSelect = () => {
      const el = ref.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return setTip(null);
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return setTip(null);
      const r = range.getBoundingClientRect();
      const p = el.getBoundingClientRect();
      setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top });
    };
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, []);

  const emit = () => ref.current && onChange(ref.current.innerHTML);
  const toggleStrike = () => {
    document.execCommand("strikeThrough");
    emit();
    window.getSelection()?.collapseToEnd();
    setTip(null);
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        className={bullets ? "note-area" : "note-area note-plain"}
      />
      {tip && (
        <div
          style={{ left: tip.x, top: tip.y }}
          className="absolute z-50 -translate-x-1/2 -translate-y-[calc(100%+7px)] rounded-lg bg-tip-bg px-1 py-1 shadow-[0_8px_24px_rgba(27,27,31,0.25)]"
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              toggleStrike();
            }}
            className="flex h-7 items-center rounded-md px-2.5 text-sm font-semibold text-white line-through transition-colors hover:bg-white/15"
            title="Strike through"
          >
            S
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- AssigneePicker ---------------------------- */

/** Attach team members; selected show as an overlapping avatar stack. */
export function AssigneePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const { people } = usePeople();
  const selected = people.filter((p) => value.includes(p.id));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-hairline-2 bg-surface px-2.5 py-1.5 text-left transition-colors hover:border-ink-2/40"
      >
        {selected.length === 0 ? (
          <span className="text-sm text-muted">Add team members…</span>
        ) : (
          <div className="flex items-center -space-x-2">
            {selected.map((p) => (
              <span key={p.id} className="rounded-full ring-2 ring-surface">
                <Avatar name={p.name} tint={p.tint} size="sm" />
              </span>
            ))}
          </div>
        )}
        <Chevron
          width={15}
          height={15}
          className={`ml-auto shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-hairline bg-surface p-1 shadow-[0_12px_32px_rgba(27,27,31,0.14)]">
          {people.map((p) => {
            const on = value.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  on ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <Avatar name={p.name} tint={p.tint} size="sm" tip={false} />
                <span className="flex-1 text-sm text-ink">{p.name}</span>
                <span className="text-[11px] text-muted">{p.role}</span>
                {on && <Check width={15} height={15} className="text-accent-hover" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- ProfileMenu ----------------------------- */

export function ProfileMenu({
  person,
  onSignOut,
}: {
  person: { name: string; tint: number };
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
      >
        <Avatar name={person.name} tint={person.tint} size="sm" tip={false} />
        <span className="hidden text-sm font-medium text-ink sm:inline">{person.name}</span>
        <Chevron width={14} height={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-hairline bg-surface p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar name={person.name} tint={person.tint} tip={false} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{person.name}</div>
              <div className="truncate text-[11px] text-muted">Signed in</div>
            </div>
          </div>
          <div className="my-1.5 h-px bg-hairline" />
          <div className="px-2 pb-1">
            <div className="overline mb-1.5">Theme</div>
            <div className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
                    theme === t ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {t === "light" ? <Sun width={14} height={14} /> : <Moon width={14} height={14} />}
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="my-1.5 h-px bg-hairline" />
          <button
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("open-guide"));
            }}
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-2"
          >
            How it works
          </button>
          <button
            onClick={() => {
              setOpen(false);
              if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("open-change-pin"));
              }
            }}
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-2"
          >
            Change PIN
          </button>
          <div className="my-1.5 h-px bg-hairline" />
          <button
            onClick={onSignOut}
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ GuideModal ----------------------------- */

/** A friendly "how it works" walkthrough, shown once on first run and from the menu. */
export function GuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  const steps: { emoji: string; title: string; body: string }[] = [
    {
      emoji: "👋",
      title: "Welcome to Cadence",
      body: "One shared place that shows who is doing what, where, when, and how important for today.",
    },
    {
      emoji: "📝",
      title: "Today: plan your day",
      body: "Add a row for each time block: pick a task, set the start, how long, where, and how important. Place and priority are filled in for you from the task, and you can change them anytime. Jot anything in the Notes panel.",
    },
    {
      emoji: "📅",
      title: "Calendar: see everyone",
      body: "A grid of the whole team across the day, colored by priority. A block shared by several people is a meeting. This answers “where is everyone and what are they doing?” at a glance.",
    },
    {
      emoji: "🗂️",
      title: "Tasks: the work list",
      body: "Managers set up Initiatives (L1) and the Workstreams (L2) under them, with priorities, places, and who’s involved. Everything you schedule comes from this list.",
    },
    {
      emoji: "🔑",
      title: "Your PIN",
      body: "You sign in with a 4-digit PIN. The first time, you’ll be asked to change it to something only you know.",
    },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-sm">
      <div className="max-h-[85dvh] w-full max-w-2xl overflow-auto rounded-2xl bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl text-ink">How Cadence works</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
            <X width={18} height={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">A quick tour. It takes about 30 seconds a day to keep your plan up to date.</p>

        <ul className="mt-5 flex flex-col gap-3">
          {steps.map((s) => (
            <li key={s.title} className="flex gap-3 rounded-xl border border-hairline bg-surface-2/40 p-3.5">
              <span className="text-xl leading-none">{s.emoji}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">{s.title}</div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn btn-primary">Got it</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- ChangePinModal -------------------------- */

export function ChangePinModal({
  isOpen,
  onClose,
  initialOldPin = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialOldPin?: string;
}) {
  const [oldPin, setOldPin] = useState(initialOldPin);
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOldPin(initialOldPin);
      setNewPin("");
      setError("");
    }
  }, [isOpen, initialOldPin]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (oldPin.length !== 4 || newPin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changePinApi(oldPin, newPin);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <h2 className="font-display text-xl text-ink">Change your PIN</h2>
        <p className="mt-2 text-sm text-muted">Pick a 4-digit PIN you can easily remember.</p>

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Current PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
              placeholder="0000"
              className="field text-lg font-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className="field text-lg font-medium"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-high-ink">{error}</p>}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || oldPin.length !== 4 || newPin.length !== 4}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Brand --------------------------------- */

/** The Cadence mark: a beat dot with two pulses radiating out (rhythm over time). */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-[10px] bg-accent"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="11" cy="16" r="2.7" fill="#fff" />
        <path d="M15.5 10a6.6 6.6 0 0 1 0 12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M19.5 6.5a10.4 10.4 0 0 1 0 19" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
      </svg>
    </span>
  );
}

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Cadence home">
      <Mark size={30} />
      <span className="font-display text-[20px] font-medium leading-none text-ink">
        Cadence
        <span className="text-accent">.</span>
      </span>
    </Link>
  );
}

/* ----------------------------- PageFrame ------------------------------- */

const NAV = [
  { key: "today", href: "/", label: "Today" },
  { key: "calendar", href: "/calendar", label: "Calendar" },
  { key: "manage", href: "/manage", label: "Tasks" },
];

export function PageFrame({
  here,
  overline,
  title,
  subtitle,
  lead,
  date,
  person,
  onSignOut,
  actions,
  wide,
  children,
}: {
  here: "today" | "calendar" | "manage";
  overline?: string;
  title?: ReactNode;
  subtitle?: string;
  lead?: ReactNode;
  date?: string;
  person?: { name: string; tint: number };
  onSignOut?: () => void;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const width = wide ? "max-w-[1460px]" : "max-w-[1180px]";
  const navEl = (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {NAV.filter((n) => n.key !== here).map((n) => (
        <Link key={n.key} href={n.href} className="navlink group">
          {n.label}
          <ArrowUpRight
            width={14}
            height={14}
            className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      ))}
    </nav>
  );
  const right = (
    <div className="flex items-center gap-4 sm:gap-5">
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      {actions && <span className="hidden h-5 w-px bg-hairline sm:inline-block" />}
      {navEl}
    </div>
  );
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur">
        <div className={`mx-auto flex h-14 w-full items-center justify-between px-5 sm:px-8 ${width}`}>
          <Brand />
          <div className="flex items-center gap-3 sm:gap-4">
            {date && <span className="hidden text-sm font-medium text-ink-2 md:inline">{date}</span>}
            {date && person && <span className="hidden h-4 w-px bg-hairline sm:inline-block" />}
            {person && onSignOut && <ProfileMenu person={person} onSignOut={onSignOut} />}
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full px-5 pb-16 pt-8 sm:px-8 sm:pt-10 ${width}`}>
        {lead ? (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">{lead}</div>
            {right}
          </div>
        ) : title ? (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div>
              {overline && <div className="overline mb-2">{overline}</div>}
              <h1 className="font-display text-[28px] leading-none text-ink sm:text-[34px]">{title}</h1>
              {subtitle && <p className="mt-2.5 max-w-xl text-sm text-muted">{subtitle}</p>}
            </div>
            {right}
          </div>
        ) : (
          <div className="flex justify-end">{navEl}</div>
        )}

        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}
