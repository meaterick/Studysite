import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import type { WeekMeta } from "@/content/types";
import { getWeekOutline } from "@/content/sections";
import { getCurrentUser } from "@/lib/dal";
import { loginHref } from "@/lib/returnPath";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { continueHref, weekStatus, type WeekStatus } from "@/lib/study";
import { phaseInfo } from "@/lib/phases";
import NextStep from "@/components/NextStep";
import PageHeader from "@/components/PageHeader";
import DifficultyBadge from "@/components/DifficultyBadge";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "주차별 자료" };

export default async function WeeksIndexPage() {
  const user = await getCurrentUser();
  // 로그인하지 않은 방문자도 목록은 볼 수 있다. 진도는 빈 기록으로 계산하고, 각 줄은 로그인 페이지로 보낸다.
  const record = user ? getLearningRecord(user.id) : { sections: {}, worksheets: {} };
  const statuses = new Map(WEEKS.map((w) => [w.slug, weekStatus(w, record, user ? findUserSubmission(user.id, w.slug) : undefined)]));
  const phases = Array.from(new Set(WEEKS.map((w) => w.phase)));
  // 지금 학습할 주차: 핵심 단계·백지공부·과제 중 하나라도 남은 첫 주차(내 진도와 같은 기준)
  const focus = user
    ? WEEKS.find((w) => {
        const st = statuses.get(w.slug)!;
        return !st.coreDone || !st.worksheetSubmitted || st.assignment.status === "none";
      })
    : undefined;
  const focusStatus = focus ? statuses.get(focus.slug)! : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="주차별 자료"
        actions={
          !user && (
            <Link href={loginHref("/weeks")} className="btn btn-primary">
              로그인하고 시작하기
            </Link>
          )
        }
      />

      {focus && focusStatus && (
        <div className="mb-16">
          <NextStep
            eyebrow={focusStatus.tiers.core.done === 0 ? "이번에 시작할 주차" : "이어서 학습"}
            title={`${focus.number}주차 · ${focus.title}`}
            detail={focusStatus.currentSection ? `다음 단계 · ${focusStatus.currentSection.title}` : "백지공부와 과제가 남았습니다"}
            href={continueHref(focus.slug, focusStatus)}
            cta={focusStatus.tiers.core.done === 0 ? "시작하기" : "이어서 학습"}
            meta={`핵심 ${focusStatus.tiers.core.done}/${focusStatus.tiers.core.total}단계`}
          />
        </div>
      )}

      <div className="space-y-14">
        {phases.map((phase) => {
          const info = phaseInfo(phase);
          return (
            <section key={phase} aria-labelledby={`phase-${info.index}`}>
              <h2 id={`phase-${info.index}`} className="flex items-center gap-3 border-b border-[var(--border-hairline)] pb-3">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: info.color }} />
                <span className="kicker">Part {String(info.index).padStart(2, "0")}</span>
                <span className="text-sm font-semibold text-ink">{info.name}</span>
              </h2>
              <ol className="rows">
                {WEEKS.filter((w) => w.phase === phase).map((w) => (
                  <li key={w.slug}>
                    <WeekRow
                      week={w}
                      status={statuses.get(w.slug)!}
                      minutes={getWeekOutline(w).sections.reduce((sum, x) => sum + x.minutes, 0)}
                      locked={!user}
                      current={w.slug === focus?.slug}
                    />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** 목차 한 줄: 큰 번호 · 제목과 한 줄 설명 · 난이도·시간·진행 */
function WeekRow({ week, status, minutes, locked, current }: { week: WeekMeta; status: WeekStatus; minutes: number; locked: boolean; current: boolean }) {
  const href = `/weeks/${week.slug}`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  const { done, total } = status.tiers.core;
  const complete = total > 0 && done >= total;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <Link
      href={locked ? loginHref(href) : href}
      prefetch={locked ? false : undefined}
      className="group row-hover -mx-3 grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-x-6"
    >
      <span
        aria-hidden="true"
        className={`text-[1.75rem] font-light leading-none tabular-nums tracking-[-0.04em] transition sm:text-[2.25rem] ${current ? "text-ink" : "text-ink-muted group-hover:text-ink"}`}
      >
        {String(week.number).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="sr-only">{week.number}주차 </span>
          <span className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:truncate">{week.title}</span>
          {current && <span className="pill shrink-0 [--pill:var(--accent)]">학습 중</span>}
          {!locked && complete && !current && (
            <span className="shrink-0 text-[var(--status-good)]">
              <Icon name="check" size={16} />
              <span className="sr-only">완료</span>
            </span>
          )}
        </span>
        <span className="mt-1 block truncate text-sm text-ink-muted">{week.subtitle}</span>
        <span className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted md:hidden">
          <DifficultyBadge level={week.difficulty} compact />
          <span>약 {hours}시간</span>
          {!locked && (
            <span className="tabular-nums">
              핵심 {done}/{total}
            </span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-7">
        <span className="hidden w-[4.5rem] md:block">
          <DifficultyBadge level={week.difficulty} compact />
        </span>
        <span className="hidden w-14 text-xs tabular-nums text-ink-muted md:block">약 {hours}시간</span>
        {!locked && (
          <span className="hidden w-24 md:block">
            <span className="mb-1.5 block text-right text-xs tabular-nums text-ink-muted">
              {done}/{total}
            </span>
            <span className="meter block" aria-hidden="true">
              <span style={{ width: `${pct}%`, background: complete ? "var(--status-good)" : undefined }} />
            </span>
          </span>
        )}
        <Icon name="chevronRight" size={18} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </span>
    </Link>
  );
}
