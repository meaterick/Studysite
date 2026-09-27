import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findSubmission, latestGrade, latestVersion, readNotebook } from "@/lib/submissionStore";
import { findUserById } from "@/lib/userStore";
import { getLearningRecord, readWorksheetState } from "@/lib/learningStore";
import { weekStatus } from "@/lib/study";
import { findThread, unreadCount } from "@/lib/threadStore";
import { courseDocFiles, notebookViewTasks } from "@/lib/assignmentView";
import { getWeek } from "@/content/weeks";
import { quizAnswers } from "@/content/quizAnswers";
import { Inline } from "@/components/MarkdownBlocks";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import NotebookView from "@/components/assignment/NotebookView";
import GradeForm from "@/components/assignment/GradeForm";
import AssignmentThread from "@/components/assignment/AssignmentThread";
import { formatDateTime } from "@/lib/datetime";

export const metadata = { title: "과제 채점" };

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/operator/submissions");
  const { id } = await params;
  const submission = findSubmission(id);
  if (!submission) notFound();
  const week = getWeek(submission.weekSlug);
  if (!week) notFound();
  const spec = week.assignment;
  const student = findUserById(submission.userId);
  const record = getLearningRecord(submission.userId);
  const status = weekStatus(week, record, submission);
  const worksheet = readWorksheetState(record, week.slug);
  const latest = latestVersion(submission);
  const grade = latestGrade(submission);
  const sampleDirection = quizAnswers.find((a) => a.week === week.number)?.sampleDirection;
  const notebook = readNotebook(submission, latest);
  const thread = findThread(submission.userId, week.slug);
  const viewTasks = notebookViewTasks(spec, true);
  const courseDocs = courseDocFiles(spec);
  const currentGrade = grade && grade.version === latest.version ? grade : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/operator/submissions" className="text-sm font-bold text-[var(--series-orange)] hover:underline">
        ← 과제 채점 목록
      </Link>
      <p className="mt-5 text-sm font-bold text-[var(--series-orange)]">
        운영자 전용 · {week.number}주차 {spec.title}
      </p>
      <h1 className="mt-1 text-3xl font-black text-ink">{student?.name ?? "(탈퇴한 사용자)"}님의 과제</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        {student?.email} · 단계 {status.sectionsDone}/{status.sectionsTotal} · 백지공부 {worksheet.submittedAt ? "제출" : "미제출"} · 제출{" "}
        {submission.versions.length}회
        {student && (
          <>
            {" · "}
            <Link href={`/operator/members/${student.id}`} className="font-bold text-[var(--series-orange)] hover:underline">
              학습 현황 보기
            </Link>
          </>
        )}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="mb-3 text-lg font-black text-ink">
              최신 제출본 v{latest.version}{" "}
              <span className="text-sm font-medium text-ink-muted">· {formatDateTime(latest.submittedAt)}</span>
            </h2>
            <div className="space-y-4">
              <SubmissionVersionView submission={submission} version={latest} />
              {notebook ? (
                <NotebookView
                  tasks={viewTasks}
                  notebook={notebook}
                  taskComments={currentGrade?.taskComments}
                  runKey={`${submission.id}:${latest.version}`}
                  courseDocs={courseDocs}
                />
              ) : (
                <p className="text-sm text-ink-muted">이 제출본에는 작업 공간 기록이 없습니다(이전 방식으로 제출한 과제).</p>
              )}
            </div>
          </section>

          {submission.versions.length > 1 && (
            <section aria-labelledby="prev-heading">
              <h2 id="prev-heading" className="mb-3 text-lg font-black text-ink">
                이전 제출본
              </h2>
              <div className="space-y-3">
                {submission.versions
                  .slice(0, -1)
                  .reverse()
                  .map((v) => {
                    const nb = readNotebook(submission, v);
                    const gs = submission.grades.filter((g) => g.version === v.version);
                    return (
                      <details key={v.version} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
                        <summary className="cursor-pointer text-sm font-bold text-ink">
                          v{v.version} · {formatDateTime(v.submittedAt)}
                        </summary>
                        <div className="mt-3 space-y-3">
                          {gs.map((g) => (
                            <GradeView key={g.gradedAt} grade={g} rubric={spec.rubric} />
                          ))}
                          <SubmissionVersionView submission={submission} version={v} />
                          {nb && (
                            <NotebookView
                              tasks={notebookViewTasks(spec, false)}
                              notebook={nb}
                              taskComments={gs[gs.length - 1]?.taskComments}
                              runKey={`${submission.id}:${v.version}`}
                            />
                          )}
                        </div>
                      </details>
                    );
                  })}
              </div>
            </section>
          )}

          {sampleDirection && (
            <section className="rounded-xl border border-dashed border-[var(--series-orange)] p-4 text-sm text-ink-secondary">
              <p className="mb-1 text-xs font-bold text-[var(--series-orange)]">채점 참고: 모범 답안 방향 (운영자 전용)</p>
              <Inline text={sampleDirection} />
            </section>
          )}

          <section aria-labelledby="thread-heading">
            <h2 id="thread-heading" className="mb-3 text-lg font-black text-ink">
              질문과 피드백
            </h2>
            <AssignmentThread
              slug={week.slug}
              viewer="admin"
              targetUserId={submission.userId}
              unread={unreadCount(thread, "admin")}
              messages={(thread?.messages ?? []).map((m) => ({ id: m.id, authorName: m.authorName, role: m.role, text: m.text, createdAt: m.createdAt }))}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <GradeForm
            submissionId={submission.id}
            version={latest.version}
            rubric={spec.rubric}
            tasks={spec.tasks.map((t) => ({ id: t.id, title: t.title }))}
            initial={currentGrade ? { criteria: currentGrade.criteria, taskComments: currentGrade.taskComments, feedback: currentGrade.feedback } : undefined}
            alreadyGraded={!!currentGrade}
          />
          {submission.grades.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-black text-ink">채점 기록</h2>
              <div className="space-y-2">
                {[...submission.grades].reverse().map((g) => (
                  <div key={g.gradedAt}>
                    <GradeView grade={g} rubric={spec.rubric} />
                    <p className="mt-1 text-right text-[11px] text-ink-muted">채점자 {g.gradedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
