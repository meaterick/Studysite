import PageHeader from "@/components/PageHeader";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/dal";
import { inboxView } from "@/lib/chatView";
import ChatInbox from "@/components/chat/ChatInbox";
import ClearChatButton from "@/components/chat/ClearChatButton";

export default async function OperatorChatLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/operator/chat");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        tone="operator"
        eyebrow="운영자"
        title="채팅"
        description="스터디원과 과제·학습에 관한 메시지를 실시간으로 주고받습니다."
        actions={<ClearChatButton />}
        className="mb-6"
      />
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ChatInbox initial={inboxView()} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
