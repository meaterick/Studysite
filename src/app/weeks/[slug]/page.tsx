import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/study";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

const ACCESS_STYLE = {
  completed: { icon: "✓", label: "완료", ring: "var(--status-good)" },
  current: { icon: "▶", label: "진행할 차례", ring: "var(--series-blue)" },
  locked: { icon: "🔒", label: "잠김", ring: "var(--border-strong)" },
} as const;

export default async function WeekOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ finished?: string; locked?: string }>;
}) {
  const { slug } = await params;
  const { finished, locked } = await searchParams;
  const { week, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}`);
  const { intro } = getWeekOutline(week);
  const totalMinutes = status.sections.reduce((sum, r) => sum + r.section.minutes, 0);
  const current = status.currentSection;

  return (
    <WeekFrame week={week} status={status}>
      <div className="space-y-10">
        {finished && status.allSectionsDone && (
          <div className="rounded-xl border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-5 py-4">
            <p className="font-black text-ink">이번 주의 모든 단계를 마쳤습니다.</p>
            <p className="mt-1 text-sm text-ink-secondary">
              자료를 닫고 <strong>백지공부</strong>로 배운 내용을 떠올려 본 뒤, <strong>과제</strong>를 이 사이트에서 작성해 제출하십시오. 제출한 과제는 운영자가 채점하고 피드백을 남깁니다.
            </p>
          </div>
        )}
        {locked && (
          <div className="rounded-xl border-l-4 border-[var(--status-serious)] bg-[color-mix(in_srgb,var(--status-serious)_12%,transparent)] px-5 py-3 text-sm text-ink-secondary">
            {locked === "finale"
              ? "백지공부와 과제는 이번 주의 모든 단계를 마친 뒤에 열립니다."
              : "아직 열리지 않은 단계입니다. 앞 단계를 먼저 마쳐 주십시오."}
          </div>
        )}

        <section aria-labelledby="continue-heading" className="rounded-xl border border-[var(--border-hairline)] bg-card p-5 sm:p-6">
          <h2 id="continue-heading" className="text-sm font-bold text-ink-muted">
            {current ? "이어서 학습하기" : "주차 마무리"}
          </h2>
          {current ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-black text-ink">
                  {current.number}단계 · {current.title}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">
                  <Inline text={current.meta.goal} /> · 약 {current.minutes}분
                </p>
              </div>
              <Link
                href={`/weeks/${slug}/sections/${current.id}`}
                className="shrink-0 rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                {status.sectionsDone === 0 ? "1단계부터 시작" : "이어서 학습"} →
              </Link>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href={`/weeks/${slug}/worksheet`} className="rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                백지공부 작성 →
              </Link>
              <Link href={`/weeks/${slug}/assignment`} className="rounded-lg border border-[var(--border-hairline)] px-5 py-2.5 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
                과제 작성 →
              </Link>
            </div>
          )}
        </section>

        <section id="goals" aria-labelledby="goals-heading">
          <h2 id="goals-heading" className="mb-3 text-xl font-black text-ink">학습 목표</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-secondary">
            {week.objectives.map((o, i) => (
              <li key={i}>
                <Inline text={o} />
              </li>
            ))}
          </ul>
        </section>

        {intro.length > 0 && (
          <section aria-labelledby="intro-heading">
            <h2 id="intro-heading" className="mb-3 text-xl font-black text-ink">들어가며</h2>
            <BlocksRenderer blocks={intro} docKey={`${slug}:intro`} />
          </section>
        )}

        <section aria-labelledby="prep-heading">
          <h2 id="prep-heading" className="mb-3 text-xl font-black text-ink">함께 보면 좋은 자료</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-secondary">
            {week.learningOrder.map((o, i) => (
              <li key={i}>
                <Inline text={o} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="roadmap-heading">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="roadmap-heading" className="text-xl font-black text-ink">학습 단계</h2>
            <p className="text-sm text-ink-muted">
              {status.sectionsTotal}단계 · 예상 학습 시간 약 {Math.round(totalMinutes / 60 * 10) / 10}시간
            </p>
          </div>
          <p className="mb-4 text-sm text-ink-muted">
            각 단계는 <strong>학습 → 실습 → 확인 문제</strong> 순서로 진행하며, 확인 문제를 모두 마치면 다음 단계가 열립니다.
            {isAdmin && " 운영자는 잠금과 관계없이 모든 단계를 열람할 수 있습니다."}
          </p>
          <ol className="space-y-2">
            {status.sections.map(({ section, access, progress }) => {
              const style = ACCESS_STYLE[access];
              const openable = access !== "locked" || isAdmin;
              const body = (
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-black"
                    style={{ borderColor: style.ring, color: access === "locked" ? "var(--text-muted)" : style.ring }}
                  >
                    {access === "completed" ? "✓" : section.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold ${access === "locked" ? "text-ink-muted" : "text-ink"}`}>
                      {section.number}. {section.title}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      <Inline text={section.meta.goal} />
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      <span className="sr-only">{style.label} · </span>약 {section.minutes}분 · 확인 문제 {progress.checksTotal}개
                      {progress.quizTotal > 0 && ` · 서술형 ${progress.quizTotal}개`}
                      {progress.hasPractice && " · 실습 포함"}
                      {access === "current" && (progress.checksDone > 0 || progress.quizDone > 0) &&
                        ` · 진행 ${progress.checksDone + progress.quizDone}/${progress.checksTotal + progress.quizTotal}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold" style={{ color: access === "locked" ? "var(--text-muted)" : style.ring }}>
                    {style.icon} {style.label}
                  </span>
                </div>
              );
              return (
                <li key={section.id}>
                  {openable ? (
                    <Link
                      href={`/weeks/${slug}/sections/${section.id}`}
                      className={`block rounded-xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
                        access === "current" ? "border-[var(--series-blue)]" : "border-[var(--border-hairline)]"
                      }`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-4 opacity-80">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="finale-heading">
          <h2 id="finale-heading" className="mb-1 text-xl font-black text-ink">마무리: 백지공부 · 과제</h2>
          <p className="mb-4 text-sm text-ink-muted">이번 주의 모든 단계를 마치면 열립니다.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FinaleCard
              href={`/weeks/${slug}/worksheet`}
              locked={!status.allSectionsDone && !isAdmin}
              title="백지공부"
              desc="자료를 보지 않고 핵심 내용을 떠올려 적은 뒤, 학습 자료와 비교해 부족한 부분을 찾습니다."
              state={status.worksheetSubmitted ? "제출 완료" : "미작성"}
              done={status.worksheetSubmitted}
            />
            <FinaleCard
              href={`/weeks/${slug}/assignment`}
              locked={!status.allSectionsDone && !isAdmin}
              title="과제"
              desc={`${week.dueNote}. 코드 실행부터 보고서 작성, 제출까지 이 사이트에서 모두 진행하며, 운영자가 채점하고 피드백을 남깁니다.`}
              state={
                status.assignment.status === "graded"
                  ? `채점 완료 · ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
                  : ASSIGNMENT_STATUS_LABEL[status.assignment.status]
              }
              done={status.assignment.status !== "none"}
            />
          </div>
        </section>
      </div>
    </WeekFrame>
  );
}

function FinaleCard({
  href,
  locked,
  title,
  desc,
  state,
  done,
}: {
  href: string;
  locked: boolean;
  title: string;
  desc: string;
  state: string;
  done: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-black text-ink">
          {locked && <span aria-hidden="true">🔒 </span>}
          {title}
        </p>
        <span className={`text-xs font-bold ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>{state}</span>
      </div>
      <p className="mt-1 text-sm text-ink-secondary">{desc}</p>
    </>
  );
  return locked ? (
    <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-4 opacity-70">{inner}</div>
  ) : (
    <Link href={href} className="block rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]">
      {inner}
    </Link>
  );
}
