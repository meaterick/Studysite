import DiagramFrame, { colors, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Label } from "./primitives";

export function BiasVarianceCurve() {
  const width = 560;
  const height = 300;
  const padL = 50;
  const padB = 40;
  const padT = 16;
  const padR = 20;
  const xMax = 10;
  const yMax = 10;
  const px = (x: number) => padL + (x / xMax) * (width - padL - padR);
  const py = (y: number) => height - padB - (y / yMax) * (height - padB - padT);

  const bias2 = (x: number) => 8 * Math.exp(-0.55 * x) + 0.3;
  const variance = (x: number) => 0.25 * Math.exp(0.42 * x) * 0.35 + 0.2;
  const total = (x: number) => bias2(x) + variance(x) + 0.3;

  const mkPath = (f: (x: number) => number) => {
    const pts: string[] = [];
    for (let x = 0; x <= xMax; x += 0.2) pts.push(`${px(x).toFixed(1)},${py(Math.min(f(x), yMax)).toFixed(1)}`);
    return "M " + pts.join(" L ");
  };

  let minX = 0;
  let minY = Infinity;
  for (let x = 0; x <= xMax; x += 0.1) {
    const t = total(x);
    if (t < minY) {
      minY = t;
      minX = x;
    }
  }

  return (
    <DiagramFrame
      title="편향-분산 트레이드오프"
      viewBox={`0 0 ${width} ${height}`}
      caption="모델 복잡도가 커질수록 편향²은 줄지만 분산이 늘어난다 — 총 오차가 최소가 되는 지점이 최적 복잡도다."
    >
      <ArrowDefs />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={gridline} />
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={gridline} />
      <Label x={width / 2} y={height - 10} text="모델 복잡도 →" color={inkMuted} />
      <Label x={16} y={padT + 8} text="오차" color={inkMuted} anchor="start" />
      <path d={mkPath(bias2)} fill="none" stroke={colors.blue} strokeWidth={2} />
      <path d={mkPath(variance)} fill="none" stroke={colors.orange} strokeWidth={2} />
      <path d={mkPath(total)} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <line x1={px(minX)} y1={py(minY)} x2={px(minX)} y2={height - padB} stroke={gridline} strokeDasharray="3 3" />
      <Label x={px(minX)} y={height - padB + 16} text="최적 복잡도" color={colors.violet} weight={700} />
      <Label x={px(1.6)} y={py(bias2(1.6)) - 8} text="편향²" color={colors.blue} weight={700} anchor="start" />
      <Label x={px(7.6)} y={py(variance(7.6)) - 8} text="분산" color={colors.orange} weight={700} anchor="start" />
      <Label x={px(9)} y={py(total(9)) - 10} text="총 오차" color={colors.violet} weight={700} anchor="end" />
      <Label x={px(0.4)} y={py(minY) - 60} text="과소적합" color={inkSecondary} anchor="start" />
      <Label x={px(9)} y={py(minY) - 60} text="과적합" color={inkSecondary} anchor="end" />
    </DiagramFrame>
  );
}

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
      caption="Precision = TP/(TP+FP) — 예측 열(세로) 기준. Recall = TP/(TP+FN) — 실제 행(가로) 기준."
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
