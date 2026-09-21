"use client";

export default function Worksheet({
  fields,
}: {
  fields: { label: string; hint?: string }[];
}) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-ink">백지공부 시트</h3>
          <p className="text-xs text-ink-muted">
            책을 덮고, 종이나 노트에 기억나는 대로 직접 채워보세요. 막힌 곳을 정직하게 적는 것이 핵심입니다.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)]"
        >
          인쇄 / PDF 저장
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-3">
            <p className="mb-1 text-sm font-bold text-ink">{f.label}</p>
            {f.hint && <p className="text-xs text-ink-muted">{f.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
