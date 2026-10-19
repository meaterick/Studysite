import Link from "next/link";
import { securityCenterState } from "@/lib/securityCenter";
import { formatDateTime } from "@/lib/datetime";
import styles from "./security.module.css";

const labels = { ready: "연결됨", warning: "범위 제한", unavailable: "확인 필요", stale: "갱신 지연", disabled: "연결 안 됨" };
export default function SecuritySources({ compact = false }: { compact?: boolean }) {
  const { sources } = securityCenterState();
  return <section id={compact ? undefined : "source-health"} className={styles.panel}><div className={styles.panelHead}><h2>수집 상태</h2><span className={styles.subtle}>{compact ? "신호가 들어오는 경로" : "현재 앱 프로세스 기준"}</span></div>{sources.map(s => <Link key={s.id} href={s.href} prefetch={false} className={styles.row}><div className={styles.rowTop}><h3 className="text-xs font-semibold text-ink">{s.name}</h3><span className={[styles.pill,s.state === "ready" ? styles.stateReady : styles.stateWarning].join(" ")}><span className={styles.dot} />{labels[s.state]}</span></div><p className={styles.subtle}>{s.detail}</p>{!compact && s.at && <p className="mt-2 text-[11px] text-ink-muted">최근 확인 {formatDateTime(s.at)}</p>}</Link>)}</section>;
}
