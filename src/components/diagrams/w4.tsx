import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function ConvOperation() {
  const cell = 34;
  const inX = 30;
  const inY = 30;
  const inN = 5;
  const kernelHi = { r: 1, c: 1 }; // highlighted 3x3 patch top-left at row1,col1
  const outX = 420;
  const outY = 60;
  const outCell = 40;
  const outN = 3;
  return (
    <DiagramFrame
      title="합성곱 연산: 5×5 입력 · 3×3 커널 → 3×3 출력"
      viewBox="0 0 620 240"
      caption="출력 크기 = floor((N + 2P − K)/S) + 1. 커널 가중치는 위치와 무관하게 전체 입력에서 공유된다."
    >
      <ArrowDefs />
      {Array.from({ length: inN }).map((_, r) =>
        Array.from({ length: inN }).map((_, c) => {
          const inPatch = r >= kernelHi.r && r < kernelHi.r + 3 && c >= kernelHi.c && c < kernelHi.c + 3;
          return (
            <rect
              key={`${r}-${c}`}
              x={inX + c * cell}
              y={inY + r * cell}
              width={cell}
              height={cell}
              fill={inPatch ? colors.blue : card2Bg}
              opacity={inPatch ? 0.28 : 1}
              stroke={gridline}
            />
          );
        })
      )}
      <rect
        x={inX + kernelHi.c * cell}
        y={inY + kernelHi.r * cell}
        width={cell * 3}
        height={cell * 3}
        fill="none"
        stroke={colors.blue}
        strokeWidth={2.4}
      />
      <Label x={inX + (inN * cell) / 2} y={inY + inN * cell + 22} text="입력 5×5" color={inkSecondary} />

      <Label x={inX + inN * cell + 55} y={inY + kernelHi.r * cell + 55} text="⊙ +b →" color={inkMuted} size={16} />

      {Array.from({ length: outN }).map((_, r) =>
        Array.from({ length: outN }).map((_, c) => (
          <rect
            key={`o-${r}-${c}`}
            x={outX + c * outCell}
            y={outY + r * outCell}
            width={outCell}
            height={outCell}
            fill={r === 0 && c === 0 ? colors.blue : card2Bg}
            opacity={r === 0 && c === 0 ? 0.85 : 1}
            stroke={gridline}
          />
        ))
      )}
      <Label x={outX + (outN * outCell) / 2} y={outY + outN * outCell + 22} text="출력 3×3" color={inkSecondary} />
      <Arrow x1={inX + inN * cell + 10} y1={inY + kernelHi.r * cell + 50} x2={outX - 14} y2={outY + outCell / 2} color={colors.blue} />
    </DiagramFrame>
  );
}

export function ResNetSkip() {
  const x = 260;
  const w = 140;
  return (
    <DiagramFrame
      title="ResNet 잔차 연결(Residual Connection)"
      viewBox="0 0 560 340"
      caption="y = F(x) + x. 역전파 시 dL/dx = dL/dy · (F′(x) + 1) — '+1' 항이 기울기가 사라지지 않도록 지름길을 만든다."
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
      caption="① 특징추출: 백본을 얼리고(freeze) 마지막 층만 학습 — 데이터가 매우 적을 때. ② 파인튜닝: 작은 학습률로 전체(또는 상위층)까지 갱신."
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
