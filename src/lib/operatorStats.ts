import "server-only";
import { ASSIGNMENT_KEYS, CORE_PATH, MODULES } from "@/content/course";
import type { Lesson, Module } from "@/content/types";
import { checkStats, completedLessonsByUser, type CheckStat } from "./learningStore";
import { listSubmissionSummaries, type SubmissionStatus } from "./submissionStore";
import { listUsers } from "./userStore";

// 운영자 화면(대시보드·스터디원·콘텐츠)이 같이 쓰는 집계. 학습 기록 전체를 읽지 않고 DB 집계 결과만 조합한다.

/** 첫 시도 정답률이 이 값보다 낮으면 "점검할 문항"으로 표시한다(응답이 MIN_ANSWERS 이상일 때). */
export const LOW_FIRST_TRY = 0.4;
export const MIN_ANSWERS = 3;

export interface ModuleActivity {
  module: Module;
  coreTotal: number;
  /** 핵심 레슨을 하나 이상 끝낸 스터디원 수 */
  started: number;
  /** 핵심 레슨을 모두 끝낸 스터디원 수 */
  finished: number;
  submissions: Record<SubmissionStatus, number>;
}

/** 스터디원(운영자 제외)의 레슨 완료 기록 */
export function memberCompletions(): { memberIds: string[]; completed: Map<string, Set<string>> } {
  const memberIds = listUsers()
    .filter((u) => u.role === "member")
    .map((u) => u.id);
  return { memberIds, completed: completedLessonsByUser() };
}

export function moduleActivity(): ModuleActivity[] {
  const { memberIds, completed } = memberCompletions();
  const summaries = listSubmissionSummaries();
  return MODULES.map((module) => {
    const core = module.lessons.filter((l) => l.tier === "core");
    let started = 0;
    let finished = 0;
    for (const id of memberIds) {
      const done = completed.get(id);
      const n = done ? core.filter((l) => done.has(l.id)).length : 0;
      if (n > 0) started++;
      if (core.length > 0 && n === core.length) finished++;
    }
    const submissions: Record<SubmissionStatus, number> = { submitted: 0, graded: 0, revision: 0 };
    if (module.assignment) for (const s of summaries) if (s.assignmentKey === module.assignment.key) submissions[s.status]++;
    return { module, coreTotal: core.length, started, finished, submissions };
  });
}

/** 스터디원이 필수 경로에서 다음에 할 핵심 레슨(모두 끝냈으면 undefined) */
export function nextCoreLesson(done: Set<string> | undefined): Lesson | undefined {
  return CORE_PATH.find((l) => !done?.has(l.id));
}

export interface CheckStatView extends CheckStat {
  rate: number;
  low: boolean;
}

/** 확인 문제 통계(레슨 id/문항 키 → 응답 수·첫 시도 정답률) */
export function checkStatMap(): Map<string, CheckStatView> {
  return new Map(
    checkStats().map((s) => {
      const rate = s.answered === 0 ? 0 : s.firstTry / s.answered;
      return [`${s.lessonId}/${s.key}`, { ...s, rate, low: s.answered >= MIN_ANSWERS && rate < LOW_FIRST_TRY }];
    })
  );
}

/** 이 과정의 과제 키(집계 함수에 넘긴다) */
export const COURSE_ASSIGNMENT_KEYS = ASSIGNMENT_KEYS;
