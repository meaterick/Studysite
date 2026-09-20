"use client";

import { useState } from "react";
import DiagramFrame, { colors, inkSecondary, inkMuted, gridline } from "./DiagramFrame";
import { ArrowDefs, Label } from "./primitives";
import { Slider } from "./controls";

const bias2 = (x: number) => 8 * Math.exp(-0.55 * x) + 0.3;
const variance = (x: number) => 0.25 * Math.exp(0.42 * x) * 0.35 + 0.2;
const total = (x: number) => bias2(x) + variance(x) + 0.3;

export default function InteractiveBiasVariance() {
  const [x, setX] = useState(5);
  const width = 560;
  const height = 320;
  const padL = 50;
  const padB = 40;
  const padT = 16;
  const padR = 20;
  const xMax = 10;
  const yMax = 10;
  const px = (v: number) => padL + (v / xMax) * (width - padL - padR);
  const py = (v: number) => height - padB - (Math.min(v, yMax) / yMax) * (height - padB - padT);

  const mkPath = (f: (v: number) => number) => {
    const pts: string[] = [];
    for (let v = 0; v <= xMax; v += 0.2) pts.push(`${px(v).toFixed(1)},${py(f(v)).toFixed(1)}`);
    return "M " + pts.join(" L ");
  };

  let minX = 0;
  let minY = Infinity;
  for (let v = 0; v <= xMax; v += 0.1) {
    const t = total(v);
    if (t < minY) {
      minY = t;
      minX = v;
    }
  }

  const zone = x < minX - 1.2 ? "과소적합(underfitting)" : x > minX + 1.2 ? "과적합(overfitting)" : "적정 복잡도 근처";
  const zoneColor = x < minX - 1.2 ? colors.blue : x > minX + 1.2 ? colors.orange : colors.violet;

  return (
    <DiagramFrame
      title="편향-분산 트레이드오프"
      viewBox={`0 0 ${width} ${height}`}
      interactive
      caption={`슬라이더로 모델 복잡도를 움직여보세요. 복잡도 ${x.toFixed(1)}에서 편향²=${bias2(x).toFixed(2)}, 분산=${variance(x).toFixed(2)}, 총 오차=${total(x).toFixed(2)} — 지금은 "${zone}" 구간이다.`}
      controls={<Slider label="모델 복잡도" value={x} min={0} max={10} step={0.1} onChange={setX} format={(v) => v.toFixed(1)} color={zoneColor} />}
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

      {/* 현재 선택 위치 마커 */}
      <line x1={px(x)} y1={padT} x2={px(x)} y2={height - padB} stroke={zoneColor} strokeWidth={1.4} strokeDasharray="2 3" />
      <circle cx={px(x)} cy={py(total(x))} r={6} fill={zoneColor} stroke="#fff" strokeWidth={1.5} />
    </DiagramFrame>
  );
}
