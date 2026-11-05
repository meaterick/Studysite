import "server-only";
import type { AssignmentSource, Exercise } from "@/content/types";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import type { ExerciseView } from "@/components/lab/CodingExercise";
import type { AutoTestView } from "@/components/lab/AutoTestPanel";
import type { LearningRecord } from "./learningStore";

// 코딩 실습 콘텐츠를 화면용 데이터로 바꾼다. 문제 설명과 힌트는 신뢰할 수 있는 콘텐츠 문자열이라 서버에서
// 마크다운·수식까지 렌더링해 클라이언트 컴포넌트에 React 노드로 넘긴다. 모범 답안 코드는 서버 액션으로만 내려준다.

export function exerciseView(id: string, exercise: Exercise, record: LearningRecord, label?: string, locked?: string): ExerciseView {
  const state = record.exercises[id];
  return {
    id,
    title: exercise.title,
    label,
    prompt: <BlocksRenderer blocks={parseMarkdown(exercise.prompt)} />,
    starter: exercise.starter,
    tests: exercise.tests,
    hints: exercise.hints.map((h, i) => <Inline key={i} text={h} />),
    state: {
      attempts: state?.attempts ?? 0,
      bestPassed: state?.bestPassed ?? 0,
      hintsUsed: state?.hintsUsed ?? 0,
      passed: !!state?.passedAt,
    },
    locked,
  };
}

export function autoTestViews(assignment: AssignmentSource): AutoTestView[] {
  const titles = new Map(assignment.tasks.map((t, i) => [t.id, `과제 ${i + 1}. ${t.title}`]));
  return assignment.autoTests.map((t) => ({ id: t.id, title: t.title, taskTitle: titles.get(t.taskId) ?? t.taskId, code: t.code, hint: t.hint ? <Inline text={t.hint} /> : undefined }));
}
