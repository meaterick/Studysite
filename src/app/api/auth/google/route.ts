import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { consumeAuthRequest } from "@/lib/securityRequestGuard";
import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleOAuthState,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleStateCookieOptions,
} from "@/lib/googleOAuth";
import { publicOrigin } from "@/lib/publicOrigin";
import { safeReturnPath } from "@/lib/returnPath";

export const runtime = "nodejs";

/** Starts Google OAuth with a signed, short-lived CSRF state token. */
export async function GET(request: NextRequest) {
  const context = securityRequest(request);
  const limit = consumeAuthRequest(context.ip, "start");
  if (!limit.allowed) {
    recordSecurityEvent("auth_rate_limited", { ...context, status: 429, detail: "로그인 start 요청의 5분 IP 한도 초과" });
    return NextResponse.json({ error: "rate_limited", message: "로그인 요청이 잦습니다. 잠시 후 다시 시도해 주십시오." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } });
  }
  const config = getGoogleOAuthConfig();
  const returnPath = safeReturnPath(request.nextUrl.searchParams.get("from") ?? "");
  if (!config) {
    const url = new URL("/login", publicOrigin(request));
    url.searchParams.set("error", "oauth_config");
    if (returnPath !== "/account") url.searchParams.set("from", returnPath);
    return NextResponse.redirect(url);
  }

  const state = await createGoogleOAuthState(returnPath);
  const callbackUrl = new URL("/api/auth/google/callback", publicOrigin(request)).toString();
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, googleStateCookieOptions);
  return response;
}
