import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { deleteLearningRecord } from "./learningStore";

// 배포 환경(OCI)에서는 DATA_DIR이 `.next`(매 배포마다 삭제됨) 바깥의 안정적인
// 디렉터리(DEPLOY_DIR/data)를 가리키도록 설정되어, 재배포해도 회원 정보가
// 유지됩니다. 로컬 개발에서는 프로젝트 루트의 `data/`를 그대로 씁니다.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

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

function toPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function readAll(): UserRecord[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 회원가입 두 건이 정확히 같은 순간에 들어와도 서로의 쓰기를 덮어쓰지 않도록,
// 모든 쓰기를 하나의 체인으로 직렬화합니다. 스터디 규모(수십 명)에서는
// 이 정도로 충분하고, 별도 DB 프로세스를 띄울 필요가 없습니다.
let writeChain: Promise<void> = Promise.resolve();

function writeAll(users: UserRecord[]): Promise<void> {
  writeChain = writeChain.then(
    () =>
      new Promise<void>((resolve, reject) => {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
          const tmpFile = `${USERS_FILE}.${process.pid}.tmp`;
          fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), "utf8");
          fs.renameSync(tmpFile, USERS_FILE);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
  );
  return writeChain;
}

export function listUsers(): PublicUser[] {
  return readAll()
    .map(toPublic)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const normalized = email.trim().toLowerCase();
  return readAll().find((u) => u.email === normalized);
}

export function findUserById(id: string): UserRecord | undefined {
  return readAll().find((u) => u.id === id);
}

function resolveRole(email: string, isFirstUser: boolean): Role {
  const adminAllowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminAllowlist.includes(email)) return "admin";
  // 최초 가입자(=사이트를 처음 배포/방문한 운영자 본인)를 관리자로 지정합니다.
  if (isFirstUser) return "admin";
  return "member";
}

/**
 * Google이 확인한 이메일을 기준으로 기존 계정을 연결하거나 신규 계정을 만듭니다.
 * subject를 같이 저장해 이후 이메일 표시명이 바뀌어도 같은 Google 계정을 식별합니다.
 */
export async function findOrCreateGoogleUser(input: {
  email: string;
  name: string;
  subject: string;
}): Promise<UserRecord> {
  const users = readAll();
  const email = input.email.trim().toLowerCase();
  const bySubject = users.find((user) => user.googleSubject === input.subject);
  if (bySubject) return bySubject;

  const byEmail = users.find((user) => user.email === email);
  if (byEmail) {
    // 이미 다른 Google 계정에 연결된 이메일은 조용히 덮어쓰지 않습니다.
    if (byEmail.googleSubject && byEmail.googleSubject !== input.subject) {
      throw new Error("GOOGLE_ACCOUNT_MISMATCH");
    }
    const linked = { ...byEmail, googleSubject: input.subject };
    await writeAll(users.map((user) => (user.id === linked.id ? linked : user)));
    return linked;
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim().slice(0, 40) || "Google 사용자",
    googleSubject: input.subject,
    role: resolveRole(email, users.length === 0),
    createdAt: new Date().toISOString(),
  };
  await writeAll([...users, user]);
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const users = readAll();
  await writeAll(users.filter((u) => u.id !== id));
  await deleteLearningRecord(id);
}

export { toPublic };
