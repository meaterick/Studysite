import { redirect } from "next/navigation";
import { WEEKS } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import AssignmentForm from "@/components/AssignmentForm";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import { loadWeekPage } from "@/lib/weekPage";
import { latestGrade, latestVersion } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/study";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekAssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, submission, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/assignment`);
  if (!status.allSectionsDone && !isAdmin) redirect(`/weeks/${slug}?locked=finale`);
  const blocks = parseMarkdown(week.assignmentMd);
  const hasRunnableCode = blocks.some((b) => b.type === "code" && (b.lang === "python" || b.lang === "py"));
  const latest = submission ? latestVersion(submission) : undefined;
  const grade = submission ? latestGrade(submission) : undefined;
  const gradeIsCurrent = !!grade && !!latest && grade.version === latest.version;

  return (
    <WeekFrame week={week} status={status}>
      <div className="space-y-10">
        <section aria-labelledby="assignment-status" className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="assignment-status" className="text-base font-black text-ink">내 제출 상태</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                status.assignment.status === "graded"
                  ? "bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                  : status.assignment.status === "revision"
                    ? "bg-[color-mix(in_srgb,var(--status-serious)_16%,transparent)] text-[var(--status-serious)]"
                    : "bg-[var(--surface-card-2)] text-ink-secondary"
              }`}
            >
              {ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {week.dueNote} · 만점 {week.assignmentMaxScore}점
            {latest && ` · 최근 제출 v${latest.version} (${new Date(latest.submittedAt).toLocaleString("ko-KR")})`}
          </p>
          {grade && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-ink-muted">
                운영자 피드백{!gradeIsCurrent && " (이전 버전에 대한 채점 — 새 버전은 채점 대기 중)"}
              </p>
              <GradeView grade={grade} />
            </div>
          )}
        </section>

        <section id="assignment" className="scroll-mt-24">
          <h2 className="mb-1 text-xl font-black text-ink">과제 안내</h2>
          <p className="mb-4 text-sm text-ink-muted">
            {hasRunnableCode && "코드가 있는 실습은 한 번에 하나씩 공개됩니다 — 지금 것을 실행해보면 다음 실습이 열립니다. "}
            채점 기준을 먼저 읽고 시작하세요.
          </p>
          <BlocksRenderer blocks={blocks} docKey={`${slug}:assignment`} interactiveCode gateCode gateSlug={slug} />
        </section>

        <section aria-labelledby="submit-heading">
          <h2 id="submit-heading" className="mb-1 text-xl font-black text-ink">
            {submission ? "다시 제출하기" : "과제 제출하기"}
          </h2>
          <p className="mb-4 text-sm text-ink-muted">
            제출물은 운영자만 볼 수 있습니다. 채점이 끝나면 점수와 피드백이 위 &lsquo;내 제출 상태&rsquo;에 표시됩니다.
          </p>
          <AssignmentForm
            slug={slug}
            initialText={latest?.text ?? ""}
            initialLinks={latest?.links ?? []}
            resubmit={!!submission}
          />
        </section>

        {submission && (
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 text-xl font-black text-ink">제출 기록</h2>
            <div className="space-y-3">
              {[...submission.versions].reverse().map((version) => (
                <details
                  key={version.version}
                  open={version.version === latest?.version}
                  className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"
                >
                  <summary className="cursor-pointer text-sm font-bold text-ink">
                    v{version.version} · {new Date(version.submittedAt).toLocaleString("ko-KR")}
                  </summary>
                  <div className="mt-3">
                    <SubmissionVersionView submission={submission} version={version} />
                    {submission.grades
                      .filter((g) => g.version === version.version)
                      .map((g) => (
                        <div key={g.gradedAt} className="mt-3">
                          <GradeView grade={g} />
                        </div>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </WeekFrame>
  );
}
