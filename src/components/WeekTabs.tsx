"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Tab = { href: string; label: string; locked?: boolean; warn?: boolean; match: (path: string) => boolean };

/**
 * finaleLocked: 백지공부·과제가 잠겨 있음(lock 모드에서 단계 미완료).
 * finaleUnfinished: 열려 있지만 아직 끝내지 않은 단계가 있음(warn 모드) → 작은 경고 점으로 표시.
 */
export default function WeekTabs({
  slug,
  finaleLocked,
  finaleUnfinished = false,
}: {
  slug: string;
  finaleLocked: boolean;
  finaleUnfinished?: boolean;
}) {
  const pathname = usePathname();
  const base = `/weeks/${slug}`;
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const tabs: Tab[] = [
    { href: base, label: "개요", match: (p) => p === base },
    { href: `${base}/continue`, label: "단계 학습", match: (p) => p.startsWith(`${base}/sections/`) },
    { href: `${base}/worksheet`, label: "백지공부", locked: finaleLocked, warn: !finaleLocked && finaleUnfinished, match: (p) => p === `${base}/worksheet` },
    { href: `${base}/assignment`, label: "과제", locked: finaleLocked, warn: !finaleLocked && finaleUnfinished, match: (p) => p === `${base}/assignment` },
    { href: `${base}/quiz`, label: "복습 노트", match: (p) => p === `${base}/quiz` },
  ];

  // 좁은 화면에서 탭이 가로로 넘칠 때, 현재 탭이 항상 보이도록 스크롤한다.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <div className="relative -mx-4 mb-6 sm:mx-0 sm:mb-8 print:hidden">
      <nav
        aria-label="주차 메뉴"
        className="flex gap-1 overflow-x-auto border-b border-[var(--border-hairline)] px-4 pb-px [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:px-0 sm:[mask-image:none]"
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              ref={active ? activeRef : undefined}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              title={
                tab.locked
                  ? "이번 주의 모든 단계를 마치면 열립니다"
                  : tab.warn
                    ? "아직 끝내지 않은 단계가 있습니다. 모든 단계를 마친 뒤에 하는 것을 권장합니다."
                    : undefined
              }
              className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-bold transition-colors sm:px-4 ${
                active
                  ? "border-[var(--series-blue)] text-[var(--series-blue)]"
                  : "border-transparent text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {tab.locked && <span aria-hidden="true">🔒 </span>}
              {tab.label}
              {tab.locked && <span className="sr-only"> (잠김)</span>}
              {tab.warn && (
                <>
                  <span aria-hidden="true" className="ml-1 inline-block h-1.5 w-1.5 -translate-y-1.5 rounded-full bg-[var(--status-warning)]" />
                  <span className="sr-only"> (앞 단계 미완료)</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--surface-page)] to-transparent sm:hidden"
      />
    </div>
  );
}
