import "server-only";
import { notFound } from "next/navigation";
import { getModule } from "@/content/course";
import { requireUser } from "./dal";
import { getLearningRecord } from "./learningStore";
import { moduleStatus } from "./study";

/** 모듈 하위 화면 공통: 로그인 확인 → 모듈 조회 → 내 학습 기록과 진행 상태 계산 */
export async function loadModulePage(slug: string, from: string) {
  const user = await requireUser(from);
  const mod = getModule(slug);
  if (!mod) notFound();
  const record = getLearningRecord(user.id);
  const status = moduleStatus(mod, record);
  return { user, module: mod, record, status, isAdmin: user.role === "admin" };
}
