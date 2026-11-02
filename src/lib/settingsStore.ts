import "server-only";
import { get, run } from "./db";

// 운영 설정(settings 테이블의 'site' 행, JSON). 운영자 화면(/operator/settings)에서 바꾼다.
// - progressionMode: 레슨 진행 방식. "warn"(기본) = 순서는 안내만 하고 미완료 경고를 보여 준다.
//   "lock" = 모듈 안에서 앞 핵심 레슨을 끝내야 다음 핵심 레슨이 열린다.
// - dueDates: 과제 저장 키 → 마감일(YYYY-MM-DD, 한국 시간 그날 23:59까지).
// - cohortStart: 기수 시작일(YYYY-MM-DD, 1주차 월요일 권장). 정하면 기본 일정표로 "이번 주 학습 범위"를 보여 준다.

export type ProgressionMode = "warn" | "lock";

export interface SiteSettings {
  progressionMode: ProgressionMode;
  dueDates: Record<string, string>;
  cohortStart?: string;
  updatedAt?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: unknown): v is string => typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));

export function getSettings(): SiteSettings {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = 'site'");
  if (!row) return { progressionMode: "warn", dueDates: {} };
  try {
    const raw = JSON.parse(row.value) as Partial<SiteSettings>;
    const dueDates: Record<string, string> = {};
    for (const [key, date] of Object.entries(raw.dueDates ?? {})) if (isDate(date)) dueDates[key] = date;
    return {
      progressionMode: raw.progressionMode === "lock" ? "lock" : "warn",
      dueDates,
      cohortStart: isDate(raw.cohortStart) ? raw.cohortStart : undefined,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    };
  } catch {
    return { progressionMode: "warn", dueDates: {} };
  }
}

export function getProgressionMode(): ProgressionMode {
  return getSettings().progressionMode;
}

export function saveSettings(next: Omit<SiteSettings, "updatedAt">): SiteSettings {
  const clean: SiteSettings = {
    progressionMode: next.progressionMode === "lock" ? "lock" : "warn",
    dueDates: Object.fromEntries(Object.entries(next.dueDates).filter(([, d]) => isDate(d))),
    cohortStart: isDate(next.cohortStart) ? next.cohortStart : undefined,
    updatedAt: new Date().toISOString(),
  };
  run(
    "INSERT INTO settings (key, value, updated_at) VALUES ('site', ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    JSON.stringify(clean),
    clean.updatedAt!
  );
  return clean;
}

/** 마감일(YYYY-MM-DD)의 끝(한국 시간 23:59:59) */
export function dueDateEnd(date: string): Date {
  return new Date(`${date}T23:59:59+09:00`);
}

/** 마감이 아직 지나지 않았는가 */
export function isBeforeDue(date: string, now = new Date()): boolean {
  return dueDateEnd(date).getTime() >= now.getTime();
}

/** 기수 시작일 기준 오늘이 몇째 주인지(시작 전이면 0). 시작일이 없으면 undefined */
export function cohortWeek(now = new Date()): number | undefined {
  const start = getSettings().cohortStart;
  if (!start) return undefined;
  const days = Math.floor((now.getTime() - new Date(`${start}T00:00:00+09:00`).getTime()) / 86_400_000);
  return days < 0 ? 0 : Math.floor(days / 7) + 1;
}
