import type { ReactNode } from "react";
import Link from "next/link";
import type { WeekMeta } from "@/content/types";
import { getWeekOutline } from "@/content/sections";
import { continueHref, type WeekStatus } from "@/lib/study";
import type { LearningRecord } from "@/lib/learningStore";
import { applySummary, type ApplyKey } from "@/lib/applyView";
import { phaseInfo } from "@/lib/phases";
import WeekTabs from "./WeekTabs";
import ApplyNav from "./ApplyNav";
import DifficultyBadge from "./DifficultyBadge";
import HashTarget from "./HashTarget";
import Icon from "./Icon";

/**
 * 주차 머리글 + 학습 흐름 탭(개요 · 학습 자료 · 적용과 복습). 진행 상태가 페이지마다 최신이어야 해서
 * 레이아웃이 아니라 각 페이지가 렌더링한다. apply를 주면 적용과 복습의 하위 메뉴도 함께 보여 준다.
 */
export default function WeekFrame({
  week,
  status,
  record,
  apply,
  compact = false,
  children,
}: {
  week: WeekMeta;
  status: WeekStatus;
  record: LearningRecord;
  apply?: ApplyKey | "hub";
  /** 학습 자료·활동 화면: 큰 머리글 대신 한 줄짜리 위치 표시만 두어 본문이 먼저 보이게 한다. */
  compact?: boolean;
  children: ReactNode;
}) {
  const summary = applySummary(week, record, status);
  const minutes = getWeekOutline(week).sections.reduce((sum, s) => sum + s.minutes, 0);
  const hours = Math.round((minutes / 60) * 2) / 2;
  const { done, total } = status.tiers.core;
  return (
    <>
      {compact ? (
        <header className="mb-5">
          <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-muted print:hidden">
            <Link href="/weeks" className="shrink-0 transition hover:text-ink">
              주차별 자료
            </Link>
            <Icon name="chevronRight" size={12} className="shrink-0" />
            <Link href={`/weeks/${week.slug}`} className="truncate font-medium text-ink-secondary transition hover:text-ink">
              {week.number}주차 · {week.title}
            </Link>
          </nav>
          <h1 className="sr-only">
            {week.number}주차 · {week.title}
          </h1>
        </header>
      ) : (
        <header className="mb-8 sm:mb-10">
          <nav aria-label="현재 위치" className="mb-7 flex items-center gap-1.5 text-[13px] text-ink-muted print:hidden">
            <Link href="/weeks" className="transition hover:text-ink">
              주차별 자료
            </Link>
            <Icon name="chevronRight" size={12} />
            <span>{phaseInfo(week.phase).name}</span>
          </nav>
          <p className="kicker mb-3">Week {String(week.number).padStart(2, "0")}</p>
          <h1 className="page-title">
            <span className="sr-only">{week.number}주차 · </span>
            {week.title}
          </h1>
          <p className="page-lead mt-3">{week.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-muted">
            <DifficultyBadge level={week.difficulty} />
            <span>약 {hours}시간</span>
            <span className="flex items-center gap-2.5" title="주차 완료는 핵심 단계만으로 판단합니다">
              <span className="meter block w-16" aria-hidden="true">
                <span style={{ width: `${Math.round(status.ratio * 100)}%`, background: status.coreDone ? "var(--status-good)" : undefined }} />
              </span>
              <span className="tabular-nums">
                핵심 {done}/{total}
              </span>
            </span>
          </div>
        </header>
      )}
      <WeekTabs
        slug={week.slug}
        stageHref={continueHref(week.slug, status)}
        stageSub={`${done}/${total}`}
        stageDone={status.coreDone}
        applySub={`${summary.pathDone}/${summary.pathTotal}`}
        applyDone={summary.pathDone === summary.pathTotal}
      />
      {apply && <ApplyNav slug={week.slug} summary={summary} active={apply} />}
      <div className="pt-8 sm:pt-10">{children}</div>
      <HashTarget />
    </>
  );
}
