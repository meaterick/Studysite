"use client";

import { useState } from "react";
import DiagramFrame, { colors, ink, inkSecondary, inkMuted } from "./DiagramFrame";
import { Axes, linear, linePath, normCdf } from "./chart";
import { Slider, ControlRow } from "./controls";

// 정상 메일(음성)과 스팸(양성)의 점수가 각각 정규분포 N(0.35, 0.12²), N(0.65, 0.12²)를 따른다고 가정한 장난감 모델.
// 임계값 t 이상을 스팸으로 판정하면 TPR = P(양성 점수 ≥ t), FPR = P(음성 점수 ≥ t)다.
const MU_NEG = 0.35;
const MU_POS = 0.65;
const SD = 0.12;
const PRIOR = 0.3; // 스팸 비율(「분류 평가지표」 예제의 30%)

const density = (x: number, mu: number) => Math.exp(-((x - mu) ** 2) / (2 * SD * SD)) / (SD * Math.sqrt(2 * Math.PI));
const tail = (t: number, mu: number) => 1 - normCdf((t - mu) / SD);

export default function InteractiveThreshold() {
  const [t, setT] = useState(0.5);
  const tpr = tail(t, MU_POS);
  const fpr = tail(t, MU_NEG);
  const precision = (PRIOR * tpr) / (PRIOR * tpr + (1 - PRIOR) * fpr);
  const auc = normCdf((MU_POS - MU_NEG) / (SD * Math.SQRT2));

  const D = { left: 34, top: 28, width: 340, height: 190 };
  const dx = linear(0, 1, D.left, D.left + D.width);
  const dy = linear(0, 3.6, D.top + D.height, D.top);
  const area = (mu: number, from: number, to: number) => {
    if (to <= from) return "";
    const n = 60;
    const pts: [number, number][] = [[dx(from), dy(0)]];
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n;
      pts.push([dx(x), dy(density(x, mu))]);
    }
    pts.push([dx(to), dy(0)]);
    return `${linePath(pts)} Z`;
  };
  const curve = (mu: number) => linePath(Array.from({ length: 121 }, (_, i) => [dx(i / 120), dy(density(i / 120, mu))] as [number, number]));

  const R = { left: 470, top: 28, width: 200, height: 190 };
  const rx = linear(0, 1, R.left, R.left + R.width);
  const ry = linear(0, 1, R.top + R.height, R.top);
  const roc = linePath(
    Array.from({ length: 141 }, (_, i) => {
      const tt = 1.2 - (i / 140) * 1.4;
      return [rx(tail(tt, MU_NEG)), ry(tail(tt, MU_POS))] as [number, number];
    }),
  );

  return (
    <DiagramFrame
      title="임계값을 움직이면: 혼동행렬의 네 칸과 ROC 곡선 위의 점"
      interactive
      viewBox="0 0 720 270"
      minWidth={560}
      controls={
        <ControlRow>
          <Slider label="임계값 t (이 점수 이상이면 '스팸')" value={t} min={0.05} max={0.95} step={0.01} onChange={setT} format={(v) => v.toFixed(2)} color="var(--series-violet)" />
        </ControlRow>
      }
      caption={`왼쪽은 정상 메일(파랑)과 스팸(주황)이 받는 점수의 분포, 보라 선이 임계값이다. 선 오른쪽의 진한 부분이 '스팸'으로 판정된 메일로, 주황 진한 부분이 TP, 파랑 진한 부분이 FP다. 지금 t = ${t.toFixed(2)}에서 TPR(Recall) = ${tpr.toFixed(3)}, FPR = ${fpr.toFixed(3)}, Precision = ${precision.toFixed(3)}(스팸 비율 30% 가정)이다. 임계값을 낮추면 놓치는 스팸은 줄지만 억울한 정상 메일이 늘어, 오른쪽 ROC 곡선 위의 점이 오른쪽 위로 미끄러진다. 곡선 자체(AUC ≈ ${auc.toFixed(2)})는 임계값과 무관한 모델의 변별력이다.`}
    >
      <Axes {...D} sx={dx} sy={dy} xTicks={[0, 0.25, 0.5, 0.75, 1]} grid={false} xLabel="모델 점수 (스팸일 확률)" />
      <path d={area(MU_NEG, 0, t)} fill={colors.blue} fillOpacity={0.1} />
      <path d={area(MU_NEG, t, 1)} fill={colors.blue} fillOpacity={0.45} />
      <path d={area(MU_POS, 0, t)} fill={colors.orange} fillOpacity={0.1} />
      <path d={area(MU_POS, t, 1)} fill={colors.orange} fillOpacity={0.45} />
      <path d={curve(MU_NEG)} fill="none" stroke={colors.blue} strokeWidth={2} />
      <path d={curve(MU_POS)} fill="none" stroke={colors.orange} strokeWidth={2} />
      <line x1={dx(t)} y1={D.top - 6} x2={dx(t)} y2={D.top + D.height} stroke={colors.violet} strokeWidth={2.4} />
      <text x={dx(MU_NEG)} y={dy(3.32) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        정상 메일
      </text>
      <text x={dx(MU_POS)} y={dy(3.32) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        스팸
      </text>
      <text x={D.left} y={D.top + D.height + 50} fontSize={11} fontWeight={700} fill={ink}>
        {`TPR = ${tpr.toFixed(2)} · FPR = ${fpr.toFixed(2)} · Precision = ${precision.toFixed(2)}`}
      </text>

      <text x={R.left + R.width / 2} y={16} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        ROC 곡선
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="FPR" yLabel="TPR (Recall)" />
      <line x1={rx(0)} y1={ry(0)} x2={rx(1)} y2={ry(1)} stroke={inkMuted} strokeDasharray="4 4" />
      <path d={roc} fill="none" stroke={inkSecondary} strokeWidth={2.2} />
      <circle cx={rx(fpr)} cy={ry(tpr)} r={7} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={2} />
      <text x={rx(0.55)} y={ry(0.32)} fontSize={11} fill={inkSecondary}>
        {`AUC ≈ ${auc.toFixed(2)}`}
      </text>
      <text x={rx(fpr) + 10} y={ry(tpr) + 16} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        {`t = ${t.toFixed(2)}`}
      </text>
    </DiagramFrame>
  );
}
