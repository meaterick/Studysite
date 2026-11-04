import { difficultyInfo } from "@/lib/difficulty";

/** 난이도: 색 대신 막대 세 개(쉬움 1 · 보통 2 · 어려움 3)로 조용히 보여 준다. 마우스를 올리면(또는 스크린리더) 무슨 뜻인지 설명한다. */
export default function DifficultyBadge({ level, compact = false }: { level: number; compact?: boolean }) {
  const d = difficultyInfo(level);
  const bars = level <= 3 ? 1 : level === 4 ? 2 : 3;
  return (
    <span title={d.desc} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-secondary">
      <span aria-hidden="true" className="inline-flex items-end gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{ height: 5 + i * 3, background: i < bars ? "currentColor" : "var(--border-strong)" }}
          />
        ))}
      </span>
      {!compact && <span className="text-ink-muted">난이도</span>}
      {d.label}
      <span className="sr-only"> — {d.desc}</span>
    </span>
  );
}
