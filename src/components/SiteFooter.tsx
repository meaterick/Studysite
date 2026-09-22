import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] py-8 text-center text-xs text-ink-muted">
      <p>Aegis 동아리 「AI 기초부터 활용까지」 스터디 · 학습·교육 목적 비영리 자료</p>
      <p className="mt-1">외부 강의·논문·서적을 참고·인용하여 구성했습니다 — 본문 안의 출처 표기를 확인하세요.</p>
      <Link href="/privacy" className="mt-3 inline-block font-semibold text-ink-secondary hover:text-[var(--series-blue)] hover:underline">
        개인정보처리방침
      </Link>
    </footer>
  );
}
