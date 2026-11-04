import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import type { WeekStatus } from "@/lib/study";
import { weekFlow } from "@/lib/weekFlow";
import WeekFlowCard from "@/components/WeekFlowCard";
import { readLabState } from "@/lib/learningStore";
import { labProgress } from "@/lib/labView";
import { tierRecord, type TierRecord } from "@/lib/achievement";
import { TIER_INFO, splitTierPrefix } from "@/content/tiers";
import StepMarker, { type StepState } from "@/components/StepMarker";
import Icon from "@/components/Icon";

type WeekStatusRow = WeekStatus["sections"][number];

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

const ACCESS_LABEL: Record<WeekStatusRow["access"], string> = {
  completed: "완료",
  current: "진행할 차례",
  upcoming: "미완료",
  locked: "잠김",
};

const ACCESS_STATE: Record<WeekStatusRow["access"], StepState> = {
  completed: "done",
  current: "current",
  upcoming: "todo",
  locked: "locked",
};

function SectionHead({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {meta && <p className="text-[13px] tabular-nums text-ink-muted">{meta}</p>}
    </div>
  );
}

export default async function WeekOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ finished?: string; locked?: string }>;
}) {
  const { slug } = await params;
  const { finished, locked } = await searchParams;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}`);
  const lab = labProgress(slug, readLabState(record, slug));
  const { intro } = getWeekOutline(week);
  const minutesOf = (rows: typeof status.sections) => rows.reduce((sum, r) => sum + r.section.minutes, 0);
  const flow = weekFlow(week, record, status);
  const coreRows = status.sections.filter((r) => r.section.tier === "core");
  const records = { supplement: tierRecord(week, record, status, "supplement"), advanced: tierRecord(week, record, status, "advanced") };
  const hours = (min: number) => Math.round((min / 60) * 10) / 10;
  const coreGoals = week.objectives.map((o) => splitTierPrefix(o)).filter((g) => !g.tier || g.tier === "core");
  const extraGoals = week.objectives.map((o) => splitTierPrefix(o)).filter((g) => g.tier && g.tier !== "core");

  return (
    <WeekFrame week={week} status={status} record={record}>
      <div className="space-y-16">
        {finished && status.coreDone && (
          <p role="status" className="callout callout-good flex items-center gap-2.5 font-medium text-ink">
            <Icon name="check" size={16} className="text-[var(--status-good)]" />
            이번 주 핵심 단계를 모두 마쳤습니다.
          </p>
        )}
        {locked && (
          <p className="callout callout-warn">{locked === "finale" ? "백지공부와 과제는 핵심 단계를 모두 마치면 열립니다." : "앞의 핵심 단계를 먼저 마쳐 주십시오."}</p>
        )}

        <WeekFlowCard flow={flow} />

        {/* ── 핵심 단계 ─────────────────────────────────────── */}
        <section aria-labelledby="core-heading">
          <SectionHead id="core-heading" title="핵심 단계" meta={`${status.tiers.core.done}/${status.tiers.core.total} · 약 ${hours(minutesOf(coreRows))}시간`} />
          <ol className="rows border-t border-[var(--border-hairline)]">
            {coreRows.map(({ section, access, progress }) => (
              <SectionRow key={section.id} slug={slug} section={section} access={access} progress={progress} isAdmin={isAdmin} />
            ))}
          </ol>
        </section>

        {/* ── 학습 목표 ─────────────────────────────────────── */}
        <section id="goals" aria-labelledby="goals-heading">
          <SectionHead id="goals-heading" title="학습 목표" />
          <ol className="grid gap-x-10 gap-y-5 border-t border-[var(--border-hairline)] pt-6 sm:grid-cols-2">
            {coreGoals.map((g, i) => (
              <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-ink-body">
                <span aria-hidden="true" className="w-5 shrink-0 pt-1 font-mono text-xs text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <Inline text={g.text} />
                </span>
              </li>
            ))}
          </ol>
          {extraGoals.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-[var(--border-hairline)] pt-5 text-sm text-ink-muted">
              {extraGoals.map((g, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex w-12 shrink-0 items-center gap-1.5 text-xs">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: g.tier ? TIER_INFO[g.tier].color : undefined }} />
                    {g.tier && TIER_INFO[g.tier].label}
                  </span>
                  <span className="min-w-0">
                    <Inline text={g.text} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 선택 과정 ─────────────────────────────────────── */}
        <section aria-labelledby="optional-heading" id="record-heading" className="scroll-mt-24">
          <SectionHead id="optional-heading" title="선택 과정" />
          <div className="rows border-y border-[var(--border-hairline)]">
            {(["supplement", "advanced"] as const).map((tier) => {
              const rows = status.sections.filter((r) => r.section.tier === tier);
              if (rows.length === 0) return null;
              const count = status.tiers[tier];
              const rec = records[tier];
              return (
                <details key={tier} className="group" open={count.done > 0 && count.done < count.total}>
                  <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center gap-4 rounded-xl px-3 py-4 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center">
                      <span className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[15px] font-medium text-ink">{TIER_INFO[tier].course}</span>
                      <span className="ml-2 text-xs text-ink-muted">{TIER_INFO[tier].audience}</span>
                      {rec.complete && tier === "advanced" && <span className="pill ml-2 [--pill:var(--tier-advanced)]">심화 달성</span>}
                    </span>
                    <span className="text-[13px] tabular-nums text-ink-muted">
                      {count.done}/{count.total} · 약 {hours(minutesOf(rows))}시간
                    </span>
                    <Icon name="chevronDown" size={16} className="text-ink-muted transition group-open:rotate-180" />
                  </summary>
                  <div className="pb-4 pl-6 sm:pl-11">
                    <ol className="rows">
                      {rows.map(({ section, access, progress }) => (
                        <SectionRow key={section.id} slug={slug} section={section} access={access} progress={progress} isAdmin={isAdmin} />
                      ))}
                    </ol>
                    {rec.total > 0 && <RecordLine record={rec} />}
                  </div>
                </details>
              );
            })}
            {lab && lab.exercisesTotal > 0 && (
              <OptionRow
                href={`/weeks/${slug}/lab`}
                title="코딩 실습"
                state={`${lab.exercisesPassed}/${lab.exercisesTotal}`}
                done={lab.exercisesPassed === lab.exercisesTotal}
              />
            )}
            {lab && lab.quizTotal > 0 && (
              <OptionRow
                href={`/weeks/${slug}/descriptive`}
                title="서술형 · 추가 퀴즈"
                state={`${lab.quizDone}/${lab.quizTotal}${lab.quizWeak > 0 ? ` · 다시 볼 문항 ${lab.quizWeak}` : ""}`}
                done={lab.quizDone === lab.quizTotal}
              />
            )}
          </div>
        </section>

        {/* ── 이번 주 소개 ─────────────────────────────────── */}
        {(intro.length > 0 || week.learningOrder.length > 0) && (
          <details className="group border-y border-[var(--border-hairline)]">
            <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-[15px] font-medium text-ink">이번 주 소개 · 함께 보면 좋은 자료</span>
              <Icon name="chevronDown" size={16} className="text-ink-muted transition group-open:rotate-180" />
            </summary>
            <div className="space-y-8 pb-8 pt-2">
              {intro.length > 0 && <BlocksRenderer blocks={intro} docKey={`${slug}:intro`} />}
              {week.learningOrder.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-ink">함께 보면 좋은 자료</h3>
                  <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink-body marker:text-ink-muted">
                    {week.learningOrder.map((o, i) => (
                      <li key={i}>
                        <Inline text={o} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </WeekFrame>
  );
}

function OptionRow({ href, title, state, done }: { href: string; title: string; state: string; done: boolean }) {
  return (
    <Link href={href} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center">
        <span className="h-2 w-2 rounded-full border border-[var(--border-strong)]" />
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">{title}</span>
      <span className={`text-[13px] tabular-nums ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>{state}</span>
      <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

function SectionRow({
  slug,
  section,
  access,
  progress,
  isAdmin,
}: {
  slug: string;
  section: WeekStatusRow["section"];
  access: WeekStatusRow["access"];
  progress: WeekStatusRow["progress"];
  isAdmin: boolean;
}) {
  const openable = access !== "locked" || isAdmin;
  const current = access === "current";
  const body = (
    <>
      <StepMarker state={ACCESS_STATE[access]} label={section.number} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-medium leading-snug ${access === "locked" ? "text-ink-muted" : "text-ink"}`}>{section.title}</span>
        <span className="mt-1 block text-xs tabular-nums text-ink-muted">
          <span className="sr-only">{ACCESS_LABEL[access]} · </span>
          {section.minutes}분 · 확인 문제 {progress.checksDone}/{progress.checksTotal}
        </span>
      </span>
      {current && <span className="hidden text-[13px] font-medium text-[var(--accent)] sm:inline">진행할 차례</span>}
    </>
  );
  return (
    <li>
      {openable ? (
        <Link href={`/weeks/${slug}/sections/${section.id}`} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
          {body}
          <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </Link>
      ) : (
        <div className="flex items-center gap-4 py-4 opacity-70">{body}</div>
      )}
    </li>
  );
}

/** 선택 과정 펼침 안의 기록 요약(단계·실습·과제 심화 문제·퀴즈) */
function RecordLine({ record }: { record: TierRecord }) {
  const rows = [
    { label: "단계", c: record.sections },
    { label: "코딩 실습", c: record.labs },
    ...(record.tier === "advanced" ? [{ label: "과제 심화 문제", c: record.challenges }] : []),
    { label: "퀴즈", c: record.quiz },
  ].filter((r) => r.c.total > 0);
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-ink-muted">
      {rows.map((r) => (
        <li key={r.label}>
          {r.label}{" "}
          <span className={`tabular-nums ${r.c.done === r.c.total ? "text-[var(--status-good)]" : "text-ink-secondary"}`}>
            {r.c.done}/{r.c.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
