import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import { CASE_STATUS, querySecurityCases, securityCaseHistory } from "@/lib/securityCases";
import SecurityCaseActions from "./SecurityCaseActions";
import type { IpRule } from "@/lib/ipRules";

export default function SecurityCaseBoard({ status, ip, page, rules }: { status: string; ip: string; page: number; rules: IpRule[] }) {
  const data = querySecurityCases(status, ip, page);
  const modes = new Map(rules.map((r) => [r.ip, r.mode]));
  const href = (s: string, p = 1) => `/operator/security?${new URLSearchParams({ view: "alerts", status: s, ip, page: String(p) })}`;
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="section-title">탐지·대응</h2><p className="mt-2 text-sm text-ink-secondary">반복된 신호를 IP와 유형별로 묶었습니다. 근거를 확인하고 대응 상태를 남깁니다.</p></div><span className="text-xs text-ink-muted">{data.total}건 · {data.page}/{data.pages} 페이지</span></div>
    <div className="my-5 flex flex-wrap gap-2">{[{ key: "open", label: "확인 필요" }, ...Object.entries(CASE_STATUS).map(([key, label]) => ({ key, label })), { key: "all", label: "전체" }].map((s) => <Link key={s.key} href={href(s.key)} prefetch={false} aria-current={status === s.key ? "page" : undefined} className={`btn btn-sm ${status === s.key ? "btn-primary" : "btn-secondary"}`}>{s.label}</Link>)}</div>
    <form className="mb-5 flex flex-wrap items-end gap-3" method="get"><input type="hidden" name="view" value="alerts" /><input type="hidden" name="status" value={status} /><label className="flex flex-col gap-1 text-xs text-ink-secondary">IP 필터<input name="ip" defaultValue={ip} maxLength={45} placeholder="정확한 IP 주소" className="rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2 text-sm text-ink" /></label><button className="btn btn-secondary btn-sm">조회</button>{ip && <Link href="/operator/security?view=alerts" prefetch={false} className="btn btn-ghost btn-sm">초기화</Link>}</form>
    <div className="space-y-4">{data.cases.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] p-10 text-center"><p className="font-semibold text-ink">조건에 맞는 탐지 건이 없습니다</p><p className="mt-2 text-xs text-ink-muted">수집 상태도 함께 확인하십시오. 탐지가 없다는 것이 공격이 없다는 보장은 아닙니다.</p></div> : data.cases.map((c) => <article key={c.id} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-md bg-[var(--surface-section)] px-2 py-1 font-semibold ${c.severity === "high" ? "text-[var(--status-critical)]" : "text-ink-secondary"}`}>{c.severity === "high" ? "높음" : "주의"}</span><span className="text-ink-muted">{c.source === "ssh" ? "SSH" : c.source === "nginx" ? "nginx" : "웹 앱"} · {CASE_STATUS[c.status]}</span>{c.reopened > 0 && <span className="text-[var(--status-critical)]">재발 {c.reopened}회</span>}</div><h3 className="mt-3 text-base font-semibold text-ink">{c.title}</h3><p className="mt-2 break-all font-mono text-sm text-ink-secondary">{c.ip}</p></div><time className="text-xs tabular-nums text-ink-muted" dateTime={c.last_at}>{formatDateTime(c.last_at)}</time></div>
      <p className="mt-4 break-words rounded-xl bg-[var(--surface-section)] p-3 text-xs leading-relaxed text-ink-secondary">{c.evidence}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"><span>최근 집계창 {c.signal_count}회</span><span>발생 집계창 {c.windows}개</span><span>첫 탐지 {formatDateTime(c.first_at)}</span><span>{c.source === "ssh" ? "SSH는 웹 IP 차단 범위 밖" : modes.get(c.ip) === "deny" ? "웹 IP 차단 중" : modes.get(c.ip) === "allow" ? "웹 허용 목록" : "웹 IP 규칙 없음"}</span></div>
      <div className="mt-4 flex flex-wrap gap-2"><Link href={`/operator/security?view=events&ip=${encodeURIComponent(c.ip)}`} prefetch={false} className="btn btn-ghost btn-sm">관련 기록</Link>{c.source !== "ssh" && <Link href={`/operator/security?view=blocked&ip=${encodeURIComponent(c.ip)}`} prefetch={false} className="btn btn-ghost btn-sm">웹 IP 관리</Link>}{c.source === "ssh" && <Link href="/operator/security?view=host" prefetch={false} className="btn btn-ghost btn-sm">SSH·방화벽 점검</Link>}</div>
      <details className="mt-4 border-t border-[var(--border-hairline)] pt-3 text-xs"><summary className="cursor-pointer font-semibold text-ink-secondary">대응 상태 변경 · 이력</summary>
        <SecurityCaseActions id={c.id} status={c.status} />
        <div className="mt-4 space-y-2">{securityCaseHistory(c.id).map((h) => <p key={h.id} className="break-words text-ink-muted">{formatDateTime(h.at)} · {CASE_STATUS[h.status]} · {h.note || "메모 없음"} · {h.actor_id}</p>)}{!c.reviewed_at && <p className="text-ink-muted">아직 운영자가 검토하지 않았습니다.</p>}</div>
      </details>
    </article>)}</div>
    <nav aria-label="탐지 대응 페이지" className="mt-5 flex justify-between text-xs text-ink-muted"><span>{data.total}건 · {data.page}/{data.pages}</span><div className="flex gap-2">{data.page > 1 && <Link className="btn btn-ghost btn-sm" prefetch={false} href={href(status, data.page - 1)}>이전</Link>}{data.page < data.pages && <Link className="btn btn-ghost btn-sm" prefetch={false} href={href(status, data.page + 1)}>다음</Link>}</div></nav>
    <p className="mt-5 text-xs leading-relaxed text-ink-muted">대응 목록은 이번 기능 도입 이후 탐지부터 생성됩니다. 이전 기록은 접근 기록에서 확인합니다. 최대 30일·1,000개 유형/IP 묶음과 3,000건 대응 이력을 보관합니다. 완료·오탐 처리 후 새 집계창에서 같은 신호가 발생하면 다시 미확인으로 표시합니다. 탐지는 침해 성공 판정이 아닙니다.</p>
  </section>;
}
