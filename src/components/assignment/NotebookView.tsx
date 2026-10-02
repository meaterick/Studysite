"use client";

import { useState, type ReactNode } from "react";
import CodeBlock from "@/components/CodeBlock";
import type { AssignmentDraft, NotebookOutput } from "@/lib/notebook";
import { resetNamespace, runPython, writeRuntimeFiles } from "@/lib/pyRunner";
import CellOutputs from "./CellOutputs";
import UserMarkdown from "./UserMarkdown";
import { formatDateTime } from "@/lib/datetime";
import AutoTestPanel, { type AutoTestView } from "@/components/lab/AutoTestPanel";
import TierBadge from "@/components/TierBadge";
import type { Tier } from "@/content/tiers";

export interface NotebookViewTask {
  id: string;
  title: string;
  optional: boolean;
  tier: Tier;
  intro?: ReactNode;
  prompts: Record<string, ReactNode>;
  labels: Record<string, string>;
}

/**
 * 제출된 작업 공간을 읽기 전용으로 보여 준다. "처음부터 다시 실행"은 제출된 코드를 빈 실행 환경에서
 * 순서대로 실행해, 저장된 출력이 실제로 재현되는지 운영자가 확인할 수 있게 한다.
 */
export default function NotebookView({
  tasks,
  notebook,
  taskComments,
  runKey,
  courseDocs,
  autoTests,
}: {
  tasks: NotebookViewTask[];
  notebook: AssignmentDraft;
  taskComments?: Record<string, string>;
  /** 다시 실행할 때 쓸 이름공간 식별자 (제출 id + 버전) */
  runKey: string;
  /** 과제 코드가 읽는 학습 자료 파일(7주차) */
  courseDocs?: { path: string; content: string }[];
  /** 다시 실행한 이름공간에서 돌릴 자동 테스트(운영자 화면) */
  autoTests?: AutoTestView[];
}) {
  const [fresh, setFresh] = useState<Record<string, NotebookOutput[]>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const rerun = async (): Promise<boolean> => {
    setRunning(true);
    setFresh({});
    const ns = `review:${runKey}`;
    await resetNamespace(ns);
    if (courseDocs?.length) await writeRuntimeFiles(courseDocs);
    let n = 0;
    try {
      for (const task of tasks) {
        for (const cell of notebook.tasks[task.id]?.cells ?? []) {
          if (cell.kind !== "code") continue;
          n++;
          setProgress(`${n}번째 코드 셀 실행 중…`);
          const outputs: NotebookOutput[] = [];
          const res = await runPython(
            cell.source,
            {
              onStream: (name, text) => {
                const last = outputs[outputs.length - 1];
                if (last && last.type === "stream" && last.name === name) last.text += `\n${text}`;
                else outputs.push({ type: "stream", name, text });
              },
            },
            { ns }
          );
          if (res.ok && res.result !== undefined) outputs.push({ type: "result", text: res.result });
          if (!res.ok) outputs.push({ type: "error", text: res.error ?? "오류" });
          for (const img of res.images ?? []) outputs.push({ type: "image", data: img });
          setFresh((prev) => ({ ...prev, [cell.id]: outputs }));
        }
      }
      setProgress("다시 실행을 마쳤습니다. 각 셀 아래에 새 실행 결과가 함께 표시됩니다.");
      return true;
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void rerun()}
          disabled={running}
          className="btn btn-secondary btn-sm"
        >
          {running ? "실행 중…" : "처음부터 다시 실행해 재현성 확인"}
        </button>
        {progress && <p className="text-xs text-ink-muted">{progress}</p>}
      </div>
      {autoTests && autoTests.length > 0 && (
        <AutoTestPanel
          ns={`review:${runKey}`}
          tests={autoTests}
          beforeRun={rerun}
          beforeRunLabel="▶ 처음부터 다시 실행 후 테스트"
          disabled={running}
          note="제출된 코드를 빈 실행 환경에서 다시 실행한 뒤 같은 자동 테스트를 돌려, 학습자 화면의 결과가 재현되는지 확인합니다. 자동 테스트는 채점 기준의 일부만 확인합니다."
        />
      )}
      {tasks.map((task, i) => {
        const cells = notebook.tasks[task.id]?.cells ?? [];
        const comment = taskComments?.[task.id];
        return (
          <section key={task.id} className="surface p-4">
            <h4 className="font-black text-ink">
              과제 {i + 1}. {task.title}
              <span className="ml-2 align-middle">
                <TierBadge tier={task.tier} compact />
              </span>
              {task.optional && <span className="ml-1 text-xs font-bold text-ink-muted">(선택)</span>}
            </h4>
            {task.intro && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-ink-muted">과제 설명 보기</summary>
                <div className="mt-2 text-sm">{task.intro}</div>
              </details>
            )}
            <div className="mt-3 space-y-3">
              {cells.length === 0 && <p className="text-sm text-ink-muted">작성한 내용이 없습니다.</p>}
              {cells.map((cell) =>
                cell.kind === "code" ? (
                  <div key={cell.id} className="overflow-hidden rounded-lg border border-[var(--border-hairline)]">
                    <p className="border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1 text-xs font-bold text-ink-muted">
                      {task.labels[cell.id] ?? (cell.custom ? "추가한 코드 셀" : "코드")}
                      {cell.executedAt
                        ? ` · ${formatDateTime(cell.executedAt)} 실행${cell.stale ? " (이후 수정됨)" : ""}${cell.runOk === false ? " · 오류" : ""}`
                        : " · 실행하지 않음"}
                    </p>
                    <CodeBlock lang="python" code={cell.source || " "} />
                    <CellOutputs outputs={cell.outputs} />
                    {fresh[cell.id] && (
                      <div>
                        <p className="bg-[#161b22] px-4 pt-2 text-[11px] font-bold text-[#8b949e]">다시 실행한 결과</p>
                        <CellOutputs outputs={fresh[cell.id]} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={cell.id} className="rounded-lg border border-[var(--border-hairline)] px-3 py-2">
                    {task.prompts[cell.id] && <div className="mb-2 text-xs font-bold text-ink-muted">{task.prompts[cell.id]}</div>}
                    <UserMarkdown source={cell.source} />
                  </div>
                )
              )}
            </div>
            {comment && (
              <div className="mt-3 rounded-lg border-l-4 border-[var(--series-orange)] bg-[color-mix(in_srgb,var(--series-orange)_8%,transparent)] px-3 py-2 text-sm">
                <p className="mb-1 text-xs font-bold text-[var(--series-orange)]">운영자 코멘트</p>
                <p className="whitespace-pre-wrap text-ink-secondary">{comment}</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
