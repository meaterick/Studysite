import "server-only";
import type { WeekMeta, WeekSection } from "@/content/types";
import { TIER_ORDER, type Tier } from "@/content/tiers";
import { getWeekOutline } from "@/content/sections";
import { readSectionState, readWorksheetState, type LearningRecord, type SectionState } from "./learningStore";
import { latestGrade, type Submission } from "./submissionStore";
import { getProgressionMode, type ProgressionMode } from "./settingsStore";

// 단계 진행 규칙을 한곳에 모아둔다 — 페이지(표시), 서버 액션(검증), 운영자 화면(요약)이
// 모두 같은 함수를 쓰므로 "화면에서는 완료인데 서버는 미완료" 같은 불일치가 생기지 않는다.
//
// 한 단계를 끝내려면 객관식 확인 문제를 전부 맞히면 된다. 주차 학습 완료는 핵심 단계만으로 판단하고,
// 보충 단계는 선택 기록, 심화 단계는 별도의 심화 달성 기록(src/lib/achievement.ts)으로 보여 준다. 서술형 문항(작성 → 모범답안과 비교 →
// 자기평가)과 실습은 권장 활동이며 완료 조건에는 넣지 않는다.
//
// 진행 방식(운영 설정, settingsStore)
// - warn(기본): 순서는 안내만 한다. 끝내지 않은 앞 단계가 있어도 다음 단계·백지공부·과제로 갈 수 있고,
//   화면에 미완료 경고를 보여 준다. 단계는 순서와 상관없이 완료할 수 있다.
// - lock: 앞 핵심 단계를 끝내야 다음 핵심 단계가 열리고, 핵심 단계를 모두 끝내야 백지공부·과제와 보충·심화 단계가 열린다.

export interface SectionProgress {
  checksDone: number;
  checksTotal: number;
  quizDone: number;
  quizTotal: number;
  hasPractice: boolean;
  ready: boolean;
  completed: boolean;
}

export function sectionProgress(section: WeekSection, state: SectionState): SectionProgress {
  const checksTotal = section.meta.checks.length;
  const checksDone = section.meta.checks.filter((c) => state.checks[c.id]?.correct).length;
  const quizTotal = section.meta.quizIds.length;
  const quizDone = section.meta.quizIds.filter((id) => !!state.answers[id]?.review).length;
  const hasPractice = section.practice.length > 0;
  // 서술형은 선택 사항이라 완료 조건에 넣지 않는다(진행 표시에는 quizDone/quizTotal로 보여 준다).
  const ready = checksDone === checksTotal;
  return {
    checksDone,
    checksTotal,
    quizDone,
    quizTotal,
    hasPractice,
    ready,
    completed: !!state.completedAt,
  };
}

/**
 * completed: 완료 / current: 지금 할 차례(끝내지 않은 첫 핵심 단계) /
 * upcoming: 아직 끝내지 않았지만 열려 있음 / locked: 잠김(lock 모드)
 */
export type SectionAccess = "completed" | "current" | "upcoming" | "locked";

export interface TierCount {
  done: number;
  total: number;
}

export interface WeekStatus {
  /** 본문 순서(핵심 → 보충 → 심화)대로 */
  sections: { section: WeekSection; access: SectionAccess; progress: SectionProgress }[];
  /** 핵심·보충·심화별 완료 수. 주차 완료는 핵심만으로 판단한다. */
  tiers: Record<Tier, TierCount>;
  /** 다음에 학습할 핵심 단계 (핵심을 모두 끝냈으면 undefined) */
  currentSection?: WeekSection;
  /** 핵심 단계를 모두 끝냈는가(= 주차 학습 완료) */
  coreDone: boolean;
  /** 백지공부·과제를 열 수 있는지(lock 모드에서는 핵심 단계 완료 후, warn 모드에서는 항상) */
  finaleOpen: boolean;
  mode: ProgressionMode;
  worksheetSubmitted: boolean;
  assignment: {
    status: "none" | Submission["status"];
    score: number | null;
    maxScore: number;
  };
  /** 핵심 단계 N개 + 백지공부 + 과제 제출 기준 진행률 */
  ratio: number;
}

// 단계 구분별 규칙
// - 핵심: 주차 완료 조건. lock 모드에서는 핵심 단계끼리 순서대로 열린다.
// - 보충·심화: 선택. lock 모드에서는 핵심 단계를 모두 끝내면 한꺼번에 열리고, 그 안에서는 순서를 강제하지 않는다.
//   warn 모드에서는 언제든 열 수 있다(핵심을 먼저 하라는 안내만 보여 준다).
export function weekStatus(
  week: WeekMeta,
  record: LearningRecord,
  submission?: Submission,
  mode: ProgressionMode = getProgressionMode()
): WeekStatus {
  const { sections } = getWeekOutline(week);
  const progressOf = (section: WeekSection) => sectionProgress(section, readSectionState(record, week.slug, section.id));
  const core = sections.filter((s) => s.tier === "core");
  const coreDone = core.every((s) => progressOf(s).completed);
  let blocked = false;
  const rows = sections.map((section) => {
    const progress = progressOf(section);
    let access: SectionAccess;
    if (section.tier !== "core") {
      if (progress.completed) access = "completed";
      else access = mode === "lock" && !coreDone ? "locked" : "upcoming";
    } else if (mode === "warn") {
      // 순서와 상관없이 완료한 단계는 완료로, 끝내지 않은 첫 핵심 단계가 "지금 할 차례"다.
      if (progress.completed) access = "completed";
      else if (!blocked) {
        access = "current";
        blocked = true;
      } else access = "upcoming";
    } else if (progress.completed && !blocked) access = "completed";
    else if (!blocked) {
      access = "current";
      blocked = true;
    } else access = "locked";
    return { section, access, progress };
  });
  const tiers = Object.fromEntries(
    TIER_ORDER.map((t) => {
      const inTier = rows.filter((r) => r.section.tier === t);
      return [t, { done: inTier.filter((r) => r.progress.completed).length, total: inTier.length }];
    })
  ) as Record<Tier, TierCount>;
  const worksheetSubmitted = !!readWorksheetState(record, week.slug).submittedAt;
  const grade = submission ? latestGrade(submission) : undefined;
  const assignmentStatus = submission ? submission.status : "none";
  const done = tiers.core.done + (worksheetSubmitted ? 1 : 0) + (submission ? 1 : 0);
  return {
    sections: rows,
    tiers,
    currentSection: rows.find((r) => r.access === "current")?.section,
    coreDone,
    finaleOpen: coreDone || mode === "warn",
    mode,
    worksheetSubmitted,
    assignment: {
      status: assignmentStatus,
      score: grade?.decision === "graded" ? grade.score : null,
      maxScore: week.assignmentMaxScore,
    },
    ratio: tiers.core.total === 0 ? 0 : done / (tiers.core.total + 2),
  };
}

/** 운영자는 콘텐츠 검수를 위해 잠금 없이 모든 단계를 볼 수 있다. warn 모드에서는 잠긴 단계가 없다. */
export function canOpenSection(status: WeekStatus, sectionId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const row = status.sections.find((r) => r.section.id === sectionId);
  return !!row && row.access !== "locked";
}

/**
 * 미완료 경고용: 이 단계를 보기 전에 끝내 두면 좋은 핵심 단계들.
 * 핵심 단계는 자기보다 앞의 핵심 단계, 보충·심화 단계는 끝내지 않은 모든 핵심 단계를 돌려준다.
 */
export function unfinishedBefore(status: WeekStatus, sectionId: string): WeekSection[] {
  const target = status.sections.find((r) => r.section.id === sectionId)?.section;
  if (!target) return [];
  const out: WeekSection[] = [];
  for (const row of status.sections) {
    if (row.section.id === sectionId) break;
    if (row.section.tier === "core" && row.access !== "completed") out.push(row.section);
  }
  return out;
}

export const ASSIGNMENT_STATUS_LABEL: Record<WeekStatus["assignment"]["status"], string> = {
  none: "미제출",
  submitted: "제출됨 · 채점 대기",
  graded: "채점 완료",
  revision: "재제출 요청",
};
