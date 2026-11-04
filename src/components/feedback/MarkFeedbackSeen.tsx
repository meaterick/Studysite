"use client";

import { useEffect } from "react";
import { markAssignmentGradesSeen, markFeedbackSeen } from "@/lib/feedbackActions";

/**
 * 피드백(채점 결과)이 화면에 뜨면 "확인함"으로 기록한다. 이번 방문에는 새 표시가 그대로 보이고,
 * 헤더 배지는 기록 직후 사라진다(렌더링 중에 기록을 바꾸지 않도록 화면이 뜬 뒤에 호출한다).
 * slug가 있으면 그 주차 과제 화면에서 본 채점만, 없으면(피드백함) 전부 확인한 것으로 기록한다.
 */
export default function MarkFeedbackSeen({ hasNew, slug }: { hasNew: boolean; slug?: string }) {
  useEffect(() => {
    if (!hasNew) return;
    const run = slug ? markAssignmentGradesSeen(slug) : markFeedbackSeen();
    void run.catch(() => undefined);
  }, [hasNew, slug]);
  return null;
}
