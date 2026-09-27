"use client";

import { useState, useTransition, type ReactNode } from "react";
import { reviewQuizAnswer, saveQuizAnswer } from "@/lib/studyActions";

/**
 * 서술형 점검 문항: 먼저 직접 쓰고(능동 회상) → 모범답안과 비교 → 스스로 평가.
 * 모범답안은 답을 저장한 뒤에만 서버가 내려준다.
 */
export default function DescriptiveQuestion({
  slug,
  sectionId,
  quizId,
  index,
  question,
  savedText,
  review,
  modelAnswer,
}: {
  slug: string;
  sectionId: string;
  quizId: string;
  index: number;
  question: ReactNode;
  savedText?: string;
  review?: "correct" | "incorrect";
  modelAnswer?: ReactNode;
}) {
  const [text, setText] = useState(savedText ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const answered = !!savedText;
  const dirty = text.trim() !== (savedText ?? "").trim();

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveQuizAnswer(slug, sectionId, quizId, text);
        if (!result.ok) setError(result.error);
      } catch {
        setError("저장에 실패했습니다. 새로고침한 뒤 다시 시도해주세요.");
      }
    });
  };

  const mark = (value: "correct" | "incorrect") => {
    startTransition(async () => {
      try {
        await reviewQuizAnswer(slug, sectionId, quizId, value);
      } catch {
        setError("저장에 실패했습니다. 새로고침한 뒤 다시 시도해주세요.");
      }
    });
  };

  return (
    <div className={`rounded-xl border bg-card p-4 sm:p-5 ${review ? "border-[var(--status-good)]/60" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-md bg-[color-mix(in_srgb,var(--series-violet)_14%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--series-violet)]">
          서술 {index + 1}
        </span>
        <div className="text-[15px] font-medium text-ink">{question}</div>
      </div>
      <label className="sr-only" htmlFor={`answer-${quizId}`}>
        내 답
      </label>
      <textarea
        id={`answer-${quizId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="자료를 다시 보지 말고, 내 말로 먼저 적어보세요. 정확하지 않아도 괜찮습니다."
        className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {(!answered || dirty) && (
          <button
            type="button"
            onClick={save}
            disabled={!text.trim() || pending}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "저장 중…" : answered ? "수정한 답 저장" : "답 저장하고 모범답안 보기"}
          </button>
        )}
        {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
      </div>

      {answered && modelAnswer && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-3 py-2.5 text-sm">
            <p className="mb-1 text-xs font-bold text-[var(--status-good)]">모범답안</p>
            <div className="text-ink-secondary">{modelAnswer}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-secondary">내 답을 모범답안과 비교하면?</span>
            <button
              type="button"
              onClick={() => mark("correct")}
              disabled={pending}
              aria-pressed={review === "correct"}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                review === "correct"
                  ? "bg-[var(--status-good)] text-white"
                  : "border border-[var(--border-hairline)] text-ink-secondary hover:bg-[var(--surface-card-2)]"
              }`}
            >
              핵심을 맞게 썼어요
            </button>
            <button
              type="button"
              onClick={() => mark("incorrect")}
              disabled={pending}
              aria-pressed={review === "incorrect"}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                review === "incorrect"
                  ? "bg-[var(--status-critical)] text-white"
                  : "border border-[var(--border-hairline)] text-ink-secondary hover:bg-[var(--surface-card-2)]"
              }`}
            >
              부족했어요 (복습 노트에 담기)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
