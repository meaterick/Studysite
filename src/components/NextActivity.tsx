import Link from "next/link";

/** 적용과 복습 활동 끝의 "다음 활동" 안내 */
export default function NextActivity({ slug, href, label, desc }: { slug: string; href: string; label: string; desc: string }) {
  return (
    <Link
      href={href.startsWith("/") ? href : `/weeks/${slug}/${href}`}
      className="flex items-center justify-between gap-4 surface p-4 transition hover:border-[var(--series-blue)]"
    >
      <span>
        <span className="block text-xs font-bold text-ink-muted">다음 활동</span>
        <span className="block font-black text-ink">{label}</span>
        <span className="block text-sm text-ink-muted">{desc}</span>
      </span>
      <span aria-hidden="true" className="text-lg font-black text-[var(--series-blue)]">
        →
      </span>
    </Link>
  );
}
