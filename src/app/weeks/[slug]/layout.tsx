import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS, getWeek, getAdjacentWeeks } from "@/content/weeks";
import Checklist from "@/components/Checklist";
import WeekTabs from "@/components/WeekTabs";

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

export default async function WeekLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  const { prev, next } = getAdjacentWeeks(week.number);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">{week.phase}</p>
        <h1 className="text-3xl font-black text-ink">
          Week {week.number} · {week.title}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-secondary">{week.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span>난이도 {"★".repeat(week.difficulty)}{"☆".repeat(5 - week.difficulty)}</span>
          <span>{week.keywords.join(" · ")}</span>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <WeekTabs slug={slug} />
          {children}

          <nav className="mt-12 flex items-center justify-between border-t border-[var(--border-hairline)] pt-6">
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
            <Checklist slug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
