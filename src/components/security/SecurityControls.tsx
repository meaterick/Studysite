"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { manageSecurity } from "@/lib/securityActions";
import type { IpRule } from "@/lib/ipRules";
import { formatDateTime } from "@/lib/datetime";

const input = "w-full rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2.5 text-sm text-ink";
function remaining(expires: string | null, now: number) {
  if (!expires) return "만료 없음";
  const minutes = Math.max(0, Math.ceil((Date.parse(expires) - now) / 60_000));
  return minutes >= 1440 ? `${Math.floor(minutes / 1440)}일 ${Math.floor(minutes % 1440 / 60)}시간 남음`
    : minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음` : `${minutes}분 남음`;
}

export default function SecurityControls({ rules, ownIp, initialIp, autoBan, enforcement, activity, now }: {
  rules: IpRule[]; ownIp: string; initialIp: string; autoBan: boolean; enforcement: boolean;
  activity: Record<string, { count: number; lastAt: string }>; now: number;
}) {
  const [result, action, pending] = useActionState(manageSecurity, { ok: true, message: "" });
  const [filter, setFilter] = useState(initialIp);
  const [mode, setMode] = useState("deny");
  const [source, setSource] = useState("");
  const [requestedPage, setPage] = useState(1);
  const filtered = rules.filter((r) => (!mode || r.mode === mode) && (!source || r.source === source) && r.ip.includes(filter.trim()));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const page = Math.min(requestedPage, pages);
  const denied = rules.filter((r) => r.mode === "deny").length;
  const modes = [{ key: "deny", label: "차단 중", count: denied }, { key: "allow", label: "허용 목록", count: rules.length - denied }, { key: "", label: "전체 규칙", count: rules.length }];
  return (
    <section aria-labelledby="ip-rule-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="ip-rule-title" className="section-title">차단 IP 관리</h2><p className="mt-2 text-sm text-ink-secondary">현재 차단과 허용 목록을 확인하고 즉시 해제합니다.</p></div>
        <span className="rounded-full bg-[var(--surface-card-2)] px-3 py-2 text-xs text-ink-secondary">현재 IP {ownIp || "확인 불가"}</span>
      </div>
      {!enforcement && <p role="status" className="callout callout-warn mb-4">복구 모드 · IP 차단 적용이 중지되어 있습니다. 저장된 규칙은 유지됩니다.</p>}
      {!ownIp && <p role="status" className="callout callout-warn mb-4">현재 IP를 확인할 수 없습니다. 본인 IP를 확인하기 전에는 수동 차단을 저장할 수 없습니다.</p>}
      {result.message && <p role={result.ok ? "status" : "alert"} aria-live="polite" className={`mb-4 rounded-xl border border-[var(--border-hairline)] p-4 text-sm ${result.ok ? "text-ink" : "text-[var(--status-critical)]"}`}>{result.message}</p>}
      <div className="mb-6 rounded-2xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
        <div role="group" aria-label="IP 규칙 보기" className="flex flex-wrap gap-2">
          {modes.map((m) => <button key={m.key} type="button" aria-pressed={mode === m.key} onClick={() => { setMode(m.key); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === m.key ? "bg-ink text-[var(--surface-card)]" : "bg-[var(--surface-card-2)] text-ink-secondary"}`}>{m.label} <span className="ml-2 tabular-nums">{m.count}</span></button>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <label className="text-xs text-ink-secondary">IP 검색<input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} maxLength={45} placeholder="IP 주소 일부 입력" className={`mt-1 ${input}`} /></label>
          <label className="text-xs text-ink-secondary">설정 방식<select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={`mt-1 ${input}`}><option value="">자동·수동 전체</option><option value="auto">자동 탐지</option><option value="manual">운영자 수동</option></select></label>
          <span aria-live="polite" className="py-2 text-xs text-ink-muted">{filtered.length}개 · {page}/{pages} 페이지</span>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] px-5 py-12 text-center"><p className="font-semibold text-ink">{mode === "deny" && !filter && !source ? "현재 차단된 IP가 없습니다" : "조건에 맞는 활성 규칙이 없습니다"}</p><p className="mt-2 text-sm text-ink-muted">만료·해제된 규칙은 아래 변경 이력에서 확인할 수 있습니다.</p></div> : filtered.slice((page - 1) * 10, page * 10).map((r) => <article key={r.ip} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${r.mode === "deny" ? "bg-[var(--surface-card-2)] text-[var(--status-critical)]" : "bg-[var(--surface-card-2)] text-ink-secondary"}`}>{r.mode === "deny" ? "차단 중" : "허용 중"}</span><span className="text-xs text-ink-muted">{r.source === "auto" ? "자동 탐지" : "운영자 수동"}</span></div><p className="mt-3 break-all font-mono text-base font-semibold text-ink">{r.ip}</p><p className="mt-2 break-words text-sm text-ink-secondary">{r.reason}</p></div>
            <div className="flex items-center gap-2"><Link href={`/operator/security?view=events&ip=${encodeURIComponent(r.ip)}`} prefetch={false} className="btn btn-ghost btn-sm">기록 보기</Link><form action={action}><input type="hidden" name="operation" value="remove" /><input type="hidden" name="ip" value={r.ip} /><button disabled={pending} className="btn btn-secondary btn-sm" aria-label={`${r.ip} ${r.mode === "deny" ? "차단 해제" : "허용 해제"}`}>{r.mode === "deny" ? "차단 해제" : "허용 해제"}</button></form></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border-hairline)] pt-4 text-xs lg:grid-cols-4">
            <div><dt className="text-ink-muted">만료까지 · 조회 시점</dt><dd className="mt-1 font-semibold text-ink">{remaining(r.expires_at, now)}</dd><dd className="mt-1 text-ink-muted">{r.expires_at ? formatDateTime(r.expires_at) : "—"}</dd></div>
            <div><dt className="text-ink-muted">설정 시각 (한국)</dt><dd className="mt-1 text-ink-secondary">{formatDateTime(r.created_at)}</dd></div>
            <div><dt className="text-ink-muted">거절한 요청 · 24시간</dt><dd className="mt-1 font-semibold tabular-nums text-ink">{(activity[r.ip]?.count ?? 0).toLocaleString()}회</dd></div>
            <div><dt className="text-ink-muted">마지막 거절 (한국)</dt><dd className="mt-1 text-ink-secondary">{activity[r.ip] ? formatDateTime(activity[r.ip].lastAt) : "기록 없음"}</dd></div>
          </dl>
        </article>)}
      </div>
      {pages > 1 && <nav aria-label="활성 IP 규칙 페이지" className="mt-4 flex items-center justify-between text-sm"><span className="text-ink-muted">{page} / {pages}</span><div className="flex gap-2"><button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button><button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)}>다음</button></div></nav>}
      <details open={!!initialIp} className="mt-8 rounded-2xl border border-[var(--border-hairline)] bg-card p-5">
        <summary className="cursor-pointer font-semibold text-ink">IP 직접 차단·허용 등록</summary>
        <p className="mt-3 text-xs leading-relaxed text-ink-secondary">공인 IP 하나에 적용합니다. 공유 IP 이용자도 영향을 받습니다. 본인 IP는 차단할 수 없고, 허용 목록과 현재 관리자 세션은 차단에서 제외됩니다. 기존 규칙이 있으면 새 설정으로 교체합니다.</p>
        <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-secondary">IP 주소<input key={initialIp} name="ip" defaultValue={initialIp} required maxLength={45} placeholder="IPv4 또는 IPv6" className={`mt-1 ${input}`} /></label>
          <label className="text-xs text-ink-secondary">유지 기간<select name="minutes" defaultValue="1440" className={`mt-1 ${input}`}><option value="15">15분</option><option value="60">1시간</option><option value="1440">24시간</option><option value="10080">7일</option><option value="43200">30일</option></select></label>
          <label className="text-xs text-ink-secondary sm:col-span-2">사유<input name="reason" required maxLength={200} placeholder="예: 환경 파일을 반복 탐색함" className={`mt-1 ${input}`} /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2"><button name="operation" value="deny" disabled={pending || !ownIp} className="btn btn-primary btn-sm">IP 차단</button><button name="operation" value="allow" disabled={pending} className="btn btn-secondary btn-sm">허용 목록에 등록</button></div>
        </form>
      </details>
      <details id="auto-policy" className="mt-3 rounded-2xl border border-[var(--border-hairline)] p-5">
        <summary className="cursor-pointer font-semibold text-ink">자동 차단 정책 <span className="ml-2 text-xs font-normal text-ink-muted">{autoBan ? "사용 중" : "중지됨"} · 활성 규칙 {rules.length}/500</span></summary>
        <p className="mt-4 text-sm leading-relaxed text-ink-secondary">5분 안에 민감 경로 3곳을 10회 이상 탐색하거나 30회 이상 반복 탐색하면 15분 차단합니다. 반복 인증 실패·출처 검증 실패·비허용 메서드·일반 404·요청 제한은 경고만 생성합니다.</p>
        <p className="mt-2 text-xs text-ink-muted">중지해도 기존 차단은 만료까지 유지됩니다. 웹 IP 차단은 SSH·DNS·서버 포트 스캔을 막지 않습니다.</p>
        <form action={action} className="mt-4"><input type="hidden" name="operation" value="policy" /><input type="hidden" name="enabled" value={autoBan ? "0" : "1"} /><button disabled={pending} className="btn btn-secondary btn-sm">{autoBan ? "새 자동 차단 중지" : "자동 차단 사용"}</button></form>
      </details>
    </section>
  );
}
