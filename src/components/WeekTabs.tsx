"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

// 적용과 복습 묶음에 속하는 하위 경로(한눈에 보기 + 다섯 활동)
const APPLY_PATHS = ["/apply", "/descriptive", "/lab", "/drill", "/worksheet", "/assignment"];

type Tab = { href: string; label: string; sub?: string; done?: boolean; match: (path: string) => boolean };

/**
 * 주차 메뉴: 개요 · 학습 자료 · 적용과 복습. 밑줄 탭으로 지금 위치만 조용히 표시한다.
 * stageSub / applySub: 탭 옆의 작은 진행 숫자(예: "3/7", "1/2")
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
    { href: base, label: "개요", match: (p) => p === base },
    { href: stageHref, label: "학습 자료", sub: stageSub, done: stageDone, match: (p) => p.startsWith(`${base}/sections/`) },
    { href: `${base}/apply`, label: "적용과 복습", sub: applySub, done: applyDone, match: (p) => APPLY_PATHS.some((s) => p === `${base}${s}`) },
  ];

  return (
    <nav aria-label="주차 학습 흐름" className="tabs print:hidden">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link key={tab.label} href={tab.href} aria-current={active ? "page" : undefined} className="tab">
            {tab.label}
            {tab.done ? (
              <span className="text-[var(--status-good)]">
                <Icon name="check" size={15} />
                <span className="sr-only">(완료)</span>
              </span>
            ) : (
              tab.sub && <span className="text-xs font-normal tabular-nums text-ink-muted">{tab.sub}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
