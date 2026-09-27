"use client";

import { useState, useTransition, type ReactNode } from "react";
import { answerCheck } from "@/lib/studyActions";

export interface CheckStateView {
  correct: boolean;
  wrong: number[];
  attempts: number;
}

/**
 * 객관식 확인 문제. 정답 번호는 클라이언트로 보내지 않고 서버 액션이 채점한다.
 * 정답을 맞히거나 두 번 틀리면 서버가 해설(explanation)을 내려준다.
 */
export default function CheckQuestion({
  slug,
  sectionId,
  checkId,
  index,
  question,
  choices,
  state,
  explanation,
  correctIndex,
}: {
  slug: string;
  sectionId: string;
  checkId: string;
  index: number;
  question: ReactNode;
  choices: ReactNode[];
  state: CheckStateView | null;
  explanation?: ReactNode;
  /** 정답을 맞힌 뒤에만 전달된다 */
  correctIndex?: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const solved = !!state?.correct;
  const wrong = new Set(state?.wrong ?? []);
  const lastWrong = !solved && selected !== null && wrong.has(selected);

  const submit = () => {
    if (selected === null) return;
    setError(null);
    startTransition(async () => {
      try {
        await answerCheck(slug, sectionId, checkId, selected);
      } catch {
        setError("채점 요청이 실패했습니다. 새로고침한 뒤 다시 시도해주세요.");
      }
    });
  };

  return (
    <fieldset
      className={`rounded-xl border p-4 sm:p-5 ${solved ? "border-[var(--status-good)]/60" : "border-[var(--border-hairline)]"} bg-card`}
    >
      <legend className="sr-only">확인 문제 {index + 1}</legend>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-md bg-[var(--surface-card-2)] px-2 py-0.5 text-xs font-black text-ink-secondary">
          Q{index + 1}
        </span>
        <div className="text-[15px] font-medium text-ink">{question}</div>
      </div>
      <div className="space-y-2" role="radiogroup">
        {choices.map((choice, i) => {
          const isCorrect = solved && correctIndex === i;
          const isWrong = wrong.has(i);
          const isSelected = selected === i && !solved;
          const disabled = solved || isWrong || pending;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected || isCorrect}
              disabled={disabled}
              onClick={() => setSelected(i)}
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                isCorrect
                  ? "border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_12%,transparent)] text-ink"
                  : isWrong
                    ? "border-[var(--status-critical)]/50 bg-[color-mix(in_srgb,var(--status-critical)_7%,transparent)] text-ink-muted line-through decoration-[var(--status-critical)]/60"
                    : isSelected
                      ? "border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_8%,transparent)] text-ink"
                      : "border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--series-blue)]/60 disabled:hover:border-[var(--border-hairline)]"
              } disabled:cursor-default`}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold"
                style={{ borderColor: "currentColor" }}
              >
                {isCorrect ? "✓" : isWrong ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{choice}</span>
            </button>
          );
        })}
      </div>

      {!solved && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={selected === null || pending || lastWrong}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "채점 중…" : "정답 확인"}
          </button>
          {wrong.size > 0 && (
            <p className="text-sm font-medium text-[var(--status-critical)]" aria-live="polite">
              아쉽지만 오답입니다. 다른 답을 골라보세요.
              {wrong.size < 2 && " (한 번 더 틀리면 해설이 열립니다)"}
            </p>
          )}
          {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
        </div>
      )}

      {solved && (
        <p className="mt-3 text-sm font-bold text-[var(--status-good)]" aria-live="polite">
          정답입니다{state && state.attempts > 1 ? ` (${state.attempts}번째 시도)` : ""}.
        </p>
      )}
      {explanation && (
        <div className="mt-3 rounded-lg bg-[var(--surface-card-2)] px-3 py-2.5 text-sm text-ink-secondary">
          <p className="mb-1 text-xs font-bold text-ink-muted">{solved ? "해설" : "힌트 · 해설"}</p>
          {explanation}
        </div>
      )}
    </fieldset>
  );
}
