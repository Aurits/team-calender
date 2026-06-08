"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import type { Priority } from "@/lib/types";
import { initialsOf, people, priorityMeta, tintClass } from "@/lib/data";

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
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-100 group-hover/av:opacity-100">
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
          className="absolute z-50 -translate-x-1/2 -translate-y-[calc(100%+7px)] rounded-lg bg-ink px-1 py-1 shadow-[0_8px_24px_rgba(27,27,31,0.25)]"
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
                <Avatar name={p.name} tint={p.tint} size="sm" />
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
            {person && (
              <span className="hidden sm:inline-flex">
                <Avatar name={person.name} tint={person.tint} size="sm" />
              </span>
            )}
            {person && <span className="hidden text-sm font-medium text-ink lg:inline">{person.name}</span>}
            {onSignOut && (
              <button onClick={onSignOut} className="navlink text-muted hover:text-ink">
                Sign out
              </button>
            )}
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
