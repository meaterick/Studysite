import "server-only";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { signingKey } from "./securityConfig";
import { safeReturnPath } from "./returnPath";

export const GOOGLE_OAUTH_STATE_COOKIE = "aegis_google_oauth_state";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

type GoogleOAuthState = {
  nonce: string;
  returnPath: string;
};

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export async function createGoogleOAuthState(returnPath: string): Promise<string> {
  const payload: GoogleOAuthState = {
    nonce: crypto.randomBytes(32).toString("base64url"),
    returnPath: safeReturnPath(returnPath),
  };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_STATE_TTL_SECONDS}s`)
    .sign(signingKey());
}

export async function verifyGoogleOAuthState(token: string): Promise<GoogleOAuthState | null> {
  if (token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (typeof payload.nonce !== "string" || typeof payload.returnPath !== "string") return null;
    return { nonce: payload.nonce, returnPath: safeReturnPath(payload.returnPath) };
  } catch {
    return null;
  }
}

/** Constant-time comparison prevents a callback state token oracle. */
export function statesMatch(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

export const googleStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google",
  maxAge: OAUTH_STATE_TTL_SECONDS,
};
