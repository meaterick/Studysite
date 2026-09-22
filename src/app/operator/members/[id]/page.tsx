import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserById } from "@/lib/userStore";
import { CHECKLIST_ITEMS, weekCompletionRatio } from "@/lib/progress";
import { WEEKS } from "@/content/weeks";
import ProgressRing from "@/components/ProgressRing";

export const metadata = { title: "스터디원 학습 현황" };

export default async function MemberLearningPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/operator/members");
  const { id } = await params;
  const member = findUserById(id);
  if (!member) notFound();
  const learning = getLearningRecord(id);

  const reviews = Object.values(learning.quizReviews).flatMap((week) => Object.values(week));
  const correct = reviews.filter((status) => status === "correct").length;
  const incorrect = reviews.filter((status) => status === "incorrect").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/operator/members" className="text-sm font-bold text-[var(--series-orange)] hover:underline">← 스터디원 관리</Link>
      <p className="mt-5 text-sm font-bold text-[var(--series-orange)]">운영자 전용</p>
      <h1 className="mt-1 text-3xl font-black text-ink">{member.name}님의 학습 현황</h1>
      <p className="mt-2 text-sm text-ink-secondary">{member.email} · 가입일 {new Date(member.createdAt).toLocaleDateString("ko-KR")}</p>

      <div className="my-8 grid gap-3 sm:grid-cols-3">
        <Stat label="체크리스트 완료" value={`${Object.values(learning.progress).reduce((total, week) => total + Object.values(week).filter(Boolean).length, 0)} / ${WEEKS.length * CHECKLIST_ITEMS.length}`} />
        <Stat label="퀴즈 자기평가" value={`정답 ${correct} · 오답 ${incorrect}`} />
        <Stat label="마지막 학습 기록" value={learning.updatedAt ? new Date(learning.updatedAt).toLocaleString("ko-KR") : "아직 없음"} />
      </div>

      <div className="space-y-3">
        {WEEKS.map((week) => {
          const progress = learning.progress[week.slug] ?? {};
          const weekReviews = learning.quizReviews[week.slug] ?? {};
          const wrongQuestions = week.quiz.filter((question) => weekReviews[question.id] === "incorrect");
          const correctCount = Object.values(weekReviews).filter((status) => status === "correct").length;
          return (
            <section key={week.slug} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <ProgressRing ratio={weekCompletionRatio(progress)} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-ink">Week {week.number} · {week.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-secondary">
                    {CHECKLIST_ITEMS.map((item) => <span key={item.id}>{progress[item.id] ? "✓" : "○"} {item.label}</span>)}
                  </div>
                  <p className="mt-3 text-xs text-ink-secondary">퀴즈 자기평가: 정답 {correctCount} · 오답 {wrongQuestions.length}</p>
                  {wrongQuestions.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--status-critical)]">
                      {wrongQuestions.map((question) => <li key={question.id}>{question.question}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"><p className="text-xs font-bold text-ink-muted">{label}</p><p className="mt-1 text-sm font-black text-ink">{value}</p></div>;
}
