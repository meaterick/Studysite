import "server-only";
import { notFound } from "next/navigation";
import { getWeek } from "@/content/weeks";
import { requireUser } from "./dal";
import { getLearningRecord } from "./learningStore";
import { findUserSubmission } from "./submissionStore";
import { weekStatus } from "./study";

/** 주차 하위 페이지 공통: 로그인 확인 → 주차 조회 → 내 학습 기록·제출물·진행 상태 계산 */
export async function loadWeekPage(slug: string, from: string) {
  const user = await requireUser(from);
  const week = getWeek(slug);
  if (!week) notFound();
  const record = getLearningRecord(user.id);
  const submission = findUserSubmission(user.id, slug);
  const status = weekStatus(week, record, submission);
  return { user, week, record, submission, status, isAdmin: user.role === "admin" };
}
