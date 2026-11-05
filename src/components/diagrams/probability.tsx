import DiagramFrame, { colors, ink, inkSecondary } from "./DiagramFrame";
import { Axes, linear } from "./chart";

function comb(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

const binom = (n: number, k: number, p: number) => comb(n, k) * p ** k * (1 - p) ** (n - k);

/** 이항분포 B(10, 0.5)와 B(10, 0.8)의 확률질량함수: 평균 np와 표준편차 √(np(1−p)) */
export function BinomialBars() {
  const n = 10;
  const panels = [
    { p: 0.5, left: 52, color: colors.blue },
    { p: 0.8, left: 400, color: colors.orange },
  ];
  const W = 300;
  const H = 170;
  const top = 34;
  const sy = linear(0, 0.32, top + H, top);
  return (
    <DiagramFrame
      title="이항분포: n번 시행에서 성공 횟수의 분포"
      caption="성공 확률이 p인 독립 시행을 10번 했을 때 성공 횟수 k의 확률이다. p = 0.5(왼쪽)이면 평균 np = 5를 중심으로 좌우 대칭이고, p = 0.8(오른쪽)이면 평균 8 쪽으로 치우친다. 점선은 평균, 옅은 띠는 평균 ± 표준편차 √(np(1 − p))다. 정답률 0.8인 모델이 10문제 중 정확히 8문제를 맞힐 확률은 0.302로 가장 크지만, 7문제 이하를 맞힐 확률도 0.322나 된다."
      viewBox="0 0 720 260"
      minWidth={560}
    >
      {panels.map(({ p, left, color }) => {
        const sx = linear(-0.5, n + 0.5, left, left + W);
        const mean = n * p;
        const sd = Math.sqrt(n * p * (1 - p));
        const bw = (W / (n + 1)) * 0.72;
        return (
          <g key={p}>
            <rect x={sx(mean - sd)} y={top} width={sx(mean + sd) - sx(mean - sd)} height={H} fill={color} fillOpacity={0.08} />
            <Axes left={left} top={top} width={W} height={H} sx={sx} sy={sy} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 0.1, 0.2, 0.3]} xLabel="성공 횟수 k" yLabel={p === 0.5 ? "P(X = k)" : undefined} grid={false} />
            {Array.from({ length: n + 1 }, (_, k) => {
              const v = binom(n, k, p);
              return (
                <g key={k}>
                  <rect x={sx(k) - bw / 2} y={sy(v)} width={bw} height={sy(0) - sy(v)} fill={color} fillOpacity={k === 8 && p === 0.8 ? 1 : 0.75} />
                  {v >= 0.1 && (
                    <text x={sx(k)} y={sy(v) - 4} textAnchor="middle" fontSize={9} fill={ink}>
                      {v.toFixed(3)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={sx(mean)} x2={sx(mean)} y1={top} y2={top + H} stroke={ink} strokeDasharray="5 4" />
            <text x={left + W / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={color}>
              {`B(10, ${p}): 평균 ${mean}, 표준편차 ${sd.toFixed(2)}`}
            </text>
          </g>
        );
      })}
      <text x={720 - 8} y={252} textAnchor="end" fontSize={10} fill={inkSecondary}>
        P(X = k) = C(10, k) pᵏ (1 − p)¹⁰⁻ᵏ
      </text>
    </DiagramFrame>
  );
}
