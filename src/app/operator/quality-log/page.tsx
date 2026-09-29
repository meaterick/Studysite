import { qualityLog } from "@/content/operator/qualityLog";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "품질 검토·개선 로그" };

export default async function QualityLogPage() {
  await requireAdmin("/operator/quality-log");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-black text-ink">{qualityLog.title}</h1>
      <p className="mb-8 text-sm italic text-ink-secondary">{qualityLog.subtitle}</p>
      <Markdown source={qualityLog.md} />
    </div>
  );
}
