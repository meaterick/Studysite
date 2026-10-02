import Link from "next/link";
import type { WeekMeta } from "@/content/types";
import ProgressRing from "./ProgressRing";
import { loginHref } from "@/lib/returnPath";
import DifficultyBadge from "./DifficultyBadge";
import { splitTierPrefix } from "@/content/tiers";
import { Inline } from "./MarkdownBlocks";

// 학습 목표는 "~한다." 문체로 적혀 있어 카드에서는 "~합니다."로 부드럽게 바꿔 보여준다.
function politeObjective(text: string): string {
  return text.replace(/한다\.$/, "합니다.").replace(/는다\.$/, "습니다.");
}

export default function WeekCard({
  week,
  ratio,
  coreDone,
  coreTotal,
  minutes,
  locked = false,
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
}) {
  const href = `/weeks/${week.slug}`;
  const hours = minutes ? Math.round((minutes / 60) * 2) / 2 : undefined;
  // 좁은 화면에서는 제목·난이도·진행·이번 주 목표만 크게 보여 주고, 키워드와 긴 설명은 sm 이상에서만 보인다.
  return (
    <Link
      href={locked ? loginHref(href) : href}
      prefetch={locked ? false : undefined}
      className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)] hover:shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hidden text-[11px] font-bold uppercase tracking-wide text-ink-muted sm:block">{week.phase}</p>
          <h3 className="text-[17px] font-black leading-snug text-ink group-hover:text-[var(--series-blue)] sm:mt-0.5 sm:text-lg">
            {week.number}주차 · {week.title}
          </h3>
        </div>
        {!locked && <ProgressRing ratio={ratio} size={44} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-muted">
        <DifficultyBadge level={week.difficulty} />
        {hours !== undefined && <span>약 {hours}시간</span>}
        {locked ? (
          <span className="font-bold text-[var(--series-blue)]">로그인 후 학습하기 →</span>
        ) : (
          <span>
            핵심 {coreDone}/{coreTotal}단계 완료
          </span>
        )}
      </div>
      {week.objectives[0] && (
        <div className="rounded-lg bg-[var(--surface-card-2)] px-3 py-2">
          <p className="text-xs font-bold text-[var(--series-blue)]">이번 주 목표</p>
          <p className="mt-0.5 text-[15px] leading-relaxed text-ink-secondary sm:text-sm"><Inline text={politeObjective(splitTierPrefix(week.objectives[0]).text)} /></p>
          {week.objectives.length > 1 && (
            <p className="mt-1 hidden text-xs text-ink-muted sm:block">목표 {week.objectives.length - 1}개 더</p>
          )}
        </div>
      )}
      <p className="hidden text-xs text-ink-muted sm:block">다루는 내용: {week.subtitle}</p>
      <div className="hidden flex-wrap gap-1.5 sm:flex">
        {week.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full bg-[var(--surface-card-2)] px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary"
          >
            {k}
          </span>
        ))}
      </div>
    </Link>
  );
}
