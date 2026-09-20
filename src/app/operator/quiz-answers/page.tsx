import { quizAnswers } from "@/content/operator/quizAnswers";
import { WEEKS } from "@/content/weeks";

export const metadata = { title: "퀴즈 정답·해설" };

export default function QuizAnswersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용 · 스터디원에게 공유 금지</p>
      <h1 className="mb-8 text-3xl font-black text-ink">퀴즈 정답·해설 &amp; 과제 모범 방향</h1>

      <div className="space-y-10">
        {quizAnswers.map((set) => {
          const week = WEEKS.find((w) => w.number === set.week)!;
          return (
            <section key={set.week} className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
              <h2 className="mb-4 text-lg font-black text-ink">
                W{set.week} · {week.title}
              </h2>
              <ol className="mb-4 list-decimal space-y-3 pl-5 text-sm">
                {week.quiz.map((q, i) => (
                  <li key={i}>
                    <p className="text-ink-secondary">{q}</p>
                    <p className="mt-1 font-medium text-[var(--status-good)]">{set.answers[i]}</p>
                  </li>
                ))}
              </ol>
              <div className="rounded-lg border-l-4 px-3 py-2 text-sm text-ink-secondary" style={{ borderColor: "var(--series-blue)", background: "color-mix(in srgb, var(--series-blue) 8%, transparent)" }}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--series-blue)]">과제 모범 방향</p>
                {set.sampleDirection}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
