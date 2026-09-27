import type { ReactNode } from "react";
import type { WeekMeta } from "@/content/types";
import type { WeekStatus } from "@/lib/study";
import WeekTabs from "./WeekTabs";
import ProgressRing from "./ProgressRing";

/** 주차 머리글 + 단계 탭. 잠금 상태가 페이지마다 최신이어야 해서 레이아웃이 아니라 각 페이지가 렌더링한다. */
export default function WeekFrame({
  week,
  status,
  children,
}: {
  week: WeekMeta;
  status: WeekStatus;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">{week.phase}</p>
          <h1 className="text-2xl font-black leading-tight text-ink sm:text-3xl">
            Week {week.number} · {week.title}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-secondary">{week.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
            <span aria-label={`난이도 5점 만점에 ${week.difficulty}점`}>
              난이도 {"★".repeat(week.difficulty)}
              {"☆".repeat(5 - week.difficulty)}
            </span>
            <span>
              섹션 {status.sectionsDone}/{status.sectionsTotal} 완료
            </span>
          </div>
        </div>
        <div className="shrink-0" title="섹션 + 백지공부 + 과제 제출 기준 진행률">
          <ProgressRing ratio={status.ratio} size={56} />
        </div>
      </div>
      <WeekTabs slug={week.slug} finaleLocked={!status.allSectionsDone} />
      {children}
    </>
  );
}
