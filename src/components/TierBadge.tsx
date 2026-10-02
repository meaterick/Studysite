import { TIER_INFO, type Tier } from "@/content/tiers";

/** "● 핵심 · 초심자". compact면 "● 핵심"만 보여 준다. 색은 작은 점에만 쓴다. 마우스를 올리면 설명이 나온다. */
export default function TierBadge({ tier, compact = false }: { tier: Tier; compact?: boolean }) {
  const info = TIER_INFO[tier];
  return (
    <span title={info.summary} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-secondary">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: info.color }} />
      {info.label}
      {!compact && <span className="text-ink-muted">· {info.audience}</span>}
      <span className="sr-only"> — {info.summary}</span>
    </span>
  );
}
