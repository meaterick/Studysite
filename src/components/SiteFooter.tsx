import Link from "next/link";

const LINKS = [
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/weeks", label: "주차별 자료" },
  { href: "/privacy", label: "개인정보처리방침" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Aegis AI 스터디 · 비영리 교육용 · 인용 출처는 각 본문에 표기</p>
        <nav aria-label="바닥글" className="flex flex-wrap gap-x-5 gap-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
