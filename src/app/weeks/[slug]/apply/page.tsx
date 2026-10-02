import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS, getWeek } from "@/content/weeks";
import { TIER_INFO, TIER_ORDER } from "@/content/tiers";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { applySummary, type ApplyItem } from "@/lib/applyView";
import { weekFlow } from "@/lib/weekFlow";
import WeekFlowCard from "@/components/WeekFlowCard";

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
      <div className="space-y-10">
        {finished && status.coreDone && (
          <div role="status" className="callout callout-good px-5 py-4">
            <p className="font-black text-ink">핵심 단계를 모두 마쳤습니다. 이번 주 학습 완료입니다!</p>
            <p className="mt-1 text-sm text-ink-secondary">
              이제 배운 내용을 직접 꺼내 쓰고 적용해 볼 차례입니다. 다음은 <strong>백지공부</strong>와 <strong>과제</strong>입니다.
            </p>
          </div>
        )}

        <WeekFlowCard flow={flow} />

        {/* ── 선택 과정 ─────────────────────────────────────── */}
        <section aria-labelledby="optional-heading">
          <h2 id="optional-heading" className="mb-4 text-xl font-black text-ink">
            선택 과정
          </h2>
          <ol className="space-y-3">
            {optional.map((item) => (
              <ActivityRow key={item.key} item={item} />
            ))}
            {(status.tiers.supplement.total > 0 || status.tiers.advanced.total > 0) && (
              <li>
                <Link
                  href={`/weeks/${slug}#record-heading`}
                  className="flex items-center justify-between gap-4 surface p-4 transition hover:border-[var(--series-blue)] hover:shadow-sm"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-ink">보충 · 심화 단계</span>
                    <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
                  </span>
                  <span className="text-xs font-bold text-ink-muted">
                    보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
                    <span className="ml-2 text-sm text-[var(--series-blue)]">열기 →</span>
                  </span>
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
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-black text-ink">
            {item.locked && <span aria-hidden="true">🔒 </span>}
            {item.label}
          </h3>
          <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
          {item.weak > 0 && (
            <span className="rounded-md bg-[color-mix(in_srgb,var(--status-critical)_12%,transparent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--status-critical)]">
              다시 볼 문항 {item.weak}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-secondary">{item.desc}</p>
        {tiers.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold" aria-label="구분별 진행">
            {tiers.map((t) => {
              const c = item.tiers![t];
              const full = c.done === c.total;
              return (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: TIER_INFO[t].color }} aria-hidden="true" />
                  <span style={{ color: TIER_INFO[t].color }}>{TIER_INFO[t].label}</span>
                  <span className={full ? "text-[var(--status-good)]" : "text-ink-muted"}>
                    {c.done}/{c.total}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {item.locked && <p className="mt-2 text-xs font-bold text-ink-muted">핵심 단계를 모두 마치면 열립니다.</p>}
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
        <span
          className={`text-xs font-bold ${
            item.complete ? "text-[var(--status-good)]" : "text-ink-muted"
          }`}
        >
          {item.total <= 1 ? item.state : `완료 ${item.state}`}
        </span>
        {!item.locked && <span className="text-sm font-bold text-[var(--series-blue)]">열기 →</span>}
      </div>
    </div>
  );
  const cls = `block rounded-xl border p-4 transition ${
    "border-[var(--border-hairline)] bg-card"
  }`;
  return (
    <li>
      {item.locked ? (
        <div className={`${cls} opacity-75`}>{body}</div>
      ) : (
        <Link href={item.href} className={`${cls} hover:border-[var(--series-blue)] hover:shadow-sm`}>
          {body}
          <p className="mt-2 text-xs font-bold text-ink-muted sm:hidden">
            {item.total <= 1 ? item.state : `완료 ${item.state}`} · <span className="text-[var(--series-blue)]">열기 →</span>
          </p>
        </Link>
      )}
    </li>
  );
}
