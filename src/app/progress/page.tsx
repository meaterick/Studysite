import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import ProgressRing from "@/components/ProgressRing";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission, latestGrade } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";

export const metadata: Metadata = { title: "내 학습 진도" };

export default async function ProgressPage() {
  const user = await requireUser("/progress");
  const record = getLearningRecord(user.id);
  const rows = WEEKS.map((week) => {
    const submission = findUserSubmission(user.id, week.slug);
    return { week, status: weekStatus(week, record, submission), grade: submission ? latestGrade(submission) : undefined };
  });
  const overall = rows.reduce((sum, r) => sum + r.status.ratio, 0) / rows.length;
  const sectionsDone = rows.reduce((sum, r) => sum + r.status.sectionsDone, 0);
  const sectionsTotal = rows.reduce((sum, r) => sum + r.status.sectionsTotal, 0);
  const graded = rows.filter((r) => r.status.assignment.status === "graded");
  const scoreSum = graded.reduce((sum, r) => sum + (r.status.assignment.score ?? 0), 0);
  const scoreMax = graded.reduce((sum, r) => sum + r.status.assignment.maxScore, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">내 학습 진도</p>
      <h1 className="mb-2 text-3xl font-black text-ink">진도 대시보드</h1>
      <p className="mb-8 text-sm text-ink-muted">
        단계 학습, 확인 문제, 백지공부, 과제 기록은 계정에 저장되므로 어느 기기에서 로그인해도 이어서 학습할 수 있습니다.
      </p>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-card p-5 sm:col-span-1">
          <ProgressRing ratio={overall} size={64} />
          <div>
            <p className="text-lg font-black text-ink">{Math.round(overall * 100)}%</p>
            <p className="text-xs text-ink-muted">전체 진행률</p>
          </div>
        </div>
        <Stat label="완료한 단계" value={`${sectionsDone} / ${sectionsTotal}`} />
        <Stat label="채점된 과제 합계" value={graded.length ? `${scoreSum} / ${scoreMax}점 (${graded.length}개)` : "아직 없음"} />
      </div>

      <div className="space-y-3">
        {rows.map(({ week, status, grade }) => (
          <Link
            key={week.slug}
            href={status.currentSection ? `/weeks/${week.slug}/sections/${status.currentSection.id}` : `/weeks/${week.slug}`}
            className="flex items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]"
          >
            <ProgressRing ratio={status.ratio} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {week.number}주차 · {week.title}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                <span className={status.allSectionsDone ? "text-[var(--status-good)]" : ""}>
                  {status.allSectionsDone ? "✓" : "○"} 단계 {status.sectionsDone}/{status.sectionsTotal}
                </span>
                <span className={status.worksheetSubmitted ? "text-[var(--status-good)]" : ""}>
                  {status.worksheetSubmitted ? "✓" : "○"} 백지공부
                </span>
                <span className={status.assignment.status !== "none" ? "text-[var(--status-good)]" : ""}>
                  {status.assignment.status !== "none" ? "✓" : "○"} 과제 {ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
                  {status.assignment.status === "graded" && ` ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`}
                </span>
              </div>
              {grade?.decision === "revision" && (
                <p className="mt-1 text-[11px] font-bold text-[var(--status-serious)]">운영자가 재제출을 요청했습니다. 과제 탭에서 피드백을 확인해 주십시오.</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-bold text-[var(--series-blue)]">
              {status.currentSection ? "이어서 →" : "보기 →"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}
