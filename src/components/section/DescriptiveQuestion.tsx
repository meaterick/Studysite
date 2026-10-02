"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useUserScope } from "@/components/UserScope";
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
  const uid = useUserScope();
  const draftKey = `aegis:draft:${uid}:${quizId}`;
  const [text, setText] = useState(savedText ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = !!savedText;
  const dirty = text.trim() !== (savedText ?? "").trim();

  // 저장하지 않은 초안은 브라우저에 임시로 보관해, 페이지를 벗어났다 돌아와도 이어서 쓸 수 있게 한다.
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft && draft.trim() && draft.trim() !== (savedText ?? "").trim()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 한 번, 외부 저장소(localStorage)에서 초안을 복원한다
        setText(draft);
        setRestored(true);
      }
    } catch {
      // 저장소를 쓸 수 없는 환경에서는 초안 복원을 건너뛴다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const onChange = (value: string) => {
    setText(value);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, value);
      } catch {
        // 무시
      }
    }, 400);
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // 무시
    }
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveQuizAnswer(slug, sectionId, quizId, text);
        if (!result.ok) setError(result.error);
        else {
          clearDraft();
          setRestored(false);
        }
      } catch {
        setError("저장에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  const mark = (value: "correct" | "incorrect") => {
    startTransition(async () => {
      try {
        await reviewQuizAnswer(slug, sectionId, quizId, value);
      } catch {
        setError("저장에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  return (
    <div className={`rounded-2xl border p-5 sm:p-7 ${review ? "border-[color-mix(in_srgb,var(--status-good)_40%,transparent)]" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-5 flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-muted">
          서술형 {index + 1} · 선택
        </span>
        <div className="text-base font-medium leading-relaxed text-ink">{question}</div>
      </div>
      <label className="sr-only" htmlFor={`answer-${quizId}`}>
        내 답
      </label>
      <textarea
        id={`answer-${quizId}`}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="자료를 다시 보지 말고 자신의 말로 먼저 적어 보십시오. 완벽하지 않아도 괜찮습니다."
        className="w-full rounded-xl border border-[var(--border-strong)] bg-card px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted"
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {(!answered || dirty) && (
          <button
            type="button"
            onClick={save}
            disabled={!text.trim() || pending}
            className="btn btn-primary"
          >
            {pending ? "저장 중…" : answered ? "수정한 답안 저장" : "답안 저장 후 모범답안 보기"}
          </button>
        )}
        {restored && dirty && <p className="text-xs text-ink-muted">저장하지 않은 초안을 불러왔습니다.</p>}
        {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
      </div>

      {answered && modelAnswer && (
        <div className="mt-5 space-y-4">
          <div className="callout callout-good">
            <p className="mb-1 text-xs font-medium text-[var(--status-good)]">모범답안</p>
            <div className="text-ink-body">{modelAnswer}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">자기평가</span>
            <button
              type="button"
              onClick={() => mark("correct")}
              disabled={pending}
              aria-pressed={review === "correct"}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review === "correct"
                  ? "border-[color-mix(in_srgb,var(--status-good)_45%,transparent)] bg-[color-mix(in_srgb,var(--status-good)_8%,transparent)] text-[var(--status-good)]"
                  : "border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--border-strong)] hover:text-ink"
              }`}
            >
              핵심을 제대로 썼습니다
            </button>
            <button
              type="button"
              onClick={() => mark("incorrect")}
              disabled={pending}
              aria-pressed={review === "incorrect"}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review === "incorrect"
                  ? "border-[color-mix(in_srgb,var(--status-critical)_45%,transparent)] bg-[color-mix(in_srgb,var(--status-critical)_8%,transparent)] text-[var(--status-critical)]"
                  : "border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--border-strong)] hover:text-ink"
              }`}
            >
              보완이 필요합니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
