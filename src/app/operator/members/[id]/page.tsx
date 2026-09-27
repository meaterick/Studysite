import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getLearningRecord, readSectionState, readWorksheetState } from "@/lib/learningStore";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";
import { WEEKS } from "@/content/weeks";
import { Inline } from "@/components/MarkdownBlocks";
import ProgressRing from "@/components/ProgressRing";
import { formatDateTime, formatDate } from "@/lib/datetime";

export const metadata = { title: "스터디원 학습 현황" };

export default async function MemberLearningPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/operator/members");
  const { id } = await params;
  const member = findUserById(id);
  if (!member) notFound();
  const learning = getLearningRecord(id);
  const submissions = listUserSubmissions(id);
  const rows = WEEKS.map((week) => {
    const submission = submissions.find((s) => s.weekSlug === week.slug);
    return { week, submission, status: weekStatus(week, learning, submission) };
  });
  const sectionsDone = rows.reduce((sum, r) => sum + r.status.sectionsDone, 0);
  const sectionsTotal = rows.reduce((sum, r) => sum + r.status.sectionsTotal, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/operator/members" className="text-sm font-bold text-[var(--series-orange)] hover:underline">← 스터디원 관리</Link>
      <p className="mt-5 text-sm font-bold text-[var(--series-orange)]">운영자 전용</p>
      <h1 className="mt-1 text-3xl font-black text-ink">{member.name}님의 학습 현황</h1>
      <p className="mt-2 text-sm text-ink-secondary">{member.email} · 가입일 {formatDate(member.createdAt)}</p>

      <div className="my-8 grid gap-3 sm:grid-cols-3">
        <Stat label="완료한 단계" value={`${sectionsDone} / ${sectionsTotal}`} />
        <Stat label="과제 제출" value={`${submissions.length} / ${WEEKS.length}주차`} />
        <Stat label="마지막 학습 기록" value={learning.updatedAt ? formatDateTime(learning.updatedAt) : "아직 없음"} />
      </div>

      <div className="space-y-3">
        {rows.map(({ week, submission, status }) => {
          const worksheet = readWorksheetState(learning, week.slug);
          const weakMarks = week.worksheet.filter((_, i) => worksheet.marks[String(i)] === "weak");
          return (
            <details key={week.slug} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
              <summary className="flex cursor-pointer items-start gap-4">
                <ProgressRing ratio={status.ratio} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-ink">{week.number}주차 · {week.title}</h2>
                  <p className="mt-1 text-xs text-ink-secondary">
                    단계 {status.sectionsDone}/{status.sectionsTotal} · 백지공부 {status.worksheetSubmitted ? "제출" : "미제출"} · 과제{" "}
                    {ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
                    {status.assignment.status === "graded" && ` ${status.assignment.score}/${status.assignment.maxScore}점`}
                  </p>
                </div>
                {submission && (
                  <Link href={`/operator/submissions/${submission.id}`} className="shrink-0 text-xs font-bold text-[var(--series-orange)] hover:underline">
                    과제 보기 →
                  </Link>
                )}
              </summary>

              <div className="mt-4 space-y-4 text-sm">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="text-left text-ink-muted">
                      <th className="py-1 pr-2">단계</th>
                      <th className="py-1 pr-2">상태</th>
                      <th className="py-1 pr-2">객관식 (오답 시도)</th>
                      <th className="py-1">서술형 자기평가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.sections.map(({ section, access, progress }) => {
                      const state = readSectionState(learning, week.slug, section.id);
                      const wrongTries = Object.values(state.checks).reduce((sum, c) => sum + c.wrong.length, 0);
                      const weak = section.meta.quizIds.filter((q) => state.answers[q]?.review === "incorrect").length;
                      return (
                        <tr key={section.id} className="border-t border-[var(--border-hairline)] text-ink-secondary">
                          <td className="py-1.5 pr-2">{section.number}. {section.title}</td>
                          <td className="py-1.5 pr-2">{access === "completed" ? "✓ 완료" : access === "current" ? "진행 중" : "—"}</td>
                          <td className="py-1.5 pr-2">
                            {progress.checksDone}/{progress.checksTotal}
                            {wrongTries > 0 && <span className="text-[var(--status-critical)]"> ({wrongTries})</span>}
                          </td>
                          <td className="py-1.5">
                            {progress.quizDone}/{progress.quizTotal}
                            {weak > 0 && <span className="text-[var(--status-critical)]"> · 보완 필요 {weak}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {worksheet.submittedAt && (
                  <div className="rounded-lg bg-[var(--surface-card-2)] px-3 py-3">
                    <p className="text-xs font-bold text-ink-muted">백지공부 ({formatDateTime(worksheet.submittedAt)})</p>
                    <dl className="mt-2 space-y-2">
                      {week.worksheet.map((field, i) => (
                        <div key={field.label}>
                          <dt className="text-xs font-bold text-ink">
                            {field.label}
                            {worksheet.marks[String(i)] === "weak" && <span className="ml-1 text-[var(--status-critical)]">(보완 필요)</span>}
                          </dt>
                          <dd className="whitespace-pre-wrap text-xs text-ink-secondary">{worksheet.answers[String(i)] || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    {weakMarks.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--status-critical)]">본인이 보완 필요로 표시한 항목: {weakMarks.map((f) => f.label).join(", ")}</p>
                    )}
                  </div>
                )}

                {status.sections.some(({ section }) =>
                  section.meta.quizIds.some((q) => readSectionState(learning, week.slug, section.id).answers[q]?.review === "incorrect")
                ) && (
                  <div>
                    <p className="text-xs font-bold text-[var(--status-critical)]">보완이 필요하다고 표시한 서술형 문항</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink-secondary">
                      {status.sections.flatMap(({ section }) => {
                        const state = readSectionState(learning, week.slug, section.id);
                        return section.meta.quizIds
                          .filter((q) => state.answers[q]?.review === "incorrect")
                          .map((q) => (
                            <li key={q}>
                              <Inline text={week.quiz.find((x) => x.id === q)?.question ?? q} />
                              <span className="block whitespace-pre-wrap text-ink-muted">답: {state.answers[q]?.text}</span>
                            </li>
                          ));
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"><p className="text-xs font-bold text-ink-muted">{label}</p><p className="mt-1 text-sm font-black text-ink">{value}</p></div>;
}
