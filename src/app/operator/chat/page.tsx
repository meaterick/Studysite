import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "채팅" };

export default async function OperatorChatIndex() {
  await requireAdmin("/operator/chat");
  return (
    <div className="hidden h-[min(72dvh,720px)] min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] text-sm text-ink-muted lg:flex">
      대화를 선택하십시오
    </div>
  );
}
