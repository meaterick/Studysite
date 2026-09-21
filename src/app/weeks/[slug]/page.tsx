import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS, getWeek, getAdjacentWeeks } from "@/content/weeks";
import Markdown, { Inline } from "@/components/MarkdownBlocks";
import Checklist from "@/components/Checklist";
import Worksheet from "@/components/Worksheet";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) return {};
  return { title: `Week ${week.number} · ${week.title}` };
}

const SECTIONS = [
  { id: "goals", label: "0. 학습 목표" },
  { id: "order", label: "1. 학습 순서" },
  { id: "concepts", label: "2. 핵심 개념" },
  { id: "practice", label: "3. 실습" },
  { id: "quiz", label: "4. 퀴즈" },
  { id: "worksheet", label: "5. 백지공부 시트" },
  { id: "assignment", label: "6. 과제" },
  { id: "reading", label: "7. 더 읽을거리" },
];

export default async function WeekPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  const { prev, next } = getAdjacentWeeks(week.number);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">{week.phase}</p>
        <h1 className="text-3xl font-black text-ink">
          Week {week.number} · {week.title}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-secondary">{week.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span>{week.selfHours} + {week.sessionHours}</span>
          <span>난이도 {"★".repeat(week.difficulty)}{"☆".repeat(5 - week.difficulty)}</span>
          <span>{week.keywords.join(" · ")}</span>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-12">
          <section id="goals" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">0. 학습 목표</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-secondary">
              {week.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </section>

          <section id="order" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">1. 학습 순서 (권장)</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-secondary">
              {week.learningOrder.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ol>
          </section>

          <section id="concepts" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">2. 핵심 개념</h2>
            <Markdown source={week.conceptsMd} />
          </section>

          <section id="practice" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">3. 실습</h2>
            <Markdown source={week.practiceMd} />
          </section>

          <section id="quiz" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">4. 퀴즈 (자기 점검)</h2>
            <p className="mb-3 text-sm text-ink-muted">
              정답은 공개하지 않습니다 — 스스로 답을 적어보고, 세션에서 함께 확인하세요.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink-secondary">
              {week.quiz.map((q) => (
                <li key={q.id}><Inline text={q.question} /></li>
              ))}
            </ol>
          </section>

          <section id="worksheet" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">5. 백지공부 시트</h2>
            <Worksheet slug={week.slug} fields={week.worksheet} />
          </section>

          <section id="assignment" className="scroll-mt-24">
            <h2 className="mb-1 text-xl font-black text-ink">6. 과제</h2>
            <p className="mb-3 text-sm font-medium text-[var(--series-orange)]">{week.dueNote}</p>
            <Markdown source={week.assignmentMd} />
          </section>

          <section id="reading" className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-black text-ink">7. 더 읽을거리</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-secondary">
              {week.furtherReading.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>

          <nav className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-6">
            {prev ? (
              <Link href={`/weeks/${prev.slug}`} className="text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                ← Week {prev.number} · {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/weeks/${next.slug}`} className="text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                Week {next.number} · {next.title} →
              </Link>
            ) : (
              <Link href="/curriculum" className="text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                커리큘럼으로 →
              </Link>
            )}
          </nav>
        </div>

        <aside className="print:hidden">
          <div className="sticky top-20 space-y-5">
            <Checklist slug={week.slug} />
            <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">이 페이지</h3>
              <ul className="space-y-1.5 text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink-secondary hover:text-[var(--series-blue)]">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
