"use client";

import { useEffect } from "react";
import { markFeedbackSeen } from "@/lib/feedbackActions";

/**
 * 피드백함이 화면에 뜨면 "확인함"으로 기록한다. 이번 방문에는 새 표시가 그대로 보이고,
 * 다음 방문부터 사라진다(렌더링 중에 기록을 바꾸지 않도록 화면이 뜬 뒤에 호출한다).
 */
export default function MarkFeedbackSeen({ hasNew }: { hasNew: boolean }) {
  useEffect(() => {
    if (hasNew) void markFeedbackSeen().catch(() => undefined);
  }, [hasNew]);
  return null;
}
