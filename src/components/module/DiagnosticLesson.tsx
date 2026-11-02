"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import CheckQuestion, { type CheckStateView } from "@/components/lesson/CheckQuestion";
import Icon from "@/components/Icon";

export interface DiagnosticItem {
  itemKey: string;
  question: ReactNode;
  choices: ReactNode[];
  state: CheckStateView | null;
  explanation?: ReactNode;
  correctIndex?: number;
}

/**
 * 진단 평가의 레슨 한 묶음: 레슨의 확인 문제를 모두 보여 준다. 모두 맞히면 서버가 레슨을 완료로 인정하고
 * (answerCheck의 credit), 이 묶음은 곧바로 "인정" 상태로 바뀐다. 진도 숫자는 화면을 새로 받아 갱신한다.
 */
export default function DiagnosticLesson({
  lessonId,
  heading,
  completed,
  items,
}: {
  lessonId: string;
  heading: ReactNode;
  completed: boolean;
  items: DiagnosticItem[];
}) {
  const router = useRouter();
  const [credited, setCredited] = useState(false);
  const done = completed || credited;
  return (
    <section className={`rounded-2xl border p-5 sm:p-7 ${done ? "border-[color-mix(in_srgb,var(--status-good)_40%,transparent)]" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">{heading}</div>
        {done && (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--status-good)]">
            <Icon name="check" size={15} />
            {credited ? "완료로 인정했습니다" : "완료한 레슨"}
          </span>
        )}
      </div>
      {!completed && (
        <div className="space-y-4">
          {items.map((it, i) => (
            <CheckQuestion
              key={it.itemKey}
              lessonId={lessonId}
              itemKey={it.itemKey}
              credit
              onCredited={() => {
                setCredited(true);
                router.refresh();
              }}
              index={i}
              question={it.question}
              choices={it.choices}
              state={it.state}
              explanation={it.explanation}
              correctIndex={it.correctIndex}
            />
          ))}
        </div>
      )}
    </section>
  );
}
