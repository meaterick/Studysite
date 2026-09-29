"use client";

import { useState, useTransition } from "react";
import { markPracticeDone } from "@/lib/studyActions";

/** 실습 끝에 두는 "실습을 마쳤습니다" 표시. 단계 완료 조건은 아니고 진도 화면의 실습 완료율에 쓴다. */
export default function PracticeDoneButton({ slug, sectionId, done }: { slug: string; sectionId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        await markPracticeDone(slug, sectionId, !done);
      } catch {
        setError("저장하지 못했습니다. 잠시 후 다시 시도해 주십시오.");
      }
    });
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={done}
        className={`rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
          done
            ? "bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
            : "border border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--series-orange)]"
        }`}
      >
        {done ? "✓ 실습을 마쳤습니다" : "실습을 마쳤으면 눌러 주십시오"}
      </button>
      <span className="text-xs text-ink-muted">
        {done ? "다시 누르면 취소됩니다." : "단계 완료 조건은 아니며, 내 진도의 실습 완료율에 반영됩니다."}
      </span>
      {error && <span className="text-xs text-[var(--status-critical)]">{error}</span>}
    </div>
  );
}
