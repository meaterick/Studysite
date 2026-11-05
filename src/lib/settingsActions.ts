"use server";

import { recordSecurityEvent } from "./securityEvents";
import { refresh } from "next/cache";
import { requireAdmin } from "./dal";
import { saveSettings, type ProgressionMode } from "./settingsStore";
import { MODULES } from "@/content/course";

export type SettingsResult = { ok: true } | { ok: false; error: string };

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** 운영 설정 저장(관리자 전용): 레슨 진행 방식, 기수 시작일, 과제별 마감일 */
export async function updateSiteSettings(formData: FormData): Promise<SettingsResult> {
  const actor = await requireAdmin("/operator/settings");
  const mode = formData.get("progressionMode");
  if (mode !== "warn" && mode !== "lock") return { ok: false, error: "진행 방식을 선택해 주십시오." };
  const cohortStart = String(formData.get("cohortStart") ?? "").trim();
  if (cohortStart && !isDate(cohortStart)) return { ok: false, error: "기수 시작일 형식이 올바르지 않습니다." };
  const dueDates: Record<string, string> = {};
  for (const mod of MODULES) {
    if (!mod.assignment) continue;
    const value = String(formData.get(`due:${mod.assignment.key}`) ?? "").trim();
    if (!value) continue;
    if (!isDate(value)) return { ok: false, error: `${mod.code} ${mod.assignment.title}의 마감일 형식이 올바르지 않습니다.` };
    dueDates[mod.assignment.key] = value;
  }
  saveSettings({ progressionMode: mode as ProgressionMode, dueDates, cohortStart: cohortStart || undefined });
  recordSecurityEvent("admin_change", { userId: actor.id, path: "/operator/settings", detail: "레슨 진행 방식·기수 시작일·과제 마감일 저장" });
  refresh();
  return { ok: true };
}
