import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import ThemeToggle from "./ThemeToggle";
import HeaderAuthSection from "./HeaderAuthSection";
import HeaderMobileMenu from "./HeaderMobileMenu";

const NAV = [
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/weeks", label: "주차별 자료" },
  { href: "/progress", label: "내 진도" },
];

function AuthSkeleton() {
  return (
    <span
      aria-hidden
      className="h-8 w-16 animate-pulse rounded-md bg-[var(--surface-card-2)]"
    />
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Image
            src="/images/aegis-mark.svg"
            alt="Aegis AI 스터디"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="text-xs font-bold leading-tight sm:text-base">
            Aegis AI 스터디
            <span className="hidden text-[11px] font-medium text-ink-muted sm:block">
              기초부터 활용까지
            </span>
          </span>
        </Link>
        {/* md 이상: 한 줄 가로 네비게이션. 이 너비부터는 항목이 전부 잘리지 않고 들어간다. */}
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Suspense fallback={<AuthSkeleton />}>
            <HeaderAuthSection />
          </Suspense>
          <ThemeToggle />
        </nav>

        {/* md 미만: 항목을 한 줄에 다 넣으면 오른쪽 정렬+가로 스크롤 조합 때문에
            앞쪽 항목(커리큘럼 등)이 스크롤 없이는 안 보여 "잘린" 것처럼 보이는
            문제가 있었다. 좁은 화면에서는 햄버거 메뉴 뒤로 감춰 전부 보이게 한다. */}
        <HeaderMobileMenu>
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-1 border-t border-[var(--border-hairline)]" />
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap items-center gap-1">
                <Suspense fallback={<AuthSkeleton />}>
                  <HeaderAuthSection />
                </Suspense>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </HeaderMobileMenu>
      </div>
    </header>
  );
}
