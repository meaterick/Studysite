import "server-only";
import { get, run, tx } from "./db";
import { activeIpRule, autoBanEnabled, ipEnforcementEnabled, saveIpRule } from "./ipRules";
import { isBannableIp, normalizeIp } from "./ipAddress";
import { logPath, SECURITY_KINDS, type SecurityKind } from "./securityPolicy";
import { recordSecurityEvent, type SecurityContext } from "./securityEvents";

import { DETECTION_RULES, type SignalFamily } from "./securityRules";
export type { SignalFamily } from "./securityRules";
import { raiseSecurityCase } from "./securityCases";

const WINDOW_MS = 5 * 60_000;
interface WindowRow { started_at: number; count: number; paths: string; alerted: number }
const EVENT_FAMILY: Partial<Record<SecurityKind, SignalFamily>> = { probe: "probe", login_failure: "auth", invalid_session: "auth", auth_required: "access", forbidden: "access", csrf_rejected: "csrf", request_rejected: "method", auth_rate_limited: "auth_rate", oauth_replayed: "auth", ssh_failure: "ssh_auth" };

export function observeSecurityEvent(kind: SecurityKind, context: SecurityContext): void {
  const family = EVENT_FAMILY[kind];
  if (family && !context.skipDetection) observeSecuritySignal(family, context);
}

/** Cross-process, bounded five-minute windows; no counter is incremented for already-blocked requests. */
export function observeSecuritySignal(family: SignalFamily, context: SecurityContext): void {
  const ip = normalizeIp(context.ip);
  if (!ip || (family !== "ssh_auth" && !isBannableIp(ip)) || context.skipDetection) return;
  tx(() => {
    const now = family === "ssh_auth" && context.signalAt ? context.signalAt : Date.now();
    const sshWindow = Math.floor(now / WINDOW_MS) * WINDOW_MS;
    const previous = get<WindowRow>("SELECT started_at, count, paths, alerted FROM security_detection_windows WHERE ip = ? AND family = ?", ip, family);
    const old = previous && now >= previous.started_at && now - previous.started_at < WINDOW_MS && (family !== "ssh_auth" || previous.started_at === sshWindow) ? previous : undefined;
    if (family === "ssh_auth" && previous && previous.started_at > sshWindow) return;
    const paths: string[] = old ? JSON.parse(old.paths) : [];
    const path = logPath(context.path ?? "");
    if (path && !paths.includes(path) && paths.length < 12) paths.push(path);
    const count = (old?.count ?? 0) + 1;
    const alerted = old?.alerted ?? 0;
    run(`INSERT INTO security_detection_windows (ip, family, started_at, last_at, count, paths, alerted) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (ip, family) DO UPDATE SET started_at = excluded.started_at, last_at = excluded.last_at,
      count = excluded.count, paths = excluded.paths, alerted = excluded.alerted`,
      ip, family, old?.started_at ?? (family === "ssh_auth" ? sshWindow : now), now, count, JSON.stringify(paths), alerted);
    const rule = DETECTION_RULES[family];
    const detected = (count >= rule.hits && paths.length >= rule.paths) || (rule.repeat > 0 && count >= rule.repeat);
    if (!detected) return;
    const kind: SecurityKind = family === "probe" || family === "not_found" ? "scan_detected" : family === "edge_rate" ? "traffic_detected"
      : family === "ssh_auth" ? "ssh_attack_detected" : ["csrf", "method", "auth_rate"].includes(family) ? "request_attack_detected" : "auth_attack_detected";
    const evidence = `5분 집계창: ${rule.label} ${count}회${family === "ssh_auth" ? "" : `, 서로 다른 경로 ${paths.length}개. ${paths.slice(0, 3).join(", ")}`}`;
    if (!alerted || count % 10 === 0) raiseSecurityCase({ family, ip, source: family === "ssh_auth" ? "ssh" : ["not_found", "edge_rate"].includes(family) ? "nginx" : "app",
      severity: SECURITY_KINDS[kind].severity === "high" ? "high" : "warning", title: SECURITY_KINDS[kind].label, evidence, count,
      window: old?.started_at ?? (family === "ssh_auth" ? sshWindow : now) });
    if (alerted) return;
    run("UPDATE security_detection_windows SET alerted = 1 WHERE ip = ? AND family = ?", ip, family);
    recordSecurityEvent(kind, { ...context, ip, detail: evidence });
    // Only known sensitive-path probes create automatic, short-lived bans.
    if (!rule.automatic || !ipEnforcementEnabled() || !autoBanEnabled() || activeIpRule(ip)) return;
    try {
      const rule = saveIpRule({ ip, mode: "deny", source: "auto", actorId: "system", reason: evidence, minutes: 15 });
      recordSecurityEvent("ip_banned", { ip, userId: "system", detail: `자동 15분 차단 · ${evidence} · 만료 ${rule.expires_at}` });
    } catch (err) {
      if (!(err instanceof Error && err.message === "RULE_LIMIT")) throw err;
      // Preserve the alert if the bounded rule store is full; never evict operator rules.
    }
  });
}
