"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useUserScope } from "@/components/UserScope";
import { useProgressItem } from "@/components/progress/ProgressStore";
import { reviewDrillDescriptive, saveDrillDescriptive } from "@/lib/labActions";
import { drillKey } from "@/lib/progressIds";

/**
 * 퀴즈 서술형: 직접 쓰고 → 모범답안·핵심 요소와 비교 → 빠뜨린 요소를 체크하며 자기평가.
 * 모범답안과 핵심 요소는 답을 저장한 뒤에만 서버 액션이 돌려준다. 화면 전체를 다시 받지 않고 이 문항과 진행 저장소만 고친다.
 */
export default function DrillDescriptive({
  slug,
  itemId,
  label,
  question,
  savedText: serverText,
  review: serverReview,
  checkedPoints,
  modelAnswer: serverModelAnswer,
  keyPoints: serverKeyPoints,
  footer,
}: {
  slug: string;
  itemId: string;
  label: string;
  question: ReactNode;
  savedText?: string;
  review?: "correct" | "incorrect";
  checkedPoints?: number[];
  modelAnswer?: ReactNode;
  keyPoints?: ReactNode[];
  footer?: ReactNode;
}) {
  const uid = useUserScope();
  const draftKey = `aegis:drill-draft:${uid}:${itemId}`;
  const [entry, update] = useProgressItem(drillKey(itemId), {
    done: !!serverReview,
    weak: serverReview === "incorrect",
    view: { savedText: serverText, review: serverReview, checkedPoints, modelAnswer: serverModelAnswer, keyPoints: serverKeyPoints },
  });
  const { savedText, review, modelAnswer, keyPoints } = entry.view;
  const [text, setText] = useState(savedText ?? "");
  const [checked, setChecked] = useState<Set<number>>(new Set(entry.view.checkedPoints ?? []));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = !!savedText;
  const dirty = text.trim() !== (savedText ?? "").trim();

  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft && draft.trim() && draft.trim() !== (savedText ?? "").trim()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 한 번, 외부 저장소(localStorage)에서 초안을 복원한다
        setText(draft);
      }
    } catch {
      // 저장소를 쓸 수 없는 환경에서는 초안 복원을 건너뛴다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const onChange = (value: string) => {
    setText(value);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, value);
      } catch {
        // 무시
      }
    }, 400);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await saveDrillDescriptive(slug, itemId, text);
        if (!r.ok) setError(r.error);
        else {
          update({ ...entry, view: { ...entry.view, savedText: r.text, modelAnswer: r.modelAnswer, keyPoints: r.keyPoints } });
          setText(r.text);
          try {
            localStorage.removeItem(draftKey);
          } catch {
            // 무시
          }
        }
      } catch {
        setError("저장에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const mark = (value: "correct" | "incorrect") => {
    startTransition(async () => {
      try {
        const r = await reviewDrillDescriptive(slug, itemId, value, [...checked]);
        if (r.ok) update({ done: r.done, weak: r.weak, view: { ...entry.view, review: r.review, checkedPoints: r.checkedPoints } });
      } catch {
        setError("저장에 실패했습니다. 페이지를 새로 고친 뒤 다시 시도해 주십시오.");
      }
    });
  };

  return (
    <div id={`drill-${itemId}`} className={`scroll-mt-24 rounded-2xl border p-5 sm:p-7 ${review ? "border-[color-mix(in_srgb,var(--status-good)_40%,transparent)]" : "border-[var(--border-hairline)]"}`}>
      <div className="mb-5 flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <div className="text-base font-medium leading-relaxed text-ink">{question}</div>
      </div>
      <label className="sr-only" htmlFor={`drill-answer-${itemId}`}>
        내 답
      </label>
      <textarea
        id={`drill-answer-${itemId}`}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={4000}
        placeholder="자료를 다시 보지 말고 자신의 말로 먼저 적어 보십시오. 코드의 어느 줄이 근거인지도 함께 적으면 좋습니다."
        className="w-full rounded-xl border border-[var(--border-strong)] bg-card px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted"
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {(!answered || dirty) && (
          <button
            type="button"
            onClick={save}
            disabled={!text.trim() || pending}
            className="btn btn-primary"
          >
            {pending ? "저장 중…" : answered ? "수정한 답안 저장" : "답안 저장 후 모범답안 보기"}
          </button>
        )}
        {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
      </div>

      {answered && modelAnswer && (
        <div className="mt-5 space-y-4">
          <div className="callout callout-good">
            <p className="mb-1 text-xs font-medium text-[var(--status-good)]">모범답안</p>
            <div className="text-ink-body">{modelAnswer}</div>
          </div>
          {keyPoints && keyPoints.length > 0 && (
            <div className="rounded-lg border border-[var(--border-hairline)] px-3 py-2.5 text-sm">
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">내 답에 들어 있는 핵심 요소를 체크해 보십시오</p>
              <ul className="space-y-1">
                {keyPoints.map((point, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2 text-ink-secondary">
                      <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} className="mt-1 accent-[var(--status-good)]" />
                      <span>{point}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-ink-muted">
                {checked.size}/{keyPoints.length}개 포함
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">자기평가</span>
            <button
              type="button"
              onClick={() => mark("correct")}
              disabled={pending}
              aria-pressed={review === "correct"}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review === "correct" ? "bg-[var(--status-good)] text-white" : "border border-[var(--border-hairline)] text-ink-secondary hover:bg-[var(--surface-card-2)]"
              }`}
            >
              핵심을 제대로 썼습니다
            </button>
            <button
              type="button"
              onClick={() => mark("incorrect")}
              disabled={pending}
              aria-pressed={review === "incorrect"}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review === "incorrect" ? "bg-[var(--status-critical)] text-white" : "border border-[var(--border-hairline)] text-ink-secondary hover:bg-[var(--surface-card-2)]"
              }`}
            >
              보완이 필요합니다
            </button>
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}
