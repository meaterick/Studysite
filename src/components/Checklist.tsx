"use client";

import { useSyncExternalStore } from "react";
import ProgressRing from "./ProgressRing";
import {
  CHECKLIST_ITEMS,
  ChecklistId,
  getWeekProgress,
  progressStore,
  setChecklistItem,
  weekCompletionRatio,
} from "@/lib/progress";

export function WeekProgressBadge({ slug }: { slug: string }) {
  const store = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const ratio = weekCompletionRatio(getWeekProgress(store, slug));
  return <ProgressRing ratio={ratio} size={44} />;
}

export default function Checklist({ slug }: { slug: string }) {
  const store = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const progress = getWeekProgress(store, slug);
  const ratio = weekCompletionRatio(progress);

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">이번 주 진도 체크</h3>
        <ProgressRing ratio={ratio} />
      </div>
      <ul className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={!!progress[item.id]}
                onChange={() => setChecklistItem(slug, item.id as ChecklistId, !progress[item.id])}
                className="h-4 w-4 shrink-0 accent-[var(--series-blue)]"
              />
              <span className={progress[item.id] ? "line-through opacity-60" : ""}>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-ink-muted">이 브라우저에만 저장됩니다 (localStorage). 기기를 바꾸면 초기화됩니다.</p>
    </div>
  );
}
