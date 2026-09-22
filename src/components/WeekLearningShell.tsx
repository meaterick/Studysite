"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--series-blue)] transition hover:bg-[var(--surface-card-2)] focus:outline-none focus:ring-2 focus:ring-[var(--series-blue)] focus:ring-offset-2 focus:ring-offset-[var(--surface-page)]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={isOpen ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
      </svg>
    </button>
  );
}

export default function WeekLearningShell({ slug, chapters, children, navigation }: WeekLearningShellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const panelRef = useRef<HTMLElement>(null);
  const gridColumns = isPanelOpen
    ? "lg:grid-cols-[minmax(0,1fr)_300px]"
    : "lg:grid-cols-[minmax(0,1fr)_42px]";

  useEffect(() => {
    let animationFrame = 0;

    const updatePanelHeight = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const stickyTop = 80;
        const viewportGap = 16;
        const visibleTop = Math.max(panel.getBoundingClientRect().top, stickyTop);
        const availableHeight = Math.max(96, window.innerHeight - visibleTop - viewportGap);
        panel.style.setProperty("--study-panel-height", `${availableHeight}px`);
      });
    };

    updatePanelHeight();
    window.addEventListener("resize", updatePanelHeight);
    window.addEventListener("scroll", updatePanelHeight, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePanelHeight);
      window.removeEventListener("scroll", updatePanelHeight);
    };
  }, [isPanelOpen]);

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
            <section
              ref={panelRef}
              className="overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-hairline)] bg-card p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="학습 탐색 패널"
              style={{ maxHeight: "var(--study-panel-height, calc(100dvh - 6rem))" }}
            >
              <Checklist
                slug={slug}
                embedded
                action={<PanelToggle isOpen={isPanelOpen} onToggle={() => setIsPanelOpen(false)} />}
              />
              <div className="my-4 border-t border-[var(--border-hairline)]" />
              <WeekStudyToc slug={slug} chapters={chapters} variant="desktop" />
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
