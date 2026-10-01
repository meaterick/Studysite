import "server-only";
import type { CodingExercise, LabQuizItem, WeekMeta } from "@/content/types";
import { getWeekLab } from "@/content/labs";
import { sectionLabel } from "@/content/tiers";
import { getWeekOutline } from "@/content/sections";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import type { ExerciseView } from "@/components/lab/CodingExercise";
import type { AutoTestView } from "@/components/lab/AutoTestPanel";
import type { LabWeekState, LabQuizState } from "./learningStore";
import type { WeekStatus } from "./study";

// 코딩 실습·퀴즈 콘텐츠를 화면용 데이터로 바꾼다. 문제 설명과 힌트는 신뢰할 수 있는 콘텐츠 문자열이라
// 서버에서 마크다운·수식까지 렌더링해 클라이언트 컴포넌트에 React 노드로 넘긴다.
// 퀴즈의 정답·해설은 공개 조건을 만족했을 때만 넘긴다. 모범 답안 코드는 서버 액션으로만 내려준다.

/** 단계 실습은 그 단계가 잠겨 있으면(lock 모드) 잠그고, 과제 심화 문제는 과제가 잠겨 있으면 잠근다. */
function lockReason(ex: CodingExercise, status: WeekStatus, isAdmin: boolean): string | undefined {
  if (isAdmin) return undefined;
  if (ex.sectionId) {
    const row = status.sections.find((r) => r.section.id === ex.sectionId);
    if (row?.access !== "locked") return undefined;
    return row.section.tier === "core" ? `${sectionLabel(row.section)}단계를 열면 풀 수 있습니다.` : "핵심 단계를 모두 마치면 풀 수 있습니다.";
  }
  return status.finaleOpen ? undefined : "핵심 단계를 모두 마치면 풀 수 있습니다.";
}

export function exerciseView(week: WeekMeta, ex: CodingExercise, lab: LabWeekState, status: WeekStatus, isAdmin: boolean): ExerciseView {
  const state = lab.exercises[ex.id];
  const section = ex.sectionId ? getWeekOutline(week).sections.find((s) => s.id === ex.sectionId) : undefined;
  return {
    slug: week.slug,
    id: ex.id,
    title: ex.title,
    tier: ex.tier,
    prompt: <BlocksRenderer blocks={parseMarkdown(ex.prompt)} />,
    starter: ex.starter,
    tests: ex.tests,
    hints: ex.hints.map((h, i) => <Inline key={i} text={h} />),
    section: section ? { label: sectionLabel(section), title: section.title, href: `/weeks/${week.slug}/sections/${section.id}` } : undefined,
    state: {
      attempts: state?.attempts ?? 0,
      bestPassed: state?.bestPassed ?? 0,
      hintsUsed: state?.hintsUsed ?? 0,
      passed: !!state?.passedAt,
    },
    locked: lockReason(ex, status, isAdmin),
  };
}

export function autoTestViews(week: WeekMeta): AutoTestView[] {
  const lab = getWeekLab(week.slug);
  if (!lab) return [];
  const titles = new Map(week.assignment.tasks.map((t, i) => [t.id, `과제 ${i + 1}. ${t.title}`]));
  return lab.assignment.autoTests.map((t) => ({ id: t.id, title: t.title, taskTitle: titles.get(t.taskId) ?? t.taskId, code: t.code, hint: t.hint ? <Inline text={t.hint} /> : undefined }));
}

/** 퀴즈 한 문항을 "끝냈다"고 보는 기준: 객관식·출력 예측은 정답(또는 정답 공개), 서술형은 자기평가까지 */
export function quizItemDone(item: LabQuizItem, state: LabQuizState | undefined): boolean {
  if (!state) return false;
  if (item.kind === "descriptive") return !!state.review;
  if (item.kind === "predict") return !!state.correct || !!state.revealed;
  return !!state.correct;
}

/** 다시 볼 문항: 객관식·출력 예측에서 한 번이라도 틀렸거나 정답을 본 문항, 서술형에서 보완 필요로 표시한 문항 */
export function quizItemWeak(item: LabQuizItem, state: LabQuizState | undefined): boolean {
  if (!state) return false;
  if (item.kind === "descriptive") return state.review === "incorrect";
  if (item.kind === "predict") return (state.revealed && !state.correct) || (!!state.correct && state.attempts > 1);
  return (state.wrong?.length ?? 0) > 0;
}

export interface LabProgress {
  exercisesPassed: number;
  exercisesTotal: number;
  quizDone: number;
  quizTotal: number;
  quizWeak: number;
  challengesPassed: number;
  challengesTotal: number;
}

export function labProgress(slug: string, lab: LabWeekState): LabProgress | undefined {
  const content = getWeekLab(slug);
  if (!content) return undefined;
  return {
    exercisesPassed: content.exercises.filter((e) => lab.exercises[e.id]?.passedAt).length,
    exercisesTotal: content.exercises.length,
    quizDone: content.quiz.filter((q) => quizItemDone(q, lab.quiz[q.id])).length,
    quizTotal: content.quiz.length,
    quizWeak: content.quiz.filter((q) => quizItemWeak(q, lab.quiz[q.id])).length,
    challengesPassed: content.assignment.challenges.filter((e) => lab.exercises[e.id]?.passedAt).length,
    challengesTotal: content.assignment.challenges.length,
  };
}

export const QUIZ_KIND_LABEL: Record<LabQuizItem["kind"], string> = {
  choice: "객관식",
  predict: "출력 예측",
  descriptive: "서술형",
};
