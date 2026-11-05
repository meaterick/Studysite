import { notFound, redirect } from "next/navigation";
import { MODULES, itemId } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import Workspace from "@/components/assignment/Workspace";
import NotebookView from "@/components/assignment/NotebookView";
import SubmissionVersionDetails from "@/components/assignment/SubmissionVersionDetails";
import Link from "next/link";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";
import { loadModulePage } from "@/lib/modulePage";
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
import CodingExercise from "@/components/lab/CodingExercise";
import { autoTestViews, exerciseView } from "@/lib/labView";
import { lessonLabel } from "@/content/tiers";
import { assignmentHref, lessonHref, moduleHref } from "@/lib/routes";
import Icon from "@/components/Icon";

export function generateStaticParams() {
  return MODULES.filter((m) => m.assignment).map((m) => ({ module: m.slug }));
}

const KIND_LABEL = { module: "모듈 과제", track: "트랙 프로젝트", capstone: "캡스톤" } as const;

export default async function AssignmentPage({ params }: PageProps<"/modules/[module]/assignment">) {
  const { module: slug } = await params;
  const { user, module, record, submission, status, isAdmin } = await loadModulePage(slug, assignmentHref(slug));
  const spec = module.assignment;
  if (!spec) notFound();
  if (!status.finaleOpen && !isAdmin) redirect(`${moduleHref(slug)}?locked=finale`);
  const key = spec.key;
  const dueDate = getSettings().dueDates[key];
  const latest = submission ? latestVersion(submission) : undefined;
  const grade = submission ? latestGrade(submission) : undefined;
  // 이 화면에서 채점 결과를 보면 피드백함 배지에서도 확인한 것으로 처리한다.
  const hasUnseenGrade = !!submission && submission.grades.some((g) => isGradeUnseen(record, submission.id, g.gradedAt));
  const gradeIsCurrent = !!grade && !!latest && grade.version === latest.version;
  const savedDraft = readDraft(user.id, key);
  // 최신 제출본의 작업 공간만 읽는다(제출 기록에 그리고, 초안이 없으면 작업 공간의 시작점으로도 쓴다).
  const latestNotebook = submission && latest ? readNotebook(submission, latest) : undefined;
  const draft = mergeDraft(spec, savedDraft ?? latestNotebook);
  const unread = unreadCount(findConversation(user.id), "member");
  const viewTasks = notebookViewTasks(spec, false);
  const courseDocs = courseDocFiles(spec);
  const challengesPassed = spec.challenges.filter((c) => record.exercises[itemId(key, c.key)]?.passedAt).length;

  return (
    <ModuleFrame status={status} compact>
      <MarkFeedbackSeen hasNew={hasUnseenGrade} assignmentKey={key} />
      {!isAdmin && (
        <UnfinishedWarning
          context="과제는 핵심 레슨을 모두 마친 뒤에 하는 것을 권장합니다."
          items={status.lessons
            .filter((r) => r.lesson.tier === "core" && r.access !== "completed")
            .map((r) => ({ label: lessonLabel(r.lesson), title: r.lesson.title, href: lessonHref(slug, r.lesson.id) }))}
        />
      )}
      <div className="space-y-16">
        <header aria-labelledby="overview-heading">
          <p className="text-[13px] text-ink-muted">
            {module.code} {KIND_LABEL[spec.kind]} · 만점 {spec.maxScore}점{dueDate ? ` · 마감 ${formatDate(dueDateEnd(dueDate).toISOString())} 23:59` : ""}
          </p>
          <h2 id="overview-heading" className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.035em] text-ink sm:text-[2rem]">
            {spec.title}
          </h2>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="pill" style={{ ["--pill" as string]: status.assignment!.status === "graded" ? "var(--status-good)" : status.assignment!.status === "revision" ? "var(--status-serious)" : status.assignment!.status === "none" ? "var(--text-muted)" : "var(--accent)" }}>
              {ASSIGNMENT_STATUS_LABEL[status.assignment!.status]}
            </span>
            {latest && (
              <span className="text-[13px] text-ink-muted">
                최근 제출 v{latest.version} · {formatDateTime(latest.submittedAt)}
              </span>
            )}
            <Link href="/chat" className="btn btn-ghost btn-sm ml-auto -mr-3">
              <Icon name="message" size={15} />
              {unread > 0 ? `운영자 새 메시지 ${unread}` : "운영자에게 질문"}
            </Link>
          </div>
        </header>

        {grade && (
          <section aria-labelledby="grade-heading">
            <h3 id="grade-heading" className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-ink-muted">
              운영자 채점
              {!gradeIsCurrent && <span className="pill">이전 제출본 · 새 제출본 채점 대기</span>}
            </h3>
            <GradeView grade={grade} rubric={spec.rubric} />
            {grade.taskComments && Object.keys(grade.taskComments).length > 0 && (
              <p className="mt-2 text-xs text-ink-muted">과제별 코멘트는 아래 제출 기록에서 볼 수 있습니다.</p>
            )}
          </section>
        )}

        <section aria-label="과제 설명" className="max-w-3xl">
          <BlocksRenderer blocks={parseMarkdown(spec.summary)} />
          {spec.requirements.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-3 text-base font-semibold tracking-[-0.02em] text-ink">요구사항</h3>
              <ol className="rows border-y border-[var(--border-hairline)]">
                {spec.requirements.map((r, i) => (
                  <li key={i} className="flex gap-4 py-3 text-[15px] leading-relaxed text-ink-body">
                    <span aria-hidden="true" className="w-5 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <Inline text={r} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="mt-10">
            <h3 className="mb-3 flex items-baseline justify-between text-base font-semibold tracking-[-0.02em] text-ink">
              채점 기준
              <span className="text-[13px] font-normal tabular-nums text-ink-muted">{spec.maxScore}점</span>
            </h3>
            <dl className="rows border-y border-[var(--border-hairline)]">
              {spec.rubric.map((c) => (
                <div key={c.id} className="py-3">
                  <dt className="flex justify-between gap-3 text-[15px] font-medium text-ink">
                    <span>{c.label}</span>
                    <span className="shrink-0 tabular-nums text-ink-muted">{c.points}점</span>
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-muted">
                    <Inline text={c.guide} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <details className="group mt-6">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
              작업 방법
              <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
            </summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
              <li>코드는 브라우저에서 실행되며 설치가 필요하지 않습니다.</li>
              <li>셀끼리 변수를 공유하므로 위에서부터 차례로 실행합니다. 실행: Shift+Enter</li>
              <li>작성 내용은 서버에 자동 저장됩니다. 즉시 저장: Ctrl+S</li>
              <li>답안은 마크다운(표·목록·수식 $…$)으로 작성하고 미리보기로 확인합니다.</li>
              <li>matplotlib 그래프는 실행 결과에 그림으로 저장되어 제출본에 포함됩니다.</li>
            </ul>
          </details>
        </section>

        <section aria-labelledby="workspace-heading">
          <h2 id="workspace-heading" className="mb-5 text-xl font-bold tracking-[-0.03em] text-ink">
            작업 공간
          </h2>
          <Workspace
            assignmentKey={key}
            spec={{ tasks: spec.tasks }}
            tasks={workspaceTasks(spec)}
            initialDraft={draft}
            savedAt={savedDraft?.updatedAt}
            courseDocs={courseDocs}
            resubmit={!!submission}
            autoTests={autoTestViews(spec)}
          />
        </section>

        {spec.challenges.length > 0 && (
          <section id="challenges" aria-labelledby="challenges-heading" className="scroll-mt-24">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="challenges-heading" className="text-xl font-bold tracking-[-0.03em] text-ink">
                  심화 문제
                </h2>
                <p className="mt-1 text-sm text-ink-muted">선택 · 바로 자동 채점되며 점수에는 들어가지 않습니다.</p>
              </div>
              <p className="text-[13px] tabular-nums text-ink-muted">
                통과 {challengesPassed}/{spec.challenges.length}
              </p>
            </div>
            <div className="space-y-5">
              {spec.challenges.map((ex, i) => (
                <CodingExercise key={ex.key} view={exerciseView(itemId(key, ex.key), ex, record, `심화 문제 ${i + 1}`)} />
              ))}
            </div>
          </section>
        )}


        {submission && (
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 text-xl font-bold tracking-[-0.03em] text-ink">
              제출 기록
            </h2>
            <div className="rows border-y border-[var(--border-hairline)]">
              {[...submission.versions].reverse().map((version) => {
                const versionGrades = submission.grades.filter((g) => g.version === version.version);
                const lastGrade = versionGrades[versionGrades.length - 1];
                const summary = (
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    <span>
                    제출본 v{version.version} · {formatDateTime(version.submittedAt)}
                    {lastGrade && (lastGrade.decision === "graded" ? ` · ${lastGrade.score}/${lastGrade.maxScore}점` : " · 재제출 요청")}
                    </span>
                    <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                  </summary>
                );
                const gradesAndNote = (
                  <>
                    {versionGrades.map((g) => (
                      <GradeView key={g.gradedAt} grade={g} rubric={spec.rubric} />
                    ))}
                    <SubmissionVersionView submission={submission} version={version} />
                  </>
                );
                // 작업 공간은 최신 제출본만 여기서 그린다. 이전 제출본은 펼칠 때 그 버전의 작업 공간만 받아 온다.
                if (version.version !== latest?.version) {
                  return (
                    <SubmissionVersionDetails
                      key={version.version}
                      className="group py-1"
                      bodyClassName="space-y-4 pb-5 pt-1"
                      summary={summary}
                      submissionId={submission.id}
                      version={version.version}
                      hasNotebook={!!version.notebookFile}
                      tasks={viewTasks}
                      taskComments={lastGrade?.taskComments}
                    >
                      {gradesAndNote}
                    </SubmissionVersionDetails>
                  );
                }
                return (
                  <details key={version.version} open className="group py-1">
                    {summary}
                    <div className="space-y-4 pb-5 pt-1">
                      {gradesAndNote}
                      {latestNotebook && (
                        <NotebookView
                          tasks={viewTasks}
                          notebook={latestNotebook}
                          taskComments={lastGrade?.taskComments}
                          runKey={`${submission.id}:${version.version}`}
                          courseDocs={courseDocs}
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
    </ModuleFrame>
  );
}
