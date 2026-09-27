import type { RubricCriterion } from "@/content/types";
import type { Submission, SubmissionGrade, SubmissionVersion } from "@/lib/submissionStore";

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
          <p className="text-xs font-bold text-ink-muted">제출 메모</p>
          <pre className="mt-1 max-h-[24rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border-hairline)] bg-page px-4 py-3 font-[inherit] text-sm leading-relaxed text-ink">
            {version.text}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">(제출 메모 없음)</p>
      )}
      {version.links.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted">참고 링크</p>
          <ul className="mt-1 space-y-1 text-sm">
            {version.links.map((link) => (
              <li key={link} className="break-all">
                <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--series-blue)] hover:underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {version.files.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted">첨부 파일</p>
          <ul className="mt-1 space-y-1 text-sm">
            {version.files.map((file) => (
              <li key={file.id}>
                <a
                  href={`/api/submissions/${submission.id}/files/${file.id}`}
                  className="font-medium text-[var(--series-blue)] hover:underline"
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
    <div
      className="rounded-lg border-l-4 px-4 py-3"
      style={{
        borderColor: revision ? "var(--status-serious)" : "var(--status-good)",
        background: `color-mix(in srgb, ${revision ? "var(--status-serious)" : "var(--status-good)"} 10%, transparent)`,
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-black text-ink">
          {revision ? "재제출 요청" : `${grade.score ?? "-"} / ${grade.maxScore}점`}
        </p>
        <p className="text-xs text-ink-muted">
          제출본 v{grade.version} · {new Date(grade.gradedAt).toLocaleString("ko-KR")} 채점
        </p>
      </div>
      {!revision && rubric && grade.criteria && (
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {rubric.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 rounded-md bg-[color-mix(in_srgb,var(--surface-card)_70%,transparent)] px-2.5 py-1">
              <span className="text-ink-secondary">{c.label}</span>
              <span className="shrink-0 font-bold text-ink">
                {grade.criteria?.[c.id] ?? "-"} / {c.points}
              </span>
            </li>
          ))}
        </ul>
      )}
      {grade.feedback && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">{grade.feedback}</p>
      )}
    </div>
  );
}
