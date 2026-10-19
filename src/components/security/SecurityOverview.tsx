import Link from "next/link";
import { listIpRules, autoBanEnabled, ipEnforcementEnabled } from "@/lib/ipRules";
import { securitySummary } from "@/lib/securityEvents";
import { querySecurityCases, securityCaseSummary, CASE_STATUS } from "@/lib/securityCases";
import { edgeMonitorStatus } from "@/lib/securityEdgeMonitor";
import { hostTelemetry } from "@/lib/hostTelemetry";
import { hostSecuritySnapshot } from "@/lib/hostSecurity";
import { formatDateTime } from "@/lib/datetime";

const base = "/operator/security";
export default function SecurityOverview() {
  const rules = listIpRules(), denied = rules.filter((r) => r.mode === "deny"), counts = securityCaseSummary(), summary = securitySummary();
  const telemetry = hostTelemetry(), host = hostSecuritySnapshot(), edge = edgeMonitorStatus();
  const alerts = querySecurityCases("open").cases.slice(0, 5);
  const privilege = host && (host.runnerIsRoot || host.runnerPasswordlessSudoAll === true);
  const broken = telemetry.data?.firewalls.flatMap((f) => f.blockedIps.filter((r) => r.coverage === "unreachable" || r.coverage === "partial")) ?? [];
  const cards = [
    { label: "확인할 탐지 건", value: counts.open, hint: `높음 ${counts.high} · 확인 중 ${counts.investigating}`, href: `${base}?view=alerts` },
    { label: "현재 차단된 IP", value: denied.length, hint: `자동 ${denied.filter((r) => r.source === "auto").length} · 수동 ${denied.filter((r) => r.source === "manual").length}`, href: `${base}?view=blocked` },
    { label: "거절한 웹 차단 IP 요청", value: summary.blocked, hint: "최근 24시간 · HTTP 요청", href: `${base}?view=events&kind=ip_blocked` },
  ];
  return <>
    {(privilege || broken.length > 0) && <div className="mb-6 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-section)] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[var(--status-critical)]">먼저 확인할 서버 설정</h2><Link href={`${base}?view=host`} prefetch={false} className="btn btn-secondary btn-sm">점검 결과</Link></div><ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-secondary">{privilege && <li>배포 시 점검에서 전체 무암호 sudo 또는 root 실행이 확인됐습니다. 앱·러너 계정과 권한을 분리하십시오.</li>}{broken.length > 0 && <li>호스트 IP 차단 {broken.length}개에 앞선 허용·종료 규칙이 있습니다. 방화벽 순서를 확인하십시오.</li>}</ul></div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-3">{cards.map((s) => <Link key={s.label} href={s.href} prefetch={false} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5 transition-colors hover:bg-[var(--surface-section)]"><p className="text-xs text-ink-secondary">{s.label}</p><p className="my-3 text-4xl font-semibold tabular-nums text-ink">{s.value.toLocaleString()}</p><p className="text-xs text-ink-muted">{s.hint} →</p></Link>)}</div>
    <section className="mb-8 rounded-2xl border border-[var(--border-hairline)] p-5"><h2 className="text-sm font-semibold text-ink">수집·보호 상태</h2><div className="mt-4 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-ink-muted">웹 IP 차단</p><p className="mt-1 font-semibold text-ink">{ipEnforcementEnabled() ? "적용 중" : "복구 모드 / 중지"} · 자동 차단 {autoBanEnabled() ? "사용" : "중지"}</p></div>
      <div><p className="text-ink-muted">nginx 반복 탐지</p><p className="mt-1 font-semibold text-ink">{edge ? `${formatDateTime(edge.checkedAt)} 확인` : "연결 대기"}</p></div>
      <div><p className="text-ink-muted">SSH·방화벽</p><p className="mt-1 font-semibold text-ink">{telemetry.state === "ready" ? telemetry.data?.sshChecked ? "연결됨 · 약 1분 주기" : "SSH 읽기 실패" : telemetry.state === "stale" ? "갱신 지연" : "연결 안 됨"}</p></div>
      <div><p className="text-ink-muted">로그인 보호</p><p className="mt-1 font-semibold text-ink">{process.env.TRUST_PROXY === "1" ? "IP 요청 제한 · 응답 재사용 거절" : "프록시 IP 확인 필요 · IP 제한 미적용"}</p></div>
    </div><p className="mt-4 text-xs text-ink-muted">기록은 새로고침 시 갱신됩니다. SSH·DNS·네트워크 전체를 웹 IP 차단으로 보호할 수는 없습니다.</p></section>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><section><div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">우선 확인할 탐지</h2><Link href={`${base}?view=alerts`} prefetch={false} className="text-xs text-ink-secondary underline underline-offset-4">전체 대응 목록</Link></div><div className="space-y-3">{alerts.length ? alerts.map((c) => <Link key={c.id} href={`${base}?view=alerts&ip=${encodeURIComponent(c.ip)}`} prefetch={false} className="block rounded-2xl border border-[var(--border-hairline)] bg-card p-5"><div className="flex flex-wrap items-center gap-2 text-xs"><span className={c.severity === "high" ? "font-semibold text-[var(--status-critical)]" : "text-ink-secondary"}>{c.severity === "high" ? "높음" : "주의"}</span><span className="text-ink-muted">{c.source === "ssh" ? "SSH" : c.source === "nginx" ? "nginx" : "웹 앱"} · {CASE_STATUS[c.status]}{c.reopened ? " · 재발" : ""}</span></div><h3 className="mt-2 text-sm font-semibold text-ink">{c.title}</h3><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-ink-muted"><span className="break-all font-mono">{c.ip}</span><span>{formatDateTime(c.last_at)} →</span></div></Link>) : <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] p-10 text-center"><p className="font-semibold text-ink">현재 확인할 탐지 건이 없습니다</p><p className="mt-2 text-xs text-ink-muted">수집 상태와 최근 접근 기록을 함께 확인할 수 있습니다.</p></div>}</div></section>
      <aside><h2 className="section-title mb-4">최근 24시간의 신호</h2><dl className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">{[{ label: "반복 탐지 경고", value: summary.detections }, { label: "웹 요청 한도 초과", value: summary.limited }, { label: "주의·높음 신호 IP", value: summary.ips }].map((r) => <div key={r.label} className="mb-4 flex justify-between gap-3 text-xs last:mb-0"><dt className="text-ink-muted">{r.label}</dt><dd className="font-semibold tabular-nums text-ink">{r.value}</dd></div>)}</dl><h3 className="mb-3 mt-6 text-sm font-semibold text-ink">반복 신호가 많은 IP</h3><div className="space-y-3 rounded-2xl bg-[var(--surface-section)] p-5">{summary.topIps.length ? summary.topIps.map((r) => <Link key={r.ip} href={`${base}?view=events&ip=${encodeURIComponent(r.ip)}`} prefetch={false} className="flex justify-between gap-3 text-xs"><span className="min-w-0 break-all font-mono text-ink-secondary">{r.ip}</span><span className="shrink-0 text-ink-muted">{r.n.toLocaleString()}회</span></Link>) : <p className="text-xs text-ink-muted">집계된 IP가 없습니다.</p>}</div><p className="mt-4 text-xs leading-relaxed text-ink-muted">경고 횟수는 공격 성공률이나 침해 확률이 아닙니다. 공유 IP·만료된 로그인·운영 작업도 확인이 필요합니다.</p></aside>
    </div>
  </>;
}
