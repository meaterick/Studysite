import DiagramFrame, { colors, ink, inkSecondary } from "./DiagramFrame";
import { Axes, Lines, linear, linePath, sample } from "./chart";

const minus = (v: number) => String(v).replace("-", "−");
const halo = { stroke: "var(--surface-card)", strokeWidth: 3.5, paintOrder: "stroke" as const };

/** 잔차 e = ŷ − y에 따른 샘플 하나의 손실. e = 1에서는 둘 다 1, e = 3에서는 제곱 오차 9, 절대 오차 3. */
export function LossShapes() {
  const G = { left: 52, top: 20, width: 360, height: 190 };
  const sx = linear(-4, 4, G.left, G.left + G.width);
  const sy = linear(0, 10, G.top + G.height, G.top);
  const pts = (f: (e: number) => number, a: number, b: number) =>
    linePath(sample(f, a, b, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]));
  const marks = [
    { e: 1, sq: 1, ab: 1 },
    { e: 3, sq: 9, ab: 3 },
  ];
  return (
    <DiagramFrame
      title="제곱 오차와 절대 오차: 오차가 커질수록 제곱 오차가 빠르게 커진다"
      caption="가로축은 예측과 정답의 차이 e = ŷ − y, 세로축은 샘플 하나의 손실이다. e = 1에서는 두 손실이 모두 1이지만 e = 3에서는 제곱 오차가 9, 절대 오차가 3이다. 제곱 오차로 학습하면 큰 오차 하나를 줄일 때 손실이 훨씬 많이 줄어들므로, 이상치가 파라미터를 크게 움직인다."
      viewBox="0 0 660 250"
      minWidth={520}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]} yTicks={[0, 2, 4, 6, 8, 10]} fmtX={minus} xLabel="오차 e = ŷ − y" yLabel="손실" />
      <path d={pts((e) => e * e, -Math.sqrt(10), Math.sqrt(10))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <path d={pts((e) => Math.abs(e), -4, 4)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      {marks.map((m) => (
        <g key={m.e}>
          <line x1={sx(m.e)} x2={sx(m.e)} y1={sy(m.sq)} y2={sy(0)} stroke={inkSecondary} strokeDasharray="4 3" />
          <circle cx={sx(m.e)} cy={sy(m.sq)} r={4.5} fill={colors.blue} />
          <circle cx={sx(m.e)} cy={sy(m.ab)} r={4.5} fill={colors.orange} />
        </g>
      ))}
      <text x={sx(3) + 9} y={sy(9) + 4} fontSize={10.5} fontWeight={700} fill={colors.blue} {...halo}>
        9
      </text>
      <text x={sx(3) + 9} y={sy(3) + 4} fontSize={10.5} fontWeight={700} fill={colors.orange} {...halo}>
        3
      </text>
      <text x={sx(1) - 10} y={sy(1) - 12} textAnchor="end" fontSize={10.5} fontWeight={700} fill={ink} {...halo}>
        e = 1: 둘 다 1
      </text>

      <line x1={444} y1={20} x2={444} y2={226} stroke="var(--border-hairline)" />
      <rect x={462} y={34} width={22} height={4} fill={colors.blue} />
      <Lines x={492} y={40} lines={["제곱 오차 (ŷ − y)²", "오차가 2배면 손실은 4배", "큰 오차를 먼저 줄인다"]} anchor="start" size={11.5} color={ink} gap={1.5} />
      <rect x={462} y={124} width={22} height={4} fill={colors.orange} />
      <Lines x={492} y={130} lines={["절대 오차 |ŷ − y|", "오차가 2배면 손실도 2배", "이상치의 영향이 작다"]} anchor="start" size={11.5} color={ink} gap={1.5} />
    </DiagramFrame>
  );
}
