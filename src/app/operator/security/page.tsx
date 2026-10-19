import { headers } from "next/headers";
import SecurityControls from "@/components/security/SecurityControls";
import { activeIpRule, autoBanEnabled, ipEnforcementEnabled, listIpRules } from "@/lib/ipRules";
import { edgeMonitorStatus } from "@/lib/securityEdgeMonitor";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/datetime";
import { querySecurityEvents, securityFilters, securitySummary, securityRequest } from "@/lib/securityEvents";
import { recentEdgeEvents } from "@/lib/securityEdgeLog";
import { SECURITY_KINDS, SEVERITY_LABEL } from "@/lib/securityPolicy";

export const metadata = { title: "보안 기록" };
export const dynamic = "force-dynamic";

export default async function OperatorSecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/operator/security");
  const filters = securityFilters(await searchParams);
  const { events, total, page, pages } = querySecurityEvents(filters);
  const summary = securitySummary();
  const edge = recentEdgeEvents();
  const monitor = edgeMonitorStatus();
  const ownIp = securityRequest({ headers: await headers() }).ip ?? "";
  const ipRules = listIpRules();
  const autoBan = autoBanEnabled();
  const enforcement = ipEnforcementEnabled();
  const href = (p: number) => `/operator/security?${new URLSearchParams({ hours: String(filters.hours), kind: filters.kind, severity: filters.severity, ip: filters.ip, page: String(p) })}`;
  const inputClass = "rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 py-2 text-sm text-ink";
  const stats = [
    { label: "반복 탐지 경고", value: summary.detections }, { label: "차단한 요청", value: summary.blocked },
    { label: "요청 한도 초과", value: summary.limited }, { label: "주의·높음 IP 수", value: summary.ips },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="보안 기록" description="로그인·권한·반복 요청을 한곳에서 확인합니다." actions={<Link href={href(page)} prefetch={false} className="btn btn-secondary btn-sm">새로고침</Link>} />
      <div className="callout callout-warn mb-8">
        <p>위험 신호는 공격 성공을 뜻하지 않습니다. 로그인 취소·만료, 잘못된 주소, 공유 IP의 정상 요청도 포함될 수 있습니다.</p>
        <p className="mt-2 text-xs">웹 서비스에 도달한 기록입니다. OCI 방화벽이 차단한 패킷, 포트 스캔, SSH 로그인은 OCI VCN Flow Logs와 서버 인증 로그에서 별도로 확인합니다.</p>
      </div>

      <h2 className="section-title mb-4">최근 24시간 · 앱에 보관된 기록</h2>
      <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => <div key={s.label} className="rounded-2xl border border-[var(--border-hairline)] p-4"><dt className="text-xs text-ink-muted">{s.label}</dt><dd className="mt-2 text-3xl font-semibold tabular-nums text-ink">{s.value.toLocaleString()}</dd></div>)}
      </dl>
      {summary.topIps.length > 0 && <div className="mb-8 flex flex-wrap items-center gap-3 text-sm"><span className="text-ink-muted">반복 신호가 많은 IP</span>{summary.topIps.map((ip) => <Link key={ip.ip} href={`/operator/security?ip=${encodeURIComponent(ip.ip)}`} prefetch={false} className="btn btn-ghost btn-sm font-mono">{ip.ip} · {ip.n}건</Link>)}</div>}

      <SecurityControls rules={ipRules} ownIp={ownIp} initialIp={filters.ip} autoBan={autoBan} enforcement={enforcement} />

      <section aria-labelledby="app-events">
        <h2 id="app-events" className="section-title mb-4">앱 보안 이벤트</h2>
        <form className="mb-5 flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">기간<select name="hours" defaultValue={filters.hours} className={inputClass}><option value="24">24시간</option><option value="168">7일</option><option value="720">30일</option></select></label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">종류<select name="kind" defaultValue={filters.kind} className={inputClass}><option value="">전체 종류</option>{Object.entries(SECURITY_KINDS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">위험도<select name="severity" defaultValue={filters.severity} className={inputClass}><option value="">전체 위험도</option>{Object.entries(SEVERITY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">IP 주소<input name="ip" defaultValue={filters.ip} placeholder="정확한 IP 주소" maxLength={45} className={inputClass} /></label>
          <button className="btn btn-primary btn-sm">조회</button><Link href="/operator/security" prefetch={false} className="btn btn-ghost btn-sm">초기화</Link>
        </form>
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">같은 종류·IP·계정·요청의 반복은 5분 단위로 합산합니다. 최대 30일·10,000개 묶음을 보관하며 한도에 도달하면 이전 묶음부터 지웁니다. 아래 시각은 마지막 발생 시각입니다. IP가 없으면 신뢰할 프록시 정보가 없거나 계정 기준으로 기록된 요청입니다.</p>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
          <table className="data-table"><thead><tr>{["시각 (한국)", "위험도·종류", "IP / 계정 ID", "요청", "횟수 / 상태", "판단·대응"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{events.length === 0 ? <tr><td colSpan={6} className="text-ink-muted">조건에 맞는 보안 기록이 없습니다. 배포 이전의 요청은 소급 수집되지 않습니다.</td></tr> : events.map((e) => <tr key={e.id}>
              <td className="whitespace-nowrap text-xs tabular-nums text-ink-secondary" title={`첫 발생: ${formatDateTime(e.first_at)}`}>{formatDateTime(e.last_at)}</td>
              <td className="min-w-36 text-sm"><span className={e.severity === "high" ? "text-[var(--status-critical)]" : "text-ink-muted"}>{SEVERITY_LABEL[e.severity]}</span><br />{SECURITY_KINDS[e.kind]?.label ?? e.kind}</td>
              <td className="max-w-56 break-all font-mono text-xs text-ink-secondary">{e.ip ? <><Link href={`/operator/security?ip=${encodeURIComponent(e.ip)}#ip-rules`} prefetch={false} className="underline">{e.ip}</Link><div className="mt-1 text-ink-muted">{activeIpRule(e.ip)?.mode === "deny" ? "차단 중" : activeIpRule(e.ip)?.mode === "allow" ? "허용 중" : "규칙 없음"}</div></> : "IP 없음"}{e.user_id && <div className="mt-1 text-ink-muted">{e.user_id}</div>}</td>
              <td className="max-w-64 break-all font-mono text-xs text-ink-secondary">{e.method} {e.path || "서버 액션"}</td>
              <td className="whitespace-nowrap text-sm tabular-nums">{e.count.toLocaleString()}회<br /><span className="text-xs text-ink-muted">{e.status || "—"}</span></td>
              <td className="min-w-56 text-xs leading-relaxed text-ink-secondary">{SECURITY_KINDS[e.kind]?.advice}{e.detail && <p className="mt-2 break-words text-ink-muted">{e.detail}</p>}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <nav aria-label="보안 기록 페이지" className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-secondary">
          <span>{total.toLocaleString()}개 묶음 · {page} / {pages} 페이지</span><div className="flex gap-2">{page > 1 && <Link className="btn btn-ghost btn-sm" href={href(page - 1)} prefetch={false}>이전</Link>}{page < pages && <Link className="btn btn-ghost btn-sm" href={href(page + 1)} prefetch={false}>다음</Link>}</div>
        </nav>
      </section>

      <section className="mt-12" aria-labelledby="edge-events">
        <h2 id="edge-events" className="section-title mb-3">nginx 요청 기록</h2>
        <p className="mb-3 text-xs text-ink-muted">nginx 탐지 수집기: {monitor ? `마지막 확인 ${formatDateTime(monitor.checkedAt)} · 연결 후 해석 ${monitor.processed.toLocaleString()}건` : "연결 대기 중"}. 10초마다 새 기록을 읽어 반복 404·429를 경고합니다. 마지막 확인이 오래되면 수집 경로·읽기 권한을 확인해 주십시오.</p>
        <p className="mb-4 text-sm leading-relaxed text-ink-secondary">앱에 도달하기 전에 nginx가 거절한 요청도 포함합니다. 4xx·5xx 응답만 기록하며, 현재 로그 파일의 마지막 512KB 중 최근 100건을 표시합니다. 위 앱 통계와 중복될 수 있어 합산하지 않습니다. 최대 약 5초 뒤 반영되며 파일 회전 후에는 현재 파일만 표시합니다.</p>
        {edge.state !== "ready" ? <p role="status" className="callout callout-warn">{edge.state === "disabled" ? "nginx 로그 연결이 설정되지 않았습니다. 운영 배포는 로그 경로와 읽기 권한을 자동 설정합니다." : "nginx 로그를 읽지 못했습니다. 운영 배포의 로그 파일과 앱 읽기 권한을 확인해 주십시오."}</p> : <>
          {edge.truncated && <p className="mb-3 text-xs text-ink-muted">표시 범위를 넘는 이전 기록이 있습니다. 이 목록은 전체 기간 통계가 아닙니다.</p>}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]"><table className="data-table"><thead><tr>{["시각 (한국)", "IP", "요청", "HTTP", "신호"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
            {edge.events.length === 0 ? <tr><td colSpan={5} className="text-ink-muted">현재 파일에 표시할 요청 기록이 없습니다.</td></tr> : edge.events.map((e, i) => <tr key={i}><td className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(e.at)}</td><td className="font-mono text-xs">{e.ip}</td><td className="max-w-80 break-all font-mono text-xs">{e.method} {e.path}</td><td className="tabular-nums">{e.status}</td><td className="text-xs text-ink-secondary">{e.limited ? "요청·연결 한도 초과" : e.probe ? "민감 경로 탐색" : e.status >= 500 ? "서버·상위 서버 오류" : "실패 응답 (공격 여부 확인 필요)"}</td></tr>)}
          </tbody></table></div>
        </>}
      </section>
    </div>
  );
}
