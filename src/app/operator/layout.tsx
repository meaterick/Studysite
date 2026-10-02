import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import NavLink from "@/components/NavLink";

// 운영자 화면끼리 오갈 때마다 대시보드로 돌아가지 않아도 되도록, 모든 운영자 화면 위에 같은 메뉴를 둔다.
// 접근 권한은 각 페이지의 requireAdmin이 확인하고, 이 메뉴는 관리자에게만 그린다.
const OPERATOR_NAV = [
  { href: "/operator", label: "대시보드", exact: true },
  { href: "/operator/submissions", label: "과제 채점" },
  { href: "/operator/chat", label: "채팅" },
  { href: "/operator/members", label: "스터디원" },
  { href: "/operator/settings", label: "운영 설정" },
  { href: "/operator/quiz-answers", label: "모범 방향" },
  { href: "/operator/guide", label: "운영 가이드" },
  { href: "/operator/quality-log", label: "품질 로그" },
];

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      {user?.role === "admin" && (
        <div className="border-b border-[var(--border-hairline)] bg-[color-mix(in_srgb,var(--surface-card)_70%,transparent)] print:hidden">
          <nav aria-label="운영자 메뉴" className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            <span className="mr-2 shrink-0 rounded-md bg-[color-mix(in_srgb,var(--series-orange)_14%,transparent)] px-2 py-1 text-[11px] font-black text-[var(--series-orange)]">
              운영자
            </span>
            {OPERATOR_NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-bold transition"
                activeClassName="bg-card text-[var(--series-orange)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-hairline)]"
                inactiveClassName="text-ink-muted hover:bg-[var(--surface-card-2)] hover:text-ink"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
      {children}
    </>
  );
}
