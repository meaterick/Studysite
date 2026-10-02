import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS, getWeek } from "@/content/weeks";
import { TIER_INFO, TIER_ORDER } from "@/content/tiers";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { applySummary, type ApplyItem } from "@/lib/applyView";
import { weekFlow } from "@/lib/weekFlow";
import WeekFlowCard from "@/components/WeekFlowCard";
import Icon from "@/components/Icon";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 적용과 복습` } : {};
}

/**
 * 적용과 복습 · 한눈에 보기: 한 주의 흐름(핵심 단계 학습 → 확인 문제 → 백지공부 → 과제)과 선택 과정의 진행 상태를 보여 주고,
 * 지금 할 일을 하나로 정해 준다.
 */
export default async function ApplyHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ finished?: string }>;
}) {
  const { slug } = await params;
  const { finished } = await searchParams;
  const { week, record, status } = await loadWeekPage(slug, `/weeks/${slug}/apply`);
  const summary = applySummary(week, record, status);
  const flow = weekFlow(week, record, status, summary);
  const optional = summary.items.filter((i) => !i.onPath);

  return (
    <WeekFrame week={week} status={status} record={record} apply="hub">
      <div className="space-y-16">
        {finished && status.coreDone && (
          <p role="status" className="callout callout-good flex items-center gap-2.5 font-medium text-ink">
            <Icon name="check" size={16} className="text-[var(--status-good)]" />
            핵심 단계를 모두 마쳤습니다. 이제 백지공부와 과제입니다.
          </p>
        )}

        <WeekFlowCard flow={flow} />

        {/* ── 선택 과정 ─────────────────────────────────────── */}
        <section aria-labelledby="optional-heading">
          <h2 id="optional-heading" className="section-title mb-3">
            선택 과정
          </h2>
          <ol className="rows border-y border-[var(--border-hairline)]">
            {optional.map((item) => (
              <ActivityRow key={item.key} item={item} />
            ))}
            {(status.tiers.supplement.total > 0 || status.tiers.advanced.total > 0) && (
              <li>
                <Link href={`/weeks/${slug}#record-heading`} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
                  <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">보충 · 심화 단계</span>
                  <span className="text-[13px] tabular-nums text-ink-muted">
                    보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
                  </span>
                  <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            )}
          </ol>
        </section>
      </div>
    </WeekFrame>
  );
}

function ActivityRow({ item }: { item: ApplyItem }) {
  const tiers = item.tiers ? TIER_ORDER.filter((t) => item.tiers![t].total > 0) : [];
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {item.locked && <Icon name="lock" size={14} className="text-ink-muted" />}
          <span className="text-[15px] font-medium text-ink">{item.label}</span>
          {item.weak > 0 && <span className="pill [--pill:var(--status-critical)]">다시 볼 문항 {item.weak}</span>}
        </span>
        {tiers.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted" aria-label="구분별 진행">
            {tiers.map((t) => {
              const c = item.tiers![t];
              return (
                <span key={t} className="flex items-center gap-1.5 tabular-nums">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: TIER_INFO[t].color }} aria-hidden="true" />
                  {TIER_INFO[t].label} {c.done}/{c.total}
                </span>
              );
            })}
          </span>
        )}
        {item.locked && <span className="mt-1 block text-xs text-ink-muted">핵심 단계를 모두 마치면 열립니다</span>}
      </span>
      <span className={`shrink-0 text-[13px] tabular-nums ${item.complete ? "text-[var(--status-good)]" : "text-ink-muted"}`}>{item.state}</span>
    </>
  );
  return (
    <li>
      {item.locked ? (
        <div className="flex items-center gap-4 py-4 opacity-70">{body}</div>
      ) : (
        <Link href={item.href} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
          {body}
          <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </Link>
      )}
    </li>
  );
}
