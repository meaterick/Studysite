import "server-only";
import { headers } from "next/headers";

type AuthOperation = "login" | "signup";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IDENTIFIER = 5;
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_TRACKED_KEYS = 5_000;

// This process is deliberately single-instance (see ecosystem.config.js).
// Move these counters to a shared store before running more than one instance.
const attempts = new Map<string, number[]>();

function trimExpired(timestamps: number[], now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
}

function prune(now: number) {
  for (const [key, timestamps] of attempts) {
    const active = trimExpired(timestamps, now);
    if (active.length === 0) attempts.delete(key);
    else attempts.set(key, active);
  }

  // Bound memory if many distinct clients submit requests during one window.
  while (attempts.size > MAX_TRACKED_KEYS) {
    const oldestKey = attempts.keys().next().value;
    if (!oldestKey) break;
    attempts.delete(oldestKey);
  }
}

function clientAddress(requestHeaders: Headers): string {
  // nginx appends its direct peer address to X-Forwarded-For. Taking the last
  // entry prevents a client from choosing the key by prepending its own value.
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    const last = forwardedFor.split(",").at(-1)?.trim();
    if (last) return last.slice(0, 64);
  }
  return "unknown";
}

function identifierKey(operation: AuthOperation, identifier: string) {
  return `${operation}:id:${identifier.trim().toLowerCase().slice(0, 254) || "empty"}`;
}

function ipKey(operation: AuthOperation, ip: string) {
  return `${operation}:ip:${ip}`;
}

/**
 * Reserves an authentication attempt before expensive password work begins.
 * Returns false when either the account identifier or client IP is limited.
 */
export async function consumeAuthAttempt(operation: AuthOperation, identifier: string): Promise<boolean> {
  const requestHeaders = await headers();
  const now = Date.now();
  prune(now);

  const keys = [
    [identifierKey(operation, identifier), MAX_ATTEMPTS_PER_IDENTIFIER],
    [ipKey(operation, clientAddress(requestHeaders)), MAX_ATTEMPTS_PER_IP],
  ] as const;

  if (keys.some(([key, limit]) => (attempts.get(key) ?? []).length >= limit)) return false;
  for (const [key] of keys) attempts.set(key, [...(attempts.get(key) ?? []), now]);
  return true;
}

/** Clear failed-attempt counters only after a successful authentication or signup. */
export async function clearAuthAttempts(operation: AuthOperation, identifier: string) {
  const requestHeaders = await headers();
  attempts.delete(identifierKey(operation, identifier));
  attempts.delete(ipKey(operation, clientAddress(requestHeaders)));
}
