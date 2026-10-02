import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS, getWeek, getAdjacentWeeks } from "@/content/weeks";
import { requireUser } from "@/lib/dal";

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
  return { title: `${week.number}주차 · ${week.title}` };
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {children}
      <nav aria-label="다른 주차" className="mt-14 grid gap-3 border-t border-[var(--border-hairline)] pt-8 sm:grid-cols-2 print:hidden">
        {prev ? (
          <Link href={`/weeks/${prev.slug}`} className="surface surface-link group block min-w-0 p-4">
            <span className="block text-xs font-bold text-ink-muted">← 이전 주차</span>
            <span className="mt-1 block truncate font-black text-ink group-hover:text-[var(--series-blue)]">
              {prev.number}주차 · {prev.title}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link href={`/weeks/${next.slug}`} className="surface surface-link group block min-w-0 p-4 text-right">
            <span className="block text-xs font-bold text-ink-muted">다음 주차 →</span>
            <span className="mt-1 block truncate font-black text-ink group-hover:text-[var(--series-blue)]">
              {next.number}주차 · {next.title}
            </span>
          </Link>
        ) : (
          <Link href="/curriculum" className="surface surface-link group block min-w-0 p-4 text-right">
            <span className="block text-xs font-bold text-ink-muted">과정 마무리</span>
            <span className="mt-1 block font-black text-ink group-hover:text-[var(--series-blue)]">커리큘럼 보기 →</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
