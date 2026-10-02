import type { RubricCriterion } from "@/content/types";
import type { Submission, SubmissionGrade, SubmissionVersion } from "@/lib/submissionStore";
import { formatDateTime } from "@/lib/datetime";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 제출 버전의 메모·링크·첨부 파일을 보여 준다. 메모는 HTML로 해석하지 않고 그대로 표시한다. */
export function SubmissionVersionView({ submission, version }: { submission: Submission; version: SubmissionVersion }) {
  return (
    <div className="space-y-3">
      {version.text ? (
        <div>
          <p className="text-xs font-medium text-ink-muted">제출 메모</p>
          <pre className="mt-2 max-h-[24rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--surface-card-2)] px-4 py-3 font-[inherit] text-sm leading-relaxed text-ink">
            {version.text}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">(제출 메모 없음)</p>
      )}
      {version.links.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted">참고 링크</p>
          <ul className="mt-1 space-y-1 text-sm">
            {version.links.map((link) => (
              <li key={link} className="break-all">
                <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--accent)] hover:underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {version.files.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted">첨부 파일</p>
          <ul className="mt-1 space-y-1 text-sm">
            {version.files.map((file) => (
              <li key={file.id}>
                <a
                  href={`/api/submissions/${submission.id}/files/${file.id}`}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {file.name}
                </a>
                <span className="ml-2 text-xs text-ink-muted">{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GradeView({ grade, rubric }: { grade: SubmissionGrade; rubric?: RubricCriterion[] }) {
  const revision = grade.decision === "revision";
  return (
    <div className="rounded-2xl border border-[var(--border-hairline)] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {revision ? (
          <p className="text-lg font-semibold tracking-[-0.02em] text-[var(--status-serious)]">재제출 요청</p>
        ) : (
          <p className="text-[2rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-ink">
            {grade.score ?? "-"}
            <span className="ml-1 text-base font-medium tracking-normal text-ink-muted">/ {grade.maxScore}점</span>
          </p>
        )}
        <p className="text-xs text-ink-muted">
          v{grade.version} · {formatDateTime(grade.gradedAt)} 채점
        </p>
      </div>
      {!revision && rubric && grade.criteria && (
        <dl className="rows mt-5 border-t border-[var(--border-hairline)] text-sm">
          {rubric.map((c) => (
            <div key={c.id} className="flex justify-between gap-3 py-2.5">
              <dt className="text-ink-secondary">{c.label}</dt>
              <dd className="shrink-0 tabular-nums text-ink">
                {grade.criteria?.[c.id] ?? "-"} <span className="text-ink-muted">/ {c.points}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {grade.feedback && <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-body">{grade.feedback}</p>}
    </div>
  );
}
