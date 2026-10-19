import Link from "next/link";
import type { ReactNode } from "react";
import type { SecurityCenterState } from "@/lib/securityCenter";
import { formatDateTime } from "@/lib/datetime";
import styles from "./security.module.css";

const items = [
  { key: "overview", label: "현황", path: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { key: "alerts", label: "탐지·대응", path: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1" },
  { key: "blocked", label: "IP 관리", path: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4ZM8 12h8" },
  { key: "events", label: "접근 기록", path: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" },
  { key: "host", label: "보호 점검", path: "M4 4h16v6H4zM4 14h16v6H4zM7 7h1m-1 10h1m5-10h4m-4 10h4" },
];
export default function SecurityWorkspace({ state, view, refreshHref, children }: { state: SecurityCenterState; view: string; refreshHref: string; children: ReactNode }) {
  const active = ["edge", "ssh"].includes(view) ? "events" : view;
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
    <header className={styles.header}><div><p className={styles.eyebrow}>운영자 / SECURITY</p><h1 className={styles.title}>보안 센터</h1><p className={styles.description}>이상 신호 확인부터 조치·재발 점검까지 한곳에서 관리합니다.</p></div><div className="shrink-0 text-right"><Link href={refreshHref} prefetch={false} className="btn btn-secondary btn-sm">새로고침</Link><p className="mt-2 hidden text-[10px] text-ink-muted sm:block">{formatDateTime(state.checkedAt)} 조회</p></div></header>
    <div className={styles.workspace}><aside className={styles.rail}><nav aria-label="보안 센터 메뉴" className={styles.navigation}>{items.map(item => <Link key={item.key} href={`/operator/security?view=${item.key}`} prefetch={false} aria-current={active === item.key ? "page" : undefined} className={styles.navItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={styles.navIcon}><path d={item.path} strokeLinejoin="round" strokeLinecap="round" /></svg><span>{item.label}</span>{item.key === "alerts" && state.cases.open > 0 && <span className={styles.badge}>{state.cases.open}</span>}{item.key === "blocked" && state.rules.deny > 0 && <span className={styles.badge}>{state.rules.deny}</span>}</Link>)}</nav><div className={styles.railNote}><strong className="text-ink-secondary">운영 흐름</strong><p className="mt-2">현황 확인 → 탐지 검토 → 필요한 조치 → 처리 기록</p><p className="mt-3">신호가 없다는 것과<br />수집이 중단된 것은 다릅니다.</p></div></aside>
      <section className={styles.content} aria-label="보안 센터 작업 영역">{children}<p className={styles.footer}>탐지 경고는 침해 성공 판정이 아닙니다. 웹 IP 차단, SSH, 호스트·OCI 방화벽은 서로 다른 범위입니다. 화면의 조회 시각과 각 수집 시각을 함께 확인하세요.</p></section>
    </div>
  </div>;
}
