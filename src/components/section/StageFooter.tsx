"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeSection } from "@/lib/studyActions";

export interface StageRequirement {
  label: string;
  done: number;
  total: number;
  /** 선택 활동(서술형): 진행만 보여 주고 완료 조건에는 넣지 않는다. */
  optional?: boolean;
}

/**
 * 단계 페이지 하단에 고정되는 진행 막대.
 * 긴 학습 자료를 읽는 동안에도 남은 확인 문제와 완료 버튼이 항상 보이게 한다.
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
  skipHref,
}: {
  slug: string;
  sectionId: string;
  requirements: StageRequirement[];
  ready: boolean;
  completed: boolean;
  isLast: boolean;
  nextHref?: string;
  nextLabel?: string;
  /** 미완료 상태로 다음으로 넘어가는 링크(운영 설정이 "미완료 경고"일 때) */
  skipHref?: string;
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

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t border-[var(--border-hairline)] bg-[color-mix(in_srgb,var(--surface-page)_97%,transparent)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border-x print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="단계 완료 조건">
          {completed ? (
            <li className="font-bold text-[var(--status-good)]">✓ 완료한 단계입니다</li>
          ) : (
            requirements.map((r) => {
              const done = r.done >= r.total;
              return (
                <li
                  key={r.label}
                  className={done ? "font-bold text-[var(--status-good)]" : r.optional ? "text-ink-muted" : "text-ink-secondary"}
                >
                  <span aria-hidden="true">{done ? "✓ " : ""}</span>
                  {r.label} {r.done}/{r.total}
                  {r.optional && <span className="ml-0.5 text-xs font-medium">(선택)</span>}
                  <span className="sr-only">{done ? " (완료)" : r.optional ? " (선택 사항)" : " (미완료)"}</span>
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
                className="btn btn-primary"
              >
                {nextLabel ?? (isLast ? "적용과 복습으로" : "다음 단계로")} →
              </Link>
            )
          ) : ready ? (
            <button
              type="button"
              onClick={finish}
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "저장 중…" : isLast ? "단계 완료 · 적용과 복습으로" : "단계 완료 · 다음 단계로"}
            </button>
          ) : null}
          {!completed && skipHref && (
            <Link
              href={skipHref}
              title="이 단계는 미완료로 남고, 나중에 돌아와 마칠 수 있습니다."
              className="text-xs font-bold text-ink-muted underline-offset-2 hover:text-ink-secondary hover:underline"
            >
              {isLast ? "미완료로 두고 적용과 복습으로 →" : "미완료로 두고 다음 단계로 →"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
