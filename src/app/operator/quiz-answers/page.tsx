import { quizAnswers } from "@/content/quizAnswers";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { requireAdmin } from "@/lib/dal";
import { Inline } from "@/components/MarkdownBlocks";
import { sectionLabel } from "@/content/tiers";

export const metadata = { title: "정답·과제 모범 방향" };

export default async function QuizAnswersPage() {
  await requireAdmin("/operator/quiz-answers");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="정답·과제 모범 방향" />

      <div className="rows border-y border-[var(--border-hairline)]">
        {WEEKS.map((week) => {
          const set = quizAnswers.find((a) => a.week === week.number);
          const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
          const { sections } = getWeekOutline(week);
          return (
            <details key={week.slug} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span>
                  {week.number}주차 · {week.title}
                </span>
                <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
              </summary>
              {set && (
                <div className="callout">
                  <p className="mb-1 text-xs font-medium text-[var(--accent)]">과제 모범 방향</p>
                  <Inline text={set.sampleDirection} />
                </div>
              )}
              <div className="mt-6 space-y-6 pb-8">
                {sections.map((section) => (
                  <section key={section.id}>
                    <h2 className="text-sm font-semibold text-ink">
                      {sectionLabel(section)}. {section.title}
                    </h2>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
                      {section.meta.checks.map((check) => (
                        <li key={check.id}>
                          <Inline text={check.question} />
                          <p className="mt-0.5">
                            <span className="font-semibold text-[var(--status-good)]">정답 {String.fromCharCode(65 + check.answer)}</span>{" "}
                            <Inline text={check.choices[check.answer]} />
                          </p>
                          <p className="text-xs text-ink-muted">
                            <Inline text={check.explanation} />
                          </p>
                        </li>
                      ))}
                      {section.meta.quizIds.map((id) => (
                        <li key={id}>
                          <span className="pill mr-1.5">서술형</span>
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
