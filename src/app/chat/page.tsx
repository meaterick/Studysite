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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="1:1 문의"
        title="운영자 채팅"
        description="과제, 학습 내용, 스터디 운영 등 무엇이든 물어볼 수 있습니다. 어느 주차의 어떤 부분인지 함께 적어 주시면 답변이 빨라집니다."
        className="mb-6"
      />
      <ChatPanel
        viewer="member"
        initial={conversationView(user.id, "member")}
        placeholder="운영자에게 보낼 메시지"
        emptyText="궁금한 점이 있으면 메시지를 남겨 주십시오. 운영자의 답변이 오면 이곳에 바로 표시됩니다."
      />
    </div>
  );
}
