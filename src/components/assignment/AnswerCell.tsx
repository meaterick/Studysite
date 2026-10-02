"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { NotebookCell } from "@/lib/notebook";
import UserMarkdown from "./UserMarkdown";

/** 과제 답안 셀. 마크다운(표·수식 포함)으로 작성하고 미리보기로 확인한다. */
export default function AnswerCell({
  cell,
  prompt,
  placeholder,
  minChars,
  template,
  optional,
  onChange,
  onDelete,
}: {
  cell: NotebookCell;
  prompt?: ReactNode;
  placeholder?: string;
  minChars?: number;
  template?: string;
  optional?: boolean;
  onChange: (source: string) => void;
  onDelete?: () => void;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);
  const length = cell.source.trim().length;
  const untouched = !!template && cell.source.trim() === template.trim();
  const min = minChars ?? 1;
  const enough = !untouched && length >= min;

  // 내용에 맞춰 입력창 높이를 늘린다.
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "write") return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 120), 900)}px`;
  }, [cell.source, mode]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] py-1.5 pl-2 pr-3">
        <div className="flex items-center gap-1 text-xs font-medium" role="tablist" aria-label="답안 보기 방식">
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 transition ${mode === m ? "bg-[var(--surface-card-2)] text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              {m === "write" ? "작성" : "미리보기"}
            </button>
          ))}
          <span className="ml-2 font-normal text-ink-muted">{cell.custom ? "추가한 메모" : "답안"} · 마크다운</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={enough ? "text-[var(--status-good)]" : optional ? "text-ink-muted" : "text-[var(--status-serious)]"}>
            {length.toLocaleString()}자{minChars ? ` / 최소 ${minChars.toLocaleString()}자` : ""}
            {enough ? " ✓" : ""}
          </span>
          {onDelete && (
            <button type="button" onClick={onDelete} className="rounded-full px-2 py-1 font-medium text-ink-muted transition hover:text-[var(--status-critical)]">
              삭제
            </button>
          )}
        </div>
      </div>
      {prompt && <div className="border-b border-[var(--border-hairline)] px-4 py-3 text-sm font-medium leading-relaxed text-ink">{prompt}</div>}
      {mode === "write" ? (
        <textarea
          ref={ref}
          value={cell.source}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "여기에 답안을 작성합니다."}
          aria-label="답안"
          spellCheck={false}
          className="block w-full resize-none bg-card px-4 py-3 font-[inherit] text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-muted"
        />
      ) : (
        <div className="px-4 py-3">
          <UserMarkdown source={cell.source} />
        </div>
      )}
    </div>
  );
}
