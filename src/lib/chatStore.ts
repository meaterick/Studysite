import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { EventEmitter } from "events";

// 스터디원 ↔ 운영자 채팅. 스터디원마다 대화 하나를 두고, 과제와 상관없이 언제든 메시지를
// 주고받는다(운영자는 누구나 답할 수 있다). 읽음 시각을 양쪽에 따로 기록해 새 메시지를 표시하고,
// 메시지가 바뀌면 같은 프로세스 안의 구독자(SSE 스트림)에게 곧바로 알린다.
//
// 예전의 과제별 대화(threads.json)가 있으면 처음 읽을 때 한 번 이 형식으로 옮긴다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");
const LEGACY_THREADS_FILE = path.join(DATA_DIR, "threads.json");

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

// ─── 저장 ────────────────────────────────────────────────────────────────

interface LegacyThread {
  userId: string;
  weekSlug: string;
  messages: Omit<ChatMessage, "topic">[];
  memberReadAt?: string;
  adminReadAt?: string;
  updatedAt: string;
}

function migrateLegacyThreads() {
  if (fs.existsSync(CHATS_FILE) || !fs.existsSync(LEGACY_THREADS_FILE)) return;
  let legacy: LegacyThread[];
  try {
    const parsed = JSON.parse(fs.readFileSync(LEGACY_THREADS_FILE, "utf8"));
    legacy = Array.isArray(parsed) ? parsed : [];
  } catch {
    return;
  }
  const byUser = new Map<string, Conversation>();
  const maxIso = (a?: string, b?: string) => (!a ? b : !b ? a : a > b ? a : b);
  for (const t of legacy) {
    const conv = byUser.get(t.userId) ?? { userId: t.userId, messages: [], updatedAt: t.updatedAt };
    const week = /^week(\d+)$/.exec(t.weekSlug)?.[1];
    const topic = week ? `${week}주차 과제` : "과제";
    conv.messages.push(...t.messages.map((m) => ({ ...m, topic })));
    conv.memberReadAt = maxIso(conv.memberReadAt, t.memberReadAt);
    conv.adminReadAt = maxIso(conv.adminReadAt, t.adminReadAt);
    conv.updatedAt = maxIso(conv.updatedAt, t.updatedAt) ?? t.updatedAt;
    byUser.set(t.userId, conv);
  }
  for (const conv of byUser.values()) {
    conv.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    conv.messages = conv.messages.slice(-CHAT_LIMITS.messagesMax);
  }
  writeAll([...byUser.values()]);
  // 내용은 모두 chats.json으로 옮겼으므로, 탈퇴 시 지워지지 않는 사본이 남지 않도록 원본을 없앤다.
  fs.rmSync(LEGACY_THREADS_FILE, { force: true });
}

function readAll(): Conversation[] {
  migrateLegacyThreads();
  if (!fs.existsSync(CHATS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(CHATS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(next: Conversation[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${CHATS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmp, CHATS_FILE);
}

let writeChain: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => T): Promise<T> {
  const run = writeChain.then(task);
  writeChain = run.catch(() => undefined);
  return run;
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

function notify(userId: string) {
  bus.emit("change", userId);
}

// ─── 조회·쓰기 ───────────────────────────────────────────────────────────

export function findConversation(userId: string): Conversation | undefined {
  return readAll().find((c) => c.userId === userId);
}

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 상대방이 보낸 메시지 중 내가 아직 읽지 않은 것의 수 */
export function unreadCount(conv: Conversation | undefined, viewer: ChatRole): number {
  if (!conv) return 0;
  const readAt = viewer === "admin" ? conv.adminReadAt : conv.memberReadAt;
  return conv.messages.filter((m) => m.role !== viewer && (!readAt || m.createdAt > readAt)).length;
}

export function postChatMessage(input: {
  userId: string;
  author: { id: string; name: string; role: ChatRole };
  text: string;
}): Promise<ChatMessage> {
  return enqueue(() => {
    const all = readAll();
    const now = new Date().toISOString();
    let conv = all.find((c) => c.userId === input.userId);
    if (!conv) {
      conv = { userId: input.userId, messages: [], updatedAt: now };
      all.push(conv);
    }
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      authorId: input.author.id,
      authorName: input.author.name,
      role: input.author.role,
      text: input.text,
      createdAt: now,
    };
    conv.messages.push(message);
    conv.messages = conv.messages.slice(-CHAT_LIMITS.messagesMax);
    // 자기가 보낸 메시지까지는 읽은 것으로 본다.
    if (input.author.role === "admin") conv.adminReadAt = now;
    else conv.memberReadAt = now;
    conv.updatedAt = now;
    writeAll(all);
    notify(input.userId);
    return message;
  });
}

export function markChatRead(userId: string, viewer: ChatRole): Promise<void> {
  return enqueue(() => {
    const all = readAll();
    const conv = all.find((c) => c.userId === userId);
    if (!conv || unreadCount(conv, viewer) === 0) return;
    const now = new Date().toISOString();
    if (viewer === "admin") conv.adminReadAt = now;
    else conv.memberReadAt = now;
    writeAll(all);
    notify(userId);
  });
}

export function deleteUserChats(userId: string): Promise<void> {
  return enqueue(() => {
    const all = readAll();
    const next = all.filter((c) => c.userId !== userId);
    if (next.length !== all.length) {
      writeAll(next);
      notify(userId);
    }
  });
}

/** 운영자가 모든 대화를 지운다. 지운 대화 수를 돌려준다. 열려 있는 채팅 창에도 곧바로 반영된다. */
export function deleteAllChats(): Promise<number> {
  return enqueue(() => {
    const all = readAll();
    if (all.length === 0) return 0;
    writeAll([]);
    for (const c of all) notify(c.userId);
    return all.length;
  });
}
