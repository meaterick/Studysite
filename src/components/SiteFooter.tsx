import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-hairline)] py-8 text-center text-xs text-ink-muted">
      <p>Aegis 동아리 AI 스터디 자료 · 비영리 교육용</p>
      <p className="mt-1">외부 강의, 논문, 책을 참고하고 인용했어요. 출처는 각 본문에 적어 두었어요.</p>
      <Link href="/privacy" className="mt-3 inline-block font-semibold text-ink-secondary hover:text-[var(--series-blue)] hover:underline">
        개인정보처리방침
      </Link>
    </footer>
  );
}
