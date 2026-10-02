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
import TierBadge from "@/components/TierBadge";
import { TIER_INFO, sectionLabel, splitTierPrefix } from "@/content/tiers";

type WeekStatusRow = WeekStatus["sections"][number];

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

const ACCESS_STYLE = {
  completed: { icon: "✓", label: "완료", ring: "var(--status-good)" },
  current: { icon: "▶", label: "진행할 차례", ring: "var(--series-blue)" },
  upcoming: { icon: "○", label: "미완료", ring: "var(--border-strong)" },
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
      <div className="space-y-10">
        {finished && status.coreDone && (
          <div role="status" className="rounded-xl border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-5 py-4">
            <p className="font-black text-ink">이번 주 핵심 단계를 모두 마쳤습니다.</p>
            <p className="mt-1 text-sm text-ink-secondary">다음: 백지공부 → 과제</p>
          </div>
        )}
        {locked && (
          <div className="rounded-xl border-l-4 border-[var(--status-serious)] bg-[color-mix(in_srgb,var(--status-serious)_12%,transparent)] px-5 py-3 text-sm text-ink-secondary">
            {locked === "finale" ? "백지공부와 과제는 핵심 단계를 모두 마치면 열립니다." : "앞의 핵심 단계를 먼저 마쳐 주십시오."}
          </div>
        )}

        <WeekFlowCard flow={flow} />

        {/* ── 학습 목표 ─────────────────────────────────────── */}
        <section id="goals" aria-labelledby="goals-heading">
          <h2 id="goals-heading" className="mb-3 text-xl font-black text-ink">학습 목표</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {coreGoals.map((g, i) => (
              <li key={i} className="flex gap-2.5 rounded-xl border border-[var(--border-hairline)] bg-card p-3 text-[15px] text-ink-secondary">
                <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--series-blue)_14%,transparent)] text-[11px] font-black text-[var(--series-blue)]">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <Inline text={g.text} />
                </span>
              </li>
            ))}
          </ul>
          {extraGoals.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-ink-muted">
              {extraGoals.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">{g.tier && <TierBadge tier={g.tier} compact />}</span>
                  <span className="min-w-0">
                    <Inline text={g.text} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 핵심 단계 ─────────────────────────────────────── */}
        <section aria-labelledby="core-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="core-heading" className="flex items-center gap-2 text-xl font-black text-ink">
              핵심 단계 <TierBadge tier="core" />
            </h2>
            <p className="text-sm font-bold text-ink-muted">
              {status.tiers.core.done}/{status.tiers.core.total} 완료 · 약 {hours(minutesOf(coreRows))}시간
            </p>
          </div>
          <ol className="space-y-2">
            {coreRows.map(({ section, access, progress }) => (
              <SectionRow key={section.id} slug={slug} section={section} access={access} progress={progress} isAdmin={isAdmin} />
            ))}
          </ol>
        </section>

        {/* ── 선택 과정 ─────────────────────────────────────── */}
        <section aria-labelledby="optional-heading" id="record-heading" className="scroll-mt-24">
          <h2 id="optional-heading" className="mb-3 text-xl font-black text-ink">선택 과정</h2>
          <div className="space-y-3">
            {(["supplement", "advanced"] as const).map((tier) => {
              const rows = status.sections.filter((r) => r.section.tier === tier);
              if (rows.length === 0) return null;
              const count = status.tiers[tier];
              const rec = records[tier];
              return (
                <details key={tier} className="group rounded-xl border border-[var(--border-hairline)] bg-card" open={count.done > 0 && count.done < count.total}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-ink">{TIER_INFO[tier].course}</span>
                      <TierBadge tier={tier} />
                      {rec.complete && tier === "advanced" && (
                        <span className="text-xs font-black" style={{ color: TIER_INFO.advanced.color }}>
                          ✦ 심화 달성
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3 text-xs font-bold text-ink-muted">
                      {count.done}/{count.total}단계 · 약 {hours(minutesOf(rows))}시간
                      <span aria-hidden="true" className="transition group-open:rotate-180">
                        ▾
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-[var(--border-hairline)] p-4">
                    <ol className="space-y-2">
                      {rows.map(({ section, access, progress }) => (
                        <SectionRow key={section.id} slug={slug} section={section} access={access} progress={progress} isAdmin={isAdmin} />
                      ))}
                    </ol>
                    {rec.total > 0 && <RecordCard record={rec} />}
                  </div>
                </details>
              );
            })}
            {lab && (lab.exercisesTotal > 0 || lab.quizTotal > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard href={`/weeks/${slug}/lab`} title="코딩 실습" state={`통과 ${lab.exercisesPassed}/${lab.exercisesTotal}`} done={lab.exercisesTotal > 0 && lab.exercisesPassed === lab.exercisesTotal} />
                <OptionCard
                  href={`/weeks/${slug}/descriptive`}
                  title="서술형 · 추가 퀴즈"
                  state={`완료 ${lab.quizDone}/${lab.quizTotal}${lab.quizWeak > 0 ? ` · 다시 볼 문항 ${lab.quizWeak}` : ""}`}
                  done={lab.quizTotal > 0 && lab.quizDone === lab.quizTotal}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── 이번 주 소개 ─────────────────────────────────── */}
        {(intro.length > 0 || week.learningOrder.length > 0) && (
          <details className="group rounded-xl border border-[var(--border-hairline)] bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-black text-ink">이번 주 소개 · 함께 보면 좋은 자료</span>
              <span aria-hidden="true" className="text-xs text-ink-muted transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="space-y-6 border-t border-[var(--border-hairline)] p-4 sm:p-5">
              {intro.length > 0 && <BlocksRenderer blocks={intro} docKey={`${slug}:intro`} />}
              {week.learningOrder.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-black text-ink">함께 보면 좋은 자료</h3>
                  <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-secondary">
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

function OptionCard({ href, title, state, done }: { href: string; title: string; state: string; done: boolean }) {
  return (
    <Link href={href} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-dashed border-[var(--border-strong)] bg-card p-4 transition hover:border-[var(--series-blue)]">
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-black text-ink">{title}</span>
        <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
      </span>
      <span className={`text-xs font-bold ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
        {state} <span className="ml-1 text-[var(--series-blue)]">→</span>
      </span>
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
  const style = ACCESS_STYLE[access];
  const openable = access !== "locked" || isAdmin;
  const color = TIER_INFO[section.tier].color;
  const body = (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-black"
        style={{ borderColor: access === "completed" ? style.ring : color, color: access === "locked" ? "var(--text-muted)" : access === "completed" ? style.ring : color }}
      >
        {access === "completed" ? "✓" : section.number}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold ${access === "locked" ? "text-ink-muted" : "text-ink"}`}>
          {sectionLabel(section)}. {section.title}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">
          <Inline text={section.meta.goal} />
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          <span className="sr-only">{style.label} · </span>약 {section.minutes}분
          · 확인 문제 {progress.checksDone}/{progress.checksTotal}
        </p>
      </div>
      <span className="shrink-0 text-xs font-bold" style={{ color: access === "locked" ? "var(--text-muted)" : style.ring }}>
        {style.icon} {access === "upcoming" && section.tier !== "core" ? "선택" : style.label}
      </span>
    </div>
  );
  return (
    <li>
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
}

/** 선택 과정 펼침 안의 기록 요약(단계·실습·과제 심화 문제·퀴즈) */
function RecordCard({ record }: { record: TierRecord }) {
  const rows = [
    { label: "단계", c: record.sections },
    { label: "코딩 실습", c: record.labs },
    ...(record.tier === "advanced" ? [{ label: "과제 심화 문제", c: record.challenges }] : []),
    { label: "퀴즈", c: record.quiz },
  ].filter((r) => r.c.total > 0);
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border-hairline)] pt-3 text-xs font-bold text-ink-muted">
      {rows.map((r) => (
        <li key={r.label}>
          {r.label}{" "}
          <span className={r.c.done === r.c.total ? "text-[var(--status-good)]" : "text-ink-secondary"}>
            {r.c.done}/{r.c.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
