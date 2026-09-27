"use client";

import { useOptimistic, useTransition } from "react";
import { setPracticeDone } from "@/lib/studyActions";

export default function PracticeConfirm({ slug, sectionId, done }: { slug: string; sectionId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  // 서버 저장이 끝나기 전에도 체크 상태가 바로 바뀌어 보이도록 낙관적 업데이트를 쓴다.
  const [checked, setChecked] = useOptimistic(done);
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        checked
          ? "border-[var(--status-good)]/60 bg-[color-mix(in_srgb,var(--status-good)_8%,transparent)]"
          : "border-[var(--series-orange)]/50 bg-[color-mix(in_srgb,var(--series-orange)_6%,transparent)]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setChecked(next);
            await setPracticeDone(slug, sectionId, next);
          });
        }}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--status-good)]"
      />
      <span>
        <span className="font-bold text-ink">위 실습을 직접 해봤습니다.</span>
        <span className="mt-0.5 block text-ink-muted">
          코드는 이 페이지에서 바로 실행하거나 Google Colab에 붙여넣어 실행하세요. 결과를 예상과 비교하고, 값을 한두 개 바꿔 다시 돌려보는 것까지가 실습입니다.
        </span>
      </span>
    </label>
  );
}
