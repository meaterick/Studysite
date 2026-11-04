import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import ThemeToggle from "./ThemeToggle";
import HeaderAuthSection from "./HeaderAuthSection";
import HeaderMobileMenu from "./HeaderMobileMenu";
import NavLink from "./NavLink";
import { NAV_STYLES } from "./navStyles";

const NAV = [
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/weeks", label: "주차별 자료" },
];
// "내 진도"·"피드백함"·"채팅"은 로그인한 사용자에게만 의미가 있어 HeaderAuthSection에서 로그인 시에만 보여 준다.

function AuthSkeleton() {
  return <span aria-hidden className="h-8 w-20 animate-pulse rounded-full bg-[var(--surface-card-2)]" />;
}

export default function SiteHeader() {
  const bar = NAV_STYLES.bar;
  const menu = NAV_STYLES.menu;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-page/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/images/aegis-mark.svg" alt="" width={26} height={26} className="h-[26px] w-[26px]" priority />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Aegis AI 스터디</span>
        </Link>

        {/* md 이상: 한 줄 가로 메뉴 */}
        <nav aria-label="주 메뉴" className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} className={bar.base} activeClassName={bar.active} inactiveClassName={bar.idle}>
              {item.label}
            </NavLink>
          ))}
          <Suspense fallback={<AuthSkeleton />}>
            <HeaderAuthSection />
          </Suspense>
          <span aria-hidden="true" className="mx-2 h-4 w-px bg-[var(--border-strong)]" />
          <ThemeToggle />
        </nav>

        {/* md 미만: 항목을 한 줄에 다 넣으면 잘려 보여서, 메뉴 버튼 뒤로 감춰 전부 보이게 한다. */}
        <HeaderMobileMenu>
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} className={menu.base} activeClassName={menu.active} inactiveClassName={menu.idle}>
                {item.label}
              </NavLink>
            ))}
            <div className="mx-3 my-1.5 border-t border-[var(--border-hairline)]" />
            <Suspense fallback={<AuthSkeleton />}>
              <HeaderAuthSection variant="menu" />
            </Suspense>
            <div className="mx-3 my-1.5 border-t border-[var(--border-hairline)]" />
            <div className="flex items-center justify-between gap-2 px-3 py-1">
              <span className="text-[13px] text-ink-muted">화면 모드</span>
              <ThemeToggle />
            </div>
          </div>
        </HeaderMobileMenu>
      </div>
    </header>
  );
}
