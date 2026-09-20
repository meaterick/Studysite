export default function ProgressRing({ ratio, size = 44 }: { ratio: number; size?: number }) {
  const stroke = 4.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);
  const color =
    ratio >= 1 ? "var(--status-good)" : ratio > 0 ? "var(--series-blue)" : "var(--border-strong)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.28} fontWeight={800} fill="var(--text-primary)">
        {Math.round(ratio * 100)}
      </text>
    </svg>
  );
}
