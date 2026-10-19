import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { activeIpRule, ipEnforcementEnabled } from "./ipRules";
import { isBannableIp } from "./ipAddress";
import { decryptSession, SESSION_COOKIE } from "./session";
import { findUserById } from "./userStore";
import { recordSecurityEvent, securityRequest } from "./securityEvents";

/** Also used before each SSE send so an existing connection cannot bypass a new ban. */
export function isBlockedIp(ip: string, userId?: string): boolean {
  if (!ipEnforcementEnabled() || !isBannableIp(ip) || activeIpRule(ip)?.mode !== "deny") return false;
  return !userId || findUserById(userId)?.role !== "admin";
}

export async function isVerifiedAdminRequest(request: NextRequest): Promise<boolean> {
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  return !!session && findUserById(session.uid)?.role === "admin";
}

/** All app paths, including assets. A current DB administrator can recover from an accidental shared-IP ban. */
export async function enforceIpBan(request: NextRequest): Promise<NextResponse | null> {
  const context = securityRequest(request);
  if (!ipEnforcementEnabled() || !isBannableIp(context.ip)) return null;
  const rule = activeIpRule(context.ip!);
  if (!rule || rule.mode === "allow" || await isVerifiedAdminRequest(request)) return null;
  recordSecurityEvent("ip_blocked", { ip: context.ip, method: request.method, path: "/ip-blocked", status: 403 });
  const seconds = Math.max(1, Math.ceil((Date.parse(rule.expires_at!) - Date.now()) / 1000));
  return new NextResponse("접근이 일시적으로 제한되었습니다. 잠시 후 다시 시도하거나 운영자에게 문의해 주십시오.", {
    status: 403, headers: { "cache-control": "private, no-store", "content-type": "text/plain; charset=utf-8", "retry-after": String(seconds) },
  });
}
