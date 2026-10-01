import DiagramFrame, { colors, ink, inkSecondary, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function ResNetSkip() {
  const x = 260;
  const w = 140;
  return (
    <DiagramFrame
      title="ResNet 잔차 연결(Residual Connection)"
      viewBox="0 0 560 340"
      caption="y = F(x) + x. 역전파 시 dL/dx = dL/dy · (F′(x) + 1)이며, '+1' 항이 기울기가 사라지지 않도록 지름길을 만든다."
    >
      <ArrowDefs />
      <Box x={x} y={16} w={w} h={40} label="입력 x" fill={card2Bg} />
      <Box x={x} y={90} w={w} h={40} label="Conv – BN – ReLU" fill={card2Bg} fontSize={11.5} />
      <Box x={x} y={150} w={w} h={40} label="Conv – BN" fill={card2Bg} fontSize={11.5} />
      <Box x={x} y={230} w={w} h={40} label="(+)  y = F(x) + x" fill={colors.violet} labelColor="#fff" fontSize={12} />
      <Box x={x} y={290} w={w} h={36} label="ReLU" fill={card2Bg} />

      <Arrow x1={x + w / 2} y1={56} x2={x + w / 2} y2={88} />
      <Arrow x1={x + w / 2} y1={130} x2={x + w / 2} y2={148} />
      <Arrow x1={x + w / 2} y1={190} x2={x + w / 2} y2={228} />
      <Arrow x1={x + w / 2} y1={270} x2={x + w / 2} y2={288} />

      {/* skip path */}
      <path
        d={`M ${x} 36 C 60 36, 60 250, ${x} 250`}
        fill="none"
        stroke={colors.orange}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      <Label x={100} y={150} text="skip connection" color={colors.orange} weight={700} anchor="middle" />
    </DiagramFrame>
  );
}

export function TransferLearning() {
  const blocks = ["Conv 블록 1", "Conv 블록 2", "Conv 블록 3", "FC (새 클래스 수)"];
  const y = 100;
  const w = 120;
  const gap = 20;
  return (
    <DiagramFrame
      title="전이학습: 사전학습된 백본 + 새 분류 헤드"
      viewBox="0 0 620 220"
      caption="① 특징추출: 백본을 얼리고(freeze) 마지막 층만 학습(데이터가 매우 적을 때). ② 파인튜닝: 작은 학습률로 전체(또는 상위층)까지 갱신."
    >
      <ArrowDefs />
      {blocks.map((b, i) => {
        const x = 20 + i * (w + gap);
        const isHead = i === blocks.length - 1;
        return (
          <g key={i}>
            <Box
              x={x}
              y={y}
              w={w}
              h={56}
              label={b}
              sub={isHead ? "새로 학습" : "ImageNet 사전학습"}
              fill={isHead ? colors.orange : card2Bg}
              labelColor={isHead ? "#fff" : ink}
              subColor={isHead ? "#fff" : inkSecondary}
              fontSize={11.5}
              subSize={9.5}
            />
            {!isHead && (
              <rect x={x} y={y - 14} width={w} height={8} fill={colors.blue} opacity={0.7} rx={2} />
            )}
            {i < blocks.length - 1 && <Arrow x1={x + w} y1={y + 28} x2={x + w + gap - 4} y2={y + 28} />}
          </g>
        );
      })}
      <Label x={20} y={y - 24} text="파란 막대 = freeze(특징추출 모드)" color={colors.blue} anchor="start" />
    </DiagramFrame>
  );
}

export function ConvChannels() {
  // 다채널 합성곱: 커널 하나는 입력 채널 수만큼 깊이를 갖고, 그 결과는 출력 채널 하나다. 커널 수 = 출력 채널 수.
  const layer = (x: number, y: number, w: number, h: number, depth: number, color: string, label: string, sub: string) => (
    <g>
      {Array.from({ length: depth }, (_, d) => (
        <rect key={d} x={x + d * 8} y={y - d * 8} width={w} height={h} rx={3} fill={color} fillOpacity={0.12 + d * 0.06} stroke={color} />
      ))}
      <text x={x + w / 2 + (depth - 1) * 4} y={y + h + 20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        {label}
      </text>
      <text x={x + w / 2 + (depth - 1) * 4} y={y + h + 36} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {sub}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="채널이 여러 개일 때의 합성곱"
      caption="RGB 입력처럼 채널이 3개면 커널 하나도 3×3×3 크기다. 세 채널에서 곱한 값을 모두 더해 출력의 한 칸을 만든다. 이런 커널을 64개 쓰면 출력 채널도 64개가 되고, 파라미터는 (3×3×3 + 편향 1) × 64 = 1,792개다."
      viewBox="0 0 680 230"
      minWidth={500}
    >
      <ArrowDefs />
      {layer(30, 60, 110, 110, 3, colors.blue, "입력 H × W × 3", "R · G · B 채널")}
      <text x={195} y={112} textAnchor="middle" fontSize={20} fontWeight={700} fill={ink}>
        ⊛
      </text>
      {layer(230, 90, 46, 46, 3, colors.orange, "커널 3 × 3 × 3", "× 64개")}
      <text x={232} y={52} fontSize={10.5} fill={inkSecondary}>
        커널 하나 = 입력 채널 수만큼의 깊이
      </text>
      <Arrow x1={320} y1={115} x2={380} y2={115} />
      <text x={350} y={104} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        채널 합
      </text>
      {layer(410, 50, 100, 100, 6, colors.violet, "출력 H′ × W′ × 64", "커널 하나 → 출력 채널 하나")}
    </DiagramFrame>
  );
}
