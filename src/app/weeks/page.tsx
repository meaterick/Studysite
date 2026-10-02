import type { Metadata } from "next";
import { WEEKS } from "@/content/weeks";
import WeekCard from "@/components/WeekCard";
import { getWeekOutline } from "@/content/sections";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { loginHref } from "@/lib/returnPath";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";
import PageHeader from "@/components/PageHeader";

// 부(phase)마다 커리큘럼과 같은 색을 써서 두 화면이 한 체계로 읽히게 한다.
const PHASE_COLOR: Record<string, string> = {
  "1부 · 기초": "var(--series-blue)",
  "2부 · 딥러닝": "var(--series-aqua)",
  "3부 · 현대 AI": "var(--series-violet)",
  "4부 · 활용·책임": "var(--series-orange)",
};

export const metadata: Metadata = { title: "주차별 자료" };

export default async function WeeksIndexPage() {
  const user = await getCurrentUser();
  // 로그인하지 않은 방문자도 목록은 볼 수 있다. 진도는 빈 기록으로 계산하고, 카드는 로그인 페이지로 보낸다.
  const record = user ? getLearningRecord(user.id) : { sections: {}, worksheets: {} };
  const statuses = new Map(
    WEEKS.map((w) => [w.slug, weekStatus(w, record, user ? findUserSubmission(user.id, w.slug) : undefined)])
  );
  const phases = Array.from(new Set(WEEKS.map((w) => w.phase)));
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="1~8주차"
        title="주차별 학습 자료"
        description="주차를 고르면 개요 → 학습 자료 → 적용과 복습 순서로 진행합니다."
        actions={
          <Link href="/curriculum" className="btn btn-secondary">
            커리큘럼 보기
          </Link>
        }
      />
      {!user && (
        <div className="callout mb-10 flex flex-wrap items-center justify-between gap-3">
          <p>각 주차의 학습 자료·실습·과제는 로그인한 스터디원만 볼 수 있습니다.</p>
          <Link href={loginHref("/weeks")} className="btn btn-primary btn-sm">
            로그인하기 →
          </Link>
        </div>
      )}
      {phases.map((phase, pi) => (
        <section key={phase} aria-labelledby={`phase-${pi}`} className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-5 w-1.5 rounded-full" style={{ background: PHASE_COLOR[phase] ?? "var(--series-blue)" }} />
            <h2 id={`phase-${pi}`} className="text-base font-black text-ink">
              {phase}
            </h2>
            <span className="text-xs font-bold text-ink-muted">
              {WEEKS.filter((w) => w.phase === phase)
                .map((w) => `${w.number}주차`)
                .join(" · ")}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-hairline)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEEKS.filter((w) => w.phase === phase).map((w) => (
              <WeekCard
                key={w.slug}
                week={w}
                ratio={statuses.get(w.slug)!.ratio}
                coreDone={statuses.get(w.slug)!.tiers.core.done}
                coreTotal={statuses.get(w.slug)!.tiers.core.total}
                minutes={getWeekOutline(w).sections.reduce((sum, x) => sum + x.minutes, 0)}
                locked={!user}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
