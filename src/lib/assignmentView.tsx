import "server-only";
import type { AssignmentSpec } from "@/content/types";
import { WEEKS } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import type { WorkspaceTaskView } from "@/components/assignment/Workspace";
import type { NotebookViewTask } from "@/components/assignment/NotebookView";

// 과제 명세를 화면용 데이터로 바꾼다. 과제 설명·답안 안내 문구는 콘텐츠(신뢰할 수 있는 문자열)라
// 서버에서 수식까지 렌더링해 클라이언트 컴포넌트에 React 노드로 넘긴다.

function Intro({ md }: { md: string }) {
  return <BlocksRenderer blocks={parseMarkdown(md)} />;
}

export function workspaceTasks(spec: AssignmentSpec): WorkspaceTaskView[] {
  return spec.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    optional: task.tier !== "core",
    tier: task.tier,
    intro: <Intro md={task.instructions} />,
    cells: task.cells.map((c) =>
      c.kind === "code"
        ? { id: c.id, kind: "code" as const, label: c.label, starter: c.starter }
        : {
            id: c.id,
            kind: "text" as const,
            prompt: <Inline text={c.prompt} />,
            placeholder: c.placeholder,
            minChars: c.minChars,
            template: c.template,
          }
    ),
  }));
}

export function notebookViewTasks(spec: AssignmentSpec, withIntro = true): NotebookViewTask[] {
  return spec.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    optional: task.tier !== "core",
    tier: task.tier,
    intro: withIntro ? <Intro md={task.instructions} /> : undefined,
    prompts: Object.fromEntries(task.cells.filter((c) => c.kind === "text").map((c) => [c.id, <Inline key={c.id} text={c.kind === "text" ? c.prompt : ""} />])),
    labels: Object.fromEntries(task.cells.filter((c) => c.kind === "code" && c.label).map((c) => [c.id, c.kind === "code" ? c.label ?? "" : ""])),
  }));
}

/** 7주차 RAG 과제에서 코드가 읽는 학습 자료 파일: /course/week1.md … /course/week8.md */
export function courseDocFiles(spec: AssignmentSpec): { path: string; content: string }[] | undefined {
  if (!spec.provideCourseDocs) return undefined;
  return WEEKS.map((w) => ({
    path: `/course/week${w.number}.md`,
    content: `# ${w.number}주차 · ${w.title}\n\n${w.conceptsMd}`,
  }));
}
