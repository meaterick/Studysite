import Link from "next/link";

const LINKS = [
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/weeks", label: "주차별 자료" },
  { href: "/privacy", label: "개인정보처리방침" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] text-xs text-ink-muted print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-bold text-ink-secondary">Aegis 동아리 AI 스터디 · 비영리 교육용</p>
          <p>외부 강의, 논문, 도서를 참고하고 인용했으며, 출처는 각 본문에 밝혀 두었습니다.</p>
        </div>
        <nav aria-label="바닥글" className="flex flex-wrap gap-x-1 gap-y-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2 py-1 font-semibold transition hover:bg-[var(--surface-card-2)] hover:text-ink ${
                l.href === "/privacy" ? "text-ink-secondary" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
