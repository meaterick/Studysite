"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { seg: "", label: "학습 자료" },
  { seg: "quiz", label: "퀴즈" },
  { seg: "worksheet", label: "백지공부" },
  { seg: "assignment", label: "과제" },
] as const;

export default function WeekTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/weeks/${slug}`;

  return (
    <nav className="mb-8 flex gap-1 border-b border-[var(--border-hairline)] print:hidden">
      {TABS.map((tab) => {
        const href = tab.seg ? `${base}/${tab.seg}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.seg}
            href={href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              active
                ? "border-[var(--series-blue)] text-[var(--series-blue)]"
                : "border-transparent text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
