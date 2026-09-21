import { quizAnswers } from "@/content/quizAnswers";
import { WEEKS } from "@/content/weeks";
import { requireAdmin } from "@/lib/dal";
import { Inline } from "@/components/MarkdownBlocks";

export const metadata = { title: "과제 모범 방향" };

export default async function QuizAnswersPage() {
  await requireAdmin("/operator/quiz-answers");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용 · 스터디원에게 공유 금지</p>
      <h1 className="mb-2 text-3xl font-black text-ink">과제 모범 방향</h1>
      <p className="mb-8 text-sm text-ink-muted">
        퀴즈 정답은 이제 각 주차의 <code>/weeks/[slug]/quiz</code> 페이지에서 학생에게 직접 공개됩니다 — 여기서는 과제 채점 시 참고할 모범 방향만 다룹니다.
      </p>

      <div className="space-y-6">
        {quizAnswers.map((set) => {
          const week = WEEKS.find((w) => w.number === set.week)!;
          return (
            <section key={set.week} className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
              <h2 className="mb-3 text-lg font-black text-ink">
                W{set.week} · {week.title}
              </h2>
              <div
                className="rounded-lg border-l-4 px-3 py-2 text-sm text-ink-secondary"
                style={{ borderColor: "var(--series-blue)", background: "color-mix(in srgb, var(--series-blue) 8%, transparent)" }}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--series-blue)]">과제 모범 방향</p>
                <Inline text={set.sampleDirection} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
