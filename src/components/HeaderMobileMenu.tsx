"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// 좁은 화면에서 상단 네비게이션(커리큘럼/주차별 자료/내 진도/로그인 등)을
// 한 줄에 다 넣으면 넘치는 부분이 잘려 보이는 문제가 있었다 — 특히
// 오른쪽 정렬(justify-end) + 가로 스크롤 조합에서는 스크롤이 가능하다는
// 표시(스크롤바)조차 없어 사용자가 잘렸다고 느끼기 쉽다. 이 컴포넌트는
// 그 항목들을 작은 화면에서는 햄버거 버튼 뒤로 감춰, 어떤 화면 너비에서도
// 잘리지 않고 전부 접근 가능하게 한다.
export default function HeaderMobileMenu({ children }: { children: ReactNode }) {
  // 링크를 눌러 페이지가 바뀌면 메뉴가 닫힌 상태로 시작해야 한다 — pathname을
  // key로 줘서 경로가 바뀔 때마다 패널을 통째로 다시 마운트시키는 방식으로
  // 해결한다(effect 안에서 직접 setState하는 것보다 React가 권장하는 패턴).
  const pathname = usePathname();
  return <MobileMenuPanel key={pathname}>{children}</MobileMenuPanel>;
}

function MobileMenuPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥을 클릭하거나 Esc를 누르면 닫는다. header 자체가 backdrop-blur를
  // 쓰는데, backdrop-filter가 걸린 조상 안에서는 position:fixed 오버레이의
  // 기준(containing block)이 뷰포트가 아니라 그 조상으로 바뀌어버려서
  // "화면 전체를 덮는 fixed 배경"으로 바깥 클릭을 감지하는 방식은 여기서는
  // 동작하지 않는다. 그래서 document 클릭을 직접 감지하는 방식을 쓴다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-hairline)] text-ink-secondary transition hover:bg-[var(--surface-card-2)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--border-hairline)] bg-card p-2 text-sm shadow-[var(--shadow-raised)]">
          {children}
        </div>
      )}
    </div>
  );
}
