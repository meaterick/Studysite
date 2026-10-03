"use client";

import { useEffect, useState } from "react";
import type { Monaco } from "@monaco-editor/react";

export type EditorTheme = "aegis-light" | "aegis-dark";

/**
 * 사이트의 코드 블록과 같은 바탕색·강조색을 쓰는 Monaco 테마 두 개를 등록한다.
 * Editor의 beforeMount에 넘기면 편집기가 그려지기 전에 테마가 준비된다.
 */
export function defineEditorThemes(monaco: Monaco) {
  monaco.editor.defineTheme("aegis-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "7c3aed" },
      { token: "string", foreground: "0f766e" },
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "number", foreground: "b45309" },
    ],
    colors: {
      "editor.background": "#f6f8fb",
      "editorGutter.background": "#f6f8fb",
      "editorLineNumber.foreground": "#a7b0bf",
      "editorLineNumber.activeForeground": "#475569",
      "editor.lineHighlightBackground": "#00000000",
      "editor.selectionBackground": "#3451d12e",
      "editorCursor.foreground": "#0f172a",
      "editorIndentGuide.background1": "#0f172a12",
    },
  });
  monaco.editor.defineTheme("aegis-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c4b5fd" },
      { token: "string", foreground: "5eead4" },
      { token: "comment", foreground: "8a8a8a", fontStyle: "italic" },
      { token: "number", foreground: "fdba74" },
    ],
    colors: {
      "editor.background": "#161616",
      "editorGutter.background": "#161616",
      "editorLineNumber.foreground": "#4a4a4a",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "editor.lineHighlightBackground": "#00000000",
      "editor.selectionBackground": "#8ab4ff33",
      "editorCursor.foreground": "#f5f5f5",
      "editorIndentGuide.background1": "#ffffff12",
    },
  });
}

/** 사이트 테마(라이트/다크)에 맞춰 Monaco 편집기 테마를 고른다. */
export function useEditorTheme(): EditorTheme {
  const [theme, setTheme] = useState<EditorTheme>("aegis-light");
  useEffect(() => {
    const root = document.documentElement;
    const resolve = () => {
      const attr = root.getAttribute("data-theme");
      const dark = attr === "dark" || (attr !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setTheme(dark ? "aegis-dark" : "aegis-light");
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
