import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS, getWeek, getAdjacentWeeks } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { slugify } from "@/components/MarkdownBlocks";
import { requireUser } from "@/lib/dal";
import WeekLearningShell from "@/components/WeekLearningShell";
import { type StudyChapter } from "@/components/WeekStudyToc";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

function getStudyChapters(conceptsMd: string): StudyChapter[] {
  const topLevel: StudyChapter[] = [
    { id: "goals", label: "학습 목표" },
    { id: "order", label: "학습 순서" },
    { id: "concepts", label: "핵심 개념 · 실습" },
  ];
  const contentChapters = parseMarkdown(conceptsMd)
    .filter((block): block is Extract<typeof block, { type: "heading" }> => block.type === "heading")
    .map((block) => ({ id: slugify(block.text), label: block.text, level: block.level }));
  return [...topLevel, ...contentChapters];
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

export default async function WeekLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser(`/weeks/${slug}`);
  const week = getWeek(slug);
  if (!week) notFound();
  const { prev, next } = getAdjacentWeeks(week.number);
  const chapters = getStudyChapters(week.conceptsMd);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">{week.phase}</p>
        <h1 className="text-2xl font-black leading-tight text-ink sm:text-3xl">
          Week {week.number} · {week.title}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-secondary">{week.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span>난이도 {"★".repeat(week.difficulty)}{"☆".repeat(5 - week.difficulty)}</span>
          <span>{week.keywords.join(" · ")}</span>
        </div>
      </div>

      <WeekLearningShell
        slug={slug}
        chapters={chapters}
        navigation={
          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-6 text-center sm:mt-12">
            {prev ? (
              <Link href={`/weeks/${prev.slug}`} className="min-w-0 text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                ← Week {prev.number} · {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/weeks/${next.slug}`} className="min-w-0 text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                Week {next.number} · {next.title} →
              </Link>
            ) : (
              <Link href="/curriculum" className="text-sm font-bold text-ink-secondary hover:text-[var(--series-blue)]">
                커리큘럼으로 →
              </Link>
            )}
          </nav>
        }
      >
        {children}
      </WeekLearningShell>
    </div>
  );
}
