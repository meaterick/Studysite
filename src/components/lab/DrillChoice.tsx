"use client";

import { useState, useTransition, type ReactNode } from "react";
import { answerDrillChoice } from "@/lib/labActions";

export interface DrillChoiceState {
  correct: boolean;
  wrong: number[];
  attempts: number;
}

/** 퀴즈 객관식. 정답 번호는 클라이언트로 보내지 않고 서버 액션이 비교한다(맞히면 정답 번호와 해설이 내려온다). */
export default function DrillChoice({
  slug,
  itemId,
  label,
  question,
  choices,
  state,
  explanation,
  correctIndex,
  footer,
}: {
  slug: string;
  itemId: string;
  label: string;
  question: ReactNode;
  choices: ReactNode[];
  state: DrillChoiceState | null;
  explanation?: ReactNode;
  correctIndex?: number;
  footer?: ReactNode;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const solved = !!state?.correct;
  const wrong = new Set(state?.wrong ?? []);

  const submit = () => {
    if (selected === null) return;
    setError(null);
    startTransition(async () => {
      try {
        await answerDrillChoice(slug, itemId, selected);
      } catch {
        setError("채점 요청에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  return (
    <fieldset id={`drill-${itemId}`} className={`min-w-0 scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5 ${solved ? "border-[var(--status-good)]/60" : "border-[var(--border-hairline)]"}`}>
      <legend className="sr-only">{label}</legend>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-md bg-[color-mix(in_srgb,var(--series-blue)_12%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--series-blue)]">{label}</span>
        <div className="text-[15px] font-medium text-ink">{question}</div>
      </div>
      <div className="space-y-2" role="radiogroup">
        {choices.map((choice, i) => {
          const isCorrect = solved && correctIndex === i;
          const isWrong = wrong.has(i);
          const isSelected = selected === i && !solved;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected || isCorrect}
              disabled={solved || isWrong || pending}
              onClick={() => setSelected(i)}
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${
                isCorrect
                  ? "border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_12%,transparent)] text-ink"
                  : isWrong
                    ? "border-[var(--status-critical)]/50 bg-[color-mix(in_srgb,var(--status-critical)_7%,transparent)] text-ink-muted line-through decoration-[var(--status-critical)]/60"
                    : isSelected
                      ? "border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_8%,transparent)] text-ink"
                      : "border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--series-blue)]/60"
              }`}
            >
              <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold" style={{ borderColor: "currentColor" }}>
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
            disabled={selected === null || pending || (selected !== null && wrong.has(selected))}
            className="btn btn-primary"
          >
            {pending ? "채점 중…" : "정답 확인"}
          </button>
          {wrong.size > 0 && (
            <p className="text-sm font-medium text-[var(--status-critical)]" aria-live="polite">
              오답입니다. 다른 보기를 골라 보십시오.{wrong.size < 2 && " 한 번 더 틀리면 해설이 공개됩니다."}
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
      {footer}
    </fieldset>
  );
}
