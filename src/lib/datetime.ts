// 날짜·시각 표시는 한국 시간으로 고정하고, 숫자 조각만 받아 직접 조립한다.
// 서버(Node)와 브라우저는 시간대도, 내장 ICU 로캘 데이터도 달라("AM" 대 "오전") toLocaleString 결과가 어긋날 수 있고,
// 클라이언트 컴포넌트에서 결과가 다르면 hydration 오류가 난다.
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function kst(iso: string) {
  const p: Record<string, string> = {};
  for (const { type, value } of parts.formatToParts(new Date(iso))) p[type] = value;
  return { y: p.year, m: p.month, d: p.day, hh: p.hour.padStart(2, "0"), mm: p.minute.padStart(2, "0") };
}

/** 2026. 9. 27. 16:05 */
export function formatDateTime(iso: string) {
  const t = kst(iso);
  return `${t.y}. ${t.m}. ${t.d}. ${t.hh}:${t.mm}`;
}

/** 2026. 9. 27. */
export function formatDate(iso: string) {
  const t = kst(iso);
  return `${t.y}. ${t.m}. ${t.d}.`;
}

/** 16:05 */
export function formatTime(iso: string) {
  const t = kst(iso);
  return `${t.hh}:${t.mm}`;
}
