"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | null;

const listeners = new Set<() => void>();
let cached: Theme = null;

function readTheme(): Theme {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Theme {
  if (cached === null) cached = readTheme();
  return cached;
}

function getServerSnapshot(): Theme {
  return null;
}

function setTheme(theme: "light" | "dark") {
  cached = theme;
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((l) => l());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = theme ?? (prefersDark ? "dark" : "light");
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label="테마 전환"
      className="rounded-full border border-[var(--border-hairline)] p-2 text-ink-secondary transition hover:border-[var(--border-strong)] hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}
