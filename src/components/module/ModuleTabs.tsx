"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

export interface ModuleTab {
  href: string;
  label: string;
  /** 탭 옆의 작은 진행 숫자(예: "3/5") */
  sub?: string;
  done?: boolean;
  /** 이 탭이 활성인지 판단할 경로 접두사(없으면 href와 정확히 같을 때) */
  prefix?: string;
}

/** 모듈 메뉴: 개요 · 레슨 · 백지 복습 · 과제 · 복습 노트. 밑줄 탭으로 지금 위치만 표시한다. */
export default function ModuleTabs({ tabs }: { tabs: ModuleTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="모듈 메뉴" className="tabs print:hidden">
      {tabs.map((tab) => {
        const active = tab.prefix ? pathname.startsWith(tab.prefix) : pathname === tab.href;
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
