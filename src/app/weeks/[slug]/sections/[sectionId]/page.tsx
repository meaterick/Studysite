import StageLayout from "@/components/section/StageLayout";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { getSection, getWeekOutline, nextSectionAfter } from "@/content/sections";
import { TIER_INFO, TIER_ORDER, sectionLabel } from "@/content/tiers";
import TierBadge from "@/components/TierBadge";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import CheckQuestion from "@/components/section/CheckQuestion";
import StageFooter from "@/components/section/StageFooter";
import { loadWeekPage } from "@/lib/weekPage";
import { canOpenSection, sectionProgress, unfinishedBefore, type WeekStatus } from "@/lib/study";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import PracticeDoneButton from "@/components/section/PracticeDoneButton";
import { readSectionState } from "@/lib/learningStore";
import { getWeekLab } from "@/content/labs";

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
  return { title: `${week.number}주차 ${sectionLabel(section)}단계 · ${section.title}` };
}

const PART_LINKS = [
  { id: "learn", label: "학습" },
  { id: "practice", label: "따라 해 보기" },
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
  // 이전·다음 링크는 본문 순서(핵심 → 보충 → 심화)를 따르고, 완료 후 이동은 같은 갈래 안에서 이어진다.
  const prev = sections[section.order - 2];
  const next = sections[section.order];
  const continueTo = nextSectionAfter(week, section);
  const hasPractice = section.practice.length > 0;
  // 서술형·코딩 실습·추가 퀴즈는 "적용과 복습"에서 한다. 단계 화면에는 이어지는 활동의 개수와 링크만 둔다.
  const lab = getWeekLab(slug);
  const related = {
    descriptive: section.meta.quizIds.length + (lab?.quiz.filter((q) => q.sectionId === sectionId && q.kind === "descriptive").length ?? 0),
    lab: lab?.exercises.filter((e) => e.sectionId === sectionId).length ?? 0,
    drill: lab?.quiz.filter((q) => q.sectionId === sectionId && q.kind !== "descriptive").length ?? 0,
  };

  const requirements = [{ label: "확인 문제", done: progress.checksDone, total: progress.checksTotal }];

  const isCore = section.tier === "core";
  const endHref = isCore ? `/weeks/${slug}/apply?finished=1` : `/weeks/${slug}#record-heading`;
  let finishHref: string | undefined;
  if (progress.completed) finishHref = continueTo ? `/weeks/${slug}/sections/${continueTo.id}` : endHref;
  // warn 모드: 이 단계를 끝내지 않아도 같은 갈래의 다음 단계(핵심 마지막이면 백지공부)로 넘어갈 수 있다.
  const skipHref =
    status.mode === "warn" && !progress.completed
      ? continueTo
        ? `/weeks/${slug}/sections/${continueTo.id}`
        : isCore
          ? `/weeks/${slug}/apply`
          : `/weeks/${slug}`
      : undefined;
  const footerNextLabel = continueTo ? undefined : isCore ? undefined : "주차 개요로";
  const skipped = isAdmin ? [] : unfinishedBefore(status, sectionId);
  const practiceDone = !!state.practiceDoneAt || !!state.practiceDone;

  return (
    <WeekFrame week={week} status={status} record={record}>
      <StageLayout
        done={status.tiers.core.done}
        total={status.tiers.core.total}
        list={<StageList status={status} slug={slug} sectionId={sectionId} isAdmin={isAdmin} />}
      >
        <article className="min-w-0">
          {isAdmin && status.sections.find((r) => r.section.id === sectionId)?.access === "locked" && (
            <p className="mb-4 rounded-lg bg-[var(--surface-card-2)] px-3 py-2 text-xs text-ink-muted">
              운영자 미리보기: 스터디원에게는 아직 잠겨 있는 단계입니다.
            </p>
          )}
          <UnfinishedWarning
            context={isCore ? "이 단계 앞에" : "보충·심화 단계는 핵심 단계를 마친 뒤에 보는 것을 권장합니다."}
            items={skipped.map((s) => ({ label: sectionLabel(s), title: s.title, href: `/weeks/${slug}/sections/${s.id}` }))}
          />
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold" style={{ color: TIER_INFO[section.tier].color }}>
            <TierBadge tier={section.tier} />
            <span>
              {TIER_INFO[section.tier].course} {status.tiers[section.tier].total}단계 중 {section.number}단계 · 약 {section.minutes}분
            </span>
          </p>
          {!isCore && (
            <p className="mt-2 text-xs text-ink-muted">
              선택 단계입니다. 주차 완료에는 필요하지 않으며,{" "}
              {section.tier === "advanced" ? "마치면 이번 주 심화 달성 기록에 반영됩니다." : "마치면 보충 기록에 반영됩니다."}
            </p>
          )}
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
                title="따라 해 보기"
                desc="방금 배운 내용을 완성된 예제 코드와 손계산으로 직접 확인합니다. 코드는 이 페이지에서 바로 실행할 수 있습니다."
              />
              <div className="rounded-xl border border-[var(--series-orange)]/40 p-4 sm:p-5">
                <BlocksRenderer blocks={section.practice} docKey={`${slug}:${sectionId}:practice`} interactiveCode />
              </div>
              <PracticeDoneButton slug={slug} sectionId={sectionId} done={practiceDone} />
            </section>
          )}

          <section id="check" aria-labelledby="check-heading" className="mt-12 scroll-mt-24">
            <StepHeading
              id="check-heading"
              title="확인 문제"
              desc="방금 배운 내용을 빠르게 확인하는 객관식 문제입니다. 모두 맞히면 이 단계가 완료되고, 틀린 문제는 다시 풀 수 있습니다."
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
            </div>
          </section>

          {related.descriptive + related.lab + related.drill > 0 && (
            <RelatedActivities slug={slug} sectionId={sectionId} related={related} />
          )}

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
                ← {sectionLabel(prev)}단계 · {prev.title}
              </Link>
            ) : (
              <Link href={`/weeks/${slug}`} className="text-ink-secondary hover:text-[var(--series-blue)]">
                ← 주차 개요
              </Link>
            )}
            {next && (progress.completed || isAdmin || status.mode === "warn") ? (
              <Link href={`/weeks/${slug}/sections/${next.id}`} className="text-right text-ink-secondary hover:text-[var(--series-blue)]">
                {sectionLabel(next)}단계 · {next.title} →
                {!progress.completed && !isAdmin && <span className="block text-xs font-medium text-ink-muted">이 단계는 미완료로 남습니다</span>}
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
            isLast={!continueTo && isCore}
            nextHref={finishHref}
            nextLabel={footerNextLabel}
            skipHref={skipHref}
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
      {TIER_ORDER.flatMap((tier) => {
        const rows = status.sections.filter((r) => r.section.tier === tier);
        if (rows.length === 0) return [];
        const info = TIER_INFO[tier];
        return [
          <li key={`h-${tier}`} className="px-2 pb-0.5 pt-2 text-[11px] font-black first:pt-0" style={{ color: info.color }}>
            {info.course} · {info.audience}
            {!info.required && <span className="font-medium text-ink-muted"> (선택)</span>}
          </li>,
          ...rows.map(({ section: s, access }) => (
            <StageListItem key={s.id} slug={slug} section={s} access={access} active={s.id === sectionId} isAdmin={isAdmin} />
          )),
        ];
      })}
      <li className="mt-2 border-t border-[var(--border-hairline)] pt-2">
        <Link href={`/weeks/${slug}/apply`} className="flex gap-2 rounded-md px-2 py-1.5 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
          <span aria-hidden="true" className="w-5 text-center">
            →
          </span>
          적용과 복습
          <span className="font-medium text-ink-muted">· 백지공부·과제</span>
        </Link>
      </li>
    </ol>
  );
}

function StageListItem({
  slug,
  section: s,
  access,
  active,
  isAdmin,
}: {
  slug: string;
  section: WeekStatus["sections"][number]["section"];
  access: WeekStatus["sections"][number]["access"];
  active: boolean;
  isAdmin: boolean;
}) {
  const label = (
    <>
      <span aria-hidden="true" className="w-5 shrink-0 text-center">
        {access === "completed" ? "✓" : access === "locked" ? "🔒" : access === "upcoming" ? "○" : "▶"}
      </span>
      <span className="min-w-0">
        {s.number}. {s.title}
      </span>
      <span className="sr-only">
        {access === "completed" ? " (완료)" : access === "locked" ? " (잠김)" : access === "upcoming" ? " (미완료)" : " (진행할 차례)"}
      </span>
    </>
  );
  return (
    <li>
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
}

/** 단계 끝: 이 단계와 이어지는 적용 활동(서술형·코딩 실습·추가 퀴즈) 안내. 단계 완료와는 별개다. */
function RelatedActivities({
  slug,
  sectionId,
  related,
}: {
  slug: string;
  sectionId: string;
  related: { descriptive: number; lab: number; drill: number };
}) {
  const links = [
    { n: related.descriptive, label: "서술형", unit: "문항", href: `/weeks/${slug}/descriptive#sec-${sectionId}` },
    { n: related.lab, label: "코딩 실습", unit: "개", href: `/weeks/${slug}/lab` },
    { n: related.drill, label: "추가 퀴즈", unit: "문항", href: `/weeks/${slug}/drill` },
  ].filter((l) => l.n > 0);
  return (
    <aside aria-labelledby="related-heading" className="mt-10 rounded-xl border border-dashed border-[var(--border-strong)] p-4 sm:p-5">
      <h3 id="related-heading" className="text-sm font-black text-ink">
        이 단계와 이어지는 적용 활동 <span className="font-bold text-ink-muted">· 추가 활동</span>
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        단계 학습은 확인 문제까지면 충분합니다. 설명하고 코드로 옮기는 연습은 <strong className="text-ink-secondary">적용과 복습</strong>에서 이어서 할 수 있습니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="rounded-full border border-[var(--border-hairline)] bg-card px-3 py-1.5 text-xs font-bold text-ink-secondary transition hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
          >
            {l.label} {l.n}
            {l.unit} →
          </Link>
        ))}
      </div>
    </aside>
  );
}
