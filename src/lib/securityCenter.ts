import "server-only";
import { cache } from "react";
import { hostTelemetry, hostIngestionStatus } from "./hostTelemetry";
import { hostSecuritySnapshot } from "./hostSecurity";
import { edgeMonitorHealth } from "./securityEdgeMonitor";
import { ipRuleCounts, ipEnforcementEnabled, autoBanEnabled } from "./ipRules";
import { securityCaseSummary } from "./securityCases";
import { securityWriterStatus } from "./securityEvents";

export interface SecuritySource { id: string; name: string; state: "ready" | "warning" | "unavailable" | "stale" | "disabled"; detail: string; at: string; href: string }
export interface SecurityFinding { id: string; severity: "high" | "warning"; title: string; detail: string; action: string; href: string; at: string }
const base = "/operator/security";
// Request-only memoization. Authorization is still enforced by the page/action boundary.
export const securityCenterState = cache(() => {
  const telemetry = hostTelemetry(), host = hostSecuritySnapshot(), edge = edgeMonitorHealth();
  const ingestion = hostIngestionStatus(), data = telemetry.data;
  const writer = securityWriterStatus();
  const enforcing = ipEnforcementEnabled(), automatic = autoBanEnabled(), trustedIp = process.env.TRUST_PROXY === "1";
  const hostState = telemetry.state;
  const sshState = hostState !== "ready" ? hostState : !data?.sshChecked || ingestion?.failed ? "unavailable" : data.sshTruncated ? "warning" : "ready";
  const firewallState = hostState !== "ready" ? hostState : data?.firewalls.length !== 2 || data.firewalls.some(f => !f.checked) ? "unavailable" : data.firewalls.some(f => f.truncated) ? "warning" : "ready";
  const sources: SecuritySource[] = [
    { id: "app", name: "앱 보안 기록", state: writer?.failed ? "unavailable" : "ready", detail: writer?.failed ? "최근 기록·탐지 처리 실패" : "의심 신호·운영 변경 저장", at: writer?.at || "", href: `${base}?view=events` },
    { id: "nginx", name: "웹 서버 탐지", state: edge.state === "ready" && edge.backlogBytes >= 256 * 1024 ? "warning" : edge.state, detail: edge.backlogBytes >= 256 * 1024 ? `처리 대기 ${Math.ceil(edge.backlogBytes / 1024)}KB` : "404·429 반복 신호 확인", at: edge.checkedAt, href: `${base}?view=edge` },
    { id: "ssh", name: "SSH 인증", state: sshState, detail: ingestion?.failed ? "탐지 저장 실패 · DB 확인 필요" : data?.sshTruncated ? "수집 한도 도달 · 일부 누락 가능" : "서버 인증 실패·로그인 확인", at: data?.checkedAt || "", href: `${base}?view=ssh` },
    { id: "firewall", name: "호스트 방화벽", state: firewallState, detail: "IPv4·IPv6 INPUT 읽기 전용", at: data?.checkedAt || "", href: `${base}?view=host#host-firewall` },
  ];
  const findings: SecurityFinding[] = [];
  const add = (id: string, severity: SecurityFinding["severity"], title: string, detail: string, action: string, anchor = "host-inventory", at = host?.checkedAt || "") => findings.push({ id, severity, title, detail, action, href: `${base}?view=host#${anchor}`, at });
  if (host?.runnerIsRoot || host?.runnerPasswordlessSudoAll) add("privilege", "high", "서버 전체 권한으로 확대될 수 있습니다", "배포 점검에서 root 실행 또는 전체 무암호 sudo가 확인됐습니다. 앱·러너 계정과 배포 권한을 분리해야 합니다.", "계정 권한 확인");
  const broken = hostState === "ready" ? data?.firewalls.flatMap(f => f.blockedIps.filter(r => ["unreachable", "partial"].includes(r.coverage))) || [] : [];
  if (broken.length) add("firewall-order", "high", `방화벽 차단 ${broken.length}건의 순서를 확인하세요`, "앞선 허용·종료 규칙 때문에 차단이 적용되지 않는 요청이 있습니다. 웹 IP 차단과 별개입니다.", "문제 규칙 보기", "host-firewall", data?.checkedAt);
  if (!trustedIp) add("proxy", "high", "요청자의 IP를 확인할 수 없습니다", "신뢰할 프록시 설정이 없어 IP 기반 차단·로그인 제한이 적용되지 않습니다.", "보호 설정 확인", "protection-policy");
  if (!enforcing) add("enforcement", "warning", "웹 IP 차단 적용이 중지돼 있습니다", "저장된 차단 규칙은 유지됩니다. 복구 모드가 의도한 설정인지 확인하세요.", "차단 설정 확인", "protection-policy");
  if (host && host.tcpChecked && host.listeners.some(r => [3000, 3001].includes(r.port) && r.scope !== "loopback")) add("app-listener", "high", "앱 포트가 외부 인터페이스에서 대기 중입니다", "앱 포트는 루프백으로 제한하고 nginx 경유 여부와 방화벽을 함께 확인하세요.", "포트 확인");
  if (host?.sshChecked && [host.ssh.passwordauthentication, host.ssh.kbdinteractiveauthentication].includes("yes")) add("ssh-password", "warning", "SSH 비밀번호 인증이 허용돼 있습니다", "키 기반 접속과 복구 경로를 확인한 뒤 인증 정책을 검토하세요.", "SSH 설정 확인");
  if (!host || Date.now() - Date.parse(host.checkedAt) > 86400_000) add("inventory-age", "warning", host ? "배포 시점 점검이 24시간 이상 지났습니다" : "서버 설정 점검 결과가 없습니다", "배포 후 변경된 서버 설정은 실시간 수집 범위와 구분해 확인해야 합니다.", "점검 범위 확인");
  for (const s of sources.filter(s => s.state !== "ready")) add(`source-${s.id}`, "warning", `${s.name} 수집을 확인하세요`, `${s.detail}. 수집 이상과 기록 없음을 구분해야 합니다.`, "수집 상태 보기", "source-health", s.at);
  return { telemetry, host, sources, findings, enforcing, automatic, trustedIp, rules: ipRuleCounts(), cases: securityCaseSummary(), checkedAt: new Date().toISOString() };
});
export type SecurityCenterState = ReturnType<typeof securityCenterState>;
