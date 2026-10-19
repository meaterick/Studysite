import "server-only";
import { all, get, run, tx } from "./db";
import { cleanLogText } from "./securityPolicy";
import { isBannableIp, normalizeIp } from "./ipAddress";

export interface IpRule {
  ip: string; mode: "allow" | "deny"; source: "manual" | "auto"; reason: string;
  created_by: string; created_at: string; expires_at: string | null;
}
export interface IpRuleHistory {
  id: number; ip: string; action: "saved" | "removed" | "expired" | "existing";
  mode: "allow" | "deny"; source: "manual" | "auto"; reason: string; actor_id: string; at: string; expires_at: string | null;
}
function recordRuleChange(rule: IpRule, action: IpRuleHistory["action"], actorId: string, at = new Date().toISOString()): void {
  run(`INSERT INTO security_ip_history (ip, action, mode, source, reason, actor_id, at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    rule.ip, action, rule.mode, rule.source, rule.reason, cleanLogText(actorId, 80), at, rule.expires_at);
}
export function ipRuleHistory(ip: string, requestedPage: number) {
  pruneIpDefense();
  const params = ip ? [normalizeIp(ip) || ip] : [];
  const where = ip ? "WHERE ip = ?" : "";
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM security_ip_history ${where}`, ...params)?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / 50));
  const page = Math.min(pages, Math.max(1, Math.floor(requestedPage) || 1));
  const entries = all<IpRuleHistory>(`SELECT * FROM security_ip_history ${where} ORDER BY id DESC LIMIT 50 OFFSET ?`, ...params, (page - 1) * 50);
  return { entries, total, pages, page };
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
export function ipRuleCounts() {
  return get<{ deny: number; allow: number; automatic: number }>(`SELECT COUNT(CASE WHEN mode = 'deny' THEN 1 END) AS deny,
    COUNT(CASE WHEN mode = 'allow' THEN 1 END) AS allow, COUNT(CASE WHEN mode = 'deny' AND source = 'auto' THEN 1 END) AS automatic
    FROM security_ip_rules WHERE expires_at IS NULL OR expires_at > ?`, new Date().toISOString())!;
}
export function pruneIpDefense(): void {
  tx(() => {
    const now = new Date().toISOString();
    const expired = all<IpRule>("SELECT * FROM security_ip_rules WHERE expires_at IS NOT NULL AND expires_at <= ?", now);
    for (const rule of expired) recordRuleChange(rule, "expired", "", rule.expires_at!);
    run("DELETE FROM security_ip_rules WHERE expires_at IS NOT NULL AND expires_at <= ?", now);
    run("DELETE FROM security_ip_history WHERE at < ?", new Date(Date.now() - 30 * 86400_000).toISOString());
    run("DELETE FROM security_detection_windows WHERE last_at < ?", Date.now() - 10 * 60_000);
  });
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
    const saved = activeIpRule(ip)!;
    recordRuleChange(saved, "saved", input.actorId, now);
    return saved;
  });
}
export function removeIpRule(raw: string, actorId = ""): boolean {
  const ip = normalizeIp(raw);
  if (!ip) throw new Error("INVALID_IP");
  return tx(() => {
    pruneIpDefense();
    const old = activeIpRule(ip);
    if (old) recordRuleChange(old, "removed", actorId);
    run("DELETE FROM security_detection_windows WHERE ip = ?", ip);
    return run("DELETE FROM security_ip_rules WHERE ip = ?", ip).changes > 0;
  });
}
