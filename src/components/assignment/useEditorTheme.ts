"use client";

import { useEffect, useState } from "react";

/** 사이트 테마(라이트/다크)에 맞춰 Monaco 편집기 테마를 고른다. */
export function useEditorTheme(): "vs" | "vs-dark" {
  const [theme, setTheme] = useState<"vs" | "vs-dark">("vs");
  useEffect(() => {
    const root = document.documentElement;
    const resolve = () => {
      const attr = root.getAttribute("data-theme");
      const dark = attr === "dark" || (attr !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setTheme(dark ? "vs-dark" : "vs");
    };
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", resolve);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", resolve);
    };
  }, []);
  return theme;
}
