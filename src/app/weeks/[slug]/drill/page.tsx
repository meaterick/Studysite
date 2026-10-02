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
import TierBadge from "@/components/TierBadge";

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
const KIND_DESC: Record<DrillKind, string> = {
  choice: "보기 중 하나를 고릅니다. 두 번 틀리면 해설이 공개됩니다.",
  predict: "코드를 실행하지 말고 출력을 예측해 적습니다. 공백 차이는 무시하고 비교하며, 정답이 공개되면 직접 실행해 확인할 수 있습니다.",
};

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
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {weak && <span className="rounded bg-[color-mix(in_srgb,var(--status-critical)_12%,transparent)] px-1.5 py-0.5 font-bold text-[var(--status-critical)]">다시 볼 문항</span>}
        {s && (
          <Link href={`/weeks/${slug}/sections/${s.id}`} className="hover:text-[var(--series-blue)] hover:underline">
            관련 단계: {sectionLabel(s)}. {s.title} →
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
        <div key={item.id} className="rounded-xl border border-dashed border-[var(--border-hairline)] p-4 text-sm text-ink-muted">
          🔒 {label}: {row.section.tier === "core" ? `${sectionLabel(row.section)}단계를 열면` : "핵심 단계를 모두 마치면"} 풀 수 있습니다.
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
    <WeekFrame week={week} status={status} record={record} apply="drill">
      <div className="space-y-10">
        <section aria-labelledby="drill-intro">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="drill-intro" className="flex flex-wrap items-center gap-2 text-xl font-black text-ink">
                추가 퀴즈 <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                단계 끝의 확인 문제보다 한 걸음 더 나아간 문제입니다. 개념을 다른 상황에 적용하고, 코드를 읽고 결과를 예측해 봅니다. 주차 완료 조건과는 무관합니다.
              </p>
            </div>
            <p className="rounded-full bg-[var(--surface-card-2)] px-3 py-1 text-sm font-bold text-ink-secondary">
              완료 {doneCount}/{items.length}
              {weakCount > 0 && <span className="ml-2 text-[var(--status-critical)]">다시 볼 문항 {weakCount}</span>}
            </p>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-ink-muted">
            {KIND_ORDER.map((kind) => (
              <li key={kind}>
                <strong className="text-ink-secondary">{QUIZ_KIND_LABEL[kind]}</strong>: {KIND_DESC[kind]}
              </li>
            ))}
          </ul>
          <nav aria-label="단계 구분" className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {TIER_ORDER.map((tier) => {
              const inTier = items.filter((q) => q.tier === tier);
              if (inTier.length === 0) return null;
              const done = inTier.filter((q) => quizItemDone(q, state.quiz[q.id])).length;
              return (
                <a
                  key={tier}
                  href={`#tier-${tier}`}
                  className="rounded-full border border-[var(--border-hairline)] px-3 py-1 text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
                >
                  {TIER_INFO[tier].label} {done}/{inTier.length}
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
              <div className="mb-4 border-b border-[var(--border-hairline)] pb-2">
                <h2 id={`tier-${tier}-heading`} className="flex flex-wrap items-center gap-2 text-lg font-black text-ink">
                  {TIER_INFO[tier].label} 문항 ({tierItems.length}) <TierBadge tier={tier} />
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {tier === "core"
                    ? "이번 주 핵심 개념을 확인하는 문항입니다. 먼저 풀어 보십시오."
                    : tier === "supplement"
                      ? "보충 단계의 내용과 핵심 개념의 응용을 다루는 문항입니다."
                      : "유도·분석·설계 판단을 요구하는 전문가 수준 문항입니다. 심화 달성 기록에 반영됩니다."}
                </p>
              </div>
              <div className="space-y-4">
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

        <NextActivity slug={slug} href={`/feedback/review/${slug}`} label="복습 노트" desc="틀렸던 문제 다시 보기" />
      </div>
    </WeekFrame>
  );
}
