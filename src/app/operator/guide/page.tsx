import { operatorGuide } from "@/content/operator/guide";
import PageHeader from "@/components/PageHeader";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "운영 가이드" };

export default async function OperatorGuidePage() {
  await requireAdmin("/operator/guide");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title={operatorGuide.title} description={operatorGuide.subtitle} />
      <Markdown source={operatorGuide.md} />
    </div>
  );
}
