import Link from "next/link";

// 스터디원 관리의 두 화면: 사람별로 보는 목록과, 서술형 답을 문항별로 모아 보는 화면.
const TABS = [
  { key: "list", href: "/operator/members", label: "스터디원 목록" },
  { key: "answers", href: "/operator/members/answers", label: "서술형 응답 모아 보기" },
] as const;

export default function MembersTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="스터디원 관리" className="mb-8 flex flex-wrap gap-1">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? "page" : undefined} className="chip border border-[var(--border-hairline)]">
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
