"use client";

import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(true);
  if (pathname !== `/weeks/${slug}`) return null;

  if (variant === "mobile") {
    return (
      <nav aria-label="학습 자료 목차" className="mb-7 border-y border-[var(--border-hairline)] py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">이 주차의 목차</p>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "목차 접기" : "목차 펼치기"}
            title={isOpen ? "목차 접기" : "목차 펼치기"}
            className="grid h-7 w-7 place-items-center rounded-md text-lg font-semibold leading-none text-[var(--series-blue)] hover:bg-[var(--surface-card-2)]"
          >
            <span aria-hidden="true">{isOpen ? "‹" : "›"}</span>
          </button>
        </div>
        {isOpen && (
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        )}
      </nav>
    );
  }

  return (
    <nav aria-label="학습 자료 목차" className="hidden lg:block">
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">이 주차의 목차</p>
      </div>
      <ol className="mt-3 max-h-[calc(100vh-10rem)] space-y-1.5 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
