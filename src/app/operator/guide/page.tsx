import { operatorGuide } from "@/content/operator/guide";
import Markdown from "@/components/MarkdownBlocks";

export const metadata = { title: "운영 가이드" };

export default function OperatorGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용</p>
      <h1 className="mb-2 text-3xl font-black text-ink">{operatorGuide.title}</h1>
      <p className="mb-8 text-sm italic text-ink-secondary">{operatorGuide.subtitle}</p>
      <Markdown source={operatorGuide.md} />
    </div>
  );
}
