import "server-only";
import { cache } from "react";
import { recordSecurityEvent, securityRequest } from "./securityEvents";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession, SESSION_COOKIE } from "./session";
import { findUserById, toPublic, type PublicUser } from "./userStore";

/** 낙관적 세션 확인 — 쿠키 서명만 검증합니다. 리다이렉트하지 않습니다. */
export const verifySession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decryptSession(token);
});

/** 현재 로그인한 사용자의 공개 정보(비밀번호 해시 제외)를 가져옵니다. 로그인하지 않았다면 null. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await verifySession();
  if (!session) return null;
  const user = findUserById(session.uid);
  return user ? toPublic(user) : null;
});

/** 로그인이 필요한 페이지/액션에서 사용 — 없으면 로그인 페이지로 보냅니다. */
export async function requireUser(from?: string): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const qs = from ? `?from=${encodeURIComponent(from)}` : "";
    redirect(`/login${qs}`);
  }
  return user;
}

/** 관리자 전용 페이지/액션에서 사용 — 로그인 안 했으면 로그인으로, 관리자가 아니면 홈으로. */
export async function requireAdmin(from?: string): Promise<PublicUser> {
  const user = await requireUser(from);
  if (user.role !== "admin") {
    recordSecurityEvent("forbidden", { ...securityRequest({ headers: await headers() }, user.id), path: from, status: 403 });
    redirect("/");
  }
  return user;
}
