"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import ProgressRing from "@/components/ProgressRing";
import { CHECKLIST_ITEMS, getWeekProgress, progressStore, weekCompletionRatio } from "@/lib/progress";

export default function ProgressPage() {
  const store = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const ratios = WEEKS.map((w) => weekCompletionRatio(getWeekProgress(store, w.slug)));
  const overall = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">내 학습 진도</p>
      <h1 className="mb-2 text-3xl font-black text-ink">진도 대시보드</h1>
      <p className="mb-8 text-sm text-ink-muted">
        이 기기의 브라우저에만 저장됩니다. 운영자 트래커(출석·점수)와는 별개의 개인용 자기 점검 도구입니다.
      </p>

      <div className="mb-10 flex items-center gap-5 rounded-xl border border-[var(--border-hairline)] bg-card p-6">
        <ProgressRing ratio={overall} size={72} />
        <div>
          <p className="text-lg font-black text-ink">전체 진행률 {Math.round(overall * 100)}%</p>
          <p className="text-sm text-ink-secondary">8주 × 5개 항목(학습·실습·퀴즈·백지공부·과제) 기준</p>
        </div>
      </div>

      <div className="space-y-3">
        {WEEKS.map((w, i) => {
          const progress = getWeekProgress(store, w.slug);
          return (
            <Link
              key={w.slug}
              href={`/weeks/${w.slug}`}
              className="flex items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]"
            >
              <ProgressRing ratio={ratios[i]} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  Week {w.number} · {w.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                  {CHECKLIST_ITEMS.map((item) => (
                    <span key={item.id} className={progress[item.id] ? "text-[var(--status-good)]" : ""}>
                      {progress[item.id] ? "✓" : "○"} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
