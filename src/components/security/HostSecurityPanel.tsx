import { hostSecuritySnapshot } from "@/lib/hostSecurity";
import { formatDateTime } from "@/lib/datetime";

export default function HostSecurityPanel() {
  const data = hostSecuritySnapshot();
  // eslint-disable-next-line react-hooks/purity -- A server-only deployment snapshot is compared with this request time.
  const requestTime = Date.now();
  if (!data) return <section><h2 className="section-title">서버 보안 점검</h2><p className="callout callout-warn mt-4">서버 점검 결과가 아직 없습니다. 다음 운영 배포가 완료되면 포트·SSH 설정·배포 계정 권한을 표시합니다.</p></section>;
  const dns = data.listeners.filter((r) => r.port === 53 && r.scope !== "loopback");
  const appExposed = data.listeners.some((r) => [3000, 3001].includes(r.port) && r.scope !== "loopback");
  const privileged = data.runnerIsRoot || data.runnerPasswordlessSudoAll === true;
  const notices = [
    { title: "DNS · 53번", value: !data.tcpChecked || !data.udpChecked ? "확인 일부 누락" : dns.length ? "외부 인터페이스 대기 중" : "외부 인터페이스 리스너 없음", detail: dns.length ? "필요한 DNS인지 확인하고, 불필요하면 TCP·UDP 53 접근을 방화벽에서 닫으십시오." : "외부 Nmap에서 53번이 열렸다면 OCI 경로·다른 장비·다른 시점의 설정을 대조하십시오.", warn: dns.length > 0 },
    { title: "배포 계정 권한", value: privileged ? "서버 전체 권한으로 확대 가능" : data.runnerPasswordlessSudoAll === null ? "sudo 범위 확인 필요" : "전체 무암호 sudo 미발견", detail: "앱과 배포 러너가 같은 계정입니다. 앱 코드 실행 침해가 러너·배포 파일로 이어질 수 있습니다. 계정과 실행 환경을 분리하십시오.", warn: privileged },
    { title: "앱 포트 · 3000/3001", value: !data.tcpChecked ? "확인 실패" : appExposed ? "외부 인터페이스 대기 중" : "외부 인터페이스 리스너 미발견", detail: "앱 포트는 루프백에만 바인딩하고 외부 요청은 nginx를 통과시킵니다. 실제 외부 접근 가능 여부는 방화벽도 함께 확인해야 합니다.", warn: appExposed },
  ];
  return <section><h2 className="section-title">서버 보안 점검</h2><p className="mt-2 text-sm text-ink-secondary">마지막 배포 점검 {formatDateTime(data.checkedAt)} · {data.os.NAME} {data.os.VERSION_ID} · 커널 {data.kernel}</p>
    {requestTime - Date.parse(data.checkedAt) > 86400_000 && <p role="status" className="callout callout-warn mt-4">24시간 이상 지난 결과입니다. 배포 이후 설정 변경은 반영되지 않았을 수 있습니다.</p>}
    <div className="my-6 grid gap-4 lg:grid-cols-3">{notices.map((n) => <div key={n.title} className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5"><p className="text-xs text-ink-muted">{n.title}</p><p className={`mt-3 text-base font-semibold ${n.warn ? "text-[var(--status-critical)]" : "text-ink"}`}>{n.value}</p><p className="mt-3 text-xs leading-relaxed text-ink-secondary">{n.detail}</p></div>)}</div>
    <p className="mb-6 text-xs leading-relaxed text-ink-muted">서버 내부 설정을 읽은 배포 시점의 결과이며 외부 포트 스캔이 아닙니다. 루프백 이외의 리스너가 곧 인터넷에 공개됐다는 뜻은 아닙니다. 이 서버의 파일은 서버 침해 시 변조될 수 있습니다.</p>
    <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-[var(--border-hairline)] p-5"><h3 className="text-base font-semibold text-ink">SSH 전역 설정</h3><p className="mt-2 text-xs text-ink-muted">접속 조건별 Match 설정은 별도 확인이 필요합니다.</p>{!data.sshChecked ? <p className="mt-4 text-sm text-ink-secondary">설정 읽기 실패 · 서버 권한을 확인하십시오.</p> : <dl className="mt-4 space-y-3">{Object.entries(data.ssh).map(([key, value]) => <div key={key} className="flex flex-wrap justify-between gap-2 text-xs"><dt className="font-mono text-ink-muted">{key}</dt><dd className={(["passwordauthentication", "kbdinteractiveauthentication"].includes(key) && value === "yes") || (key === "permitrootlogin" && value === "yes") ? "font-semibold text-[var(--status-critical)]" : "text-ink"}>{value}</dd></div>)}</dl>}</div>
      <div className="rounded-2xl border border-[var(--border-hairline)] p-5"><h3 className="text-base font-semibold text-ink">설치 패키지</h3><p className="mt-2 text-xs text-ink-muted">전체 배포판 버전을 보안 공지와 비교해야 합니다.</p><dl className="mt-4 space-y-4">{Object.entries(data.packages).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold text-ink">{key}</dt><dd className="mt-1 break-all font-mono text-xs text-ink-secondary">{value}</dd></div>)}</dl></div></div>
    <h3 className="mb-3 mt-8 text-base font-semibold text-ink">대기 중인 포트</h3><p className="mb-3 text-xs text-ink-muted">TCP {data.tcpChecked ? "확인" : "읽기 실패"} · UDP {data.udpChecked ? "확인" : "읽기 실패"} · 프로세스가 unknown이면 실행 권한으로 이름을 확인하지 못한 상태입니다.</p>
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]"><table className="data-table"><thead><tr><th>포트</th><th>프로토콜</th><th>대기 범위</th><th>프로세스</th></tr></thead><tbody>{data.listeners.length ? data.listeners.map((r, i) => <tr key={i}><td className="font-mono text-sm">{r.port}</td><td className="text-xs uppercase">{r.protocol}</td><td className="text-xs">{r.scope === "loopback" ? "이 서버 내부" : r.scope === "all" ? "모든 인터페이스" : "특정 인터페이스"}</td><td className="break-all font-mono text-xs">{r.process}</td></tr>) : <tr><td colSpan={4}>표시할 리스너가 없습니다.</td></tr>}</tbody></table></div>
    <p className="mt-5 text-xs leading-relaxed text-ink-muted">웹 보안 기록에는 SSH·DNS 공격, OCI 방화벽 거절, TCP 포트 스캔이 수집되지 않습니다. 서버 인증 로그와 OCI VCN Flow Logs를 함께 확인하십시오.</p>
  </section>;
}
