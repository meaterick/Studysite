import DiagramFrame, { colors, ink, inkSecondary, inkMuted } from "./DiagramFrame";
import { Axes, Lines, linear, linePath, sample, seeded, gaussian } from "./chart";

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

/** 잔차 그래프의 세 가지 모양: 고르게 퍼짐(문제 없음), 곡선(빠진 비선형 관계), 깔때기(예측이 클수록 오차도 커짐). */
export function ResidualPatterns() {
  const rand = seeded(7);
  const n = 70;
  const xs = Array.from({ length: n }, () => rand());
  const noise = xs.map(() => gaussian(rand));
  const panels = [
    { title: "고르게 퍼짐", note: ["문제가 보이지 않는다"], color: colors.green, r: (x: number, e: number) => 0.9 * e },
    { title: "곡선 모양", note: ["빠진 비선형 관계", "→ x² 같은 특성 추가"], color: colors.orange, r: (x: number, e: number) => 9 * (x - 0.5) ** 2 - 0.75 + 0.35 * e },
    { title: "깔때기 모양", note: ["예측이 클수록 오차가 큼", "→ 로그 변환, 상대 오차"], color: colors.violet, r: (x: number, e: number) => (0.15 + 1.6 * x) * e },
  ];
  const W = 190;
  const H = 130;
  return (
    <DiagramFrame
      title="잔차 그래프: 예측값에 따른 잔차의 모양으로 모델을 진단한다"
      caption="가로축은 예측값 ŷ, 세로축은 잔차 y − ŷ다. 왼쪽처럼 잔차가 0을 중심으로 고르게 퍼져 있으면 선형 모델이 관계를 잘 나타낸다. 가운데처럼 곡선 모양이면 모델이 나타내지 못한 비선형 관계가 남아 있고, 오른쪽처럼 예측값이 클수록 잔차가 넓게 퍼지면 오차의 크기가 예측값에 따라 달라진다."
      viewBox="0 0 680 250"
      minWidth={560}
    >
      {panels.map((p, i) => {
        const left = 40 + i * 220;
        const top = 34;
        const sx = linear(0, 1, left, left + W);
        const sy = linear(-3, 3, top + H, top);
        return (
          <g key={p.title}>
            <text x={left + W / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={p.color}>
              {p.title}
            </text>
            <Axes left={left} top={top} width={W} height={H} sx={sx} sy={sy} yTicks={[-3, 0, 3]} fmtY={(v) => (v === 0 ? "0" : String(v).replace("-", "−"))} xLabel="예측값 ŷ" />
            <line x1={left} x2={left + W} y1={sy(0)} y2={sy(0)} stroke={inkMuted} strokeDasharray="4 3" />
            {xs.map((x, k) => {
              const r = Math.max(-2.9, Math.min(2.9, p.r(x, noise[k])));
              return <circle key={k} cx={sx(x)} cy={sy(r)} r={2.6} fill={p.color} fillOpacity={0.75} />;
            })}
            <Lines x={left + W / 2} y={top + H + 52} lines={p.note} size={11} color={ink} gap={1.4} />
          </g>
        );
      })}
      <text x={14} y={34 + H / 2} fontSize={10.5} fill={inkSecondary} transform={`rotate(-90 14 ${34 + H / 2})`} textAnchor="middle">
        잔차 y − ŷ
      </text>
    </DiagramFrame>
  );
}
