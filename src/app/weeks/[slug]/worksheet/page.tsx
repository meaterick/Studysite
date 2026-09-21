import { notFound } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import Worksheet from "@/components/Worksheet";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekWorksheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();

  return (
    <section id="worksheet" className="scroll-mt-24">
      <h2 className="mb-3 text-xl font-black text-ink">백지공부 시트</h2>
      <Worksheet slug={slug} fields={week.worksheet} />
    </section>
  );
}
