"use server";

import { recordSecurityEvent } from "./securityEvents";
import { refresh } from "next/cache";
import { requireAdmin } from "./dal";
import { getSettings, saveSettings, type ProgressionMode } from "./settingsStore";

export type SettingsResult = { ok: true } | { ok: false; error: string };

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** 운영 설정 저장(관리자 전용): 레슨 진행 방식, 기수 시작일 */
export async function updateSiteSettings(formData: FormData): Promise<SettingsResult> {
  const actor = await requireAdmin("/operator/settings");
  const mode = formData.get("progressionMode");
  if (mode !== "warn" && mode !== "lock") return { ok: false, error: "진행 방식을 선택해 주십시오." };
  const cohortStart = String(formData.get("cohortStart") ?? "").trim();
  if (cohortStart && !isDate(cohortStart)) return { ok: false, error: "기수 시작일 형식이 올바르지 않습니다." };
  saveSettings({ ...getSettings(), progressionMode: mode as ProgressionMode, cohortStart: cohortStart || undefined });
  recordSecurityEvent("admin_change", { userId: actor.id, path: "/operator/settings", detail: "레슨 진행 방식·기수 시작일 저장" });
  refresh();
  return { ok: true };
}
