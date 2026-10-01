import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
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

export function XorHidden() {
  // XOR: 입력 공간에서는 직선 하나로 못 가르지만, ReLU 은닉층 h = (ReLU(x1+x2), ReLU(x1+x2−1))을 지나면 가를 수 있다.
  const pts = [
    { x: [0, 0], h: [0, 0], y: 0, label: "(0,0)" },
    { x: [0, 1], h: [1, 0], y: 1, label: "(0,1)" },
    { x: [1, 0], h: [1, 0], y: 1, label: "(1,0)" },
    { x: [1, 1], h: [2, 1], y: 0, label: "(1,1)" },
  ];
  const panel = (ox: number, title: string, axis: [string, string], max: number, key: "x" | "h", line?: [number, number, number, number]) => {
    const size = 200;
    const top = 40;
    const sx = (v: number) => ox + 20 + (v / max) * (size - 40);
    const sy = (v: number) => top + size - 20 - (v / max) * (size - 40);
    return (
      <g>
        <text x={ox + size / 2} y={24} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
          {title}
        </text>
        <line x1={ox} y1={top + size - 20} x2={ox + size} y2={top + size - 20} stroke="var(--border-strong)" />
        <line x1={ox + 20} y1={top} x2={ox + 20} y2={top + size} stroke="var(--border-strong)" />
        <text x={ox + size} y={top + size - 4} textAnchor="end" fontSize={11} fill={inkSecondary}>
          {axis[0]}
        </text>
        <text x={ox + 26} y={top + 10} fontSize={11} fill={inkSecondary}>
          {axis[1]}
        </text>
        {line && <line x1={sx(line[0])} y1={sy(line[1])} x2={sx(line[2])} y2={sy(line[3])} stroke={colors.green} strokeWidth={2} strokeDasharray="6 4" />}
        {pts.map((p, i) => {
          const [a, b] = p[key];
          const dup = key === "h" && p.label === "(1,0)";
          return (
            <g key={i}>
              <circle cx={sx(a)} cy={sy(b)} r={9} fill={p.y ? colors.orange : colors.blue} fillOpacity={0.85} stroke="var(--surface-card)" strokeWidth={2} />
              {!dup && (
                <text x={sx(a) + 13} y={sy(b) - 9} fontSize={10.5} fill={ink}>
                  {key === "h" && p.label === "(0,1)" ? "(0,1), (1,0)" : p.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <DiagramFrame
      title="XOR: 은닉층이 공간을 바꿔 직선 하나로 가를 수 있게 만든다"
      caption="왼쪽 입력 공간에서는 주황(출력 1)과 파랑(출력 0)을 직선 하나로 가를 수 없다. ReLU 은닉층을 지나면 (0,1)과 (1,0)이 한 점으로 모이고 (1,1)이 멀리 밀려나, 오른쪽처럼 직선 h1 − 2h2 = 0.5(점선) 하나로 갈라진다."
      viewBox="0 0 560 270"
      minWidth={440}
    >
      <ArrowDefs />
      {panel(20, "입력 공간 (x1, x2)", ["x1", "x2"], 1.2, "x")}
      <Arrow x1={240} y1={140} x2={300} y2={140} />
      <text x={270} y={128} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        ReLU 은닉층
      </text>
      {panel(330, "은닉 공간 (h1, h2)", ["h1", "h2"], 2.4, "h", [0.5, 0, 2.4, 0.95])}
    </DiagramFrame>
  );
}
