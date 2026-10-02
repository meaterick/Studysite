import { qualityLog } from "@/content/operator/qualityLog";
import PageHeader from "@/components/PageHeader";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "품질 검토·개선 로그" };

export default async function QualityLogPage() {
  await requireAdmin("/operator/quality-log");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader tone="operator" eyebrow="운영자" title={qualityLog.title} description={qualityLog.subtitle} />
      <Markdown source={qualityLog.md} />
    </div>
  );
}
