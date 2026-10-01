"use client";

import { useEffect, useRef } from "react";
import "@/lib/monacoSetup";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useEditorTheme } from "@/components/assignment/useEditorTheme";

/** TODO 실습용 Monaco 편집기. Shift+Enter로 실행, Ctrl(⌘)+Enter로 채점한다. */
export default function LabEditor({
  value,
  onChange,
  onRun,
  onGrade,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onGrade: () => void;
  readOnly?: boolean;
}) {
  const theme = useEditorTheme();
  const runRef = useRef(onRun);
  const gradeRef = useRef(onGrade);
  useEffect(() => {
    runRef.current = onRun;
    gradeRef.current = onGrade;
  }, [onRun, onGrade]);

  const handleMount: OnMount = (editor, monaco) => {
    editor.updateOptions({ minimap: { enabled: false } });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => runRef.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => gradeRef.current());
  };

  const lineCount = Math.max(value.split("\n").length, 4);
  const height = Math.min(Math.max(lineCount * 19 + 20, 110), 560);

  return (
    <Editor
      height={height}
      defaultLanguage="python"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      theme={theme}
      onMount={handleMount}
      loading={<div className="py-6 text-center text-xs text-ink-muted">편집기를 불러오고 있습니다…</div>}
      options={{
        fontSize: 12.5,
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 10, bottom: 10 },
        renderLineHighlight: "none",
        tabSize: 4,
        readOnly,
      }}
    />
  );
}
