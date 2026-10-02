"use client";

import { useId, useState, type ReactNode } from "react";
import { runPython, type RunStatus } from "@/lib/pyRunner";
import { buildAutoTestProgram, parseAutoTestResults, type AutoTestResult } from "@/lib/labHarness";
import Icon from "@/components/Icon";

export interface AutoTestView {
  id: string;
  title: string;
  taskTitle: string;
  code: string;
  /** 서버에서 렌더링한 도움말 */
  hint?: ReactNode;
}

const STATUS_TEXT: Record<RunStatus, string> = {
  "loading-runtime": "Python 실행 환경을 준비하고 있습니다…",
  "loading-packages": "필요한 패키지를 불러오고 있습니다…",
  running: "자동 테스트를 실행하고 있습니다…",
};

/**
 * 과제 자동 테스트. 학습자가 실행한 코드 셀의 변수가 들어 있는 이름공간(ns)에서, 브라우저 Pyodide로 실행한다.
 * 결과는 서버에 저장하지 않는다. 운영자 화면에서는 제출본을 다시 실행한 이름공간에 같은 테스트를 돌린다.
 */
export default function AutoTestPanel({
  ns,
  tests,
  beforeRun,
  beforeRunLabel = "전체 실행 후 테스트",
  disabled,
  note,
}: {
  ns: string;
  tests: AutoTestView[];
  /** 테스트 전에 셀을 모두 실행한다. false를 돌려주면 테스트를 하지 않는다. */
  beforeRun?: () => Promise<boolean>;
  beforeRunLabel?: string;
  disabled?: boolean;
  note?: string;
}) {
  const [results, setResults] = useState<Record<string, AutoTestResult> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const headingId = useId();

  const run = async (withCells: boolean) => {
    setRunning(true);
    setError(null);
    try {
      if (withCells && beforeRun) {
        setStatus("코드 셀을 위에서부터 차례로 실행하고 있습니다…");
        const ok = await beforeRun();
        if (!ok) {
          setStatus(null);
          setError("코드 셀 실행이 오류로 멈춰 자동 테스트를 하지 않았습니다. 오류가 난 셀을 먼저 고쳐 주십시오.");
          return;
        }
      }
      const res = await runPython(buildAutoTestProgram(tests), { onStatus: (s) => setStatus(STATUS_TEXT[s]) }, { ns });
      const parsed = res.ok ? parseAutoTestResults(res.result) : null;
      if (!parsed) {
        setError(`자동 테스트를 실행하지 못했습니다. ${res.error ?? ""}`);
        return;
      }
      setResults(Object.fromEntries(parsed.map((r) => [r.id, r])));
    } finally {
      setStatus(null);
      setRunning(false);
    }
  };

  const passed = results ? tests.filter((t) => results[t.id]?.ok).length : 0;

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-[var(--border-hairline)] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={headingId} className="text-base font-bold tracking-[-0.02em] text-ink">
          자동 테스트
          {results && (
            <span className={`ml-2 text-sm ${passed === tests.length ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
              {passed}/{tests.length} 통과
            </span>
          )}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {beforeRun && (
            <button
              type="button"
              onClick={() => void run(true)}
              disabled={running || disabled}
              className="btn btn-primary btn-sm"
            >
              {beforeRunLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => void run(false)}
            disabled={running || disabled}
            className="btn btn-secondary btn-sm"
          >
            테스트만 실행
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {note ??
          "실행한 코드의 변수와 함수를 검사합니다. 통과는 최소 조건이며, 점수는 운영자가 채점 기준에 따라 매깁니다."}
      </p>
      {status && <p className="mt-2 text-xs text-ink-muted">{status}</p>}
      {error && <p className="mt-2 text-sm text-[var(--status-critical)]">{error}</p>}
      <ul className="mt-3 space-y-1.5 text-sm">
        {tests.map((t) => {
          const r = results?.[t.id];
          return (
            <li key={t.id} className="rounded-xl border border-[var(--border-hairline)] px-4 py-3">
              <p className={`flex flex-wrap items-center gap-x-2 font-medium ${r ? (r.ok ? "text-[var(--status-good)]" : "text-[var(--status-critical)]") : "text-ink-secondary"}`}>
                {r ? (
                  <Icon name={r.ok ? "check" : "close"} size={15} strokeWidth={2} />
                ) : (
                  <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-[var(--border-strong)]" />
                )}
                {t.title}
                <span className="text-xs font-normal text-ink-muted">{t.taskTitle}</span>
                <span className="sr-only">{r ? (r.ok ? " (통과)" : " (미통과)") : " (실행 전)"}</span>
              </p>
              {r && !r.ok && (
                <div className="mt-1 space-y-1 text-xs">
                  {r.message && <p className="whitespace-pre-wrap break-words font-mono text-[var(--status-critical)]">{r.message}</p>}
                  {t.hint && <p className="text-ink-muted">도움말: {t.hint}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
