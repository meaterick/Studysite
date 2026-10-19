import "server-only";
import { readSecuritySnapshot } from "./securitySnapshots";
import { getMeta, setMeta, run, tx } from "./db";
import { normalizeIp } from "./ipAddress";
import { recordSecurityEvent } from "./securityEvents";
import { raiseSecurityCase } from "./securityCases";

export interface HostSshEvent { id: string; at: string; ip: string; outcome: "failed" | "accepted"; method: "password" | "publickey"; root: boolean }
export interface HostFirewall { family: "ipv4" | "ipv6"; checked: boolean; policy: string; publicTcpPorts: number[]; truncated: boolean;
  blockedIps: { ip: string; position: number; coverage: "unreachable" | "partial" | "first" | "review"; earlierAllowedPorts: number[] }[] }
export interface HostTelemetry { version: 1; checkedAt: string; sshChecked: boolean; sshTruncated: boolean; sshEvents: HostSshEvent[]; firewalls: HostFirewall[] }
const monitor = globalThis as unknown as { __aegisHostIngestion?: { checkedAt: string; failed: boolean } };
export function hostIngestionStatus() { return monitor.__aegisHostIngestion; }
const ports = (v: unknown): v is number[] => Array.isArray(v) && v.length <= 64 && v.every((p) => Number.isInteger(p) && p > 0 && p <= 65535);
export function hostTelemetry(): { state: "disabled" | "unavailable" | "stale" | "ready"; data: HostTelemetry | null } {
  const file = process.env.SECURITY_HOST_TELEMETRY;
  if (!file) return { state: "disabled", data: null };
  const v = readSecuritySnapshot(file, (value): value is HostTelemetry => {
    const v = value as HostTelemetry;
    if (!v) return false;
    if (v.version !== 1 || typeof v.checkedAt !== "string" || !Number.isFinite(Date.parse(v.checkedAt))
      || typeof v.sshChecked !== "boolean" || typeof v.sshTruncated !== "boolean" || !Array.isArray(v.sshEvents) || v.sshEvents.length > 200
      || !v.sshEvents.every((e) => e && /^[a-f0-9]{32}$/.test(e.id) && typeof e.at === "string" && Number.isFinite(Date.parse(e.at)) && !!normalizeIp(e.ip)
        && ["failed", "accepted"].includes(e.outcome) && ["password", "publickey"].includes(e.method) && typeof e.root === "boolean")
      || !Array.isArray(v.firewalls) || v.firewalls.length > 2 || !v.firewalls.every((f) => f && ["ipv4", "ipv6"].includes(f.family) && typeof f.checked === "boolean"
        && ["ACCEPT", "DROP", "REJECT", "unknown"].includes(f.policy) && typeof f.truncated === "boolean" && ports(f.publicTcpPorts)
        && Array.isArray(f.blockedIps) && f.blockedIps.length <= 200 && f.blockedIps.every((r) => r && !!normalizeIp(r.ip) && Number.isInteger(r.position) && r.position > 0
          && ["unreachable", "partial", "first", "review"].includes(r.coverage) && ports(r.earlierAllowedPorts)))) return false;
    return true;
  });
  if (!v) return { state: "unavailable", data: null };
  const age = Date.now() - Date.parse(v.checkedAt);
  return { state: age > 180_000 || age < -60_000 ? "stale" : "ready", data: v };
}
export function pollHostTelemetry(): number {
  try {
    const count = ingestHostTelemetry();
    monitor.__aegisHostIngestion = { checkedAt: new Date().toISOString(), failed: false };
    return count;
  } catch (error) {
    monitor.__aegisHostIngestion = { checkedAt: new Date().toISOString(), failed: true };
    throw error;
  }
}
function ingestHostTelemetry(): number {
  const snapshot = hostTelemetry();
  if (snapshot.state !== "ready" || !snapshot.data) return 0;
  const data = snapshot.data;
  // Read first: unchanged snapshots never acquire a SQLite writer lock.
  if (getMeta("security_host_generation") === data.checkedAt) return 0;
  return tx(() => {
    if (getMeta("security_host_generation") === data.checkedAt) return 0;
    let processed = 0;
    for (const e of [...data.sshEvents].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))) {
      const at = Date.parse(e.at);
      if (Date.now() - at > 15 * 60_000 || at > Date.now() + 60_000) continue;
      if (!run("INSERT INTO security_host_seen (id, at) VALUES (?, ?) ON CONFLICT DO NOTHING", e.id, e.at).changes) continue;
      const kind = e.outcome === "failed" ? "ssh_failure" : e.root ? "ssh_root_login" : "ssh_login";
      const detail = `SSH ${e.method} · ${e.root ? "root" : "일반 계정"} · 서버 발생 ${e.at}`;
      recordSecurityEvent(kind, { ip: e.ip, method: "SSH", path: "/host/ssh", detail, signalAt: at });
      if (e.outcome === "accepted" && e.root) raiseSecurityCase({ family: "ssh_root", ip: e.ip, source: "ssh", severity: "warning", title: "root SSH 로그인 확인 필요", evidence: detail, count: 1, window: Math.floor(at / 300_000) * 300_000 });
      processed++;
    }
    setMeta("security_host_generation", data.checkedAt);
    setMeta("security_host_ingested", new Date().toISOString());
    return processed;
  });
}
export function startHostTelemetryMonitor() {
  if (!process.env.SECURITY_HOST_TELEMETRY) return;
  const poll = () => { try { pollHostTelemetry(); } catch { /* UI exposes source health; no raw log contents on failures. */ } };
  poll(); const timer = setInterval(poll, 15_000); timer.unref();
}
