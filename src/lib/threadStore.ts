import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// 과제별 질문·피드백 대화. (스터디원, 주차)마다 대화 하나를 두고, 스터디원과 운영자가
// 사이트 안에서 메시지를 주고받는다. 읽음 시각을 양쪽에 따로 기록해 새 메시지를 표시한다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const THREADS_FILE = path.join(DATA_DIR, "threads.json");

export const THREAD_LIMITS = { messageMax: 4000, messagesMax: 200 } as const;

export interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  role: "member" | "admin";
  text: string;
  createdAt: string;
}

export interface AssignmentThread {
  userId: string;
  weekSlug: string;
  messages: ThreadMessage[];
  memberReadAt?: string;
  adminReadAt?: string;
  updatedAt: string;
}

function readAll(): AssignmentThread[] {
  if (!fs.existsSync(THREADS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(THREADS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(next: AssignmentThread[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${THREADS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmp, THREADS_FILE);
}

let writeChain: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => T): Promise<T> {
  const run = writeChain.then(task);
  writeChain = run.catch(() => undefined);
  return run;
}

export function findThread(userId: string, weekSlug: string): AssignmentThread | undefined {
  return readAll().find((t) => t.userId === userId && t.weekSlug === weekSlug);
}

export function listThreads(): AssignmentThread[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 상대방이 보낸 메시지 중 내가 아직 읽지 않은 것의 수 */
export function unreadCount(thread: AssignmentThread | undefined, viewer: "member" | "admin"): number {
  if (!thread) return 0;
  const readAt = viewer === "admin" ? thread.adminReadAt : thread.memberReadAt;
  return thread.messages.filter((m) => m.role !== viewer && (!readAt || m.createdAt > readAt)).length;
}

export function postMessage(input: {
  userId: string;
  weekSlug: string;
  author: { id: string; name: string; role: "member" | "admin" };
  text: string;
}): Promise<AssignmentThread> {
  return enqueue(() => {
    const all = readAll();
    const now = new Date().toISOString();
    let thread = all.find((t) => t.userId === input.userId && t.weekSlug === input.weekSlug);
    if (!thread) {
      thread = { userId: input.userId, weekSlug: input.weekSlug, messages: [], updatedAt: now };
      all.push(thread);
    }
    thread.messages.push({
      id: crypto.randomUUID(),
      authorId: input.author.id,
      authorName: input.author.name,
      role: input.author.role,
      text: input.text,
      createdAt: now,
    });
    thread.messages = thread.messages.slice(-THREAD_LIMITS.messagesMax);
    // 자기가 보낸 메시지까지는 읽은 것으로 본다.
    if (input.author.role === "admin") thread.adminReadAt = now;
    else thread.memberReadAt = now;
    thread.updatedAt = now;
    writeAll(all);
    return thread;
  });
}

export function markThreadRead(userId: string, weekSlug: string, viewer: "member" | "admin"): Promise<void> {
  return enqueue(() => {
    const all = readAll();
    const thread = all.find((t) => t.userId === userId && t.weekSlug === weekSlug);
    if (!thread || unreadCount(thread, viewer) === 0) return;
    const now = new Date().toISOString();
    if (viewer === "admin") thread.adminReadAt = now;
    else thread.memberReadAt = now;
    writeAll(all);
  });
}

export function deleteUserThreads(userId: string): Promise<void> {
  return enqueue(() => {
    const all = readAll();
    const next = all.filter((t) => t.userId !== userId);
    if (next.length !== all.length) writeAll(next);
  });
}
