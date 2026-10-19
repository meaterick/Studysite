// Shared presentation and input normalization; never store bodies, cookies, tokens or query strings.
export const SECURITY_KINDS = {
  login_success: { label: "로그인 성공", severity: "info", advice: "본인과 운영자의 로그인 시각을 확인합니다." },
  login_failure: { label: "로그인 실패", severity: "warning", advice: "취소·만료로도 생깁니다. 같은 IP에서 반복되는지 확인합니다." },
  invalid_session: { label: "유효하지 않은 세션", severity: "warning", advice: "만료된 쿠키일 수 있습니다. 반복되면 쿠키 위조 시도를 확인합니다." },
  auth_required: { label: "로그인 없이 접근", severity: "info", advice: "일반 방문·만료된 로그인에서도 생깁니다." },
  forbidden: { label: "권한 없는 접근", severity: "high", advice: "운영자 화면·다른 사람의 제출물 접근 시도가 반복되는지 확인합니다." },
  rate_limited: { label: "요청 한도 초과", severity: "warning", advice: "반복 요청이나 자동화가 의심됩니다. 공유 IP의 정상 이용도 확인합니다." },
  probe: { label: "민감 경로 탐색", severity: "high", advice: "환경 파일·Git·관리 도구 탐색입니다. 해당 경로는 차단됩니다." },
  csrf_rejected: { label: "외부 출처 요청 차단", severity: "high", advice: "다른 사이트에서 보낸 변경 요청입니다. 출처 설정도 확인합니다." },
  backup_download: { label: "운영자 백업 다운로드", severity: "info", advice: "민감한 전체 DB 다운로드입니다. 승인된 운영자 작업인지 확인합니다." },
} as const;
export type SecurityKind = keyof typeof SECURITY_KINDS;
export type Severity = "info" | "warning" | "high";
export const SEVERITY_LABEL = { info: "정보", warning: "주의", high: "높음" };

export function cleanLogText(value: string | undefined | null, max = 240): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").slice(0, max);
}

export function logPath(value: string): string {
  return cleanLogText(value.split(/[?#]/, 1)[0], 240);
}

/** Heuristic signals only: a match is not proof of a compromise. */
export function isProbePath(raw: string): boolean {
  let value = logPath(raw);
  try { value = decodeURIComponent(value); } catch { /* Keep malformed input as-is. */ }
  return /(?:^|\/)(?:\.env(?:[.\/]|$)|\.git(?:\/|$)|wp-admin(?:\/|$)|wp-login\.php$|xmlrpc\.php$|phpmyadmin(?:\/|$)|vendor\/phpunit(?:\/|$)|actuator(?:\/|$)|server-status$)/i.test(value);
}
