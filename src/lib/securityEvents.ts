import "server-only";
import { normalizeIp } from "./ipAddress";
import { observeSecurityEvent } from "./securityDetection";
import { all, get, run, type Param } from "./db";
import { cleanLogText, logPath, SECURITY_KINDS, type SecurityKind, type Severity } from "./securityPolicy";

export interface SecurityContext {
  ip?: string;
  userId?: string;
  method?: string;
  path?: string;
  status?: number;
  detail?: string;
  skipDetection?: boolean;
}

/** Trust only the header nginx overwrites, and only behind the configured loopback reverse proxy. */
export function securityRequest(request: { headers: Headers; url?: string; method?: string }, userId?: string): SecurityContext {
  const value = process.env.TRUST_PROXY === "1" ? request.headers.get("x-real-ip")?.trim() : "";
  let pathname = "";
  try { pathname = request.url ? new URL(request.url).pathname : ""; } catch {}
  return { ip: normalizeIp(value), userId, method: request.method, path: pathname };
}

const retention = () => new Date(Date.now() - 30 * 86400_000).toISOString();

/** Five-minute aggregation and a DB cap prevent repeated signals from filling disk. Best effort only. */
export function recordSecurityEvent(kind: SecurityKind, context: SecurityContext = {}): void {
  try {
    const now = new Date().toISOString();
    const bucket = new Date(Math.floor(Date.now() / 300_000) * 300_000).toISOString();
    run(`INSERT INTO security_events (bucket, first_at, last_at, kind, severity, ip, user_id, method, path, status, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (bucket, kind, ip, user_id, method, path, status)
      DO UPDATE SET last_at = excluded.last_at, count = count + 1, detail = excluded.detail`,
      bucket, now, now, kind, SECURITY_KINDS[kind].severity,
      normalizeIp(context.ip), cleanLogText(context.userId, 80),
      cleanLogText(context.method, 12), logPath(context.path ?? ""), context.status ?? 0, cleanLogText(context.detail, 500));
    pruneSecurityEvents();
    observeSecurityEvent(kind, context);
  } catch {
    // Logging failure must not replace the original authorization result. Never print request data.
    console.error("[security] event storage unavailable");
  }
}

const holder = globalThis as unknown as { __aegisSecurityPrunedAt?: number };
export function pruneSecurityEvents(): void {
  if (Date.now() - (holder.__aegisSecurityPrunedAt ?? 0) < 60_000) return;
  run("DELETE FROM security_events WHERE last_at < ?", retention());
  holder.__aegisSecurityPrunedAt = Date.now();
}

export interface SecurityEvent {
  id: number; first_at: string; last_at: string; kind: SecurityKind; severity: Severity;
  ip: string; user_id: string; method: string; path: string; status: number; count: number; detail: string;
}
export interface SecurityFilters { hours: number; kind: string; severity: string; ip: string; page: number; group?: string }
export function securityFilters(raw: Record<string, string | string[] | undefined>): SecurityFilters {
  const scalar = (key: string) => typeof raw[key] === "string" ? raw[key] as string : "";
  const hours = Number(scalar("hours"));
  const kind = scalar("kind");
  const severity = scalar("severity");
  return { group: ["detections", "changes"].includes(scalar("group")) ? scalar("group") : "", hours: [24, 168, 720].includes(hours) ? hours : 24,
    kind: Object.hasOwn(SECURITY_KINDS, kind) ? kind : "",
    severity: ["info", "warning", "high"].includes(severity) ? severity : "",
    ip: normalizeIp(scalar("ip")) || cleanLogText(scalar("ip"), 45), page: Math.min(200, Math.max(1, Math.floor(Number(scalar("page")) || 1))) };
}

export function querySecurityEvents(filters: SecurityFilters) {
  pruneSecurityEvents();
  const clauses = ["last_at >= ?"];
  const params: Param[] = [new Date(Date.now() - filters.hours * 3600_000).toISOString()];
  if (filters.kind) { clauses.push("kind = ?"); params.push(filters.kind); }
  if (filters.severity) { clauses.push("severity = ?"); params.push(filters.severity); }
  if (filters.ip) { clauses.push("ip = ?"); params.push(filters.ip); }
  if (filters.group === "detections") clauses.push("kind IN ('scan_detected', 'auth_attack_detected', 'traffic_detected')");
  if (filters.group === "changes") clauses.push("kind IN ('ip_banned', 'ip_allowed', 'ip_rule_removed', 'security_policy_changed')");
  const where = clauses.join(" AND ");
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM security_events WHERE ${where}`, ...params)?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / 50));
  const page = Math.min(filters.page, pages);
  const events = all<SecurityEvent>(`SELECT * FROM security_events WHERE ${where} ORDER BY last_at DESC, id DESC LIMIT 50 OFFSET ?`, ...params, (page - 1) * 50);
  return { events, total, page, pages };
}

/** Counts are for retained app signals only; nginx records are displayed separately. */
export function securitySummary() {
  pruneSecurityEvents();
  const since = new Date(Date.now() - 86400_000).toISOString();
  const summary = get<{ total: number; high: number; limited: number; ips: number; detections: number; blocked: number }>(`SELECT
    COALESCE(SUM(count), 0) AS total,
    COALESCE(SUM(CASE WHEN severity = 'high' THEN count ELSE 0 END), 0) AS high,
    COALESCE(SUM(CASE WHEN kind = 'rate_limited' THEN count ELSE 0 END), 0) AS limited,
    COALESCE(SUM(CASE WHEN kind IN ('scan_detected', 'auth_attack_detected', 'traffic_detected') THEN count ELSE 0 END), 0) AS detections,
    COALESCE(SUM(CASE WHEN kind = 'ip_blocked' THEN count ELSE 0 END), 0) AS blocked,
    COUNT(DISTINCT CASE WHEN severity != 'info' AND ip != '' THEN ip END) AS ips
    FROM security_events WHERE last_at >= ?`, since)!;
  const topIps = all<{ ip: string; n: number }>(`SELECT ip, SUM(count) AS n FROM security_events
    WHERE last_at >= ? AND severity != 'info' AND ip != '' GROUP BY ip ORDER BY n DESC LIMIT 5`, since);
  return { ...summary, topIps };
}

export function blockedIpActivity(): Record<string, { count: number; lastAt: string }> {
  const rows = all<{ ip: string; n: number; last_at: string }>(`SELECT ip, SUM(count) AS n, MAX(last_at) AS last_at FROM security_events
    WHERE kind = 'ip_blocked' AND last_at >= ? GROUP BY ip`, new Date(Date.now() - 86400_000).toISOString());
  return Object.fromEntries(rows.map((r) => [r.ip, { count: r.n, lastAt: r.last_at }]));
}
