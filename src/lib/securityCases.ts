import "server-only";
import { createHash } from "node:crypto";
import { all, get, run, tx, type Param } from "./db";
import { cleanLogText, CASE_STATUS } from "./securityPolicy";

export { CASE_STATUS } from "./securityPolicy";
export type CaseStatus = keyof typeof CASE_STATUS;
export interface SecurityCase {
  id: string; family: string; ip: string; source: string; severity: "high" | "warning"; title: string; evidence: string;
  status: CaseStatus; first_at: string; last_at: string; last_window: number; windows: number; signal_count: number;
  reopened: number; note: string; reviewed_by: string; reviewed_at: string;
}
export function pruneSecurityCases() {
  run("DELETE FROM security_cases WHERE last_at < ?", new Date(Date.now() - 30 * 86400_000).toISOString());
  run("DELETE FROM security_request_limits WHERE expires_at <= ?", Date.now());
  run("DELETE FROM security_oauth_used WHERE expires_at <= ?", Date.now());
  run("DELETE FROM security_host_seen WHERE at < ?", new Date(Date.now() - 30 * 60_000).toISOString());
}
export function raiseSecurityCase(input: { family: string; ip: string; source: string; severity: "high" | "warning"; title: string; evidence: string; count: number; window: number }) {
  const id = createHash("sha256").update(`${input.family}|${input.ip}`).digest("hex").slice(0, 24);
  const now = new Date().toISOString();
  run(`INSERT INTO security_cases (id, family, ip, source, severity, title, evidence, first_at, last_at, last_window, signal_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(family, ip) DO UPDATE SET severity = excluded.severity, evidence = excluded.evidence, last_at = excluded.last_at,
    signal_count = excluded.signal_count,
    windows = windows + CASE WHEN excluded.last_window > last_window THEN 1 ELSE 0 END,
    reopened = reopened + CASE WHEN excluded.last_window > last_window AND status IN ('resolved', 'dismissed') THEN 1 ELSE 0 END,
    status = CASE WHEN excluded.last_window > last_window AND status IN ('resolved', 'dismissed') THEN 'new' ELSE status END,
    last_window = MAX(last_window, excluded.last_window)`, id, input.family, input.ip, input.source, input.severity,
    input.title, cleanLogText(input.evidence, 500), now, now, input.window, input.count);
  run("DELETE FROM security_cases WHERE id IN (SELECT id FROM security_cases ORDER BY last_at DESC, id DESC LIMIT -1 OFFSET 1000)");
}
export function securityCaseSummary() {
  return get<{ open: number; high: number; investigating: number; reopened: number }>(`SELECT
    COUNT(CASE WHEN status IN ('new','investigating') THEN 1 END) AS open,
    COUNT(CASE WHEN status IN ('new','investigating') AND severity = 'high' THEN 1 END) AS high,
    COUNT(CASE WHEN status = 'investigating' THEN 1 END) AS investigating,
    COUNT(CASE WHEN status IN ('new','investigating') AND reopened > 0 THEN 1 END) AS reopened FROM security_cases`)!;
}
export function querySecurityCases(status = "open", ip = "", requestedPage = 1) {
  const clauses: string[] = [], params: Param[] = [];
  if (status === "open") clauses.push("status IN ('new','investigating')");
  else if (Object.hasOwn(CASE_STATUS, status)) { clauses.push("status = ?"); params.push(status); }
  if (ip) { clauses.push("ip = ?"); params.push(ip.slice(0, 45)); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM security_cases ${where}`, ...params)?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(pages, Math.max(1, requestedPage));
  const cases = all<SecurityCase>(`SELECT * FROM security_cases ${where} ORDER BY CASE WHEN status IN ('new','investigating') THEN 0 ELSE 1 END,
    CASE WHEN severity = 'high' THEN 0 ELSE 1 END, last_at DESC LIMIT 20 OFFSET ?`, ...params, (page - 1) * 20).map((c) => ({ ...c }));
  return { cases, total, page, pages };
}
export function reviewSecurityCase(id: string, status: string, note: string, actorId: string): boolean {
  if (!Object.hasOwn(CASE_STATUS, status)) throw new Error("INVALID_CASE_STATUS");
  const cleaned = cleanLogText(note, 300).trim();
  if (["resolved", "dismissed"].includes(status) && !cleaned) throw new Error("CASE_NOTE_REQUIRED");
  return tx(() => {
    const found = get<SecurityCase>("SELECT * FROM security_cases WHERE id = ?", id);
    if (!found) return false;
    const now = new Date().toISOString();
    run("UPDATE security_cases SET status = ?, note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?", status, cleaned, actorId, now, id);
    run("INSERT INTO security_case_history (case_id,status,note,actor_id,at) VALUES (?,?,?,?,?)", id, status, cleaned, actorId, now);
    return true;
  });
}
export function securityCaseHistory(id: string) {
  return all<{ id: number; status: CaseStatus; note: string; actor_id: string; at: string }>("SELECT * FROM security_case_history WHERE case_id = ? ORDER BY id DESC LIMIT 10", id);
}
