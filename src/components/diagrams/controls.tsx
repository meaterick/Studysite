import type { ReactNode } from "react";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  color = "var(--series-blue)",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
}) {
  return (
    <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-xs">
      <span className="flex items-center justify-between font-semibold text-ink">
        <span>{label}</span>
        <span className="font-mono" style={{ color }}>
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--series-blue)]"
        style={{ accentColor: color }}
      />
    </label>
  );
}

export function PresetButtons<T extends string | number>({
  label,
  options,
  value,
  onChange,
  formatLabel,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-xs">
      <span className="font-semibold text-ink">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => onChange(opt)}
              className="rounded-md border px-2.5 py-1 font-mono text-[11.5px] font-semibold transition"
              style={
                active
                  ? { background: "var(--series-blue)", borderColor: "var(--series-blue)", color: "#fff" }
                  : { background: "var(--surface-card)", borderColor: "var(--border-hairline)", color: "var(--text-secondary)" }
              }
            >
              {formatLabel ? formatLabel(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ControlRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-4">{children}</div>;
}
