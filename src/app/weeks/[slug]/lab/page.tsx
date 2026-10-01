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
  const groups = getWeekOutline(week)
    .sections.map((section) => ({ section, exercises: lab.exercises.filter((e) => e.sectionId === section.id) }))
    .filter((g) => g.exercises.length > 0);

  return (
    <WeekFrame week={week} status={status}>
      <div className="space-y-10">
        <section aria-labelledby="lab-intro" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="lab-intro" className="text-xl font-black text-ink">
                코딩 실습
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
            <li>코딩 실습은 단계 완료 조건이 아닙니다. 통과 기록은 진도 화면과 이 페이지에만 표시됩니다.</li>
          </ul>
        </section>

        {groups.map(({ section, exercises }) => (
          <section key={section.id} aria-labelledby={`lab-${section.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-2">
              <h2 id={`lab-${section.id}`} className="text-lg font-black text-ink">
                {section.number}단계 · {section.title}
              </h2>
              <Link href={`/weeks/${slug}/sections/${section.id}`} className="text-sm font-bold text-[var(--series-blue)] hover:underline">
                단계 학습 자료 보기 →
              </Link>
            </div>
            <div className="space-y-5">
              {exercises.map((ex) => (
                <CodingExercise key={ex.id} view={exerciseView(week, ex, state, status, isAdmin)} />
              ))}
            </div>
          </section>
        ))}

        <section className="grid gap-3 sm:grid-cols-2">
          <Link href={`/weeks/${slug}/drill`} className="block rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]">
            <p className="font-black text-ink">퀴즈로 점검하기 →</p>
            <p className="mt-1 text-sm text-ink-muted">객관식·코드 출력 예측·서술형으로 이번 주 내용을 확인합니다.</p>
          </Link>
          <Link href={`/weeks/${slug}/assignment#challenges`} className="block rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]">
            <p className="font-black text-ink">과제 심화 문제 →</p>
            <p className="mt-1 text-sm text-ink-muted">
              과제 페이지에서 자동 채점되는 심화 문제{progress ? ` ${progress.challengesTotal}개` : ""}에 도전합니다.
            </p>
          </Link>
        </section>
      </div>
    </WeekFrame>
  );
}
