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
    <div className={`rounded-xl border bg-card p-4 sm:p-5 ${review ? "border-[var(--status-good)]/60" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-md bg-[color-mix(in_srgb,var(--series-violet)_14%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--series-violet)]">
          서술형 {index + 1} · 선택
        </span>
        <div className="text-[15px] font-medium text-ink">{question}</div>
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
            {pending ? "저장 중…" : answered ? "수정한 답안 저장" : "답안 저장 후 모범답안 보기"}
          </button>
        )}
        {restored && dirty && <p className="text-xs text-ink-muted">저장하지 않은 초안을 불러왔습니다.</p>}
        {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
      </div>

      {answered && modelAnswer && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-3 py-2.5 text-sm">
            <p className="mb-1 text-xs font-bold text-[var(--status-good)]">모범답안</p>
            <div className="text-ink-secondary">{modelAnswer}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-secondary">모범답안과 비교한 자기평가:</span>
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
              핵심을 제대로 썼습니다
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
              보완이 필요합니다 (복습 노트에 추가)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
