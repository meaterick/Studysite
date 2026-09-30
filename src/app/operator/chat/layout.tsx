import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/dal";
import { inboxView } from "@/lib/chatView";
import ChatInbox from "@/components/chat/ChatInbox";
import ClearChatButton from "@/components/chat/ClearChatButton";

export default async function OperatorChatLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/operator/chat");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/operator" className="text-sm font-bold text-[var(--series-orange)] hover:underline">
        ← 운영자 대시보드
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-ink">채팅</h1>
        <ClearChatButton />
      </div>
      <p className="mt-1 text-sm text-ink-secondary">스터디원과 과제·학습에 관한 메시지를 실시간으로 주고받습니다.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ChatInbox initial={inboxView()} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
