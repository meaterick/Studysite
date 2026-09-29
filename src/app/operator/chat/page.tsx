import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "채팅" };

export default async function OperatorChatIndex() {
  await requireAdmin("/operator/chat");
  return (
    <div className="hidden h-[min(72dvh,720px)] min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[var(--border-hairline)] text-sm text-ink-muted lg:flex">
      왼쪽 목록에서 대화할 스터디원을 고르십시오.
    </div>
  );
}
