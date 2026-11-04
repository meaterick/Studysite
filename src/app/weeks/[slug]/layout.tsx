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

  const navItem = (label: string, href: string, title: string, align: "left" | "right") => (
    <Link href={href} className={`group min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <span className="kicker block">{label}</span>
      <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">{title}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {children}
      <nav aria-label="다른 주차" className="mt-24 grid grid-cols-2 gap-8 border-t border-[var(--border-hairline)] pt-8 print:hidden">
        {prev ? navItem("Previous week", `/weeks/${prev.slug}`, `${prev.number}주차 · ${prev.title}`, "left") : <span />}
        {next ? navItem("Next week", `/weeks/${next.slug}`, `${next.number}주차 · ${next.title}`, "right") : navItem("Overview", "/curriculum", "커리큘럼", "right")}
      </nav>
    </div>
  );
}
