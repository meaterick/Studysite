"use server";

import { refresh } from "next/cache";
import { requireUser } from "./dal";
import { updateLearningRecord } from "./learningStore";
import { findUserSubmission } from "./submissionStore";
import { gradeKey } from "./feedback";

// refresh(): 헤더(피드백함 배지)는 루트 레이아웃에 있어 페이지를 옮겨 다녀도 다시 그려지지 않는다.
// 확인 기록을 바꾼 뒤 화면을 새로 받아 오게 해 배지가 바로 사라지게 한다.

/** 피드백함을 열어 봤음을 기록한다. 이 시각 이후의 채점만 "새 피드백"으로 표시된다. */
export async function markFeedbackSeen(): Promise<void> {
  const user = await requireUser("/feedback");
  await updateLearningRecord(user.id, (record) => {
    record.feedbackSeenAt = new Date().toISOString();
    // 이 시각 이전 것은 모두 확인한 셈이므로 개별 기록은 더 필요 없다.
    delete record.seenGrades;
  });
  refresh();
}

/** 과제 화면에서 그 주차의 채점 결과를 확인했음을 기록한다. */
export async function markAssignmentGradesSeen(slug: string): Promise<void> {
  const user = await requireUser(`/weeks/${slug}/assignment`);
  const submission = findUserSubmission(user.id, slug);
  if (!submission || submission.grades.length === 0) return;
  await updateLearningRecord(user.id, (record) => {
    const seenAt = record.feedbackSeenAt ?? "";
    const pending = submission.grades.filter((g) => g.gradedAt > seenAt).map((g) => gradeKey(submission.id, g.gradedAt));
    record.seenGrades = Array.from(new Set([...(record.seenGrades ?? []), ...pending])).slice(-200);
  });
  refresh();
}
