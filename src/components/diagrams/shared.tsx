import DiagramFrame, { colors, ink, inkSecondary } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box } from "./primitives";

export const PHASES = [
  { name: "Phase 1 · 기초", weeks: ["W1", "W2"], color: colors.blue },
  { name: "Phase 2 · 딥러닝", weeks: ["W3", "W4"], color: colors.aqua },
  { name: "Phase 3 · 현대 AI", weeks: ["W5", "W6"], color: colors.violet },
  { name: "Phase 4 · 활용·책임", weeks: ["W7", "W8"], color: colors.orange },
];

export function PhaseRoadmap() {
  const w = 150;
  const gap = 12;
  const y = 20;
  return (
    <DiagramFrame
      title="8주 로드맵: 4개 Phase"
      viewBox="0 0 660 100"
      caption='"이해 → 직접 구현 → 설명 → 활용" 순환으로 설계 — Phase가 바뀔 때마다 난이도와 자율성이 함께 높아진다.'
    >
      <ArrowDefs />
      {PHASES.map((p, i) => {
        const x = 15 + i * (w + gap);
        return (
          <g key={i}>
            <Box x={x} y={y} w={w} h={56} label={p.name} sub={p.weeks.join(" → ")} fill={p.color} labelColor="#fff" subColor="rgba(255,255,255,.85)" fontSize={12.5} subSize={11} />
            {i < PHASES.length - 1 && <Arrow x1={x + w} y1={y + 28} x2={x + w + gap - 3} y2={y + 28} />}
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function DifficultyCurve() {
  const weeks = [2, 3, 4, 4, 5, 5, 5, 4];
  const width = 620;
  const height = 220;
  const padL = 40;
  const padB = 34;
  const padT = 20;
  const barW = 54;
  const gap = 16;
  const maxD = 5;
  return (
    <DiagramFrame title="주차별 난이도 곡선" viewBox={`0 0 ${width} ${height}`} caption="W6~W7이 정점, W8은 통합·발표 중심이라 체감 난이도는 다소 낮아진다.">
      <ArrowDefs />
      <line x1={padL} y1={height - padB} x2={width - 20} y2={height - padB} stroke="var(--border-hairline)" />
      {weeks.map((d, i) => {
        const x = padL + 10 + i * (barW + gap);
        const h = (d / maxD) * (height - padB - padT);
        const y = height - padB - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={5} fill={colors.blue} opacity={0.35 + (d / maxD) * 0.55} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
              {"★".repeat(d)}
            </text>
            <text x={x + barW / 2} y={height - padB + 18} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              W{i + 1}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}
