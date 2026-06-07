"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, CaptureIcon, LayersIcon } from "./icons";

const items = [
  { href: "/", label: "Overview", icon: CalendarIcon, desc: "The shared calendar" },
  { href: "/capture", label: "Capture", icon: CaptureIcon, desc: "Plan your day" },
  { href: "/manage", label: "Manage", icon: LayersIcon, desc: "Tasks & priorities" },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
        {/* abstract "rhythm" mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 14V10M10 18V6M14 16V8M19 13v-2" />
        </svg>
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-ink">Cadence</div>
        <div className="text-[11px] text-muted">Team schedule</div>
      </div>
    </div>
  );
}

/** Desktop left rail. */
export function Sidebar() {
  const isActive = useActive();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hairline bg-surface px-3 py-5 md:flex">
      <div className="px-2.5">
        <Brand />
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {items.map((it) => {
          const active = isActive(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-colors ${
                active ? "bg-accent-soft text-accent-hover" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon className={active ? "text-accent" : "text-muted group-hover:text-ink-2"} />
              <span className="flex flex-col">
                <span className={`font-medium ${active ? "text-accent-hover" : "text-ink"}`}>
                  {it.label}
                </span>
                <span className="text-[11px] text-muted">{it.desc}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-hairline bg-surface-2 px-3 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-ink-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Prototype
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          Sample data. Sheets connect after sign-off.
        </p>
      </div>
    </aside>
  );
}

/** Mobile bottom bar. */
export function BottomNav() {
  const isActive = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-hairline bg-surface/95 backdrop-blur md:hidden">
      {items.map((it) => {
        const active = isActive(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon width={20} height={20} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
