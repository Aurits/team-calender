"use client";

import { useEffect, useState } from "react";

interface Health {
  backend: string;
  ok: boolean;
  people?: number;
  error?: string;
}

/**
 * A small fixed pill showing which data backend is live (Postgres / Sheets) and
 * whether it responds. Reads /api/health once on mount. Handy while migrating;
 * remove the <BackendBadge /> from layout.tsx when no longer needed.
 */
export function BackendBadge() {
  const [h, setH] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setH)
      .catch(() => setH({ backend: "unknown", ok: false, error: "unreachable" }));
  }, []);

  if (!h) return null;

  const label = h.backend === "sheets" ? "Sheets" : h.backend === "postgres" ? "Postgres" : h.backend;
  const dot = !h.ok ? "bg-high" : h.backend === "sheets" ? "bg-accent" : "bg-low";
  const tip = h.ok
    ? `${label} backend · ${h.people ?? 0} people loaded`
    : `${label} backend error: ${h.error ?? "unknown"}`;

  return (
    <div
      title={tip}
      className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-hairline bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-muted shadow-sm backdrop-blur"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
      {!h.ok && <span className="text-high-ink">· offline</span>}
    </div>
  );
}
