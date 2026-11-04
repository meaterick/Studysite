"use client";

import { useState } from "react";
import DiagramFrame, { colors, inkSecondary, inkMuted, gridline, card2Bg, ink } from "./DiagramFrame";
import { Arrow, Label, ArrowDefs } from "./primitives";

// 세로 경계(밝음→어두움)를 검출하는 장난감 3x3 커널과 5x5 입력.
const INPUT = [
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
];
const KERNEL = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
];
const OUT_N = 3;

function conv(r: number, c: number) {
  let sum = 0;
  const terms: string[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const v = INPUT[r + i][c + j];
      const k = KERNEL[i][j];
      sum += v * k;
      if (k !== 0) terms.push(`${v}×${k}`);
    }
  }
  return { sum, terms };
}

export default function InteractiveConv() {
  const [sel, setSel] = useState({ r: 0, c: 1 });
  const cell = 34;
  const inX = 30;
  const inY = 30;
  const inN = 5;
  const outX = 440;
  const outY = 66;
  const outCell = 40;
  const { sum, terms } = conv(sel.r, sel.c);

  return (
    <DiagramFrame
      title="합성곱 연산: 5×5 입력 · 3×3 커널 → 3×3 출력"
      viewBox="0 0 640 260"
      interactive
      caption={`출력 칸을 클릭해 커널이 슬라이딩하는 위치를 바꿔 보십시오. 지금은 (${sel.r + 1}, ${sel.c + 1}) 위치: ${terms.join(" + ")} = ${sum}. 왼쪽(밝음)에서 오른쪽(어두움)으로 바뀌는 세로 경계에서 값이 커지는 것을 확인해 보십시오.`}
    >
      <ArrowDefs />
      {INPUT.map((row, r) =>
        row.map((v, c) => {
          const inPatch = r >= sel.r && r < sel.r + 3 && c >= sel.c && c < sel.c + 3;
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={inX + c * cell}
                y={inY + r * cell}
                width={cell}
                height={cell}
                fill={v ? "var(--surface-card-2)" : "var(--surface-card)"}
                stroke={gridline}
              />
              <text x={inX + c * cell + cell / 2} y={inY + r * cell + cell / 2 + 4} textAnchor="middle" fontSize={12} fill={inkMuted}>
                {v}
              </text>
              {inPatch && <rect x={inX + c * cell} y={inY + r * cell} width={cell} height={cell} fill={colors.blue} opacity={0.22} />}
            </g>
          );
        })
      )}
      <rect x={inX + sel.c * cell} y={inY + sel.r * cell} width={cell * 3} height={cell * 3} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <Label x={inX + (inN * cell) / 2} y={inY + inN * cell + 22} text="입력 5×5" color={inkSecondary} />

      <Label x={inX + inN * cell + 55} y={inY + sel.r * cell + 55} text="⊙ →" color={inkMuted} size={16} />

      {Array.from({ length: OUT_N }).map((_, r) =>
        Array.from({ length: OUT_N }).map((_, c) => {
          const { sum: v } = conv(r, c);
          const isSel = r === sel.r && c === sel.c;
          return (
            <g key={`o-${r}-${c}`} style={{ cursor: "pointer" }} onClick={() => setSel({ r, c })}>
              <rect
                x={outX + c * outCell}
                y={outY + r * outCell}
                width={outCell}
                height={outCell}
                fill={isSel ? colors.blue : card2Bg}
                opacity={isSel ? 0.85 : 1}
                stroke={isSel ? colors.blue : gridline}
                strokeWidth={isSel ? 2 : 1}
              />
              <text x={outX + c * outCell + outCell / 2} y={outY + r * outCell + outCell / 2 + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={isSel ? "#fff" : ink}>
                {v}
              </text>
            </g>
          );
        })
      )}
      <Label x={outX + (OUT_N * outCell) / 2} y={outY + OUT_N * outCell + 22} text="출력 3×3 (클릭해 보십시오)" color={colors.blue} weight={700} />
      <Arrow x1={inX + inN * cell + 10} y1={inY + sel.r * cell + 50} x2={outX - 14} y2={outY + sel.r * outCell + outCell / 2} color={colors.blue} />
    </DiagramFrame>
  );
}
