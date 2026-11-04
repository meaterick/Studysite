"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/lib/monacoSetup";
import Editor, { type OnMount } from "@monaco-editor/react";
import { loadCellCode, resetCellCode, saveCellCode } from "@/lib/codeStore";
import { forceStop, preloadPyodide, runPython, type RunStatus } from "@/lib/pyRunner";
import { useUserScope } from "./UserScope";
import { defineEditorThemes, useEditorTheme } from "./assignment/useEditorTheme";
import Icon from "./Icon";

const STATUS_LABEL: Record<RunStatus, string> = {
  "loading-runtime": "Python 실행 환경을 준비하고 있습니다. 처음 한 번은 몇 초 정도 걸립니다.",
  "loading-packages": "필요한 패키지를 불러오고 있습니다…",
  running: "실행 중…",
};

export default function CodeCell({
  cellId: rawCellId,
  starterCode,
  onComplete,
  autoRun = false,
}: {
  cellId: string;
  starterCode: string;
  /** 성공적으로 한 번 실행되었을 때 호출된다 */
  onComplete?: () => void;
  /** 편집기를 연 직후 바로 한 번 실행한다(정적 코드 블록의 ▶ 실행 버튼에서 넘어온 경우) */
  autoRun?: boolean;
}) {
  // 공용 브라우저에서 다른 계정이 작성한 코드가 보이지 않도록 계정별로 키를 나눈다.
  const uid = useUserScope();
  const cellId = `${uid}::${rawCellId}`;
  const [code, setCode] = useState(starterCode);
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [output, setOutput] = useState<{ stream: "stdout" | "stderr"; text: string }[]>([]);
  const [errored, setErrored] = useState(false);
  const theme = useEditorTheme();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCellCode(cellId).then((saved) => {
      if (cancelled) return;
      // 저장된 코드가 없으면 예제 코드로 되돌린다 — 계정이 바뀌었을 때
      // 이전 계정이 작성하던 코드가 화면에 남아있지 않도록.
      setCode(saved ?? starterCode);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [cellId, starterCode]);

  // 코드 셀이 화면에 보이면 Pyodide를 미리 준비시켜, 사용자가 실행 버튼을
  // 눌렀을 때 로딩을 기다리는 시간을 줄인다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          preloadPyodide();
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? "";
      setCode(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveCellCode(cellId, next), 400);
    },
    [cellId]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    setErrored(false);
    setOutput([]);
    setStatus("loading-runtime");
    const result = await runPython(code, {
      onStatus: setStatus,
      onStream: (stream, text) => setOutput((prev) => [...prev, { stream, text }]),
    });
    setStatus(null);
    setRunning(false);
    if (!result.ok) {
      setErrored(true);
      setOutput((prev) => [...prev, { stream: "stderr", text: result.error ?? "알 수 없는 오류" }]);
    } else {
      if (result.result !== undefined) {
        setOutput((prev) => [...prev, { stream: "stdout", text: result.result! }]);
      }
      onComplete?.();
    }
  }, [code, onComplete]);

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRun && loaded && !autoRan.current) {
      autoRan.current = true;
      void handleRun();
    }
  }, [autoRun, loaded, handleRun]);

  const handleStop = useCallback(() => {
    forceStop();
    setRunning(false);
    setStatus(null);
    setOutput((prev) => [...prev, { stream: "stderr", text: "(실행을 중단했습니다)" }]);
  }, []);

  const handleReset = useCallback(async () => {
    if (!confirm("코드를 처음 상태로 되돌리시겠습니까? 수정한 내용은 사라집니다.")) return;
    await resetCellCode(cellId);
    setCode(starterCode);
    setOutput([]);
    setErrored(false);
  }, [cellId, starterCode]);

  const handleMount: OnMount = (editor) => {
    editor.updateOptions({ minimap: { enabled: false } });
  };

  const lineCount = Math.max(code.split("\n").length, 3);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 16, 90), 420);
  // 저장된 코드를 읽는 동안과 Monaco가 뜨는 동안에도 같은 높이로 코드를 보여 줘서
  // 편집기로 바뀔 때 화면이 출렁이지 않게 한다.
  const placeholder = (
    <pre
      aria-busy="true"
      style={{ height: editorHeight }}
      className="m-0 w-full overflow-hidden bg-[var(--code-bg)] px-4 py-2.5 font-mono text-[12.5px] leading-[19px] text-ink"
    >
      {code}
    </pre>
  );

  return (
    <div ref={containerRef} className="not-prose overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--code-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] py-1.5 pl-4 pr-2">
        <span className="font-mono text-[11px] text-ink-muted">Python · 편집·실행 가능</span>
        <div className="flex items-center gap-1">
          <button onClick={handleReset} className="btn btn-ghost btn-sm min-h-7 px-3 text-xs">
            초기화
          </button>
          {running ? (
            <button onClick={handleStop} className="btn btn-danger btn-sm min-h-7 px-3 text-xs">
              중단
            </button>
          ) : (
            <button onClick={handleRun} disabled={!loaded} className="btn btn-primary btn-sm min-h-7 px-3 text-xs">
              <Icon name="play" size={12} />
              실행
            </button>
          )}
        </div>
      </div>
      {loaded ? (
        <Editor
          height={editorHeight}
          defaultLanguage="python"
          value={code}
          onChange={onChange}
          theme={theme}
          beforeMount={defineEditorThemes}
          onMount={handleMount}
          options={{
            fontSize: 12.5,
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: "none",
          }}
          loading={placeholder}
        />
      ) : (
        placeholder
      )}
      {(status || output.length > 0) && (
        <div className="border-t border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-3 font-mono text-[12.5px] leading-relaxed">
          {status && <p className="text-ink-muted">{STATUS_LABEL[status]}</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap break-words ${line.stream === "stderr" ? "text-[var(--status-critical)]" : "text-ink-body"}`}>
              {line.text}
            </pre>
          ))}
          {errored && output.length === 0 && <p className="text-[var(--status-critical)]">실행 중에 오류가 발생했습니다.</p>}
        </div>
      )}
    </div>
  );
}
