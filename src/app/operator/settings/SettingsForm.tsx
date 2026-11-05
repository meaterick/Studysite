"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/lib/settingsActions";

export default function SettingsForm({
  mode,
  cohortStart,
  assignments,
  dueDates,
}: {
  mode: "warn" | "lock";
  cohortStart?: string;
  /** week: 기본 일정표에서 이 과제를 내는 주 차 */
  assignments: { key: string; code: string; title: string; week?: number }[];
  dueDates: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const submit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateSiteSettings(formData);
        setMessage(result.ok ? { tone: "ok", text: "저장했습니다." } : { tone: "error", text: result.error });
      } catch {
        setMessage({ tone: "error", text: "저장하지 못했습니다. 잠시 후 다시 시도해 주십시오." });
      }
    });
  };

  return (
    <form action={submit} className="space-y-14">
      <fieldset className="min-w-0">
        <legend className="section-title mb-4">레슨 진행 방식</legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--border-hairline)] p-4 transition has-[:checked]:border-[var(--text-primary)] has-[:checked]:bg-[var(--surface-card-2)]">
            <input type="radio" name="progressionMode" value="warn" defaultChecked={mode === "warn"} className="mt-1 accent-[var(--text-primary)]" />
            <span>
              <span className="font-medium text-ink">미완료 경고 (기본)</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-secondary">
                순서는 안내만 합니다. 앞 레슨을 끝내지 않아도 다음 레슨·백지 복습·과제로 넘어갈 수 있고, 먼저 마쳐야 할 레슨이 남아 있으면 경고를 보여 줍니다. 보충·심화 레슨은 언제든 열 수 있습니다.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--border-hairline)] p-4 transition has-[:checked]:border-[var(--text-primary)] has-[:checked]:bg-[var(--surface-card-2)]">
            <input type="radio" name="progressionMode" value="lock" defaultChecked={mode === "lock"} className="mt-1 accent-[var(--text-primary)]" />
            <span>
              <span className="font-medium text-ink">잠금</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-secondary">
                모듈 안에서 앞 핵심 레슨을 완료해야 다음 핵심 레슨이 열리고, 핵심 레슨을 모두 마치면 백지 복습·과제와 보충·심화 레슨이 열립니다. 진단 평가로 인정받은 레슨도 완료로 칩니다.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="section-title">기수 시작일</legend>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-ink-muted">
          정하면 기본 일정표(16주)를 기준으로 스터디원의 진도 화면과 운영자 대시보드에 이번 주 학습 범위와 제출물을 보여 줍니다. 1주 차의 월요일을 권장합니다. 비워 두면 일정을 표시하지 않습니다.
        </p>
        <input
          type="date"
          name="cohortStart"
          aria-label="기수 시작일"
          defaultValue={cohortStart ?? ""}
          className="rounded-lg border border-[var(--border-strong)] bg-card px-3 py-1.5 text-sm tabular-nums text-ink"
        />
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="section-title">과제 마감일</legend>
        <p className="mb-4 mt-1 text-sm text-ink-muted">한국 시간 그날 23:59까지 · 비워 두면 표시하지 않습니다</p>
        <div className="rows border-y border-[var(--border-hairline)]">
          {assignments.map((a) => (
            <label key={a.key} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="min-w-0 text-ink-secondary">
                <span className="mr-2 font-mono text-xs text-ink-muted">{a.code}</span>
                <span className="font-medium text-ink">{a.title}</span>
                {a.week && <span className="ml-2 text-xs text-ink-muted">기본 일정 {a.week}주 차</span>}
              </span>
              <input
                type="date"
                name={`due:${a.key}`}
                defaultValue={dueDates[a.key] ?? ""}
                className="shrink-0 rounded-lg border border-[var(--border-strong)] bg-card px-3 py-1.5 tabular-nums text-ink"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "저장 중…" : "설정 저장"}
        </button>
        {message && (
          <p className={`text-sm ${message.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
