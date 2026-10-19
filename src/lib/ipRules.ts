import "server-only";
import { all, get, run, tx } from "./db";
import { cleanLogText } from "./securityPolicy";
import { isBannableIp, normalizeIp } from "./ipAddress";

export interface IpRule {
  ip: string; mode: "allow" | "deny"; source: "manual" | "auto"; reason: string;
  created_by: string; created_at: string; expires_at: string | null;
}
export const MAX_IP_RULES = 500;
export const BAN_MINUTES = [15, 60, 1440, 10080, 43200] as const;
export function ipEnforcementEnabled(): boolean { return process.env.SECURITY_IP_ENFORCEMENT !== "0"; }
export function autoBanEnabled(): boolean {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = 'security_auto_ban'")?.value !== "0";
}
export function setAutoBanEnabled(enabled: boolean): void {
  run(`INSERT INTO settings (key, value, updated_at) VALUES ('security_auto_ban', ?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, enabled ? "1" : "0", new Date().toISOString());
}
export function activeIpRule(raw: string): IpRule | undefined {
  const ip = normalizeIp(raw);
  return ip ? get<IpRule>("SELECT * FROM security_ip_rules WHERE ip = ? AND (expires_at IS NULL OR expires_at > ?)", ip, new Date().toISOString()) : undefined;
}
export function listIpRules(): IpRule[] {
  return all<IpRule>("SELECT * FROM security_ip_rules WHERE expires_at IS NULL OR expires_at > ? ORDER BY created_at DESC, ip", new Date().toISOString()).map((row) => ({ ...row }));
}
export function pruneIpDefense(): void {
  run("DELETE FROM security_ip_rules WHERE expires_at IS NOT NULL AND expires_at <= ?", new Date().toISOString());
  run("DELETE FROM security_detection_windows WHERE last_at < ?", Date.now() - 10 * 60_000);
}

/** Internal store operation; administrator authorization belongs to securityManagement/Actions. */
export function saveIpRule(input: { ip: string; mode: "allow" | "deny"; source: "manual" | "auto"; reason: string; actorId: string; minutes: number }): IpRule {
  const ip = normalizeIp(input.ip);
  if (!ip || !isBannableIp(ip)) throw new Error("INVALID_IP");
  if (!["allow", "deny"].includes(input.mode) || !["manual", "auto"].includes(input.source)) throw new Error("INVALID_RULE");
  if (!BAN_MINUTES.some((m) => m === input.minutes)) throw new Error("INVALID_DURATION");
  const reason = cleanLogText(input.reason, 200).trim();
  if (!reason) throw new Error("REASON_REQUIRED");
  return tx(() => {
    pruneIpDefense();
    const old = activeIpRule(ip);
    // A detector never overwrites an explicit operator decision, including allow rules.
    if (input.source === "auto" && old) return old;
    if (!old && (get<{ n: number }>("SELECT COUNT(*) AS n FROM security_ip_rules")?.n ?? 0) >= MAX_IP_RULES) throw new Error("RULE_LIMIT");
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + input.minutes * 60_000).toISOString();
    run(`INSERT INTO security_ip_rules (ip, mode, source, reason, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (ip) DO UPDATE SET mode = excluded.mode, source = excluded.source, reason = excluded.reason,
      created_by = excluded.created_by, created_at = excluded.created_at, expires_at = excluded.expires_at`,
      ip, input.mode, input.source, reason, input.actorId, now, expires);
    run("DELETE FROM security_detection_windows WHERE ip = ?", ip);
    return activeIpRule(ip)!;
  });
}
export function removeIpRule(raw: string): boolean {
  const ip = normalizeIp(raw);
  if (!ip) throw new Error("INVALID_IP");
  return tx(() => {
    run("DELETE FROM security_detection_windows WHERE ip = ?", ip);
    return run("DELETE FROM security_ip_rules WHERE ip = ?", ip).changes > 0;
  });
}
