"use client";

import { useRef, useSyncExternalStore } from "react";
import { clearWorksheet, readWorksheet, worksheetStore, writeWorksheetField } from "@/lib/progress";

export default function Worksheet({
  slug,
  fields,
}: {
  slug: string;
  fields: { label: string; hint?: string }[];
}) {
  const store = useSyncExternalStore(worksheetStore.subscribe, worksheetStore.getSnapshot, worksheetStore.getServerSnapshot);
  const values = readWorksheet(store, slug);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (label: string, value: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => writeWorksheetField(slug, label, value), 400);
  };

  const onReset = () => {
    if (!confirm("이 주차의 백지공부 시트 내용을 모두 지울까요?")) return;
    clearWorksheet(slug);
  };

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-ink">백지공부 시트</h3>
          <p className="text-xs text-ink-muted">
            책을 덮고, 기억나는 대로 채워보세요. 막힌 곳을 정직하게 적는 것이 핵심입니다.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <span className="text-[11px] text-ink-muted">이 브라우저에 자동 저장됩니다</span>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)]"
          >
            인쇄 / PDF 저장
          </button>
          <button
            onClick={onReset}
            className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)]"
          >
            초기화
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="mb-1 block text-sm font-bold text-ink">{f.label}</label>
            {f.hint && <p className="mb-1.5 text-xs text-ink-muted">{f.hint}</p>}
            <textarea
              defaultValue={values[f.label] ?? ""}
              onChange={(e) => onChange(f.label, e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
              placeholder="여기에 적어보세요..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
