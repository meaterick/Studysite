"use server";

import { moduleOfAssignment } from "@/content/course";
import { requireUser } from "./dal";
import { getLearningRecord } from "./learningStore";
import { moduleStatus } from "./study";
import { assignmentHref } from "./routes";
import { readDraft, writeDraft } from "./assignmentDraftStore";
import { applyDraftPatch, sanitizeDraft } from "./notebook";
import { consumeRate, RATE_LIMIT_MESSAGE, RATE_RULES } from "./rateLimit";
import { DISK_FULL_MESSAGE, hasDiskSpaceFor } from "./diskGuard";

// 개인 과제 작업 공간 저장 액션. 모든 액션은 브라우저에서 임의로 호출될 수 있으므로
// 로그인, 과제 열림 여부(lock 모드에서는 모듈의 핵심 레슨 완료), 입력값을 여기서 다시 검증한다.
// key는 과제 저장 키(AssignmentSource.key)다.

async function loadAssignmentContext(key: string) {
  const mod = moduleOfAssignment(key);
  if (!mod?.assignment) throw new Error("NOT_FOUND");
  const user = await requireUser(assignmentHref(mod.slug));
  const status = moduleStatus(mod, getLearningRecord(user.id));
  if (!status.finaleOpen && user.role !== "admin") throw new Error("LESSONS_NOT_DONE");
  return { user, spec: mod.assignment };
}

/** stale: 변경분 저장에서 서버 초안이 기준과 달라 합칠 수 없음(클라이언트가 전체 저장으로 다시 보낸다) */
export type ActionResult = { ok: true; savedAt?: string } | { ok: false; error: string; stale?: boolean };

/** 초안을 명세 기준으로 정리해 저장한다(전체 저장·변경분 저장 공통). */
async function persistDraft(userId: string, key: string, spec: Parameters<typeof sanitizeDraft>[0], raw: unknown): Promise<ActionResult> {
  const clean = sanitizeDraft(spec, raw);
  if (!clean) {
    return { ok: false, error: "작업 내용이 너무 커서 저장하지 못했습니다. 그림이나 출력이 많은 셀을 정리해 주십시오." };
  }
  if (!hasDiskSpaceFor(JSON.stringify(clean).length)) return { ok: false, error: DISK_FULL_MESSAGE };
  await writeDraft(userId, key, clean);
  return { ok: true, savedAt: clean.updatedAt };
}

/** 작업 공간 전체 저장. 클라이언트가 보낸 초안은 명세 기준으로 정리한 뒤 저장한다. */
export async function saveAssignmentDraft(key: string, draft: unknown): Promise<ActionResult> {
  const { user, spec } = await loadAssignmentContext(key);
  if (!consumeRate(`draft:${user.id}`, RATE_RULES.draftSave)) return { ok: false, error: RATE_LIMIT_MESSAGE };
  return persistDraft(user.id, key, spec, draft);
}

/**
 * 작업 공간 자동 저장(변경분). 바뀐 셀만 받아 서버 초안에 합친 뒤 전체 저장과 똑같이 검증해 저장한다.
 * 서버 초안이 변경분의 기준(base)과 다르면(다른 탭에서 저장 등) 합치지 않고 stale을 돌려준다.
 */
export async function saveAssignmentDraftPatch(key: string, patch: unknown): Promise<ActionResult> {
  const { user, spec } = await loadAssignmentContext(key);
  if (!consumeRate(`draft:${user.id}`, RATE_RULES.draftSave)) return { ok: false, error: RATE_LIMIT_MESSAGE };
  const { base, tasks } = (patch && typeof patch === "object" ? patch : {}) as { base?: unknown; tasks?: unknown };
  const stored = readDraft(user.id, key);
  const merged = stored && typeof base === "string" && stored.updatedAt === base ? applyDraftPatch(stored, tasks) : null;
  if (!merged) return { ok: false, error: "초안을 다시 저장해야 합니다.", stale: true };
  return persistDraft(user.id, key, spec, merged);
}
