import { ink, inkSecondary, card2Bg } from "./DiagramFrame";

export function ArrowDefs({ color = ink }: { color?: string }) {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="4"
        orient="auto"
      >
        <path d="M0,0 L8,4 L0,8 Z" fill={color} />
      </marker>
    </defs>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  fill = card2Bg,
  stroke = "var(--border-strong)",
  labelColor = ink,
  subColor = inkSecondary,
  rx = 8,
  fontSize = 13,
  subSize = 10.5,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  fill?: string;
  stroke?: string;
  labelColor?: string;
  subColor?: string;
  rx?: number;
  fontSize?: number;
  subSize?: number;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text
        x={cx}
        y={sub ? cy - 4 : cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill={labelColor}
      >
        {label}
      </text>
      {sub && (
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={subSize}
          fill={subColor}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = ink,
  dashed = false,
  strokeWidth = 1.6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
  strokeWidth?: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "4 3" : undefined}
      markerEnd="url(#arrowhead)"
    />
  );
}

export function CurveArrow({
  d,
  color = ink,
  dashed = false,
  strokeWidth = 1.6,
}: {
  d: string;
  color?: string;
  dashed?: boolean;
  strokeWidth?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "4 3" : undefined}
      markerEnd="url(#arrowhead)"
    />
  );
}

export function Label({
  x,
  y,
  text,
  size = 11,
  color = inkSecondary,
  anchor = "middle",
  weight = 400,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} fontWeight={weight}>
      {text}
    </text>
  );
}
