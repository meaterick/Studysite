import { qualityLog } from "@/content/operator/qualityLog";
import Markdown from "@/components/MarkdownBlocks";

export const metadata = { title: "품질 검토·개선 로그" };

export default function QualityLogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용</p>
      <h1 className="mb-2 text-3xl font-black text-ink">{qualityLog.title}</h1>
      <p className="mb-8 text-sm italic text-ink-secondary">{qualityLog.subtitle}</p>
      <Markdown source={qualityLog.md} />
    </div>
  );
}
