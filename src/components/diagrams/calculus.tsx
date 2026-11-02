import DiagramFrame, { colors, ink, inkSecondary, inkMuted } from "./DiagramFrame";
import { Axes, Markers, Arr, linear, linePath, sample } from "./chart";

const minus = (v: number) => String(v).replace("-", "−");
const halo = { stroke: "var(--surface-card)", strokeWidth: 3.5, paintOrder: "stroke" as const };

/** f(x) = x²에서 할선의 기울기 2 + h가 h → 0일 때 접선의 기울기 2로 다가간다. */
export function SecantTangent() {
  const G = { left: 48, top: 18, width: 380, height: 236 };
  const sx = linear(-0.6, 3.3, G.left, G.left + G.width);
  const sy = linear(-1.5, 10, G.top + G.height, G.top);
  const f = (x: number) => x * x;
  const clipId = "sct-clip";
  const secants = [
    { h: 2, color: colors.orange },
    { h: 1, color: colors.aqua },
    { h: 0.5, color: colors.violet },
  ];
  // P(1, 1)을 지나고 기울기가 m인 직선을 그림 범위 전체에 그린다.
  const line = (m: number) => linePath([
    [sx(-0.6), sy(1 + m * (-0.6 - 1))],
    [sx(3.3), sy(1 + m * (3.3 - 1))],
  ]);
  const rows: [string, string, string][] = [
    ["2", "4", colors.orange],
    ["1", "3", colors.aqua],
    ["0.5", "2.5", colors.violet],
    ["0.1", "2.1", inkSecondary],
    ["0.01", "2.01", inkSecondary],
    ["→ 0", "→ 2 (접선)", ink],
  ];
  const TX = 470;
  return (
    <DiagramFrame
      title="할선의 기울기가 접선의 기울기로: 도함수의 정의"
      caption="f(x) = x²에서 점 P(1, 1)과 Q(1 + h, (1 + h)²)를 잇는 할선의 기울기는 ((1 + h)² − 1) / h = 2 + h다. h를 2, 1, 0.5로 줄이면 기울기가 4, 3, 2.5로 줄어들고, h → 0일 때의 극한 2가 P에서의 접선(검정)의 기울기, 즉 도함수 f′(1)이다."
      viewBox="0 0 720 290"
      minWidth={560}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={G.left} y={G.top} width={G.width} height={G.height} />
        </clipPath>
      </defs>
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 1, 2, 3]} yTicks={[0, 2, 4, 6, 8, 10]} fmtX={minus} fmtY={minus} xLabel="x" yLabel="f(x) = x²" />
      <g clipPath={`url(#${clipId})`}>
        <path d={linePath(sample(f, -0.6, 3.3, 120).map(([x, y]) => [sx(x), sy(y)]))} fill="none" stroke={colors.blue} strokeWidth={2.6} />
        {secants.map((s) => (
          <path key={s.h} d={line(2 + s.h)} fill="none" stroke={s.color} strokeWidth={1.6} strokeDasharray="6 4" />
        ))}
        <path d={line(2)} fill="none" stroke={ink} strokeWidth={2} />
      </g>
      {secants.map((s) => (
        <g key={s.h}>
          <circle cx={sx(1 + s.h)} cy={sy(f(1 + s.h))} r={4} fill={s.color} />
          <text x={sx(1 + s.h) + 7} y={sy(f(1 + s.h)) + 4} fontSize={10.5} fontWeight={700} fill={s.color} {...halo}>
            {`Q (h = ${s.h})`}
          </text>
        </g>
      ))}
      <circle cx={sx(1)} cy={sy(1)} r={5} fill={ink} />
      <text x={sx(1) - 8} y={sy(1) - 8} textAnchor="end" fontSize={11} fontWeight={800} fill={ink} {...halo}>
        P(1, 1)
      </text>
      <text x={TX} y={40} fontSize={12} fontWeight={800} fill={ink}>
        할선 PQ의 기울기 = 2 + h
      </text>
      <text x={TX} y={66} fontSize={10.5} fontWeight={700} fill={inkMuted}>
        h
      </text>
      <text x={TX + 120} y={66} fontSize={10.5} fontWeight={700} fill={inkMuted}>
        기울기
      </text>
      <line x1={TX} x2={TX + 220} y1={73} y2={73} stroke="var(--border-hairline)" />
      {rows.map(([h, m, c], i) => (
        <g key={h}>
          <text x={TX} y={94 + i * 24} fontSize={11.5} fontWeight={700} fill={c}>
            {h}
          </text>
          <text x={TX + 120} y={94 + i * 24} fontSize={11.5} fontWeight={700} fill={c}>
            {m}
          </text>
        </g>
      ))}
      <text x={TX} y={252} fontSize={10.5} fill={inkSecondary}>
        f′(1) = lim (h → 0) ((1 + h)² − 1) / h = 2
      </text>
    </DiagramFrame>
  );
}

/** f(x, y) = x² + 2y²의 등고선과 기울기 벡터: 기울기는 등고선에 수직이고 f가 커지는 쪽을 향한다. */
export function GradientContours() {
  const P = "gct";
  const S = 58; // 가로·세로 같은 배율이라야 수직이 그대로 보인다.
  const cx = 230;
  const cy = 148;
  const X = (x: number) => cx + x * S;
  const Y = (y: number) => cy - y * S;
  const levels = [1, 2, 4, 6, 9];
  const scale = 0.25; // 화살표 길이 = 기울기 크기 × 0.25
  const points = [
    { x: 2, y: 1, level: 6 },
    { x: -Math.SQRT2, y: 1, level: 4 },
    { x: 1, y: -Math.SQRT1_2, level: 2 },
  ].map((p) => ({ ...p, g: [2 * p.x, 4 * p.y] as const }));
  const fmt = (v: number) => minus(Number(v.toFixed(2)));
  return (
    <DiagramFrame
      title="기울기 벡터는 등고선에 수직이고, 함수가 커지는 쪽을 향한다"
      caption="f(x, y) = x² + 2y²의 등고선(f = 1, 2, 4, 6, 9)이다. 각 점의 파란 화살표는 기울기 ∇f = [2x, 4y]로, 그 점을 지나는 등고선에 수직이고 f가 커지는 바깥쪽을 향한다. 주황 화살표 −∇f는 f가 가장 빠르게 줄어드는 방향이고, 경사하강법은 이 방향으로 움직인다. 화살표 길이는 기울기 크기의 1/4로 줄여 그렸다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <line x1={X(-3.6)} x2={X(3.6)} y1={Y(0)} y2={Y(0)} stroke="var(--border-hairline)" />
      <line x1={X(0)} x2={X(0)} y1={Y(-2.35)} y2={Y(2.35)} stroke="var(--border-hairline)" />
      <text x={X(3.6)} y={Y(0) - 6} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
        x
      </text>
      <text x={X(0) + 6} y={Y(2.35) + 10} fontSize={10.5} fill={inkSecondary}>
        y
      </text>
      {levels.map((c) => (
        <g key={c}>
          <ellipse cx={cx} cy={cy} rx={Math.sqrt(c) * S} ry={Math.sqrt(c / 2) * S} fill="none" stroke={colors.violet} strokeOpacity={0.55} strokeWidth={1.3} />
          <text x={X(Math.sqrt(c)) + 3} y={Y(0) + 13} fontSize={9.5} fill={colors.violet} {...halo}>
            {c}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={3.5} fill={colors.violet} />
      <text x={cx + 6} y={cy - 6} fontSize={10} fill={colors.violet} {...halo}>
        최솟값 (0, 0)
      </text>
      {points.map((p) => (
        <g key={p.level}>
          <Arr x1={X(p.x)} y1={Y(p.y)} x2={X(p.x + scale * p.g[0])} y2={Y(p.y + scale * p.g[1])} color={colors.blue} marker={`${P}-blue`} width={2.4} />
          <Arr x1={X(p.x)} y1={Y(p.y)} x2={X(p.x - scale * p.g[0])} y2={Y(p.y - scale * p.g[1])} color={colors.orange} marker={`${P}-orange`} width={2.4} />
          <circle cx={X(p.x)} cy={Y(p.y)} r={4} fill={ink} />
        </g>
      ))}
      <text x={470} y={40} fontSize={12} fontWeight={800} fill={ink}>
        f(x, y) = x² + 2y²
      </text>
      <text x={470} y={62} fontSize={11} fill={inkSecondary}>
        ∇f = [∂f/∂x, ∂f/∂y] = [2x, 4y]
      </text>
      {points.map((p, i) => (
        <g key={p.level}>
          <text x={470} y={100 + i * 46} fontSize={11} fontWeight={700} fill={ink}>
            {`점 (${fmt(p.x)}, ${fmt(p.y)}), f = ${p.level}`}
          </text>
          <text x={470} y={118 + i * 46} fontSize={11} fontWeight={700} fill={colors.blue}>
            {`∇f = [${fmt(p.g[0])}, ${fmt(p.g[1])}]`}
          </text>
        </g>
      ))}
      <text x={470} y={252} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        파랑: ∇f (가장 빠르게 증가)
      </text>
      <text x={470} y={270} fontSize={10.5} fontWeight={700} fill={colors.orange}>
        주황: −∇f (가장 빠르게 감소)
      </text>
    </DiagramFrame>
  );
}
