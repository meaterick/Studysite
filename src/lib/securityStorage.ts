import "server-only";
import { get } from "./db";

export function securityStorageUsage() {
  // Fixed identifiers only; no table, SQL fragment or retention limit comes from a request.
  const tables = [
    ["security_events", "보안 기록", 10000, "30일"],
    ["security_cases", "탐지 대응", 1000, "30일"],
    ["security_case_history", "대응 이력", 3000, "부모 탐지와 함께"],
    ["security_ip_rules", "활성 IP 규칙", 500, "설정한 만료까지"],
    ["security_detection_windows", "탐지 집계창", 5000, "최근 10분 기준 정리"],
    ["security_request_limits", "로그인 요청 한도", 5000, "5분"],
    ["security_oauth_used", "로그인 재사용 방지", 5000, "10분 · 해시만"],
    ["security_host_seen", "SSH 중복 방지", 5000, "30분 · 해시만"],
  ] as const;
  return tables.map(([table, label, limit, retention]) => ({ label, limit, retention, count: get<{ n: number }>("SELECT COUNT(*) AS n FROM " + table)?.n ?? 0 }));
}
