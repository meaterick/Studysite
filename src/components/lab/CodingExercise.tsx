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
import Icon from "@/components/Icon";

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
      className={`scroll-mt-24 rounded-2xl border p-5 sm:p-7 ${passed ? "border-[color-mix(in_srgb,var(--status-good)_40%,transparent)]" : "border-[var(--border-hairline)]"}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <TierBadge tier={view.tier} compact />
            {view.section && (
              <a href={view.section.href} className="transition hover:text-ink">
                {view.section.label} · {view.section.title}
              </a>
            )}
          </p>
          <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-ink">{view.title}</h3>
        </div>
        <p className={`flex shrink-0 items-center gap-1 text-xs ${passed ? "font-medium text-[var(--status-good)]" : "text-ink-muted"}`} aria-live="polite">
          {passed ? (
            <>
              <Icon name="check" size={14} />
              통과
            </>
          ) : attempts > 0 ? (
            `채점 ${attempts}회 · 최고 ${best}/${total}`
          ) : (
            "채점 전"
          )}
        </p>
      </header>

      <div className="mt-4 text-[15px] leading-relaxed text-ink-body">{view.prompt}</div>

      {view.locked ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--surface-card-2)] px-4 py-3 text-sm text-ink-muted">
          <Icon name="lock" size={14} />
          {view.locked}
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--code-bg)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] py-1.5 pl-4 pr-2">
              <span className="font-mono text-[11px] text-ink-muted">
                Python
                <span className={`ml-2 ${todos > 0 ? "text-[var(--tier-advanced)]" : "text-[var(--status-good)]"}`}>· {todos > 0 ? `TODO ${todos}` : "TODO 없음"}</span>
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <button type="button" onClick={() => void handleReset()} disabled={!!busy} className="btn btn-ghost btn-sm min-h-7 px-3 text-xs">
                  초기화
                </button>
                {busy ? (
                  <button type="button" onClick={handleStop} className="btn btn-danger btn-sm min-h-7 px-3 text-xs">
                    중단
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => void handleRun()} disabled={!loaded} title="Shift+Enter" className="btn btn-secondary btn-sm min-h-7 px-3 text-xs">
                      <Icon name="play" size={11} />
                      실행
                    </button>
                    <button type="button" onClick={() => void handleGrade()} disabled={!loaded} title="Ctrl+Enter" className="btn btn-primary btn-sm min-h-7 px-3 text-xs">
                      <Icon name="check" size={13} strokeWidth={2} />
                      채점
                    </button>
                  </>
                )}
              </div>
            </div>
            {active && loaded ? (
              <LabEditor value={code} onChange={onChange} onRun={() => void handleRun()} onGrade={() => void handleGrade()} readOnly={!!busy} />
            ) : (
              <div onClick={() => setActive(true)} className="cursor-text">
                <CodeBlock lang="python" code={code} bare />
              </div>
            )}
            <CellOutputs outputs={outputs} status={status ? STATUS_TEXT[status] : null} />
          </div>

          {notice && (
            <p className="callout callout-warn mt-4" role="status">
              {notice}
            </p>
          )}

          {report && (
            <div className="mt-4 rounded-xl border border-[var(--border-hairline)] px-4 py-3.5 text-sm" aria-live="polite">
              {report.error ? (
                <>
                  <p className="font-medium text-[var(--status-critical)]">실행 중 오류가 나서 채점 항목을 검사하지 못했습니다.</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-[var(--status-critical)]">{report.error}</pre>
                </>
              ) : (
                <>
                  <p className={`font-medium tabular-nums ${passedNow === report.tests.length ? "text-[var(--status-good)]" : "text-ink"}`}>
                    채점 결과 {passedNow}/{report.tests.length} 통과
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {report.tests.map((t, i) => (
                      <li key={i} className={`flex items-start gap-2 ${t.ok ? "text-[var(--status-good)]" : "text-ink-secondary"}`}>
                        <Icon name={t.ok ? "check" : "close"} size={14} strokeWidth={2} className={`mt-[3px] shrink-0 ${t.ok ? "" : "text-[var(--status-critical)]"}`} />
                        <span className="min-w-0">
                          {t.name}
                          <span className="sr-only">{t.ok ? " (통과)" : " (미통과)"}</span>
                          {!t.ok && t.message && <span className="ml-1 font-mono text-xs text-[var(--status-critical)]"> — {t.message}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {view.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className="callout callout-good">
                <p className="mb-1 text-xs font-medium text-[var(--status-good)]">힌트 {i + 1}</p>
                <div className="text-ink-body">{hint}</div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {hintsShown < view.hints.length && (
                <button type="button" onClick={showHint} className="btn btn-secondary btn-sm">
                  {hintsShown === 0 ? "힌트 보기" : "다음 힌트"}
                  <span className="tabular-nums text-ink-muted">
                    {hintsShown + 1}/{view.hints.length}
                  </span>
                </button>
              )}
              {solution === null &&
                (canSeeSolution ? (
                  <button type="button" onClick={() => void loadSolution()} className="btn btn-secondary btn-sm">
                    {passed ? "모범 답안과 비교" : "모범 답안 보기"}
                  </button>
                ) : (
                  <span className="text-ink-muted">모범 답안은 통과하거나 힌트를 모두 본 뒤 열립니다.</span>
                ))}
              {solutionError && <span className="text-[var(--status-critical)]">{solutionError}</span>}
            </div>
            {solution !== null && (
              <div>
                <p className="mb-2 text-xs font-medium text-ink-muted">모범 답안 · 풀이는 하나가 아닙니다</p>
                <CodeBlock lang="python" code={solution} />
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}
