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
  scan_detected: { label: "반복 경로 탐색 감지", severity: "high", advice: "여러 경로를 반복 탐색했습니다. 탐지 근거와 IP 차단 상태를 확인합니다." },
  auth_attack_detected: { label: "반복 인증·권한 실패 감지", severity: "warning", advice: "만료·취소·공유 IP의 정상 이용도 확인한 뒤 수동 차단을 판단합니다." },
  traffic_detected: { label: "반복 요청 제한 감지", severity: "warning", advice: "nginx 제한에 반복 도달했습니다. 정상 이용과 자동화 여부를 확인합니다." },
  ip_banned: { label: "IP 차단 설정", severity: "info", advice: "운영자 또는 탐지 정책이 IP를 차단했습니다. 사유와 만료 시각을 확인합니다." },
  ip_allowed: { label: "IP 허용 설정", severity: "info", advice: "허용 목록에 있는 IP는 자동·수동 차단 대신 기록만 남깁니다." },
  ip_rule_removed: { label: "IP 규칙 해제", severity: "info", advice: "운영자가 차단 또는 허용 규칙을 해제했습니다." },
  ip_blocked: { label: "차단 IP 요청 거절", severity: "info", advice: "활성 IP 차단 규칙으로 요청을 거절했습니다. 만료 시간은 연장되지 않습니다." },
  security_policy_changed: { label: "자동 차단 정책 변경", severity: "info", advice: "자동 차단 설정을 변경했습니다. 이미 적용된 차단은 해제하거나 만료를 기다립니다." },
  request_rejected: { label: "비허용 HTTP 메서드", severity: "warning", advice: "서비스에서 사용하지 않는 메서드를 거절했습니다. 반복되는 IP인지 확인합니다." },
  auth_rate_limited: { label: "로그인 요청 제한", severity: "warning", advice: "같은 IP의 로그인 요청이 한도를 넘었습니다. 공유 IP의 정상 로그인도 확인합니다." },
  oauth_replayed: { label: "로그인 응답 재사용 거절", severity: "warning", advice: "이미 처리한 로그인 상태가 재사용됐습니다. 새 로그인으로 다시 시작할 수 있습니다." },
  ssh_failure: { label: "SSH 인증 실패", severity: "warning", advice: "서버 SSH 인증 실패입니다. 웹 IP 차단은 SSH에 적용되지 않습니다." },
  ssh_login: { label: "SSH 로그인 성공", severity: "info", advice: "승인된 서버 관리 접속인지 시각과 출발지 IP를 확인합니다." },
  ssh_root_login: { label: "root SSH 로그인", severity: "warning", advice: "root 접속이 발생했습니다. 본인의 관리 작업인지 확인합니다. 침해 성공을 자동 판정하지 않습니다." },
  ssh_attack_detected: { label: "반복 SSH 인증 실패 감지", severity: "high", advice: "SSH 인증 실패가 반복됐습니다. OCI·호스트 방화벽과 SSH 접근 제한을 확인합니다. 웹 IP 차단과 별개입니다." },
  request_attack_detected: { label: "반복 비정상 요청 감지", severity: "warning", advice: "출처 검증 실패·비허용 메서드·로그인 제한이 반복됐습니다. 근거를 확인한 뒤 대응합니다." },
  case_reviewed: { label: "탐지 대응 상태 변경", severity: "info", advice: "운영자가 탐지 건의 확인·처리 상태를 변경했습니다." },
  admin_change: { label: "운영 설정 변경", severity: "info", advice: "운영자의 설정 변경입니다. 승인된 작업인지 확인합니다." },
  backup_download: { label: "운영자 백업 다운로드", severity: "info", advice: "민감한 전체 DB 다운로드입니다. 승인된 운영자 작업인지 확인합니다." },
} as const;
export const CASE_STATUS = { new: "미확인", investigating: "확인 중", resolved: "처리 완료", dismissed: "정상·오탐" } as const;
export type SecurityKind = keyof typeof SECURITY_KINDS;
export type Severity = "info" | "warning" | "high";
export const SEVERITY_LABEL = { info: "정보", warning: "주의", high: "높음" };

export function cleanLogText(value: string | undefined | null, max = 240): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").slice(0, max);
}

export function logPath(value: string): string {
  return cleanLogText(value.split(/[?#]/, 1)[0], 240);
}

export type PathSignal = { category: "traversal" | "private_file" | "admin_probe"; reason: string };

/** Bounded decoding of path ONLY. Never inspect learner code, bodies or query values. */
export function inspectRequestPath(raw: string): PathSignal | null {
  let value = raw.split(/[?#]/, 1)[0].slice(0, 4096);
  for (let i = 0; i <= 3; i++) {
    const normalized = value.replace(/\\/g, "/");
    if (/(?:^|\/)\.\.(?:\/|$)/.test(normalized) || /[\u0000-\u001f\u007f]/.test(value)) return { category: "traversal", reason: "상위 디렉터리 이동 또는 제어문자 경로" };
    if (/(?:^|\/)(?:\.env(?:[.\/]|$)|\.(?:git|svn|hg|ssh|aws)(?:\/|$)|\.(?:npmrc|pypirc|netrc|htpasswd)(?:$|\.)|(?:id_rsa|id_ed25519)(?:$|\.)|(?:aegis|database|sqlite)\.(?:db|sqlite3?)(?:$|[.-])|(?:dump|backup)\.sql(?:$|[.-]))/i.test(normalized)) return { category: "private_file", reason: "환경·저장소·인증키·DB 파일 탐색" };
    if (/(?:^|\/)(?:wp-admin(?:\/|$)|wp-login\.php$|xmlrpc\.php$|phpmyadmin(?:\/|$)|vendor\/phpunit(?:\/|$)|actuator(?:\/|$)|server-status$|cgi-bin(?:\/|$)|boaform(?:\/|$)|HNAP1(?:\/|$))/i.test(normalized)) return { category: "admin_probe", reason: "이 서비스에 없는 관리 도구 탐색" };
    if (i === 3) break;
    try { const decoded = decodeURIComponent(value); if (decoded === value) break; value = decoded; } catch { break; }
  }
  return null;
}
export function isProbePath(raw: string): boolean { return inspectRequestPath(raw) !== null; }
