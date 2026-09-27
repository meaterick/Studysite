"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; locked?: boolean; match: (path: string) => boolean };

export default function WeekTabs({ slug, finaleLocked }: { slug: string; finaleLocked: boolean }) {
  const pathname = usePathname();
  const base = `/weeks/${slug}`;
  const tabs: Tab[] = [
    { href: base, label: "로드맵", match: (p) => p === base },
    { href: `${base}/continue`, label: "섹션 학습", match: (p) => p.startsWith(`${base}/sections/`) },
    { href: `${base}/worksheet`, label: "백지공부", locked: finaleLocked, match: (p) => p === `${base}/worksheet` },
    { href: `${base}/assignment`, label: "과제", locked: finaleLocked, match: (p) => p === `${base}/assignment` },
    { href: `${base}/quiz`, label: "복습 노트", match: (p) => p === `${base}/quiz` },
  ];

  return (
    <nav
      aria-label="주차 학습 단계"
      className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-[var(--border-hairline)] px-4 pb-px [scrollbar-width:none] sm:mx-0 sm:mb-8 sm:px-0 print:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            title={tab.locked ? "모든 섹션을 마치면 열립니다" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-bold transition-colors sm:px-4 ${
              active
                ? "border-[var(--series-blue)] text-[var(--series-blue)]"
                : "border-transparent text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {tab.locked && <span aria-hidden="true">🔒 </span>}
            {tab.label}
            {tab.locked && <span className="sr-only"> (잠김)</span>}
          </Link>
        );
      })}
    </nav>
  );
}
