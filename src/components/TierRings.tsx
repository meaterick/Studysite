import { TIER_INFO, TIER_ORDER, type Tier } from "@/content/tiers";

/** 학습 자료의 핵심·보충·심화 진행을 겹친 원 3개로 보여 준다(바깥부터 핵심 → 보충 → 심화). */
export default function TierRings({ counts, size = 96 }: { counts: Record<Tier, { done: number; total: number }>; size?: number }) {
  const stroke = Math.max(4, size * 0.09);
  const gap = stroke * 0.35;
  const label = TIER_ORDER.map((t) => `${TIER_INFO[t].label} ${counts[t].done}/${counts[t].total}`).join(", ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={label}>
      {TIER_ORDER.map((tier, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + gap);
        const c = 2 * Math.PI * r;
        const { done, total } = counts[tier];
        const ratio = total === 0 ? 0 : done / total;
        const color = TIER_INFO[tier].color;
        return (
          <g key={tier}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`color-mix(in srgb, ${color} 14%, transparent)`} strokeWidth={stroke} />
            {ratio > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={c}
                strokeDashoffset={c * (1 - ratio)}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
