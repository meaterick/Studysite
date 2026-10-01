import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Label } from "./primitives";

export function ConfusionMatrix() {
  const cell = 110;
  const x0 = 170;
  const y0 = 50;
  const cells = [
    { label: "TP", sub: "실제 양성 · 예측 양성", x: x0, y: y0, color: colors.aqua },
    { label: "FN", sub: "실제 양성 · 예측 음성", x: x0 + cell, y: y0, color: colors.red },
    { label: "FP", sub: "실제 음성 · 예측 양성", x: x0, y: y0 + cell, color: colors.red },
    { label: "TN", sub: "실제 음성 · 예측 음성", x: x0 + cell, y: y0 + cell, color: colors.aqua },
  ];
  return (
    <DiagramFrame
      title="혼동행렬과 Precision / Recall"
      viewBox="0 0 560 300"
      caption="Precision = TP/(TP+FP)는 예측 열(세로) 기준, Recall = TP/(TP+FN)은 실제 행(가로) 기준이다."
    >
      <ArrowDefs />
      <Label x={x0 + cell} y={30} text="예측" color={inkMuted} weight={700} />
      <Label x={x0 - 60} y={y0 + cell} text="실제" color={inkMuted} weight={700} />
      <Label x={x0} y={y0 - 8} text="양성" color={inkSecondary} />
      <Label x={x0 + cell} y={y0 - 8} text="음성" color={inkSecondary} />
      <Label x={x0 - 30} y={y0 + 20} text="양성" color={inkSecondary} anchor="end" />
      <Label x={x0 - 30} y={y0 + cell + 20} text="음성" color={inkSecondary} anchor="end" />
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={cell} height={cell} fill={card2Bg} stroke={c.color} strokeWidth={2} />
          <text x={c.x + cell / 2} y={c.y + cell / 2 - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill={c.color}>
            {c.label}
          </text>
          <text x={c.x + cell / 2} y={c.y + cell / 2 + 16} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {c.sub}
          </text>
        </g>
      ))}
      <Arrow x1={x0 - 10} y1={y0 + cell * 2 + 20} x2={x0 + cell * 2 + 10} y2={y0 + cell * 2 + 20} color={colors.blue} />
      <Label x={x0 + cell} y={y0 + cell * 2 + 36} text="Precision: 예측 '양성' 열 안에서 TP 비율" color={colors.blue} weight={700} />
    </DiagramFrame>
  );
}

export function DataSplitDiagram() {
  const width = 620;
  const barY = 40;
  const barH = 40;
  const segs = [
    { label: "Train 60~80%", w: 340, color: colors.blue },
    { label: "Val 10~20%", w: 130, color: colors.aqua },
    { label: "Test 10~20%", w: 130, color: colors.red },
  ];
  let cx = 20;
  const foldY = 150;
  const foldW = 90;
  const foldH = 34;
  const folds = 5;
  return (
    <DiagramFrame
      title="데이터 분할과 K-Fold 교차검증"
      viewBox={`0 0 ${width} 260`}
      caption="Test는 하이퍼파라미터 튜닝에 절대 사용하지 않고 최종 1회 평가에만 쓴다. K-Fold는 Val 위치를 바꿔가며 평균 성능을 측정한다."
    >
      {segs.map((s, i) => {
        const node = (
          <g key={i}>
            <rect x={cx} y={barY} width={s.w} height={barH} fill={s.color} opacity={0.85} />
            <text x={cx + s.w / 2} y={barY + barH / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
              {s.label}
            </text>
          </g>
        );
        cx += s.w;
        return node;
      })}
      <rect x={20} y={barY} width={600} height={barH} fill="none" stroke={gridline} />

      {Array.from({ length: folds }).map((_, r) => (
        <g key={r}>
          {Array.from({ length: folds }).map((_, c) => (
            <rect
              key={c}
              x={20 + c * (foldW + 6)}
              y={foldY + r * (foldH + 6)}
              width={foldW}
              height={foldH}
              fill={c === r ? colors.aqua : card2Bg}
              stroke={gridline}
            />
          ))}
          <text x={20 + folds * (foldW + 6) + 8} y={foldY + r * (foldH + 6) + foldH / 2 + 4} fontSize={11} fill={inkSecondary}>
            Fold {r + 1}: 검증 세트 ={" "}
            <tspan fontWeight={700} fill={colors.aqua}>
              {r + 1}
            </tspan>
          </text>
        </g>
      ))}
      <ArrowDefs />
    </DiagramFrame>
  );
}

export function SigmoidCurve() {
  // σ(z) = 1/(1+e^-z). z = 0에서 0.5를 지나고, 임계값 0.5는 결정 경계 z = wᵀx + b = 0과 같다.
  const W = 640;
  const H = 260;
  const x0 = 60;
  const x1 = 600;
  const yTop = 30;
  const yBot = 210;
  const zMin = -6;
  const zMax = 6;
  const sx = (z: number) => x0 + ((z - zMin) / (zMax - zMin)) * (x1 - x0);
  const sy = (p: number) => yBot - p * (yBot - yTop);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const z = zMin + (i / 120) * (zMax - zMin);
    return `${sx(z).toFixed(1)},${sy(1 / (1 + Math.exp(-z))).toFixed(1)}`;
  }).join(" ");
  const marks = [-4, -2, 0, 2, 4];
  return (
    <DiagramFrame
      title="시그모이드: 어떤 점수 z든 0~1의 확률로"
      caption="z가 클수록 1, 작을수록 0에 가까워지고 z = 0에서 정확히 0.5다. 그래서 'p ≥ 0.5이면 양성'은 'z = wᵀx + b ≥ 0이면 양성'과 같고, 결정 경계는 wᵀx + b = 0인 직선이다."
      viewBox={`0 0 ${W} ${H}`}
      minWidth={460}
    >
      <rect x={sx(0)} y={yTop} width={x1 - sx(0)} height={yBot - yTop} fill={colors.blue} fillOpacity={0.06} />
      <rect x={x0} y={yTop} width={sx(0) - x0} height={yBot - yTop} fill={colors.orange} fillOpacity={0.06} />
      <line x1={x0} y1={yBot} x2={x1} y2={yBot} stroke="var(--border-strong)" />
      <line x1={x0} y1={yTop} x2={x0} y2={yBot} stroke="var(--border-strong)" />
      {[0, 0.5, 1].map((p) => (
        <g key={p}>
          <line x1={x0} y1={sy(p)} x2={x1} y2={sy(p)} stroke="var(--border-hairline)" strokeDasharray={p === 0.5 ? "5 4" : undefined} />
          <text x={x0 - 8} y={sy(p) + 4} textAnchor="end" fontSize={11} fill={inkSecondary}>
            {p}
          </text>
        </g>
      ))}
      <line x1={sx(0)} y1={yTop} x2={sx(0)} y2={yBot} stroke={ink} strokeDasharray="5 4" />
      <polyline points={pts} fill="none" stroke={colors.violet} strokeWidth={2.5} />
      {marks.map((z) => {
        const p = 1 / (1 + Math.exp(-z));
        return (
          <g key={z}>
            <circle cx={sx(z)} cy={sy(p)} r={3.5} fill={colors.violet} />
            <text x={sx(z)} y={yBot + 16} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              {z}
            </text>
            <text x={sx(z) + (z < 0 ? 6 : -6)} y={sy(p) + (z < 0 ? -8 : 16)} textAnchor={z < 0 ? "start" : "end"} fontSize={10.5} fontWeight={700} fill={ink}>
              {p.toFixed(3)}
            </text>
          </g>
        );
      })}
      <text x={x1} y={yBot + 34} textAnchor="end" fontSize={11} fill={inkSecondary}>
        z = wᵀx + b
      </text>
      <text x={x0 + 10} y={yTop + 16} fontSize={11.5} fontWeight={700} fill={colors.orange}>
        음성으로 예측 (p &lt; 0.5)
      </text>
      <text x={x1 - 10} y={yBot - 10} textAnchor="end" fontSize={11.5} fontWeight={700} fill={colors.blue}>
        양성으로 예측 (p ≥ 0.5)
      </text>
    </DiagramFrame>
  );
}

export function LearningCurves() {
  // 훈련 데이터 양에 따른 훈련 오차(파랑)와 검증 오차(주황). 왼쪽: 과적합(틈이 큼), 오른쪽: 과소적합(둘 다 높게 만남).
  const panels = [
    { title: "과적합(분산이 큼)", train: [0.02, 0.05, 0.08, 0.1, 0.12], val: [0.6, 0.42, 0.32, 0.26, 0.22], note: "틈이 크다 → 데이터를 늘리면 좋아진다" },
    { title: "과소적합(편향이 큼)", train: [0.25, 0.33, 0.37, 0.39, 0.4], val: [0.62, 0.5, 0.45, 0.43, 0.42], note: "둘 다 높게 만난다 → 데이터보다 모델을 키워야" },
  ];
  const pw = 280;
  const ph = 150;
  const top = 36;
  return (
    <DiagramFrame
      title="학습 곡선으로 진단하기"
      caption="훈련 데이터를 늘려 가며 훈련 오차와 검증 오차를 그린 학습 곡선. 두 곡선 사이의 틈은 분산을, 두 곡선이 만나는 높이는 편향을 보여 준다."
      viewBox="0 0 660 250"
      minWidth={480}
    >
      {panels.map((p, k) => {
        const ox = 40 + k * 320;
        const sx = (i: number) => ox + (i / 4) * pw;
        const sy = (v: number) => top + ph - (v / 0.7) * ph;
        const line = (vals: number[]) => vals.map((v, i) => `${sx(i)},${sy(v)}`).join(" ");
        return (
          <g key={p.title}>
            <text x={ox + pw / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {p.title}
            </text>
            <line x1={ox} y1={top + ph} x2={ox + pw} y2={top + ph} stroke="var(--border-strong)" />
            <line x1={ox} y1={top} x2={ox} y2={top + ph} stroke="var(--border-strong)" />
            <polyline points={line(p.train)} fill="none" stroke={colors.blue} strokeWidth={2.4} />
            <polyline points={line(p.val)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
            <text x={ox + pw} y={top + ph + 16} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
              훈련 데이터 양 →
            </text>
            <text x={ox - 6} y={top + 6} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
              오차
            </text>
            <text x={sx(4) - 4} y={sy(p.train[4]) + (k === 0 ? 16 : 18)} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.blue}>
              훈련
            </text>
            <text x={sx(4) - 4} y={sy(p.val[4]) - 8} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.orange}>
              검증
            </text>
            <text x={ox + pw / 2} y={top + ph + 38} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              {p.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}
