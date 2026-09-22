import { notFound } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import Markdown from "@/components/MarkdownBlocks";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekConceptsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();

  return (
    <div className="space-y-8 sm:space-y-12">
      <section id="goals" className="scroll-mt-24">
        <h2 className="mb-3 text-xl font-black text-ink">학습 목표</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-secondary">
          {week.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </section>

      <section id="order" className="scroll-mt-24">
        <h2 className="mb-3 text-xl font-black text-ink">학습 순서 (권장)</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-secondary">
          {week.learningOrder.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      </section>

      <section id="concepts" className="scroll-mt-24">
        <h2 className="mb-3 text-xl font-black text-ink">핵심 개념 · 실습</h2>
        <p className="mb-3 text-sm text-ink-muted">
          각 개념 설명 바로 뒤에 관련 실습 코드가 이어집니다. 코드는 이 브라우저에서 직접 실행할 수 있습니다 — 서버가 아니라 여러분의 브라우저 안에서 Python이 돌아가며, 작성한 코드는 자동으로 저장됩니다.
        </p>
        <Markdown source={week.conceptsMd} docKey={`${slug}:concepts`} interactiveCode />
      </section>
    </div>
  );
}
