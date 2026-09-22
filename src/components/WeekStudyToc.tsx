"use client";

import { usePathname } from "next/navigation";

export type StudyChapter = {
  id: string;
  label: string;
  level?: 2 | 3;
};

export default function WeekStudyToc({
  slug,
  chapters,
  variant,
}: {
  slug: string;
  chapters: StudyChapter[];
  variant: "mobile" | "desktop";
}) {
  const pathname = usePathname();
  if (pathname !== `/weeks/${slug}`) return null;

  if (variant === "mobile") {
    return (
      <nav aria-label="학습 자료 목차" className="mb-7 border-y border-[var(--border-hairline)] py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">이 주차의 목차</p>
          <span className="text-[11px] text-ink-muted">옆으로 밀어 이동</span>
        </div>
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="shrink-0 snap-start rounded-full border border-[var(--border-hairline)] bg-card px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
            >
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="학습 자료 목차" className="hidden rounded-xl border border-[var(--border-hairline)] bg-card p-4 lg:block">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted">이 주차의 목차</p>
      <ol className="max-h-[calc(100vh-10rem)] space-y-1.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        {chapters.map((chapter) => (
          <li key={chapter.id} className={chapter.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${chapter.id}`}
              className="block rounded-md px-2 py-1.5 text-sm text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-[var(--series-blue)]"
            >
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
