import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function AttentionQkv() {
  const tokens = ["나는", "사과를", "먹었다"];
  const weights = [0.08, 0.75, 0.17]; // attention from "먹었다" query
  const tokX = [80, 220, 360];
  const tokY = 40;
  return (
    <DiagramFrame
      title="Self-Attention: Query가 Key들과의 유사도로 Value를 가중합"
      viewBox="0 0 620 280"
      caption="질의(먹었다)가 각 Key와 내적한 뒤 softmax(QKᵀ/√dk)로 가중치를 얻고, 그 가중치로 Value들을 합쳐 출력을 만든다."
    >
      <ArrowDefs />
      {tokens.map((t, i) => (
        <g key={i}>
          <Box x={tokX[i] - 44} y={tokY} w={88} h={38} label={t} fill={i === 2 ? colors.violet : card2Bg} labelColor={i === 2 ? "#fff" : ink} />
          <Label x={tokX[i]} y={tokY + 56} text={i === 2 ? "Query" : "Key / Value"} color={i === 2 ? colors.violet : inkSecondary} size={10.5} />
        </g>
      ))}
      {tokens.map((_, i) => (
        <Arrow
          key={i}
          x1={tokX[2]}
          y1={tokY + 38 + 18}
          x2={tokX[i]}
          y2={150}
          color={colors.orange}
          strokeWidth={1 + weights[i] * 3}
        />
      ))}
      {tokens.map((t, i) => (
        <Label key={i} x={(tokX[2] + tokX[i]) / 2} y={150 - 8} text={`${(weights[i] * 100).toFixed(0)}%`} color={colors.orange} weight={700} size={11} />
      ))}
      <Box x={tokX[1] - 70} y={190} w={140} h={44} label="출력" sub="Σ 가중치 × Value" fill={colors.blue} labelColor="#fff" subColor="#eaf2fd" />
      <Label x={310} y={260} text='softmax(Q·Kᵀ / √dk) · V   — "먹었다"는 "사과를"에 75% 주목' color={inkMuted} size={11} />
    </DiagramFrame>
  );
}

export function TransformerDecoderBlock() {
  const x = 210;
  const w = 200;
  const steps = [
    { label: "토큰 임베딩 + 위치 정보", h: 36 },
    { label: "LayerNorm", h: 30 },
    { label: "Masked Multi-Head Attention", h: 40 },
    { label: "(+) 잔차 연결", h: 28 },
    { label: "LayerNorm", h: 30 },
    { label: "MLP (d → 4d → d, GELU)", h: 40 },
    { label: "(+) 잔차 연결", h: 28 },
  ];
  let y = 16;
  const positions = steps.map((s) => {
    const py = y;
    y += s.h + 10;
    return py;
  });
  return (
    <DiagramFrame
      title="GPT형 디코더 블록 (× N 층 반복)"
      viewBox="0 0 620 420"
      caption="이 블록을 N번 쌓은 뒤 LayerNorm → Linear(d→어휘크기) → softmax로 다음 토큰 확률을 얻는다."
    >
      <ArrowDefs />
      {steps.map((s, i) => (
        <g key={i}>
          <Box
            x={x}
            y={positions[i]}
            w={w}
            h={s.h}
            label={s.label}
            fill={s.label.includes("잔차") ? colors.violet : s.label.includes("Attention") ? colors.blue : s.label.includes("MLP") ? colors.aqua : card2Bg}
            labelColor={s.label.includes("잔차") || s.label.includes("Attention") || s.label.includes("MLP") ? "#fff" : ink}
            fontSize={11.5}
          />
          {i < steps.length - 1 && (
            <Arrow x1={x + w / 2} y1={positions[i] + s.h} x2={x + w / 2} y2={positions[i + 1]} />
          )}
        </g>
      ))}
      <Arrow x1={x + w / 2} y1={positions[positions.length - 1] + steps[steps.length - 1].h} x2={x + w / 2} y2={380} />
      <Box x={x} y={380} w={w} h={30} label="LayerNorm → Linear → softmax" fill={colors.orange} labelColor="#fff" fontSize={10.5} />
      <Label x={x + w + 40} y={positions[3] + 14} text="× N층" color={inkMuted} weight={700} anchor="start" />
    </DiagramFrame>
  );
}

export function TokenizerBpe() {
  const stages = [
    { label: "l o w   l o w e r   l o w e s t", note: "문자 단위 시작" },
    { label: "[lo] w   [lo] w e r   [lo] w e s t", note: "가장 빈번한 쌍 'l o' 병합" },
    { label: "[low]   [low] e r   [low] e s t", note: "'lo w' 병합" },
    { label: "[low]   [low][er]   [low][est]", note: "'e r', 'e s t' 순으로 병합" },
  ];
  return (
    <DiagramFrame
      title="BPE(Byte-Pair Encoding) 토크나이저"
      viewBox="0 0 640 260"
      caption="가장 빈번하게 붙어 나오는 문자 쌍을 반복적으로 병합해 어휘를 만든다. 어휘 크기와 시퀀스 길이는 절충 관계."
    >
      {stages.map((s, i) => (
        <g key={i}>
          <rect x={20} y={20 + i * 58} width={600} height={44} rx={8} fill="var(--surface-card-2)" stroke="var(--border-hairline)" />
          <text x={36} y={20 + i * 58 + 27} fontSize={13} fontFamily="var(--font-mono-code)" fill={ink}>
            {s.label}
          </text>
          <text x={584} y={20 + i * 58 + 27} fontSize={10.5} textAnchor="end" fill={colors.orange}>
            {s.note}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}
