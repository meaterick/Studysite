import type { CSSProperties } from "react";
import type { ReviewStatus } from "@/lib/learningStore";

const REVIEW: Record<ReviewStatus | "none", { label: string; color: string }> = {
  correct: { label: "핵심 요소 포함", color: "var(--status-good)" },
  incorrect: { label: "보완 필요", color: "var(--status-critical)" },
  none: { label: "자기 평가 전", color: "var(--text-muted)" },
};

/** 운영자 화면: 스터디원이 서술형 답(백지 복습 문항 포함)에 남긴 자기평가 */
export default function ReviewPill({ review }: { review?: ReviewStatus }) {
  const { label, color } = REVIEW[review ?? "none"];
  return (
    <span className="pill" style={{ "--pill": color } as CSSProperties}>
      {label}
    </span>
  );
}
