import Link from "next/link";
import type { ApplyKey, ApplySummary } from "@/lib/applyView";
import Icon from "./Icon";

/**
 * 적용과 복습의 하위 메뉴: 한눈에 보기 | 기본 흐름(백지공부·과제) | 선택 과정(서술형·코딩 실습·추가 퀴즈).
 * 무리를 얇은 세로선으로만 나눈다.
 */
export default function ApplyNav({ slug, summary, active }: { slug: string; summary: ApplySummary; active: ApplyKey | "hub" }) {
  const path = summary.items.filter((i) => i.onPath);
  const optional = summary.items.filter((i) => !i.onPath);
  const divider = <span aria-hidden="true" className="mx-1.5 my-2 w-px shrink-0 bg-[var(--border-hairline)]" />;
  const chip = (item: ApplySummary["items"][number]) => (
    <Link key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} className="chip">
      {item.locked && <Icon name="lock" size={13} />}
      {item.label}
      {item.complete && (
        <span className={active === item.key ? "" : "text-[var(--status-good)]"}>
          <Icon name="check" size={14} />
          <span className="sr-only">(완료)</span>
        </span>
      )}
      {item.locked && <span className="sr-only">(잠김)</span>}
    </Link>
  );
  return (
    <nav aria-label="적용과 복습 활동" className="-mx-4 mt-5 flex overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 print:hidden">
      <Link href={`/weeks/${slug}/apply`} aria-current={active === "hub" ? "page" : undefined} className="chip">
        한눈에 보기
      </Link>
      {divider}
      {path.map(chip)}
      {divider}
      {optional.map(chip)}
    </nav>
  );
}
