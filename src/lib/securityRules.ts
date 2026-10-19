// One policy definition for the detector and the operator's rule reference.
export const DETECTION_RULES = {
  probe: { label: "민감 경로 탐색", hits: 10, paths: 3, repeat: 30, source: "app", automatic: true },
  auth: { label: "로그인·세션 실패", hits: 20, paths: 0, repeat: 0, source: "app", automatic: false },
  access: { label: "권한 없는 접근", hits: 20, paths: 0, repeat: 0, source: "app", automatic: false },
  not_found: { label: "서로 다른 주소의 404 응답", hits: 20, paths: 10, repeat: 0, source: "nginx", automatic: false },
  edge_rate: { label: "nginx 요청 제한", hits: 60, paths: 0, repeat: 0, source: "nginx", automatic: false },
  csrf: { label: "외부 출처 요청 거절", hits: 10, paths: 0, repeat: 0, source: "app", automatic: false },
  method: { label: "비허용 HTTP 메서드", hits: 10, paths: 0, repeat: 0, source: "app", automatic: false },
  auth_rate: { label: "로그인 요청 제한", hits: 20, paths: 0, repeat: 0, source: "app", automatic: false },
  ssh_auth: { label: "SSH 인증 실패", hits: 10, paths: 0, repeat: 0, source: "ssh", automatic: false },
} as const;
export type SignalFamily = keyof typeof DETECTION_RULES;
export function detectionThreshold(family: SignalFamily) {
  const r = DETECTION_RULES[family];
  return `5분 내 ${r.hits}회${r.paths ? `·${r.paths}개 경로` : ""}${r.repeat ? ` 또는 반복 ${r.repeat}회` : ""}`;
}
