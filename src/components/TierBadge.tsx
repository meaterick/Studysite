import { TIER_INFO, type Tier } from "@/content/tiers";

/** "핵심 · 초심자" 배지. compact면 "핵심"만 보여 준다. 마우스를 올리면 설명이 나온다. */
export default function TierBadge({ tier, compact = false }: { tier: Tier; compact?: boolean }) {
  const info = TIER_INFO[tier];
  return (
    <span
      title={info.summary}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ color: info.color, background: `color-mix(in srgb, ${info.color} 12%, transparent)` }}
    >
      {info.label}
      {!compact && <span className="font-medium opacity-80">· {info.audience}</span>}
      <span className="sr-only"> — {info.summary}</span>
    </span>
  );
}
