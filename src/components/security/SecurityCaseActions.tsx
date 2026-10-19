"use client";
import { useActionState } from "react";
import { manageSecurity } from "@/lib/securityActions";
import { CASE_STATUS } from "@/lib/securityPolicy";

export default function SecurityCaseActions({ id, status }: { id: string; status: string }) {
  const [result, action, pending] = useActionState(manageSecurity, { ok: true, message: "" });
  const input = "rounded-lg border border-[var(--border-hairline)] bg-card px-3 py-2 text-sm text-ink";
  return <form action={action} className="mt-4 border-t border-[var(--border-hairline)] pt-4">
    <input type="hidden" name="operation" value="case" /><input type="hidden" name="caseId" value={id} />
    <h4 className="mb-3 text-xs font-semibold text-ink">판단과 조치 기록</h4>
    <div className="grid gap-3">
      <label className="flex flex-col gap-1 text-xs text-ink-secondary">대응 상태<select className={input} name="status" defaultValue={status}>{Object.entries(CASE_STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-secondary">판단·조치 메모<input className={`${input} min-w-0`} name="note" maxLength={300} placeholder="완료·오탐 분류 시 사유 필수" /></label>
      <button disabled={pending} className="btn btn-secondary btn-sm">대응 상태 저장</button>
    </div>
    {result.message && <p role={result.ok ? "status" : "alert"} className={`mt-3 text-xs ${result.ok ? "text-ink-secondary" : "text-[var(--status-critical)]"}`}>{result.message}</p>}
  </form>;
}
