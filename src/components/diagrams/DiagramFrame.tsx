import type { ReactNode } from "react";

export default function DiagramFrame({
  title,
  caption,
  children,
  viewBox,
  minWidth = 480,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  viewBox: string;
  minWidth?: number;
}) {
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-card">
      <div className="border-b border-[var(--border-hairline)] px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">그림 · Diagram</p>
        <h4 className="text-sm font-bold text-ink">{title}</h4>
      </div>
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
