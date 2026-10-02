import Link from "next/link";
import type { WeekMeta } from "@/content/types";
import { loginHref } from "@/lib/returnPath";
import DifficultyBadge from "./DifficultyBadge";

// 목록에서는 고를 때 필요한 것(주차·제목·한 줄 설명·난이도·시간·진행)만 보여 준다.
// 학습 목표와 키워드는 주차 개요에서 자세히 본다.
export default function WeekCard({
  week,
  ratio,
  coreDone,
  coreTotal,
  minutes,
  locked = false,
  current = false,
}: {
  week: WeekMeta;
  ratio: number;
  /** 핵심 단계 완료 수(주차 완료 기준) */
  coreDone: number;
  coreTotal: number;
  /** 학습 자료 예상 시간(분) */
  minutes?: number;
  /** 로그인하지 않은 방문자: 진도 대신 로그인 안내를 보이고, 누르면 로그인 페이지로 보낸다. */
  locked?: boolean;
  /** 지금 학습 중인 주차 */
  current?: boolean;
}) {
  const href = `/weeks/${week.slug}`;
  const hours = minutes ? Math.round((minutes / 60) * 2) / 2 : undefined;
  const done = coreTotal > 0 && coreDone >= coreTotal;
  return (
    <Link
      href={locked ? loginHref(href) : href}
      prefetch={locked ? false : undefined}
      className={`surface surface-link group flex h-full flex-col p-5 ${current ? "border-[var(--series-blue)] ring-1 ring-[color-mix(in_srgb,var(--series-blue)_30%,transparent)]" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold text-ink-muted">WEEK {String(week.number).padStart(2, "0")}</span>
        {current ? (
          <span className="pill [--pill:var(--series-blue)]">학습 중</span>
        ) : done ? (
          <span className="pill [--pill:var(--status-good)]">✓ 완료</span>
        ) : null}
      </div>
      <h3 className="mt-2 text-lg font-extrabold leading-snug tracking-[-0.02em] text-ink group-hover:text-[var(--series-blue)]">{week.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{week.subtitle}</p>
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <DifficultyBadge level={week.difficulty} />
          {hours !== undefined && <span>약 {hours}시간</span>}
          {locked ? (
            <span className="ml-auto font-bold text-[var(--series-blue)]">로그인 후 학습 →</span>
          ) : (
            <span className="ml-auto tabular-nums">
              핵심 {coreDone}/{coreTotal}
            </span>
          )}
        </div>
        {!locked && (
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[var(--surface-card-2)]" aria-hidden="true">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round(ratio * 100)}%`, background: done ? "var(--status-good)" : "var(--series-blue)" }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
