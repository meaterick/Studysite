"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeSection } from "@/lib/studyActions";

export interface StageRequirement {
  label: string;
  done: number;
  total: number;
}

/**
 * 단계 페이지 하단에 고정되는 진행 막대.
 * 긴 학습 자료를 읽는 동안에도 남은 과제(확인 문제·서술형)와 완료 버튼이 항상 보이게 한다.
 */
export default function StageFooter({
  slug,
  sectionId,
  requirements,
  ready,
  completed,
  isLast,
  nextHref,
  nextLabel,
}: {
  slug: string;
  sectionId: string;
  requirements: StageRequirement[];
  ready: boolean;
  completed: boolean;
  isLast: boolean;
  nextHref?: string;
  nextLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeSection(slug, sectionId);
        if (result && !result.ok) setError(result.error);
      } catch {
        setError("저장하지 못했습니다. 잠시 후 다시 시도해 주십시오.");
      }
    });
  };

  const remaining = requirements.filter((r) => r.done < r.total);

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t border-[var(--border-hairline)] bg-[color-mix(in_srgb,var(--surface-page)_92%,transparent)] px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border-x print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="단계 완료 조건">
          {completed ? (
            <li className="font-bold text-[var(--status-good)]">✓ 완료한 단계입니다</li>
          ) : (
            requirements.map((r) => {
              const done = r.done >= r.total;
              return (
                <li key={r.label} className={done ? "font-bold text-[var(--status-good)]" : "text-ink-secondary"}>
                  <span aria-hidden="true">{done ? "✓ " : ""}</span>
                  {r.label} {r.done}/{r.total}
                  <span className="sr-only">{done ? " (완료)" : " (미완료)"}</span>
                </li>
              );
            })
          )}
        </ul>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-[var(--status-critical)]">{error}</p>}
          {completed ? (
            nextHref && (
              <Link
                href={nextHref}
                className="rounded-lg bg-[var(--series-blue)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                {nextLabel ?? (isLast ? "백지공부·과제로 이동" : "다음 단계로")} →
              </Link>
            )
          ) : ready ? (
            <button
              type="button"
              onClick={finish}
              disabled={pending}
              className="rounded-lg bg-[var(--series-blue)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "저장 중…" : isLast ? "단계 완료 · 백지공부와 과제 열기" : "단계 완료 · 다음 단계 열기"}
            </button>
          ) : (
            <a
              href="#check"
              className="rounded-lg border border-[var(--border-hairline)] px-4 py-2 text-sm font-bold text-ink-secondary hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
              title={remaining.map((r) => `${r.label} ${r.total - r.done}개 남음`).join(", ")}
            >
              확인 문제 풀기 ↓
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
