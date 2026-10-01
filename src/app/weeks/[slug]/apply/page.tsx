import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS, getWeek } from "@/content/weeks";
import { TIER_INFO, TIER_ORDER } from "@/content/tiers";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { continueHref } from "@/lib/study";
import { applySummary, type ApplyItem } from "@/lib/applyView";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 적용과 복습` } : {};
}

/**
 * 적용과 복습 · 한눈에 보기: 필수 경로(핵심 단계 → 백지공부 → 과제)와 여섯 활동의 권장 순서·진행 상태를 보여 주고,
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
  const coreLeft = status.tiers.core.total - status.tiers.core.done;
  const allRequired = summary.requiredDone === summary.requiredTotal;

  // 지금 할 일: 핵심 단계가 남았으면 학습 자료, 아니면 다음 필수 활동, 다 끝났으면 추가 활동 중 아직 덜 한 것
  const nextExtra = summary.items.find((i) => !i.required && i.key !== "notes" && i.total > 0 && !i.complete);
  const nextStep: { label: string; detail: string; href: string } = !status.coreDone
    ? {
        label: "핵심 단계 마저 학습하기",
        detail: `핵심 단계가 ${coreLeft}개 남았습니다. 백지공부와 과제는 핵심 단계를 모두 마친 뒤에 하는 것이 효과적입니다.`,
        href: continueHref(slug, status),
      }
    : summary.nextRequired
      ? {
          label: `${summary.nextRequired.label} ${summary.nextRequired.key === "assignment" ? "작성·제출하기" : "작성하기"}`,
          detail: summary.nextRequired.desc,
          href: summary.nextRequired.href,
        }
      : nextExtra
        ? { label: `${nextExtra.label} 이어서 하기`, detail: "필수 활동을 모두 마쳤습니다. 추가 활동으로 실력을 더 다져 보십시오.", href: nextExtra.href }
        : { label: "복습 노트 보기", detail: "이번 주의 모든 활동을 마쳤습니다. 다시 볼 문항을 정리해 두십시오.", href: `/weeks/${slug}/quiz` };

  const required = summary.items.filter((i) => i.required);

  return (
    <WeekFrame week={week} status={status} record={record} apply="hub">
      <div className="space-y-10">
        {finished && status.coreDone && (
          <div role="status" className="rounded-xl border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-5 py-4">
            <p className="font-black text-ink">핵심 단계를 모두 마쳤습니다. 이번 주 학습 완료입니다!</p>
            <p className="mt-1 text-sm text-ink-secondary">
              이제 배운 내용을 직접 꺼내 쓰고 적용해 볼 차례입니다. <strong>백지공부</strong>와 <strong>과제</strong>가 필수이고, 나머지는 원하는 만큼 골라서 하면 됩니다.
            </p>
          </div>
        )}

        <section aria-labelledby="apply-intro">
          <h2 id="apply-intro" className="text-xl font-black text-ink">
            적용과 복습
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            학습 자료에서 개념을 익혔다면, 이제 그 개념을 <strong className="text-ink-secondary">설명하고(서술형)</strong>,{" "}
            <strong className="text-ink-secondary">코드로 옮기고(코딩 실습)</strong>, <strong className="text-ink-secondary">더 풀어 보고(추가 퀴즈)</strong>,{" "}
            <strong className="text-ink-secondary">자료 없이 떠올리고(백지공부)</strong>, <strong className="text-ink-secondary">과제로 적용한 뒤</strong>,{" "}
            <strong className="text-ink-secondary">약한 부분을 다시 봅니다(복습 노트)</strong>.
          </p>
        </section>

        {/* ── 지금 할 일 + 필수 경로 ───────────────────────────── */}
        <section aria-labelledby="required-heading" className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--series-blue)_40%,transparent)] bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-black text-[var(--series-blue)]">지금 할 일</p>
              <p className="mt-1 text-lg font-black text-ink">{nextStep.label}</p>
              <p className="mt-0.5 text-sm text-ink-secondary">{nextStep.detail}</p>
            </div>
            <Link href={nextStep.href} className="shrink-0 rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              시작하기 →
            </Link>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="required-heading" className="text-sm font-black text-ink">
                필수 경로 <span className="font-bold text-ink-muted">· 이것만 하면 이번 주 진행률 100%</span>
              </h3>
              <span className={`text-xs font-bold ${allRequired && status.coreDone ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
                {status.coreDone && allRequired ? "✓ 모두 완료" : `${(status.coreDone ? 1 : 0) + summary.requiredDone}/${1 + summary.requiredTotal} 완료`}
              </span>
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              <PathNode
                step={1}
                title="핵심 단계"
                place="학습 자료"
                state={status.coreDone ? "완료" : `${status.tiers.core.done}/${status.tiers.core.total}단계`}
                done={status.coreDone}
                current={!status.coreDone}
                href={continueHref(slug, status)}
              />
              {required.map((item, i) => (
                <PathNode
                  key={item.key}
                  step={i + 2}
                  title={item.label}
                  place="적용과 복습"
                  state={item.locked ? "핵심 단계를 마치면 열림" : item.state}
                  done={item.complete}
                  current={status.coreDone && summary.nextRequired?.key === item.key}
                  locked={item.locked}
                  href={item.href}
                />
              ))}
            </ol>
          </div>
        </section>

        {/* ── 여섯 활동: 권장 순서 ─────────────────────────────── */}
        <section aria-labelledby="flow-heading">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="flow-heading" className="text-xl font-black text-ink">
              권장 순서
            </h2>
            <p className="flex items-center gap-3 text-xs font-bold text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-[var(--series-blue)]" /> 필수
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-[var(--border-strong)]" /> 추가 활동(선택)
              </span>
            </p>
          </div>
          <p className="mb-5 text-sm text-ink-muted">
            위에서부터 차례로 하는 것을 권장하지만, 추가 활동은 필요한 것만 골라도 됩니다. 추가 활동은 <strong className="text-ink-secondary">핵심</strong> 문항부터 풀고,
            여유가 있으면 <strong className="text-ink-secondary">보충·심화</strong>로 넓혀 가십시오.
          </p>
          <ol className="space-y-3">
            {summary.items.map((item, i) => (
              <ActivityRow key={item.key} item={item} index={i} />
            ))}
          </ol>
        </section>
      </div>
    </WeekFrame>
  );
}

function PathNode({
  step,
  title,
  place,
  state,
  done,
  current,
  locked = false,
  href,
}: {
  step: number;
  title: string;
  place: string;
  state: string;
  done: boolean;
  current: boolean;
  locked?: boolean;
  href: string;
}) {
  const body = (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
          done
            ? "bg-[var(--status-good)] text-white"
            : current
              ? "bg-[var(--series-blue)] text-white"
              : "border-2 border-[var(--series-blue)] text-[var(--series-blue)]"
        }`}
      >
        {done ? "✓" : locked ? "🔒" : step}
      </span>
      <div className="min-w-0">
        <p className="font-black text-ink">{title}</p>
        <p className={`text-xs font-bold ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
          {place} · {state}
        </p>
      </div>
    </div>
  );
  const cls = `block h-full rounded-xl border p-3 transition ${
    current ? "border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_6%,transparent)]" : "border-[var(--border-hairline)]"
  }`;
  return (
    <li aria-current={current ? "step" : undefined}>
      {locked ? (
        <div className={`${cls} opacity-70`}>{body}</div>
      ) : (
        <Link href={href} className={`${cls} hover:border-[var(--series-blue)]`}>
          {body}
        </Link>
      )}
    </li>
  );
}

function ActivityRow({ item, index }: { item: ApplyItem; index: number }) {
  const tiers = item.tiers ? TIER_ORDER.filter((t) => item.tiers![t].total > 0) : [];
  const body = (
    <div className="flex items-start gap-4">
      <span
          aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
            item.complete
              ? "bg-[var(--status-good)] text-white"
              : item.required
                ? "bg-[var(--series-blue)] text-white"
                : "border-2 border-dashed border-[var(--border-strong)] bg-card text-ink-muted"
          }`}
        >
          {item.complete ? "✓" : index + 1}
        </span>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-black text-ink">
            {item.locked && <span aria-hidden="true">🔒 </span>}
            {item.label}
          </h3>
          {item.required ? (
            <span className="rounded-md bg-[var(--series-blue)] px-1.5 py-0.5 text-[11px] font-black text-white">필수</span>
          ) : (
            <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">추가</span>
          )}
          {item.weak > 0 && item.key !== "notes" && (
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
            item.complete ? "text-[var(--status-good)]" : item.key === "notes" && item.weak > 0 ? "text-[var(--status-critical)]" : "text-ink-muted"
          }`}
        >
          {item.key === "notes" || item.total <= 1 ? item.state : `완료 ${item.state}`}
        </span>
        {!item.locked && <span className="text-sm font-bold text-[var(--series-blue)]">열기 →</span>}
      </div>
    </div>
  );
  const cls = `block rounded-xl border p-4 transition ${
    item.required ? "border-[color-mix(in_srgb,var(--series-blue)_35%,transparent)] bg-card" : "border-[var(--border-hairline)] bg-card"
  }`;
  return (
    <li>
      {item.locked ? (
        <div className={`${cls} opacity-75`}>{body}</div>
      ) : (
        <Link href={item.href} className={`${cls} hover:border-[var(--series-blue)] hover:shadow-sm`}>
          {body}
          <p className="mt-2 pl-[52px] text-xs font-bold text-ink-muted sm:hidden">
            {item.key === "notes" || item.total <= 1 ? item.state : `완료 ${item.state}`} · <span className="text-[var(--series-blue)]">열기 →</span>
          </p>
        </Link>
      )}
    </li>
  );
}
