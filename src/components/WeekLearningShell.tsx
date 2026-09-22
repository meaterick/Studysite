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

function SideToggle({
  side,
  isOpen,
  onToggle,
}: {
  side: "left" | "right";
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isLeft = side === "left";
  const symbol = isLeft ? (isOpen ? "‹" : "›") : isOpen ? "›" : "‹";
  const label = `${isLeft ? "목차" : "진도 체크"} ${isOpen ? "접기" : "펼치기"}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
      className="hidden h-10 w-10 place-items-center rounded-lg border border-[var(--border-hairline)] bg-card text-xl font-medium leading-none text-[var(--series-blue)] shadow-sm transition hover:border-[var(--series-blue)] hover:bg-[var(--surface-card-2)] focus:outline-none focus:ring-2 focus:ring-[var(--series-blue)] focus:ring-offset-2 focus:ring-offset-[var(--surface-page)] lg:grid"
    >
      <span aria-hidden="true">{symbol}</span>
    </button>
  );
}

export default function WeekLearningShell({ slug, chapters, children, navigation }: WeekLearningShellProps) {
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const gridColumns = isTocOpen
    ? isChecklistOpen
      ? "lg:grid-cols-[220px_minmax(0,1fr)_260px]"
      : "lg:grid-cols-[220px_minmax(0,1fr)_42px]"
    : isChecklistOpen
      ? "lg:grid-cols-[42px_minmax(0,1fr)_260px]"
      : "lg:grid-cols-[42px_minmax(0,1fr)_42px]";

  return (
    <div className={`grid gap-6 lg:gap-8 ${gridColumns}`}>
      <aside className="order-2 hidden min-w-0 print:hidden lg:order-none lg:block">
        <div className="lg:sticky lg:top-20">
          <div className={isTocOpen ? "relative" : "flex justify-center"}>
            {isTocOpen && <WeekStudyToc slug={slug} chapters={chapters} variant="desktop" />}
            <div className={isTocOpen ? "absolute -right-5 top-4 z-10" : ""}>
              <SideToggle side="left" isOpen={isTocOpen} onToggle={() => setIsTocOpen((open) => !open)} />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <WeekTabs slug={slug} />
        <WeekStudyToc slug={slug} chapters={chapters} variant="mobile" />
        {children}
        {navigation}
      </div>

      <aside className="order-3 min-w-0 print:hidden">
        <div className="lg:hidden">
          <Checklist slug={slug} />
        </div>
        <div className="hidden lg:sticky lg:top-20 lg:block">
          <div className={isChecklistOpen ? "relative" : "flex justify-center"}>
            {isChecklistOpen && <Checklist slug={slug} />}
            <div className={isChecklistOpen ? "absolute -left-5 top-4 z-10" : ""}>
              <SideToggle side="right" isOpen={isChecklistOpen} onToggle={() => setIsChecklistOpen((open) => !open)} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
