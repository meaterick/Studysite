"use client";

import { useState, useRef, useSyncExternalStore, type ReactNode } from "react";
import { getQuizStore, readQuizState, writeQuizDraft, writeQuizIndex, resetQuiz } from "@/lib/progress";
import { useUserScope } from "./UserScope";

export default function QuizRunner({
  slug,
  quiz,
  renderedQuestions,
  renderedAnswers,
}: {
  slug: string;
  quiz: { id: string; question: string }[];
  /** 문항/정답 텍스트를 서버에서 미리 렌더링한 결과(수식 포함) — KaTeX 렌더러가
   * server-only라 클라이언트 컴포넌트인 이 파일에서 직접 import할 수 없다. */
  renderedQuestions: Record<string, ReactNode>;
  renderedAnswers: Record<string, ReactNode>;
}) {
  const uid = useUserScope();
  const quizStore = getQuizStore(uid);
  const store = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot, quizStore.getServerSnapshot);
  const state = readQuizState(store, slug);
  const index = Math.min(state.index, quiz.length - 1);
  const current = quiz[index];
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const onDraftChange = (value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => writeQuizDraft(uid, slug, current.id, value), 300);
  };

  const goNext = () => {
    if (index < quiz.length - 1) writeQuizIndex(uid, slug, index + 1);
  };
  const goPrev = () => {
    if (index > 0) writeQuizIndex(uid, slug, index - 1);
  };
  const reveal = () => setRevealed((prev) => new Set(prev).add(current.id));

  const hasDraft = (state.drafts[current.id]?.trim().length ?? 0) > 0;
  const isRevealed = revealed.has(current.id);
  const isLast = index === quiz.length - 1;

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          문항 {index + 1} / {quiz.length}
        </span>
        <button
          onClick={() => {
            if (confirm("퀴즈 진행 상황과 작성한 답을 모두 초기화할까요?")) {
              resetQuiz(uid, slug);
              setRevealed(new Set());
            }
          }}
          className="text-xs font-medium text-ink-muted hover:text-ink-secondary"
        >
          초기화
        </button>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-card-2)]">
        <div
          className="h-full rounded-full bg-[var(--series-blue)] transition-all"
          style={{ width: `${((index + 1) / quiz.length) * 100}%` }}
        />
      </div>

      <p className="mb-4 text-[15px] font-medium text-ink">{renderedQuestions[current.id]}</p>

      <textarea
        key={current.id}
        defaultValue={state.drafts[current.id] ?? ""}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={5}
        placeholder="여기에 직접 답을 적어본 뒤 정답을 확인해보세요."
        className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
      />

      {isRevealed ? (
        <div className="mt-3 rounded-lg border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-3 py-2.5 text-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--status-good)]">정답</p>
          <div className="text-ink-secondary">{renderedAnswers[current.id]}</div>
        </div>
      ) : (
        <button
          onClick={reveal}
          disabled={!hasDraft}
          title={hasDraft ? undefined : "먼저 위에 답을 적어보세요"}
          className="mt-3 w-full rounded-lg border border-dashed border-[var(--border-strong)] py-2 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          정답 확인
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)] disabled:opacity-40"
        >
          ← 이전 문항
        </button>
        {isLast && isRevealed ? (
          <span className="text-xs font-bold text-[var(--status-good)]">마지막 문항까지 확인했습니다 🎉</span>
        ) : (
          <button
            onClick={goNext}
            disabled={isLast}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            다음 문항 →
          </button>
        )}
      </div>
    </div>
  );
}
