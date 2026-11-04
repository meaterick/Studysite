import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS, getWeek } from "@/content/weeks";
import type { LabQuizItem } from "@/content/types";
import { getWeekLab } from "@/content/labs";
import { quizAnswers } from "@/content/quizAnswers";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import DescriptiveQuestion from "@/components/section/DescriptiveQuestion";
import DrillDescriptive from "@/components/lab/DrillDescriptive";
import Icon from "@/components/Icon";
import NextActivity from "@/components/NextActivity";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState, readSectionState } from "@/lib/learningStore";
import { quizItemDone, quizItemWeak } from "@/lib/labView";
import { sectionLabel, TIER_INFO, TIER_ORDER } from "@/content/tiers";
import { ProgressCount, ProgressProvider, ProgressShow, type ProgressStatus } from "@/components/progress/ProgressStore";
import { descKey, drillKey } from "@/lib/progressIds";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 서술형` } : {};
}

/**
 * 서술형: 단계별 서술형 문항과 퀴즈의 서술형 문항을 단계 순서대로 모아, 직접 쓰고 → 모범답안과 비교 → 자기평가한다.
 * 학습 자료 화면에서는 객관식 확인 문제만 빠르게 풀고, 설명하는 연습은 이곳에서 한다.
 */
export default async function WeekDescriptivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/descriptive`);
  const lab = getWeekLab(slug);
  const labState = readLabState(record, slug);
  const answers = quizAnswers.find((a) => a.week === week.number)?.answers ?? {};
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));

  const groups = status.sections
    .map(({ section, access }) => {
      const st = readSectionState(record, slug, section.id);
      const labItems = (lab?.quiz ?? []).filter(
        (q): q is Extract<LabQuizItem, { kind: "descriptive" }> => q.kind === "descriptive" && q.sectionId === section.id
      );
      const total = section.meta.quizIds.length + labItems.length;
      const done =
        section.meta.quizIds.filter((id) => !!st.answers[id]?.review).length + labItems.filter((q) => quizItemDone(q, labState.quiz[q.id])).length;
      const weak =
        section.meta.quizIds.filter((id) => st.answers[id]?.review === "incorrect").length +
        labItems.filter((q) => quizItemWeak(q, labState.quiz[q.id])).length;
      // 답을 저장·평가해도 화면을 다시 받지 않으므로 숫자는 진행 저장소에서 센다.
      const ids = [...section.meta.quizIds.map(descKey), ...labItems.map((q) => drillKey(q.id))];
      return { section, access, st, labItems, ids, total, done, weak, locked: !isAdmin && access === "locked" };
    })
    .filter((g) => g.total > 0);

  const statuses: Record<string, ProgressStatus> = {};
  for (const g of groups) {
    for (const id of g.section.meta.quizIds) {
      const review = g.st.answers[id]?.review;
      statuses[descKey(id)] = { done: !!review, weak: review === "incorrect" };
    }
    for (const q of g.labItems) statuses[drillKey(q.id)] = { done: quizItemDone(q, labState.quiz[q.id]), weak: quizItemWeak(q, labState.quiz[q.id]) };
  }

  const tierCount = (tier: (typeof TIER_ORDER)[number]) => {
    const gs = groups.filter((g) => g.section.tier === tier);
    return { ids: gs.flatMap((g) => g.ids), total: gs.reduce((a, g) => a + g.total, 0) };
  };
  // 처음 펼쳐 둘 묶음: 아직 끝내지 않은 첫 핵심 단계(모두 끝냈으면 다시 볼 문항이 있는 단계)
  const firstOpen = groups.find((g) => g.section.tier === "core" && !g.locked && g.done < g.total)?.section.id;

  return (
    <WeekFrame week={week} status={status} record={record} apply="descriptive" compact>
      <ProgressProvider items={statuses}>
        <div className="space-y-16">
          <section aria-labelledby="desc-intro">
            <h2 id="desc-intro" className="flex flex-wrap items-center gap-3 text-[1.75rem] font-bold tracking-[-0.035em] text-ink">
              서술형 <span className="pill align-middle text-xs">선택</span>
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] text-ink-secondary">자신의 말로 먼저 쓰고, 저장하면 열리는 모범답안과 비교해 스스로 평가합니다.</p>
            <nav aria-label="구분별 바로 가기" className="mt-5 flex flex-wrap gap-1">
              {TIER_ORDER.map((tier) => {
                const c = tierCount(tier);
                if (c.total === 0) return null;
                return (
                  <a key={tier} href={`#tier-${tier}`} className="chip border border-[var(--border-hairline)]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_INFO[tier].color }} aria-hidden="true" />
                    {TIER_INFO[tier].label}
                    <span className="tabular-nums text-ink-muted">
                      <ProgressCount ids={c.ids} />/{c.total}
                    </span>
                  </a>
                );
              })}
            </nav>
          </section>

          {TIER_ORDER.map((tier) => {
            const gs = groups.filter((g) => g.section.tier === tier);
            if (gs.length === 0) return null;
            const c = tierCount(tier);
            return (
              <section key={tier} id={`tier-${tier}`} aria-labelledby={`tier-${tier}-heading`} className="scroll-mt-24">
                <div className="flex items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                  <h2 id={`tier-${tier}-heading`} className="flex items-center gap-2 text-lg font-bold tracking-[-0.03em] text-ink">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                    {TIER_INFO[tier].label} 문항
                    <span className="text-xs font-normal text-ink-muted">{TIER_INFO[tier].audience}</span>
                  </h2>
                  <span className="text-[13px] tabular-nums text-ink-muted">
                    <ProgressCount ids={c.ids} />/{c.total}
                  </span>
                </div>
                <div className="rows">
                  {gs.map((g) => {
                    const { section } = g;
                    let n = 0;
                    return (
                      <details
                        key={section.id}
                        id={`sec-${section.id}`}
                        open={section.id === firstOpen || (g.weak > 0 && !g.locked)}
                        className="group scroll-mt-24"
                      >
                        <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center gap-4 rounded-xl px-3 py-4 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                              {g.locked && <Icon name="lock" size={14} className="shrink-0 text-ink-muted" />}
                              {sectionLabel(section)}. {section.title}
                            </span>
                            <span className="mt-1 block text-xs tabular-nums text-ink-muted">
                              {g.total}문항 · 자기평가 <ProgressCount ids={g.ids} />/{g.total}
                              <ProgressShow ids={g.ids} when="anyWeak">
                                <span className="text-[var(--status-critical)]">
                                  {" "}
                                  · 다시 볼 문항 <ProgressCount ids={g.ids} field="weak" />
                                </span>
                              </ProgressShow>
                            </span>
                          </span>
                          <ProgressShow ids={g.ids} when="allDone">
                            <span className="text-[var(--status-good)]">
                              <Icon name="check" size={16} />
                              <span className="sr-only">완료</span>
                            </span>
                          </ProgressShow>
                          <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                        </summary>
                        <div className="space-y-5 pb-8 pt-2">
                          {g.locked ? (
                            <p className="text-sm text-ink-muted">
                              {section.tier === "core" ? `${sectionLabel(section)}단계가 열리면` : "핵심 단계를 모두 마치면"} 풀 수 있습니다.
                            </p>
                          ) : (
                            <>
                              {section.meta.quizIds.map((quizId) => {
                                const saved = g.st.answers[quizId];
                                return (
                                  <DescriptiveQuestion
                                    key={quizId}
                                    slug={slug}
                                    sectionId={section.id}
                                    quizId={quizId}
                                    index={n++}
                                    question={<Inline text={questionText.get(quizId) ?? ""} />}
                                    savedText={saved?.text}
                                    review={saved?.review}
                                    modelAnswer={saved ? <Inline text={answers[quizId] ?? "(모범답안 준비 중)"} /> : undefined}
                                  />
                                );
                              })}
                              {g.labItems.map((item) => {
                                const s = labState.quiz[item.id];
                                return (
                                  <DrillDescriptive
                                    key={item.id}
                                    slug={slug}
                                    itemId={item.id}
                                    label={`서술형 ${++n}`}
                                    question={<Inline text={item.question} />}
                                    savedText={s?.text}
                                    review={s?.review}
                                    checkedPoints={s?.checkedPoints}
                                    modelAnswer={s?.text ? <BlocksRenderer blocks={parseMarkdown(item.modelAnswer)} /> : undefined}
                                    keyPoints={s?.text ? item.keyPoints.map((p, i) => <Inline key={i} text={p} />) : undefined}
                                  />
                                );
                              })}
                              <Link href={`/weeks/${slug}/sections/${section.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink">
                                이 단계 다시 읽기
                                <Icon name="arrowRight" size={13} />
                              </Link>
                            </>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <NextActivity slug={slug} href="lab" label="코딩 실습" />
        </div>
      </ProgressProvider>
    </WeekFrame>
  );
}
