import { difficultyInfo } from "@/lib/difficulty";

/** "난이도 · 어려움" 배지. 마우스를 올리면(또는 스크린리더) 무슨 뜻인지 설명한다. */
export default function DifficultyBadge({ level, compact = false }: { level: number; compact?: boolean }) {
  const d = difficultyInfo(level);
  return (
    <span
      title={d.desc}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ color: d.color, background: `color-mix(in srgb, ${d.color} 12%, transparent)` }}
    >
      {!compact && <span className="font-medium opacity-80">난이도</span>}
      {d.label}
      <span className="sr-only"> — {d.desc}</span>
    </span>
  );
}
