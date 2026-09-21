import { notFound } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer } from "@/components/MarkdownBlocks";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekAssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  const blocks = parseMarkdown(week.assignmentMd);

  return (
    <section id="assignment" className="scroll-mt-24">
      <h2 className="mb-1 text-xl font-black text-ink">과제</h2>
      <p className="mb-4 text-sm font-medium text-[var(--series-orange)]">{week.dueNote}</p>
      <p className="mb-4 text-sm text-ink-muted">
        코드가 있는 실습은 한 번에 하나씩만 공개됩니다 — 지금 것을 실행해보면 다음 실습이 열립니다.
      </p>
      <BlocksRenderer blocks={blocks} docKey={`${slug}:assignment`} interactiveCode gateCode gateSlug={slug} />
    </section>
  );
}
