import type { CSSProperties } from "react";
import type { QuizReviewStatus } from "@/lib/learningStore";

const REVIEW: Record<QuizReviewStatus | "none", { label: string; color: string }> = {
  correct: { label: "핵심을 썼음", color: "var(--status-good)" },
  incorrect: { label: "보완 필요", color: "var(--status-critical)" },
  none: { label: "자기평가 전", color: "var(--text-muted)" },
};

/** 운영자 화면: 스터디원이 서술형 답(백지공부 칸 포함)에 남긴 자기평가 */
export default function ReviewPill({ review }: { review?: QuizReviewStatus }) {
  const { label, color } = REVIEW[review ?? "none"];
  return (
    <span className="pill" style={{ "--pill": color } as CSSProperties}>
      {label}
    </span>
  );
}
