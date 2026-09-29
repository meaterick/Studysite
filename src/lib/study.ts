import "server-only";
import type { WeekMeta, WeekSection } from "@/content/types";
import { getWeekOutline } from "@/content/sections";
import { readSectionState, readWorksheetState, type LearningRecord, type SectionState } from "./learningStore";
import { latestGrade, type Submission } from "./submissionStore";

// 단계 진행 규칙을 한곳에 모아둔다 — 페이지(표시), 서버 액션(검증), 운영자 화면(요약)이
// 모두 같은 함수를 쓰므로 "화면에서는 완료인데 서버는 미완료" 같은 불일치가 생기지 않는다.
//
// 한 단계를 끝내려면 객관식 확인 문제를 전부 맞히면 된다. 서술형 문항(작성 → 모범답안과 비교 →
// 자기평가)과 실습은 권장 활동이며 완료 조건에는 넣지 않는다. 앞 단계를 끝내야 다음 단계가 열리고,
// 모든 단계를 끝내면 백지공부와 과제가 열린다.

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

export type SectionAccess = "completed" | "current" | "locked";

export interface WeekStatus {
  sections: { section: WeekSection; access: SectionAccess; progress: SectionProgress }[];
  sectionsDone: number;
  sectionsTotal: number;
  /** 다음에 학습할 단계 (모두 끝났으면 undefined) */
  currentSection?: WeekSection;
  allSectionsDone: boolean;
  worksheetSubmitted: boolean;
  assignment: {
    status: "none" | Submission["status"];
    score: number | null;
    maxScore: number;
  };
  /** 단계 N개 + 백지공부 + 과제 제출 기준 진행률 */
  ratio: number;
}

export function weekStatus(week: WeekMeta, record: LearningRecord, submission?: Submission): WeekStatus {
  const { sections } = getWeekOutline(week);
  let blocked = false;
  const rows = sections.map((section) => {
    const progress = sectionProgress(section, readSectionState(record, week.slug, section.id));
    let access: SectionAccess;
    if (progress.completed && !blocked) access = "completed";
    else if (!blocked) {
      access = "current";
      blocked = true;
    } else access = "locked";
    return { section, access, progress };
  });
  const sectionsDone = rows.filter((r) => r.access === "completed").length;
  const allSectionsDone = sectionsDone === sections.length;
  const worksheetSubmitted = !!readWorksheetState(record, week.slug).submittedAt;
  const grade = submission ? latestGrade(submission) : undefined;
  const assignmentStatus = submission ? submission.status : "none";
  const done = sectionsDone + (worksheetSubmitted ? 1 : 0) + (submission ? 1 : 0);
  return {
    sections: rows,
    sectionsDone,
    sectionsTotal: sections.length,
    currentSection: rows.find((r) => r.access === "current")?.section,
    allSectionsDone,
    worksheetSubmitted,
    assignment: {
      status: assignmentStatus,
      score: grade?.decision === "graded" ? grade.score : null,
      maxScore: week.assignmentMaxScore,
    },
    ratio: sections.length === 0 ? 0 : done / (sections.length + 2),
  };
}

/** 운영자는 콘텐츠 검수를 위해 잠금 없이 모든 단계를 볼 수 있다. */
export function canOpenSection(status: WeekStatus, sectionId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const row = status.sections.find((r) => r.section.id === sectionId);
  return !!row && row.access !== "locked";
}

export const ASSIGNMENT_STATUS_LABEL: Record<WeekStatus["assignment"]["status"], string> = {
  none: "미제출",
  submitted: "제출됨 · 채점 대기",
  graded: "채점 완료",
  revision: "재제출 요청",
};
