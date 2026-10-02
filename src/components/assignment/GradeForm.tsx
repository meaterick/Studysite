"use client";

import Icon from "@/components/Icon";
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
    <div className="space-y-6 rounded-2xl border border-[var(--border-hairline)] bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">제출본 v{version} 채점</h2>
        {alreadyGraded && <p className="mt-1 text-xs text-ink-muted">다시 저장하면 새 채점 기록이 추가됩니다.</p>}
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-xs font-medium text-ink-muted">채점 기준 · 0.5점 단위</legend>
        <div className="rows border-y border-[var(--border-hairline)]">
        {rubric.map((c) => (
          <div key={c.id} className="py-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`score-${c.id}`} className="text-sm font-medium text-ink">
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
                  className="w-16 rounded-lg border border-[var(--border-strong)] bg-card px-2 py-1 text-right text-sm tabular-nums text-ink"
                />
                <span className="text-ink-muted">/ {c.points}</span>
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.guide}</p>
          </div>
        ))}
        </div>
        <p className="mt-3 text-right text-sm tabular-nums text-ink">
          합계 <span className="text-lg font-semibold">{total}</span> / {max}점
        </p>
      </fieldset>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
          과제별 코멘트 (선택)
          <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
          {tasks.map((t, i) => (
            <div key={t.id}>
              <label htmlFor={`comment-${t.id}`} className="text-xs text-ink-muted">
                과제 {i + 1}. {t.title}
              </label>
              <textarea
                id={`comment-${t.id}`}
                rows={2}
                maxLength={2000}
                value={comments[t.id] ?? ""}
                onChange={(e) => setComments((prev) => ({ ...prev, [t.id]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-card px-3 py-2 text-sm text-ink"
              />
            </div>
          ))}
        </div>
      </details>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-ink">
          전체 피드백
        </label>
        <p className="mt-0.5 text-xs text-ink-muted">잘한 점 1개, 개선할 점 1~2개</p>
        <textarea
          id="feedback"
          rows={7}
          maxLength={5000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-card px-4 py-3 text-sm leading-relaxed text-ink"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("graded")}
          disabled={pending || !allScored}
          className="btn btn-primary"
        >
          채점 완료
        </button>
        <button
          type="button"
          onClick={() => submit("revision")}
          disabled={pending}
          className="btn btn-secondary text-[var(--status-serious)]"
        >
          재제출 요청
        </button>
      </div>
      {!allScored && <p className="text-xs text-ink-muted">모든 기준에 점수를 넣으면 채점을 완료할 수 있습니다.</p>}
      {message && (
        <p className={`text-sm font-medium ${message.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
