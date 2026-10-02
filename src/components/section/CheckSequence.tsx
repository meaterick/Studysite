"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import CheckQuestion, { type CheckStateView } from "./CheckQuestion";
import Icon from "@/components/Icon";

export interface CheckItem {
  checkId: string;
  question: ReactNode;
  choices: ReactNode[];
  state: CheckStateView | null;
  explanation?: ReactNode;
  correctIndex?: number;
}

/**
 * 확인 문제를 한 번에 하나씩 보여 준다. 처음에는 아직 맞히지 못한 첫 문제를 보여 주고,
 * 맞히면 해설을 읽은 뒤 「다음 문제」로 넘어간다. 위의 번호 막대로 이미 푼 문제를 다시 볼 수 있다.
 * 채점과 기록은 CheckQuestion(서버 액션)이 하고, 서버가 새 상태를 내려주면 이 컴포넌트가 다시 그린다.
 */
export default function CheckSequence({
  slug,
  sectionId,
  items,
  completed,
}: {
  slug: string;
  sectionId: string;
  items: CheckItem[];
  /** 이미 「단계 완료」를 누른 단계인지 */
  completed: boolean;
}) {
  const firstUnsolved = items.findIndex((it) => !it.state?.correct);
  const allSolved = firstUnsolved === -1;
  // 다 맞힌 단계에 다시 들어오면 요약부터 보여 준다(items.length = 요약 화면).
  const [index, setIndex] = useState(allSolved ? items.length : firstUnsolved);
  const nextRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const current = items[index];
  const currentSolved = !!current?.state?.correct;
  const solvedCount = items.filter((it) => it.state?.correct).length;

  // 방금 맞혔으면 키보드 사용자가 바로 다음으로 갈 수 있게 버튼으로 초점을 옮긴다.
  const wasSolved = useRef(currentSolved);
  useEffect(() => {
    if (currentSolved && !wasSolved.current) nextRef.current?.focus();
    wasSolved.current = currentSolved;
  }, [currentSolved, index]);

  const go = (i: number) => {
    setIndex(i);
    wasSolved.current = !!items[i]?.state?.correct;
    headingRef.current?.focus();
  };

  // 다음으로: 뒤쪽에서 아직 못 푼 문제 → 앞쪽에서 못 푼 문제 → 모두 맞혔으면 요약
  const nextTarget = () => {
    const after = items.findIndex((it, i) => i > index && !it.state?.correct);
    if (after !== -1) return after;
    const before = items.findIndex((it) => !it.state?.correct);
    return before === -1 ? items.length : before;
  };

  const canOpen = (i: number) => i === index || !!items[i].state?.correct || i === firstUnsolved;

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p ref={headingRef} tabIndex={-1} className="text-sm font-medium tabular-nums text-ink outline-none" aria-live="polite">
          {index < items.length ? `문제 ${index + 1} / ${items.length}` : "결과"}
          <span className="ml-2 font-normal text-ink-muted">맞힌 문제 {solvedCount}</span>
        </p>
        <ol className="flex flex-wrap items-center gap-1" aria-label="확인 문제 목록">
          {items.map((it, i) => {
            const solved = !!it.state?.correct;
            const active = i === index;
            const open = canOpen(i);
            return (
              <li key={it.checkId}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  disabled={!open}
                  aria-current={active ? "step" : undefined}
                  aria-label={`문제 ${i + 1}${solved ? " (맞힘)" : open ? "" : " (앞 문제를 풀면 열립니다)"}`}
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs tabular-nums transition ${
                    active
                      ? "bg-[var(--inverse-bg)] font-semibold text-[var(--inverse-fg)]"
                      : solved
                        ? "bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)] hover:opacity-80"
                        : open
                          ? "border border-[var(--border-strong)] text-ink-secondary hover:border-[var(--text-primary)]"
                          : "border border-[var(--border-hairline)] text-ink-muted opacity-60"
                  } disabled:cursor-not-allowed`}
                >
                  {solved && !active ? <Icon name="check" size={13} strokeWidth={2} /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {index < items.length ? (
        <>
          <CheckQuestion
            key={current.checkId}
            slug={slug}
            sectionId={sectionId}
            checkId={current.checkId}
            index={index}
            question={current.question}
            choices={current.choices}
            state={current.state}
            explanation={current.explanation}
            correctIndex={current.correctIndex}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            {index > 0 ? (
              <button type="button" onClick={() => go(index - 1)} className="btn btn-ghost btn-sm -ml-3">
                <Icon name="arrowLeft" size={14} />
                이전 문제
              </button>
            ) : (
              <span />
            )}
            {currentSolved && (
              <button
                ref={nextRef}
                type="button"
                onClick={() => go(nextTarget())}
                className="btn btn-primary"
              >
                {items.some((it, i) => i !== index && !it.state?.correct) ? "다음 문제" : "결과 보기"}
                <Icon name="arrowRight" size={15} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="surface p-6" aria-live="polite">
          {allSolved ? (
            <>
              <p className="flex items-center gap-2 font-semibold text-ink">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                  <Icon name="check" size={13} strokeWidth={2} />
                </span>
                {items.length}문제를 모두 맞혔습니다
              </p>
              <p className="mt-2 text-sm text-ink-muted">{completed ? "완료한 단계입니다." : "아래의 단계 완료를 눌러 마무리하십시오."}</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink">
                {items.length}문제 중 {solvedCount}문제를 맞혔습니다
              </p>
              <button type="button" onClick={() => go(firstUnsolved)} className="btn btn-primary mt-4">
                남은 문제 풀기
                <Icon name="arrowRight" size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
