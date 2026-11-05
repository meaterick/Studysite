"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createElement, type ReactNode } from "react";
import { getLesson, getModule } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import { requireUser } from "./dal";
import { consumeRate, RateLimitError, RATE_LIMIT_MESSAGE, RATE_RULES, type RateRule } from "./rateLimit";
import { ensureLessonState, getLearningRecord, readRecallState, updateLearningRecord, type RecallMark, type ReviewStatus } from "./learningStore";
import { normalizeOutput } from "./labHarness";
import { canOpenLesson, lessonProgress, moduleStatus } from "./study";
import { lessonHref, moduleHref, recallHref } from "./routes";

// 모든 액션은 브라우저에서 임의로 호출될 수 있으므로, 화면에서 이미 막았더라도 여기서 로그인·잠금·입력값을 다시 검증한다.
// 문항 액션은 화면 전체를 다시 그리지 않고(refresh 없음) 바뀐 문항의 결과만 돌려준다. 화면은 그 결과로 문항과 진행 숫자를 고친다.

const ANSWER_MAX = 4000;

function limit(userId: string, name: string, rule: RateRule) {
  if (!consumeRate(`${name}:${userId}`, rule)) throw new RateLimitError();
}

async function loadLessonContext(lessonId: string) {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error("NOT_FOUND");
  const mod = getModule(lesson.module)!;
  const user = await requireUser(lessonHref(mod.slug, lesson.id));
  const status = moduleStatus(mod, getLearningRecord(user.id));
  if (!canOpenLesson(status, lesson.id, user.role === "admin")) throw new Error("LESSON_LOCKED");
  return { user, lesson, module: mod };
}

// ─── 확인 문제 ───────────────────────────────────────────────────────────

export interface CheckResult {
  correct: boolean;
  state: { correct: boolean; wrong: number[]; attempts: number };
  /** 맞힌 뒤에만 */
  correctIndex?: number;
  /** 맞히거나 두 번 틀린 뒤에만 */
  explanation?: ReactNode;
  /** 진단 평가에서 이 답으로 레슨의 확인 문제를 모두 맞혀 완료로 인정되었는가 */
  credited?: boolean;
}

/**
 * 확인 문제 답 제출. credit이 true(진단 평가 화면)이고 이 답으로 레슨의 확인 문제를 모두 맞히게 되면
 * 레슨을 읽지 않고도 완료로 인정한다(creditedAt).
 */
export async function answerCheck(lessonId: string, key: string, choice: number, credit = false): Promise<CheckResult> {
  const { user, lesson } = await loadLessonContext(lessonId);
  limit(user.id, "check", RATE_RULES.checkAnswer);
  const check = lesson.checks.find((c) => c.key === key);
  if (!check || !Number.isInteger(choice) || choice < 0 || choice >= check.choices.length) throw new Error("INVALID_CHOICE");
  const correct = choice === check.answer;
  const result = await updateLearningRecord(user.id, (record) => {
    const st = ensureLessonState(record, lesson.id);
    st.startedAt ??= new Date().toISOString();
    const prev = st.checks[key] ?? { correct: false, attempts: 0, wrong: [] };
    if (!prev.correct) {
      st.checks[key] = {
        correct,
        attempts: prev.attempts + 1,
        wrong: correct || prev.wrong.includes(choice) ? prev.wrong : [...prev.wrong, choice],
      };
    }
    let credited = false;
    if (credit && !st.completedAt && !st.creditedAt && lessonProgress(lesson, st, record).ready) {
      st.creditedAt = new Date().toISOString();
      credited = true;
    }
    return { state: st.checks[key], credited };
  });
  const state = result.state;
  const reveal = state.correct || state.wrong.length >= 2;
  return {
    correct: state.correct,
    state: { correct: state.correct, wrong: state.wrong, attempts: state.attempts },
    correctIndex: state.correct ? check.answer : undefined,
    explanation: reveal ? createElement(Inline, { text: check.explanation }) : undefined,
    credited: result.credited,
  };
}

// ─── 서술형 ─────────────────────────────────────────────────────────────

/** 서술형 저장. 모범답안과 핵심 요소는 답을 저장한 뒤에만 내려준다. */
export async function saveDescriptive(lessonId: string, key: string, text: string) {
  const { user, lesson } = await loadLessonContext(lessonId);
  if (!consumeRate(`learn:${user.id}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  const item = lesson.descriptive?.find((d) => d.key === key);
  if (!item) throw new Error("INVALID_QUESTION");
  const trimmed = String(text ?? "").trim().slice(0, ANSWER_MAX);
  if (!trimmed) return { ok: false as const, error: "답안을 먼저 작성해 주십시오." };
  await updateLearningRecord(user.id, (record) => {
    const st = ensureLessonState(record, lesson.id);
    st.startedAt ??= new Date().toISOString();
    const prev = st.answers[key];
    st.answers[key] = { text: trimmed, answeredAt: new Date().toISOString(), review: prev?.review, checkedPoints: prev?.checkedPoints };
  });
  return {
    ok: true as const,
    text: trimmed,
    modelAnswer: createElement(BlocksRenderer, { blocks: parseMarkdown(item.answer) }) as ReactNode,
    keyPoints: item.keyPoints.map((p, i) => createElement(Inline, { key: i, text: p })) as ReactNode[],
  };
}

/** 서술형 자기평가와 확인한 핵심 요소를 저장한다. */
export async function reviewDescriptive(lessonId: string, key: string, review: ReviewStatus, checkedPoints: number[]) {
  const { user, lesson } = await loadLessonContext(lessonId);
  limit(user.id, "learn", RATE_RULES.learningWrite);
  const item = lesson.descriptive?.find((d) => d.key === key);
  if (!item || (review !== "correct" && review !== "incorrect")) throw new Error("INVALID_REVIEW");
  const points = [...new Set((Array.isArray(checkedPoints) ? checkedPoints : []).filter((i) => Number.isInteger(i) && i >= 0 && i < item.keyPoints.length))];
  const saved = await updateLearningRecord(user.id, (record) => {
    const answer = ensureLessonState(record, lesson.id).answers[key];
    if (answer) {
      answer.review = review;
      answer.checkedPoints = points;
    }
    return !!answer;
  });
  return { ok: saved, review, checkedPoints: points };
}

// ─── 출력 예측 ───────────────────────────────────────────────────────────

export interface PredictResult {
  correct: boolean;
  state: { correct: boolean; attempts: number; lastAnswer?: string; revealed: boolean };
  /** 공개된 뒤에만 */
  expected?: string;
  explanation?: ReactNode;
}

function predictResult(item: { expected: string; explanation: string }, s: { correct?: boolean; attempts: number; lastAnswer?: string; revealed?: boolean }): PredictResult {
  const revealed = !!s.correct || !!s.revealed;
  return {
    correct: !!s.correct,
    state: { correct: !!s.correct, attempts: s.attempts, lastAnswer: s.lastAnswer, revealed },
    expected: revealed ? item.expected : undefined,
    explanation: revealed ? createElement(Inline, { text: item.explanation }) : undefined,
  };
}

/** 출력 예측: 줄 끝 공백·연속 공백 차이는 무시하고 비교한다. 두 번 틀리면 정답과 해설을 공개한다. */
export async function answerPredict(lessonId: string, key: string, answer: string) {
  const { user, lesson } = await loadLessonContext(lessonId);
  limit(user.id, "learn", RATE_RULES.learningWrite);
  const item = lesson.predicts?.find((p) => p.key === key);
  if (!item) throw new Error("INVALID_QUESTION");
  const text = String(answer ?? "").slice(0, ANSWER_MAX);
  if (!text.trim()) return { ok: false as const, error: "예상 출력을 먼저 적어 주십시오." };
  const accepted = [item.expected, ...(item.alternatives ?? [])].map(normalizeOutput);
  const correct = accepted.includes(normalizeOutput(text));
  const s = await updateLearningRecord(user.id, (record) => {
    const st = ensureLessonState(record, lesson.id);
    const prev = st.predicts[key] ?? { attempts: 0 };
    if (prev.correct) return prev;
    const attempts = prev.attempts + 1;
    st.predicts[key] = { ...prev, attempts, correct, lastAnswer: text, revealed: prev.revealed || correct || attempts >= 2 };
    return st.predicts[key];
  });
  return { ok: true as const, ...predictResult(item, s) };
}

/** 출력 예측: 정답 보기. 정답으로 기록하지 않는다. */
export async function revealPredict(lessonId: string, key: string): Promise<PredictResult> {
  const { user, lesson } = await loadLessonContext(lessonId);
  limit(user.id, "learn", RATE_RULES.learningWrite);
  const item = lesson.predicts?.find((p) => p.key === key);
  if (!item) throw new Error("INVALID_QUESTION");
  const s = await updateLearningRecord(user.id, (record) => {
    const st = ensureLessonState(record, lesson.id);
    st.predicts[key] = { ...(st.predicts[key] ?? { attempts: 0 }), revealed: true };
    return st.predicts[key];
  });
  return predictResult(item, s);
}

// ─── 레슨 완료 ───────────────────────────────────────────────────────────

/** 확인 문제를 모두 맞힌 레슨을 완료로 기록하고 다음 레슨으로 이동한다. */
export async function completeLesson(lessonId: string) {
  const { user, lesson, module } = await loadLessonContext(lessonId);
  const record = getLearningRecord(user.id);
  const st = ensureLessonState(record, lesson.id);
  if (!lessonProgress(lesson, st, record).ready) return { ok: false as const, error: "확인 문제를 모두 맞힌 뒤에 레슨을 완료할 수 있습니다." };
  await updateLearningRecord(user.id, (r) => {
    ensureLessonState(r, lesson.id).completedAt ??= new Date().toISOString();
  });
  // 핵심 레슨은 같은 모듈의 다음 핵심 레슨으로, 마지막 핵심 레슨이면 백지 복습(없으면 모듈 개요)으로 간다.
  // 보충·심화 레슨은 다음 선택 레슨으로, 없으면 모듈 개요로 간다.
  const after = module.lessons.slice(lesson.order);
  const next = lesson.tier === "core" ? after.find((l) => l.tier === "core") : after.find((l) => l.tier !== "core");
  if (next) redirect(lessonHref(module.slug, next.id));
  if (lesson.tier === "core" && module.recall.length > 0) redirect(`${recallHref(module.slug)}?finished=1`);
  redirect(`${moduleHref(module.slug)}?finished=1`);
}

// ─── 백지 복습 ───────────────────────────────────────────────────────────

async function loadRecallContext(moduleSlug: string) {
  const mod = getModule(moduleSlug);
  if (!mod) throw new Error("NOT_FOUND");
  const user = await requireUser(recallHref(moduleSlug));
  const status = moduleStatus(mod, getLearningRecord(user.id));
  if (!status.finaleOpen && user.role !== "admin") throw new Error("LESSONS_NOT_DONE");
  return { user, module: mod };
}

export async function saveRecall(moduleSlug: string, answers: Record<string, string>, submit: boolean) {
  const { user, module } = await loadRecallContext(moduleSlug);
  if (!consumeRate(`learn:${user.id}`, RATE_RULES.learningWrite)) return { ok: false as const, error: RATE_LIMIT_MESSAGE };
  const clean: Record<string, string> = {};
  module.recall.forEach((_, index) => {
    clean[String(index)] = String(answers?.[String(index)] ?? "").slice(0, ANSWER_MAX);
  });
  if (submit && Object.values(clean).some((v) => !v.trim())) {
    return { ok: false as const, error: "모든 칸을 채운 뒤 제출해 주십시오. 떠오르지 않는 부분은 '기억나지 않음'이라고 적어도 됩니다." };
  }
  await updateLearningRecord(user.id, (record) => {
    const prev = readRecallState(record, module.slug);
    const now = new Date().toISOString();
    record.recalls[module.slug] = { ...prev, answers: clean, savedAt: now, submittedAt: submit ? prev.submittedAt ?? now : prev.submittedAt };
  });
  refresh();
  return { ok: true as const };
}

export async function markRecall(moduleSlug: string, field: string, mark: RecallMark) {
  const { user, module } = await loadRecallContext(moduleSlug);
  limit(user.id, "learn", RATE_RULES.learningWrite);
  const index = Number(field);
  if (!Number.isInteger(index) || index < 0 || index >= module.recall.length || (mark !== "ok" && mark !== "weak")) throw new Error("INVALID_MARK");
  await updateLearningRecord(user.id, (record) => {
    const prev = readRecallState(record, module.slug);
    record.recalls[module.slug] = { ...prev, marks: { ...prev.marks, [String(index)]: mark } };
  });
  refresh();
}
