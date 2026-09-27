import DiagramFrame, { colors, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function ComputationalGraph() {
  const y = 110;
  const h = 50;
  return (
    <DiagramFrame
      title="계산 그래프와 역전파: L = (x·w + c − y)²"
      viewBox="0 0 720 260"
      caption="순전파(파란 화살표)로 값을 계산하고, 역전파(주황 화살표)로 국소 미분 × 상류 기울기를 뒤에서 앞으로 전달한다."
    >
      <ArrowDefs />
      <Box x={20} y={20} w={70} h={44} label="x" fill={card2Bg} />
      <Box x={20} y={196} w={70} h={44} label="w" fill={card2Bg} />
      <Box x={170} y={y} w={80} h={h} label="[ * ]" sub="a = x·w" fill={card2Bg} />
      <Box x={320} y={y} w={80} h={h} label="[ + ]" sub="b = a+c" fill={card2Bg} />
      <Box x={470} y={y} w={90} h={h} label="[ (·−y)² ]" sub="L = (b−y)²" fill={card2Bg} />
      <Box x={320} y={20} w={80} h={44} label="c" fill={card2Bg} />
      <Box x={630} y={y} w={70} h={h} label="L" fill={colors.violet} labelColor="#fff" />

      {/* forward */}
      <Arrow x1={90} y1={42} x2={165} y2={y + 14} color={colors.blue} />
      <Arrow x1={90} y1={218} x2={165} y2={y + 36} color={colors.blue} />
      <Arrow x1={250} y1={y + h / 2} x2={315} y2={y + h / 2} color={colors.blue} />
      <Arrow x1={360} y1={42} x2={355} y2={y + 4} color={colors.blue} />
      <Arrow x1={400} y1={y + h / 2} x2={465} y2={y + h / 2} color={colors.blue} />
      <Arrow x1={560} y1={y + h / 2} x2={625} y2={y + h / 2} color={colors.blue} />

      {/* backward labels */}
      <Label x={585} y={y - 10} text="dL/db = 2(b−y)" color={colors.orange} size={10.5} anchor="middle" />
      <Label x={435} y={y - 10} text="dL/da·1, dL/dc·1" color={colors.orange} size={10.5} anchor="middle" />
      <Label x={285} y={y - 10} text="dL/dw = dL/da · x" color={colors.orange} size={10.5} anchor="middle" />
      <Label x={130} y={y + h + 24} text="dL/dx = dL/da · w" color={colors.orange} size={10.5} anchor="middle" />
      <Label x={360} y={210} text="규칙: [+] 는 기울기를 그대로 분배 · [*] 는 상대편 값을 곱해 전달" color={inkMuted} size={11} />
    </DiagramFrame>
  );
}

export function MlpDiagram() {
  const inX = 70;
  const hidX = 300;
  const outX = 540;
  const inYs = [40, 110, 180];
  const hidYs = [20, 80, 140, 200];
  const outYs = [110];
  return (
    <DiagramFrame
      title="다층 퍼셉트론(MLP) 순전파"
      viewBox="0 0 640 240"
      caption="h = φ(W1x + b1), ŷ = W2h + b2. 비선형 활성화 φ가 없으면 여러 층을 쌓아도 한 층과 표현력이 같다."
    >
      <ArrowDefs />
      {inYs.map((y1, i) =>
        hidYs.map((y2, j) => (
          <line key={`${i}-${j}`} x1={inX + 18} y1={y1} x2={hidX - 18} y2={y2} stroke="var(--border-hairline)" strokeWidth={1} />
        ))
      )}
      {hidYs.map((y1, j) => (
        <line key={`h-${j}`} x1={hidX + 18} y1={y1} x2={outX - 18} y2={outYs[0]} stroke="var(--border-hairline)" strokeWidth={1} />
      ))}
      {inYs.map((y, i) => (
        <circle key={i} cx={inX} cy={y} r={18} fill={colors.blue} />
      ))}
      {hidYs.map((y, i) => (
        <circle key={i} cx={hidX} cy={y} r={18} fill={colors.aqua} />
      ))}
      <circle cx={outX} cy={outYs[0]} r={18} fill={colors.violet} />
      <Label x={inX} y={230} text="입력 x (3)" color={inkSecondary} />
      <Label x={hidX} y={230} text="은닉층 h = φ(W1x+b1) (4)" color={inkSecondary} />
      <Label x={outX} y={230} text="출력 ŷ (1)" color={inkSecondary} />
    </DiagramFrame>
  );
}
