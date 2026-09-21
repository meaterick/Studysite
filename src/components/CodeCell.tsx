"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { loadCellCode, resetCellCode, saveCellCode } from "@/lib/codeStore";
import { forceStop, preloadPyodide, runPython, type RunStatus } from "@/lib/pyRunner";
import { useUserScope } from "./UserScope";

const STATUS_LABEL: Record<RunStatus, string> = {
  "loading-runtime": "Python 실행 환경을 준비하는 중… (처음 한 번만, 몇 초 정도 걸립니다)",
  "loading-packages": "필요한 패키지를 불러오는 중…",
  running: "실행 중…",
};

function useEditorTheme() {
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

export default function CodeCell({
  cellId: rawCellId,
  starterCode,
  onComplete,
}: {
  cellId: string;
  starterCode: string;
  /** 과제 등 순차 공개 흐름에서, 성공적으로 한 번 실행되면 다음 단계를 열어줄 때 사용 */
  onComplete?: () => void;
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

  const handleStop = useCallback(() => {
    forceStop();
    setRunning(false);
    setStatus(null);
    setOutput((prev) => [...prev, { stream: "stderr", text: "(사용자가 실행을 중단했습니다)" }]);
  }, []);

  const handleReset = useCallback(async () => {
    if (!confirm("이 코드를 원래 예제 코드로 되돌릴까요? 작성한 내용이 사라집니다.")) return;
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

  return (
    <div ref={containerRef} className="not-prose overflow-hidden rounded-lg border border-[var(--border-hairline)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Python · 직접 실행</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="rounded px-2 py-1 text-xs font-medium text-ink-muted hover:bg-[var(--surface-card)] hover:text-ink-secondary"
          >
            초기화
          </button>
          {running ? (
            <button
              onClick={handleStop}
              className="rounded-md bg-[var(--status-bad)] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
            >
              중단
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!loaded}
              className="rounded-md bg-[var(--series-blue)] px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              ▶ 실행
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
        />
      ) : (
        <div className="flex items-center justify-center bg-[var(--surface-card)] py-8 text-xs text-ink-muted">
          불러오는 중…
        </div>
      )}
      {(status || output.length > 0) && (
        <div className="border-t border-[var(--border-hairline)] bg-[#0d1117] px-4 py-2.5 font-mono text-[12.5px] leading-relaxed">
          {status && <p className="text-ink-muted/70">{STATUS_LABEL[status]}</p>}
          {output.map((line, i) => (
            <pre
              key={i}
              className={`whitespace-pre-wrap break-words ${line.stream === "stderr" ? "text-[var(--status-bad)]" : "text-[#c9d1d9]"}`}
            >
              {line.text}
            </pre>
          ))}
          {errored && output.length === 0 && <p className="text-[var(--status-bad)]">실행 중 오류가 발생했습니다.</p>}
        </div>
      )}
    </div>
  );
}
