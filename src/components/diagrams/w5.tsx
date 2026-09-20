import DiagramFrame, { colors, ink, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

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
