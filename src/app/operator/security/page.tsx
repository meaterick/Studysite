import { headers } from "next/headers";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SecurityControls from "@/components/security/SecurityControls";
import SecurityEventList from "@/components/security/SecurityEventList";
import HostSecurityPanel from "@/components/security/HostSecurityPanel";
import { autoBanEnabled, ipEnforcementEnabled, ipRuleHistory, listIpRules, pruneIpDefense } from "@/lib/ipRules";
import { edgeMonitorStatus } from "@/lib/securityEdgeMonitor";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/datetime";
import { blockedIpActivity, querySecurityEvents, securityFilters, securitySummary, securityRequest } from "@/lib/securityEvents";
import { recentEdgeEvents } from "@/lib/securityEdgeLog";
import { SECURITY_KINDS, SEVERITY_LABEL } from "@/lib/securityPolicy";

export const metadata = { title: "보안 센터" };
export const dynamic = "force-dynamic";
const base = "/operator/security";
const input = "rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2.5 text-sm text-ink";
const tabs = [{ key: "overview", label: "요약" }, { key: "blocked", label: "차단 IP" }, { key: "events", label: "보안 기록" }, { key: "edge", label: "웹 요청" }, { key: "host", label: "서버 점검" }];

export default async function OperatorSecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(base);
  const raw = await searchParams;
  // eslint-disable-next-line react-hooks/purity -- Request timestamp in this dynamic Server Component, passed once to the client.
  const requestTime = Date.now();
  const filters = securityFilters(raw);
  const view = typeof raw.view === "string" && tabs.some((t) => t.key === raw.view) ? raw.view
    : filters.ip || filters.kind || filters.severity || filters.group ? "events" : "overview";
  pruneIpDefense();
  const rules = listIpRules();
  const modes = new Map(rules.map((r) => [r.ip, r.mode]));
  const denied = rules.filter((r) => r.mode === "deny");
  const summary = securitySummary();
  const monitor = edgeMonitorStatus();
  const autoBan = autoBanEnabled();
  const enforcement = ipEnforcementEnabled();
  const eventHref = (page = 1, extra: Record<string, string> = {}) => `${base}?${new URLSearchParams({ view: "events", hours: String(filters.hours), kind: filters.kind, group: filters.group || "", severity: filters.severity, ip: filters.ip, page: String(page), ...extra })}`;
  const currentHref = view === "events" ? eventHref(filters.page) : `${base}?${new URLSearchParams({ view, ...(filters.ip ? { ip: filters.ip } : {}), ...(view === "blocked" ? { page: String(filters.page) } : {}) })}`;
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
    <PageHeader title="보안 센터" description="탐지 신호를 확인하고 차단된 IP를 관리합니다." actions={<Link href={currentHref} prefetch={false} className="btn btn-secondary btn-sm">새로고침</Link>} />
    <nav aria-label="보안 센터 메뉴" className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--border-hairline)]">{tabs.map((t) => <Link key={t.key} href={`${base}?view=${t.key}`} prefetch={false} aria-current={view === t.key ? "page" : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${view === t.key ? "border-current text-ink" : "border-transparent text-ink-muted"}`}>{t.label}{t.key === "blocked" && <span className="ml-2 rounded-full bg-[var(--surface-section)] px-2 py-0.5 text-xs tabular-nums">{denied.length}</span>}</Link>)}</nav>
    {view === "overview" && <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">지금 확인할 보안 현황</h2><span className="text-xs text-ink-muted">기록 통계는 최근 24시간 기준</span></div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        { label: "현재 차단된 IP", value: denied.length, note: `자동 ${denied.filter((r) => r.source === "auto").length} · 수동 ${denied.filter((r) => r.source === "manual").length}`, href: `${base}?view=blocked` },
        { label: "반복 탐지 경고", value: summary.detections, note: "탐지 근거 확인", href: `${base}?view=events&group=detections` },
        { label: "거절한 차단 IP 요청", value: summary.blocked, note: "HTTP 접근 차단", href: `${base}?view=events&kind=ip_blocked` },
        { label: "요청 한도 초과", value: summary.limited, note: `주의·높음 IP ${summary.ips}개`, href: `${base}?view=events&kind=rate_limited` },
      ].map((s) => <Link key={s.label} href={s.href} prefetch={false} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-4 transition-colors hover:bg-[var(--surface-section)] sm:p-5"><p className="text-xs text-ink-secondary">{s.label}</p><p className="my-3 text-3xl font-semibold tabular-nums text-ink">{s.value.toLocaleString()}</p><p className="text-xs text-ink-muted">{s.note} →</p></Link>)}</div>
      <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-[var(--surface-section)] px-4 py-3 text-xs text-ink-secondary"><span>IP 차단 적용 · {enforcement ? "사용 중" : "복구 모드 / 중지"}</span><span>새 자동 차단 · {autoBan ? "사용 중" : "중지"}</span><span>웹 탐지 수집 · {monitor ? `${formatDateTime(monitor.checkedAt)} 확인` : "연결 대기"}</span></div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><section><div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">최근 탐지 경고</h2><Link href={`${base}?view=events&group=detections`} prefetch={false} className="text-xs text-ink-secondary underline underline-offset-4">전체 보기</Link></div><SecurityEventList events={querySecurityEvents({ hours: 24, kind: "", severity: "", ip: "", page: 1, group: "detections" }).events.slice(0, 5)} ruleModes={modes} /></section>
        <aside><h2 className="section-title mb-4">반복 신호가 많은 IP</h2><div className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">{summary.topIps.length ? <ol className="space-y-4">{summary.topIps.map((r, i) => <li key={r.ip}><Link href={`${base}?view=events&ip=${encodeURIComponent(r.ip)}`} prefetch={false} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 break-all font-mono text-ink"><span className="mr-2 text-ink-muted">{i + 1}.</span>{r.ip}</span><span className="shrink-0 tabular-nums text-ink-secondary">{r.n.toLocaleString()}회</span></Link></li>)}</ol> : <p className="text-sm text-ink-muted">아직 집계된 IP가 없습니다.</p>}<p className="mt-5 text-xs leading-relaxed text-ink-muted">주의·높음 이벤트의 발생 횟수입니다. 공유 IP와 정상 요청이 포함될 수 있습니다.</p></div><div className="mt-4 rounded-2xl bg-[var(--surface-section)] p-5"><h3 className="text-sm font-semibold text-ink">서버 침해가 의심된다면</h3><p className="mt-2 text-xs leading-relaxed text-ink-secondary">웹 IP 차단과 별도로 SSH·DNS·배포 계정의 권한을 확인하십시오. 이 화면의 경고는 침해 성공의 증거가 아닙니다.</p><Link href={`${base}?view=host`} prefetch={false} className="btn btn-secondary btn-sm mt-4">서버 점검 보기</Link></div></aside>
      </div>
    </>}
    {view === "blocked" && <>
      <SecurityControls rules={rules} ownIp={securityRequest({ headers: await headers() }).ip ?? ""} initialIp={filters.ip} autoBan={autoBan} enforcement={enforcement} activity={blockedIpActivity()} now={requestTime} />
      <section className="mt-10" aria-labelledby="ip-history"><h2 id="ip-history" className="section-title">차단·허용 변경 이력</h2><p className="mb-4 mt-2 text-xs leading-relaxed text-ink-muted">설정·해제·자동 만료를 최대 30일·3,000건 보관합니다. 이력 도입 당시 남아 있던 규칙은 ‘기존 규칙’으로 표시합니다. 과거 변경은 복원하지 않습니다.</p>
        <form method="get" className="mb-4 flex flex-wrap items-end gap-3"><input type="hidden" name="view" value="blocked" /><label className="flex flex-col gap-1 text-xs text-ink-secondary">이력 IP 필터<input className={input} name="ip" defaultValue={filters.ip} maxLength={45} placeholder="정확한 IP 주소" /></label><button className="btn btn-secondary btn-sm">이력 조회</button>{filters.ip && <Link href={`${base}?view=blocked`} prefetch={false} className="btn btn-ghost btn-sm">전체 IP</Link>}</form>
        {(() => { const history = ipRuleHistory(filters.ip, filters.page); return <><div className="space-y-2">{history.entries.length ? history.entries.map((r) => <details key={r.id} className="rounded-xl border border-[var(--border-hairline)] p-4"><summary className="cursor-pointer text-sm text-ink"><span className="mr-3 font-semibold">{({ saved: "설정", removed: "해제", expired: "만료", existing: "기존 규칙" })[r.action]}</span><span className="mr-3 break-all font-mono text-xs">{r.ip}</span><span className="text-xs text-ink-muted">{r.mode === "deny" ? "차단" : "허용"} · {r.source === "auto" ? "자동 탐지" : "수동"} · {formatDateTime(r.at)}</span></summary><div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-secondary"><p className="break-words">{r.reason}</p><p>만료 시각 {r.expires_at ? formatDateTime(r.expires_at) : "없음"}{r.actor_id ? ` · 설정/해제 계정 ${r.actor_id}` : " · 시스템 처리"}</p><Link href={`${base}?view=events&ip=${encodeURIComponent(r.ip)}`} prefetch={false} className="underline underline-offset-4">이 IP의 보안 기록 보기</Link></div></details>) : <p className="rounded-xl bg-[var(--surface-section)] p-5 text-sm text-ink-muted">표시할 변경 이력이 없습니다.</p>}</div><nav aria-label="IP 변경 이력 페이지" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted"><span>{history.total.toLocaleString()}건 · {history.page}/{history.pages} 페이지</span><div className="flex gap-2">{[history.page - 1, history.page + 1].filter((p) => p >= 1 && p <= history.pages).map((p) => <Link key={p} href={`${base}?${new URLSearchParams({ view: "blocked", ip: filters.ip, page: String(p) })}`} prefetch={false} className="btn btn-ghost btn-sm">{p < history.page ? "이전" : "다음"}</Link>)}</div></nav></>; })()}
      </section>
    </>}
    {view === "events" && <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">보안 기록</h2><span className="text-xs text-ink-muted">시각은 한국 기준 · 마지막 발생 순</span></div>
      <div className="mb-4 flex flex-wrap gap-2">{[{ key: "", label: "전체 기록" }, { key: "detections", label: "탐지 경고" }, { key: "changes", label: "운영자·차단 변경" }].map((g) => <Link key={g.key} href={eventHref(1, { group: g.key, kind: "" })} prefetch={false} aria-current={filters.group === g.key ? "page" : undefined} className={`btn btn-sm ${filters.group === g.key || (!filters.group && !g.key) ? "btn-primary" : "btn-secondary"}`}>{g.label}</Link>)}</div>
      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border-hairline)] bg-card p-4" method="get"><input type="hidden" name="view" value="events" /><input type="hidden" name="group" value={filters.group || ""} />
        <label className="flex flex-col gap-1 text-xs text-ink-secondary">기간<select name="hours" defaultValue={filters.hours} className={input}><option value="24">24시간</option><option value="168">7일</option><option value="720">30일</option></select></label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-ink-secondary">종류<select name="kind" defaultValue={filters.kind} className={`${input} max-w-full`}><option value="">전체 종류</option>{Object.entries(SECURITY_KINDS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs text-ink-secondary">위험도<select name="severity" defaultValue={filters.severity} className={input}><option value="">전체 위험도</option>{Object.entries(SEVERITY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-ink-secondary">IP 주소<input name="ip" defaultValue={filters.ip} placeholder="정확한 IP 주소" maxLength={45} className={`${input} max-w-full`} /></label><button className="btn btn-primary btn-sm">조회</button><Link href={`${base}?view=events`} prefetch={false} className="btn btn-ghost btn-sm">초기화</Link>
      </form>
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">같은 요청은 5분 단위로 묶습니다. 최대 30일·10,000개 묶음 보관. 경고는 공격 성공을 뜻하지 않습니다. 각 기록을 펼치면 탐지 근거와 대응 방법을 볼 수 있습니다.</p>
      {(() => { const result = querySecurityEvents(filters); return <><SecurityEventList events={result.events} ruleModes={modes} /><nav aria-label="보안 기록 페이지" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted"><span>{result.total.toLocaleString()}개 묶음 · {result.page}/{result.pages} 페이지</span><div className="flex gap-2">{result.page > 1 && <Link href={eventHref(result.page - 1)} prefetch={false} className="btn btn-ghost btn-sm">이전</Link>}{result.page < result.pages && <Link href={eventHref(result.page + 1)} prefetch={false} className="btn btn-ghost btn-sm">다음</Link>}</div></nav></>; })()}
    </section>}
    {view === "edge" && <section><h2 className="section-title mb-3">웹 요청 기록</h2><p className="mb-3 text-sm text-ink-secondary">nginx가 기록한 4xx·5xx 응답입니다. 앱에 도달하기 전에 거절한 요청도 포함되며 앱 통계와 중복될 수 있습니다.</p><div className="mb-5 rounded-xl bg-[var(--surface-section)] p-4 text-xs leading-relaxed text-ink-secondary">반복 탐지 수집 · {monitor ? `마지막 확인 ${formatDateTime(monitor.checkedAt)} · 연결 이후 ${monitor.processed.toLocaleString()}건 처리` : "연결 대기 중"}<p className="mt-2">10초마다 반복 404·429를 확인합니다. 최근 확인 시각이 오래되면 로그 경로와 읽기 권한을 점검하십시오.</p></div>
      {(() => { const edge = recentEdgeEvents(); return edge.state !== "ready" ? <p role="status" className="callout callout-warn">{edge.state === "disabled" ? "nginx 로그 연결이 설정되지 않았습니다." : "nginx 로그를 읽지 못했습니다. 로그 파일과 읽기 권한을 확인하십시오."}</p> : <><p className="mb-4 text-xs text-ink-muted">현재 파일의 마지막 512KB에서 최근 100건 표시 · 약 5초 뒤 반영 · 파일 회전 이전 기록 제외{edge.truncated ? " · 표시 범위 이전 기록 있음" : ""}</p><div className="space-y-2">{edge.events.length ? edge.events.map((e, i) => <article key={i} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"><div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-semibold text-ink">HTTP {e.status} · {e.limited ? "요청 한도 초과" : e.probe ? "민감 경로 탐색" : e.status >= 500 ? "서버 오류" : "실패 응답"}</span><time dateTime={e.at} className="text-ink-muted">{formatDateTime(e.at)}</time></div><p className="mt-2 break-all font-mono text-xs text-ink-secondary"><Link className="underline underline-offset-4" href={`${base}?view=events&ip=${encodeURIComponent(e.ip)}`} prefetch={false}>{e.ip}</Link> · {e.method} {e.path}</p></article>) : <p className="rounded-xl bg-[var(--surface-section)] p-5 text-sm text-ink-muted">현재 파일에 표시할 요청이 없습니다.</p>}</div></>; })()}
    </section>}
    {view === "host" && <HostSecurityPanel />}
    <p className="mt-10 border-t border-[var(--border-hairline)] pt-5 text-xs leading-relaxed text-ink-muted">이 센터는 웹 서비스의 보안 신호를 보여 줍니다. OCI 방화벽 차단·TCP 포트 스캔·SSH 로그인은 서버 인증 로그와 OCI VCN Flow Logs에서 별도로 확인합니다.</p>
  </div>;
}
