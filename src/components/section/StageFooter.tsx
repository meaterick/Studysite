"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeSection } from "@/lib/studyActions";
import Icon from "@/components/Icon";
import { useProgressStatuses } from "@/components/progress/ProgressStore";

export interface StageRequirement {
  label: string;
  done: number;
  total: number;
  /** 선택 활동(서술형): 진행만 보여 주고 완료 조건에는 넣지 않는다. */
  optional?: boolean;
  /** 진행 저장소의 문항 id. 있으면 done을 저장소에서 센다(문제를 풀 때 화면을 다시 받지 않으므로). */
  ids?: string[];
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
  const statuses = useProgressStatuses();
  const doneOf = (r: StageRequirement) => (r.ids && statuses ? r.ids.filter((id) => statuses[id]?.done).length : r.done);
  const live = requirements.some((r) => r.ids) && statuses;
  const canFinish = live ? requirements.every((r) => r.optional || doneOf(r) >= r.total) : ready;

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
    <div className="sticky bottom-4 z-20 mt-14 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[color-mix(in_srgb,var(--surface-card)_95%,transparent)] px-4 py-3 shadow-[var(--shadow-raised)] backdrop-blur-xl backdrop-saturate-150 sm:px-5">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]" aria-label="단계 완료 조건">
          {completed ? (
            <li className="flex items-center gap-1.5 font-medium text-[var(--status-good)]">
              <Icon name="check" size={15} />
              완료한 단계입니다
            </li>
          ) : (
            requirements.map((r) => {
              const count = doneOf(r);
              const done = count >= r.total;
              return (
                <li key={r.label} className={`flex items-center gap-1.5 tabular-nums ${done ? "font-medium text-[var(--status-good)]" : "text-ink-secondary"}`}>
                  {done && <Icon name="check" size={15} />}
                  {r.label} {count}/{r.total}
                  {r.optional && <span className="text-xs text-ink-muted">(선택)</span>}
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
                {nextLabel ?? (isLast ? "적용과 복습으로" : "다음 단계로")}
                <Icon name="arrowRight" size={15} />
              </Link>
            )
          ) : canFinish ? (
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
              className="text-xs font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {isLast ? "미완료로 두고 적용과 복습으로" : "미완료로 두고 다음 단계로"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
