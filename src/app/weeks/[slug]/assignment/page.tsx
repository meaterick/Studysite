import { redirect } from "next/navigation";
import { WEEKS } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import Workspace from "@/components/assignment/Workspace";
import NotebookView from "@/components/assignment/NotebookView";
import AssignmentThread from "@/components/assignment/AssignmentThread";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import { loadWeekPage } from "@/lib/weekPage";
import { latestGrade, latestVersion, readNotebook } from "@/lib/submissionStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { findThread, unreadCount } from "@/lib/threadStore";
import { mergeDraft } from "@/lib/notebook";
import { courseDocFiles, notebookViewTasks, workspaceTasks } from "@/lib/assignmentView";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/study";
import { formatDateTime } from "@/lib/datetime";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekAssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, week, submission, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/assignment`);
  if (!status.allSectionsDone && !isAdmin) redirect(`/weeks/${slug}?locked=finale`);

  const spec = week.assignment;
  const latest = submission ? latestVersion(submission) : undefined;
  const grade = submission ? latestGrade(submission) : undefined;
  const gradeIsCurrent = !!grade && !!latest && grade.version === latest.version;
  const savedDraft = readDraft(user.id, slug);
  const fallback = !savedDraft && submission && latest ? readNotebook(submission, latest) : undefined;
  const draft = mergeDraft(spec, savedDraft ?? fallback);
  const thread = findThread(user.id, slug);
  const unread = unreadCount(thread, "member");
  const viewTasks = notebookViewTasks(spec, false);
  const courseDocs = courseDocFiles(spec);

  return (
    <WeekFrame week={week} status={status}>
      <div className="space-y-10">
        <section aria-labelledby="assignment-status" className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="assignment-status" className="text-base font-black text-ink">
              내 과제 상태
            </h2>
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
            {latest && ` · 최근 제출본 v${latest.version} (${formatDateTime(latest.submittedAt)})`}
          </p>
          {grade && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-ink-muted">
                운영자 채점{!gradeIsCurrent && " (이전 제출본에 대한 결과이며, 새 제출본은 채점을 기다리고 있습니다)"}
              </p>
              <GradeView grade={grade} rubric={spec.rubric} />
              {grade.taskComments && Object.keys(grade.taskComments).length > 0 && (
                <p className="mt-2 text-xs text-ink-muted">과제별 코멘트는 아래 &lsquo;제출 기록&rsquo;의 해당 제출본에서 확인할 수 있습니다.</p>
              )}
            </div>
          )}
          {unread > 0 && (
            <p className="mt-3 text-sm font-bold text-[var(--series-orange)]">
              <a href="#thread" className="hover:underline">
                운영자의 새 메시지가 {unread}개 있습니다 →
              </a>
            </p>
          )}
        </section>

        <section aria-labelledby="overview-heading">
          <p className="text-sm font-bold text-[var(--series-blue)]">{week.number}주차 과제</p>
          <h2 id="overview-heading" className="mt-1 text-2xl font-black text-ink">
            {spec.title}
          </h2>
          <div className="mt-3">
            <BlocksRenderer blocks={parseMarkdown(spec.summary)} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <h3 className="text-sm font-black text-ink">채점 기준 ({week.assignmentMaxScore}점)</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {spec.rubric.map((c) => (
                  <li key={c.id}>
                    <p className="flex justify-between gap-3 font-bold text-ink">
                      <span>{c.label}</span>
                      <span className="shrink-0">{c.points}점</span>
                    </p>
                    <p className="text-ink-muted">
                      <Inline text={c.guide} />
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 text-sm text-ink-secondary">
              <h3 className="text-sm font-black text-ink">작업 방법</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>과제는 모두 이 페이지에서 진행합니다. 코드는 브라우저에서 실행되며, 별도 설치가 필요하지 않습니다.</li>
                <li>코드 셀은 위에서부터 차례로 실행합니다. 셀끼리 변수를 공유하므로 앞 셀을 먼저 실행해야 합니다. 단축키는 Shift+Enter입니다.</li>
                <li>작성한 내용은 서버에 자동 저장되므로 다른 기기에서도 이어서 작업할 수 있습니다. Ctrl+S로 즉시 저장할 수도 있습니다.</li>
                <li>답안은 마크다운으로 작성합니다. 표, 목록, 수식($…$)을 쓸 수 있으며 미리보기로 확인할 수 있습니다.</li>
                <li>matplotlib으로 그린 그래프는 실행 결과에 그림으로 저장되어 제출본에 함께 포함됩니다.</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="workspace-heading">
          <h2 id="workspace-heading" className="mb-4 text-xl font-black text-ink">
            작업 공간
          </h2>
          <Workspace
            slug={slug}
            spec={spec}
            tasks={workspaceTasks(spec)}
            initialDraft={draft}
            savedAt={savedDraft?.updatedAt}
            courseDocs={courseDocs}
            resubmit={!!submission}
          />
        </section>

        <section id="thread" aria-labelledby="thread-heading" className="scroll-mt-24">
          <h2 id="thread-heading" className="mb-1 text-xl font-black text-ink">
            질문과 피드백
          </h2>
          <p className="mb-4 text-sm text-ink-muted">운영자와 과제에 관한 메시지를 주고받습니다. 다른 스터디원에게는 보이지 않습니다.</p>
          <AssignmentThread
            slug={slug}
            viewer="member"
            unread={unread}
            messages={(thread?.messages ?? []).map((m) => ({ id: m.id, authorName: m.authorName, role: m.role, text: m.text, createdAt: m.createdAt }))}
          />
        </section>

        {submission && (
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 text-xl font-black text-ink">
              제출 기록
            </h2>
            <div className="space-y-3">
              {[...submission.versions].reverse().map((version) => {
                const notebook = readNotebook(submission, version);
                const versionGrades = submission.grades.filter((g) => g.version === version.version);
                const lastGrade = versionGrades[versionGrades.length - 1];
                return (
                  <details
                    key={version.version}
                    open={version.version === latest?.version}
                    className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"
                  >
                    <summary className="cursor-pointer text-sm font-bold text-ink">
                      제출본 v{version.version} · {formatDateTime(version.submittedAt)}
                      {lastGrade && (lastGrade.decision === "graded" ? ` · ${lastGrade.score}/${lastGrade.maxScore}점` : " · 재제출 요청")}
                    </summary>
                    <div className="mt-3 space-y-4">
                      {versionGrades.map((g) => (
                        <GradeView key={g.gradedAt} grade={g} rubric={spec.rubric} />
                      ))}
                      <SubmissionVersionView submission={submission} version={version} />
                      {notebook && (
                        <NotebookView
                          tasks={viewTasks}
                          notebook={notebook}
                          taskComments={lastGrade?.taskComments}
                          runKey={`${submission.id}:${version.version}`}
                          courseDocs={version.version === latest?.version ? courseDocs : undefined}
                        />
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </WeekFrame>
  );
}
