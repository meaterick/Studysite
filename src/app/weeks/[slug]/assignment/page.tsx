import { redirect } from "next/navigation";
import { WEEKS } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import Workspace from "@/components/assignment/Workspace";
import NotebookView from "@/components/assignment/NotebookView";
import Link from "next/link";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import { loadWeekPage } from "@/lib/weekPage";
import { latestGrade, latestVersion, readNotebook } from "@/lib/submissionStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { findConversation, unreadCount } from "@/lib/chatStore";
import { mergeDraft } from "@/lib/notebook";
import { courseDocFiles, notebookViewTasks, workspaceTasks } from "@/lib/assignmentView";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/study";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { dueDateEnd, getSettings } from "@/lib/settingsStore";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import MarkFeedbackSeen from "@/components/feedback/MarkFeedbackSeen";
import { isGradeUnseen } from "@/lib/feedback";
import { getWeekLab } from "@/content/labs";
import CodingExercise from "@/components/lab/CodingExercise";
import { readLabState } from "@/lib/learningStore";
import { autoTestViews, exerciseView, labProgress } from "@/lib/labView";
import { sectionLabel } from "@/content/tiers";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekAssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, week, record, submission, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/assignment`);
  if (!status.finaleOpen && !isAdmin) redirect(`/weeks/${slug}?locked=finale`);

  const spec = week.assignment;
  const dueDate = getSettings().dueDates[slug];
  const latest = submission ? latestVersion(submission) : undefined;
  const grade = submission ? latestGrade(submission) : undefined;
  // 이 화면에서 채점 결과를 보면 피드백함 배지에서도 확인한 것으로 처리한다.
  const hasUnseenGrade = !!submission && submission.grades.some((g) => isGradeUnseen(record, submission.id, g.gradedAt));
  const gradeIsCurrent = !!grade && !!latest && grade.version === latest.version;
  const savedDraft = readDraft(user.id, slug);
  const fallback = !savedDraft && submission && latest ? readNotebook(submission, latest) : undefined;
  const draft = mergeDraft(spec, savedDraft ?? fallback);
  const unread = unreadCount(findConversation(user.id), "member");
  const viewTasks = notebookViewTasks(spec, false);
  const courseDocs = courseDocFiles(spec);
  const lab = getWeekLab(slug);
  const labState = readLabState(record, slug);
  const labStats = labProgress(slug, labState);

  return (
    <WeekFrame week={week} status={status} record={record} apply="assignment">
      <MarkFeedbackSeen hasNew={hasUnseenGrade} slug={slug} />
      {!isAdmin && (
        <UnfinishedWarning
          context="과제는 핵심 단계를 모두 마친 뒤에 하는 것을 권장합니다."
          items={status.sections
            .filter((r) => r.section.tier === "core" && r.access !== "completed")
            .map((r) => ({ label: sectionLabel(r.section), title: r.section.title, href: `/weeks/${slug}/sections/${r.section.id}` }))}
        />
      )}
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
            {dueDate ? `마감 ${formatDate(dueDateEnd(dueDate).toISOString())} 23:59` : week.dueNote} · 만점 {week.assignmentMaxScore}점
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
          <p className="mt-3 text-sm">
            <Link href="/chat" className="font-bold text-[var(--series-blue)] hover:underline">
              {unread > 0 ? `운영자의 새 메시지 ${unread}개 확인하기 →` : "과제하다 막히면 운영자에게 채팅으로 질문하기 →"}
            </Link>
          </p>
        </section>

        <section aria-labelledby="overview-heading">
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--series-blue)]">
            {week.number}주차 과제 <span className="rounded-md bg-[var(--series-blue)] px-1.5 py-0.5 text-[11px] font-black text-white">평가</span>
          </p>
          <h2 id="overview-heading" className="mt-1 text-2xl font-black text-ink">
            {spec.title}
          </h2>
          <div className="mt-3">
            <BlocksRenderer blocks={parseMarkdown(spec.summary)} />
          </div>
          {lab && lab.assignment.requirements.length > 0 && (
            <div className="mt-5 rounded-xl border border-[var(--series-aqua)]/50 bg-card p-4">
              <h3 className="text-sm font-black text-ink">요구사항</h3>
              <p className="mt-0.5 text-xs text-ink-muted">제출 전에 하나씩 확인하십시오. 표시한 항목은 작업 공간 아래의 자동 테스트로도 일부 확인할 수 있습니다.</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-secondary">
                {lab.assignment.requirements.map((r, i) => (
                  <li key={i}>
                    <Inline text={r} />
                  </li>
                ))}
              </ol>
            </div>
          )}
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
            autoTests={autoTestViews(week)}
          />
        </section>

        {lab && lab.assignment.challenges.length > 0 && (
          <section id="challenges" aria-labelledby="challenges-heading" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="challenges-heading" className="text-xl font-black text-ink">
                  심화 문제 (자동 채점)
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  과제 내용을 한 걸음 더 확장하는 선택 문제입니다. 제출본과는 별개로 이 자리에서 바로 채점되며, 점수에는 들어가지 않습니다. 과제의 심화 항목으로 발전시켜 제출해도 좋습니다.
                </p>
              </div>
              {labStats && (
                <p className="rounded-full bg-[var(--surface-card-2)] px-3 py-1 text-sm font-bold text-ink-secondary">
                  통과 {labStats.challengesPassed}/{labStats.challengesTotal}
                </p>
              )}
            </div>
            <div className="space-y-5">
              {lab.assignment.challenges.map((ex) => (
                <CodingExercise key={ex.id} view={exerciseView(week, ex, labState, status, isAdmin)} />
              ))}
            </div>
          </section>
        )}


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
