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
import TierBadge from "@/components/TierBadge";
import NextActivity from "@/components/NextActivity";

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
    <WeekFrame week={week} status={status} record={record} apply="lab">
      <div className="space-y-10">
        <section aria-labelledby="lab-intro" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="lab-intro" className="flex flex-wrap items-center gap-2 text-xl font-black text-ink">
                코딩 실습 <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                단계에서 배운 내용을 직접 코드로 옮겨 봅니다. 문제를 읽고 <strong className="text-[var(--series-orange)]">TODO</strong>를 채운 뒤 채점하면, 채점 코드가 결과를 항목별로 검사합니다.
              </p>
            </div>
            {progress && (
              <p className="rounded-full bg-[var(--surface-card-2)] px-3 py-1 text-sm font-bold text-ink-secondary">
                통과 {progress.exercisesPassed}/{progress.exercisesTotal}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--series-blue)]/40 bg-card p-4 text-sm text-ink-secondary">
              <p className="font-black text-[var(--series-blue)]">완성 예제 (학습 자료 속 코드 셀)</p>
              <p className="mt-1">이미 완성된 코드입니다. 그대로 실행해 결과를 확인하고, 숫자를 바꿔 가며 관찰합니다. 채점은 없습니다.</p>
            </div>
            <div className="rounded-xl border border-[var(--series-orange)]/40 bg-card p-4 text-sm text-ink-secondary">
              <p className="font-black text-[var(--series-orange)]">TODO 실습 (이 페이지)</p>
              <p className="mt-1">핵심 줄이 비어 있는 시작 코드입니다. 직접 채운 뒤 ✓ 채점을 누르면 항목별로 통과 여부를 알려 줍니다.</p>
            </div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
            <li>코드는 서버로 보내지 않고 이 브라우저 안의 Python(Pyodide)에서만 실행·채점됩니다. 작성 중인 코드는 이 브라우저에 자동 저장됩니다.</li>
            <li>▶ 실행(Shift+Enter)은 내 코드만 실행해 출력을 보여 주고, ✓ 채점(Ctrl+Enter)은 빈 실행 환경에서 내 코드를 실행한 뒤 채점 항목을 검사합니다.</li>
            <li>막히면 힌트를 한 단계씩 열어 보십시오. 모범 답안은 통과하거나, 채점해 본 뒤 힌트를 모두 보면 열립니다. 초기화를 누르면 시작 코드로 돌아갑니다.</li>
            <li>실습은 핵심(초심자) · 보충(중급자) · 심화(전문가)로 나뉩니다. 핵심 실습부터 풀고, 여유가 있으면 보충·심화에 도전하십시오.</li>
            <li>코딩 실습은 주차 완료 조건이 아닙니다. 심화 실습을 통과하면 심화 달성 기록에 반영됩니다.</li>
          </ul>
        </section>

        {groups.map(({ tier, exercises }) => {
          const passed = exercises.filter((e) => state.exercises[e.id]?.passedAt).length;
          return (
            <section key={tier} aria-labelledby={`lab-${tier}`}>
              <div className="mb-3 border-b border-[var(--border-hairline)] pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id={`lab-${tier}`} className="flex flex-wrap items-center gap-2 text-lg font-black text-ink">
                    {TIER_INFO[tier].label} 실습 <TierBadge tier={tier} />
                  </h2>
                  <span className="text-xs font-bold text-ink-muted">
                    통과 {passed}/{exercises.length}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {tier === "core"
                    ? "핵심 단계의 개념을 가장 기본적인 코드로 옮겨 보는 실습입니다. 여기서부터 시작하십시오."
                    : tier === "supplement"
                      ? "핵심 개념을 실무 도구·다른 방법으로 넓히는 실습입니다."
                      : "직접 유도하거나 처음부터 구현하는 전문가 수준 실습입니다. 통과하면 심화 달성 기록에 반영됩니다."}
                </p>
              </div>
              <div className="space-y-5">
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
            더 도전하고 싶다면{" "}
            <Link href={`/weeks/${slug}/assignment#challenges`} className="font-bold text-[var(--series-blue)] hover:underline">
              과제 페이지의 심화 문제 {progress.challengesTotal}개
            </Link>
            도 자동 채점됩니다.
          </p>
        )}
        <NextActivity slug={slug} href="drill" label="추가 퀴즈" desc="객관식·코드 출력 예측 문제로 이해를 한 번 더 점검합니다." />
      </div>
    </WeekFrame>
  );
}
