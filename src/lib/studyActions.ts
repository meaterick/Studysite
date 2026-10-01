"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getWeek } from "@/content/weeks";
import { getSection, nextSectionAfter } from "@/content/sections";
import { requireUser } from "./dal";
import { consumeRate, RateLimitError, RATE_LIMIT_MESSAGE, RATE_RULES, type RateRule } from "./rateLimit";
import {
  ensureSectionState,
  getLearningRecord,
  readWorksheetState,
  updateLearningRecord,
  type QuizReviewStatus,
  type WorksheetMark,
} from "./learningStore";
import { canOpenSection, sectionProgress, weekStatus } from "./study";

// 모든 액션은 브라우저에서 임의로 호출될 수 있으므로, 화면에서 이미 막았더라도
// 여기서 로그인·단계 잠금·입력값을 다시 검증한다.

const ANSWER_MAX = 4000;

/** 자동화로 진도 파일 전체를 계속 다시 쓰게 만드는 것을 막는다. 넘으면 예외(화면에는 일반 오류로 표시). */
function limit(userId: string, name: string, rule: RateRule) {
  if (!consumeRate(`${name}:${userId}`, rule)) throw new RateLimitError();
}

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
  limit(user.id, "check", RATE_RULES.checkAnswer);
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
  if (!consumeRate(`learn:${user.id}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  if (!section.meta.quizIds.includes(quizId)) throw new Error("INVALID_QUESTION");
  const trimmed = String(text ?? "").trim().slice(0, ANSWER_MAX);
  if (!trimmed) return { ok: false as const, error: "답안을 먼저 작성해 주십시오." };
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
  limit(user.id, "learn", RATE_RULES.learningWrite);
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

/** 실습을 마쳤다고 표시하거나 취소한다(완료 조건이 아니라 실습 완료율 기록용). */
export async function markPracticeDone(slug: string, sectionId: string, done: boolean) {
  const { user, section } = await loadSectionContext(slug, sectionId);
  limit(user.id, "learn", RATE_RULES.learningWrite);
  if (section.practice.length === 0) throw new Error("NO_PRACTICE");
  await updateLearningRecord(user.id, (record) => {
    const state = ensureSectionState(record, slug, sectionId);
    state.startedAt ??= new Date().toISOString();
    if (done) state.practiceDoneAt ??= new Date().toISOString();
    else {
      delete state.practiceDoneAt;
      delete state.practiceDone;
    }
  });
  refresh();
}

export async function completeSection(slug: string, sectionId: string) {
  const { user, week, section } = await loadSectionContext(slug, sectionId);
  const record = getLearningRecord(user.id);
  const state = ensureSectionState(record, slug, sectionId);
  if (!sectionProgress(section, state).ready) {
    return { ok: false as const, error: "확인 문제를 모두 맞힌 뒤에 단계를 완료할 수 있습니다." };
  }
  await updateLearningRecord(user.id, (r) => {
    const s = ensureSectionState(r, slug, sectionId);
    s.completedAt ??= new Date().toISOString();
  });
  const next = nextSectionAfter(week, section);
  // 핵심 단계는 다음 핵심 단계로, 마지막 핵심 단계면 적용과 복습(완료 안내)으로 간다. 보충·심화 단계는 다음 선택 단계(없으면 기록 화면)로 간다.
  if (next) redirect(`/weeks/${slug}/sections/${next.id}`);
  redirect(section.tier === "core" ? `/weeks/${slug}/apply?finished=1` : `/weeks/${slug}#record-heading`);
}

// ─── 백지공부 ───────────────────────────────────────────────────────────

async function loadFinaleContext(slug: string) {
  const user = await requireUser(`/weeks/${slug}`);
  const week = getWeek(slug);
  if (!week) throw new Error("NOT_FOUND");
  const status = weekStatus(week, getLearningRecord(user.id));
  if (!status.finaleOpen && user.role !== "admin") throw new Error("SECTIONS_NOT_DONE");
  return { user, week };
}

export async function saveWorksheet(slug: string, answers: Record<string, string>, submit: boolean) {
  const { user, week } = await loadFinaleContext(slug);
  if (!consumeRate(`learn:${user.id}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  const clean: Record<string, string> = {};
  week.worksheet.forEach((_, index) => {
    clean[String(index)] = String(answers?.[String(index)] ?? "").slice(0, ANSWER_MAX);
  });
  if (submit && Object.values(clean).some((v) => !v.trim())) {
    return { ok: false as const, error: "모든 칸을 채운 뒤 제출해 주십시오. 기억나지 않는 부분은 '기억나지 않음'이라고 적는 것도 의미 있는 기록입니다." };
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
  limit(user.id, "learn", RATE_RULES.learningWrite);
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
