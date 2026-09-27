"use client";

import { useState } from "react";
import DiagramFrame, { colors, inkSecondary, inkMuted, gridline } from "./DiagramFrame";
import { ArrowDefs, Arrow, Label } from "./primitives";
import { PresetButtons, ControlRow } from "./controls";

const LR_OPTIONS = [0.01, 0.1, 0.5, 0.9, 1.1];
const START_W = 0;
const MAX_STEPS = 9;

export default function InteractiveGradientDescent() {
  const [lr, setLr] = useState(0.1);

  const width = 520;
  const height = 320;
  const padL = 50;
  const padB = 34;
  const padT = 16;
  const padR = 20;
  const xMin = -4;
  const xMax = 10;
  const yMax = 40;
  const px = (w: number) => padL + ((clampX(w) - xMin) / (xMax - xMin)) * (width - padL - padR);
  const py = (L: number) => height - padB - (clampY(L) / yMax) * (height - padB - padT);
  function clampX(w: number) {
    return Math.max(xMin, Math.min(xMax, w));
  }
  function clampY(L: number) {
    return Math.max(0, Math.min(yMax, L));
  }

  const curvePts: [number, number][] = [];
  for (let w = xMin; w <= xMax; w += 0.1) {
    curvePts.push([w, (w - 3) ** 2]);
  }
  const path = curvePts.map(([w, L], i) => `${i === 0 ? "M" : "L"} ${px(w).toFixed(1)} ${py(L).toFixed(1)}`).join(" ");

  // w_{t+1} - 3 = (1 - 2η)(w_t - 3) — 매 스텝 이 배율로 곱해지므로, 이 배율의
  // 절댓값이 1 이상이면(η가 0 이하이거나 1 이상이면) 오차가 줄지 않고
  // 커지기만 한다. 이것이 "발산"의 정확한 기준이다.
  const diverged = Math.abs(1 - 2 * lr) >= 1;
  const steps: number[] = [START_W];
  for (let i = 0; i < MAX_STEPS; i++) {
    const w = steps[steps.length - 1];
    const grad = 2 * (w - 3);
    const next = w - lr * grad;
    steps.push(next);
    if (Math.abs(next - 3) > 1e6) break;
  }
  const finalW = steps[steps.length - 1];
  const converged = !diverged && Math.abs(finalW - 3) < 0.05;

  return (
    <DiagramFrame
      title="경사하강법: L(w) = (w − 3)² 을 최소화"
      viewBox={`0 0 ${width} ${height}`}
      interactive
      caption={
        diverged
          ? `η(학습률)=${lr}처럼 너무 크면 한 걸음이 최솟값을 지나쳐 점점 더 멀어진다. 이것이 "발산"이다.`
          : converged
            ? `η=${lr}일 때 w=0에서 시작해 ${steps.length - 1}번 만에 최솟값 w=3 근처로 수렴했다. 점 사이 간격이 점점 좁아지는 것에 주목.`
            : `η=${lr}은 너무 작아서 ${MAX_STEPS}번을 움직여도 아직 w=3에 도달하지 못했다. 더 많은 스텝이 필요하다.`
      }
      controls={
        <ControlRow>
          <PresetButtons
            label="학습률 η(eta)를 눌러 바꿔 보십시오"
            options={LR_OPTIONS}
            value={lr}
            onChange={setLr}
            formatLabel={(v) => String(v)}
          />
        </ControlRow>
      }
    >
      <ArrowDefs />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={gridline} strokeWidth={1} />
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={gridline} strokeWidth={1} />
      <Label x={width / 2} y={height - 6} text="w" color={inkMuted} />
      <Label x={16} y={padT + 8} text="L" color={inkMuted} anchor="start" />
      <line x1={px(3)} y1={py(0)} x2={px(3)} y2={padT} stroke={gridline} strokeDasharray="3 3" />
      <Label x={px(3)} y={height - padB + 16} text="w*=3" color={inkSecondary} />
      <path d={path} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      {steps.map((w, i) => (
        <g key={i}>
          <circle cx={px(w)} cy={py((w - 3) ** 2)} r={4} fill={diverged ? colors.red : colors.orange} />
          {i < steps.length - 1 && (
            <Arrow
              x1={px(w)}
              y1={py((w - 3) ** 2)}
              x2={px(steps[i + 1])}
              y2={py((steps[i + 1] - 3) ** 2)}
              color={diverged ? colors.red : colors.orange}
              strokeWidth={1.3}
            />
          )}
        </g>
      ))}
      <Label x={px(0) - 4} y={py(9) - 10} text="w₀=0" color={colors.orange} anchor="start" weight={700} />
      {diverged && (
        <text x={width / 2} y={padT + 18} textAnchor="middle" fontSize={13} fontWeight={800} fill={colors.red}>
          발산! (그래프 밖으로 튕겨나갔어요)
        </text>
      )}
    </DiagramFrame>
  );
}
