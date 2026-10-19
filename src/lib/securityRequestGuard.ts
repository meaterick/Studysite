import "server-only";
import { createHash } from "node:crypto";
import { get, run, tx } from "./db";
import { normalizeIp } from "./ipAddress";

/** Shared across overlapping processes; only accepted requests consume a bounded five-minute quota. */
export function consumeAuthRequest(rawIp: string | undefined, operation: "start" | "callback") {
  const ip = normalizeIp(rawIp);
  if (!ip) return { allowed: true, retryAfter: 0 };
  return tx(() => {
    const now = Date.now(), ttl = 5 * 60_000, limit = operation === "start" ? 30 : 60, key = `${operation}:${ip}`;
    run("DELETE FROM security_request_limits WHERE expires_at <= ?", now);
    const old = get<{ count: number; expires_at: number }>("SELECT count, expires_at FROM security_request_limits WHERE key = ?", key);
    if (!old && (get<{ n: number }>("SELECT COUNT(*) AS n FROM security_request_limits")?.n ?? 0) >= 5000) return { allowed: false, retryAfter: 60 };
    if (old && old.count >= limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((old.expires_at - now) / 1000)) };
    run(`INSERT INTO security_request_limits (key, started_at, count, expires_at) VALUES (?, ?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET count = count + 1`, key, now, now + ttl);
    return { allowed: true, retryAfter: 0 };
  });
}
/** Store a hash, never the OAuth state/code. Claim BEFORE any outbound token exchange. */
export function claimOAuthNonce(nonce: string): boolean {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(nonce)) return false;
  return tx(() => {
    run("DELETE FROM security_oauth_used WHERE expires_at <= ?", Date.now());
    if ((get<{ n: number }>("SELECT COUNT(*) AS n FROM security_oauth_used")?.n ?? 0) >= 5000) return false;
    return run("INSERT INTO security_oauth_used (nonce_hash, expires_at) VALUES (?, ?) ON CONFLICT DO NOTHING", createHash("sha256").update(nonce).digest("hex"), Date.now() + 10 * 60_000).changes > 0;
  });
}
