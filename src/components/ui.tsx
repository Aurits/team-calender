"use client";

import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import type { Priority } from "@/lib/types";
import { initialsOf, priorityMeta, tintClass } from "@/lib/data";

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

/* ------------------------------- Avatar -------------------------------- */

export function Avatar({
  name,
  tint,
  size = "md",
}: {
  name: string;
  tint: number;
  size?: "sm" | "md" | "lg";
}) {
  const t = tintClass[tint] ?? tintClass[1];
  const dim =
    size === "sm"
      ? "h-6 w-6 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-9 w-9 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${t.bg} ${t.text} ${dim}`}
      title={name}
    >
      {initialsOf(name)}
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
  { key: "today", href: "/", label: "Your day" },
  { key: "calendar", href: "/calendar", label: "Team calendar" },
  { key: "manage", href: "/manage", label: "Tasks" },
];

export function PageFrame({
  here,
  overline,
  title,
  subtitle,
  person,
  onSignOut,
  actions,
  wide,
  children,
}: {
  here: "today" | "calendar" | "manage";
  overline?: string;
  title: ReactNode;
  subtitle?: string;
  person?: { name: string; tint: number };
  onSignOut?: () => void;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const width = wide ? "max-w-[1460px]" : "max-w-[1180px]";
  return (
    <div className="min-h-dvh">
      <header className="border-b border-hairline bg-canvas/80 backdrop-blur">
        <div className={`mx-auto flex h-14 w-full items-center justify-between px-5 sm:px-8 ${width}`}>
          <Brand />
          {person && (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 sm:flex">
                <Avatar name={person.name} tint={person.tint} size="sm" />
                <span className="text-sm font-medium text-ink">{person.name}</span>
              </span>
              {onSignOut && (
                <button onClick={onSignOut} className="navlink text-muted hover:text-ink">
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto w-full px-5 pb-16 pt-8 sm:px-8 sm:pt-10 ${width}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {overline && <div className="overline mb-2">{overline}</div>}
            <h1 className="font-display text-[28px] leading-none text-ink sm:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-2.5 max-w-xl text-sm text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <div className="mt-7">{children}</div>

        <footer className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-hairline pt-6">
          <span className="overline">Go to</span>
          {NAV.filter((n) => n.key !== here).map((n) => (
            <Link key={n.key} href={n.href} className="navlink">
              {n.label}
              <ArrowUpRight width={15} height={15} />
            </Link>
          ))}
        </footer>
      </main>
    </div>
  );
}
