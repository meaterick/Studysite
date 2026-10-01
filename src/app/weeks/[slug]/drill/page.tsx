import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekLab } from "@/content/labs";
import { getWeekOutline } from "@/content/sections";
import type { LabQuizItem } from "@/content/types";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import { parseMarkdown } from "@/content/markdown";
import WeekFrame from "@/components/WeekFrame";
import DrillChoice from "@/components/lab/DrillChoice";
import DrillPredict from "@/components/lab/DrillPredict";
import DrillDescriptive from "@/components/lab/DrillDescriptive";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState, type LabQuizState } from "@/lib/learningStore";
import { labProgress, QUIZ_KIND_LABEL, quizItemDone, quizItemWeak } from "@/lib/labView";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 퀴즈` } : {};
}

const KIND_ORDER: LabQuizItem["kind"][] = ["choice", "predict", "descriptive"];
const KIND_DESC: Record<LabQuizItem["kind"], string> = {
  choice: "보기 중 하나를 고릅니다. 두 번 틀리면 해설이 공개됩니다.",
  predict: "코드를 실행하지 말고 출력을 예측해 적습니다. 공백 차이는 무시하고 비교하며, 정답이 공개되면 직접 실행해 확인할 수 있습니다.",
  descriptive: "자신의 말로 쓴 뒤 모범답안·핵심 요소와 비교해 스스로 평가합니다.",
};

/** 퀴즈: 객관식·코드 출력 예측·서술형. 정답 비교는 서버가 하고, 정답·해설은 공개 조건을 만족한 뒤에만 내려보낸다. */
export default async function WeekDrillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/drill`);
  const lab = getWeekLab(slug);
  if (!lab) notFound();
  const state = readLabState(record, slug);
  const progress = labProgress(slug, state);
  const sections = new Map(getWeekOutline(week).sections.map((s) => [s.id, s]));

  const footer = (item: LabQuizItem, weak: boolean): ReactNode => {
    const s = sections.get(item.sectionId);
    return (
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {weak && <span className="rounded bg-[color-mix(in_srgb,var(--status-critical)_12%,transparent)] px-1.5 py-0.5 font-bold text-[var(--status-critical)]">다시 볼 문항</span>}
        {s && (
          <Link href={`/weeks/${slug}/sections/${s.id}`} className="hover:text-[var(--series-blue)] hover:underline">
            관련 단계: {s.number}. {s.title} →
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
          🔒 {label}: {row.section.number}단계를 열면 풀 수 있습니다.
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
    return (
      <DrillDescriptive
        key={item.id}
        slug={slug}
        itemId={item.id}
        label={label}
        question={<Inline text={item.question} />}
        savedText={s?.text}
        review={s?.review}
        checkedPoints={s?.checkedPoints}
        modelAnswer={s?.text ? <BlocksRenderer blocks={parseMarkdown(item.modelAnswer)} /> : undefined}
        keyPoints={s?.text ? item.keyPoints.map((p, i) => <Inline key={i} text={p} />) : undefined}
        footer={footer(item, weak)}
      />
    );
  };

  return (
    <WeekFrame week={week} status={status}>
      <div className="space-y-10">
        <section aria-labelledby="drill-intro">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="drill-intro" className="text-xl font-black text-ink">
                퀴즈
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                단계 끝의 확인 문제와 별도로, 코드를 읽고 결과를 예측하거나 설명하는 문제로 이번 주 내용을 점검합니다. 단계 완료 조건과는 무관합니다.
              </p>
            </div>
            {progress && (
              <p className="rounded-full bg-[var(--surface-card-2)] px-3 py-1 text-sm font-bold text-ink-secondary">
                완료 {progress.quizDone}/{progress.quizTotal}
                {progress.quizWeak > 0 && <span className="ml-2 text-[var(--status-critical)]">다시 볼 문항 {progress.quizWeak}</span>}
              </p>
            )}
          </div>
          <nav aria-label="문제 유형" className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {KIND_ORDER.map((kind) => {
              const items = lab.quiz.filter((q) => q.kind === kind);
              if (items.length === 0) return null;
              const done = items.filter((q) => quizItemDone(q, state.quiz[q.id])).length;
              return (
                <a
                  key={kind}
                  href={`#kind-${kind}`}
                  className="rounded-full border border-[var(--border-hairline)] px-3 py-1 text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
                >
                  {QUIZ_KIND_LABEL[kind]} {done}/{items.length}
                </a>
              );
            })}
          </nav>
        </section>

        {KIND_ORDER.map((kind) => {
          const items = lab.quiz.filter((q) => q.kind === kind);
          if (items.length === 0) return null;
          return (
            <section key={kind} id={`kind-${kind}`} aria-labelledby={`kind-${kind}-heading`} className="scroll-mt-24">
              <div className="mb-4 border-b border-[var(--border-hairline)] pb-2">
                <h2 id={`kind-${kind}-heading`} className="text-lg font-black text-ink">
                  {QUIZ_KIND_LABEL[kind]} ({items.length})
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">{KIND_DESC[kind]}</p>
              </div>
              <div className="space-y-4">{items.map((item, i) => render(item, i))}</div>
            </section>
          );
        })}

        <p className="text-sm">
          <Link href={`/weeks/${slug}/lab`} className="font-bold text-[var(--series-blue)] hover:underline">
            ← 코딩 실습으로
          </Link>
        </p>
      </div>
    </WeekFrame>
  );
}
