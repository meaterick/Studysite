import type { Submission, SubmissionGrade, SubmissionVersion } from "@/lib/submissionStore";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 제출 버전 하나(본문·링크·첨부)를 보여준다. 본문은 HTML로 해석하지 않고 그대로 표시한다. */
export function SubmissionVersionView({ submission, version }: { submission: Submission; version: SubmissionVersion }) {
  return (
    <div className="space-y-3">
      {version.text ? (
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border-hairline)] bg-page px-4 py-3 font-mono text-[13px] leading-relaxed text-ink">
          {version.text}
        </pre>
      ) : (
        <p className="text-sm text-ink-muted">(본문 없음)</p>
      )}
      {version.links.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted">링크</p>
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

export function GradeView({ grade }: { grade: SubmissionGrade }) {
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
          v{grade.version} 채점 · {new Date(grade.gradedAt).toLocaleString("ko-KR")}
        </p>
      </div>
      {grade.feedback && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">{grade.feedback}</p>
      )}
    </div>
  );
}
