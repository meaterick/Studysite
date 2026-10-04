import type { ReactNode } from "react";
import { gridline, inkMuted, inkSecondary } from "./DiagramFrame";

// 좌표축이 있는 그림(손실 곡선·확률 곡선 등)과 색 화살표를 그리는 도우미.
// 한 페이지에 그림이 여러 개 있으면 SVG <marker> id가 문서 전체에서 겹치므로, 화살촉 id에는 그림마다 고유한 접두사를 붙인다.

export type Scale = (v: number) => number;

/** 데이터 구간 [d0, d1]을 화면 구간 [r0, r1]로 옮기는 선형 눈금 */
export function linear(d0: number, d1: number, r0: number, r1: number): Scale {
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** 로그 눈금(밑 10). d0, d1은 0보다 커야 한다. */
export function log10Scale(d0: number, d1: number, r0: number, r1: number): Scale {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  return (v) => r0 + ((Math.log10(v) - l0) / (l1 - l0)) * (r1 - r0);
}

/** 화면 좌표 점들을 꺾은선 path로 */
export function linePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

/** f를 [a, b]에서 n등분해 데이터 좌표 점 목록을 만든다 */
export function sample(f: (x: number) => number, a: number, b: number, n = 80): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / n;
    return [x, f(x)] as [number, number];
  });
}

/** 결정적 의사난수(그림의 점 구름을 매번 같게 그리기 위한 것) */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 표준정규 난수(Box–Muller) */
export function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function Axes({
  left,
  top,
  width,
  height,
  sx,
  sy,
  xTicks = [],
  yTicks = [],
  fmtX = (v) => String(v),
  fmtY = (v) => String(v),
  xLabel,
  yLabel,
  grid = true,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  sx: Scale;
  sy: Scale;
  xTicks?: number[];
  yTicks?: number[];
  fmtX?: (v: number) => string;
  fmtY?: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
  grid?: boolean;
}) {
  const bottom = top + height;
  const right = left + width;
  return (
    <g>
      {grid &&
        yTicks.map((t) => <line key={`gy${t}`} x1={left} x2={right} y1={sy(t)} y2={sy(t)} stroke={gridline} />)}
      {grid &&
        xTicks.map((t) => <line key={`gx${t}`} x1={sx(t)} x2={sx(t)} y1={top} y2={bottom} stroke={gridline} />)}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={inkMuted} strokeWidth={1.2} />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={inkMuted} strokeWidth={1.2} />
      {xTicks.map((t) => (
        <text key={`tx${t}`} x={sx(t)} y={bottom + 15} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
          {fmtX(t)}
        </text>
      ))}
      {yTicks.map((t) => (
        <text key={`ty${t}`} x={left - 6} y={sy(t) + 3.5} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
          {fmtY(t)}
        </text>
      ))}
      {xLabel && (
        <text x={left + width / 2} y={bottom + 32} textAnchor="middle" fontSize={11} fontWeight={600} fill={inkSecondary}>
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          transform={`translate(${left - 38}, ${top + height / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={inkSecondary}
        >
          {yLabel}
        </text>
      )}
    </g>
  );
}

/** 색마다 화살촉 하나. 화살표는 markerEnd={`url(#${prefix}-${이름})`}로 참조한다. */
export function Markers({ prefix, colors }: { prefix: string; colors: Record<string, string> }) {
  return (
    <defs>
      {Object.entries(colors).map(([name, c]) => (
        <marker
          key={name}
          id={`${prefix}-${name}`}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

/** 직선 화살표(색 화살촉은 Markers로 미리 정의한 id를 넘긴다) */
export function Arr({
  x1,
  y1,
  x2,
  y2,
  color,
  marker,
  width = 1.6,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  marker: string;
  width?: number;
  dashed?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={`url(#${marker})`}
    />
  );
}

/** 곡선 화살표 */
export function ArrPath({
  d,
  color,
  marker,
  width = 1.6,
  dashed = false,
}: {
  d: string;
  color: string;
  marker: string;
  width?: number;
  dashed?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={`url(#${marker})`}
    />
  );
}

/** 여러 줄 글. lines의 각 원소가 한 줄이다. */
export function Lines({
  x,
  y,
  lines,
  size = 11,
  color = inkSecondary,
  anchor = "middle",
  weight = 400,
  gap = 1.35,
}: {
  x: number;
  y: number;
  lines: ReactNode[];
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  gap?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} fontWeight={weight}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * gap}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/** 둥근 모서리 상자 + 가운데 글(여러 줄 가능). tint는 옅은 바탕색, stroke는 테두리색 */
export function Tag({
  x,
  y,
  w,
  h,
  lines,
  color,
  tint = 0.12,
  size = 12,
  weight = 700,
  textColor,
  rx = 8,
  dashed = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: ReactNode[];
  color: string;
  tint?: number;
  size?: number;
  weight?: number;
  textColor?: string;
  rx?: number;
  dashed?: boolean;
}) {
  const lineH = size * 1.3;
  const firstY = y + h / 2 - ((lines.length - 1) * lineH) / 2 + size * 0.36;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={color}
        fillOpacity={tint}
        stroke={color}
        strokeWidth={1.4}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text x={x + w / 2} y={firstY} textAnchor="middle" fontSize={size} fontWeight={weight} fill={textColor ?? "var(--text-primary)"}>
        {lines.map((l, i) => (
          <tspan
            key={i}
            x={x + w / 2}
            dy={i === 0 ? 0 : lineH}
            fontWeight={i === 0 ? weight : 400}
            fontSize={i === 0 ? size : size - 1.5}
            fill={i === 0 ? undefined : inkSecondary}
          >
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}
