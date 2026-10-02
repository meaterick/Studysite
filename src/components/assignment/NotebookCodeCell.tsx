"use client";

import { useEffect, useRef, useState } from "react";
import "@/lib/monacoSetup";
import Editor, { type OnMount } from "@monaco-editor/react";
import CodeBlock from "@/components/CodeBlock";
import type { NotebookCell } from "@/lib/notebook";
import CellOutputs from "./CellOutputs";
import { useEditorTheme } from "./useEditorTheme";

/**
 * 과제 노트북의 코드 셀. 화면 근처에 오기 전까지는 가벼운 정적 코드 블록으로 보여 주고,
 * 가까워지면 Monaco 편집기로 바꾼다(셀이 많아도 처음 열 때 느려지지 않도록).
 */
export default function NotebookCodeCell({
  cell,
  label,
  execCount,
  running,
  status,
  disabled,
  onChange,
  onRun,
  onReset,
  onDelete,
}: {
  cell: NotebookCell;
  label?: string;
  execCount?: number;
  running: boolean;
  status?: string | null;
  disabled?: boolean;
  onChange: (source: string) => void;
  onRun: () => void;
  /** 명세 셀이면 시작 코드로 되돌리기 */
  onReset?: () => void;
  /** 학습자가 추가한 셀이면 삭제 */
  onDelete?: () => void;
}) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const runRef = useRef(onRun);
  const theme = useEditorTheme();

  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  const handleMount: OnMount = (editor, monaco) => {
    editor.updateOptions({ minimap: { enabled: false } });
    // Shift+Enter로 셀 실행 (Jupyter와 같은 단축키)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => runRef.current());
  };

  const lineCount = Math.max(cell.source.split("\n").length, 3);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 90), 520);
  const state = !cell.executedAt
    ? { text: "실행 전", cls: "text-ink-muted" }
    : cell.stale
      ? { text: "수정됨 · 다시 실행 필요", cls: "text-[var(--status-serious)]" }
      : cell.runOk
        ? { text: "실행 완료", cls: "text-[var(--status-good)]" }
        : { text: "오류", cls: "text-[var(--status-critical)]" };

  return (
    <div ref={ref} className="not-prose overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="font-mono font-bold text-ink-muted">[{execCount ?? " "}]</span>
          <span className="truncate font-bold text-ink-secondary">{label ?? (cell.custom ? "추가한 코드 셀" : "코드")}</span>
          <span className={`font-bold ${state.cls}`}>· {state.text}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={running}
              className="rounded px-2 py-1 text-xs font-medium text-ink-muted hover:bg-card hover:text-ink-secondary disabled:opacity-40"
            >
              시작 코드로
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={running}
              className="rounded px-2 py-1 text-xs font-medium text-ink-muted hover:bg-card hover:text-[var(--status-critical)] disabled:opacity-40"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={running || disabled}
            title="Shift+Enter"
            className="btn btn-primary btn-sm"
          >
            {running ? "실행 중…" : "▶ 실행"}
          </button>
        </div>
      </div>
      {active ? (
        <Editor
          height={editorHeight}
          defaultLanguage="python"
          value={cell.source}
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
            readOnly: running,
          }}
        />
      ) : (
        <div onClick={() => setActive(true)} className="cursor-text">
          <CodeBlock lang="python" code={cell.source || " "} />
        </div>
      )}
      <CellOutputs outputs={cell.outputs} status={status} />
    </div>
  );
}
