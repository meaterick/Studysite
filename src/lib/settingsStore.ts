import "server-only";
import fs from "fs";
import path from "path";

// 운영 설정(data/settings.json). 운영자 화면(/operator/settings)에서 바꾼다.
// - progressionMode: 단계 진행 방식. "warn"(기본) = 앞 단계를 끝내지 않아도 다음 단계·백지공부·과제로 갈 수 있고
//   미완료 경고만 보여 준다. "lock" = 앞 단계를 끝내야 다음 단계가 열린다(예전 방식).
// - dueDates: 주차 slug → 과제 마감일(YYYY-MM-DD, 한국 시간 그날 23:59까지). 진도 대시보드의 "가장 가까운 마감"에 쓴다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export type ProgressionMode = "warn" | "lock";

export interface SiteSettings {
  progressionMode: ProgressionMode;
  dueDates: Record<string, string>;
  updatedAt?: string;
}

const DEFAULTS: SiteSettings = { progressionMode: "warn", dueDates: {} };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getSettings(): SiteSettings {
  if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS, dueDates: {} };
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as Partial<SiteSettings>;
    const dueDates: Record<string, string> = {};
    for (const [slug, date] of Object.entries(raw.dueDates ?? {})) {
      if (typeof date === "string" && DATE_RE.test(date)) dueDates[slug] = date;
    }
    return {
      progressionMode: raw.progressionMode === "lock" ? "lock" : "warn",
      dueDates,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    };
  } catch {
    return { ...DEFAULTS, dueDates: {} };
  }
}

export function getProgressionMode(): ProgressionMode {
  return getSettings().progressionMode;
}

export function saveSettings(next: Omit<SiteSettings, "updatedAt">): SiteSettings {
  const clean: SiteSettings = {
    progressionMode: next.progressionMode === "lock" ? "lock" : "warn",
    dueDates: Object.fromEntries(Object.entries(next.dueDates).filter(([, d]) => DATE_RE.test(d))),
    updatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2), "utf8");
  fs.renameSync(tmp, SETTINGS_FILE);
  return clean;
}

/** 마감일(YYYY-MM-DD)의 끝(한국 시간 23:59:59)을 ISO 시각으로. */
export function dueDateEnd(date: string): Date {
  return new Date(`${date}T23:59:59+09:00`);
}
