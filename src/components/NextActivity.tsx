import Link from "next/link";
import Icon from "./Icon";

/** 적용과 복습 활동 끝의 "다음 활동" 링크 */
export default function NextActivity({ slug, href, label }: { slug: string; href: string; label: string }) {
  return (
    <Link
      href={href.startsWith("/") ? href : `/weeks/${slug}/${href}`}
      className="group flex items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-6"
    >
      <span>
        <span className="kicker block">Next</span>
        <span className="mt-1 block text-lg font-semibold tracking-[-0.02em] text-ink">{label}</span>
      </span>
      <Icon name="arrowRight" size={20} className="text-ink-muted transition group-hover:translate-x-1 group-hover:text-ink" />
    </Link>
  );
}
