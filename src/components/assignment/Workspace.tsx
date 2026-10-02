"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { AssignmentSpec } from "@/content/types";
import {
  checkTasks,
  newCellId,
  NOTEBOOK_LIMITS,
  type AssignmentDraft,
  type NotebookCell,
  type NotebookOutput,
} from "@/lib/notebook";
import { saveAssignmentDraft, submitAssignmentWork } from "@/lib/assignmentActions";
import { forceStop, onRuntimeReset, preloadPyodide, resetNamespace, runPython, writeRuntimeFiles, type RunStatus } from "@/lib/pyRunner";
import AnswerCell from "./AnswerCell";
import AutoTestPanel, { type AutoTestView } from "@/components/lab/AutoTestPanel";
import TierBadge from "@/components/TierBadge";
import StepMarker from "@/components/StepMarker";
import Icon from "@/components/Icon";
import { TIER_INFO, type Tier } from "@/content/tiers";
import { formatTime } from "@/lib/datetime";

// Monaco 편집기는 무겁기 때문에 작업 공간이 열릴 때 별도 청크로 불러온다.
const NotebookCodeCell = dynamic(() => import("./NotebookCodeCell"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--code-bg)] py-8 text-center text-xs text-ink-muted">
      코드 편집기를 불러오고 있습니다…
    </div>
  ),
});

export interface WorkspaceCellView {
  id: string;
  kind: "code" | "text";
  label?: string;
  prompt?: ReactNode;
  placeholder?: string;
  minChars?: number;
  template?: string;
  starter?: string;
}

export interface WorkspaceTaskView {
  id: string;
  title: string;
  optional: boolean;
  tier: Tier;
  /** 서버에서 렌더링한 과제 설명 */
  intro: ReactNode;
  cells: WorkspaceCellView[];
}

type SaveState = "saved" | "dirty" | "saving" | "error";

const STATUS_TEXT: Record<RunStatus, string> = {
  "loading-runtime": "Python 실행 환경을 준비하고 있습니다. 처음 한 번은 몇 초 정도 걸립니다.",
  "loading-packages": "필요한 패키지를 불러오고 있습니다…",
  running: "실행 중…",
};

function clampOutputs(outputs: NotebookOutput[]): NotebookOutput[] {
  let budget: number = NOTEBOOK_LIMITS.outputTextChars;
  let images = 0;
  const out: NotebookOutput[] = [];
  for (const o of outputs) {
    if (o.type === "image") {
      if (images < NOTEBOOK_LIMITS.imagesPerCell && o.data.length <= NOTEBOOK_LIMITS.imageChars) {
        images++;
        out.push(o);
      }
      continue;
    }
    if (budget <= 0) continue;
    if (o.text.length > budget) {
      out.push({ ...o, text: `${o.text.slice(0, budget)}\n…(출력이 길어 앞부분만 보관합니다)` });
      budget = 0;
    } else {
      out.push(o);
      budget -= o.text.length;
    }
  }
  return out.slice(0, NOTEBOOK_LIMITS.outputsPerCell);
}

export default function Workspace({
  slug,
  spec,
  tasks,
  initialDraft,
  savedAt,
  courseDocs,
  resubmit,
  autoTests,
}: {
  slug: string;
  spec: AssignmentSpec;
  tasks: WorkspaceTaskView[];
  initialDraft: AssignmentDraft;
  savedAt?: string;
  courseDocs?: { path: string; content: string }[];
  resubmit: boolean;
  /** 작업 공간 이름공간에서 실행하는 자동 테스트(src/content/labs) */
  autoTests?: AutoTestView[];
}) {
  const ns = `assignment:${slug}`;
  const [draft, setDraft] = useState<AssignmentDraft>(initialDraft);
  const draftRef = useRef(draft);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSaved, setLastSaved] = useState<string | undefined>(savedAt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<boolean> | null>(null);
  const dirtySince = useRef(0);

  const [runningCell, setRunningCell] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [execCounts, setExecCounts] = useState<Record<string, number>>({});
  const execSeq = useRef(0);
  const filesReady = useRef<Promise<void> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const specCells = useMemo(() => {
    const map = new Map<string, WorkspaceCellView>();
    for (const t of tasks) for (const c of t.cells) map.set(c.id, c);
    return map;
  }, [tasks]);
  const checks = useMemo(() => checkTasks(spec, draft), [spec, draft]);

  // ── 저장 ──────────────────────────────────────────────────────────────
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (saving.current) await saving.current;
    const startedFor = dirtySince.current;
    const task = (async () => {
      setSaveState("saving");
      try {
        const result = await saveAssignmentDraft(slug, draftRef.current);
        if (!result.ok) {
          setSaveState("error");
          setSaveError(result.error);
          return false;
        }
        setLastSaved(result.savedAt);
        setSaveError(null);
        // 저장하는 동안 또 바뀌었다면 dirty 상태를 유지한다.
        setSaveState(dirtySince.current === startedFor ? "saved" : "dirty");
        return true;
      } catch {
        setSaveState("error");
        setSaveError("저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주십시오.");
        return false;
      }
    })();
    saving.current = task;
    const ok = await task;
    saving.current = null;
    return ok;
  }, [slug]);

  const scheduleSave = useCallback(() => {
    dirtySince.current = Date.now();
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveNow(), 1500);
  }, [saveNow]);

  const commit = useCallback(
    (updater: (prev: AssignmentDraft) => AssignmentDraft) => {
      setDraft((prev) => {
        const next = updater(prev);
        draftRef.current = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  // 저장하지 않은 변경이 있으면 페이지를 떠나기 전에 경고한다.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveTimer.current || saving.current) {
        e.preventDefault();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveNow();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [saveNow]);

  // ── 셀 편집 ───────────────────────────────────────────────────────────
  const updateCell = useCallback(
    (taskId: string, cellId: string, patch: Partial<NotebookCell>) => {
      commit((prev) => {
        const cells = prev.tasks[taskId]?.cells ?? [];
        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [taskId]: { cells: cells.map((c) => (c.id === cellId ? { ...c, ...patch } : c)) },
          },
        };
      });
    },
    [commit]
  );

  const addCell = (taskId: string, kind: "code" | "text") => {
    commit((prev) => {
      const cells = prev.tasks[taskId]?.cells ?? [];
      if (cells.length >= NOTEBOOK_LIMITS.cellsPerTask) return prev;
      const cell: NotebookCell = { id: newCellId(), kind, source: "", custom: true };
      return { ...prev, tasks: { ...prev.tasks, [taskId]: { cells: [...cells, cell] } } };
    });
  };

  const deleteCell = (taskId: string, cellId: string) => {
    if (!confirm("이 셀을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    commit((prev) => {
      const cells = prev.tasks[taskId]?.cells ?? [];
      return { ...prev, tasks: { ...prev.tasks, [taskId]: { cells: cells.filter((c) => c.id !== cellId) } } };
    });
  };

  // ── 실행 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    preloadPyodide();
    return onRuntimeReset(() => {
      filesReady.current = null;
      setExecCounts({});
      setNotice("실행을 중단해 Python 실행 환경을 새로 시작했습니다. 필요한 셀을 위에서부터 다시 실행해 주십시오.");
    });
  }, []);

  const ensureFiles = useCallback(async () => {
    if (!courseDocs || courseDocs.length === 0) return;
    if (!filesReady.current) {
      filesReady.current = writeRuntimeFiles(courseDocs).then(() => undefined);
    }
    await filesReady.current;
  }, [courseDocs]);

  const runCell = useCallback(
    async (taskId: string, cellId: string): Promise<boolean> => {
      const cell = draftRef.current.tasks[taskId]?.cells.find((c) => c.id === cellId);
      if (!cell) return false;
      setRunningCell(cellId);
      setNotice(null);
      setRunStatus(STATUS_TEXT["loading-runtime"]);
      await ensureFiles();
      const outputs: NotebookOutput[] = [];
      const pushStream = (name: "stdout" | "stderr", text: string) => {
        const last = outputs[outputs.length - 1];
        if (last && last.type === "stream" && last.name === name) last.text += `\n${text}`;
        else outputs.push({ type: "stream", name, text });
        setDraft((prev) => {
          const next = {
            ...prev,
            tasks: {
              ...prev.tasks,
              [taskId]: {
                cells: prev.tasks[taskId].cells.map((c) => (c.id === cellId ? { ...c, outputs: clampOutputs([...outputs]) } : c)),
              },
            },
          };
          draftRef.current = next;
          return next;
        });
      };
      const result = await runPython(
        cell.source,
        {
          onStatus: (s) => setRunStatus(STATUS_TEXT[s]),
          onStream: pushStream,
        },
        { ns }
      );
      if (result.ok && result.result !== undefined) outputs.push({ type: "result", text: result.result });
      if (!result.ok) outputs.push({ type: "error", text: result.error ?? "알 수 없는 오류가 발생했습니다." });
      for (const img of result.images ?? []) outputs.push({ type: "image", data: img });
      execSeq.current += 1;
      setExecCounts((prev) => ({ ...prev, [cellId]: execSeq.current }));
      updateCell(taskId, cellId, {
        outputs: clampOutputs(outputs),
        executedAt: new Date().toISOString(),
        runOk: result.ok,
        stale: false,
      });
      setRunStatus(null);
      setRunningCell(null);
      return result.ok;
    },
    [ensureFiles, ns, updateCell]
  );

  const runAll = async (): Promise<boolean> => {
    setRunningAll(true);
    try {
      for (const task of spec.tasks) {
        for (const cell of draftRef.current.tasks[task.id]?.cells ?? []) {
          if (cell.kind !== "code") continue;
          const ok = await runCell(task.id, cell.id);
          if (!ok) {
            setNotice(`"${task.title}"의 코드 셀에서 오류가 발생해 전체 실행을 멈췄습니다.`);
            return false;
          }
        }
      }
      setNotice("모든 코드 셀을 순서대로 실행했습니다.");
      return true;
    } finally {
      setRunningAll(false);
    }
  };

  const restartRuntime = async () => {
    if (!confirm("실행 환경을 초기화하면 지금까지 만든 변수가 모두 사라집니다. 셀의 코드와 출력은 그대로 남습니다. 계속하시겠습니까?")) return;
    await resetNamespace(ns);
    filesReady.current = null;
    setExecCounts({});
    setNotice("실행 환경을 초기화했습니다. 첫 셀부터 다시 실행해 주십시오.");
  };

  const busy = runningCell !== null || runningAll;

  // ── 제출 ──────────────────────────────────────────────────────────────
  const [submitting, startSubmit] = useTransition();
  const [submitMessage, setSubmitMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const requiredChecks = checks.filter((c) => !c.optional);
  const missingCount = requiredChecks.reduce((n, c) => n + c.missingAnswers.length, 0);
  const codeIssues = checks.reduce((n, c) => n + c.unrunCode + c.failedCode, 0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);
    if (missingCount > 0) return;
    if (
      codeIssues > 0 &&
      !confirm(`실행하지 않았거나 오류가 난 코드 셀이 ${codeIssues}개 있습니다. 운영자는 셀에 저장된 실행 결과를 보고 채점합니다. 그대로 제출하시겠습니까?`)
    )
      return;
    const formData = new FormData(e.currentTarget);
    startSubmit(async () => {
      const saved = await saveNow();
      if (!saved) {
        setSubmitMessage({ tone: "error", text: "작업 내용을 저장하지 못해 제출을 중단했습니다. 잠시 후 다시 시도해 주십시오." });
        return;
      }
      try {
        const result = await submitAssignmentWork(slug, formData);
        if (!result.ok) {
          setSubmitMessage({ tone: "error", text: result.error });
          return;
        }
        formRef.current?.reset();
        setSubmitMessage({ tone: "ok", text: "제출했습니다. 운영자가 채점하면 이 페이지 위쪽에 점수와 피드백이 표시됩니다." });
      } catch {
        setSubmitMessage({ tone: "error", text: "제출하지 못했습니다. 첨부 파일 크기를 확인하고 다시 시도해 주십시오." });
      }
    });
  };

  const saveLabel =
    saveState === "saving"
      ? "저장 중…"
      : saveState === "dirty"
        ? "변경 사항 있음"
        : saveState === "error"
          ? "저장 실패"
          : lastSaved
            ? `자동 저장됨 · ${formatTime(lastSaved)}`
            : "아직 저장한 내용 없음";

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="print:hidden" aria-label="과제 목록">
        <div className="lg:sticky lg:top-20">
          <nav className="lg:border-l lg:border-[var(--border-hairline)] lg:pl-4">
            <p className="px-2 text-[13px] font-medium text-ink">과제 목록</p>
            <ol className="mt-3 space-y-0.5">
              {tasks.map((t, i) => {
                const c = checks.find((x) => x.taskId === t.id);
                return (
                  <li key={t.id}>
                    <a
                      href={`#task-${t.id}`}
                      className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
                    >
                      <StepMarker size={20} state={c?.complete ? "done" : "todo"} label={i + 1} />
                      <span className="min-w-0 leading-snug">
                        {t.title}
                        {t.optional && <span className="ml-1 text-xs text-ink-muted">· {TIER_INFO[t.tier].label} 선택</span>}
                      </span>
                    </a>
                  </li>
                );
              })}
              {autoTests && autoTests.length > 0 && (
                <li className="mt-2 border-t border-[var(--border-hairline)] pt-2">
                  <a href="#autotests" className="flex items-center rounded-lg px-2 py-1.5 text-[13px] text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink">
                    자동 테스트
                  </a>
                </li>
              )}
              <li className={autoTests && autoTests.length > 0 ? "" : "mt-2 border-t border-[var(--border-hairline)] pt-2"}>
                <a href="#submit" className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink transition hover:bg-[var(--surface-card-2)]">
                  제출하기
                  <Icon name="arrowRight" size={14} className="text-ink-muted transition group-hover:translate-x-0.5" />
                </a>
              </li>
            </ol>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 space-y-12">
        <div className="sticky top-[4.75rem] z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-hairline)] bg-[color-mix(in_srgb,var(--surface-card)_94%,transparent)] py-2 pl-4 pr-2 shadow-[var(--shadow-raised)] backdrop-blur-xl">
          <p
            className={`text-xs ${saveState === "error" ? "text-[var(--status-critical)]" : "text-ink-muted"}`}
            aria-live="polite"
          >
            {saveLabel}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void saveNow()}
              disabled={saveState === "saving"}
              className="btn btn-ghost btn-sm"
            >
              지금 저장
            </button>
            <button
              type="button"
              onClick={() => void restartRuntime()}
              disabled={busy}
              className="btn btn-ghost btn-sm"
            >
              실행 환경 초기화
            </button>
            {busy ? (
              <button
                type="button"
                onClick={() => forceStop()}
                className="btn btn-danger btn-sm"
              >
                실행 중단
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void runAll()}
                className="btn btn-primary btn-sm"
              >
                <Icon name="play" size={12} />
                전체 실행
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <p className="callout callout-danger text-[var(--status-critical)]">
            {saveError}
          </p>
        )}
        {notice && (
          <p className="callout" role="status">
            {notice}
          </p>
        )}

        {tasks.map((task, i) => {
          const cells = draft.tasks[task.id]?.cells ?? [];
          const c = checks.find((x) => x.taskId === task.id);
          return (
            <section key={task.id} id={`task-${task.id}`} aria-labelledby={`task-title-${task.id}`} className="scroll-mt-32">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <h3 id={`task-title-${task.id}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg font-bold tracking-[-0.03em] text-ink">
                  <span className="font-mono text-xs font-normal text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  {task.title}
                  <span className="text-sm font-normal tracking-normal">
                    <TierBadge tier={task.tier} compact />
                  </span>
                  {task.optional && <span className="pill">선택</span>}
                </h3>
                {c && (
                  <p className="text-xs">
                    {c.complete ? (
                      <span className="flex items-center gap-1 font-medium text-[var(--status-good)]">
                        <Icon name="check" size={14} />
                        작성 완료
                      </span>
                    ) : (
                      <span className="text-ink-muted">
                        {[
                          c.missingAnswers.length > 0 && `답안 ${c.missingAnswers.length}개 남음`,
                          c.unrunCode > 0 && `실행할 코드 ${c.unrunCode}개`,
                          c.failedCode > 0 && `오류 ${c.failedCode}개`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="mb-4">{task.intro}</div>
              <div className="space-y-4">
                {cells.map((cell) => {
                  const view = specCells.get(cell.id);
                  if (cell.kind === "code") {
                    return (
                      <NotebookCodeCell
                        key={cell.id}
                        cell={cell}
                        label={view?.label}
                        execCount={execCounts[cell.id]}
                        running={runningCell === cell.id}
                        status={runningCell === cell.id ? runStatus : null}
                        disabled={busy && runningCell !== cell.id}
                        onChange={(source) => updateCell(task.id, cell.id, { source, stale: !!cell.executedAt })}
                        onRun={() => void runCell(task.id, cell.id)}
                        onReset={
                          view?.starter !== undefined
                            ? () => {
                                if (confirm("이 셀을 시작 코드로 되돌리시겠습니까? 수정한 코드와 출력은 사라집니다."))
                                  updateCell(task.id, cell.id, { source: view.starter ?? "", outputs: [], executedAt: undefined, runOk: undefined, stale: false });
                              }
                            : undefined
                        }
                        onDelete={cell.custom ? () => deleteCell(task.id, cell.id) : undefined}
                      />
                    );
                  }
                  return (
                    <AnswerCell
                      key={cell.id}
                      cell={cell}
                      prompt={view?.prompt}
                      placeholder={view?.placeholder}
                      minChars={view?.minChars}
                      template={view?.template}
                      optional={task.optional}
                      onChange={(source) => updateCell(task.id, cell.id, { source })}
                      onDelete={cell.custom ? () => deleteCell(task.id, cell.id) : undefined}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <button type="button" onClick={() => addCell(task.id, "code")} className="btn btn-ghost btn-sm -ml-3 text-xs">
                  + 코드 셀
                </button>
                <button type="button" onClick={() => addCell(task.id, "text")} className="btn btn-ghost btn-sm text-xs">
                  + 메모
                </button>
              </div>
            </section>
          );
        })}

        {autoTests && autoTests.length > 0 && (
          <div id="autotests" className="scroll-mt-32">
            <AutoTestPanel ns={ns} tests={autoTests} beforeRun={runAll} disabled={busy} />
          </div>
        )}

        <section id="submit" aria-labelledby="submit-heading" className="scroll-mt-32 rounded-2xl border border-[var(--border-hairline)] p-6 sm:p-8">
          <h3 id="submit-heading" className="text-xl font-bold tracking-[-0.03em] text-ink">
            {resubmit ? "다시 제출하기" : "제출하기"}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">지금의 코드·실행 결과·답안이 제출본으로 저장됩니다. 제출 후에도 고쳐서 다시 낼 수 있습니다.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.taskId} className={`flex flex-wrap items-center gap-x-2 ${c.complete ? "text-ink" : c.optional ? "text-ink-muted" : "text-ink-secondary"}`}>
                <StepMarker size={18} state={c.complete ? "done" : "todo"} label="" />
                {c.title}
                {c.optional && <span className="text-xs text-ink-muted">선택</span>}
                {!c.complete && (
                  <span className="text-xs text-ink-muted">
                    {" "}
                    {[
                      c.missingAnswers.length > 0 && `답안 ${c.missingAnswers.length}개 미작성`,
                      c.unrunCode > 0 && `실행하지 않은 코드 ${c.unrunCode}개`,
                      c.failedCode > 0 && `오류가 난 코드 ${c.failedCode}개`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <form ref={formRef} onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="submit-text" className="text-sm font-medium text-ink">
                운영자에게 남길 메모 <span className="font-normal text-ink-muted">(선택)</span>
              </label>
              <textarea
                id="submit-text"
                name="text"
                rows={3}
                maxLength={20000}
                placeholder="특히 봐 주었으면 하는 부분이나 막혔던 점을 적어 주십시오."
                className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-card px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-muted"
              />
            </div>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
                참고 링크·첨부 파일 (선택)
                <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="submit-links" className="text-xs font-medium text-ink-secondary">
                    참고 링크 (한 줄에 하나, 최대 5개)
                  </label>
                  <textarea
                    id="submit-links"
                    name="links"
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-card px-4 py-3 text-sm text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="submit-files" className="text-xs font-medium text-ink-secondary">
                    첨부 파일 (pdf, png, jpg, csv, json, txt, md, py, ipynb, zip · 최대 3개, 각 5MB)
                  </label>
                  <input
                    id="submit-files"
                    name="files"
                    type="file"
                    multiple
                    className="mt-2 block text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-[var(--border-strong)] file:bg-transparent file:px-4 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
                  />
                </div>
              </div>
            </details>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting || missingCount > 0 || busy}
                className="btn btn-primary"
              >
                {submitting ? "제출 중…" : resubmit ? "새 버전으로 다시 제출" : "과제 제출"}
              </button>
              {missingCount > 0 && (
                <p className="text-xs text-ink-muted">핵심 과제 항목의 답안 {missingCount}개를 작성하면 제출할 수 있습니다.</p>
              )}
              {submitMessage && (
                <p
                  className={`text-sm font-medium ${submitMessage.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`}
                  role="status"
                >
                  {submitMessage.text}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
