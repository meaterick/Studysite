"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getWeek } from "@/content/weeks";
import { getSection, getWeekOutline } from "@/content/sections";
import { requireUser } from "./dal";
import {
  ensureSectionState,
  getLearningRecord,
  readWorksheetState,
  updateLearningRecord,
  type QuizReviewStatus,
  type WorksheetMark,
} from "./learningStore";
import {
  fileExtension,
  saveSubmission,
  SUBMISSION_LIMITS,
  type IncomingFile,
} from "./submissionStore";
import { canOpenSection, sectionProgress, weekStatus } from "./study";

// 모든 액션은 브라우저에서 임의로 호출될 수 있으므로, 화면에서 이미 막았더라도
// 여기서 로그인·단계 잠금·입력값을 다시 검증한다.

const ANSWER_MAX = 4000;

async function loadSectionContext(slug: string, sectionId: string) {
  const user = await requireUser(`/weeks/${slug}`);
  const week = getWeek(slug);
  const section = week ? getSection(week, sectionId) : undefined;
  if (!week || !section) throw new Error("NOT_FOUND");
  const record = getLearningRecord(user.id);
  const status = weekStatus(week, record);
  if (!canOpenSection(status, sectionId, user.role === "admin")) throw new Error("SECTION_LOCKED");
  return { user, week, section };
}

export async function answerCheck(
  slug: string,
  sectionId: string,
  checkId: string,
  choice: number
): Promise<{ correct: boolean }> {
  const { user, section } = await loadSectionContext(slug, sectionId);
  const check = section.meta.checks.find((c) => c.id === checkId);
  if (!check || !Number.isInteger(choice) || choice < 0 || choice >= check.choices.length) {
    throw new Error("INVALID_CHOICE");
  }
  const correct = choice === check.answer;
  await updateLearningRecord(user.id, (record) => {
    const state = ensureSectionState(record, slug, sectionId);
    state.startedAt ??= new Date().toISOString();
    const prev = state.checks[checkId] ?? { correct: false, attempts: 0, wrong: [] };
    if (prev.correct) return;
    state.checks[checkId] = {
      correct,
      attempts: prev.attempts + 1,
      wrong: correct || prev.wrong.includes(choice) ? prev.wrong : [...prev.wrong, choice],
    };
  });
  refresh();
  return { correct };
}

export async function saveQuizAnswer(slug: string, sectionId: string, quizId: string, text: string) {
  const { user, section } = await loadSectionContext(slug, sectionId);
  if (!section.meta.quizIds.includes(quizId)) throw new Error("INVALID_QUESTION");
  const trimmed = String(text ?? "").trim().slice(0, ANSWER_MAX);
  if (!trimmed) return { ok: false as const, error: "답을 먼저 적어주세요." };
  await updateLearningRecord(user.id, (record) => {
    const state = ensureSectionState(record, slug, sectionId);
    state.startedAt ??= new Date().toISOString();
    const prev = state.answers[quizId];
    state.answers[quizId] = { text: trimmed, answeredAt: new Date().toISOString(), review: prev?.review };
  });
  refresh();
  return { ok: true as const };
}

export async function reviewQuizAnswer(slug: string, sectionId: string, quizId: string, review: QuizReviewStatus) {
  const { user, section } = await loadSectionContext(slug, sectionId);
  if (!section.meta.quizIds.includes(quizId) || (review !== "correct" && review !== "incorrect")) {
    throw new Error("INVALID_REVIEW");
  }
  await updateLearningRecord(user.id, (record) => {
    const state = ensureSectionState(record, slug, sectionId);
    const answer = state.answers[quizId];
    if (answer) answer.review = review;
  });
  refresh();
}

export async function completeSection(slug: string, sectionId: string) {
  const { user, week, section } = await loadSectionContext(slug, sectionId);
  const record = getLearningRecord(user.id);
  const state = ensureSectionState(record, slug, sectionId);
  if (!sectionProgress(section, state).ready) {
    return { ok: false as const, error: "확인 문제와 서술형 문항을 모두 마친 뒤에 단계를 완료할 수 있습니다." };
  }
  await updateLearningRecord(user.id, (r) => {
    const s = ensureSectionState(r, slug, sectionId);
    s.completedAt ??= new Date().toISOString();
  });
  const { sections } = getWeekOutline(week);
  const next = sections[section.number]; // number는 1부터 시작하므로 다음 단계의 인덱스와 같다
  redirect(next ? `/weeks/${slug}/sections/${next.id}` : `/weeks/${slug}?finished=1`);
}

// ─── 백지공부 ───────────────────────────────────────────────────────────

async function loadFinaleContext(slug: string) {
  const user = await requireUser(`/weeks/${slug}`);
  const week = getWeek(slug);
  if (!week) throw new Error("NOT_FOUND");
  const status = weekStatus(week, getLearningRecord(user.id));
  if (!status.allSectionsDone && user.role !== "admin") throw new Error("SECTIONS_NOT_DONE");
  return { user, week };
}

export async function saveWorksheet(slug: string, answers: Record<string, string>, submit: boolean) {
  const { user, week } = await loadFinaleContext(slug);
  const clean: Record<string, string> = {};
  week.worksheet.forEach((_, index) => {
    clean[String(index)] = String(answers?.[String(index)] ?? "").slice(0, ANSWER_MAX);
  });
  if (submit && Object.values(clean).some((v) => !v.trim())) {
    return { ok: false as const, error: "모든 칸을 채운 뒤 제출해주세요. 기억나지 않으면 '모르겠다'고 적는 것도 좋은 기록입니다." };
  }
  await updateLearningRecord(user.id, (record) => {
    const prev = readWorksheetState(record, slug);
    const now = new Date().toISOString();
    record.worksheets[slug] = {
      ...prev,
      answers: clean,
      savedAt: now,
      submittedAt: submit ? prev.submittedAt ?? now : prev.submittedAt,
    };
  });
  refresh();
  return { ok: true as const };
}

export async function markWorksheetField(slug: string, field: string, mark: WorksheetMark) {
  const { user, week } = await loadFinaleContext(slug);
  const index = Number(field);
  if (!Number.isInteger(index) || index < 0 || index >= week.worksheet.length || (mark !== "ok" && mark !== "weak")) {
    throw new Error("INVALID_MARK");
  }
  await updateLearningRecord(user.id, (record) => {
    const prev = readWorksheetState(record, slug);
    record.worksheets[slug] = { ...prev, marks: { ...prev.marks, [String(index)]: mark } };
  });
  refresh();
}

// ─── 과제 제출 ──────────────────────────────────────────────────────────

export type SubmitAssignmentResult = { ok: true } | { ok: false; error: string };

export async function submitAssignment(slug: string, formData: FormData): Promise<SubmitAssignmentResult> {
  const { user } = await loadFinaleContext(slug);

  const text = String(formData.get("text") ?? "").trim();
  if (text.length > SUBMISSION_LIMITS.textMax) {
    return { ok: false, error: `본문은 ${SUBMISSION_LIMITS.textMax.toLocaleString()}자 이내로 작성해주세요.` };
  }

  const links = String(formData.get("links") ?? "")
    .split(/\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (links.length > SUBMISSION_LIMITS.linksMax) {
    return { ok: false, error: `링크는 최대 ${SUBMISSION_LIMITS.linksMax}개까지 첨부할 수 있습니다.` };
  }
  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      return { ok: false, error: `올바른 링크가 아닙니다: ${link.slice(0, 80)}` };
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "링크는 http(s) 주소만 첨부할 수 있습니다." };
    }
  }

  const rawFiles = formData.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f && f.size > 0);
  if (rawFiles.length > SUBMISSION_LIMITS.filesMax) {
    return { ok: false, error: `파일은 최대 ${SUBMISSION_LIMITS.filesMax}개까지 첨부할 수 있습니다.` };
  }
  let total = 0;
  const files: IncomingFile[] = [];
  for (const file of rawFiles) {
    const ext = fileExtension(file.name);
    if (!(SUBMISSION_LIMITS.extensions as readonly string[]).includes(ext)) {
      return { ok: false, error: `허용하지 않는 파일 형식입니다: ${file.name} (${SUBMISSION_LIMITS.extensions.join(", ")})` };
    }
    if (file.size > SUBMISSION_LIMITS.fileBytesMax) {
      return { ok: false, error: `파일 하나는 5MB 이하여야 합니다: ${file.name}` };
    }
    total += file.size;
    files.push({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
  }
  if (total > SUBMISSION_LIMITS.totalBytesMax) {
    return { ok: false, error: "첨부 파일 합계가 9MB를 넘습니다. 큰 파일은 드라이브·GitHub 링크로 제출해주세요." };
  }

  if (!text && links.length === 0 && files.length === 0) {
    return { ok: false, error: "리포트 본문, 링크, 파일 중 하나 이상을 제출해주세요." };
  }

  // 다시 제출하면 새 버전이 쌓인다. 이전 버전(첨부 파일 포함)은 기록에 남아 운영자가 볼 수 있다.
  await saveSubmission({ userId: user.id, weekSlug: slug, text, links, files });
  refresh();
  return { ok: true };
}
