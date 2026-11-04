import Link from "next/link";
import Icon from "./Icon";

/**
 * warn 모드의 미완료 경고. 앞 단계를 끝내지 않고 넘어왔을 때 보여 주되, 막지는 않는다.
 * items: 끝내지 않은 핵심 단계 목록(이름표·제목·링크)
 */
export default function UnfinishedWarning({
  items,
  context,
}: {
  items: { label: string; title: string; href: string }[];
  /** 경고 문장 앞부분 */
  context: string;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 3);
  return (
    <div role="note" className="callout mb-8 flex gap-3 [--callout:var(--status-warning)]">
      <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-[var(--status-warning)]" />
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          {context} 끝내지 않은 핵심 단계가 {items.length}개 있습니다.
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {shown.map((it) => (
            <Link key={it.href} href={it.href} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
              {it.label}. {it.title}
            </Link>
          ))}
          {items.length > shown.length && <span>외 {items.length - shown.length}개</span>}
        </p>
      </div>
    </div>
  );
}
