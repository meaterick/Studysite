"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeSection } from "@/lib/studyActions";

export default function SectionComplete({
  slug,
  sectionId,
  requirements,
  ready,
  completed,
  isLast,
  nextHref,
}: {
  slug: string;
  sectionId: string;
  requirements: { label: string; done: boolean }[];
  ready: boolean;
  completed: boolean;
  isLast: boolean;
  nextHref?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeSection(slug, sectionId);
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <h3 className="text-base font-black text-ink">{completed ? "완료한 섹션입니다" : "섹션 완료 조건"}</h3>
      <ul className="mt-3 space-y-1.5 text-sm">
        {requirements.map((r) => (
          <li key={r.label} className={r.done ? "text-[var(--status-good)]" : "text-ink-secondary"}>
            <span aria-hidden="true">{r.done ? "✓" : "○"}</span> {r.label}
            <span className="sr-only">{r.done ? " (완료)" : " (미완료)"}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {completed ? (
          nextHref && (
            <Link href={nextHref} className="rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              {isLast ? "마무리 단계로 →" : "다음 섹션으로 →"}
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!ready || pending}
            className="rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "저장 중…" : isLast ? "섹션 완료 → 백지공부·과제 열기" : "섹션 완료 → 다음 섹션"}
          </button>
        )}
        {!ready && !completed && <p className="text-xs text-ink-muted">위 조건을 모두 채우면 버튼이 활성화됩니다.</p>}
        {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
      </div>
    </div>
  );
}
