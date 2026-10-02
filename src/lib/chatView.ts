import "server-only";
import { adminUnreadTotals, findConversation, listConversationSummaries, unreadCount, type ChatRole, type Conversation } from "./chatStore";
import { listUsers } from "./userStore";
import type { ConversationView, InboxItemView } from "@/components/chat/types";

export function conversationView(userId: string, viewer: ChatRole, conv: Conversation | undefined = findConversation(userId)): ConversationView {
  return {
    userId,
    messages: (conv?.messages ?? []).map((m) => ({
      id: m.id,
      authorName: m.authorName,
      role: m.role,
      text: m.text,
      createdAt: m.createdAt,
      topic: m.topic,
    })),
    otherReadAt: viewer === "admin" ? conv?.memberReadAt : conv?.adminReadAt,
    unread: unreadCount(conv, viewer),
  };
}

/** 운영자 채팅 목록: 모든 스터디원(관리자 제외)을 최근 대화 순으로, 대화가 없는 사람은 뒤에 이름순으로 */
export function inboxView(): InboxItemView[] {
  const convs = new Map(listConversationSummaries().map((c) => [c.userId, c]));
  const items: InboxItemView[] = listUsers()
    .filter((u) => u.role !== "admin" || convs.has(u.id))
    .map((u) => {
      const conv = convs.get(u.id);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        lastText: conv?.lastText?.slice(0, 140),
        lastRole: conv?.lastRole,
        updatedAt: conv?.lastText !== undefined ? conv.updatedAt : undefined,
        unread: conv?.unreadForAdmin ?? 0,
      };
    });
  return items.sort(
    (a, b) =>
      (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || a.name.localeCompare(b.name, "ko")
  );
}

export function adminUnreadTotal(): { conversations: number; messages: number } {
  return adminUnreadTotals();
}
