import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OPERATOR_COOKIE, isOperatorCookieValid } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/operator/login") return NextResponse.next();

  const cookie = req.cookies.get(OPERATOR_COOKIE)?.value;
  if (isOperatorCookieValid(cookie)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/operator/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/operator/:path*"],
};
