"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";
import { useProgressStatuses } from "@/components/progress/ProgressStore";
import { drillKey } from "@/lib/progressIds";

export interface DrillSequenceItem {
  /** DrillChoice·DrillPredict가 자신의 뿌리 요소에 매기는 id(`drill-{id}`)와 같은 문항 id */
  id: string;
  /** 맞혔거나(객관식) 맞혔거나 정답을 공개한(출력 예측) 상태 */
  done: boolean;
  node: ReactNode;
}

/**
 * 추가 퀴즈를 한 번에 하나씩 보여 준다(확인 문제의 CheckSequence와 같은 방식).
 * 맞히면(또는 출력 예측에서 정답을 공개하면) 바로 「다음 문항」 버튼이 나타난다.
 * 위의 번호 막대로 이미 마친 문항을 다시 볼 수 있다.
 * 다른 화면의 "관련 추가 퀴즈" 링크(#drill-{id})로 들어오면 그 문항을 바로 연다.
 * 문항을 마쳤는지는 진행 저장소(ProgressStore)에서 읽는다(답할 때 화면을 다시 받지 않으므로).
 */
export default function DrillSequence({ items: serverItems }: { items: DrillSequenceItem[] }) {
  const statuses = useProgressStatuses();
  const items = serverItems.map((it) => ({ ...it, done: statuses?.[drillKey(it.id)]?.done ?? it.done }));
  const firstUndone = items.findIndex((it) => !it.done);
  const allDone = firstUndone === -1;
  const [index, setIndex] = useState(allDone ? items.length : firstUndone);
  const nextRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const current = items[index];
  const currentDone = !!current?.done;
  const doneCount = items.filter((it) => it.done).length;

  // 주소의 #drill-{id}가 이 목록의 문항을 가리키면 그 문항부터 연다.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const i = items.findIndex((it) => `drill-${it.id}` === hash);
    if (i === -1) return;
    const raf = requestAnimationFrame(() => {
      setIndex(i);
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 방금 맞혔으면(또는 정답을 공개했으면) 키보드 사용자가 바로 다음으로 갈 수 있게 버튼으로 초점을 옮긴다.
  const wasDone = useRef(currentDone);
  useEffect(() => {
    if (currentDone && !wasDone.current) nextRef.current?.focus();
    wasDone.current = currentDone;
  }, [currentDone, index]);

  const go = (i: number) => {
    setIndex(i);
    wasDone.current = !!items[i]?.done;
    headingRef.current?.focus();
  };

  // 다음으로: 뒤쪽에서 아직 못 마친 문항 → 앞쪽에서 못 마친 문항 → 모두 마쳤으면 결과
  const nextTarget = () => {
    const after = items.findIndex((it, i) => i > index && !it.done);
    if (after !== -1) return after;
    const before = items.findIndex((it) => !it.done);
    return before === -1 ? items.length : before;
  };

  const canOpen = (i: number) => i === index || items[i].done || i === firstUndone;

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p ref={headingRef} tabIndex={-1} className="text-sm font-medium tabular-nums text-ink outline-none" aria-live="polite">
          {index < items.length ? `문항 ${index + 1} / ${items.length}` : "결과"}
          <span className="ml-2 font-normal text-ink-muted">마친 문항 {doneCount}</span>
        </p>
        <ol className="flex flex-wrap items-center gap-1" aria-label="추가 퀴즈 문항 목록">
          {items.map((it, i) => {
            const done = it.done;
            const active = i === index;
            const open = canOpen(i);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  disabled={!open}
                  aria-current={active ? "step" : undefined}
                  aria-label={`문항 ${i + 1}${done ? " (완료)" : open ? "" : " (앞 문항을 풀면 열립니다)"}`}
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs tabular-nums transition ${
                    active
                      ? "bg-[var(--inverse-bg)] font-semibold text-[var(--inverse-fg)]"
                      : done
                        ? "bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)] hover:opacity-80"
                        : open
                          ? "border border-[var(--border-strong)] text-ink-secondary hover:border-[var(--text-primary)]"
                          : "border border-[var(--border-hairline)] text-ink-muted opacity-60"
                  } disabled:cursor-not-allowed`}
                >
                  {done && !active ? <Icon name="check" size={13} strokeWidth={2} /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {index < items.length ? (
        <>
          {current.node}
          <div className="mt-4 flex items-center justify-between gap-3">
            {index > 0 ? (
              <button type="button" onClick={() => go(index - 1)} className="btn btn-ghost btn-sm -ml-3">
                <Icon name="arrowLeft" size={14} />
                이전 문항
              </button>
            ) : (
              <span />
            )}
            {currentDone && (
              <button ref={nextRef} type="button" onClick={() => go(nextTarget())} className="btn btn-primary">
                {items.some((it, i) => i !== index && !it.done) ? "다음 문항" : "결과 보기"}
                <Icon name="arrowRight" size={15} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="surface p-6" aria-live="polite">
          {allDone ? (
            <p className="flex items-center gap-2 font-semibold text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                <Icon name="check" size={13} strokeWidth={2} />
              </span>
              {items.length}문항을 모두 마쳤습니다
            </p>
          ) : (
            <>
              <p className="font-semibold text-ink">
                {items.length}문항 중 {doneCount}문항을 마쳤습니다
              </p>
              <button type="button" onClick={() => go(firstUndone)} className="btn btn-primary mt-4">
                남은 문항 풀기
                <Icon name="arrowRight" size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
