"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import CodeBlock from "@/components/CodeBlock";
import CellOutputs from "@/components/assignment/CellOutputs";
import { useUserScope } from "@/components/UserScope";
import TierBadge from "@/components/TierBadge";
import type { Tier } from "@/content/tiers";
import { loadCellCode, resetCellCode, saveCellCode } from "@/lib/codeStore";
import { forceStop, preloadPyodide, resetNamespace, runPython, type RunHandlers, type RunStatus } from "@/lib/pyRunner";
import { buildGradeProgram, countTodos, parseGradeReport, type LabGradeReport } from "@/lib/labHarness";
import type { NotebookOutput } from "@/lib/notebook";
import { getExerciseSolution, recordExerciseGrade, recordExerciseHint } from "@/lib/labActions";

const LabEditor = dynamic(() => import("./LabEditor"), {
  ssr: false,
  loading: () => <div className="py-8 text-center text-xs text-ink-muted">코드 편집기를 불러오고 있습니다…</div>,
});

export interface ExerciseView {
  slug: string;
  id: string;
  title: string;
  tier: Tier;
  /** 서버에서 렌더링한 문제 설명 */
  prompt: ReactNode;
  starter: string;
  tests: string;
  /** 서버에서 렌더링한 단계별 힌트 */
  hints: ReactNode[];
  /** 연결된 단계(단계 실습일 때) */
  section?: { label: string; title: string; href: string };
  state: { attempts: number; bestPassed: number; hintsUsed: number; passed: boolean };
  /** 잠겨 있으면 그 이유 */
  locked?: string;
}

const STATUS_TEXT: Record<RunStatus, string> = {
  "loading-runtime": "Python 실행 환경을 준비하고 있습니다. 처음 한 번은 몇 초 정도 걸립니다.",
  "loading-packages": "필요한 패키지를 불러오고 있습니다…",
  running: "실행 중…",
};

/** 실행이 이 시간을 넘기면 무한 루프로 보고 실행 환경을 다시 시작한다(패키지 로딩 시간은 제외). */
const TIME_LIMIT_MS = 30_000;

function countTests(tests: string): number {
  return (tests.match(/@test\(/g) ?? []).length;
}

/**
 * 학습자가 TODO를 직접 채우는 실습 문제. 코드는 브라우저의 Pyodide에서만 실행된다.
 * 실행: 내 코드만 실행해 출력 확인 / 채점: 빈 이름공간에서 내 코드를 실행한 뒤 채점 코드로 검사.
 */
export default function CodingExercise({ view }: { view: ExerciseView }) {
  const uid = useUserScope();
  const storeKey = `${uid}::lab:${view.id}`;
  const total = countTests(view.tests);
  const [code, setCodeState] = useState(view.starter);
  // 실행·채점은 렌더를 기다리지 않고 편집기의 최신 내용을 읽는다(마지막 입력 직후 Ctrl+Enter를 눌러도 이전 코드로 채점하지 않도록).
  const codeRef = useRef(view.starter);
  const setCode = useCallback((next: string) => {
    codeRef.current = next;
    setCodeState(next);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState<"run" | "grade" | null>(null);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [outputs, setOutputs] = useState<NotebookOutput[]>([]);
  const [report, setReport] = useState<LabGradeReport | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(view.state.attempts);
  const [best, setBest] = useState(view.state.bestPassed);
  const [passed, setPassed] = useState(view.state.passed);
  const [hintsShown, setHintsShown] = useState(Math.min(view.state.hintsUsed, view.hints.length));
  const [solution, setSolution] = useState<string | null>(null);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadCellCode(storeKey).then((saved) => {
      if (cancelled) return;
      setCode(saved ?? view.starter);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storeKey, view.starter, setCode]);

  // 화면 근처에 오면 편집기를 활성화하고 Pyodide를 미리 준비한다.
  useEffect(() => {
    if (active || view.locked) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          preloadPyodide();
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, view.locked]);

  const onChange = useCallback(
    (next: string) => {
      setCode(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveCellCode(storeKey, next), 400);
    },
    [storeKey, setCode]
  );

  const execute = useCallback(async (program: string, ns: string, onStream?: RunHandlers["onStream"]) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let timedOut = false;
    await resetNamespace(ns);
    const res = await runPython(
      program,
      {
        onStatus: (s) => {
          setStatus(s);
          if (s === "running" && !timer) {
            timer = setTimeout(() => {
              timedOut = true;
              forceStop();
            }, TIME_LIMIT_MS);
          }
        },
        onStream,
      },
      { ns }
    );
    if (timer) clearTimeout(timer);
    setStatus(null);
    return { res, timedOut };
  }, []);

  const handleRun = useCallback(async () => {
    if (busy) return;
    setBusy("run");
    setReport(null);
    setNotice(null);
    const collected: NotebookOutput[] = [];
    setOutputs([]);
    const { res, timedOut } = await execute(codeRef.current, `lab-run:${view.id}`, (name, text) => {
      collected.push({ type: "stream", name, text });
      setOutputs([...collected]);
    });
    if (res.ok && res.result !== undefined) collected.push({ type: "result", text: res.result });
    if (!res.ok) collected.push({ type: "error", text: res.error ?? "알 수 없는 오류가 발생했습니다." });
    for (const img of res.images ?? []) collected.push({ type: "image", data: img });
    setOutputs([...collected]);
    if (timedOut) setNotice(`실행 시간이 ${TIME_LIMIT_MS / 1000}초를 넘어 중단했습니다. 끝나지 않는 반복문이 없는지 확인하십시오.`);
    setBusy(null);
  }, [busy, execute, view.id]);

  const handleGrade = useCallback(async () => {
    if (busy) return;
    setBusy("grade");
    setNotice(null);
    setOutputs([]);
    setReport(null);
    const { res, timedOut } = await execute(buildGradeProgram(codeRef.current, view.tests), `lab-grade:${view.id}`);
    const rep = res.ok ? parseGradeReport(res.result) : null;
    setBusy(null);
    if (!rep) {
      setNotice(
        timedOut
          ? `채점 시간이 ${TIME_LIMIT_MS / 1000}초를 넘어 중단했습니다. 끝나지 않는 반복문이 없는지 확인하십시오.`
          : `채점을 마치지 못했습니다. ${res.error ?? ""}`
      );
      return;
    }
    setReport(rep);
    const out: NotebookOutput[] = [];
    if (rep.stdout) out.push({ type: "stream", name: "stdout", text: rep.stdout.replace(/\n$/, "") });
    for (const img of res.images ?? []) out.push({ type: "image", data: img });
    setOutputs(out);
    const ok = rep.error ? 0 : rep.tests.filter((t) => t.ok).length;
    const solved = !rep.error && rep.tests.length > 0 && ok === rep.tests.length;
    setAttempts((n) => n + 1);
    setBest((b) => Math.max(b, ok));
    if (solved) setPassed(true);
    try {
      const r = await recordExerciseGrade(view.slug, view.id, ok, rep.tests.length || total);
      if (r && !r.ok) setNotice(r.error);
    } catch {
      setNotice("채점 결과를 서버에 기록하지 못했습니다. 결과는 이 화면에서만 보입니다.");
    }
  }, [busy, execute, total, view.id, view.slug, view.tests]);

  const handleStop = () => {
    forceStop();
    setBusy(null);
    setStatus(null);
    setNotice("실행을 중단했습니다.");
  };

  const handleReset = async () => {
    if (!confirm("시작 코드로 되돌리시겠습니까? 지금까지 작성한 코드는 사라집니다.")) return;
    await resetCellCode(storeKey);
    setCode(view.starter);
    setOutputs([]);
    setReport(null);
    setNotice(null);
  };

  const showHint = () => {
    const next = Math.min(hintsShown + 1, view.hints.length);
    setHintsShown(next);
    recordExerciseHint(view.slug, view.id, next).catch(() => undefined);
  };

  const canSeeSolution = passed || (attempts > 0 && hintsShown >= view.hints.length);
  const loadSolution = async () => {
    setSolutionError(null);
    try {
      const r = await getExerciseSolution(view.slug, view.id);
      if (r.ok) setSolution(r.solution);
      else setSolutionError(r.error);
    } catch {
      setSolutionError("모범 답안을 불러오지 못했습니다. 잠시 후 다시 시도해 주십시오.");
    }
  };

  const todos = countTodos(code);
  const passedNow = report && !report.error ? report.tests.filter((t) => t.ok).length : 0;

  return (
    <article
      ref={ref}
      id={`exercise-${view.id}`}
      className={`scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5 ${passed ? "border-[var(--status-good)]/60" : "border-[var(--series-orange)]/40"}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="rounded-md bg-[color-mix(in_srgb,var(--series-orange)_15%,transparent)] px-2 py-0.5 text-[var(--series-orange)]">
              TODO 실습
            </span>
            <TierBadge tier={view.tier} />
            {view.section && (
              <a href={view.section.href} className="font-medium text-ink-muted hover:text-[var(--series-blue)] hover:underline">
                {view.section.label} · {view.section.title}
              </a>
            )}
          </div>
          <h3 className="mt-1.5 text-lg font-black text-ink">{view.title}</h3>
        </div>
        <p className={`shrink-0 text-xs font-bold ${passed ? "text-[var(--status-good)]" : "text-ink-muted"}`} aria-live="polite">
          {passed ? "✓ 통과" : attempts > 0 ? `채점 ${attempts}회 · 최고 ${best}/${total}` : "아직 채점하지 않음"}
        </p>
      </header>

      <div className="mt-3 text-sm">{view.prompt}</div>

      {view.locked ? (
        <p className="mt-4 rounded-lg bg-[var(--surface-card-2)] px-3 py-2 text-sm text-ink-muted">🔒 {view.locked}</p>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-hairline)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                Python · 내가 채우는 코드
                <span className={`ml-2 normal-case ${todos > 0 ? "text-[var(--series-orange)]" : "text-[var(--status-good)]"}`}>
                  {todos > 0 ? `TODO ${todos}곳 남음` : "TODO 표시 없음"}
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  disabled={!!busy}
                  className="rounded px-2 py-1 text-xs font-medium text-ink-muted hover:bg-card hover:text-ink-secondary disabled:opacity-40"
                >
                  초기화
                </button>
                {busy ? (
                  <button type="button" onClick={handleStop} className="rounded-md bg-[var(--status-bad)] px-3 py-1 text-xs font-bold text-white hover:opacity-90">
                    중단
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleRun()}
                      disabled={!loaded}
                      title="Shift+Enter"
                      className="rounded-md border border-[var(--border-strong)] px-3 py-1 text-xs font-bold text-ink-secondary hover:bg-card disabled:opacity-50"
                    >
                      ▶ 실행
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGrade()}
                      disabled={!loaded}
                      title="Ctrl+Enter"
                      className="rounded-md bg-[var(--series-orange)] px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      ✓ 채점
                    </button>
                  </>
                )}
              </div>
            </div>
            {active && loaded ? (
              <LabEditor value={code} onChange={onChange} onRun={() => void handleRun()} onGrade={() => void handleGrade()} readOnly={!!busy} />
            ) : (
              <div onClick={() => setActive(true)} className="cursor-text">
                <CodeBlock lang="python" code={code} />
              </div>
            )}
            <CellOutputs outputs={outputs} status={status ? STATUS_TEXT[status] : null} />
          </div>

          {notice && (
            <p className="mt-3 rounded-lg border-l-4 border-[var(--status-serious)] bg-[color-mix(in_srgb,var(--status-serious)_10%,transparent)] px-3 py-2 text-sm text-ink-secondary" role="status">
              {notice}
            </p>
          )}

          {report && (
            <div className="mt-3 rounded-lg border border-[var(--border-hairline)] px-3 py-3 text-sm" aria-live="polite">
              {report.error ? (
                <>
                  <p className="font-bold text-[var(--status-critical)]">코드를 실행하다 오류가 났습니다. 채점 항목은 실행하지 않았습니다.</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-[var(--status-critical)]">{report.error}</pre>
                </>
              ) : (
                <>
                  <p className={`font-bold ${passedNow === report.tests.length ? "text-[var(--status-good)]" : "text-ink"}`}>
                    채점 결과 {passedNow}/{report.tests.length} 통과
                    {passedNow === report.tests.length && " · 모든 항목을 통과했습니다."}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {report.tests.map((t, i) => (
                      <li key={i} className={t.ok ? "text-[var(--status-good)]" : "text-ink-secondary"}>
                        <span aria-hidden="true" className="mr-1.5 font-bold">
                          {t.ok ? "✓" : "✗"}
                        </span>
                        {t.name}
                        <span className="sr-only">{t.ok ? " (통과)" : " (미통과)"}</span>
                        {!t.ok && t.message && <span className="ml-1 font-mono text-xs text-[var(--status-critical)]"> — {t.message}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {view.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className="rounded-lg border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_8%,transparent)] px-3 py-2 text-sm">
                <p className="text-xs font-bold text-[var(--status-good)]">힌트 {i + 1}</p>
                <div className="text-ink-secondary">{hint}</div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {hintsShown < view.hints.length && (
                <button
                  type="button"
                  onClick={showHint}
                  className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-ink-secondary hover:border-[var(--status-good)] hover:text-[var(--status-good)]"
                >
                  {hintsShown === 0 ? "힌트 보기" : "다음 힌트"} ({hintsShown + 1}/{view.hints.length})
                </button>
              )}
              {solution === null &&
                (canSeeSolution ? (
                  <button
                    type="button"
                    onClick={() => void loadSolution()}
                    className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
                  >
                    {passed ? "모범 답안과 비교하기" : "모범 답안 보기"}
                  </button>
                ) : (
                  <span className="font-medium text-ink-muted">모범 답안은 통과하거나, 채점해 본 뒤 힌트를 모두 보면 열립니다.</span>
                ))}
              {solutionError && <span className="font-medium text-[var(--status-critical)]">{solutionError}</span>}
            </div>
            {solution !== null && (
              <div>
                <p className="mb-1 text-xs font-bold text-[var(--series-blue)]">모범 답안 (내 코드와 비교해 보십시오. 풀이는 하나가 아닙니다.)</p>
                <CodeBlock lang="python" code={solution} />
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}
