import DiagramFrame, { colors, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
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
