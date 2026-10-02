import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekLab } from "@/content/labs";
import { getWeekOutline } from "@/content/sections";
import type { LabQuizItem } from "@/content/types";
import { Inline } from "@/components/MarkdownBlocks";
import NextActivity from "@/components/NextActivity";
import WeekFrame from "@/components/WeekFrame";
import DrillChoice from "@/components/lab/DrillChoice";
import DrillPredict from "@/components/lab/DrillPredict";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState, type LabQuizState } from "@/lib/learningStore";
import { QUIZ_KIND_LABEL, quizItemDone, quizItemWeak } from "@/lib/labView";
import { sectionLabel, TIER_INFO, TIER_ORDER } from "@/content/tiers";
import Icon from "@/components/Icon";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 추가 퀴즈` } : {};
}

// 서술형 문항은 "서술형" 페이지에서 단계별 서술형과 함께 모아 보여 준다.
type DrillKind = Exclude<LabQuizItem["kind"], "descriptive">;
const KIND_ORDER: DrillKind[] = ["choice", "predict"];

/** 추가 퀴즈: 객관식·코드 출력 예측. 정답 비교는 서버가 하고, 정답·해설은 공개 조건을 만족한 뒤에만 내려보낸다. */
export default async function WeekDrillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/drill`);
  const lab = getWeekLab(slug);
  if (!lab) notFound();
  const state = readLabState(record, slug);
  const items = lab.quiz.filter((q) => q.kind !== "descriptive");
  const doneCount = items.filter((q) => quizItemDone(q, state.quiz[q.id])).length;
  const weakCount = items.filter((q) => quizItemWeak(q, state.quiz[q.id])).length;
  const sections = new Map(getWeekOutline(week).sections.map((s) => [s.id, s]));

  const footer = (item: LabQuizItem, weak: boolean): ReactNode => {
    const s = sections.get(item.sectionId);
    return (
      <p className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        {weak && <span className="pill [--pill:var(--status-critical)]">다시 볼 문항</span>}
        {s && (
          <Link href={`/weeks/${slug}/sections/${s.id}`} className="transition hover:text-ink">
            관련 단계 · {sectionLabel(s)}. {s.title}
          </Link>
        )}
      </p>
    );
  };

  const render = (item: LabQuizItem, index: number) => {
    const s: LabQuizState | undefined = state.quiz[item.id];
    const label = `${QUIZ_KIND_LABEL[item.kind]} ${index + 1}`;
    const row = status.sections.find((r) => r.section.id === item.sectionId);
    if (!isAdmin && row?.access === "locked") {
      return (
        <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-4 text-sm text-ink-muted">
          <Icon name="lock" size={14} />
          {label} · {row.section.tier === "core" ? `${sectionLabel(row.section)}단계를 열면` : "핵심 단계를 모두 마치면"} 풀 수 있습니다
        </div>
      );
    }
    const weak = quizItemWeak(item, s);
    if (item.kind === "choice") {
      const reveal = !!s && (!!s.correct || (s.wrong?.length ?? 0) >= 2);
      return (
        <DrillChoice
          key={item.id}
          slug={slug}
          itemId={item.id}
          label={label}
          question={<Inline text={item.question} />}
          choices={item.choices.map((c, i) => (
            <Inline key={i} text={c} />
          ))}
          state={s ? { correct: !!s.correct, wrong: s.wrong ?? [], attempts: s.attempts } : null}
          explanation={reveal ? <Inline text={item.explanation} /> : undefined}
          correctIndex={s?.correct ? item.answer : undefined}
          footer={footer(item, weak)}
        />
      );
    }
    if (item.kind === "predict") {
      const revealed = !!s && (!!s.correct || !!s.revealed);
      return (
        <DrillPredict
          key={item.id}
          slug={slug}
          itemId={item.id}
          label={label}
          question={<Inline text={item.question ?? "다음 코드를 실행하면 무엇이 출력됩니까?"} />}
          code={item.code}
          state={s ? { correct: !!s.correct, attempts: s.attempts, lastAnswer: s.lastAnswer, revealed } : null}
          expected={revealed ? item.expected : undefined}
          explanation={revealed ? <Inline text={item.explanation} /> : undefined}
          footer={footer(item, weak)}
        />
      );
    }
    return null;
  };

  return (
    <WeekFrame week={week} status={status} record={record} apply="drill" compact>
      <div className="space-y-16">
        <section aria-labelledby="drill-intro">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="drill-intro" className="flex flex-wrap items-center gap-3 text-[1.75rem] font-bold tracking-[-0.035em] text-ink">
                추가 퀴즈 <span className="pill align-middle text-xs">선택</span>
              </h2>
              <p className="mt-2 text-[15px] text-ink-secondary">객관식과 코드 출력 예측으로 이해를 한 번 더 점검합니다.</p>
            </div>
            <p className="text-[13px] tabular-nums text-ink-muted">
              완료 {doneCount}/{items.length}
              {weakCount > 0 && <span className="ml-2 text-[var(--status-critical)]">다시 볼 문항 {weakCount}</span>}
            </p>
          </div>
          <nav aria-label="단계 구분" className="mt-5 flex flex-wrap gap-1">
            {TIER_ORDER.map((tier) => {
              const inTier = items.filter((q) => q.tier === tier);
              if (inTier.length === 0) return null;
              const done = inTier.filter((q) => quizItemDone(q, state.quiz[q.id])).length;
              return (
                <a key={tier} href={`#tier-${tier}`} className="chip border border-[var(--border-hairline)]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                  {TIER_INFO[tier].label}
                  <span className="tabular-nums text-ink-muted">
                    {done}/{inTier.length}
                  </span>
                </a>
              );
            })}
          </nav>
        </section>

        {TIER_ORDER.map((tier) => {
          const tierItems = KIND_ORDER.flatMap((kind) => items.filter((q) => q.tier === tier && q.kind === kind));
          if (tierItems.length === 0) return null;
          const counters: Partial<Record<LabQuizItem["kind"], number>> = {};
          return (
            <section key={tier} id={`tier-${tier}`} aria-labelledby={`tier-${tier}-heading`} className="scroll-mt-24">
              <div className="mb-5 flex items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <h2 id={`tier-${tier}-heading`} className="flex items-center gap-2 text-lg font-bold tracking-[-0.03em] text-ink">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                  {TIER_INFO[tier].label} 문항
                  <span className="text-xs font-normal text-ink-muted">{TIER_INFO[tier].audience}</span>
                </h2>
                <span className="text-[13px] tabular-nums text-ink-muted">{tierItems.length}문항</span>
              </div>
              <div className="space-y-5">
                {tierItems.map((item) => {
                  counters[item.kind] = (counters[item.kind] ?? 0) + 1;
                  return (
                    <div key={item.id} id={`q-${item.id}`} className="scroll-mt-24">
                      {render(item, counters[item.kind]! - 1)}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <NextActivity slug={slug} href={`/feedback/review/${slug}`} label="복습 노트" />
      </div>
    </WeekFrame>
  );
}
