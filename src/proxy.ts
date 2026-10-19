import { randomBytes } from "node:crypto";
import { enforceIpBan, isVerifiedAdminRequest } from "@/lib/ipDefense";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { inspectRequestPath } from "@/lib/securityPolicy";
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
  const pathSignal = inspectRequestPath(pathname);
  if (pathSignal) {
    recordSecurityEvent("probe", { ...securityRequest(req), status: 404, detail: `${pathSignal.category} · ${pathSignal.reason}`, skipDetection: await isVerifiedAdminRequest(req) });
    return new NextResponse(null, { status: 404 });
  }
  if (!["GET", "HEAD", "OPTIONS", "POST"].includes(req.method)) {
    recordSecurityEvent("request_rejected", { ...securityRequest(req), status: 405, skipDetection: await isVerifiedAdminRequest(req) });
    return new NextResponse(null, { status: 405, headers: { Allow: "GET, HEAD, OPTIONS, POST", "Cache-Control": "no-store" } });
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

  // All HTML pages already render dynamically through the cookie-backed root layout.
  // Overwrite caller-controlled nonce/CSP headers; Next attaches this nonce to its own scripts.
  const nonce = randomBytes(24).toString("base64");
  const csp = [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self' data:",
    `connect-src 'self'${process.env.NODE_ENV === "production" ? "" : " ws: wss:"}`, "worker-src 'self' blob:",
    "frame-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join("; ");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
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
