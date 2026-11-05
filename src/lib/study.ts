import "server-only";
import type { Lesson, Module } from "@/content/types";
import { TIER_ORDER, type Tier } from "@/content/tiers";
import { CORE_PATH, MODULES, directPrerequisitesOf, getLesson, itemId } from "@/content/course";
import { readLessonState, readRecallState, type LearningRecord, type LessonState } from "./learningStore";
import { getProgressionMode, type ProgressionMode } from "./settingsStore";
import { lessonHref, moduleHref, recallHref } from "./routes";

// 진행 규칙을 한곳에 모아 둔다. 페이지(표시), 서버 액션(검증), 운영자 화면(요약)이 같은 함수를 쓰므로
// "화면에서는 완료인데 서버는 미완료" 같은 불일치가 생기지 않는다.
//
// - 레슨 완료: 확인 문제를 모두 맞힌 뒤 "레슨 완료"를 누른다(또는 진단 평가에서 확인 문제를 모두 맞혀 인정).
//   서술형·출력 예측·코딩 실습은 권장 활동이며 완료 조건에 넣지 않는다.
// - 모듈 완료: 핵심 레슨을 모두 완료. 보충 레슨은 선택 기록, 심화 레슨은 심화 달성 기록으로 따로 보여 준다.
// - 진행 방식(운영 설정)
//   warn(기본): 순서는 안내만 한다. 어떤 레슨이든 열 수 있고, 먼저 볼 레슨이 남아 있으면 경고를 보여 준다.
//   lock: 모듈 안에서 앞 핵심 레슨을 끝내야 다음 핵심 레슨이 열리고, 핵심 레슨을 모두 끝내야 보충·심화 레슨과
//         백지 복습·과제가 열린다.

export interface LessonProgress {
  checksDone: number;
  checksTotal: number;
  /** 자기평가까지 마친 서술형 수 */
  answersDone: number;
  answersTotal: number;
  exercisesPassed: number;
  exercisesTotal: number;
  /** 확인 문제를 모두 맞혔는가(완료 버튼을 누를 수 있음) */
  ready: boolean;
  completed: boolean;
  /** 진단 평가로 인정한 완료인가 */
  credited: boolean;
}

export function lessonProgress(lesson: Lesson, state: LessonState, record: LearningRecord): LessonProgress {
  const checksTotal = lesson.checks.length;
  const checksDone = lesson.checks.filter((c) => state.checks[c.key]?.correct).length;
  const answersTotal = lesson.descriptive?.length ?? 0;
  const answersDone = (lesson.descriptive ?? []).filter((d) => !!state.answers[d.key]?.review).length;
  const exercisesTotal = lesson.exercises?.length ?? 0;
  const exercisesPassed = (lesson.exercises ?? []).filter((e) => !!record.exercises[itemId(lesson.id, e.key)]?.passedAt).length;
  return {
    checksDone,
    checksTotal,
    answersDone,
    answersTotal,
    exercisesPassed,
    exercisesTotal,
    ready: checksDone === checksTotal,
    completed: !!state.completedAt || !!state.creditedAt,
    credited: !state.completedAt && !!state.creditedAt,
  };
}

export function isLessonComplete(record: LearningRecord, lessonId: string): boolean {
  const state = record.lessons[lessonId];
  return !!state?.completedAt || !!state?.creditedAt;
}

/**
 * completed: 완료 / current: 지금 할 차례(모듈에서 끝내지 않은 첫 핵심 레슨) /
 * upcoming: 아직 끝내지 않았지만 열려 있음 / locked: 잠김(lock 모드)
 */
export type LessonAccess = "completed" | "current" | "upcoming" | "locked";

export interface TierCount {
  done: number;
  total: number;
}


export interface ModuleStatus {
  module: Module;
  /** 모듈 안 순서(핵심 → 보충 → 심화) */
  lessons: { lesson: Lesson; access: LessonAccess; progress: LessonProgress }[];
  tiers: Record<Tier, TierCount>;
  /** 다음에 학습할 핵심 레슨(핵심을 모두 끝냈으면 undefined) */
  currentLesson?: Lesson;
  /** 핵심 레슨을 모두 끝냈는가(= 모듈 완료) */
  coreDone: boolean;
  /** 백지 복습·과제를 열 수 있는가(lock 모드에서는 핵심 완료 후, warn 모드에서는 항상) */
  finaleOpen: boolean;
  mode: ProgressionMode;
  recallSubmitted: boolean;
  /** 핵심 레슨 완료 비율 */
  ratio: number;
}

export function moduleStatus(module: Module, record: LearningRecord, mode: ProgressionMode = getProgressionMode()): ModuleStatus {
  const progressOf = (lesson: Lesson) => lessonProgress(lesson, readLessonState(record, lesson.id), record);
  const core = module.lessons.filter((l) => l.tier === "core");
  const coreDone = core.every((l) => progressOf(l).completed);
  let blocked = false;
  const rows = module.lessons.map((lesson) => {
    const progress = progressOf(lesson);
    let access: LessonAccess;
    if (lesson.tier !== "core") {
      access = progress.completed ? "completed" : mode === "lock" && !coreDone ? "locked" : "upcoming";
    } else if (progress.completed) {
      access = "completed";
    } else if (!blocked) {
      access = "current";
      blocked = true;
    } else {
      access = mode === "lock" ? "locked" : "upcoming";
    }
    return { lesson, access, progress };
  });
  const tiers = Object.fromEntries(
    TIER_ORDER.map((t) => {
      const inTier = rows.filter((r) => r.lesson.tier === t);
      return [t, { done: inTier.filter((r) => r.progress.completed).length, total: inTier.length }];
    })
  ) as Record<Tier, TierCount>;
  return {
    module,
    lessons: rows,
    tiers,
    currentLesson: rows.find((r) => r.access === "current")?.lesson,
    coreDone,
    finaleOpen: coreDone || mode === "warn",
    mode,
    recallSubmitted: !!readRecallState(record, module.slug).submittedAt,
    ratio: tiers.core.total === 0 ? 0 : tiers.core.done / tiers.core.total,
  };
}

/** 운영자는 콘텐츠 검수를 위해 잠금 없이 모든 레슨을 볼 수 있다. warn 모드에서는 잠긴 레슨이 없다. */
export function canOpenLesson(status: ModuleStatus, lessonId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const row = status.lessons.find((r) => r.lesson.id === lessonId);
  return !!row && row.access !== "locked";
}

/** 레슨을 시작하기 전에 마쳐 두면 좋은 직접 선수 레슨 중 아직 끝내지 않은 것 */
export function unfinishedPrerequisites(record: LearningRecord, lesson: Lesson): Lesson[] {
  return directPrerequisitesOf(lesson).filter((p) => !isLessonComplete(record, p.id));
}

/** 모듈의 "이어서 학습" 주소: 지금 할 핵심 레슨, 핵심을 모두 끝냈으면 백지 복습(없으면 모듈 개요) */
export function moduleContinueHref(status: ModuleStatus): string {
  if (status.currentLesson) return lessonHref(status.module.slug, status.currentLesson.id);
  return status.module.recall.length > 0 && !status.recallSubmitted ? recallHref(status.module.slug) : moduleHref(status.module.slug);
}

export interface CourseProgress {
  coreDone: number;
  coreTotal: number;
  /** 필수 경로에서 아직 끝내지 않은 첫 핵심 레슨 */
  next?: Lesson;
  /** 모듈 slug → 핵심 레슨 완료 수 */
  byModule: Map<string, TierCount>;
}

export function courseProgress(record: LearningRecord): CourseProgress {
  const byModule = new Map<string, TierCount>();
  for (const m of MODULES) {
    const core = m.lessons.filter((l) => l.tier === "core");
    byModule.set(m.slug, { done: core.filter((l) => isLessonComplete(record, l.id)).length, total: core.length });
  }
  const done = CORE_PATH.filter((l) => isLessonComplete(record, l.id)).length;
  return { coreDone: done, coreTotal: CORE_PATH.length, next: CORE_PATH.find((l) => !isLessonComplete(record, l.id)), byModule };
}

/** 레슨 id 목록을 레슨으로(없는 id는 버린다) */
export function lessonsByIds(ids: string[]): Lesson[] {
  return ids.map((id) => getLesson(id)).filter((l): l is Lesson => !!l);
}
