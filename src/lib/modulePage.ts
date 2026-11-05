import "server-only";
import { notFound } from "next/navigation";
import { getModule } from "@/content/course";
import { requireUser } from "./dal";
import { getLearningRecord } from "./learningStore";
import { findUserSubmission } from "./submissionStore";
import { moduleStatus } from "./study";

/** 모듈 하위 화면 공통: 로그인 확인 → 모듈 조회 → 내 학습 기록·제출물·진행 상태 계산 */
export async function loadModulePage(slug: string, from: string) {
  const user = await requireUser(from);
  const mod = getModule(slug);
  if (!mod) notFound();
  const record = getLearningRecord(user.id);
  const submission = mod.assignment ? findUserSubmission(user.id, mod.assignment.key) : undefined;
  const status = moduleStatus(mod, record, submission);
  return { user, module: mod, record, submission, status, isAdmin: user.role === "admin" };
}
