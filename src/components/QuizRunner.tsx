"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { quizStore, readQuizState, writeQuizDraft, writeQuizIndex, resetQuiz } from "@/lib/progress";

export default function QuizRunner({
  slug,
  quiz,
  renderedQuestions,
}: {
  slug: string;
  quiz: { id: string; question: string }[];
  /** 문항 텍스트를 서버에서 미리 렌더링한 결과(수식 포함) — KaTeX 렌더러가
   * server-only라 클라이언트 컴포넌트인 이 파일에서 직접 import할 수 없다. */
  renderedQuestions: Record<string, ReactNode>;
}) {
  const store = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot, quizStore.getServerSnapshot);
  const state = readQuizState(store, slug);
  const index = Math.min(state.index, quiz.length - 1);
  const current = quiz[index];
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDraftChange = (value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => writeQuizDraft(slug, current.id, value), 300);
  };

  const goNext = () => {
    if (index < quiz.length - 1) writeQuizIndex(slug, index + 1);
  };
  const goPrev = () => {
    if (index > 0) writeQuizIndex(slug, index - 1);
  };

  const done = index >= quiz.length - 1 && (state.drafts[current.id]?.trim().length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          문항 {index + 1} / {quiz.length}
        </span>
        <button
          onClick={() => {
            if (confirm("퀴즈 진행 상황과 작성한 답을 모두 초기화할까요?")) resetQuiz(slug);
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
        placeholder="여기에 직접 답을 적어보세요. 정답은 세션에서 함께 확인합니다."
        className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
      />

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)] disabled:opacity-40"
        >
          ← 이전 문항
        </button>
        {done ? (
          <span className="text-xs font-bold text-[var(--status-good)]">마지막 문항까지 작성했습니다 🎉</span>
        ) : (
          <button
            onClick={goNext}
            disabled={index === quiz.length - 1}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            다음 문항 →
          </button>
        )}
      </div>
    </div>
  );
}
