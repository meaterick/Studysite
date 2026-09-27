"use client";

import { useState, useTransition } from "react";
import type { RubricCriterion } from "@/content/types";
import { gradeAssignment } from "@/lib/assignmentActions";

/** 운영자 채점 양식. 채점 기준별 점수를 합산하고, 과제별 코멘트와 전체 피드백을 남긴다. */
export default function GradeForm({
  submissionId,
  version,
  rubric,
  tasks,
  initial,
  alreadyGraded,
}: {
  submissionId: string;
  version: number;
  rubric: RubricCriterion[];
  tasks: { id: string; title: string }[];
  initial?: { criteria?: Record<string, number>; taskComments?: Record<string, string>; feedback?: string };
  alreadyGraded: boolean;
}) {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(rubric.map((c) => [c.id, initial?.criteria?.[c.id] !== undefined ? String(initial.criteria[c.id]) : ""]))
  );
  const [comments, setComments] = useState<Record<string, string>>(initial?.taskComments ?? {});
  const [feedback, setFeedback] = useState(initial?.feedback ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const max = rubric.reduce((a, c) => a + c.points, 0);
  const total = rubric.reduce((a, c) => a + (Number(scores[c.id]) || 0), 0);
  const allScored = rubric.every((c) => scores[c.id] !== "");

  const submit = (decision: "graded" | "revision") => {
    setMessage(null);
    const criteria: Record<string, number | null> = {};
    for (const c of rubric) criteria[c.id] = scores[c.id] === "" ? null : Number(scores[c.id]);
    startTransition(async () => {
      try {
        const result = await gradeAssignment(submissionId, { decision, criteria, taskComments: comments, feedback });
        setMessage(
          result.ok
            ? { tone: "ok", text: decision === "graded" ? "채점 결과를 저장했습니다. 스터디원의 과제 페이지에 바로 표시됩니다." : "재제출을 요청했습니다." }
            : { tone: "error", text: result.error }
        );
      } catch {
        setMessage({ tone: "error", text: "저장하지 못했습니다. 잠시 후 다시 시도해 주십시오." });
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--series-orange)] bg-card p-5">
      <div>
        <h2 className="text-base font-black text-ink">제출본 v{version} 채점</h2>
        {alreadyGraded && <p className="mt-1 text-xs text-ink-muted">이미 채점한 제출본입니다. 다시 저장하면 새 채점 기록이 추가됩니다.</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-ink">채점 기준별 점수 (0.5점 단위)</legend>
        {rubric.map((c) => (
          <div key={c.id} className="rounded-md border border-[var(--border-hairline)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`score-${c.id}`} className="text-sm font-bold text-ink-secondary">
                {c.label}
              </label>
              <span className="flex items-center gap-1 text-sm">
                <input
                  id={`score-${c.id}`}
                  type="number"
                  min={0}
                  max={c.points}
                  step={0.5}
                  value={scores[c.id]}
                  onChange={(e) => setScores((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  className="w-16 rounded-md border border-[var(--border-hairline)] bg-page px-2 py-1 text-right text-sm text-ink"
                />
                <span className="text-ink-muted">/ {c.points}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">{c.guide}</p>
          </div>
        ))}
        <p className="text-right text-sm font-black text-ink">
          합계 {total} / {max}점
        </p>
      </fieldset>

      <details className="rounded-md border border-[var(--border-hairline)] px-3 py-2">
        <summary className="cursor-pointer text-sm font-bold text-ink-secondary">과제별 코멘트 (선택)</summary>
        <div className="mt-2 space-y-2">
          {tasks.map((t, i) => (
            <div key={t.id}>
              <label htmlFor={`comment-${t.id}`} className="text-xs font-bold text-ink-muted">
                과제 {i + 1}. {t.title}
              </label>
              <textarea
                id={`comment-${t.id}`}
                rows={2}
                maxLength={2000}
                value={comments[t.id] ?? ""}
                onChange={(e) => setComments((prev) => ({ ...prev, [t.id]: e.target.value }))}
                className="mt-0.5 w-full rounded-md border border-[var(--border-hairline)] bg-page px-2 py-1.5 text-sm text-ink"
              />
            </div>
          ))}
        </div>
      </details>

      <div>
        <label htmlFor="feedback" className="block text-sm font-bold text-ink">
          전체 피드백
        </label>
        <p className="text-xs text-ink-muted">잘한 점 1개와 개선할 점 1~2개를 채점 기준에 맞춰 구체적으로 적습니다.</p>
        <textarea
          id="feedback"
          rows={7}
          maxLength={5000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("graded")}
          disabled={pending || !allScored}
          className="rounded-md bg-[var(--status-good)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          채점 완료
        </button>
        <button
          type="button"
          onClick={() => submit("revision")}
          disabled={pending}
          className="rounded-md border border-[var(--status-serious)] px-4 py-2 text-sm font-bold text-[var(--status-serious)] hover:bg-[color-mix(in_srgb,var(--status-serious)_10%,transparent)] disabled:opacity-40"
        >
          재제출 요청
        </button>
      </div>
      {!allScored && <p className="text-xs text-ink-muted">모든 채점 기준에 점수를 입력하면 채점을 완료할 수 있습니다.</p>}
      {message && (
        <p className={`text-sm font-medium ${message.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
