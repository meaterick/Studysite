import Link from "next/link";
import { securityCenterState } from "@/lib/securityCenter";
import { securitySummary, querySecurityEvents, securityFilters } from "@/lib/securityEvents";
import { querySecurityCases, CASE_STATUS } from "@/lib/securityCases";
import { formatDateTime } from "@/lib/datetime";
import SecuritySources from "./SecuritySources";
import styles from "./security.module.css";

const base = "/operator/security";
export default function SecurityOverview() {
  const state = securityCenterState(), summary = securitySummary();
  const alerts = querySecurityCases("open").cases.slice(0, 4);
  const changes = querySecurityEvents(securityFilters({ group: "changes" })).events.slice(0, 3);
  const healthy = state.sources.filter(s => s.state === "ready").length;
  return <div className={styles.stack}>
    <div><p className={styles.eyebrow}>오늘의 보안 운영</p><h2 className="text-xl font-semibold tracking-tight text-ink">{state.findings.length || state.cases.open ? "확인하고 조치할 항목이 있습니다" : "새로 확인할 탐지 건이 없습니다"}</h2><p className="mt-2 text-xs leading-relaxed text-ink-muted">서버 설정 점검과 요청 탐지를 구분해서 확인하세요. 각 항목에서 바로 근거와 대응 화면으로 이동합니다.</p>
    <div className={styles.metrics}>
      <Link className={styles.metric} href={base+"?view=alerts"} prefetch={false}><span className={styles.subtle}>대응 대기</span><strong>{state.cases.open}</strong><span className={styles.subtle}>확인 중 {state.cases.investigating}건 →</span></Link>
      <Link className={styles.metric} href={base+"?view=blocked"} prefetch={false}><span className={styles.subtle}>현재 차단된 IP</span><strong>{state.rules.deny}</strong><span className={styles.subtle}>자동 {state.rules.automatic} · 수동 {state.rules.deny-state.rules.automatic} →</span></Link>
      <Link className={styles.metric} href={base+"?view=host#source-health"} prefetch={false}><span className={styles.subtle}>수집 연결</span><strong>{healthy}<span className="text-base font-normal text-ink-muted"> / 4</span></strong><span className={styles.subtle}>{healthy===4 ? "연결 상태 확인됨" : "수집 상태 점검 필요"} →</span></Link>
    </div></div>
    <div className={styles.columns}><div className={styles.stack}>
      <section className={styles.panel}><div className={styles.panelHead}><h2>서버·수집에서 확인할 일</h2><Link className={styles.subtle} href={base+"?view=host"} prefetch={false}>전체 {state.findings.length}건 →</Link></div>
        {state.findings.length ? state.findings.slice(0,3).map(f => <Link key={f.id} href={f.href} prefetch={false} className={styles.row}><div className={styles.rowTop}><span className={[styles.pill,f.severity==="high"?styles.high:styles.warning].join(" ")}>{f.severity==="high"?"우선 조치":"점검 필요"}</span><span className={styles.subtle}>{f.action} ↗</span></div><h3 className={styles.rowTitle}>{f.title}</h3><p className="mt-2 text-xs leading-relaxed text-ink-muted">{f.detail}</p></Link>) : <p className={styles.empty}>현재 수집 범위에서 확인할 설정 경고가 없습니다.<br/>전체 취약점 검사가 통과했다는 뜻은 아닙니다.</p>}
      </section>
      <section className={styles.panel}><div className={styles.panelHead}><h2>탐지 대응함</h2><Link className={styles.subtle} href={base+"?view=alerts"} prefetch={false}>전체 탐지 보기 →</Link></div>
        {alerts.length ? alerts.map(c=><Link key={c.id} href={base+"?view=alerts&case="+c.id+"#case-detail"} prefetch={false} className={styles.row}><div className={styles.rowTop}><span className={[styles.pill,c.severity==="high"?styles.high:styles.warning].join(" ")}>{c.severity==="high"?"높음":"주의"} · {CASE_STATUS[c.status]}</span><time className={styles.subtle} dateTime={c.last_at}>{formatDateTime(c.last_at)}</time></div><h3 className={styles.rowTitle}>{c.title}</h3><p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted"><span className="font-mono">{c.ip}</span><span>{c.source==="ssh"?"SSH":c.source==="nginx"?"웹 서버":"웹 앱"}{c.reopened>0?" · 재발":""} →</span></p></Link>) : <p className={styles.empty}>대응을 기다리는 탐지가 없습니다.<br/>오른쪽 수집 상태도 함께 확인하세요.</p>}
      </section>
    </div><div className={styles.stack}>
      <SecuritySources compact />
      <section className={styles.panel}><div className={styles.panelHead}><h2>최근 24시간</h2><span className={styles.subtle}>앱에 보관된 신호</span></div><dl className="space-y-4 p-5">{[{label:"탐지 경고",n:summary.detections,href:"?view=events&group=detections"},{label:"차단 IP의 거절 요청",n:summary.blocked,href:"?view=events&kind=ip_blocked"},{label:"요청 제한",n:summary.limited,href:"?view=events&kind=rate_limited"}].map(r=><div key={r.label} className="flex justify-between gap-2 text-xs"><dt className="text-ink-muted"><Link href={base+r.href} prefetch={false}>{r.label} →</Link></dt><dd className="font-semibold tabular-nums text-ink">{r.n.toLocaleString()}회</dd></div>)}</dl><p className="px-5 pb-5 text-[11px] leading-relaxed text-ink-muted">신호·경고·차단 요청은 서로 다른 집계이며 공격 횟수나 침해 확률을 뜻하지 않습니다.</p></section>
      <section className={styles.panel}><div className={styles.panelHead}><h2>최근 운영 변경</h2><Link className={styles.subtle} href={base+"?view=events&group=changes"} prefetch={false}>이력 →</Link></div>{changes.length?changes.map(e=><div className={styles.row} key={e.id}><p className="text-xs font-semibold text-ink">{e.kind==="case_reviewed"?"탐지 검토 기록":e.kind==="ip_rule_removed"?"IP 규칙 해제":e.kind==="admin_change"?"운영 설정 변경":"보안 정책·규칙 변경"}</p><p className="mt-2 text-[11px] text-ink-muted">{formatDateTime(e.last_at)}{e.ip?" · "+e.ip:""}</p></div>):<p className={styles.empty}>최근 변경 기록이 없습니다.</p>}</section>
    </div></div>
  </div>;
}
