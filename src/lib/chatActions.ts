"use server";

import { requireAdmin, requireUser } from "./dal";
import { findUserById } from "./userStore";
import { CHAT_LIMITS, markChatRead, postChatMessage } from "./chatStore";
import { consumeRate, RATE_LIMIT_MESSAGE, RATE_RULES } from "./rateLimit";
import type { ChatMessageView } from "@/components/chat/types";

// 채팅 액션. 브라우저에서 임의로 호출될 수 있으므로 로그인·권한·입력값을 여기서 다시 검증한다.
// 스터디원은 자기 대화에만, 운영자는 targetUserId로 지정한 스터디원의 대화에 쓴다.

export type SendResult = { ok: true; message: ChatMessageView } | { ok: false; error: string };

export async function sendChatMessage(text: string, targetUserId?: string): Promise<SendResult> {
  const body = String(text ?? "").trim();
  if (!body) return { ok: false, error: "메시지를 입력해 주십시오." };
  if (body.length > CHAT_LIMITS.messageMax) {
    return { ok: false, error: `메시지는 ${CHAT_LIMITS.messageMax.toLocaleString()}자 이내로 작성해 주십시오.` };
  }
  let conversationUserId: string;
  let author: { id: string; name: string; role: "member" | "admin" };
  if (targetUserId !== undefined) {
    const admin = await requireAdmin("/operator/chat");
    if (typeof targetUserId !== "string" || !findUserById(targetUserId)) {
      return { ok: false, error: "대화 상대를 찾을 수 없습니다." };
    }
    conversationUserId = targetUserId;
    author = { id: admin.id, name: admin.name, role: "admin" };
  } else {
    const user = await requireUser("/chat");
    if (user.role === "admin") return { ok: false, error: "운영자는 운영자 채팅 화면에서 스터디원을 골라 메시지를 보내 주십시오." };
    conversationUserId = user.id;
    author = { id: user.id, name: user.name, role: "member" };
  }
  if (!consumeRate(`chat:${author.id}`, RATE_RULES.chatMessage)) return { ok: false, error: RATE_LIMIT_MESSAGE };
  const m = await postChatMessage({ userId: conversationUserId, author, text: body });
  return { ok: true, message: { id: m.id, authorName: m.authorName, role: m.role, text: m.text, createdAt: m.createdAt } };
}

export async function markChatConversationRead(targetUserId?: string): Promise<void> {
  if (targetUserId !== undefined) {
    await requireAdmin("/operator/chat");
    if (typeof targetUserId !== "string") return;
    await markChatRead(targetUserId, "admin");
  } else {
    const user = await requireUser("/chat");
    await markChatRead(user.id, "member");
  }
}
