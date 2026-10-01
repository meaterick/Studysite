"use server";

import { refresh } from "next/cache";
import { getWeek } from "@/content/weeks";
import { requireAdmin, requireUser } from "./dal";
import { getLearningRecord } from "./learningStore";
import { weekStatus } from "./study";
import { readDraft, writeDraft } from "./assignmentDraftStore";
import { mergeDraft, missingRequiredAnswers, sanitizeDraft } from "./notebook";
import { consumeRate, RATE_LIMIT_MESSAGE, RATE_RULES } from "./rateLimit";
import { DISK_FULL_MESSAGE, hasDiskSpaceFor } from "./diskGuard";
import {
  fileExtension,
  findSubmission,
  findUserSubmission,
  gradeSubmission,
  listUserSubmissions,
  saveSubmission,
  SUBMISSION_LIMITS,
  type IncomingFile,
} from "./submissionStore";

// 과제 작업 공간·제출·채점 액션. 모든 액션은 브라우저에서 임의로 호출될 수 있으므로
// 로그인, 과제 열림 여부(핵심 단계 완료), 입력값을 여기서 다시 검증한다.

async function loadAssignmentContext(slug: string) {
  const user = await requireUser(`/weeks/${slug}/assignment`);
  const week = getWeek(slug);
  if (!week) throw new Error("NOT_FOUND");
  const status = weekStatus(week, getLearningRecord(user.id));
  if (!status.finaleOpen && user.role !== "admin") throw new Error("SECTIONS_NOT_DONE");
  return { user, week };
}

export type ActionResult = { ok: true; savedAt?: string } | { ok: false; error: string };

/** 작업 공간 자동 저장. 클라이언트가 보낸 초안은 명세 기준으로 정리한 뒤 저장한다. */
export async function saveAssignmentDraft(slug: string, draft: unknown): Promise<ActionResult> {
  const { user, week } = await loadAssignmentContext(slug);
  if (!consumeRate(`draft:${user.id}`, RATE_RULES.draftSave)) return { ok: false, error: RATE_LIMIT_MESSAGE };
  const clean = sanitizeDraft(week.assignment, draft);
  if (!clean) {
    return { ok: false, error: "작업 내용이 너무 커서 저장하지 못했습니다. 그림이나 출력이 많은 셀을 정리해 주십시오." };
  }
  if (!hasDiskSpaceFor(JSON.stringify(clean).length)) return { ok: false, error: DISK_FULL_MESSAGE };
  await writeDraft(user.id, slug, clean);
  return { ok: true, savedAt: clean.updatedAt };
}

/**
 * 과제 제출. 학습자가 보낸 화면 상태가 아니라 서버에 저장된 최신 초안을 제출본으로 삼는다
 * (클라이언트는 제출 직전에 초안을 먼저 저장한다). 메모·링크·첨부 파일은 선택 사항이다.
 */
export async function submitAssignmentWork(slug: string, formData: FormData): Promise<ActionResult> {
  const { user, week } = await loadAssignmentContext(slug);
  if (!consumeRate(`submit:${user.id}`, RATE_RULES.submission)) {
    return { ok: false, error: "제출이 너무 잦습니다. 1분쯤 뒤에 다시 제출해 주십시오." };
  }
  const existing = findUserSubmission(user.id, slug);
  if (existing && existing.versions.length >= SUBMISSION_LIMITS.versionsMax) {
    return {
      ok: false,
      error: `한 과제는 최대 ${SUBMISSION_LIMITS.versionsMax}번까지 제출할 수 있습니다. 더 제출해야 하면 운영자에게 문의해 주십시오.`,
    };
  }
  const draft = mergeDraft(week.assignment, readDraft(user.id, slug));

  const missing = missingRequiredAnswers(week.assignment, draft);
  if (missing.length > 0) {
    const first = missing[0];
    return {
      ok: false,
      error: `필수 답안 ${missing.length}개가 비어 있거나 너무 짧습니다. 예: [${first.task}] ${first.prompt.slice(0, 60)}`,
    };
  }

  const text = String(formData.get("text") ?? "").trim();
  if (text.length > SUBMISSION_LIMITS.textMax) {
    return { ok: false, error: `제출 메모는 ${SUBMISSION_LIMITS.textMax.toLocaleString()}자 이내로 작성해 주십시오.` };
  }

  const links = String(formData.get("links") ?? "")
    .split(/\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (links.length > SUBMISSION_LIMITS.linksMax) {
    return { ok: false, error: `참고 링크는 최대 ${SUBMISSION_LIMITS.linksMax}개까지 첨부할 수 있습니다.` };
  }
  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      return { ok: false, error: `올바른 주소가 아닙니다: ${link.slice(0, 80)}` };
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "링크는 http 또는 https 주소만 첨부할 수 있습니다." };
    }
  }

  const rawFiles = formData
    .getAll("files")
    .filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f && f.size > 0);
  if (rawFiles.length > SUBMISSION_LIMITS.filesMax) {
    return { ok: false, error: `파일은 최대 ${SUBMISSION_LIMITS.filesMax}개까지 첨부할 수 있습니다.` };
  }
  let total = 0;
  const files: IncomingFile[] = [];
  for (const file of rawFiles) {
    const ext = fileExtension(file.name);
    if (!(SUBMISSION_LIMITS.extensions as readonly string[]).includes(ext)) {
      return { ok: false, error: `허용하지 않는 파일 형식입니다: ${file.name}` };
    }
    if (file.size > SUBMISSION_LIMITS.fileBytesMax) {
      return { ok: false, error: `파일 하나의 크기는 5MB 이하여야 합니다: ${file.name}` };
    }
    total += file.size;
    files.push({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
  }
  if (total > SUBMISSION_LIMITS.totalBytesMax) {
    return { ok: false, error: "첨부 파일의 합계가 9MB를 넘습니다." };
  }
  // 계정 하나가 재제출을 반복해 서버 디스크를 채우지 못하도록 모든 과제의 첨부 파일 합계를 제한한다.
  const usedBytes = listUserSubmissions(user.id)
    .flatMap((s) => s.versions)
    .flatMap((v) => v.files)
    .reduce((sum, f) => sum + f.size, 0);
  if (usedBytes + total > SUBMISSION_LIMITS.userBytesMax) {
    return {
      ok: false,
      error: `지금까지 첨부한 파일이 ${Math.round(SUBMISSION_LIMITS.userBytesMax / 1024 / 1024)}MB 한도에 닿았습니다. 파일 대신 링크를 첨부하거나 운영자에게 문의해 주십시오.`,
    };
  }
  if (!hasDiskSpaceFor(total + JSON.stringify(draft).length)) return { ok: false, error: DISK_FULL_MESSAGE };

  await saveSubmission({ userId: user.id, weekSlug: slug, text, links, files, notebook: draft });
  refresh();
  return { ok: true };
}

export interface GradeInput {
  decision: "graded" | "revision";
  criteria: Record<string, number | null>;
  taskComments: Record<string, string>;
  feedback: string;
}

const FEEDBACK_MAX = 5000;
const TASK_COMMENT_MAX = 2000;

/** 운영자 채점. 채점 기준별 점수(0.5점 단위)를 합산해 총점을 만든다. */
export async function gradeAssignment(submissionId: string, input: GradeInput): Promise<ActionResult> {
  const admin = await requireAdmin("/operator/submissions");
  const submission = findSubmission(submissionId);
  if (!submission) return { ok: false, error: "제출물을 찾을 수 없습니다." };
  const week = getWeek(submission.weekSlug);
  if (!week) return { ok: false, error: "주차 정보를 찾을 수 없습니다." };

  const decision = input.decision === "revision" ? "revision" : "graded";
  const feedback = String(input.feedback ?? "").trim().slice(0, FEEDBACK_MAX);
  const criteria: Record<string, number> = {};
  if (decision === "graded") {
    for (const c of week.assignment.rubric) {
      const v = input.criteria?.[c.id];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > c.points || Math.round(v * 2) !== v * 2) {
        return { ok: false, error: `"${c.label}" 점수는 0~${c.points}점 사이에서 0.5점 단위로 입력해 주십시오.` };
      }
      criteria[c.id] = v;
    }
  } else if (!feedback) {
    return { ok: false, error: "재제출을 요청할 때는 보완할 내용을 피드백에 적어 주십시오." };
  }

  const taskIds = new Set(week.assignment.tasks.map((t) => t.id));
  const taskComments: Record<string, string> = {};
  for (const [taskId, comment] of Object.entries(input.taskComments ?? {})) {
    const clean = String(comment ?? "").trim().slice(0, TASK_COMMENT_MAX);
    if (taskIds.has(taskId) && clean) taskComments[taskId] = clean;
  }

  const score = decision === "graded" ? Object.values(criteria).reduce((a, b) => a + b, 0) : null;
  await gradeSubmission(submissionId, {
    decision,
    score,
    maxScore: week.assignmentMaxScore,
    criteria: decision === "graded" ? criteria : undefined,
    taskComments,
    feedback,
    gradedBy: admin.name,
  });
  refresh();
  return { ok: true };
}
