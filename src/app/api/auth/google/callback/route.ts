import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleStateCookieOptions,
  statesMatch,
  verifyGoogleOAuthState,
} from "@/lib/googleOAuth";
import { publicOrigin } from "@/lib/publicOrigin";
import { safeReturnPath } from "@/lib/returnPath";
import { encryptSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { deleteUser, findOrCreateGoogleUser, findUserById, listUsers } from "@/lib/userStore";

export const runtime = "nodejs";

type GoogleProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

function fail(request: NextRequest, code: string, from = "/account") {
  const url = new URL("/signup", publicOrigin(request));
  url.searchParams.set("error", code);
  if (from !== "/account") url.searchParams.set("from", from);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
  return response;
}

/** Completes the code exchange, checks Google-verified identity, and creates the local session. */
export async function GET(request: NextRequest) {
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
    });
    const token = (await tokenResponse.json()) as { access_token?: unknown };
    if (!tokenResponse.ok || typeof token.access_token !== "string") throw new Error("TOKEN_EXCHANGE_FAILED");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
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

    if (state.intent === "delete_account") {
      const user = state.deleteUserId ? findUserById(state.deleteUserId) : undefined;
      if (!user || user.googleSubject !== profile.sub || user.email !== profile.email.trim().toLowerCase()) {
        throw new Error("GOOGLE_REAUTH_FAILED");
      }
      if (user.role === "admin" && listUsers().filter((member) => member.role === "admin").length <= 1) {
        const response = NextResponse.redirect(new URL("/account?error=lastadmin", publicOrigin(request)));
        response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
        return response;
      }
      await deleteUser(user.id);
      const response = NextResponse.redirect(new URL("/", publicOrigin(request)));
      response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
      response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
      return response;
    }

    const user = await findOrCreateGoogleUser({
      subject: profile.sub,
      email: profile.email,
      name: typeof profile.name === "string" ? profile.name : "Google 사용자",
    });
    const session = await encryptSession({ uid: user.id, role: user.role });
    const response = NextResponse.redirect(new URL(returnPath, publicOrigin(request)));
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...googleStateCookieOptions, maxAge: 0 });
    return response;
  } catch {
    return fail(request, "oauth_failed", returnPath);
  }
}
