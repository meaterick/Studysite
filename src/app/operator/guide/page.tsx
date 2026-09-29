import { operatorGuide } from "@/content/operator/guide";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "운영 가이드" };

export default async function OperatorGuidePage() {
  await requireAdmin("/operator/guide");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-black text-ink">{operatorGuide.title}</h1>
      <p className="mb-8 text-sm text-ink-secondary">{operatorGuide.subtitle}</p>
      <Markdown source={operatorGuide.md} />
    </div>
  );
}
