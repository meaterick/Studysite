"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/lib/settingsActions";

export default function SettingsForm({
  mode,
  weeks,
  dueDates,
}: {
  mode: "warn" | "lock";
  weeks: { slug: string; number: number; title: string }[];
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
        <legend className="section-title mb-4">단계 진행 방식</legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--border-hairline)] p-4 transition has-[:checked]:border-[var(--text-primary)] has-[:checked]:bg-[var(--surface-card-2)]">
            <input type="radio" name="progressionMode" value="warn" defaultChecked={mode === "warn"} className="mt-1 accent-[var(--text-primary)]" />
            <span>
              <span className="font-medium text-ink">미완료 경고 (기본)</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-secondary">
                순서는 안내만 합니다. 앞 단계를 끝내지 않아도 다음 단계·백지공부·과제로 넘어갈 수 있고, 끝내지 않은 핵심 단계가 있다는 경고를 보여 줍니다. 보충·심화 단계는 언제든 열 수 있습니다.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--border-hairline)] p-4 transition has-[:checked]:border-[var(--text-primary)] has-[:checked]:bg-[var(--surface-card-2)]">
            <input type="radio" name="progressionMode" value="lock" defaultChecked={mode === "lock"} className="mt-1 accent-[var(--text-primary)]" />
            <span>
              <span className="font-medium text-ink">잠금</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-secondary">
                앞 핵심 단계의 확인 문제를 모두 맞혀야 다음 핵심 단계가 열리고, 핵심 단계를 모두 마치면 백지공부·과제와 보충·심화 단계가 열립니다.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="section-title">주차별 과제 마감일</legend>
        <p className="mb-4 mt-1 text-sm text-ink-muted">한국 시간 그날 23:59까지 · 비워 두면 표시하지 않습니다</p>
        <div className="rows border-y border-[var(--border-hairline)]">
          {weeks.map((w) => (
            <label key={w.slug} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="min-w-0 truncate text-ink-secondary">
                <span className="mr-2 font-medium text-ink">{w.number}주차</span>
                {w.title}
              </span>
              <input
                type="date"
                name={`due:${w.slug}`}
                defaultValue={dueDates[w.slug] ?? ""}
                className="shrink-0 rounded-lg border border-[var(--border-strong)] bg-card px-3 py-1.5 tabular-nums text-ink"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
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
