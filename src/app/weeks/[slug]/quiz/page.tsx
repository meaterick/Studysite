import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { quizAnswers } from "@/content/quizAnswers";
import { Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { readSectionState } from "@/lib/learningStore";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

/**
 * 복습 노트: 단계별 확인 문제·서술형 답을 모아 보고, 틀렸거나 "보완 필요"로 표시한
 * 문항을 먼저 보여준다. 아직 풀지 않은 문항의 정답은 내려보내지 않는다.
 */
export default async function WeekReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status } = await loadWeekPage(slug, `/weeks/${slug}/quiz`);
  const answers = quizAnswers.find((a) => a.week === week.number)?.answers ?? {};
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));

  const rows = status.sections.map(({ section, access }) => {
    const state = readSectionState(record, slug, section.id);
    const checks = section.meta.checks.map((check) => ({ check, state: state.checks[check.id] }));
    const descriptive = section.meta.quizIds.map((id) => ({ id, answer: state.answers[id] }));
    const weakCount =
      checks.filter((c) => c.state && c.state.wrong.length > 0).length +
      descriptive.filter((d) => d.answer?.review === "incorrect").length;
    return { section, access, checks, descriptive, weakCount };
  });
  const totalWeak = rows.reduce((sum, r) => sum + r.weakCount, 0);

  return (
    <WeekFrame week={week} status={status}>
      <section>
        <h2 className="mb-1 text-xl font-black text-ink">복습 노트</h2>
        <p className="mb-6 text-sm text-ink-muted">
          각 단계에서 푼 확인 문제와 서술형 답안을 모아 보여 줍니다. 한 번이라도 틀린 객관식 문제와 &lsquo;보완이 필요합니다&rsquo;로 표시한 서술형 문항은{" "}
          <strong className="text-[var(--status-critical)]">다시 볼 문항</strong>으로 표시됩니다. 현재 {totalWeak}개입니다.
        </p>
        <div className="space-y-4">
          {rows.map(({ section, access, checks, descriptive, weakCount }) => (
            <details key={section.id} open={weakCount > 0} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
              <summary className="cursor-pointer">
                <span className="font-black text-ink">
                  {section.number}단계 · {section.title}
                </span>
                <span className="ml-2 text-xs text-ink-muted">
                  {access === "locked" ? "잠김" : access === "completed" ? "완료" : "진행 중"}
                  {weakCount > 0 && <span className="ml-1 font-bold text-[var(--status-critical)]">· 다시 볼 문항 {weakCount}</span>}
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                {checks.map(({ check, state }, i) => {
                  const weak = !!state && state.wrong.length > 0;
                  return (
                    <div
                      key={check.id}
                      className={`rounded-lg border px-3 py-3 text-sm ${weak ? "border-[var(--status-critical)]/40" : "border-[var(--border-hairline)]"}`}
                    >
                      <p className="font-medium text-ink">
                        Q{i + 1}. <Inline text={check.question} />
                      </p>
                      {state?.correct ? (
                        <div className="mt-2 space-y-1 text-ink-secondary">
                          <p>
                            <span className="font-bold text-[var(--status-good)]">정답</span> <Inline text={check.choices[check.answer]} />
                            {weak && <span className="ml-2 text-xs text-[var(--status-critical)]">({state.attempts}번째 시도에서 정답)</span>}
                          </p>
                          <p className="text-ink-muted">
                            <Inline text={check.explanation} />
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-ink-muted">아직 풀지 않았습니다.</p>
                      )}
                    </div>
                  );
                })}
                {descriptive.map(({ id, answer }, i) => {
                  const weak = answer?.review === "incorrect";
                  return (
                    <div
                      key={id}
                      className={`rounded-lg border px-3 py-3 text-sm ${weak ? "border-[var(--status-critical)]/40" : "border-[var(--border-hairline)]"}`}
                    >
                      <p className="font-medium text-ink">
                        서술형 {i + 1}. <Inline text={questionText.get(id) ?? ""} />
                      </p>
                      {answer ? (
                        <div className="mt-2 space-y-2">
                          <p className="whitespace-pre-wrap text-ink-secondary">
                            <span className="font-bold">내 답안</span> {answer.text}
                          </p>
                          <p className="text-ink-secondary">
                            <span className="font-bold text-[var(--status-good)]">모범답안</span> <Inline text={answers[id] ?? ""} />
                          </p>
                          {weak && <p className="text-xs font-bold text-[var(--status-critical)]">보완이 필요하다고 표시한 문항</p>}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-ink-muted">아직 작성하지 않았습니다.</p>
                      )}
                    </div>
                  );
                })}
                {access !== "locked" && (
                  <Link href={`/weeks/${slug}/sections/${section.id}`} className="inline-block text-sm font-bold text-[var(--series-blue)] hover:underline">
                    이 단계 다시 보기 →
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </WeekFrame>
  );
}
