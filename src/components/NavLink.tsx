"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 머리글·운영자 메뉴의 링크. 지금 보고 있는 화면(또는 그 하위 화면)이면 aria-current와 강조 모양을 준다.
 * exact: 하위 경로는 활성으로 보지 않는다(예: /operator 대시보드).
 */
export default function NavLink({
  href,
  children,
  exact = false,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${className} ${active ? activeClassName : inactiveClassName}`}>
      {children}
    </Link>
  );
}
