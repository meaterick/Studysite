import { operatorGuide } from "@/content/operator/guide";
import PageHeader from "@/components/PageHeader";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "운영 가이드" };

export default async function OperatorGuidePage() {
  await requireAdmin("/operator/guide");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader tone="operator" eyebrow="운영자" title={operatorGuide.title} description={operatorGuide.subtitle} />
      <Markdown source={operatorGuide.md} />
    </div>
  );
}
