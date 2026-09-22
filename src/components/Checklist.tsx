"use client";

import { useSyncExternalStore } from "react";
import ProgressRing from "./ProgressRing";
import {
  CHECKLIST_ITEMS,
  ChecklistId,
  getProgressStore,
  getWeekProgress,
  setChecklistItem,
  weekCompletionRatio,
} from "@/lib/progress";
import { useUserScope } from "./UserScope";

export function WeekProgressBadge({ slug }: { slug: string }) {
  const uid = useUserScope();
  const store = getProgressStore(uid);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const ratio = weekCompletionRatio(getWeekProgress(snapshot, slug));
  return <ProgressRing ratio={ratio} size={44} />;
}

export default function Checklist({ slug }: { slug: string }) {
  const uid = useUserScope();
  const store = getProgressStore(uid);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const progress = getWeekProgress(snapshot, slug);
  const ratio = weekCompletionRatio(progress);

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">이번 주 진도 체크</h3>
        <ProgressRing ratio={ratio} />
      </div>
      <ul className="mt-3 space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={!!progress[item.id]}
                onChange={() => setChecklistItem(uid, slug, item.id as ChecklistId, !progress[item.id])}
                className="h-4 w-4 shrink-0 accent-[var(--series-blue)]"
              />
              <span className={progress[item.id] ? "line-through opacity-60" : ""}>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-ink-muted">
        내 기기에도 저장되며, 로그인한 경우 운영자의 학습 현황 화면에 진행 요약이 동기화됩니다.
      </p>
    </div>
  );
}
