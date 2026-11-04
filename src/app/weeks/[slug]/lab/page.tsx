import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekLab } from "@/content/labs";
import { getWeekOutline } from "@/content/sections";
import WeekFrame from "@/components/WeekFrame";
import CodingExercise from "@/components/lab/CodingExercise";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState } from "@/lib/learningStore";
import { exerciseView, labProgress } from "@/lib/labView";
import { TIER_INFO, TIER_ORDER } from "@/content/tiers";
import NextActivity from "@/components/NextActivity";
import Icon from "@/components/Icon";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 코딩 실습` } : {};
}

/** 코딩 실습: 학습 자료의 완성 예제와 달리, TODO를 직접 채우고 브라우저에서 자동 채점받는 문제를 단계별로 모아 보여 준다. */
export default async function WeekLabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/lab`);
  const lab = getWeekLab(slug);
  if (!lab) notFound();
  const state = readLabState(record, slug);
  const progress = labProgress(slug, state);
  // 핵심 → 보충 → 심화 순서로, 같은 구분 안에서는 연결된 단계의 본문 순서대로 보여 준다.
  const order = new Map(getWeekOutline(week).sections.map((s) => [s.id, s.order]));
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    exercises: lab.exercises
      .filter((e) => e.tier === tier)
      .sort((a, b) => (order.get(a.sectionId ?? "") ?? 0) - (order.get(b.sectionId ?? "") ?? 0)),
  })).filter((g) => g.exercises.length > 0);

  return (
    <WeekFrame week={week} status={status} record={record} apply="lab" compact>
      <div className="space-y-16">
        <section aria-labelledby="lab-intro">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="lab-intro" className="flex flex-wrap items-center gap-3 text-[1.75rem] font-bold tracking-[-0.035em] text-ink">
                코딩 실습 <span className="pill align-middle text-xs">선택</span>
              </h2>
              <p className="mt-2 text-[15px] text-ink-secondary">시작 코드의 TODO를 채우고 채점하면 항목별로 결과를 알려 줍니다.</p>
            </div>
            {progress && (
              <p className="text-[13px] tabular-nums text-ink-muted">
                통과 {progress.exercisesPassed}/{progress.exercisesTotal}
              </p>
            )}
          </div>
          <details className="group mt-5">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
              사용 방법
              <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
            </summary>
            <ul className="mt-3 max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
              <li>코드는 이 브라우저 안의 Python(Pyodide)에서만 실행·채점되며, 작성 중인 코드는 브라우저에 자동 저장됩니다.</li>
              <li>실행(Shift+Enter)은 출력만 보여 주고, 채점(Ctrl+Enter)은 빈 실행 환경에서 채점 항목을 검사합니다.</li>
              <li>막히면 힌트를 한 단계씩 여십시오. 모범 답안은 통과하거나 힌트를 모두 본 뒤 열립니다.</li>
              <li>주차 완료 조건은 아니며, 심화 실습을 통과하면 심화 달성 기록에 반영됩니다.</li>
            </ul>
          </details>
        </section>

        {groups.map(({ tier, exercises }) => {
          const passed = exercises.filter((e) => state.exercises[e.id]?.passedAt).length;
          return (
            <section key={tier} aria-labelledby={`lab-${tier}`}>
              <div className="mb-5 flex items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <h2 id={`lab-${tier}`} className="flex items-center gap-2 text-lg font-bold tracking-[-0.03em] text-ink">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                  {TIER_INFO[tier].label} 실습
                  <span className="text-xs font-normal text-ink-muted">{TIER_INFO[tier].audience}</span>
                </h2>
                <span className="text-[13px] tabular-nums text-ink-muted">
                  {passed}/{exercises.length}
                </span>
              </div>
              <div className="space-y-6">
                {exercises.map((ex) => (
                  <div key={ex.id} id={`ex-${ex.id}`} className="scroll-mt-24">
                    <CodingExercise view={exerciseView(week, ex, state, status, isAdmin)} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {progress && progress.challengesTotal > 0 && (
          <p className="text-sm text-ink-muted">
            더 도전하려면{" "}
            <Link href={`/weeks/${slug}/assignment#challenges`} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
              과제의 심화 문제 {progress.challengesTotal}개
            </Link>
          </p>
        )}
        <NextActivity slug={slug} href="drill" label="추가 퀴즈" />
      </div>
    </WeekFrame>
  );
}
