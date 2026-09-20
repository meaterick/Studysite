import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export type PublicUser = Omit<UserRecord, "passwordHash">;

function toPublic(user: UserRecord): PublicUser {
  const rest: Partial<UserRecord> = { ...user };
  delete rest.passwordHash;
  return rest as PublicUser;
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

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const users = readAll();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const user: UserRecord = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    role: resolveRole(email, users.length === 0),
    createdAt: new Date().toISOString(),
  };
  await writeAll([...users, user]);
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const users = readAll();
  await writeAll(users.filter((u) => u.id !== id));
}

export async function setUserRole(id: string, role: Role): Promise<void> {
  const users = readAll();
  await writeAll(users.map((u) => (u.id === id ? { ...u, role } : u)));
}

export { toPublic };
