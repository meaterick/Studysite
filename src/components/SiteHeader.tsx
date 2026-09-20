import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { getCurrentUser } from "@/lib/dal";

const NAV = [
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/weeks", label: "주차별 자료" },
  { href: "/progress", label: "내 진도" },
];

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: "var(--series-blue)" }}
          >
            A
          </span>
          <span className="text-sm font-bold leading-tight sm:text-base">
            Aegis AI 스터디
            <span className="block text-[11px] font-medium text-ink-muted">
              기초부터 활용까지
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/operator"
              className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-[var(--series-orange)] transition hover:bg-[var(--surface-card-2)]"
            >
              운영자
            </Link>
          )}
          {user ? (
            <Link
              href="/account"
              className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
            >
              {user.name}님
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--series-blue)" }}
              >
                회원가입
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
