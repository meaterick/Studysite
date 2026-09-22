import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import ThemeToggle from "./ThemeToggle";
import HeaderAuthSection from "./HeaderAuthSection";

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
            src="/images/aegis-oauth-logo.png"
            alt="Aegis AI 스터디"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
            priority
          />
          <span className="text-xs font-bold leading-tight sm:text-base">
            Aegis AI 스터디
            <span className="hidden text-[11px] font-medium text-ink-muted sm:block">
              기초부터 활용까지
            </span>
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto text-xs [scrollbar-width:none] sm:gap-1 sm:text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <Suspense fallback={<AuthSkeleton />}>
            <HeaderAuthSection />
          </Suspense>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
