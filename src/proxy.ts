import { enforceIpBan, isVerifiedAdminRequest } from "@/lib/ipDefense";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { isProbePath } from "@/lib/securityPolicy";
import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { publicOrigin } from "@/lib/publicOrigin";

// 낙관적 권한 검사만 수행하고, 보안 신호가 있는 요청만 제한된 DB 로그를 남깁니다.
// (Next.js 권장사항: Proxy는 모든 요청·프리페치에서 실행되므로 느린 작업을
// 피해야 합니다). 실제 권한 확인은 각 페이지/서버 액션에서 다시 한 번
// `requireUser`/`requireAdmin`으로 수행합니다 — Proxy는 1차 방어선일 뿐입니다.
export async function proxy(req: NextRequest) {
  const denied = await enforceIpBan(req);
  if (denied) return denied;
  const { pathname } = req.nextUrl;
  if (isProbePath(pathname)) {
    recordSecurityEvent("probe", { ...securityRequest(req), status: 404, skipDetection: await isVerifiedAdminRequest(req) });
    return new NextResponse(null, { status: 404 });
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if ((origin && origin !== publicOrigin(req)) || req.headers.get("sec-fetch-site") === "cross-site") {
      recordSecurityEvent("csrf_rejected", { ...securityRequest(req), status: 403 });
      return new NextResponse(null, { status: 403 });
    }
  }
  // Assets need the IP gate, but not per-request JWT checks or auth routing.
  if (pathname.startsWith("/_next/") || pathname.startsWith("/vendor/") || ["/favicon.ico", "/apple-icon.png", "/icon.svg", "/pyodide-worker.js"].includes(pathname)) return NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);
  if (token && !session) recordSecurityEvent("invalid_session", securityRequest(req));

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/account", publicOrigin(req)));
  }

  const isAccountArea = pathname === "/account" || pathname.startsWith("/account/");
  const isOperatorArea = (pathname === "/operator" || pathname.startsWith("/operator/"));

  // 구체적인 학습 자료(주차 페이지·단계·과제·진도·주차별 이미지)는 로그인한 사용자만 볼 수 있습니다.
  // 로그인하지 않은 방문자에게는 메인 화면과 커리큘럼·주차별 자료 목록까지만 공개합니다.
  if (isLearningArea(pathname) && !session) {
    if (pathname.startsWith("/images/")) {
      return new NextResponse(null, { status: 401 });
    }
    const url = new URL("/login", publicOrigin(req));
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if ((isAccountArea || isOperatorArea) && !session) {
    if (isOperatorArea) recordSecurityEvent("auth_required", { ...securityRequest(req), status: 307 });
    const url = new URL("/login", publicOrigin(req));
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isOperatorArea && session && session.role !== "admin") {
    recordSecurityEvent("forbidden", { ...securityRequest(req, session.uid), status: 307 });
    return NextResponse.redirect(new URL("/", publicOrigin(req)));
  }

  return NextResponse.next();
}

function isLearningArea(pathname: string): boolean {
  return (
    pathname === "/progress" ||
    pathname === "/chat" ||
    pathname === "/feedback" ||
    pathname.startsWith("/weeks/") ||
    /^\/images\/week\d+\//.test(pathname)
  );
}

export const config = {
  // IP bans also apply to static files. Their post-gate auth path above stays inexpensive.
  matcher: ["/:path*"],
};
