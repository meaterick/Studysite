import type { ReactNode } from "react";

export default function DiagramFrame({
  title,
  caption,
  children,
  viewBox,
  minWidth = 480,
  controls,
  interactive = false,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  viewBox: string;
  minWidth?: number;
  /** 슬라이더·버튼 등 SVG 밖에 놓이는 조작 UI. 있으면 헤더 아래에 렌더링됩니다. */
  controls?: ReactNode;
  /** true면 헤더에 "직접 조작해 보십시오" 배지를 붙여 인터랙티브 다이어그램임을 알립니다. */
  interactive?: boolean;
}) {
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-card">
      <div className="border-b border-[var(--border-hairline)] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">그림 · Diagram</p>
            <h4 className="text-sm font-bold text-ink">{title}</h4>
          </div>
          {interactive && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-white"
              style={{ background: "var(--series-blue)" }}
            >
              직접 조작해 보십시오 ↓
            </span>
          )}
        </div>
      </div>
      {controls && (
        <div className="border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-4 py-3">
          {controls}
        </div>
      )}
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={viewBox}
          style={{ minWidth }}
          className="w-full"
          role="img"
          aria-label={title}
        >
          {children}
        </svg>
      </div>
      {caption && (
        <figcaption className="border-t border-[var(--border-hairline)] px-4 py-2.5 text-xs text-ink-secondary">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export const ink = "var(--text-primary)";
export const inkSecondary = "var(--text-secondary)";
export const inkMuted = "var(--text-muted)";
export const gridline = "var(--border-hairline)";
export const cardBg = "var(--surface-card)";
export const card2Bg = "var(--surface-card-2)";
export const colors = {
  blue: "var(--series-blue)",
  orange: "var(--series-orange)",
  aqua: "var(--series-aqua)",
  yellow: "var(--series-yellow)",
  magenta: "var(--series-magenta)",
  green: "var(--series-green)",
  violet: "var(--series-violet)",
  red: "var(--series-red)",
};
