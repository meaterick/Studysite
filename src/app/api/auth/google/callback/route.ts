import { consumeAuthRequest, claimOAuthNonce } from "@/lib/securityRequestGuard";
import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleStateCookieOptions,
  statesMatch,
  verifyGoogleOAuthState,
} from "@/lib/googleOAuth";
import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { publicOrigin } from "@/lib/publicOrigin";
import { safeReturnPath } from "@/lib/returnPath";
import { encryptSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { findOrCreateGoogleUser } from "@/lib/userStore";

export const runtime = "nodejs";

type GoogleProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

function fail(request: NextRequest, code: string, from = "/account") {
  recordSecurityEvent("login_failure", securityRequest(request));
  const url = new URL("/login", publicOrigin(request));
  url.searchParams.set("error", code);
  if (from !== "/account") url.searchParams.set("from", from);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
  return response;
}

/** Completes the code exchange, checks Google-verified identity, and creates the local session. */
export async function GET(request: NextRequest) {
  const context = securityRequest(request);
  const limit = consumeAuthRequest(context.ip, "callback");
  if (!limit.allowed) {
    recordSecurityEvent("auth_rate_limited", { ...context, status: 429, detail: "로그인 callback 요청의 5분 IP 한도 초과" });
    return NextResponse.json({ error: "rate_limited", message: "로그인 요청이 잦습니다. 잠시 후 다시 시도해 주십시오." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } });
  }
  const config = getGoogleOAuthConfig();
  const receivedState = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!config || !receivedState || !storedState || !statesMatch(receivedState, storedState)) {
    return fail(request, "oauth_failed");
  }

  const state = await verifyGoogleOAuthState(receivedState);
  if (!state) return fail(request, "oauth_failed");
  const returnPath = safeReturnPath(state.returnPath);
  const code = request.nextUrl.searchParams.get("code");
  if (!code || request.nextUrl.searchParams.get("error")) return fail(request, "oauth_cancelled", returnPath);

  if (!claimOAuthNonce(state.nonce)) {
    recordSecurityEvent("oauth_replayed", { ...context, status: 307, detail: "로그인 상태 중복 처리 또는 재사용 방지 저장소 한도" });
    return fail(request, "oauth_failed", returnPath);
  }
  try {
    const callbackUrl = new URL("/api/auth/google/callback", publicOrigin(request)).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const token = (await tokenResponse.json()) as { access_token?: unknown };
    if (!tokenResponse.ok || typeof token.access_token !== "string") throw new Error("TOKEN_EXCHANGE_FAILED");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (
      !profileResponse.ok ||
      typeof profile.sub !== "string" ||
      typeof profile.email !== "string" ||
      profile.email_verified !== true
    ) {
      throw new Error("UNVERIFIED_GOOGLE_PROFILE");
    }


    const user = await findOrCreateGoogleUser({
      subject: profile.sub,
      email: profile.email,
      name: typeof profile.name === "string" ? profile.name : "Google 사용자",
    });
    const session = await encryptSession({ uid: user.id, role: user.role });
    recordSecurityEvent("login_success", securityRequest(request, user.id));
    const response = NextResponse.redirect(new URL(returnPath, publicOrigin(request)));
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
    return response;
  } catch {
    return fail(request, "oauth_failed", returnPath);
  }
}
