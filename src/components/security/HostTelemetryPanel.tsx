import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import { hostTelemetry } from "@/lib/hostTelemetry";

export default function HostTelemetryPanel({ logsOnly = false }: { logsOnly?: boolean }) {
  const snapshot = hostTelemetry();
  const data = snapshot.data;
  return <section className={logsOnly ? "" : "mb-10"}>
    <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="section-title">{logsOnly ? "SSH 인증 기록" : "SSH·방화벽 실시간 점검"}</h2><span className="text-xs text-ink-muted">{data ? `${formatDateTime(data.checkedAt)} 수집` : "수집 대기"}</span></div>
    {snapshot.state !== "ready" && <p role="status" className="callout callout-warn mt-4">{snapshot.state === "stale" ? "3분 이상 갱신되지 않은 결과입니다. 수집기 실행 상태를 확인하십시오." : "서버 수집기에 연결되지 않았습니다. 운영 배포의 수집기 설치·실행·읽기 권한을 확인하십시오. 웹 탐지와 IP 차단은 계속 동작합니다."}</p>}
    {data && logsOnly && <>
      <p className="my-4 text-xs leading-relaxed text-ink-muted">1분마다 SSH journal에서 최근 15분의 인증 기록 중 최대 200건을 수집합니다. 계정명·키·로그 원문은 저장하지 않습니다. 반복 실패는 탐지·대응에 표시하며 SSH를 자동 차단하지 않습니다.</p>
      {!data.sshChecked && <p role="status" className="callout callout-warn mb-4">SSH journal을 읽지 못했습니다. 기록 없음과 구분해야 합니다.</p>}
      {data.sshTruncated && <p role="status" className="callout callout-warn mb-4">표시·읽기 한도에 도달해 일부 SSH 기록이 누락될 수 있습니다.</p>}
      <div className="space-y-2">{[...data.sshEvents].reverse().map((e) => <article key={e.id} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4"><div className="flex flex-wrap justify-between gap-2 text-xs"><span className={e.outcome === "failed" ? "font-semibold text-[var(--status-critical)]" : "font-semibold text-ink"}>{e.outcome === "failed" ? "인증 실패" : "로그인 성공"} · {e.root ? "root" : "일반 계정"} · {e.method}</span><time dateTime={e.at} className="text-ink-muted">{formatDateTime(e.at)}</time></div><Link href={`/operator/security?view=events&ip=${encodeURIComponent(e.ip)}`} prefetch={false} className="mt-2 inline-block break-all font-mono text-xs text-ink-secondary underline">{e.ip}</Link></article>)}{data.sshChecked && !data.sshEvents.length && <p className="mt-4 rounded-xl bg-[var(--surface-section)] p-5 text-sm text-ink-muted">최근 수집 범위에 해석 가능한 SSH 인증 기록이 없습니다.</p>}</div>
    </>}
    {data && !logsOnly && <div className="mt-5 space-y-4">{data.firewalls.map((f) => <div key={f.family} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5"><h3 className="text-sm font-semibold text-ink">{f.family === "ipv4" ? "IPv4" : "IPv6"} 호스트 방화벽</h3>{!f.checked ? <p className="mt-3 text-xs text-ink-muted">규칙을 읽지 못했습니다. 미점검 상태입니다.</p> : <>
      <p className="mt-2 text-xs text-ink-secondary">INPUT 기본 정책 {f.policy} · 전체 출발지 TCP 허용 포트 {f.publicTcpPorts.join(", ") || "해석된 규칙 없음"}</p>
      {f.publicTcpPorts.some((p) => p === 3000 || p === 3001) && <p className="mt-3 text-xs font-semibold text-[var(--status-critical)]">앱 포트 전체 허용 규칙이 있습니다. nginx를 통해서만 접근하도록 불필요한 허용을 검토하십시오.</p>}
      {f.publicTcpPorts.includes(22) && <p className="mt-2 text-xs text-ink-secondary">SSH가 이 체인에서 모든 출발지에 허용돼 있습니다. OCI 출발지 제한·Bastion 설정을 함께 확인하십시오.</p>}
      <h4 className="mt-4 text-xs font-semibold text-ink">수동 방화벽 IP 차단 · 웹 IP 목록과 별개</h4><div className="mt-3 space-y-2">{f.blockedIps.length ? f.blockedIps.map((b) => <div key={`${b.ip}:${b.position}`} className="rounded-lg bg-[var(--surface-section)] p-3 text-xs"><p className="break-all font-mono text-ink">{b.ip} · {b.position}번 규칙</p><p className={`mt-1 ${["unreachable", "partial"].includes(b.coverage) ? "font-semibold text-[var(--status-critical)]" : "text-ink-secondary"}`}>{b.coverage === "unreachable" ? "앞선 전체 종료 규칙 때문에 도달하지 못함" : b.coverage === "partial" ? `앞에서 허용되는 포트 있음: ${b.earlierAllowedPorts.join(", ")}` : b.coverage === "first" ? "첫 번째 IP 차단 규칙" : "상세 조건·앞선 규칙 확인 필요"}</p></div>) : <p className="text-xs text-ink-muted">해석 가능한 단일 IP DROP·REJECT 규칙이 없습니다.</p>}</div>{f.truncated && <p className="mt-3 text-xs text-[var(--status-critical)]">규칙 표시 한도에 도달했습니다.</p>}
    </>}</div>)}<p className="text-xs leading-relaxed text-ink-muted">읽기 전용 해석 결과입니다. OCI 방화벽·NAT·컨테이너·다른 체인과 사용자 체인의 동작까지 판정하지 않습니다. 방화벽 규칙을 자동 변경하지 않습니다.</p></div>}
  </section>;
}
