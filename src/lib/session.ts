import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { signingKey } from "./securityConfig";
import type { Role } from "./userStore";

export const SESSION_COOKIE = "aegis_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30일

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
    .sign(signingKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || !payload.uid || !["admin", "member"].includes(String(payload.role))) return null;
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
