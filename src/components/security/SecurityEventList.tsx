import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import type { SecurityEvent } from "@/lib/securityEvents";
import { SECURITY_KINDS, SEVERITY_LABEL } from "@/lib/securityPolicy";

export default function SecurityEventList({ events, ruleModes }: { events: SecurityEvent[]; ruleModes: Map<string, string> }) {
  return <div className="space-y-3">{events.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] px-5 py-12 text-center text-sm text-ink-muted">조건에 맞는 보안 기록이 없습니다. 배포 이전 요청은 소급 수집하지 않습니다.</div> : events.map((e) => <article key={e.id} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md bg-[var(--surface-section)] px-2 py-1 text-xs font-semibold ${e.severity === "high" ? "text-[var(--status-critical)]" : "text-ink-secondary"}`}>{SEVERITY_LABEL[e.severity]}</span><h3 className="text-sm font-semibold text-ink">{SECURITY_KINDS[e.kind]?.label ?? e.kind}</h3><span className="text-xs tabular-nums text-ink-muted">{e.count.toLocaleString()}회{e.status ? ` · HTTP ${e.status}` : ""}</span></div>
        <p className="mt-3 break-all font-mono text-xs text-ink-secondary">{e.ip ? <Link href={`/operator/security?view=events&ip=${encodeURIComponent(e.ip)}`} prefetch={false} className="underline underline-offset-4">{e.ip}</Link> : "IP 정보 없음"}<span className="ml-3 text-ink-muted">{e.ip && ruleModes.get(e.ip) === "deny" ? "차단 중" : e.ip && ruleModes.get(e.ip) === "allow" ? "허용 중" : ""}</span></p>
        {(e.path || e.method) && <p className="mt-2 break-all font-mono text-xs text-ink-muted">{e.method} {e.path || "서버 액션"}</p>}
      </div>
      <time dateTime={e.last_at} className="text-xs tabular-nums text-ink-muted">{formatDateTime(e.last_at)}</time>
    </div>
    <details className="mt-4 border-t border-[var(--border-hairline)] pt-3"><summary className="cursor-pointer text-xs text-ink-secondary">탐지 근거·대응 보기</summary><div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-secondary"><p>{SECURITY_KINDS[e.kind]?.advice}</p>{e.detail && <p className="break-words rounded-lg bg-[var(--surface-section)] p-3">{e.detail}</p>}<p className="text-ink-muted">첫 발생 {formatDateTime(e.first_at)} · 마지막 발생 {formatDateTime(e.last_at)}{e.user_id ? ` · 계정 ID ${e.user_id}` : ""}</p>{e.ip && <Link href={`/operator/security?view=blocked&ip=${encodeURIComponent(e.ip)}`} prefetch={false} className="btn btn-secondary btn-sm">이 IP 관리·변경 이력</Link>}</div></details>
  </article>)}</div>;
}
