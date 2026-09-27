import Link from "next/link";
import type { WeekMeta } from "@/content/types";
import ProgressRing from "./ProgressRing";

// 학습 목표는 "~한다." 문체로 적혀 있어 카드에서는 "~합니다."로 부드럽게 바꿔 보여준다.
function politeObjective(text: string): string {
  return text.replace(/한다\.$/, "합니다.").replace(/는다\.$/, "습니다.");
}

export default function WeekCard({
  week,
  ratio,
  sectionsDone,
  sectionsTotal,
}: {
  week: WeekMeta;
  ratio: number;
  sectionsDone: number;
  sectionsTotal: number;
}) {
  return (
    <Link
      href={`/weeks/${week.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)] hover:shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{week.phase}</p>
          <h3 className="mt-0.5 text-base font-black text-ink group-hover:text-[var(--series-blue)] sm:text-lg">
            {week.number}주차 · {week.title}
          </h3>
        </div>
        <ProgressRing ratio={ratio} size={44} />
      </div>
      {week.objectives[0] && (
        <div className="rounded-lg bg-[var(--surface-card-2)] px-3 py-2">
          <p className="text-[11px] font-bold text-[var(--series-blue)]">이번 주 목표</p>
          <p className="mt-0.5 text-sm text-ink-secondary">{politeObjective(week.objectives[0])}</p>
          {week.objectives.length > 1 && (
            <p className="mt-1 text-xs text-ink-muted">목표 {week.objectives.length - 1}개 더</p>
          )}
        </div>
      )}
      <p className="text-xs text-ink-muted">다루는 내용: {week.subtitle}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>{"★".repeat(week.difficulty)}{"☆".repeat(5 - week.difficulty)}</span>
        <span>
          {sectionsTotal}단계 중 {sectionsDone}단계 완료
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
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
