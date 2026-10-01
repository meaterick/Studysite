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
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">1~8주차</p>
      <h1 className="mb-8 text-3xl font-black text-ink">주차별 학습 자료</h1>
      {!user && (
        <p className="-mt-4 mb-8 rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink-secondary">
          각 주차의 학습 자료·실습·과제는 로그인한 스터디원만 볼 수 있습니다.{" "}
          <Link href={loginHref("/weeks")} className="font-bold text-[var(--series-blue)] hover:underline">
            로그인하기 →
          </Link>
        </p>
      )}
      {phases.map((phase) => (
        <section key={phase} className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">{phase}</h2>
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
