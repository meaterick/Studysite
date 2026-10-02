"use client";

import Icon from "@/components/Icon";
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
    <fieldset id={`drill-${itemId}`} className={`min-w-0 scroll-mt-24 rounded-2xl border p-5 sm:p-7 ${solved ? "border-[color-mix(in_srgb,var(--status-good)_40%,transparent)]" : "border-[var(--border-hairline)]"}`}>
      <legend className="sr-only">{label}</legend>
      <div className="mb-5 flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <div className="text-base font-medium leading-relaxed text-ink">{question}</div>
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
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-relaxed transition disabled:cursor-default ${
                isCorrect
                  ? "border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_8%,transparent)] text-ink"
                  : isWrong
                    ? "border-[color-mix(in_srgb,var(--status-critical)_35%,transparent)] text-ink-muted line-through decoration-[color-mix(in_srgb,var(--status-critical)_60%,transparent)]"
                    : isSelected
                      ? "border-[var(--text-primary)] bg-[var(--surface-card-2)] text-ink"
                      : "border-[var(--border-hairline)] text-ink-body hover:border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--surface-card-2)_50%,transparent)]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  isCorrect
                    ? "bg-[var(--status-good)] text-white"
                    : isWrong
                      ? "text-[var(--status-critical)]"
                      : isSelected
                        ? "bg-[var(--inverse-bg)] text-[var(--inverse-fg)]"
                        : "border border-[var(--border-strong)] text-ink-muted"
                }`}
              >
                {isCorrect ? <Icon name="check" size={12} strokeWidth={2.2} /> : isWrong ? <Icon name="close" size={12} strokeWidth={2} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{choice}</span>
            </button>
          );
        })}
      </div>
      {!solved && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={submit}
            disabled={selected === null || pending || (selected !== null && wrong.has(selected))}
            className="btn btn-primary"
          >
            {pending ? "채점 중…" : "정답 확인"}
          </button>
          {wrong.size > 0 && (
            <p className="text-sm text-[var(--status-critical)]" aria-live="polite">
              오답입니다.{wrong.size < 2 && " 한 번 더 틀리면 해설이 공개됩니다."}
            </p>
          )}
          {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
        </div>
      )}
      {solved && (
        <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-[var(--status-good)]" aria-live="polite">
          <Icon name="check" size={15} />
          정답입니다{state && state.attempts > 1 ? ` · ${state.attempts}번째 시도` : ""}
        </p>
      )}
      {explanation && (
        <div className="mt-3 rounded-xl bg-[var(--surface-card-2)] px-4 py-3.5 text-sm leading-relaxed text-ink-secondary">
          <p className="mb-1 text-xs font-medium text-ink-muted">{solved ? "해설" : "힌트 · 해설"}</p>
          {explanation}
        </div>
      )}
      {footer}
    </fieldset>
  );
}
