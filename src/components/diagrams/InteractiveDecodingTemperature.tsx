"use client";

import { useState } from "react";
import DiagramFrame, { colors, ink, inkMuted, gridline } from "./DiagramFrame";
import { Slider } from "./controls";

const LOGITS = [3.0, 2.0, 1.0, 0.0, -1.0];
const LABELS = ["사과", "바나나", "포도", "수박", "딸기"];

function softmax(logits: number[], T: number) {
  const exps = logits.map((z) => Math.exp(z / T));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function InteractiveDecodingTemperature() {
  const [temp, setTemp] = useState(1.0);
  const probs = softmax(LOGITS, temp);
  const width = 420;
  const height = 260;
  const barW = 48;
  const gap = 22;
  const baseY = 210;
  const maxH = 160;
  const startX = 30;

  const barColor = temp < 0.6 ? colors.blue : temp < 1.4 ? colors.aqua : colors.orange;
  const mood =
    temp < 0.5
      ? "낮은 온도: 거의 항상 1등 토큰만 고른다 (결정적, 지루하지만 안전)"
      : temp < 1.3
        ? "적당한 온도: 그럴듯한 후보들 사이에서 적당히 다양하게 고른다"
        : "높은 온도: 분포가 평평해져 낮은 확률의 토큰도 자주 뽑힌다 (다양하지만 엉뚱해질 위험)";

  return (
    <DiagramFrame
      title="Temperature가 다음 토큰 확률분포에 미치는 영향"
      viewBox={`0 0 ${width} ${height}`}
      interactive
      caption={`"나는 __를 먹었다"의 다음 단어 후보 5개에 대한 모델의 원점수(logit)는 고정되어 있다. Temperature(T)는 이 점수를 확률로 바꾸는 softmax(zᵢ/T)에서 나누는 값이다. ${mood}`}
      controls={
        <Slider label="Temperature (T)" value={temp} min={0.1} max={2.5} step={0.05} onChange={setTemp} format={(v) => v.toFixed(2)} color={barColor} />
      }
    >
      <line x1={startX - 10} y1={baseY} x2={startX + LABELS.length * (barW + gap)} y2={baseY} stroke={gridline} />
      {probs.map((p, i) => {
        const h = Math.max(1, p * maxH);
        const x = startX + i * (barW + gap);
        return (
          <g key={i}>
            <text x={x + barW / 2} y={baseY - h - 10} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {(p * 100).toFixed(0)}%
            </text>
            <rect x={x} y={baseY - h} width={barW} height={h} rx={5} fill={barColor} style={{ transition: "height 120ms, y 120ms" }} />
            <text x={x + barW / 2} y={baseY + 20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {LABELS[i]}
            </text>
            <text x={x + barW / 2} y={baseY + 34} textAnchor="middle" fontSize={9.5} fill={inkMuted}>
              logit {LOGITS[i].toFixed(1)}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}
