import type { ReactNode } from "react";
import Link from "next/link";
import { learningField } from "@/content/fields";
import type { ModuleStatus } from "@/lib/study";
import { assignmentHref, lessonHref, moduleHref, practiceHref, recallHref, reviewHref, trackHref } from "@/lib/routes";
import HashTarget from "@/components/HashTarget";
import Icon from "@/components/Icon";
import ModuleTabs, { type ModuleTab } from "./ModuleTabs";

/**
 * 모듈 머리글 + 모듈 메뉴(개요 · 레슨 · 실습 · 과제 · 복습 노트). 진행 상태가 화면마다 최신이어야 해서
 * 레이아웃이 아니라 각 화면이 렌더링한다. compact면 큰 머리글 대신 한 줄짜리 위치 표시만 둔다(레슨 화면).
 */
export default function ModuleFrame({
  status,
  compact = false,
  lessonId,
  children,
}: {
  status: ModuleStatus;
  compact?: boolean;
  lessonId?: string;
  children: ReactNode;
}) {
  const { module } = status;
  const field = learningField(module.track);
  const slug = module.slug;
  const minutes = module.lessons.filter((l) => l.tier === "core").reduce((sum, l) => sum + l.minutes, 0);
  const hours = Math.round((minutes / 60) * 2) / 2;
  const { done, total } = status.tiers.core;
  // "레슨" 탭은 지금 할 레슨으로 바로 간다(모두 마쳤으면 첫 레슨).
  const lessonTarget = lessonId ?? status.currentLesson?.id ?? module.lessons[0]?.id;
  const tabs: ModuleTab[] = [
    { href: moduleHref(slug), label: "개요" },
    {
      href: lessonTarget ? lessonHref(slug, lessonTarget) : moduleHref(slug),
      label: "레슨",
      sub: total > 0 ? `${done}/${total}` : undefined,
      done: total > 0 && status.coreDone,
      prefix: `${moduleHref(slug)}/lessons/`,
    },
  ];
  if (lessonTarget) {
    tabs.push({
      href: practiceHref(slug, lessonTarget),
      label: "실습",
      prefix: `${moduleHref(slug)}/practice/`,
      alsoActiveOn: module.recall.length > 0 ? recallHref(slug) : undefined,
    });
  }
  if (status.assignment) tabs.push({ href: assignmentHref(slug), label: "과제", done: status.assignment.status === "graded" });
  tabs.push({ href: reviewHref(slug), label: "복습 노트" });

  const crumbs = (
    <nav aria-label="현재 위치" className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] text-ink-muted print:hidden">
      <Link href="/curriculum" className="shrink-0 transition hover:text-ink">
        커리큘럼
      </Link>
      <Icon name="chevronRight" size={12} className="shrink-0" />
      <Link href={trackHref(module.track)} className="shrink-0 transition hover:text-ink">
        {field.title}
      </Link>
      {compact && (
        <>
          <Icon name="chevronRight" size={12} className="shrink-0" />
          <Link href={moduleHref(slug)} className="truncate font-medium text-ink-secondary transition hover:text-ink">
            {module.code} {module.title}
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <>
      {compact ? (
        <header className="mb-5">
          {crumbs}
          <h1 className="sr-only">
            {module.code} {module.title}
          </h1>
        </header>
      ) : (
        <header className="mb-8 sm:mb-10">
          <div className="mb-7">{crumbs}</div>
          <p className="kicker mb-3">모듈 {module.code}</p>
          <h1 className="page-title">{module.title}</h1>
          <p className="page-lead mt-3">{module.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-muted">
            {total > 0 && <span>핵심 레슨 {total}개 · 약 {hours}시간</span>}
            {total > 0 && (
              <span className="flex items-center gap-2.5" title="모듈 완료는 핵심 레슨만으로 판단합니다">
                <span className="meter block w-16" aria-hidden="true">
                  <span style={{ width: `${Math.round(status.ratio * 100)}%`, background: status.coreDone ? "var(--status-good)" : undefined }} />
                </span>
                <span className="tabular-nums">
                  완료 {done}/{total}
                </span>
              </span>
            )}
            {module.track === "extension" && <span>자유 학습 · 레슨 {module.lessons.length}개</span>}
          </div>
        </header>
      )}
      <ModuleTabs tabs={tabs} />
      <div className="pt-8 sm:pt-10">{children}</div>
      <HashTarget />
    </>
  );
}
