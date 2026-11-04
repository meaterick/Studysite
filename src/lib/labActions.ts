"use server";

import { refresh } from "next/cache";
import { findExercise } from "@/content/course";
import { requireUser } from "./dal";
import { consumeRate, RateLimitError, RATE_LIMIT_MESSAGE, RATE_RULES } from "./rateLimit";
import { getLearningRecord, updateLearningRecord, type ExerciseState } from "./learningStore";
import { canOpenLesson, moduleStatus } from "./study";
import { assignmentHref, lessonHref } from "./routes";

// 코딩 실습 서버 액션. 학습자 코드는 브라우저(Pyodide)에서만 실행되고, 여기서는 채점 결과·힌트 사용을 기록하고
// 공개 조건을 만족한 학습자에게만 모범 답안을 내려준다. 화면에서 막았더라도 로그인·잠금·입력값을 다시 검증한다.

/** 레슨 실습은 레슨 잠금을, 과제 심화 문제는 백지 복습·과제 잠금을 따른다. */
async function loadExercise(exerciseId: string) {
  const found = findExercise(exerciseId);
  if (!found) throw new Error("NOT_FOUND");
  const from = found.challenge ? assignmentHref(found.module.slug) : lessonHref(found.module.slug, found.lesson.id);
  const user = await requireUser(from);
  const isAdmin = user.role === "admin";
  const status = moduleStatus(found.module, getLearningRecord(user.id));
  const open = found.challenge ? status.finaleOpen || isAdmin : canOpenLesson(status, found.lesson.id, isAdmin);
  if (!open) throw new Error("LOCKED");
  return { userId: user.id, exercise: found.exercise };
}

function count(value: unknown, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0;
}

const emptyState = (total = 0): ExerciseState => ({ attempts: 0, bestPassed: 0, total, hintsUsed: 0 });

/** 브라우저에서 채점한 결과를 기록한다. 처음으로 전부 통과했을 때만 화면을 새로 그린다(진행 표시 갱신). */
export async function recordExerciseGrade(exerciseId: string, passed: number, total: number) {
  const { userId } = await loadExercise(exerciseId);
  if (!consumeRate(`learn:${userId}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  const t = count(total, 100);
  const p = Math.min(count(passed, 100), t);
  const firstPass = await updateLearningRecord(userId, (record) => {
    const prev = record.exercises[exerciseId] ?? emptyState(t);
    const now = new Date().toISOString();
    const solved = t > 0 && p === t;
    record.exercises[exerciseId] = {
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
export async function recordExerciseHint(exerciseId: string, shown: number) {
  const { userId, exercise } = await loadExercise(exerciseId);
  if (!consumeRate(`learn:${userId}`, RATE_RULES.learningWrite)) throw new RateLimitError();
  const n = count(shown, exercise.hints.length);
  await updateLearningRecord(userId, (record) => {
    const prev = record.exercises[exerciseId] ?? emptyState();
    record.exercises[exerciseId] = { ...prev, hintsUsed: Math.max(prev.hintsUsed, n) };
  });
}

/**
 * 모범 답안을 돌려준다. 모든 항목을 통과했거나, 한 번 이상 채점해 보고 힌트를 모두 본 뒤에만 공개한다.
 * (채점은 브라우저에서 하므로 통과 기록은 학습자가 보고한 값이다. 이 조건은 먼저 스스로 풀어 보도록 하기 위한 장치다.)
 */
export async function getExerciseSolution(exerciseId: string) {
  const { userId, exercise } = await loadExercise(exerciseId);
  if (!consumeRate(`learn:${userId}`, RATE_RULES.learningWrite)) throw new RateLimitError();
  const state = getLearningRecord(userId).exercises[exerciseId];
  const allowed = !!state?.passedAt || (!!state && state.attempts > 0 && state.hintsUsed >= exercise.hints.length);
  if (!allowed) return { ok: false as const, error: "한 번 이상 채점해 보고 힌트를 모두 확인한 뒤에 모범 답안을 볼 수 있습니다." };
  await updateLearningRecord(userId, (r) => {
    const prev = r.exercises[exerciseId];
    if (prev) prev.solutionViewedAt ??= new Date().toISOString();
  });
  return { ok: true as const, solution: exercise.solution };
}
