"use client";

import { useEffect, useState } from "react";
import { GuideModal } from "@/components/ui";

const SEEN = "cadence:welcomeSeen";

/**
 * Owns the "How it works" guide globally (mounted once in the layout). It opens on
 * the `open-guide` event — dispatched by the menu item and, on first run, by the
 * Today page — and marks itself seen on close so it doesn't reappear on this device.
 */
export function GuideHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("open-guide", openIt);
    return () => window.removeEventListener("open-guide", openIt);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN, "true");
    } catch {}
  };

  return <GuideModal isOpen={open} onClose={close} />;
}
