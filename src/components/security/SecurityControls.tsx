"use client";

import { useActionState, useState } from "react";
import { manageSecurity } from "@/lib/securityActions";
import type { IpRule } from "@/lib/ipRules";
import { formatDateTime } from "@/lib/datetime";

export default function SecurityControls({ rules, ownIp, initialIp, autoBan, enforcement }: {
  rules: IpRule[]; ownIp: string; initialIp: string; autoBan: boolean; enforcement: boolean;
}) {
  const [result, action, pending] = useActionState(manageSecurity, { ok: true, message: "" });
  const [filter, setFilter] = useState("");
  const filtered = rules.filter((r) => r.ip.includes(filter.trim()));
  const input = "rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2 text-sm text-ink";
  return (
    <section id="ip-rules" className="mb-12 scroll-mt-6" aria-labelledby="ip-rule-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="ip-rule-title" className="section-title">IP 차단·허용 관리</h2>
        <span className="text-sm text-ink-secondary">활성 규칙 {rules.length} / 500개 · 현재 IP {ownIp || "확인 불가"}</span>
      </div>
      {!enforcement && <p role="status" className="callout callout-warn mb-4">복구 모드로 IP 차단 적용이 중지되어 있습니다. 기록과 규칙은 유지됩니다.</p>}
      {!ownIp && <p role="status" className="callout callout-warn mb-4">신뢰할 프록시 IP를 확인할 수 없습니다. 본인 IP를 확인하기 전에는 수동 차단을 저장할 수 없으며 IP 탐지·차단도 동작하지 않을 수 있습니다.</p>}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">
        <p className="text-sm leading-relaxed text-ink-secondary">공인 IP 하나에 적용합니다. 학교·기숙사 등 같은 IP를 쓰는 이용자도 영향을 받으므로 사유와 기간을 확인해 주십시오. 본인 IP는 차단할 수 없고, 허용 목록과 현재 DB 관리자 세션은 차단에서 제외됩니다.</p>
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-ink-secondary">IP 주소<input key={initialIp} name="ip" defaultValue={initialIp} required maxLength={45} placeholder="203.0.113.10 또는 IPv6" className={input} /></label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">유지 기간<select name="minutes" defaultValue="1440" className={input}><option value="15">15분</option><option value="60">1시간</option><option value="1440">24시간</option><option value="10080">7일</option><option value="43200">30일</option></select></label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-secondary">사유<input name="reason" required maxLength={200} placeholder="예: 반복적인 환경 파일 탐색" className={`${input} min-w-0`} /></label>
          <button name="operation" value="deny" disabled={pending || !ownIp} className="btn btn-primary btn-sm">IP 차단</button>
          <button name="operation" value="allow" disabled={pending} className="btn btn-secondary btn-sm">허용 목록에 등록</button>
        </form>
        <div className="mt-6 border-t border-[var(--border-hairline)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">새 자동 차단: {autoBan ? "사용 중" : "중지됨"}</p><form action={action}><input type="hidden" name="operation" value="policy" /><input type="hidden" name="enabled" value={autoBan ? "0" : "1"} /><button disabled={pending} className="btn btn-ghost btn-sm">{autoBan ? "새 자동 차단 중지" : "자동 차단 사용"}</button></form></div>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">민감 경로를 5분 집계창 안에 3곳 이상·10회 이상 탐색하거나 같은 경로를 포함해 30회 이상 탐색하면 15분 차단합니다. 로그인·권한 실패 20회, 다양한 404 경로 10곳·20회, nginx 제한 60회는 경고만 생성합니다. 정책을 중지해도 이미 적용된 차단의 만료 시각은 유지됩니다.</p>
        </div>
        {result.message && <p role={result.ok ? "status" : "alert"} aria-live="polite" className={`mt-4 text-sm ${result.ok ? "text-ink-secondary" : "text-[var(--status-critical)]"}`}>{result.message}</p>}
      </div>
      <label className="my-4 flex flex-wrap items-center gap-3 text-xs text-ink-secondary">활성 규칙 검색<input value={filter} onChange={(e) => setFilter(e.target.value)} maxLength={45} placeholder="IP 주소 일부" className={input} /><span>{filtered.length}개 중 최대 50개 표시 · 만료된 규칙은 즉시 적용에서 제외</span></label>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]"><table className="data-table"><thead><tr>{["IP", "규칙 / 설정", "사유", "만료 (한국)", "해제"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan={5} className="text-ink-muted">표시할 활성 IP 규칙이 없습니다.</td></tr> : filtered.slice(0, 50).map((r) => <tr key={r.ip}>
          <td className="max-w-60 break-all font-mono text-xs">{r.ip}</td><td className="whitespace-nowrap text-sm">{r.mode === "deny" ? "차단" : "허용"}<br /><span className="text-xs text-ink-muted">{r.source === "auto" ? "자동" : "수동"}</span></td>
          <td className="min-w-48 max-w-80 break-words text-xs text-ink-secondary">{r.reason}</td><td className="whitespace-nowrap text-xs tabular-nums">{r.expires_at ? formatDateTime(r.expires_at) : "—"}</td>
          <td><form action={action}><input type="hidden" name="operation" value="remove" /><input type="hidden" name="ip" value={r.ip} /><button disabled={pending} className="btn btn-ghost btn-sm">해제</button></form></td>
        </tr>)}
      </tbody></table></div>
    </section>
  );
}
