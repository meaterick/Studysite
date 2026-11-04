import StageLayout from "@/components/section/StageLayout";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { getSection, getWeekOutline, nextSectionAfter } from "@/content/sections";
import { TIER_INFO, TIER_ORDER, sectionLabel, type Tier } from "@/content/tiers";
import TierBadge from "@/components/TierBadge";
import StepMarker from "@/components/StepMarker";
import Icon from "@/components/Icon";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import CheckSequence from "@/components/section/CheckSequence";
import StageFooter from "@/components/section/StageFooter";
import { loadWeekPage } from "@/lib/weekPage";
import { canOpenSection, sectionProgress, unfinishedBefore, type WeekStatus } from "@/lib/study";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import { readSectionState } from "@/lib/learningStore";
import { getWeekLab } from "@/content/labs";
import { cookies } from "next/headers";
import { STAGE_LIST_COOKIE } from "@/lib/stageListCookie";
import { ProgressCount, ProgressProvider } from "@/components/progress/ProgressStore";
import { checkKey } from "@/lib/progressIds";

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
  // 서술형·코딩 실습·추가 퀴즈는 "적용과 복습"에서 한다. 단계 화면에는 이어지는 활동의 개수와 링크만 둔다.
  const lab = getWeekLab(slug);
  // 링크는 그 단계의 첫 문항 위치로 바로 이동한다(목록과 같은 순서: 핵심 → 보충 → 심화).
  const byTier = <T extends { tier: Tier }>(items: T[]) => TIER_ORDER.flatMap((t) => items.filter((i) => i.tier === t));
  const labHere = byTier(lab?.exercises.filter((e) => e.sectionId === sectionId) ?? []);
  const drillHere = byTier(lab?.quiz.filter((q) => q.sectionId === sectionId && q.kind !== "descriptive") ?? []);
  const related = {
    descriptive: section.meta.quizIds.length + (lab?.quiz.filter((q) => q.sectionId === sectionId && q.kind === "descriptive").length ?? 0),
    lab: labHere.length,
    drill: drillHere.length,
    labAnchor: labHere[0] ? `#ex-${labHere[0].id}` : "",
    drillAnchor: drillHere[0] ? `#drill-${drillHere[0].id}` : "",
  };

  // 확인 문제를 풀면 화면을 다시 받지 않고 진행 저장소로 숫자·완료 버튼을 고친다.
  const checkIds = section.meta.checks.map((c) => checkKey(c.id));
  const checkStatuses = Object.fromEntries(section.meta.checks.map((c) => [checkKey(c.id), { done: !!state.checks[c.id]?.correct, weak: false }]));
  const requirements = [{ label: "확인 문제", done: progress.checksDone, total: progress.checksTotal, ids: checkIds }];

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
  const listCollapsed = (await cookies()).get(STAGE_LIST_COOKIE)?.value === "1";

  return (
    <WeekFrame week={week} status={status} record={record} compact>
      <StageLayout
        done={status.tiers.core.done}
        total={status.tiers.core.total}
        initialCollapsed={listCollapsed}
        list={<StageList status={status} slug={slug} sectionId={sectionId} isAdmin={isAdmin} />}
      >
        <ProgressProvider key={sectionId} items={checkStatuses}>
          <article className="min-w-0 max-w-[46rem] transition-[max-width] duration-300 lg:group-data-[collapsed]/stage:max-w-[59rem]">
            {isAdmin && status.sections.find((r) => r.section.id === sectionId)?.access === "locked" && (
              <p className="callout mb-6 text-xs">운영자 미리보기: 스터디원에게는 아직 잠겨 있는 단계입니다.</p>
            )}
            <UnfinishedWarning
              context={isCore ? "이 단계 앞에" : "보충·심화 단계는 핵심 단계를 마친 뒤에 보는 것을 권장합니다."}
              items={skipped.map((s) => ({ label: sectionLabel(s), title: s.title, href: `/weeks/${slug}/sections/${s.id}` }))}
            />

            <header>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                <TierBadge tier={section.tier} compact />
                <span className="tabular-nums">
                  {section.number} / {status.tiers[section.tier].total}
                </span>
                <span aria-hidden="true">·</span>
                <span>약 {section.minutes}분</span>
                {!isCore && <span className="pill">선택</span>}
              </p>
              <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.25] tracking-[-0.035em] text-ink sm:text-[2.125rem]">{section.title}</h2>
              {section.meta.goal && (
                <p className="mt-4 text-[17px] leading-relaxed text-ink-secondary">
                  <Inline text={section.meta.goal} />
                </p>
              )}
              <a href="#check" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink">
                확인 문제 <ProgressCount ids={checkIds} />/{progress.checksTotal}
                <Icon name="chevronDown" size={14} />
              </a>
            </header>

            <section id="learn" aria-label="학습" className="mt-10 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
              <BlocksRenderer blocks={section.learn} docKey={`${slug}:${sectionId}`} interactiveCode />
            </section>

            <section id="check" aria-labelledby="check-heading" className="mt-16 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
              <h3 id="check-heading" className="mb-6 text-xl font-bold tracking-[-0.03em] text-ink">
                확인 문제
              </h3>
              <CheckSequence
                slug={slug}
                sectionId={sectionId}
                completed={progress.completed}
                items={section.meta.checks.map((check) => {
                  const checkState = state.checks[check.id] ?? null;
                  const reveal = !!checkState && (checkState.correct || checkState.wrong.length >= 2);
                  return {
                    checkId: check.id,
                    question: <Inline text={check.question} />,
                    choices: check.choices.map((c, j) => <Inline key={j} text={c} />),
                    state: checkState,
                    explanation: reveal ? <Inline text={check.explanation} /> : undefined,
                    correctIndex: checkState?.correct ? check.answer : undefined,
                  };
                })}
              />
            </section>

            {related.descriptive + related.lab + related.drill > 0 && <RelatedActivities slug={slug} sectionId={sectionId} related={related} />}

            {section.meta.references && section.meta.references.length > 0 && (
              <section aria-labelledby="refs-heading" className="mt-14">
                <h3 id="refs-heading" className="mb-3 text-[13px] font-medium text-ink-muted">
                  더 알아보기
                </h3>
                <ul className="rows border-y border-[var(--border-hairline)]">
                  {section.meta.references.map((ref) => (
                    <li key={ref.url}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="group row-hover -mx-3 flex items-start gap-3 rounded-xl px-3 py-3.5 text-sm">
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-ink group-hover:underline group-hover:underline-offset-4">{ref.title}</span>
                          <span className="sr-only"> (새 창에서 열림)</span>
                          {ref.note && <span className="mt-0.5 block text-ink-muted">{ref.note}</span>}
                        </span>
                        <Icon name="arrowUpRight" size={16} className="mt-0.5 shrink-0 text-ink-muted transition group-hover:text-ink" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav aria-label="단계 이동" className="mt-16 grid grid-cols-2 gap-6 border-t border-[var(--border-hairline)] pt-8">
              {prev ? (
                <Link href={`/weeks/${slug}/sections/${prev.id}`} className="group min-w-0">
                  <span className="kicker block">Previous</span>
                  <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <Link href={`/weeks/${slug}`} className="group min-w-0">
                  <span className="kicker block">Overview</span>
                  <span className="mt-2 block text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">주차 개요</span>
                </Link>
              )}
              {next && (progress.completed || isAdmin || status.mode === "warn") ? (
                <Link href={`/weeks/${slug}/sections/${next.id}`} className="group min-w-0 text-right">
                  <span className="kicker block">Next</span>
                  <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">
                    {next.title}
                  </span>
                  {!progress.completed && !isAdmin && <span className="mt-1 block text-xs text-ink-muted">이 단계는 미완료로 남습니다</span>}
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
        </ProgressProvider>
      </StageLayout>
    </WeekFrame>
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
    <ol className="mt-4 max-h-[62vh] space-y-0.5 overflow-y-auto pr-1">
      {TIER_ORDER.flatMap((tier) => {
        const rows = status.sections.filter((r) => r.section.tier === tier);
        if (rows.length === 0) return [];
        const info = TIER_INFO[tier];
        return [
          <li key={`h-${tier}`} className="flex items-center gap-2 px-2 pb-1.5 pt-4 text-xs text-ink-muted first:pt-0">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: info.color }} />
            {info.course}
            {!info.required && <span>· 선택</span>}
          </li>,
          ...rows.map(({ section: s, access }) => (
            <StageListItem key={s.id} slug={slug} section={s} access={access} active={s.id === sectionId} isAdmin={isAdmin} />
          )),
        ];
      })}
      <li className="mt-3 border-t border-[var(--border-hairline)] pt-3">
        <Link href={`/weeks/${slug}/apply`} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink">
          적용과 복습
          <Icon name="arrowRight" size={14} className="text-ink-muted transition group-hover:translate-x-0.5" />
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
      <StepMarker
        size={20}
        state={access === "completed" ? "done" : access === "locked" ? "locked" : active ? "current" : "todo"}
        label={s.number}
      />
      <span className="min-w-0 leading-snug">{s.title}</span>
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
          className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition ${
            active ? "bg-[var(--surface-card-2)] font-medium text-ink" : "text-ink-secondary hover:bg-[var(--surface-card-2)] hover:text-ink"
          }`}
        >
          {label}
        </Link>
      ) : (
        <span className="flex items-start gap-2.5 px-2 py-1.5 text-[13px] text-ink-muted">{label}</span>
      )}
    </li>
  );
}

/** 단계 끝: 이 단계와 이어지는 선택 과정(서술형·코딩 실습·추가 퀴즈) 링크 */
function RelatedActivities({
  slug,
  sectionId,
  related,
}: {
  slug: string;
  sectionId: string;
  related: { descriptive: number; lab: number; drill: number; labAnchor: string; drillAnchor: string };
}) {
  const links = [
    { n: related.descriptive, label: "서술형", unit: "문항", href: `/weeks/${slug}/descriptive#sec-${sectionId}` },
    { n: related.lab, label: "코딩 실습", unit: "개", href: `/weeks/${slug}/lab${related.labAnchor}` },
    { n: related.drill, label: "추가 퀴즈", unit: "문항", href: `/weeks/${slug}/drill${related.drillAnchor}` },
  ].filter((l) => l.n > 0);
  return (
    <aside aria-labelledby="related-heading" className="mt-14">
      <h3 id="related-heading" className="mb-3 text-[13px] font-medium text-ink-muted">
        더 연습하기 · 선택
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-[13px] font-medium text-ink-secondary transition hover:border-[var(--text-primary)] hover:text-ink"
          >
            {l.label}
            <span className="tabular-nums text-ink-muted">
              {l.n}
              {l.unit}
            </span>
            <Icon name="arrowRight" size={13} className="text-ink-muted transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
