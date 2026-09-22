"use client";

import { useState, type ReactNode } from "react";
import Checklist from "./Checklist";
import WeekStudyToc, { type StudyChapter } from "./WeekStudyToc";
import WeekTabs from "./WeekTabs";

type WeekLearningShellProps = {
  slug: string;
  chapters: StudyChapter[];
  children: ReactNode;
  navigation: ReactNode;
};

function PanelToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const label = isOpen ? "학습 패널 접기" : "학습 패널 펼치기";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card-2)] text-xl font-medium leading-none text-[var(--series-blue)] transition hover:border-[var(--series-blue)] hover:bg-[var(--surface-page)] focus:outline-none focus:ring-2 focus:ring-[var(--series-blue)] focus:ring-offset-2 focus:ring-offset-[var(--surface-page)]"
    >
      <span aria-hidden="true">{isOpen ? "›" : "‹"}</span>
    </button>
  );
}

export default function WeekLearningShell({ slug, chapters, children, navigation }: WeekLearningShellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const gridColumns = isPanelOpen
    ? "lg:grid-cols-[minmax(0,1fr)_300px]"
    : "lg:grid-cols-[minmax(0,1fr)_42px]";

  return (
    <div className={`grid gap-6 lg:gap-8 ${gridColumns}`}>
      <div className="min-w-0">
        <WeekTabs slug={slug} />
        <WeekStudyToc slug={slug} chapters={chapters} variant="mobile" />
        {children}
        {navigation}
      </div>

      <aside className="order-3 min-w-0 print:hidden lg:order-none">
        <div className="lg:hidden">
          <Checklist slug={slug} />
        </div>

        <div className="hidden lg:sticky lg:top-20 lg:block">
          {isPanelOpen ? (
            <section className="rounded-xl border border-[var(--border-hairline)] bg-card p-4" aria-label="학습 탐색 패널">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">학습 탐색</p>
                <PanelToggle isOpen={isPanelOpen} onToggle={() => setIsPanelOpen(false)} />
              </div>

              <div className="mt-3">
                <WeekStudyToc slug={slug} chapters={chapters} variant="desktop" />
              </div>

              <div className="my-4 border-t border-[var(--border-hairline)]" />
              <Checklist slug={slug} embedded />
            </section>
          ) : (
            <div className="flex justify-center">
              <PanelToggle isOpen={isPanelOpen} onToggle={() => setIsPanelOpen(true)} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
