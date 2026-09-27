import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findSubmission, gradeSubmission, latestGrade, latestVersion } from "@/lib/submissionStore";
import { findUserById } from "@/lib/userStore";
import { getLearningRecord, readWorksheetState } from "@/lib/learningStore";
import { weekStatus } from "@/lib/study";
import { getWeek } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { quizAnswers } from "@/content/quizAnswers";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import { GradeView, SubmissionVersionView } from "@/components/SubmissionView";

export const metadata = { title: "과제 채점" };

const FEEDBACK_MAX = 5000;

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin("/operator/submissions");
  const { id } = await params;
  const { saved, error } = await searchParams;
  const submission = findSubmission(id);
  if (!submission) notFound();
  const week = getWeek(submission.weekSlug);
  if (!week) notFound();
  const student = findUserById(submission.userId);
  const record = getLearningRecord(submission.userId);
  const status = weekStatus(week, record, submission);
  const worksheet = readWorksheetState(record, week.slug);
  const latest = latestVersion(submission);
  const grade = latestGrade(submission);
  const sampleDirection = quizAnswers.find((a) => a.week === week.number)?.sampleDirection;
  const maxScore = week.assignmentMaxScore;

  async function grade_(formData: FormData) {
    "use server";
    const admin = await requireAdmin("/operator/submissions");
    const target = findSubmission(id);
    if (!target) redirect("/operator/submissions");
    const decision = formData.get("decision") === "revision" ? "revision" : "graded";
    const feedback = String(formData.get("feedback") ?? "").trim().slice(0, FEEDBACK_MAX);
    const rawScore = String(formData.get("score") ?? "").trim();
    let score: number | null = null;
    if (decision === "graded") {
      score = Number(rawScore);
      if (!rawScore || !Number.isFinite(score) || score < 0 || score > maxScore || Math.round(score * 2) !== score * 2) {
        redirect(`/operator/submissions/${id}?error=score`);
      }
    } else if (!feedback) {
      redirect(`/operator/submissions/${id}?error=feedback`);
    }
    await gradeSubmission(id, { decision, score, maxScore, feedback, gradedBy: admin.name });
    redirect(`/operator/submissions/${id}?saved=1`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/operator/submissions" className="text-sm font-bold text-[var(--series-orange)] hover:underline">← 과제 채점 목록</Link>
      <p className="mt-5 text-sm font-bold text-[var(--series-orange)]">운영자 전용 · W{week.number} {week.title}</p>
      <h1 className="mt-1 text-3xl font-black text-ink">{student?.name ?? "(탈퇴한 사용자)"}님의 과제</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        {student?.email} · 섹션 {status.sectionsDone}/{status.sectionsTotal} · 백지공부 {worksheet.submittedAt ? "제출" : "미제출"} ·
        제출 {submission.versions.length}회{student && (
          <>
            {" · "}
            <Link href={`/operator/members/${student.id}`} className="font-bold text-[var(--series-orange)] hover:underline">학습 현황 보기</Link>
          </>
        )}
      </p>

      {saved && (
        <p className="mt-4 rounded-lg border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-4 py-2 text-sm font-medium text-ink">
          채점 결과를 저장했습니다. 스터디원의 과제 페이지와 진도 대시보드에 바로 표시됩니다.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border-l-4 border-[var(--status-critical)] bg-[color-mix(in_srgb,var(--status-critical)_8%,transparent)] px-4 py-2 text-sm font-medium text-[var(--status-critical)]">
          {error === "score" ? `점수는 0~${maxScore} 사이, 0.5점 단위로 입력해주세요.` : "재제출을 요청할 때는 무엇을 고쳐야 하는지 피드백을 적어주세요."}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="mb-3 text-lg font-black text-ink">
              최신 제출 v{latest.version} <span className="text-sm font-medium text-ink-muted">· {new Date(latest.submittedAt).toLocaleString("ko-KR")}</span>
            </h2>
            <SubmissionVersionView submission={submission} version={latest} />
          </section>

          {submission.versions.length > 1 && (
            <section aria-labelledby="prev-heading">
              <h2 id="prev-heading" className="mb-3 text-lg font-black text-ink">이전 버전</h2>
              <div className="space-y-3">
                {submission.versions.slice(0, -1).reverse().map((v) => (
                  <details key={v.version} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
                    <summary className="cursor-pointer text-sm font-bold text-ink">
                      v{v.version} · {new Date(v.submittedAt).toLocaleString("ko-KR")}
                    </summary>
                    <div className="mt-3 space-y-3">
                      <SubmissionVersionView submission={submission} version={v} />
                      {submission.grades.filter((g) => g.version === v.version).map((g) => <GradeView key={g.gradedAt} grade={g} />)}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="rubric-heading">
            <h2 id="rubric-heading" className="mb-3 text-lg font-black text-ink">과제 안내 · 채점 기준</h2>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
              <BlocksRenderer blocks={parseMarkdown(week.assignmentMd)} />
            </div>
            {sampleDirection && (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--series-orange)] p-4 text-sm text-ink-secondary">
                <p className="mb-1 text-xs font-bold text-[var(--series-orange)]">모범 답안 방향 (운영자 전용)</p>
                <Inline text={sampleDirection} />
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <form action={grade_} className="space-y-4 rounded-xl border border-[var(--series-orange)] bg-card p-5">
            <h2 className="text-base font-black text-ink">v{latest.version} 채점</h2>
            {grade && grade.version === latest.version && (
              <p className="text-xs text-ink-muted">이미 채점한 버전입니다. 다시 저장하면 새 채점 기록이 추가됩니다.</p>
            )}
            <div>
              <label htmlFor="score" className="block text-sm font-bold text-ink">점수 (0~{maxScore}, 0.5점 단위)</label>
              <input
                id="score"
                name="score"
                type="number"
                min={0}
                max={maxScore}
                step={0.5}
                defaultValue={grade?.version === latest.version && grade.score !== null ? grade.score : undefined}
                className="mt-1 w-32 rounded-md border border-[var(--border-hairline)] bg-page px-3 py-1.5 text-sm text-ink"
              />
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm font-bold text-ink">피드백</label>
              <p className="text-xs text-ink-muted">잘한 점 1개 + 개선할 점 1~2개를 채점 기준 항목에 맞춰 구체적으로.</p>
              <textarea
                id="feedback"
                name="feedback"
                rows={9}
                maxLength={FEEDBACK_MAX}
                defaultValue={grade?.version === latest.version ? grade.feedback : ""}
                className="mt-1 w-full rounded-md border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button name="decision" value="graded" className="rounded-md bg-[var(--status-good)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                채점 완료
              </button>
              <button name="decision" value="revision" className="rounded-md border border-[var(--status-serious)] px-4 py-2 text-sm font-bold text-[var(--status-serious)] hover:bg-[color-mix(in_srgb,var(--status-serious)_10%,transparent)]">
                재제출 요청
              </button>
            </div>
          </form>

          {submission.grades.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-black text-ink">채점 기록</h2>
              <div className="space-y-2">
                {[...submission.grades].reverse().map((g) => (
                  <div key={g.gradedAt}>
                    <GradeView grade={g} />
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
