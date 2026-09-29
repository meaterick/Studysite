import Link from "next/link";

/**
 * warn 모드의 미완료 경고. 앞 단계를 끝내지 않고 넘어왔을 때 보여 주되, 막지는 않는다.
 * items: 끝내지 않은 단계 목록(번호·제목·링크)
 */
export default function UnfinishedWarning({
  items,
  context,
}: {
  items: { number: number; title: string; href: string }[];
  /** 경고 문장 앞부분 */
  context: string;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 3);
  return (
    <div
      role="note"
      className="mb-6 rounded-xl border-l-4 border-[var(--status-warning)] bg-[color-mix(in_srgb,var(--status-warning)_12%,transparent)] px-4 py-3 text-sm text-ink-secondary"
    >
      <p className="font-bold text-ink">
        ⚠ {context} 아직 끝내지 않은 단계가 {items.length}개 있습니다.
      </p>
      <p className="mt-1">
        순서대로 학습하면 훨씬 수월합니다. 그대로 진행해도 되지만, 먼저 확인해 보십시오:{" "}
        {shown.map((it, i) => (
          <span key={it.href}>
            {i > 0 && ", "}
            <Link href={it.href} className="font-bold text-[var(--series-blue)] hover:underline">
              {it.number}단계 {it.title}
            </Link>
          </span>
        ))}
        {items.length > shown.length && ` 외 ${items.length - shown.length}개`}
      </p>
    </div>
  );
}
