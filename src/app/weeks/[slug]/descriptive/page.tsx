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
import TierBadge from "@/components/TierBadge";
import NextActivity from "@/components/NextActivity";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState, readSectionState } from "@/lib/learningStore";
import { quizItemDone, quizItemWeak } from "@/lib/labView";
import { sectionLabel, TIER_INFO, TIER_ORDER } from "@/content/tiers";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 서술형` } : {};
}

const TIER_DESC = {
  core: "핵심 단계의 개념을 자신의 말로 설명해 보는 문항입니다. 여기서부터 시작하십시오.",
  supplement: "보충 단계의 내용과 핵심 개념의 응용을 설명하는 문항입니다.",
  advanced: "유도·분석·설계 판단을 요구하는 전문가 수준 문항입니다.",
} as const;

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
      return { section, access, st, labItems, total, done, weak, locked: !isAdmin && access === "locked" };
    })
    .filter((g) => g.total > 0);

  const tierCount = (tier: (typeof TIER_ORDER)[number]) => {
    const gs = groups.filter((g) => g.section.tier === tier);
    return { done: gs.reduce((a, g) => a + g.done, 0), total: gs.reduce((a, g) => a + g.total, 0) };
  };
  // 처음 펼쳐 둘 묶음: 아직 끝내지 않은 첫 핵심 단계(모두 끝냈으면 다시 볼 문항이 있는 단계)
  const firstOpen = groups.find((g) => g.section.tier === "core" && !g.locked && g.done < g.total)?.section.id;

  return (
    <WeekFrame week={week} status={status} record={record} apply="descriptive">
      <div className="space-y-10">
        <section aria-labelledby="desc-intro">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-3xl">
              <h2 id="desc-intro" className="flex flex-wrap items-center gap-2 text-xl font-black text-ink">
                서술형 <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                설명할 수 있어야 진짜로 이해한 것입니다. 자료를 다시 보지 말고 <strong className="text-ink-secondary">자신의 말로 먼저 쓰고</strong>, 저장하면 공개되는 모범답안과 비교해
                스스로 평가하십시오. &lsquo;보완이 필요합니다&rsquo;로 표시한 문항은 복습 노트에 모입니다.
              </p>
            </div>
          </div>
          <nav aria-label="구분별 바로 가기" className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {TIER_ORDER.map((tier) => {
              const c = tierCount(tier);
              if (c.total === 0) return null;
              return (
                <a
                  key={tier}
                  href={`#tier-${tier}`}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] px-3 py-1 text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} aria-hidden="true" />
                  {TIER_INFO[tier].label} {c.done}/{c.total}
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
              <div className="mb-4 border-b border-[var(--border-hairline)] pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id={`tier-${tier}-heading`} className="flex flex-wrap items-center gap-2 text-lg font-black text-ink">
                    {TIER_INFO[tier].label} 문항 <TierBadge tier={tier} />
                  </h2>
                  <span className="text-xs font-bold text-ink-muted">
                    자기평가 {c.done}/{c.total}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">{TIER_DESC[tier]}</p>
              </div>
              <div className="space-y-3">
                {gs.map((g) => {
                  const { section } = g;
                  let n = 0;
                  return (
                    <details
                      key={section.id}
                      id={`sec-${section.id}`}
                      open={section.id === firstOpen || (g.weak > 0 && !g.locked)}
                      className="group scroll-mt-24 surface"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0">
                          <span className="block font-black text-ink">
                            {g.locked && <span aria-hidden="true">🔒 </span>}
                            {sectionLabel(section)}. {section.title}
                          </span>
                          <span className="mt-0.5 block text-xs font-bold text-ink-muted">
                            {g.total}문항 · 자기평가 {g.done}/{g.total}
                            {g.weak > 0 && <span className="text-[var(--status-critical)]"> · 다시 볼 문항 {g.weak}</span>}
                            {g.done === g.total && <span className="text-[var(--status-good)]"> · ✓ 완료</span>}
                          </span>
                        </span>
                        <span aria-hidden="true" className="shrink-0 text-ink-muted transition group-open:rotate-180">
                          ▾
                        </span>
                      </summary>
                      <div className="space-y-4 border-t border-[var(--border-hairline)] p-4 sm:p-5">
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
                            <Link href={`/weeks/${slug}/sections/${section.id}`} className="inline-block text-sm font-bold text-[var(--series-blue)] hover:underline">
                              막히면 이 단계 다시 읽기 →
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

        <NextActivity slug={slug} href="lab" label="코딩 실습" desc="이번에는 개념을 코드로 옮겨 봅니다." />
      </div>
    </WeekFrame>
  );
}
