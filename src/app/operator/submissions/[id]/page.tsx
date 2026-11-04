import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findSubmission, latestGrade, latestVersion, readNotebook } from "@/lib/submissionStore";
import { findUserById } from "@/lib/userStore";
import { getLearningRecord, readWorksheetState } from "@/lib/learningStore";
import { weekStatus } from "@/lib/study";
import { findConversation, unreadCount } from "@/lib/chatStore";
import { courseDocFiles, notebookViewTasks } from "@/lib/assignmentView";
import { getWeek } from "@/content/weeks";
import { quizAnswers } from "@/content/quizAnswers";
import { Inline } from "@/components/MarkdownBlocks";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import NotebookView from "@/components/assignment/NotebookView";
import SubmissionVersionDetails from "@/components/assignment/SubmissionVersionDetails";
import GradeForm from "@/components/assignment/GradeForm";
import ChatPanel from "@/components/chat/ChatPanel";
import { conversationView } from "@/lib/chatView";
import { formatDateTime } from "@/lib/datetime";
import { autoTestViews } from "@/lib/labView";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

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
  const conversation = findConversation(submission.userId);
  const unread = unreadCount(conversation, "admin");
  const viewTasks = notebookViewTasks(spec, true);
  // 이전 제출본 모두에 같은 배열을 넘겨 화면 데이터에 한 번만 실리게 한다.
  const previousTasks = notebookViewTasks(spec, false);
  const courseDocs = courseDocFiles(spec);
  const currentGrade = grade && grade.version === latest.version ? grade : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/operator/submissions", label: "과제 채점" }}
        eyebrow={`${week.number}주차 · ${spec.title}`}
        title={`${student?.name ?? "(탈퇴한 사용자)"}님의 과제`}
        description={
          <span className="tabular-nums">
            {student?.email} · 핵심 {status.tiers.core.done}/{status.tiers.core.total} · 백지공부 {worksheet.submittedAt ? "제출" : "미제출"} · 제출 {submission.versions.length}회
          </span>
        }
        actions={
          student && (
            <>
              <Link href={`/operator/members/${student.id}`} className="btn btn-ghost btn-sm">
                학습 현황
              </Link>
              <a href="#chat-heading" className="btn btn-secondary btn-sm">
                채팅{unread > 0 ? ` · 새 메시지 ${unread}` : ""}
              </a>
            </>
          )
        }
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="mb-4 text-xl font-bold tracking-[-0.03em] text-ink">
              최신 제출본 v{latest.version}
              <span className="ml-2 text-sm font-normal tracking-normal text-ink-muted">{formatDateTime(latest.submittedAt)}</span>
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
                  autoTests={autoTestViews(week)}
                />
              ) : (
                <p className="text-sm text-ink-muted">이 제출본에는 작업 공간 기록이 없습니다(이전 방식으로 제출한 과제).</p>
              )}
            </div>
          </section>

          {submission.versions.length > 1 && (
            <section aria-labelledby="prev-heading">
              <h2 id="prev-heading" className="mb-3 text-xl font-bold tracking-[-0.03em] text-ink">
                이전 제출본
              </h2>
              <div className="rows border-y border-[var(--border-hairline)]">
                {submission.versions
                  .slice(0, -1)
                  .reverse()
                  .map((v) => {
                    const gs = submission.grades.filter((g) => g.version === v.version);
                    // 이전 제출본의 작업 공간은 펼칠 때 그 버전 하나만 받아 온다(SubmissionVersionDetails).
                    return (
                      <SubmissionVersionDetails
                        key={v.version}
                        className="group"
                        bodyClassName="space-y-3 pb-5"
                        summary={
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                            <span className="tabular-nums">
                              v{v.version} · {formatDateTime(v.submittedAt)}
                            </span>
                            <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                          </summary>
                        }
                        submissionId={submission.id}
                        version={v.version}
                        hasNotebook={!!v.notebookFile}
                        tasks={previousTasks}
                        taskComments={gs[gs.length - 1]?.taskComments}
                      >
                        {gs.map((g) => (
                          <GradeView key={g.gradedAt} grade={g} rubric={spec.rubric} />
                        ))}
                        <SubmissionVersionView submission={submission} version={v} />
                      </SubmissionVersionDetails>
                    );
                  })}
              </div>
            </section>
          )}

          {sampleDirection && (
            <section className="rounded-2xl bg-[var(--surface-card-2)] p-5 text-sm leading-relaxed text-ink-secondary sm:p-6">
              <p className="mb-2 text-xs font-medium text-ink-muted">채점 참고 · 모범 답안 방향</p>
              <Inline text={sampleDirection} />
            </section>
          )}

          {student && (
            <section aria-labelledby="chat-heading">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 id="chat-heading" className="text-xl font-bold tracking-[-0.03em] text-ink">
                  {student.name}님과의 채팅
                </h2>
                <Link href={`/operator/chat/${student.id}`} className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
                  크게 보기
                </Link>
              </div>
              <ChatPanel
                viewer="admin"
                targetUserId={student.id}
                initial={conversationView(student.id, "admin", conversation)}
                placeholder={`${student.name}님에게 보낼 메시지`}
                className="h-[480px]"
              />
            </section>
          )}

        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
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
              <h2 className="mb-3 text-[13px] font-medium text-ink-muted">채점 기록</h2>
              <div className="space-y-3">
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
