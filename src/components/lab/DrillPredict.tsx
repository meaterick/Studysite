"use client";

import { useState, useTransition, type ReactNode } from "react";
import CodeBlock from "@/components/CodeBlock";
import CellOutputs from "@/components/assignment/CellOutputs";
import type { NotebookOutput } from "@/lib/notebook";
import { forceStop, resetNamespace, runPython } from "@/lib/pyRunner";
import { answerDrillPredict, revealDrillPredict } from "@/lib/labActions";

export interface DrillPredictState {
  correct: boolean;
  attempts: number;
  lastAnswer?: string;
  revealed: boolean;
}

/**
 * 코드 출력 예측. 먼저 실행하지 않고 출력을 예측해 적으면 서버가 정답과 비교한다(공백 차이는 무시).
 * 맞히거나 두 번 틀리거나 정답 보기를 누르면 정답·해설이 공개되고, 그때부터 코드를 브라우저에서 직접 실행해 확인할 수 있다.
 */
export default function DrillPredict({
  slug,
  itemId,
  label,
  question,
  code,
  state,
  expected,
  explanation,
  footer,
}: {
  slug: string;
  itemId: string;
  label: string;
  question: ReactNode;
  code: string;
  state: DrillPredictState | null;
  /** 공개된 뒤에만 전달된다 */
  expected?: string;
  explanation?: ReactNode;
  footer?: ReactNode;
}) {
  const [answer, setAnswer] = useState(state?.lastAnswer ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<NotebookOutput[]>([]);
  const [running, setRunning] = useState(false);
  const solved = !!state?.correct;
  const revealed = !!state?.revealed && expected !== undefined;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await answerDrillPredict(slug, itemId, answer);
        if (!r.ok) setError(r.error);
      } catch {
        setError("채점 요청에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  const giveUp = () => {
    if (!confirm("정답을 보면 이 문항은 정답으로 기록되지 않습니다. 정답을 보시겠습니까?")) return;
    startTransition(async () => {
      try {
        await revealDrillPredict(slug, itemId);
      } catch {
        setError("요청에 실패했습니다. 잠시 후 다시 시도해 주십시오.");
      }
    });
  };

  const runCode = async () => {
    setRunning(true);
    const collected: NotebookOutput[] = [];
    setOutputs([]);
    const ns = `drill:${itemId}`;
    await resetNamespace(ns);
    const timer = setTimeout(() => forceStop(), 20_000);
    const res = await runPython(
      code,
      {
        onStream: (name, text) => {
          collected.push({ type: "stream", name, text });
          setOutputs([...collected]);
        },
      },
      { ns }
    );
    clearTimeout(timer);
    if (!res.ok) collected.push({ type: "error", text: res.error ?? "오류" });
    setOutputs([...collected]);
    setRunning(false);
  };

  return (
    <div id={`drill-${itemId}`} className={`scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5 ${solved ? "border-[var(--status-good)]/60" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-md bg-[color-mix(in_srgb,var(--series-aqua)_14%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--series-aqua)]">{label}</span>
        <div className="text-[15px] font-medium text-ink">{question}</div>
      </div>
      <CodeBlock lang="python" code={code} />
      <label htmlFor={`predict-${itemId}`} className="mt-3 block text-xs font-bold text-ink-secondary">
        예상 출력 (화면에 찍힐 그대로, 줄바꿈 포함)
      </label>
      <textarea
        id={`predict-${itemId}`}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        readOnly={solved || revealed}
        rows={Math.max(2, code.split("\n").filter((l) => l.includes("print")).length)}
        maxLength={4000}
        spellCheck={false}
        placeholder="코드를 실행하지 말고 머릿속으로 따라가 출력을 적어 보십시오."
        className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 font-mono text-sm text-ink outline-none focus:border-[var(--series-blue)]"
      />
      {!solved && !revealed && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!answer.trim() || pending}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "채점 중…" : "정답 확인"}
          </button>
          <button type="button" onClick={giveUp} disabled={pending} className="text-xs font-bold text-ink-muted underline-offset-2 hover:underline">
            정답 보기
          </button>
          {state && state.attempts > 0 && !state.correct && (
            <p className="text-sm font-medium text-[var(--status-critical)]" aria-live="polite">
              예상과 실제 출력이 다릅니다. 한 줄씩 다시 따라가 보십시오.
            </p>
          )}
          {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
        </div>
      )}
      {solved && (
        <p className="mt-2 text-sm font-bold text-[var(--status-good)]" aria-live="polite">
          정답입니다{state && state.attempts > 1 ? ` (${state.attempts}번째 시도)` : ""}.
        </p>
      )}
      {revealed && (
        <div className="mt-3 space-y-3">
          {!solved && <p className="text-sm font-bold text-[var(--status-critical)]">이번에는 맞히지 못했습니다. 정답과 해설을 확인해 보십시오.</p>}
          <div>
            <p className="mb-1 text-xs font-bold text-ink-muted">실제 출력</p>
            <pre className="overflow-x-auto rounded-lg bg-[#0d1117] px-4 py-2.5 font-mono text-[12.5px] text-[#c9d1d9]">{expected}</pre>
          </div>
          {explanation && (
            <div className="rounded-lg bg-[var(--surface-card-2)] px-3 py-2.5 text-sm text-ink-secondary">
              <p className="mb-1 text-xs font-bold text-ink-muted">해설</p>
              {explanation}
            </div>
          )}
          <div className="overflow-hidden rounded-lg border border-[var(--border-hairline)]">
            <div className="flex items-center justify-between bg-[var(--surface-card-2)] px-3 py-1.5">
              <span className="text-xs font-bold text-ink-muted">브라우저에서 직접 실행해 확인하기</span>
              <button
                type="button"
                onClick={() => void runCode()}
                disabled={running}
                className="rounded-md bg-[var(--series-blue)] px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {running ? "실행 중…" : "▶ 실행"}
              </button>
            </div>
            <CellOutputs outputs={outputs} status={running && outputs.length === 0 ? "실행 중… (처음에는 실행 환경을 준비하느라 몇 초 걸립니다)" : null} />
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}
