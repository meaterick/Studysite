"use client";

import { useState } from "react";
import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

const TOKENS = ["고양이가", "생선을", "맛있게", "먹었다"];

// 토큰 4개짜리 장난감 예시의 attention 가중치(각 행의 합=1). "생선을" 행은
// 5주차 본문의 숫자 예제(q=[1,1,0,1], dk=4)를 softmax로 계산한 값과 같고,
// 나머지 행은 "쿼리를 클릭하면 결과가 바뀐다"는 메커니즘을 체감하도록 손으로 정했다.
const WEIGHTS = [
  [0.62, 0.13, 0.05, 0.2],
  [0.19, 0.51, 0.11, 0.19],
  [0.05, 0.15, 0.4, 0.4],
  [0.08, 0.6, 0.12, 0.2],
];

export default function InteractiveAttention() {
  const [query, setQuery] = useState(3);
  const tokX = [80, 220, 360, 500];
  const tokY = 40;
  const weights = WEIGHTS[query];

  return (
    <DiagramFrame
      title="Self-Attention: Query가 Key들과의 유사도로 Value를 가중합"
      viewBox="0 0 620 300"
      interactive
      caption={`토큰을 클릭해 Query를 바꿔보세요. 지금은 "${TOKENS[query]}"이(가) Query다 — 화살표가 굵을수록 그 토큰에 더 주목(가중치가 크다)한다는 뜻이다. 실제 Transformer에서는 이 가중치를 softmax(Q·Kᵀ/√dk)로 계산한다.`}
    >
      <ArrowDefs />
      {TOKENS.map((t, i) => (
        <g key={i} style={{ cursor: "pointer" }} onClick={() => setQuery(i)}>
          <Box
            x={tokX[i] - 44}
            y={tokY}
            w={88}
            h={38}
            label={t}
            fill={i === query ? colors.violet : card2Bg}
            labelColor={i === query ? "#fff" : ink}
          />
          <Label x={tokX[i]} y={tokY + 56} text={i === query ? "Query (클릭해서 변경)" : "Key / Value"} color={i === query ? colors.violet : inkSecondary} size={10} />
        </g>
      ))}
      {TOKENS.map((_, i) => (
        <Arrow
          key={i}
          x1={tokX[query]}
          y1={tokY + 38 + 18}
          x2={tokX[i]}
          y2={170}
          color={colors.orange}
          strokeWidth={0.6 + weights[i] * 4}
        />
      ))}
      {TOKENS.map((_, i) => (
        <Label key={i} x={(tokX[query] + tokX[i]) / 2} y={170 - 8} text={`${(weights[i] * 100).toFixed(0)}%`} color={colors.orange} weight={700} size={11} />
      ))}
      <Box x={tokX[1] + (tokX[2] - tokX[1]) / 2 - 70} y={210} w={140} h={44} label="출력" sub="Σ 가중치 × Value" fill={colors.blue} labelColor="#fff" subColor="#eaf2fd" />
      <Label x={310} y={280} text="softmax(Q·Kᵀ / √dk) · V" color={inkMuted} size={11} />
    </DiagramFrame>
  );
}
