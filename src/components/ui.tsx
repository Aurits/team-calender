import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Priority } from "@/lib/types";
import { initialsOf, priorityMeta, tintClass } from "@/lib/data";

/* ------------------------------- Avatar -------------------------------- */

export function Avatar({
  name,
  tint,
  size = "md",
  ring = false,
}: {
  name: string;
  tint: number;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
}) {
  const t = tintClass[tint] ?? tintClass[1];
  const dim =
    size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${t.bg} ${t.text} ${dim} ${
        ring ? "ring-2 ring-surface" : ""
      }`}
      title={name}
    >
      {initialsOf(name)}
    </span>
  );
}

/* ----------------------------- PriorityTag ----------------------------- */

export function PriorityTag({ priority, subtle }: { priority: Priority; subtle?: boolean }) {
  const m = priorityMeta[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        subtle ? "bg-transparent" : m.soft
      } ${m.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden />
      {m.label}
    </span>
  );
}

/* -------------------------------- Pill --------------------------------- */

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs text-ink-2 ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Button ------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  icon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:bg-accent-hover border border-transparent"
      : variant === "ghost"
        ? "bg-transparent text-ink-2 hover:bg-surface-2 border border-transparent"
        : "bg-surface text-ink hover:bg-surface-2 border border-hairline-strong";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/* --------------------------------- Card -------------------------------- */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(20,20,17,0.04),0_1px_3px_rgba(20,20,17,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ----------------------------- PageHeader ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
