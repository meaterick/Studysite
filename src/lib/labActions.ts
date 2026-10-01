"use server";

import { refresh } from "next/cache";
import { getWeek } from "@/content/weeks";
import { findLabExercise, findLabQuizItem } from "@/content/labs";
import type { CodingExercise } from "@/content/types";
import { requireUser } from "./dal";
import { consumeRate, RateLimitError, RATE_LIMIT_MESSAGE, RATE_RULES } from "./rateLimit";
import { ensureLabState, getLearningRecord, updateLearningRecord, type QuizReviewStatus } from "./learningStore";
import { canOpenSection, weekStatus } from "./study";
import { normalizeOutput } from "./labHarness";

// 코딩 실습·퀴즈 서버 액션. 학습자 코드는 브라우저(Pyodide)에서만 실행되고, 여기서는 결과 기록과
// 퀴즈 정답 비교만 한다. 화면에서 이미 막았더라도 로그인·단계 잠금·입력값을 다시 검증한다.

const ANSWER_MAX = 4000;

function limit(userId: string) {
  if (!consumeRate(`learn:${userId}`, RATE_RULES.learningWrite)) throw new RateLimitError();
}

/** sectionId가 있으면 단계 잠금(lock 모드)을, 없으면(과제 심화 문제) 백지공부·과제 잠금을 따른다. */
async function loadLabContext(slug: string, sectionId: string | undefined) {
  const user = await requireUser(`/weeks/${slug}`);
  const week = getWeek(slug);
  if (!week) throw new Error("NOT_FOUND");
  const isAdmin = user.role === "admin";
  const status = weekStatus(week, getLearningRecord(user.id));
  const open = sectionId ? canOpenSection(status, sectionId, isAdmin) : status.finaleOpen || isAdmin;
  if (!open) throw new Error("LOCKED");
  return { user };
}

async function loadExercise(slug: string, exerciseId: string): Promise<{ userId: string; exercise: CodingExercise }> {
  const found = findLabExercise(slug, exerciseId);
  if (!found) throw new Error("NOT_FOUND");
  const { user } = await loadLabContext(slug, found.exercise.sectionId);
  return { userId: user.id, exercise: found.exercise };
}

function count(value: unknown, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0;
}

/** 브라우저에서 채점한 결과를 기록한다. 처음으로 전부 통과했을 때만 화면을 새로 그린다(진행 표시 갱신). */
export async function recordExerciseGrade(slug: string, exerciseId: string, passed: number, total: number) {
  const { userId } = await loadExercise(slug, exerciseId);
  if (!consumeRate(`learn:${userId}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  const t = count(total, 100);
  const p = Math.min(count(passed, 100), t);
  const firstPass = await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.exercises[exerciseId] ?? { attempts: 0, bestPassed: 0, total: t, hintsUsed: 0 };
    const now = new Date().toISOString();
    const solved = t > 0 && p === t;
    lab.exercises[exerciseId] = {
      ...prev,
      attempts: prev.attempts + 1,
      bestPassed: Math.max(prev.bestPassed, p),
      total: t,
      lastGradedAt: now,
      passedAt: prev.passedAt ?? (solved ? now : undefined),
    };
    return solved && !prev.passedAt;
  });
  if (firstPass) refresh();
  return { ok: true as const };
}

/** 열어 본 힌트 수를 기록한다(모범 답안 공개 조건). */
export async function recordExerciseHint(slug: string, exerciseId: string, shown: number) {
  const { userId, exercise } = await loadExercise(slug, exerciseId);
  limit(userId);
  const n = count(shown, exercise.hints.length);
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.exercises[exerciseId] ?? { attempts: 0, bestPassed: 0, total: 0, hintsUsed: 0 };
    lab.exercises[exerciseId] = { ...prev, hintsUsed: Math.max(prev.hintsUsed, n) };
  });
}

/**
 * 모범 답안을 돌려준다. 모든 항목을 통과했거나, 한 번 이상 채점해 보고 힌트를 모두 본 뒤에만 공개한다.
 * (채점은 브라우저에서 하므로 통과 기록은 학습자가 보고한 값이다. 이 조건은 "먼저 스스로 해 보기"를 돕는 장치다.)
 */
export async function getExerciseSolution(slug: string, exerciseId: string) {
  const { userId, exercise } = await loadExercise(slug, exerciseId);
  limit(userId);
  const record = getLearningRecord(userId);
  const state = record.labs?.[slug]?.exercises?.[exerciseId];
  const allowed = !!state?.passedAt || (!!state && state.attempts > 0 && state.hintsUsed >= exercise.hints.length);
  if (!allowed) return { ok: false as const, error: "한 번 이상 채점해 보고 힌트를 모두 확인한 뒤에 모범 답안을 볼 수 있습니다." };
  await updateLearningRecord(userId, (r) => {
    const lab = ensureLabState(r, slug);
    const prev = lab.exercises[exerciseId];
    if (prev) prev.solutionViewedAt ??= new Date().toISOString();
  });
  return { ok: true as const, solution: exercise.solution };
}

// ─── 퀴즈 ──────────────────────────────────────────────────────────────

async function loadQuizItem(slug: string, itemId: string) {
  const item = findLabQuizItem(slug, itemId);
  if (!item) throw new Error("NOT_FOUND");
  const { user } = await loadLabContext(slug, item.sectionId);
  limit(user.id);
  return { userId: user.id, item };
}

export async function answerDrillChoice(slug: string, itemId: string, choice: number) {
  const { userId, item } = await loadQuizItem(slug, itemId);
  if (item.kind !== "choice" || !Number.isInteger(choice) || choice < 0 || choice >= item.choices.length) {
    throw new Error("INVALID_CHOICE");
  }
  const correct = choice === item.answer;
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.quiz[itemId] ?? { attempts: 0, wrong: [] };
    if (prev.correct) return;
    const wrong = prev.wrong ?? [];
    lab.quiz[itemId] = {
      ...prev,
      attempts: prev.attempts + 1,
      correct,
      wrong: correct || wrong.includes(choice) ? wrong : [...wrong, choice],
    };
  });
  refresh();
  return { correct };
}

/** 출력 예측: 줄 끝 공백·연속 공백 차이는 무시하고 비교한다. 두 번 틀리면 정답과 해설을 공개한다. */
export async function answerDrillPredict(slug: string, itemId: string, answer: string) {
  const { userId, item } = await loadQuizItem(slug, itemId);
  if (item.kind !== "predict") throw new Error("INVALID_QUESTION");
  const text = String(answer ?? "").slice(0, ANSWER_MAX);
  if (!text.trim()) return { ok: false as const, error: "예상 출력을 먼저 적어 주십시오." };
  const accepted = [item.expected, ...(item.alternatives ?? [])].map(normalizeOutput);
  const correct = accepted.includes(normalizeOutput(text));
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.quiz[itemId] ?? { attempts: 0 };
    if (prev.correct) return;
    const attempts = prev.attempts + 1;
    lab.quiz[itemId] = { ...prev, attempts, correct, lastAnswer: text, revealed: prev.revealed || correct || attempts >= 2 };
  });
  refresh();
  return { ok: true as const, correct };
}

/** 출력 예측: 정답 보기(포기). 정답으로 기록하지 않는다. */
export async function revealDrillPredict(slug: string, itemId: string) {
  const { userId, item } = await loadQuizItem(slug, itemId);
  if (item.kind !== "predict") throw new Error("INVALID_QUESTION");
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.quiz[itemId] ?? { attempts: 0 };
    lab.quiz[itemId] = { ...prev, revealed: true };
  });
  refresh();
}

export async function saveDrillDescriptive(slug: string, itemId: string, text: string) {
  const { userId, item } = await loadQuizItem(slug, itemId);
  if (item.kind !== "descriptive") throw new Error("INVALID_QUESTION");
  const trimmed = String(text ?? "").trim().slice(0, ANSWER_MAX);
  if (!trimmed) return { ok: false as const, error: "답안을 먼저 작성해 주십시오." };
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.quiz[itemId] ?? { attempts: 0 };
    lab.quiz[itemId] = { ...prev, attempts: prev.attempts + 1, text: trimmed, answeredAt: new Date().toISOString() };
  });
  refresh();
  return { ok: true as const };
}

/** 서술형: 핵심 요소 체크와 자기평가를 저장한다. */
export async function reviewDrillDescriptive(slug: string, itemId: string, review: QuizReviewStatus, checkedPoints: number[]) {
  const { userId, item } = await loadQuizItem(slug, itemId);
  if (item.kind !== "descriptive" || (review !== "correct" && review !== "incorrect")) throw new Error("INVALID_REVIEW");
  const points = [...new Set((Array.isArray(checkedPoints) ? checkedPoints : []).filter((i) => Number.isInteger(i) && i >= 0 && i < item.keyPoints.length))];
  await updateLearningRecord(userId, (record) => {
    const lab = ensureLabState(record, slug);
    const prev = lab.quiz[itemId];
    if (prev?.text) lab.quiz[itemId] = { ...prev, review, checkedPoints: points };
  });
  refresh();
}
