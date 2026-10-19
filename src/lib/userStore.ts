import "server-only";
import crypto from "crypto";
import { all, get, run, tx } from "./db";
import { deleteUserDrafts } from "./assignmentDraftStore";
import { notifyChatChange } from "./chatStore";
import { removeSubmissionUploads } from "./submissionStore";

// 회원 정보(users 테이블). 이메일과 Google subject에 UNIQUE 제약이 있어, 같은 순간에 가입이 겹쳐도
// 계정이 덮어써지거나 중복으로 생기지 않는다.

export type Role = "admin" | "member";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  /** Google OAuth의 안정적인 사용자 식별자(subject)입니다. */
  googleSubject?: string;
  role: Role;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  google_subject: string | null;
  role: Role;
  created_at: string;
}

const COLUMNS = "id, email, name, google_subject, role, created_at";

function fromRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    googleSubject: row.google_subject ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  };
}

function toPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function listUsers(): PublicUser[] {
  return all<UserRow>(`SELECT ${COLUMNS} FROM users ORDER BY created_at`).map((r) => toPublic(fromRow(r)));
}

export function countUsersByRole(): Record<Role, number> {
  const counts: Record<Role, number> = { admin: 0, member: 0 };
  for (const r of all<{ role: Role; n: number }>("SELECT role, COUNT(*) AS n FROM users GROUP BY role")) counts[r.role] = r.n;
  return counts;
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const row = get<UserRow>(`SELECT ${COLUMNS} FROM users WHERE email = ?`, email.trim().toLowerCase());
  return row && fromRow(row);
}

export function findUserById(id: string): UserRecord | undefined {
  const row = get<UserRow>(`SELECT ${COLUMNS} FROM users WHERE id = ?`, id);
  return row && fromRow(row);
}

function resolveRole(email: string, isFirstUser: boolean): Role {
  const adminAllowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminAllowlist.includes(email)) return "admin";
  // Public deployments must never grant admin to the first anonymous visitor.
  if (isFirstUser && process.env.NODE_ENV !== "production") return "admin";
  return "member";
}

/**
 * Google이 확인한 이메일을 기준으로 기존 계정을 연결하거나 신규 계정을 만듭니다.
 * subject를 같이 저장해 이후 이메일 표시명이 바뀌어도 같은 Google 계정을 식별합니다.
 * 확인과 생성을 한 트랜잭션에서 해 동시 가입에도 안전합니다.
 */
export async function findOrCreateGoogleUser(input: {
  email: string;
  name: string;
  subject: string;
}): Promise<UserRecord> {
  const email = input.email.trim().toLowerCase();
  return tx(() => {
    const bySubject = get<UserRow>(`SELECT ${COLUMNS} FROM users WHERE google_subject = ?`, input.subject);
    if (bySubject) return fromRow(bySubject);

    const byEmail = get<UserRow>(`SELECT ${COLUMNS} FROM users WHERE email = ?`, email);
    if (byEmail) {
      // 이미 다른 Google 계정에 연결된 이메일은 조용히 덮어쓰지 않습니다.
      if (byEmail.google_subject && byEmail.google_subject !== input.subject) {
        throw new Error("GOOGLE_ACCOUNT_MISMATCH");
      }
      run("UPDATE users SET google_subject = ? WHERE id = ?", input.subject, byEmail.id);
      return { ...fromRow(byEmail), googleSubject: input.subject };
    }

    const isFirstUser = !get("SELECT 1 FROM users LIMIT 1");
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email,
      name: input.name.trim().slice(0, 40) || "Google 사용자",
      googleSubject: input.subject,
      role: resolveRole(email, isFirstUser),
      createdAt: new Date().toISOString(),
    };
    run(
      `INSERT INTO users (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
      user.id,
      user.email,
      user.name,
      user.googleSubject,
      user.role,
      user.createdAt
    );
    return user;
  });
}

/** 계정과 그 계정의 모든 기록(학습·과제·채팅은 DB에서 함께 지워지고, 첨부 파일·작업 공간 초안은 파일로 지운다). */
export async function deleteUser(id: string): Promise<void> {
  const submissionIds = tx(() => {
    const ids = all<{ id: string }>("SELECT id FROM submissions WHERE user_id = ?", id).map((r) => r.id);
    run("DELETE FROM users WHERE id = ?", id);
    return ids;
  });
  removeSubmissionUploads(submissionIds);
  deleteUserDrafts(id);
  notifyChatChange(id);
}

export { toPublic };
