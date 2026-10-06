"use client";

import { useState, type ReactNode } from "react";
import { STAGE_LIST_COOKIE } from "@/lib/stageListCookie";
import Icon from "@/components/Icon";

// 접힘 상태는 쿠키에 둔다. 서버가 첫 화면부터 같은 모양으로 그려야 펼쳤다 접히는 깜빡임이 없다.

function writeCollapsed(value: boolean) {
  document.cookie = `${STAGE_LIST_COOKIE}=${value ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * 학습 자료 화면의 2단 배치. 넓은 화면에서는 오른쪽 "이번 주 단계" 목록을 접어
 * 본문을 넓게 쓸 수 있고, 접은 상태는 쿠키에 기억해 서버 렌더링부터 반영한다. 좁은 화면에서는 본문 위에
 * 접고 펼 수 있는 목록으로 보여 준다(기본은 접힘).
 * 접힘 여부는 data-collapsed로 내려 주므로, 본문은 `group-data-[collapsed]/stage:` 변형으로
 * 목록이 줄어든 폭(248px → 40px)만큼 최대 폭을 늘릴 수 있다.
 */
export default function StageLayout({
  children,
  list,
  done,
  total,
  initialCollapsed = false,
}: {
  children: ReactNode;
  /** 단계 목록(서버에서 렌더링) */
  list: ReactNode;
  done: number;
  total: number;
  /** 서버가 쿠키에서 읽은 접힘 상태 */
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggle = () => {
    writeCollapsed(!collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <div
      data-collapsed={collapsed ? "true" : undefined}
      className={`group/stage grid gap-10 transition-[grid-template-columns] duration-300 xl:gap-16 ${
        collapsed ? "lg:grid-cols-[minmax(0,1fr)_40px]" : "lg:grid-cols-[minmax(0,1fr)_248px]"
      }`}
    >
      <div className="min-w-0">{children}</div>

      <aside className="order-first lg:order-none print:hidden" aria-label="이번 주 단계 목록">
        {/* 좁은 화면: 본문 위의 접이식 목록 */}
        <details className="group border-y border-[var(--border-hairline)] lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm [&::-webkit-details-marker]:hidden">
            <span className="font-medium text-ink">이번 주 단계</span>
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="tabular-nums">
                핵심 {done}/{total}
              </span>
              <Icon name="chevronDown" size={16} className="transition group-open:rotate-180" />
            </span>
          </summary>
          <div className="pb-4">{list}</div>
        </details>

        {/* 넓은 화면: 오른쪽 고정 목록, 접으면 얇은 막대만 남는다 */}
        <div className="hidden lg:sticky lg:top-24 lg:block">
          {collapsed ? (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={false}
              aria-controls="stage-list-panel"
              title="이번 주 단계 목록 펼치기"
              className="flex w-10 flex-col items-center gap-3 rounded-full border border-[var(--border-hairline)] py-4 text-ink-muted transition hover:border-[var(--border-strong)] hover:text-ink"
            >
              <Icon name="arrowLeft" size={14} />
              <span className="text-xs [writing-mode:vertical-rl]">이번 주 단계</span>
              <span className="text-[11px] tabular-nums [writing-mode:vertical-rl]">
                {done}/{total}
              </span>
              <span className="sr-only">목록 펼치기</span>
            </button>
          ) : (
            <div id="stage-list-panel" className="border-l border-[var(--border-hairline)] pl-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-ink">
                  이번 주 단계
                  <span className="ml-2 font-normal tabular-nums text-ink-muted">
                    {done}/{total}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={true}
                  aria-controls="stage-list-panel"
                  title="이번 주 단계 목록 접기"
                  className="icon-btn h-7 w-7"
                >
                  <Icon name="arrowRight" size={14} />
                  <span className="sr-only">목록 접기</span>
                </button>
              </div>
              {list}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
