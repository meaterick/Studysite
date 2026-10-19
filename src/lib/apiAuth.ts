import "server-only";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "./session";
import { findUserById } from "./userStore";
import { recordSecurityEvent, securityRequest } from "./securityEvents";

/** Re-check database authority inside every protected route, independently of Proxy. */
export async function apiUser(request: NextRequest) {
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  const user = session ? findUserById(session.uid) : undefined;
  if (!user) recordSecurityEvent("auth_required", { ...securityRequest(request), status: 401 });
  return user;
}
