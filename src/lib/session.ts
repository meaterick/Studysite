import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./userStore";

export const SESSION_COOKIE = "aegis_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30일

const DEV_FALLBACK_SECRET = "aegis-dev-session-secret-change-me";

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim() || DEV_FALLBACK_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: string;
  role: Role;
  [key: string]: unknown;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.role !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(uid: string, role: Role) {
  const token = await encryptSession({ uid, role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
