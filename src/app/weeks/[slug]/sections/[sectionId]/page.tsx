import StageLayout from "@/components/section/StageLayout";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { getSection, getWeekOutline } from "@/content/sections";
import { quizAnswers } from "@/content/quizAnswers";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import CheckQuestion from "@/components/section/CheckQuestion";
import DescriptiveQuestion from "@/components/section/DescriptiveQuestion";
import StageFooter from "@/components/section/StageFooter";
import { loadWeekPage } from "@/lib/weekPage";
import { canOpenSection, sectionProgress, type WeekStatus } from "@/lib/study";
import { readSectionState } from "@/lib/learningStore";

export function generateStaticParams() {
  return WEEKS.flatMap((w) => getWeekOutline(w).sections.map((s) => ({ slug: w.slug, sectionId: s.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sectionId: string }>;
}): Promise<Metadata> {
  const { slug, sectionId } = await params;
  const week = getWeek(slug);
  const section = week ? getSection(week, sectionId) : undefined;
  if (!week || !section) return {};
  return { title: `${week.number}주차 ${section.number}단계 · ${section.title}` };
}

const PART_LINKS = [
  { id: "learn", label: "학습" },
  { id: "practice", label: "실습" },
  { id: "check", label: "확인 문제" },
];

export default async function SectionPage({ params }: { params: Promise<{ slug: string; sectionId: string }> }) {
  const { slug, sectionId } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/sections/${sectionId}`);
  const section = getSection(week, sectionId);
  if (!section) notFound();
  if (!canOpenSection(status, sectionId, isAdmin)) redirect(`/weeks/${slug}?locked=section`);

  const { sections } = getWeekOutline(week);
  const state = readSectionState(record, slug, sectionId);
  const progress = sectionProgress(section, state);
  const prev = sections[section.number - 2];
  const next = sections[section.number];
  const answers = quizAnswers.find((a) => a.week === week.number)?.answers ?? {};
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
  const hasPractice = section.practice.length > 0;

  const requirements = [
    { label: "확인 문제", done: progress.checksDone, total: progress.checksTotal },
    ...(progress.quizTotal > 0 ? [{ label: "서술형", done: progress.quizDone, total: progress.quizTotal }] : []),
  ];

  let finishHref: string | undefined;
  if (progress.completed) finishHref = next ? `/weeks/${slug}/sections/${next.id}` : `/weeks/${slug}?finished=1`;

  return (
    <WeekFrame week={week} status={status}>
      <StageLayout
        done={status.sectionsDone}
        total={status.sectionsTotal}
        list={<StageList status={status} slug={slug} sectionId={sectionId} isAdmin={isAdmin} />}
      >
        <article className="min-w-0">
          {isAdmin && status.sections.find((r) => r.section.id === sectionId)?.access === "locked" && (
            <p className="mb-4 rounded-lg bg-[var(--surface-card-2)] px-3 py-2 text-xs text-ink-muted">
              운영자 미리보기: 스터디원에게는 아직 잠겨 있는 단계입니다.
            </p>
          )}
          <p className="text-sm font-bold text-[var(--series-blue)]">
            {sections.length}단계 중 {section.number}단계 · 약 {section.minutes}분
          </p>
          <h2 className="mt-1 text-2xl font-black leading-snug text-ink">{section.title}</h2>
          {section.meta.goal && (
            <p className="mt-3 rounded-lg border-l-4 border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_7%,transparent)] px-4 py-2.5 text-[15px] text-ink-secondary">
              <span className="font-bold text-ink">학습 목표: </span>
              <Inline text={section.meta.goal} />
            </p>
          )}

          <nav aria-label="이 단계의 구성" className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-ink-muted">바로 가기</span>
            {PART_LINKS.filter((s) => s.id !== "practice" || hasPractice).map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-[var(--border-hairline)] px-3 py-1 text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <section id="learn" aria-label="학습" className="mt-8 scroll-mt-24">
            <BlocksRenderer blocks={section.learn} docKey={`${slug}:${sectionId}`} interactiveCode />
          </section>

          {hasPractice && (
            <section id="practice" aria-labelledby="practice-heading" className="mt-12 scroll-mt-24">
              <StepHeading
                id="practice-heading"
                title="실습"
                desc="방금 배운 내용을 코드와 손계산으로 직접 확인합니다. 코드는 이 페이지에서 바로 실행할 수 있습니다."
              />
              <div className="rounded-xl border border-[var(--series-orange)]/40 p-4 sm:p-5">
                <BlocksRenderer blocks={section.practice} docKey={`${slug}:${sectionId}:practice`} interactiveCode />
              </div>
            </section>
          )}

          <section id="check" aria-labelledby="check-heading" className="mt-12 scroll-mt-24">
            <StepHeading
              id="check-heading"
              title="확인 문제"
              desc="객관식 문제를 모두 맞히고 서술형 문항을 작성·자기평가하면 다음 단계가 열립니다. 틀린 문제는 다시 풀 수 있습니다."
            />
            <div className="space-y-4">
              {section.meta.checks.map((check, i) => {
                const checkState = state.checks[check.id] ?? null;
                const reveal = !!checkState && (checkState.correct || checkState.wrong.length >= 2);
                return (
                  <CheckQuestion
                    key={check.id}
                    slug={slug}
                    sectionId={sectionId}
                    checkId={check.id}
                    index={i}
                    question={<Inline text={check.question} />}
                    choices={check.choices.map((c, j) => (
                      <Inline key={j} text={c} />
                    ))}
                    state={checkState}
                    explanation={reveal ? <Inline text={check.explanation} /> : undefined}
                    correctIndex={checkState?.correct ? check.answer : undefined}
                  />
                );
              })}
              {section.meta.quizIds.map((quizId, i) => {
                const saved = state.answers[quizId];
                return (
                  <DescriptiveQuestion
                    key={quizId}
                    slug={slug}
                    sectionId={sectionId}
                    quizId={quizId}
                    index={i}
                    question={<Inline text={questionText.get(quizId) ?? ""} />}
                    savedText={saved?.text}
                    review={saved?.review}
                    modelAnswer={saved ? <Inline text={answers[quizId] ?? "(모범답안 준비 중)"} /> : undefined}
                  />
                );
              })}
            </div>
          </section>

          {section.meta.references && section.meta.references.length > 0 && (
            <section aria-labelledby="refs-heading" className="mt-10">
              <h3 id="refs-heading" className="mb-2 text-base font-black text-ink">더 알아보기</h3>
              <ul className="space-y-2 text-sm">
                {section.meta.references.map((ref) => (
                  <li key={ref.url} className="rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2">
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--series-blue)] hover:underline">
                      {ref.title} ↗
                    </a>
                    {ref.note && <p className="mt-0.5 text-ink-muted">{ref.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav aria-label="단계 이동" className="mt-10 flex items-center justify-between gap-4 text-sm font-bold">
            {prev ? (
              <Link href={`/weeks/${slug}/sections/${prev.id}`} className="text-ink-secondary hover:text-[var(--series-blue)]">
                ← {prev.number}단계 · {prev.title}
              </Link>
            ) : (
              <Link href={`/weeks/${slug}`} className="text-ink-secondary hover:text-[var(--series-blue)]">
                ← 주차 개요
              </Link>
            )}
            {next && (progress.completed || isAdmin) ? (
              <Link href={`/weeks/${slug}/sections/${next.id}`} className="text-right text-ink-secondary hover:text-[var(--series-blue)]">
                {next.number}단계 · {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

          <StageFooter
            slug={slug}
            sectionId={sectionId}
            requirements={requirements}
            ready={progress.ready}
            completed={progress.completed}
            isLast={!next}
            nextHref={finishHref}
          />
        </article>
      </StageLayout>
    </WeekFrame>
  );
}

function StepHeading({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <div className="mb-4 border-b border-[var(--border-hairline)] pb-3">
      <h3 id={id} className="text-xl font-black text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}

function StageList({
  status,
  slug,
  sectionId,
  isAdmin,
}: {
  status: WeekStatus;
  slug: string;
  sectionId: string;
  isAdmin: boolean;
}) {
  return (
    <ol className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto pr-1">
      {status.sections.map(({ section: s, access }) => {
        const active = s.id === sectionId;
        const label = (
          <>
            <span aria-hidden="true" className="w-5 shrink-0 text-center">
              {access === "completed" ? "✓" : access === "locked" ? "🔒" : "▶"}
            </span>
            <span className="min-w-0">
              {s.number}. {s.title}
            </span>
            <span className="sr-only">
              {access === "completed" ? " (완료)" : access === "locked" ? " (잠김)" : " (진행할 차례)"}
            </span>
          </>
        );
        return (
          <li key={s.id}>
            {access !== "locked" || isAdmin ? (
              <Link
                href={`/weeks/${slug}/sections/${s.id}`}
                aria-current={active ? "page" : undefined}
                className={`flex gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--series-blue)_10%,transparent)] font-bold text-[var(--series-blue)]"
                    : access === "completed"
                      ? "text-[var(--status-good)] hover:bg-[var(--surface-card-2)]"
                      : "text-ink-secondary hover:bg-[var(--surface-card-2)]"
                }`}
              >
                {label}
              </Link>
            ) : (
              <span className="flex gap-2 px-2 py-1.5 text-sm text-ink-muted">{label}</span>
            )}
          </li>
        );
      })}
      <li className="mt-2 border-t border-[var(--border-hairline)] pt-2">
        {status.allSectionsDone || isAdmin ? (
          <Link href={`/weeks/${slug}/worksheet`} className="flex gap-2 rounded-md px-2 py-1 text-sm text-ink-secondary hover:bg-[var(--surface-card-2)]">
            <span aria-hidden="true" className="w-5 text-center">✎</span>
            백지공부 · 과제
          </Link>
        ) : (
          <span className="flex gap-2 px-2 py-1 text-sm text-ink-muted">
            <span aria-hidden="true" className="w-5 text-center">🔒</span>
            백지공부 · 과제 (모든 단계를 마치면 열림)
          </span>
        )}
      </li>
    </ol>
  );
}
