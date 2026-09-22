import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { publicOrigin } from "@/lib/publicOrigin";

// 낙관적 검사만 수행합니다 — 쿠키 서명만 확인하고 DB는 건드리지 않습니다
// (Next.js 권장사항: Proxy는 모든 요청·프리페치에서 실행되므로 느린 작업을
// 피해야 합니다). 실제 권한 확인은 각 페이지/서버 액션에서 다시 한 번
// `requireUser`/`requireAdmin`으로 수행합니다 — Proxy는 1차 방어선일 뿐입니다.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/account", publicOrigin(req)));
  }

  const isAccountArea = pathname === "/account" || pathname.startsWith("/account/");
  const isOperatorArea = pathname.startsWith("/operator");

  if ((isAccountArea || isOperatorArea) && !session) {
    const url = new URL("/login", publicOrigin(req));
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isOperatorArea && session && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", publicOrigin(req)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/operator/:path*", "/account", "/account/:path*", "/login", "/signup"],
};
