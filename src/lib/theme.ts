"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "cadence:theme";

export function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", t === "dark");
}

/** Read the persisted/preferred theme and keep it applied. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "light";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(KEY, t);
    applyTheme(t);
    setThemeState(t);
  };

  return [theme, setTheme];
}
