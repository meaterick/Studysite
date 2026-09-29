"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "./dal";
import { saveSettings, type ProgressionMode } from "./settingsStore";
import { WEEKS } from "@/content/weeks";

export type SettingsResult = { ok: true } | { ok: false; error: string };

/** 운영 설정 저장(관리자 전용): 단계 진행 방식과 주차별 과제 마감일 */
export async function updateSiteSettings(formData: FormData): Promise<SettingsResult> {
  await requireAdmin("/operator/settings");
  const mode = formData.get("progressionMode");
  if (mode !== "warn" && mode !== "lock") return { ok: false, error: "진행 방식을 선택해 주십시오." };
  const dueDates: Record<string, string> = {};
  for (const week of WEEKS) {
    const value = String(formData.get(`due:${week.slug}`) ?? "").trim();
    if (!value) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      return { ok: false, error: `${week.number}주차 마감일 형식이 올바르지 않습니다.` };
    }
    dueDates[week.slug] = value;
  }
  saveSettings({ progressionMode: mode as ProgressionMode, dueDates });
  refresh();
  return { ok: true };
}
