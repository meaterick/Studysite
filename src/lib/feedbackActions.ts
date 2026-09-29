"use server";

import { requireUser } from "./dal";
import { updateLearningRecord } from "./learningStore";

/** 피드백함을 열어 봤음을 기록한다. 이 시각 이후의 채점만 "새 피드백"으로 표시된다. */
export async function markFeedbackSeen(): Promise<void> {
  const user = await requireUser("/feedback");
  await updateLearningRecord(user.id, (record) => {
    record.feedbackSeenAt = new Date().toISOString();
  });
}
