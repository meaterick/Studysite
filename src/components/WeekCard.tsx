import Link from "next/link";
import type { WeekMeta } from "@/content/types";
import { WeekProgressBadge } from "./Checklist";

export default function WeekCard({ week }: { week: WeekMeta }) {
  return (
    <Link
      href={`/weeks/${week.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)] hover:shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{week.phase}</p>
          <h3 className="mt-0.5 text-base font-black text-ink group-hover:text-[var(--series-blue)] sm:text-lg">
            Week {week.number} · {week.title}
          </h3>
        </div>
        <WeekProgressBadge slug={week.slug} />
      </div>
      <p className="text-sm text-ink-secondary">{week.subtitle}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>{"★".repeat(week.difficulty)}{"☆".repeat(5 - week.difficulty)}</span>
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
