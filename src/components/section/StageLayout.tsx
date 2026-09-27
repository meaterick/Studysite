"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "aegis:stage-list-collapsed";
const CHANGE_EVENT = "aegis:stage-list-toggle";

// 접힘 상태는 localStorage에 두고 useSyncExternalStore로 읽는다. 서버 렌더링 때는 항상 펼친 상태.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // 저장소를 쓸 수 없으면 이번 화면에서만 적용되지 않는다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * 단계 학습 화면의 2단 배치. 넓은 화면에서는 오른쪽 "이번 주 단계" 목록을 접어
 * 본문을 넓게 쓸 수 있고, 접은 상태는 브라우저에 기억한다. 좁은 화면에서는 본문 위에
 * 접고 펼 수 있는 목록으로 보여 준다(기본은 접힘).
 */
export default function StageLayout({
  children,
  list,
  done,
  total,
}: {
  children: ReactNode;
  /** 단계 목록(서버에서 렌더링) */
  list: ReactNode;
  done: number;
  total: number;
}) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const toggle = () => writeCollapsed(!collapsed);

  const summary = `이번 주 단계 · ${done}/${total} 완료`;

  return (
    <div
      className={`grid gap-8 transition-[grid-template-columns] duration-300 ${
        collapsed ? "lg:grid-cols-[minmax(0,1fr)_44px]" : "lg:grid-cols-[minmax(0,1fr)_260px]"
      }`}
    >
      <div className="min-w-0">{children}</div>

      <aside className="order-first lg:order-none print:hidden" aria-label="이번 주 단계 목록">
        {/* 좁은 화면: 본문 위의 접이식 목록 */}
        <details className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-bold text-ink-secondary">
            {summary}
            <span className="ml-2 font-normal text-ink-muted">(목록 펼치기)</span>
          </summary>
          {list}
        </details>

        {/* 넓은 화면: 오른쪽 고정 목록, 접으면 세로 막대만 남는다 */}
        <div className="hidden lg:sticky lg:top-20 lg:block">
          {collapsed ? (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={false}
              aria-controls="stage-list-panel"
              title="이번 주 단계 목록 펼치기"
              className="flex w-11 flex-col items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-card py-3 text-ink-secondary transition hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
            >
              <span aria-hidden="true" className="text-base leading-none">
                «
              </span>
              <span className="text-xs font-bold [writing-mode:vertical-rl]">이번 주 단계</span>
              <span className="text-[11px] font-bold text-[var(--series-blue)] [writing-mode:vertical-rl]">
                {done}/{total}
              </span>
              <span className="sr-only">목록 펼치기</span>
            </button>
          ) : (
            <div id="stage-list-panel" className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ink-muted">
                  이번 주 단계 ({done}/{total})
                </p>
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={true}
                  aria-controls="stage-list-panel"
                  title="이번 주 단계 목록 접기"
                  className="rounded-md px-1.5 py-0.5 text-xs font-bold text-ink-muted transition hover:bg-[var(--surface-card-2)] hover:text-ink"
                >
                  접기 »
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
