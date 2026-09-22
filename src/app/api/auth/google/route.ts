import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleOAuthState,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleStateCookieOptions,
} from "@/lib/googleOAuth";
import { publicOrigin } from "@/lib/publicOrigin";
import { safeReturnPath } from "@/lib/returnPath";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { findUserById } from "@/lib/userStore";

export const runtime = "nodejs";

/** Starts Google OAuth with a signed, short-lived CSRF state token. */
export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  const returnPath = safeReturnPath(request.nextUrl.searchParams.get("from") ?? "");
  const wantsDeletion = request.nextUrl.searchParams.get("intent") === "delete_account";
  let deleteUserId: string | undefined;
  if (wantsDeletion) {
    const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
    const user = session ? findUserById(session.uid) : undefined;
    if (!user?.googleSubject) {
      return NextResponse.redirect(new URL("/account", publicOrigin(request)));
    }
    deleteUserId = user.id;
  }
  if (!config) {
    const url = new URL("/signup", publicOrigin(request));
    url.searchParams.set("error", "oauth_config");
    if (returnPath !== "/account") url.searchParams.set("from", returnPath);
    return NextResponse.redirect(url);
  }

  const state = await createGoogleOAuthState(returnPath, wantsDeletion ? "delete_account" : "sign_in", deleteUserId);
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
