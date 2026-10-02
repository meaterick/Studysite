"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 적용과 복습 묶음에 속하는 하위 경로(한눈에 보기 + 여섯 활동)
const APPLY_PATHS = ["/apply", "/descriptive", "/lab", "/drill", "/worksheet", "/assignment", "/quiz"];

type Tab = { href: string; step: number; label: string; sub?: string; done?: boolean; match: (path: string) => boolean };

/**
 * 주차 메뉴: 개요 → 학습 자료 → 적용과 복습, 세 단계로 이어지는 흐름을 번호와 함께 보여 준다.
 * stageSub / applySub: 탭 아래 작은 진행 상태(예: "핵심 3/7 완료", "제출 1/2")
 */
export default function WeekTabs({
  slug,
  stageHref,
  stageSub,
  stageDone,
  applySub,
  applyDone,
}: {
  slug: string;
  /** 학습 자료 탭이 바로 가는 주소(지금 학습할 단계) */
  stageHref: string;
  stageSub: string;
  stageDone: boolean;
  applySub: string;
  applyDone: boolean;
}) {
  const pathname = usePathname();
  const base = `/weeks/${slug}`;
  const tabs: Tab[] = [
    { href: base, step: 1, label: "개요", sub: "목표 · 단계 지도", match: (p) => p === base },
    { href: stageHref, step: 2, label: "학습 자료", sub: stageSub, done: stageDone, match: (p) => p.startsWith(`${base}/sections/`) },
    {
      href: `${base}/apply`,
      step: 3,
      label: "적용과 복습",
      sub: applySub,
      done: applyDone,
      match: (p) => APPLY_PATHS.some((s) => p === `${base}${s}`),
    },
  ];

  return (
    <nav aria-label="주차 학습 흐름" className="mb-6 print:hidden sm:mb-8">
      <ol className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card-2)] p-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="min-w-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`group flex h-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition sm:px-4 sm:py-2.5 ${
                  active ? "bg-card shadow-sm ring-1 ring-[var(--border-hairline)]" : "hover:bg-[color-mix(in_srgb,var(--surface-card)_60%,transparent)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`hidden h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black sm:grid ${
                    tab.done
                      ? "bg-[var(--status-good)] text-white"
                      : active
                        ? "bg-[var(--series-blue)] text-white"
                        : "border border-[var(--border-strong)] text-ink-muted"
                  }`}
                >
                  {tab.done ? "✓" : tab.step}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-black sm:text-[15px] ${active ? "text-[var(--series-blue)]" : "text-ink-secondary group-hover:text-ink"}`}
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      {tab.step}.{" "}
                    </span>
                    {tab.label}
                  </span>
                  {tab.sub && (
                    <span className={`block truncate text-[11px] font-bold ${tab.done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
                      {tab.sub}
                      {tab.done && <span className="sr-only"> (완료)</span>}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
