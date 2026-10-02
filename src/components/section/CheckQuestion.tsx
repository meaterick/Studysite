"use client";

import { useState, useTransition, type ReactNode } from "react";
import { answerCheck } from "@/lib/studyActions";
import Icon from "@/components/Icon";

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
        setError("채점 요청에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  return (
    <fieldset className={`surface min-w-0 p-5 sm:p-7 ${solved ? "border-[color-mix(in_srgb,var(--status-good)_45%,transparent)]" : ""}`}>
      <legend className="sr-only">확인 문제 {index + 1}</legend>
      <div className="mb-5 text-base font-medium leading-relaxed text-ink">{question}</div>
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
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-relaxed transition ${
                isCorrect
                  ? "border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_8%,transparent)] text-ink"
                  : isWrong
                    ? "border-[color-mix(in_srgb,var(--status-critical)_35%,transparent)] text-ink-muted line-through decoration-[color-mix(in_srgb,var(--status-critical)_60%,transparent)]"
                    : isSelected
                      ? "border-[var(--text-primary)] bg-[var(--surface-card-2)] text-ink"
                      : "border-[var(--border-hairline)] text-ink-body hover:border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--surface-card-2)_50%,transparent)]"
              } disabled:cursor-default`}
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
          <button type="button" onClick={submit} disabled={selected === null || pending || lastWrong} className="btn btn-primary">
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
        <div className="mt-4 rounded-xl bg-[var(--surface-card-2)] px-4 py-3.5 text-sm leading-relaxed text-ink-secondary">
          <p className="mb-1 text-xs font-medium text-ink-muted">해설</p>
          {explanation}
        </div>
      )}
    </fieldset>
  );
}
