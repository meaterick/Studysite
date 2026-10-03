import "server-only";
import crypto from "crypto";
import { EventEmitter } from "events";
import { all, get, run, tx } from "./db";

// 스터디원 ↔ 운영자 채팅. 스터디원마다 대화 하나를 두고(conversations), 과제와 상관없이 언제든 메시지를
// 주고받는다(chat_messages, 운영자는 누구나 답할 수 있다). 읽음 시각을 양쪽에 따로 기록해 새 메시지를
// 표시하고, 메시지가 바뀌면 같은 프로세스 안의 구독자(SSE 스트림)에게 곧바로 알린다.

export const CHAT_LIMITS = { messageMax: 4000, messagesMax: 1000 } as const;

export type ChatRole = "member" | "admin";

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  /** 예전 과제별 대화에서 옮겨 온 메시지의 주제(예: "3주차 과제") */
  topic?: string;
}

export interface Conversation {
  userId: string;
  messages: ChatMessage[];
  memberReadAt?: string;
  adminReadAt?: string;
  updatedAt: string;
}

// ─── 변경 알림 ───────────────────────────────────────────────────────────
// 서버는 PM2 fork 모드 단일 프로세스로 돈다(ecosystem.config.js). 개발 서버의 모듈 재로딩에도
// 구독자가 끊기지 않도록 이벤트 버스는 globalThis에 하나만 둔다.

const globalBus = globalThis as unknown as { __aegisChatBus?: EventEmitter };
const bus = (globalBus.__aegisChatBus ??= new EventEmitter().setMaxListeners(0));

/** 대화가 바뀌면(메시지·읽음) 해당 스터디원 id로 호출된다. 구독 해제 함수를 돌려준다. */
export function subscribeChat(listener: (userId: string) => void): () => void {
  bus.on("change", listener);
  return () => {
    bus.off("change", listener);
  };
}

/** 대화가 바뀌었음을 열려 있는 채팅 창에 알린다(계정 삭제처럼 이 모듈 밖에서 대화가 지워질 때도 부른다). */
export function notifyChatChange(userId: string): void {
  bus.emit("change", userId);
}

// ─── 조회 ────────────────────────────────────────────────────────────────

interface MessageRow {
  id: string;
  author_id: string;
  author_name: string;
  role: ChatRole;
  text: string;
  created_at: string;
  topic: string | null;
}

export function findConversation(userId: string): Conversation | undefined {
  const conv = get<{ member_read_at: string | null; admin_read_at: string | null; updated_at: string }>(
    "SELECT member_read_at, admin_read_at, updated_at FROM conversations WHERE user_id = ?",
    userId
  );
  if (!conv) return undefined;
  const messages = all<MessageRow>(
    "SELECT id, author_id, author_name, role, text, created_at, topic FROM chat_messages WHERE user_id = ? ORDER BY created_at, rowid",
    userId
  );
  return {
    userId,
    messages: messages.map((m) => ({
      id: m.id,
      authorId: m.author_id,
      authorName: m.author_name,
      role: m.role,
      text: m.text,
      createdAt: m.created_at,
      topic: m.topic ?? undefined,
    })),
    memberReadAt: conv.member_read_at ?? undefined,
    adminReadAt: conv.admin_read_at ?? undefined,
    updatedAt: conv.updated_at,
  };
}

/** 상대방이 보낸 메시지 중 내가 아직 읽지 않은 것의 수 */
export function unreadCount(conv: Conversation | undefined, viewer: ChatRole): number {
  if (!conv) return 0;
  const readAt = viewer === "admin" ? conv.adminReadAt : conv.memberReadAt;
  return conv.messages.filter((m) => m.role !== viewer && (!readAt || m.createdAt > readAt)).length;
}

/** 운영자 목록용: 대화마다 마지막 메시지와 운영자가 읽지 않은 메시지 수(최근 대화 순) */
export interface ConversationSummary {
  userId: string;
  updatedAt: string;
  lastText?: string;
  lastRole?: ChatRole;
  unreadForAdmin: number;
}

export function listConversationSummaries(): ConversationSummary[] {
  const rows = all<{ user_id: string; updated_at: string; last_text: string | null; last_role: ChatRole | null; unread: number }>(
    `SELECT c.user_id, c.updated_at, last.text AS last_text, last.role AS last_role,
            (SELECT COUNT(*) FROM chat_messages m
              WHERE m.user_id = c.user_id AND m.role = 'member'
                AND (c.admin_read_at IS NULL OR m.created_at > c.admin_read_at)) AS unread
       FROM conversations c
       LEFT JOIN chat_messages last ON last.rowid = (
         SELECT rowid FROM chat_messages WHERE user_id = c.user_id ORDER BY created_at DESC, rowid DESC LIMIT 1)
      ORDER BY c.updated_at DESC`
  );
  return rows.map((r) => ({
    userId: r.user_id,
    updatedAt: r.updated_at,
    lastText: r.last_text ?? undefined,
    lastRole: r.last_role ?? undefined,
    unreadForAdmin: r.unread,
  }));
}

/** 운영자가 읽지 않은 메시지가 있는 대화 수와 메시지 수 */
export function adminUnreadTotals(): { conversations: number; messages: number } {
  const row = get<{ conversations: number; messages: number }>(
    `SELECT COUNT(DISTINCT m.user_id) AS conversations, COUNT(*) AS messages
       FROM chat_messages m JOIN conversations c ON c.user_id = m.user_id
      WHERE m.role = 'member' AND (c.admin_read_at IS NULL OR m.created_at > c.admin_read_at)`
  );
  return { conversations: row?.conversations ?? 0, messages: row?.messages ?? 0 };
}

// ─── 쓰기 ────────────────────────────────────────────────────────────────

const INSERT_MESSAGE =
  "INSERT INTO chat_messages (id, user_id, author_id, author_name, role, text, created_at, topic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

/** 대화 하나를 메시지까지 통째로 써 넣는다(같은 사용자의 대화가 있으면 바꾼다). 옛 JSON 가져오기에 쓴다. */
export function replaceConversation(conv: Conversation): void {
  tx(() => {
    run("DELETE FROM conversations WHERE user_id = ?", conv.userId);
    run(
      "INSERT INTO conversations (user_id, member_read_at, admin_read_at, updated_at) VALUES (?, ?, ?, ?)",
      conv.userId,
      conv.memberReadAt,
      conv.adminReadAt,
      conv.updatedAt
    );
    for (const m of conv.messages.slice(-CHAT_LIMITS.messagesMax)) {
      run(INSERT_MESSAGE, m.id, conv.userId, m.authorId, m.authorName, m.role, m.text, m.createdAt, m.topic);
    }
  });
}

export function postChatMessage(input: {
  userId: string;
  author: { id: string; name: string; role: ChatRole };
  text: string;
}): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    authorId: input.author.id,
    authorName: input.author.name,
    role: input.author.role,
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  try {
    tx(() => {
      const now = message.createdAt;
      run("INSERT INTO conversations (user_id, updated_at) VALUES (?, ?) ON CONFLICT (user_id) DO NOTHING", input.userId, now);
      run(INSERT_MESSAGE, message.id, input.userId, message.authorId, message.authorName, message.role, message.text, now, null);
      // 대화마다 최근 메시지만 남긴다.
      run(
        `DELETE FROM chat_messages WHERE user_id = ? AND rowid NOT IN (
           SELECT rowid FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)`,
        input.userId,
        input.userId,
        CHAT_LIMITS.messagesMax
      );
      // 자기가 보낸 메시지까지는 읽은 것으로 본다.
      run(
        `UPDATE conversations SET ${input.author.role === "admin" ? "admin_read_at" : "member_read_at"} = ?, updated_at = ? WHERE user_id = ?`,
        now,
        now,
        input.userId
      );
    });
  } catch (err) {
    return Promise.reject(err);
  }
  notifyChatChange(input.userId);
  return Promise.resolve(message);
}

export function markChatRead(userId: string, viewer: ChatRole): Promise<void> {
  const column = viewer === "admin" ? "admin_read_at" : "member_read_at";
  const changed = tx(() => {
    const conv = get<{ read_at: string | null }>(`SELECT ${column} AS read_at FROM conversations WHERE user_id = ?`, userId);
    if (!conv) return false;
    const unread = get(
      "SELECT 1 FROM chat_messages WHERE user_id = ? AND role != ? AND (? IS NULL OR created_at > ?) LIMIT 1",
      userId,
      viewer,
      conv.read_at,
      conv.read_at
    );
    if (!unread) return false;
    run(`UPDATE conversations SET ${column} = ? WHERE user_id = ?`, new Date().toISOString(), userId);
    return true;
  });
  if (changed) notifyChatChange(userId);
  return Promise.resolve();
}

/** 한 스터디원과의 대화를 지운다. */
export function deleteUserChats(userId: string): Promise<void> {
  if (run("DELETE FROM conversations WHERE user_id = ?", userId).changes > 0) notifyChatChange(userId);
  return Promise.resolve();
}

/** 운영자가 모든 대화를 지운다. 지운 대화 수를 돌려준다. 열려 있는 채팅 창에도 곧바로 반영된다. */
export function deleteAllChats(): Promise<number> {
  const ids = tx(() => {
    const ids = all<{ user_id: string }>("SELECT user_id FROM conversations").map((r) => r.user_id);
    run("DELETE FROM conversations");
    return ids;
  });
  for (const id of ids) notifyChatChange(id);
  return Promise.resolve(ids.length);
}
