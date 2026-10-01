import { quizAnswers } from "@/content/quizAnswers";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { requireAdmin } from "@/lib/dal";
import { Inline } from "@/components/MarkdownBlocks";
import { sectionLabel } from "@/content/tiers";

export const metadata = { title: "정답·과제 모범 방향" };

export default async function QuizAnswersPage() {
  await requireAdmin("/operator/quiz-answers");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-black text-ink">정답·과제 모범 방향</h1>
      <p className="mb-8 text-sm text-ink-muted">
        주차별 과제 모범 방향과, 단계별 확인 문제(객관식) 정답·서술형 모범답안 전체입니다.
      </p>

      <div className="space-y-6">
        {WEEKS.map((week) => {
          const set = quizAnswers.find((a) => a.week === week.number);
          const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
          const { sections } = getWeekOutline(week);
          return (
            <details key={week.slug} className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
              <summary className="cursor-pointer text-lg font-black text-ink">
                {week.number}주차 · {week.title}
              </summary>
              {set && (
                <div
                  className="mt-4 rounded-lg border-l-4 px-3 py-2 text-sm text-ink-secondary"
                  style={{ borderColor: "var(--series-blue)", background: "color-mix(in srgb, var(--series-blue) 8%, transparent)" }}
                >
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--series-blue)]">과제 모범 방향</p>
                  <Inline text={set.sampleDirection} />
                </div>
              )}
              <div className="mt-4 space-y-5">
                {sections.map((section) => (
                  <section key={section.id}>
                    <h2 className="text-sm font-black text-ink">
                      {sectionLabel(section)}. {section.title}
                    </h2>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
                      {section.meta.checks.map((check) => (
                        <li key={check.id}>
                          <Inline text={check.question} />
                          <p className="mt-0.5">
                            <span className="font-bold text-[var(--status-good)]">정답 {String.fromCharCode(65 + check.answer)}</span>{" "}
                            <Inline text={check.choices[check.answer]} />
                          </p>
                          <p className="text-xs text-ink-muted">
                            <Inline text={check.explanation} />
                          </p>
                        </li>
                      ))}
                      {section.meta.quizIds.map((id) => (
                        <li key={id}>
                          <span className="mr-1 rounded bg-[var(--surface-card-2)] px-1 text-[11px] font-bold">서술형</span>
                          <Inline text={questionText.get(id) ?? ""} />
                          <p className="mt-0.5 text-xs text-ink-muted">
                            <Inline text={set?.answers[id] ?? ""} />
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
