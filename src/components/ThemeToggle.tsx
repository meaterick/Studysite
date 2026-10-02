"use client";

import { useSyncExternalStore } from "react";
import Icon from "./Icon";

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

  // 지금 화면 모드의 반대쪽 아이콘을 보여 준다(화이트 모드 → 달, 블랙 모드 → 해).
  // 시스템 설정을 따르는 경우 서버는 어느 쪽인지 모르므로 두 아이콘을 모두 그리고 CSS로 하나만 보인다.
  return (
    <button onClick={toggle} aria-label="화면 모드 전환" title="화면 모드 전환" className="icon-btn">
      <Icon name="moon" size={17} className="theme-moon" />
      <Icon name="sun" size={18} className="theme-sun" />
    </button>
  );
}
