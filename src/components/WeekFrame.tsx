import type { ReactNode } from "react";
import type { WeekMeta } from "@/content/types";
import { continueHref, type WeekStatus } from "@/lib/study";
import type { LearningRecord } from "@/lib/learningStore";
import { applySummary, type ApplyKey } from "@/lib/applyView";
import WeekTabs from "./WeekTabs";
import ApplyNav from "./ApplyNav";
import ProgressRing from "./ProgressRing";
import DifficultyBadge from "./DifficultyBadge";

/**
 * 주차 머리글 + 학습 흐름 탭(개요 · 학습 자료 · 적용과 복습). 진행 상태가 페이지마다 최신이어야 해서
 * 레이아웃이 아니라 각 페이지가 렌더링한다. apply를 주면 적용과 복습의 하위 메뉴도 함께 보여 준다.
 */
export default function WeekFrame({
  week,
  status,
  record,
  apply,
  children,
}: {
  week: WeekMeta;
  status: WeekStatus;
  record: LearningRecord;
  apply?: ApplyKey | "hub";
  children: ReactNode;
}) {
  const summary = applySummary(week, record, status);
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">{week.phase}</p>
          <h1 className="text-2xl font-black leading-tight text-ink sm:text-3xl">
            {week.number}주차 · {week.title}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-secondary">{week.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
            <DifficultyBadge level={week.difficulty} />
            <span title="주차 완료는 핵심 단계만으로 판단합니다">
              핵심 {status.tiers.core.done}/{status.tiers.core.total}단계 완료
              {status.coreDone && " ✓"}
            </span>
            {status.tiers.supplement.total > 0 && (
              <span>
                보충 {status.tiers.supplement.done}/{status.tiers.supplement.total}
              </span>
            )}
            {status.tiers.advanced.total > 0 && (
              <span>
                심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-center" title="학습 자료의 핵심 단계 완료 비율(백지공부·과제와 보충·심화는 따로 기록)">
          <ProgressRing ratio={status.ratio} size={56} />
          <p className="mt-1 text-[11px] font-bold text-ink-muted">진행률</p>
        </div>
      </div>
      <WeekTabs
        slug={week.slug}
        stageHref={continueHref(week.slug, status)}
        stageSub={`핵심 ${status.tiers.core.done}/${status.tiers.core.total} 완료`}
        stageDone={status.coreDone}
        applySub={`필수 ${summary.requiredDone}/${summary.requiredTotal} 완료`}
        applyDone={summary.requiredDone === summary.requiredTotal}
      />
      {apply && <ApplyNav slug={week.slug} summary={summary} active={apply} />}
      {children}
    </>
  );
}
