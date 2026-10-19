import SecurityOverview from "@/components/security/SecurityOverview";
import SecurityCaseBoard from "@/components/security/SecurityCaseBoard";
import HostTelemetryPanel from "@/components/security/HostTelemetryPanel";
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
import { blockedIpActivity, querySecurityEvents, securityFilters, securityRequest } from "@/lib/securityEvents";
import { recentEdgeEvents } from "@/lib/securityEdgeLog";
import { SECURITY_KINDS, SEVERITY_LABEL } from "@/lib/securityPolicy";

export const metadata = { title: "보안 센터" };
export const dynamic = "force-dynamic";
const base = "/operator/security";
const input = "rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2.5 text-sm text-ink";
const tabs = [{ key: "overview", label: "현황" }, { key: "alerts", label: "탐지·대응" }, { key: "events", label: "접근 기록" }, { key: "blocked", label: "IP 관리" }, { key: "host", label: "보호 점검" }];

export default async function OperatorSecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(base);
  const raw = await searchParams;
  // eslint-disable-next-line react-hooks/purity -- Request timestamp in this dynamic Server Component, passed once to the client.
  const requestTime = Date.now();
  const filters = securityFilters(raw);
  const view = typeof raw.view === "string" && (tabs.some((t) => t.key === raw.view) || ["edge", "ssh"].includes(raw.view)) ? raw.view
    : filters.ip || filters.kind || filters.severity || filters.group ? "events" : "overview";
  pruneIpDefense();
  const rules = listIpRules();
  const modes = new Map(rules.map((r) => [r.ip, r.mode]));
  const denied = rules.filter((r) => r.mode === "deny");
  const monitor = edgeMonitorStatus();
  const autoBan = autoBanEnabled();
  const enforcement = ipEnforcementEnabled();
  const eventHref = (page = 1, extra: Record<string, string> = {}) => `${base}?${new URLSearchParams({ view: "events", hours: String(filters.hours), kind: filters.kind, group: filters.group || "", severity: filters.severity, ip: filters.ip, page: String(page), ...extra })}`;
  const caseStatus = typeof raw.status === "string" && ["open", "new", "investigating", "resolved", "dismissed", "all"].includes(raw.status) ? raw.status : "open";
  const menuView = ["edge", "ssh"].includes(view) ? "events" : view;
  const currentHref = view === "events" ? eventHref(filters.page) : `${base}?${new URLSearchParams({ view, ...(view === "alerts" ? { status: caseStatus } : {}), ...(filters.ip ? { ip: filters.ip } : {}), ...(view === "blocked" ? { page: String(filters.page) } : {}) })}`;
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
    <PageHeader title="보안 센터" description="의심 신호를 확인하고, 대응 기록과 IP 차단을 관리합니다." actions={<Link href={currentHref} prefetch={false} className="btn btn-secondary btn-sm">새로고침</Link>} />
    <nav aria-label="보안 센터 메뉴" className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--border-hairline)]">{tabs.map((t) => <Link key={t.key} href={`${base}?view=${t.key}`} prefetch={false} aria-current={menuView === t.key ? "page" : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${menuView === t.key ? "border-current text-ink" : "border-transparent text-ink-muted"}`}>{t.label}{t.key === "blocked" && <span className="ml-2 rounded-full bg-[var(--surface-section)] px-2 py-0.5 text-xs tabular-nums">{denied.length}</span>}</Link>)}</nav>
    {["events", "edge", "ssh"].includes(view) && <nav aria-label="접근 기록 출처" className="mb-6 flex flex-wrap gap-2">{[{ key: "events", label: "앱 보안 기록" }, { key: "edge", label: "nginx 요청" }, { key: "ssh", label: "SSH 인증" }].map((t) => <Link key={t.key} href={`${base}?view=${t.key}`} prefetch={false} aria-current={view === t.key ? "page" : undefined} className={`btn btn-sm ${view === t.key ? "btn-primary" : "btn-secondary"}`}>{t.label}</Link>)}</nav>}
    {view === "overview" && <SecurityOverview />}
    {view === "alerts" && <SecurityCaseBoard status={caseStatus} ip={filters.ip} page={filters.page} rules={rules} />}
    {view === "ssh" && <HostTelemetryPanel logsOnly />}
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
    {view === "host" && <><HostTelemetryPanel /><HostSecurityPanel /></>}
    <p className="mt-10 border-t border-[var(--border-hairline)] pt-5 text-xs leading-relaxed text-ink-muted">이 센터는 웹 서비스의 보안 신호를 보여 줍니다. SSH 인증은 서버 수집기 연결 시 확인할 수 있습니다. OCI 방화벽 차단·TCP 포트 스캔·DNS 요청은 OCI VCN Flow Logs와 별도 서버 로그가 필요합니다.</p>
  </div>;
}
