import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { conversationView } from "@/lib/chatView";
import ChatPanel from "@/components/chat/ChatPanel";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "운영자 채팅" };

export default async function ChatPage() {
  const user = await requireUser("/chat");
  if (user.role === "admin") redirect("/operator/chat");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="운영자 채팅" className="mb-8" />
      <ChatPanel
        viewer="member"
        initial={conversationView(user.id, "member")}
        placeholder="운영자에게 보낼 메시지"
        emptyText="궁금한 점을 남겨 주십시오. 어느 주차의 어떤 부분인지 함께 적으면 답이 빨라집니다."
      />
    </div>
  );
}
