import "server-only";
import { get, run, tx } from "./db";
import { activeIpRule, autoBanEnabled, ipEnforcementEnabled, saveIpRule } from "./ipRules";
import { isBannableIp, normalizeIp } from "./ipAddress";
import { logPath, SECURITY_KINDS, type SecurityKind } from "./securityPolicy";
import { recordSecurityEvent, type SecurityContext } from "./securityEvents";

export type SignalFamily = "probe" | "auth" | "access" | "not_found" | "edge_rate" | "csrf" | "method" | "auth_rate" | "ssh_auth";
import { raiseSecurityCase } from "./securityCases";

const FAMILY_LABEL: Record<SignalFamily, string> = { probe: "민감 경로 탐색", auth: "로그인·세션 실패", access: "권한 없는 접근", not_found: "서로 다른 주소의 404 응답", edge_rate: "nginx 요청 제한", csrf: "외부 출처 요청 거절", method: "비허용 HTTP 메서드", auth_rate: "로그인 요청 제한", ssh_auth: "SSH 인증 실패" };
const WINDOW_MS = 5 * 60_000;
interface WindowRow { started_at: number; count: number; paths: string; alerted: number }
const EVENT_FAMILY: Partial<Record<SecurityKind, SignalFamily>> = { probe: "probe", login_failure: "auth", invalid_session: "auth", forbidden: "access", csrf_rejected: "csrf", request_rejected: "method", auth_rate_limited: "auth_rate", oauth_replayed: "auth", ssh_failure: "ssh_auth" };

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
    const detected = family === "probe" ? (count >= 10 && paths.length >= 3) || count >= 30 :
      family === "not_found" ? count >= 20 && paths.length >= 10 : family === "edge_rate" ? count >= 60 : ["csrf", "method", "ssh_auth"].includes(family) ? count >= 10 : count >= 20;
    if (!detected) return;
    const kind: SecurityKind = family === "probe" || family === "not_found" ? "scan_detected" : family === "edge_rate" ? "traffic_detected"
      : family === "ssh_auth" ? "ssh_attack_detected" : ["csrf", "method", "auth_rate"].includes(family) ? "request_attack_detected" : "auth_attack_detected";
    const evidence = `5분 집계창: ${FAMILY_LABEL[family]} ${count}회${family === "ssh_auth" ? "" : `, 서로 다른 경로 ${paths.length}개. ${paths.slice(0, 3).join(", ")}`}`;
    if (!alerted || count % 10 === 0) raiseSecurityCase({ family, ip, source: family === "ssh_auth" ? "ssh" : ["not_found", "edge_rate"].includes(family) ? "nginx" : "app",
      severity: SECURITY_KINDS[kind].severity === "high" ? "high" : "warning", title: SECURITY_KINDS[kind].label, evidence, count,
      window: old?.started_at ?? (family === "ssh_auth" ? sshWindow : now) });
    if (alerted) return;
    run("UPDATE security_detection_windows SET alerted = 1 WHERE ip = ? AND family = ?", ip, family);
    recordSecurityEvent(kind, { ...context, ip, detail: evidence });
    // Only known sensitive-path probes create automatic, short-lived bans.
    if (family !== "probe" || !ipEnforcementEnabled() || !autoBanEnabled() || activeIpRule(ip)) return;
    try {
      const rule = saveIpRule({ ip, mode: "deny", source: "auto", actorId: "system", reason: evidence, minutes: 15 });
      recordSecurityEvent("ip_banned", { ip, userId: "system", detail: `자동 15분 차단 · ${evidence} · 만료 ${rule.expires_at}` });
    } catch (err) {
      if (!(err instanceof Error && err.message === "RULE_LIMIT")) throw err;
      // Preserve the alert if the bounded rule store is full; never evict operator rules.
    }
  });
}
