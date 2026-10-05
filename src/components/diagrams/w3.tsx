import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, mono, normCdf, pow10Label, GridCells } from "./chart";

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

// ───────────────────────── 3주차 핵심 과정: 추가 그림 ─────────────────────────

export function NeuronAnatomy() {
  // 본문 예: x = (2, 1), w = (0.5, −1), b = 0.1 → z = 0.1 → ReLU → 0.1
  const P = "nan";
  const relu = { x: 452, y: 82, w: 92, h: 66 };
  return (
    <DiagramFrame
      title="뉴런 하나가 하는 일: 곱하고, 더하고, 비선형으로 통과시키기"
      caption="입력마다 자기 가중치를 곱해(0.5×2 = 1, −1×1 = −1) 모두 더하고 편향 0.1을 더하면 활성화 전 값 z = 0.1이다. ReLU는 z가 양수라 그대로 통과시켜 출력도 0.1이다. 편향이 −0.5였다면 z = −0.5가 되어 ReLU가 0을 내보낸다(뉴런이 꺼진다). MLP의 한 층은 이런 뉴런을 여러 개 나란히 둔 것이다."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, blue: colors.blue }} />
      <circle cx={62} cy={66} r={26} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} strokeWidth={1.6} />
      <text x={62} y={71} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
        x₁ = 2
      </text>
      <circle cx={62} cy={164} r={26} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} strokeWidth={1.6} />
      <text x={62} y={169} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
        x₂ = 1
      </text>
      <Arr x1={88} y1={72} x2={272} y2={108} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={88} y1={158} x2={272} y2={124} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <text x={170} y={76} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.orange}>
        × w₁ = 0.5 → 1
      </text>
      <text x={170} y={164} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.orange}>
        × w₂ = −1 → −1
      </text>
      <circle cx={300} cy={214} r={20} fill={colors.violet} fillOpacity={0.14} stroke={colors.violet} />
      <text x={300} y={218} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
        b = 0.1
      </text>
      <Arr x1={300} y1={194} x2={300} y2={148} color={colors.violet} marker={`${P}-ink`} />
      <circle cx={300} cy={116} r={30} fill={card2Bg} stroke="var(--border-strong)" strokeWidth={1.6} />
      <text x={300} y={123} textAnchor="middle" fontSize={20} fontWeight={700} fill={ink}>
        Σ
      </text>
      <text x={300} y={74} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        z = 1 + (−1) + 0.1 = 0.1
      </text>
      <Arr x1={332} y1={116} x2={446} y2={116} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <text x={389} y={108} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        z = 0.1
      </text>
      <rect x={relu.x} y={relu.y} width={relu.w} height={relu.h} rx={8} fill={colors.aqua} fillOpacity={0.1} stroke={colors.aqua} strokeWidth={1.4} />
      <line x1={relu.x + 10} y1={relu.y + 48} x2={relu.x + relu.w - 10} y2={relu.y + 48} stroke={inkMuted} />
      <path d={`M${relu.x + 12},${relu.y + 48} L${relu.x + 46},${relu.y + 48} L${relu.x + 80},${relu.y + 14}`} fill="none" stroke={colors.aqua} strokeWidth={2.4} />
      <text x={relu.x + relu.w / 2} y={relu.y + 63} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.aqua}>
        ReLU = max(0, z)
      </text>
      <Arr x1={relu.x + relu.w + 2} y1={116} x2={612} y2={116} color={colors.blue} marker={`${P}-blue`} width={1.8} />
      <circle cx={644} cy={116} r={30} fill={colors.blue} fillOpacity={0.18} stroke={colors.blue} strokeWidth={1.6} />
      <text x={644} y={112} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        출력
      </text>
      <text x={644} y={128} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
        0.1
      </text>
      <text x={452} y={200} fontSize={11} fontWeight={700} fill={colors.orange}>
        b = −0.5였다면:
      </text>
      <text x={452} y={218} fontSize={11} fill={inkSecondary}>
        z = −0.5 → ReLU → 0 (뉴런이 꺼진다)
      </text>
    </DiagramFrame>
  );
}

export function ReluPieces() {
  // 목표 곡선 sin(2πx)를 활성화 없이(직선), 꺾임 3개, 꺾임 10개로 근사한다. 꺾인 직선(구간별 선형)은 ReLU의 합으로 정확히 쓸 수 있다.
  const target = (x: number) => Math.sin(2 * Math.PI * x);
  const lineFit = (() => {
    const xs = Array.from({ length: 201 }, (_, i) => i / 200);
    const mx = 0.5;
    const my = xs.reduce((s, x) => s + target(x), 0) / xs.length;
    const sxy = xs.reduce((s, x) => s + (x - mx) * (target(x) - my), 0);
    const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    const k = sxy / sxx;
    return (x: number) => my + k * (x - mx);
  })();
  const interp = (kinks: number) => {
    const knots = Array.from({ length: kinks + 2 }, (_, i) => i / (kinks + 1));
    return {
      knots,
      f: (x: number) => {
        const i = Math.min(knots.length - 2, Math.floor(x * (kinks + 1)));
        const t = (x - knots[i]) / (knots[i + 1] - knots[i]);
        return target(knots[i]) * (1 - t) + target(knots[i + 1]) * t;
      },
    };
  };
  const panels = [
    { title: "활성화 없음: 몇 층을 쌓아도 직선", f: lineFit, knots: [] as number[], color: colors.red },
    { title: "ReLU 4개: 꺾임 4번", ...interp(4), color: colors.orange },
    { title: "ReLU 10개: 거의 곡선", ...interp(10), color: colors.green },
  ];
  const pw = 210;
  const ph = 150;
  const top = 40;
  return (
    <DiagramFrame
      title="ReLU 하나 = 꺾임 하나: 뉴런이 늘수록 어떤 곡선이든 따라간다"
      caption="회색 점선이 근사하려는 곡선이다. 활성화 없이 선형 층만 쌓으면 결과는 언제나 직선 하나다(왼쪽). ReLU는 입력이 0을 넘는 곳에서 한 번 꺾이므로, ReLU 뉴런의 출력을 가중합하면 꺾임이 여러 개인 선(구간별 선형 함수)을 만들 수 있다. 꺾임(점)이 많아질수록 목표 곡선에 가까워진다. 이것이 보편 근사 정리의 직관이다."
      viewBox="0 0 720 240"
      minWidth={560}
    >
      {panels.map((p, i) => {
        const x0 = 14 + i * 238;
        const sx = linear(0, 1, x0, x0 + pw);
        const sy = linear(-1.3, 1.3, top + ph, top);
        const truth = sample(target, 0, 1, 120).map(([x, y]) => [sx(x), sy(y)] as [number, number]);
        const approx = sample(p.f, 0, 1, 240).map(([x, y]) => [sx(x), sy(y)] as [number, number]);
        return (
          <g key={p.title}>
            <text x={x0 + pw / 2} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <rect x={x0} y={top} width={pw} height={ph} fill="none" stroke="var(--border-hairline)" />
            <line x1={x0} y1={sy(0)} x2={x0 + pw} y2={sy(0)} stroke="var(--border-hairline)" />
            <path d={linePath(truth)} fill="none" stroke={inkMuted} strokeWidth={1.6} strokeDasharray="5 4" />
            <path d={linePath(approx)} fill="none" stroke={p.color} strokeWidth={2.6} />
            {p.knots.slice(1, -1).map((k) => (
              <circle key={k} cx={sx(k)} cy={sy(p.f(k))} r={4} fill={p.color} stroke="var(--surface-card)" strokeWidth={1.4} />
            ))}
            <text x={x0 + pw / 2} y={top + ph + 22} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              {i === 0 ? "W₂(W₁x) = (W₂W₁)x: 한 층과 같다" : `점 = ReLU가 켜지기 시작하는 꺾임`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function ReluVsGelu() {
  const phi = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  const gelu = (x: number) => x * normCdf(x);
  const dgelu = (x: number) => normCdf(x) + x * phi(x);
  const L = { left: 50, top: 34, width: 270, height: 170 };
  const lx = linear(-3, 3, L.left, L.left + L.width);
  const ly = linear(-0.5, 3, L.top + L.height, L.top);
  const R = { left: 420, top: 34, width: 270, height: 170 };
  const rx = linear(-3, 3, R.left, R.left + R.width);
  const ry = linear(-0.3, 1.3, R.top + R.height, R.top);
  const pts = (f: (x: number) => number, sx: (v: number) => number, sy: (v: number) => number) => sample(f, -3, 3, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]);
  return (
    <DiagramFrame
      title="ReLU와 GELU: 함수와 기울기"
      caption="왼쪽: GELU(주황)는 큰 양수에서는 ReLU(파랑)처럼 거의 그대로 통과시키고, 0 근처와 음수 쪽은 확률 Φ(x)만큼 부드럽게 깎는다(음수 쪽에 살짝 내려가는 구간도 있다). 오른쪽: ReLU의 기울기는 x = 0에서 0에서 1로 뚝 끊기고 음수 쪽은 정확히 0이라, 음수로 넘어간 뉴런은 기울기를 받지 못한다. GELU의 기울기는 어디서나 매끄럽게 이어져 깊은 Transformer에서 기울기가 더 안정적으로 흐른다."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      <text x={L.left + L.width / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 함수 값
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[-3, -2, -1, 0, 1, 2, 3]} yTicks={[0, 1, 2, 3]} fmtX={(v) => String(v).replace("-", "−")} xLabel="입력 x" />
      <path d={linePath(pts((x) => Math.max(0, x), lx, ly))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <path d={linePath(pts(gelu, lx, ly))} fill="none" stroke={colors.orange} strokeWidth={2.4} strokeDasharray="7 3" />
      <circle cx={lx(-0.75)} cy={ly(gelu(-0.75))} r={3.5} fill={colors.orange} />
      <text x={lx(-1.7)} y={ly(0.42)} textAnchor="middle" fontSize={10} fill={colors.orange}>
        GELU 최솟값 ≈ −0.17
      </text>
      <text x={lx(1.4)} y={ly(2.5)} fontSize={11} fontWeight={700} fill={colors.blue}>
        ReLU
      </text>
      <text x={lx(2.0)} y={ly(1.5)} fontSize={11} fontWeight={700} fill={colors.orange}>
        GELU
      </text>

      <text x={R.left + R.width / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 기울기(미분)
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[-3, -2, -1, 0, 1, 2, 3]} yTicks={[0, 0.5, 1]} fmtX={(v) => String(v).replace("-", "−")} xLabel="입력 x" />
      <line x1={rx(-3)} y1={ry(0)} x2={rx(0)} y2={ry(0)} stroke={colors.blue} strokeWidth={2.6} />
      <line x1={rx(0)} y1={ry(1)} x2={rx(3)} y2={ry(1)} stroke={colors.blue} strokeWidth={2.6} />
      <line x1={rx(0)} y1={ry(0)} x2={rx(0)} y2={ry(1)} stroke={colors.blue} strokeWidth={1} strokeDasharray="2 3" />
      <circle cx={rx(0)} cy={ry(0)} r={4} fill={colors.blue} />
      <circle cx={rx(0)} cy={ry(1)} r={4} fill="var(--surface-card)" stroke={colors.blue} strokeWidth={1.6} />
      <path d={linePath(pts(dgelu, rx, ry))} fill="none" stroke={colors.orange} strokeWidth={2.4} strokeDasharray="7 3" />
      <text x={rx(-2.9)} y={ry(0.12)} fontSize={10} fill={colors.blue}>
        음수 쪽: 정확히 0
      </text>
      <text x={rx(0.15)} y={ry(0.5)} fontSize={10} fill={colors.blue}>
        x = 0에서 뚝 끊김
      </text>
      <text x={rx(1.45)} y={ry(1.2)} textAnchor="middle" fontSize={10} fill={colors.orange}>
        매끄럽게 이어짐
      </text>
    </DiagramFrame>
  );
}

export function BackpropGates() {
  // 덧셈·곱셈은 본문 예제 L = (w·x + c)²(w = 2, x = 3, c = 1)의 값이고, max는 별도 예다.
  const P = "bpg";
  const panels = [
    { title: "덧셈 노드: 그대로 나눠 준다", op: "+", a: ["u", "6", "14"], b: ["c", "1", "14"], out: ["v", "7", "14"], color: colors.blue },
    { title: "곱셈 노드: 상대방 값을 곱해 준다", op: "×", a: ["w", "2", "14 × 3 = 42"], b: ["x", "3", "14 × 2 = 28"], out: ["u", "6", "14"], color: colors.violet },
    { title: "max·ReLU 노드: 이긴 쪽에만", op: "max", a: ["a", "4", "2"], b: ["b", "−1", "0"], out: ["z", "4", "2"], color: colors.aqua },
  ];
  return (
    <DiagramFrame
      title="역전파의 세 가지 규칙: 노드마다 기울기를 어떻게 나눠 주는가"
      caption="파란 숫자는 순전파 값, 주황 숫자는 역전파로 흐르는 기울기(∂L/∂값)다. 덧셈은 위에서 내려온 기울기 14를 양쪽에 그대로 준다. 곱셈은 상대방 값을 곱해 바꿔 준다(w에는 x = 3을, x에는 w = 2를 곱한다). max는 실제로 선택된 입력에만 기울기를 주고 나머지는 0으로 끊는다. 이 세 규칙을 노드마다 반복하면 어떤 그래프든 기계적으로 미분된다."
      viewBox="0 0 720 230"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      {panels.map((p, i) => {
        const x0 = 10 + i * 238;
        const gx = x0 + 120;
        const gy = 118;
        return (
          <g key={p.title}>
            <rect x={x0} y={8} width={226} height={214} rx={12} fill="none" stroke="var(--border-hairline)" />
            <text x={x0 + 113} y={28} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            {[
              { v: p.a, y: 70 },
              { v: p.b, y: 166 },
            ].map(({ v, y }) => (
              <g key={v[0]}>
                <circle cx={x0 + 30} cy={y} r={17} fill={card2Bg} stroke="var(--border-strong)" />
                <text x={x0 + 30} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
                  {v[0]}
                </text>
                <Arr x1={x0 + 48} y1={y + (y < gy ? 6 : -6)} x2={gx - 22} y2={gy + (y < gy ? -10 : 10)} color={colors.blue} marker={`${P}-blue`} width={1.6} />
                <text x={x0 + 66} y={y + (y < gy ? -6 : 22)} fontSize={11} fontWeight={700} fill={colors.blue}>
                  {v[1]}
                </text>
                <text x={x0 + 26} y={y + (y < gy ? -24 : 36)} fontSize={11} fontWeight={700} fill={colors.orange}>
                  {`∂L/∂${v[0]} = ${v[2]}`}
                </text>
              </g>
            ))}
            <circle cx={gx} cy={gy} r={22} fill={p.color} fillOpacity={0.16} stroke={p.color} strokeWidth={1.8} />
            <text x={gx} y={gy + 5} textAnchor="middle" fontSize={p.op === "max" ? 12 : 17} fontWeight={700} fill={ink}>
              {p.op}
            </text>
            <Arr x1={gx + 23} y1={gy - 4} x2={x0 + 200} y2={gy - 4} color={colors.blue} marker={`${P}-blue`} width={1.6} />
            <Arr x1={x0 + 200} y1={gy + 8} x2={gx + 24} y2={gy + 8} color={colors.orange} marker={`${P}-orange`} width={1.6} />
            <text x={x0 + 186} y={gy - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
              {`${p.out[0]} = ${p.out[1]}`}
            </text>
            <text x={x0 + 186} y={gy + 26} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
              {`상류 ${p.out[2]}`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function BackpropShapes() {
  // z = Wx + b, W: 4×3. 상류 기울기 δ = ∂L/∂z는 4×1.
  const c = 20;
  const grid = (x: number, y: number, r: number, k: number, color: string, label: string, sub: string) => (
    <g>
      {Array.from({ length: r }, (_, i) =>
        Array.from({ length: k }, (_, j) => (
          <rect key={`${i}-${j}`} x={x + j * c} y={y + i * c} width={c} height={c} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={0.8} />
        )),
      )}
      <text x={x + (k * c) / 2} y={y - 8} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        {label}
      </text>
      <text x={x + (k * c) / 2} y={y + r * c + 14} textAnchor="middle" fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
        {sub}
      </text>
    </g>
  );
  const sym = (x: number, y: number, s: string) => (
    <text x={x} y={y} textAnchor="middle" fontSize={17} fontWeight={700} fill={inkSecondary}>
      {s}
    </text>
  );
  return (
    <DiagramFrame
      title="행렬로 쓴 역전파: 모양(shape)만 맞추면 공식이 보인다"
      caption="위: 가중치의 기울기 ∂L/∂W는 W와 같은 4×3 모양이어야 하므로, 4×1인 δ와 1×3인 xᵀ를 곱하는 수밖에 없다(외적). 아래: 입력으로 내려보낼 기울기 ∂L/∂x는 x와 같은 3×1이어야 하므로 W를 전치해 3×4로 만든 뒤 δ에 곱한다. 편향의 기울기는 δ 그 자체다. 공식이 헷갈리면 결과가 원래 변수와 같은 모양이 되도록 맞춰 보면 된다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <text x={14} y={22} fontSize={12.5} fontWeight={700} fill={colors.violet}>
        ∂L/∂W = δ xᵀ
      </text>
      {grid(150, 34, 4, 1, colors.orange, "δ", "4×1")}
      {sym(196, 80, "×")}
      {grid(214, 64, 1, 3, colors.blue, "xᵀ", "1×3")}
      {sym(300, 80, "=")}
      {grid(322, 34, 4, 3, colors.violet, "∂L/∂W", "4×3 (= W 모양)")}
      <text x={420} y={64} fontSize={11} fill={inkSecondary}>
        칸 (i, j) = δᵢ · xⱼ
      </text>
      <text x={420} y={84} fontSize={11} fill={inkSecondary}>
        ∂L/∂b = δ (4×1)
      </text>
      <line x1={14} y1={134} x2={706} y2={134} stroke="var(--border-hairline)" />
      <text x={14} y={160} fontSize={12.5} fontWeight={700} fill={colors.aqua}>
        ∂L/∂x = Wᵀ δ
      </text>
      {grid(150, 174, 3, 4, inkMuted, "Wᵀ", "3×4")}
      {sym(250, 210, "×")}
      {grid(270, 164, 4, 1, colors.orange, "δ", "4×1")}
      {sym(314, 210, "=")}
      {grid(334, 174, 3, 1, colors.aqua, "∂L/∂x", "3×1 (= x 모양)")}
      <text x={420} y={196} fontSize={11} fill={inkSecondary}>
        이 값이 바로 앞 층의 상류 기울기 δ가 된다
      </text>
      <text x={420} y={216} fontSize={11} fill={inkSecondary}>
        (기울기는 전치된 모양으로 거슬러 올라간다)
      </text>
    </DiagramFrame>
  );
}

export function ClosureRecursion() {
  const P = "clr";
  const frames = [3, 2, 1, 0];
  return (
    <DiagramFrame
      title="클로저와 재귀: 자동미분 엔진을 받치는 두 문법"
      caption="왼쪽: make_adder(5)는 실행이 끝났지만, 돌려준 함수 add는 바깥 변수 n = 5를 계속 기억한다. 그래서 나중에 add5(10)을 부르면 15가 나온다. Value의 _backward도 이렇게 '지금은 정의만 하고, 필요한 값(out.grad)이 준비된 나중에 실행'된다. 오른쪽: countdown(3)은 자기 자신을 더 작은 문제로 부르며 호출이 쌓이고, 멈춤 조건(n == 0)에 닿으면 차례로 돌아온다. backward()의 build()가 그래프를 훑는 방식이 이것이다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet, orange: colors.orange }} />
      <text x={14} y={22} fontSize={12.5} fontWeight={700} fill={colors.violet}>
        클로저: 함수가 바깥 변수를 기억한다
      </text>
      <rect x={14} y={38} width={190} height={92} rx={10} fill="none" stroke={inkMuted} strokeDasharray="5 4" />
      <text x={24} y={56} fontSize={11} fill={inkSecondary} fontFamily={mono}>
        make_adder(5) 실행 중
      </text>
      <Tag x={28} y={66} w={70} h={28} lines={["n = 5"]} color={colors.orange} tint={0.16} size={12} />
      <text x={110} y={86} fontSize={10.5} fill={inkSecondary}>
        → add를 만들어
      </text>
      <text x={110} y={102} fontSize={10.5} fill={inkSecondary}>
        돌려주고 끝남
      </text>
      <Tag x={236} y={52} w={112} h={58} lines={["함수 add", "x + n 을 계산"]} color={colors.violet} tint={0.12} size={12} />
      <ArrPath d="M262,112 C262,140 120,140 66,98" color={colors.orange} marker={`${P}-orange`} dashed />
      <text x={190} y={152} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        끝난 뒤에도 n = 5를 붙잡고 있다
      </text>
      <Tag x={268} y={168} w={80} h={30} lines={["add5"]} color={inkMuted} tint={0.08} size={12} />
      <Arr x1={308} y1={166} x2={308} y2={114} color={colors.violet} marker={`${P}-violet`} />
      <text x={314} y={146} fontSize={10} fill={inkSecondary}>
        이름표
      </text>
      <text x={30} y={232} fontSize={12} fill={ink} fontFamily={mono}>
        add5(10) → 10 + 5 = 15
      </text>
      <text x={30} y={250} fontSize={10.5} fill={inkSecondary}>
        {"실행은 '나중에' 일어난다 = Value._backward"}
      </text>

      <line x1={370} y1={14} x2={370} y2={250} stroke="var(--border-hairline)" />
      <text x={386} y={22} fontSize={12.5} fontWeight={700} fill={colors.aqua}>
        재귀: 자기 자신을 더 작은 문제로 부른다
      </text>
      {frames.map((n, i) => (
        <g key={n}>
          <rect x={400 + i * 18} y={40 + i * 46} width={180} height={36} rx={8} fill={n === 0 ? colors.green : colors.aqua} fillOpacity={n === 0 ? 0.2 : 0.1} stroke={n === 0 ? colors.green : colors.aqua} />
          <text x={412 + i * 18} y={63 + i * 46} fontSize={12} fill={ink} fontFamily={mono}>
            {`countdown(${n})`}
          </text>
          <text x={572 + i * 18} y={63 + i * 46} textAnchor="end" fontSize={11.5} fontWeight={700} fill={n === 0 ? colors.green : ink}>
            {n === 0 ? "발사!" : `print ${n}`}
          </text>
          {i < frames.length - 1 && <Arr x1={420 + i * 18} y1={76 + i * 46} x2={438 + i * 18} y2={86 + i * 46} color={inkSecondary} marker={`${P}-ink`} />}
        </g>
      ))}
      <text x={520} y={232} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.green}>
        멈춤 조건(n == 0)
      </text>
      <ArrPath d="M650,206 C690,150 690,90 600,56" color={colors.orange} marker={`${P}-orange`} />
      <text x={700} y={136} textAnchor="end" fontSize={10.5} fill={colors.orange}>
        차례로 돌아옴
      </text>
    </DiagramFrame>
  );
}

export function MicrogradTopo() {
  // 본문 코드: a = 2, b = −3, L = (a*b + 10).relu(). 순전파는 값과 _backward(클로저)를 남기고, backward()는 위상정렬의 역순으로 그 클로저를 실행한다.
  const P = "mgt";
  const nodes = [
    { id: "a", x: 70, y: 60, label: "a", val: "2", grad: "−3", order: 1 },
    { id: "b", x: 70, y: 176, label: "b", val: "−3", grad: "2", order: 2 },
    { id: "mul", x: 250, y: 118, label: "a·b", val: "−6", grad: "1", order: 3, op: "×", note: "_backward: 상대 값 × 상류" },
    { id: "ten", x: 250, y: 214, label: "10", val: "10", grad: "1", order: 4 },
    { id: "add", x: 430, y: 160, label: "+", val: "4", grad: "1", order: 5, op: "+", note: "_backward: 그대로 나눔" },
    { id: "relu", x: 610, y: 160, label: "L", val: "4", grad: "1", order: 6, op: "relu", note: "_backward: 양수면 통과" },
  ];
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: [string, string][] = [
    ["a", "mul"],
    ["b", "mul"],
    ["mul", "add"],
    ["ten", "add"],
    ["add", "relu"],
  ];
  return (
    <DiagramFrame
      title="micrograd의 backward(): 위상정렬한 뒤 거꾸로 클로저를 실행한다"
      caption="순전파(파란 값)를 하면서 각 연산 노드는 자신을 만든 부모(_prev)와 '기울기를 어떻게 나눌지'를 담은 _backward를 남긴다. backward()는 build()로 부모부터 방문해 번호(①~⑥)순 목록 topo를 만들고, 그것을 뒤집어 ⑥ → ① 순서로 _backward()를 실행한다. 그래서 어떤 노드의 기울기(주황)를 쓸 때는 그 노드를 사용하는 쪽의 기울기가 이미 다 채워져 있다. 결과 a.grad = −3, b.grad = 2."
      viewBox="0 0 720 290"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {edges.map(([f, t]) => (
        <Arr key={f + t} x1={by[f].x + 30} y1={by[f].y} x2={by[t].x - 34} y2={by[t].y + (f === "ten" ? 10 : f === "a" ? -8 : f === "b" ? 8 : 0)} color={inkSecondary} marker={`${P}-ink`} width={1.6} />
      ))}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={28} fill={n.op ? colors.violet : card2Bg} fillOpacity={n.op ? 0.14 : 1} stroke={n.op ? colors.violet : "var(--border-strong)"} strokeWidth={1.5} />
          <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={n.op && n.op !== "relu" ? 16 : 12} fontWeight={700} fill={ink}>
            {n.op ? n.op : n.label}
          </text>
          <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
            {n.val}
          </text>
          <circle cx={n.x - 24} cy={n.y - 24} r={10} fill={colors.aqua} />
          <text x={n.x - 24} y={n.y - 20} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
            {n.order}
          </text>
          <text x={n.x + 30} y={n.y - 22} fontSize={11} fontWeight={700} fill={colors.orange}>
            {`grad ${n.grad}`}
          </text>
          {n.note && (
            <text x={n.x} y={n.y + 46} textAnchor="middle" fontSize={10} fill={colors.violet}>
              {n.note}
            </text>
          )}
        </g>
      ))}
      <text x={14} y={276} fontSize={11} fill={inkSecondary}>
        <tspan fontWeight={700} fill={colors.aqua}>
          ①~⑥
        </tspan>
        {" build()가 만든 topo 순서(부모 먼저) · backward()는 ⑥ → ① 순서로 _backward() 실행 · "}
        <tspan fontWeight={700} fill={colors.blue}>
          파랑
        </tspan>
        {" 값 · "}
        <tspan fontWeight={700} fill={colors.orange}>
          주황
        </tspan>
        {" 기울기"}
      </text>
    </DiagramFrame>
  );
}

export function GradAccumulate() {
  // y = x·x + x, x = 3. x가 세 경로로 쓰여 기울기 3 + 3 + 1 = 7 = 2x + 1이 모인다.
  const P = "gac";
  return (
    <DiagramFrame
      title="+=로 누적하는 이유: 한 변수가 여러 경로로 쓰이면 기울기를 더한다"
      caption="x = 3이 곱셈의 왼쪽, 곱셈의 오른쪽, 덧셈의 세 경로로 쓰인다. 각 경로가 돌려주는 기울기 3, 3, 1을 모두 더해야 정답 ∂y/∂x = 2x + 1 = 7이 된다. grad를 =로 덮어쓰면 마지막으로 계산된 경로의 몫만 남는다. 학습 루프에서 매 스텝 grad를 0으로 되돌리는(zero_grad) 이유도 이 누적 때문이다."
      viewBox="0 0 720 220"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, orange: colors.orange }} />
      <circle cx={90} cy={110} r={30} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} strokeWidth={1.6} />
      <text x={90} y={106} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
        x
      </text>
      <text x={90} y={124} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        3
      </text>
      <circle cx={300} cy={70} r={26} fill={colors.violet} fillOpacity={0.14} stroke={colors.violet} strokeWidth={1.6} />
      <text x={300} y={66} textAnchor="middle" fontSize={15} fontWeight={700} fill={ink}>
        ×
      </text>
      <text x={300} y={84} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        9
      </text>
      <circle cx={480} cy={110} r={26} fill={colors.violet} fillOpacity={0.14} stroke={colors.violet} strokeWidth={1.6} />
      <text x={480} y={106} textAnchor="middle" fontSize={15} fontWeight={700} fill={ink}>
        +
      </text>
      <text x={480} y={124} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        12
      </text>
      <ArrPath d="M118,98 C170,50 220,46 272,60" color={inkSecondary} marker={`${P}-ink`} />
      <ArrPath d="M120,104 C180,90 230,86 274,78" color={inkSecondary} marker={`${P}-ink`} />
      <ArrPath d="M120,118 C240,150 380,150 452,118" color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={326} y1={78} x2={452} y2={100} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={506} y1={110} x2={580} y2={110} color={inkSecondary} marker={`${P}-ink`} />
      <text x={612} y={115} fontSize={13} fontWeight={700} fill={ink}>
        y
      </text>
      <text x={170} y={40} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        +3 (왼쪽 입력: 상대 값 3 × 1)
      </text>
      <text x={200} y={104} fontSize={11} fontWeight={700} fill={colors.orange}>
        +3 (오른쪽 입력)
      </text>
      <text x={290} y={168} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        +1 (덧셈은 그대로)
      </text>
      <rect x={40} y={180} width={300} height={30} rx={8} fill={colors.orange} fillOpacity={0.12} stroke={colors.orange} />
      <text x={190} y={200} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        x.grad = 3 + 3 + 1 = 7 = 2x + 1 ✓
      </text>
      <text x={370} y={200} fontSize={11} fill={colors.red} fontWeight={700}>
        = 로 덮어쓰면 한 경로의 몫만 남는다 ✗
      </text>
    </DiagramFrame>
  );
}

export function OptimizerPaths() {
  // f(x, y) = ½(x² + 25y²): 세로가 25배 가파른 협곡. 같은 출발점에서 25스텝씩.
  const start = [-4.5, 1.2];
  const grad = (x: number, y: number) => [x, 25 * y];
  const N = 25;
  const sgd = () => {
    let [x, y] = start;
    const pts = [[x, y]];
    for (let i = 0; i < N; i++) {
      const [gx, gy] = grad(x, y);
      x -= 0.07 * gx;
      y -= 0.07 * gy;
      pts.push([x, y]);
    }
    return pts;
  };
  const momentum = () => {
    let [x, y] = start;
    let vx = 0;
    let vy = 0;
    const pts = [[x, y]];
    for (let i = 0; i < N; i++) {
      const [gx, gy] = grad(x, y);
      vx = 0.8 * vx + gx;
      vy = 0.8 * vy + gy;
      x -= 0.025 * vx;
      y -= 0.025 * vy;
      pts.push([x, y]);
    }
    return pts;
  };
  const adam = () => {
    let [x, y] = start;
    let mx = 0;
    let my = 0;
    let vx = 0;
    let vy = 0;
    const pts = [[x, y]];
    for (let t = 1; t <= N; t++) {
      const [gx, gy] = grad(x, y);
      mx = 0.9 * mx + 0.1 * gx;
      my = 0.9 * my + 0.1 * gy;
      vx = 0.999 * vx + 0.001 * gx * gx;
      vy = 0.999 * vy + 0.001 * gy * gy;
      const c1 = 1 - 0.9 ** t;
      const c2 = 1 - 0.999 ** t;
      x -= (0.25 * (mx / c1)) / (Math.sqrt(vx / c2) + 1e-8);
      y -= (0.25 * (my / c1)) / (Math.sqrt(vy / c2) + 1e-8);
      pts.push([x, y]);
    }
    return pts;
  };
  const panels = [
    { title: "SGD (η = 0.07)", pts: sgd(), color: colors.red, note: "세로로 진동, 가로로 느림" },
    { title: "Momentum (β = 0.8)", pts: momentum(), color: colors.orange, note: "일관된 가로 방향이 가속" },
    { title: "Adam (η = 0.25)", pts: adam(), color: colors.blue, note: "축마다 보폭을 맞춰 대각선으로" },
  ];
  const pw = 214;
  const ph = 150;
  const top = 38;
  return (
    <DiagramFrame
      title="같은 협곡, 다른 걸음: SGD·Momentum·Adam의 25스텝"
      caption="세로 방향이 가로보다 25배 가파른 손실 f = ½(x² + 25y²)에서 같은 점(큰 점)에서 출발해 25번 갱신한 경로다. SGD는 가파른 세로축 때문에 학습률을 키울 수 없어 가로로 아직 멀리 있다. Momentum은 매번 같은 가로 방향의 기울기가 누적돼 빨라지고(조금 지나쳤다 돌아온다), 진동하는 세로 성분은 상쇄된다. Adam은 축마다 기울기 크기로 나눠 보폭을 비슷하게 만들므로 처음부터 대각선으로 내려간다."
      viewBox="0 0 720 240"
      minWidth={560}
    >
      {panels.map((p, i) => {
        const x0 = 12 + i * 238;
        const sx = linear(-5, 1.2, x0, x0 + pw);
        const sy = linear(-1.6, 1.6, top + ph, top);
        const kx = pw / 6.2;
        const ky = ph / 3.2;
        return (
          <g key={p.title}>
            <defs>
              <clipPath id={`opt-clip-${i}`}>
                <rect x={x0} y={top} width={pw} height={ph} />
              </clipPath>
            </defs>
            <text x={x0 + pw / 2} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <rect x={x0} y={top} width={pw} height={ph} fill="none" stroke="var(--border-hairline)" />
            <g clipPath={`url(#opt-clip-${i})`}>
              {[0.5, 2, 4.5, 8, 12.5].map((lv) => (
                <ellipse key={lv} cx={sx(0)} cy={sy(0)} rx={Math.sqrt(2 * lv) * kx} ry={Math.sqrt((2 * lv) / 25) * ky} fill="none" stroke={inkMuted} strokeOpacity={0.5} />
              ))}
              <path d={linePath(p.pts.map(([x, y]) => [sx(x), sy(y)]))} fill="none" stroke={p.color} strokeWidth={1.8} />
              {p.pts.map(([x, y], k) => (
                <circle key={k} cx={sx(x)} cy={sy(y)} r={k === 0 ? 4.5 : 2.2} fill={p.color} />
              ))}
              <circle cx={sx(0)} cy={sy(0)} r={3.5} fill={ink} />
            </g>
            <text x={x0 + pw / 2} y={top + ph + 20} textAnchor="middle" fontSize={11} fontWeight={600} fill={ink}>
              {p.note}
            </text>
            <text x={x0 + pw / 2} y={top + ph + 38} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
              {`25스텝 뒤 x = ${p.pts[N][0].toFixed(2).replace("-", "−")}`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function MomentumVelocity() {
  // 본문 코드: β = 0.9, 기울기 [1,1,1,1,1]과 [1,−1,1,−1,1]일 때 누적 속도 v.
  const same = [1, 1.9, 2.71, 3.439, 4.095];
  const alt = [1, -0.1, 0.91, -0.181, 0.837];
  const panels = [
    { title: "같은 방향 기울기: 계속 쌓인다", v: same, color: colors.blue, note: "한계는 1/(1 − β) = 10배" },
    { title: "부호가 바뀌는 기울기: 서로 지운다", v: alt, color: colors.orange, note: "1 안팎에서 맴돈다" },
  ];
  return (
    <DiagramFrame
      title="Momentum의 속도 v: 일관된 방향은 가속, 진동은 상쇄"
      caption="v ← 0.9v + g를 다섯 번 반복한 값(위 코드의 출력)이다. 기울기가 매번 같은 방향이면 v가 1, 1.9, 2.71, …로 불어나 결국 10배까지 가속된다. 부호가 번갈아 바뀌면 앞의 기여가 반대 부호와 상쇄되어 v가 1 근처에 머문다. 협곡의 긴 축은 빨라지고 좁은 축의 진동은 잦아드는 이유다."
      viewBox="0 0 720 230"
      minWidth={540}
    >
      {panels.map((p, i) => {
        const x0 = 40 + i * 350;
        const sy = linear(-1, 5, 190, 40);
        return (
          <g key={p.title}>
            <text x={x0 + 140} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <line x1={x0} y1={sy(0)} x2={x0 + 290} y2={sy(0)} stroke={inkMuted} />
            {[-1, 0, 1, 2, 3, 4, 5].map((t) => (
              <text key={t} x={x0 - 6} y={sy(t) + 3.5} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
                {String(t).replace("-", "−")}
              </text>
            ))}
            {p.v.map((v, k) => (
              <g key={k}>
                <rect x={x0 + 14 + k * 54} y={Math.min(sy(v), sy(0))} width={34} height={Math.abs(sy(v) - sy(0))} rx={3} fill={p.color} fillOpacity={0.75} />
                <text x={x0 + 31 + k * 54} y={v >= 0 ? sy(v) - 5 : sy(v) + 13} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={ink}>
                  {String(v).replace("-", "−")}
                </text>
                <text x={x0 + 31 + k * 54} y={208} textAnchor="middle" fontSize={10} fill={inkSecondary}>
                  {`${k + 1}스텝`}
                </text>
              </g>
            ))}
            <text x={x0 + 145} y={224} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={p.color}>
              {p.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function InitSignalPropagation() {
  // ReLU 층 10개(폭 256), 입력 표준편차 1. 층마다 표준편차가 √(256·σ²/2)배가 된다(첫 층의 ReLU 출력 표준편차는 0.584 × √(256σ²)).
  const layers = Array.from({ length: 10 }, (_, i) => i + 1);
  const series = [
    { name: "표준정규 (std = 1)", sigma: 1, color: colors.red, end: "≈ 3 × 10¹⁰" },
    { name: "He: std = √(2/256) ≈ 0.088", sigma: Math.sqrt(2 / 256), color: colors.green, end: "≈ 0.83 (일정)" },
    { name: "너무 작게 (std = 0.01)", sigma: 0.01, color: colors.blue, end: "≈ 3 × 10⁻¹⁰" },
  ];
  const A = { left: 78, top: 24, width: 420, height: 200 };
  const sx = linear(1, 10, A.left, A.left + A.width);
  const sy = log10Scale(1e-11, 1e11, A.top + A.height, A.top);
  const stdAt = (sigma: number, l: number) => 0.584 * Math.sqrt(256 * sigma * sigma) * Math.sqrt((256 * sigma * sigma) / 2) ** (l - 1);
  return (
    <DiagramFrame
      title="초기화에 따라 신호가 폭발하거나 사라진다: ReLU 10층의 활성화 크기"
      caption="세로축은 로그 눈금이다. 가중치를 표준정규분포로 뽑으면 층마다 활성화가 약 11배씩 커져 10층 뒤 10¹⁰을 넘고, 0.01로 너무 작게 뽑으면 층마다 약 0.11배로 줄어 10⁻¹⁰ 아래로 사라진다. 분산을 2/fan_in으로 맞춘 He 초기화만 10층 내내 같은 크기를 지킨다. 위 코드가 출력하는 숫자를 그대로 그린 것이며, 역전파되는 기울기도 같은 운명을 겪는다."
      viewBox="0 0 720 270"
      minWidth={560}
    >
      <Axes
        {...A}
        sx={sx}
        sy={sy}
        xTicks={layers}
        yTicks={[1e-10, 1e-5, 1, 1e5, 1e10]}
        fmtY={pow10Label}
        xLabel="층 번호"
        yLabel="활성화 표준편차"
      />
      {series.map((s) => {
        const pts = layers.map((l) => [sx(l), sy(stdAt(s.sigma, l))] as [number, number]);
        return (
          <g key={s.name}>
            <path d={linePath(pts)} fill="none" stroke={s.color} strokeWidth={2.4} />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={3} fill={s.color} />
            ))}
            <text x={pts[9][0] + 8} y={pts[9][1] + 4} fontSize={11} fontWeight={700} fill={s.color}>
              {s.end}
            </text>
          </g>
        );
      })}
      {series.map((s, i) => (
        <g key={`lg${s.name}`}>
          <rect x={A.left + 8} y={A.top + 6 + i * 18} width={10} height={10} rx={2} fill={s.color} />
          <text x={A.left + 24} y={A.top + 15 + i * 18} fontSize={10.5} fill={ink}>
            {s.name}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function TrainingLoop() {
  const P = "trl";
  const steps = [
    { x: 150, y: 54, t: "① 미니배치 꺼내기", c: "for xb, yb in loader" },
    { x: 330, y: 54, t: "② 순전파", c: "pred = model(xb)" },
    { x: 510, y: 54, t: "③ 손실 계산", c: "loss = loss_fn(pred, yb)" },
    { x: 510, y: 170, t: "④ 기울기 비우기", c: "optimizer.zero_grad()" },
    { x: 330, y: 170, t: "⑤ 역전파", c: "loss.backward()" },
    { x: 150, y: 170, t: "⑥ 파라미터 갱신", c: "optimizer.step()" },
  ];
  const w = 164;
  const h = 56;
  return (
    <DiagramFrame
      title="PyTorch 학습 루프 한 바퀴: 여섯 단계의 반복"
      caption="배치마다 ①~⑥을 반복한다. ④ zero_grad를 빠뜨리면 .grad가 +=로 누적되어 걸음이 점점 커진다(micrograd의 grad = 0과 같은 줄). 한 에폭이 끝나면 오른쪽처럼 평가 모드(model.eval)와 torch.no_grad()로 검증 손실을 재고, 가장 좋았던 시점의 파라미터를 체크포인트로 저장한다."
      viewBox="0 0 720 260"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet }} />
      <rect x={60} y={20} width={540} height={232} rx={14} fill="none" stroke="var(--border-hairline)" strokeDasharray="5 4" />
      <text x={74} y={38} fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
        for epoch in range(num_epochs):  model.train()
      </text>
      {steps.map((s, i) => (
        <g key={s.t}>
          <rect x={s.x - w / 2} y={s.y} width={w} height={h} rx={10} fill={i === 3 ? colors.orange : colors.blue} fillOpacity={i === 3 ? 0.14 : 0.08} stroke={i === 3 ? colors.orange : colors.blue} strokeWidth={1.4} />
          <text x={s.x} y={s.y + 22} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
            {s.t}
          </text>
          <text x={s.x} y={s.y + 41} textAnchor="middle" fontSize={10} fill={inkSecondary} fontFamily={mono}>
            {s.c}
          </text>
        </g>
      ))}
      <Arr x1={232} y1={82} x2={246} y2={82} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={412} y1={82} x2={426} y2={82} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={510} y1={112} x2={510} y2={166} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={428} y1={198} x2={414} y2={198} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={248} y1={198} x2={234} y2={198} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <Arr x1={150} y1={168} x2={150} y2={114} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <text x={158} y={146} fontSize={10.5} fill={inkSecondary}>
        다음 배치
      </text>
      <Arr x1={602} y1={136} x2={622} y2={136} color={colors.violet} marker={`${P}-violet`} width={1.8} />
      <Tag x={626} y={80} w={88} h={112} lines={["에폭 끝", "model.eval()", "no_grad()", "검증 손실", "체크포인트"]} color={colors.violet} tint={0.1} size={11.5} />
    </DiagramFrame>
  );
}

export function BroadcastBug() {
  // 예측 (N, 1)과 정답 (N,)을 빼면 브로드캐스팅으로 (N, N) 표가 된다.
  const pred = [2.9, 5.2, 6.8, 9.1];
  const y = [3, 5, 7, 9];
  const c = 46;
  const ox = 250;
  const oy = 76;
  return (
    <DiagramFrame
      title="조용한 버그: (N, 1) − (N,) = (N, N)"
      caption="예측 pred의 모양이 (4, 1)이고 정답 y가 (4,)이면, 브로드캐스팅 규칙에 따라 pred는 오른쪽으로, y는 아래로 복제되어 4×4 표가 만들어진다. 원하는 오차는 대각선(초록) 4개뿐인데, 나머지 12칸(빨강)은 서로 다른 샘플끼리의 엉뚱한 차이다. 오류 없이 이 16칸의 평균이 손실이 되어 학습이 이상해진다. pred.squeeze(1)로 (4,)를 만들면 대각선만 남는다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <text x={150} y={32} textAnchor="middle" fontSize={12} fontWeight={700} fill={colors.blue}>
        pred: (4, 1)
      </text>
      {pred.map((p, i) => (
        <g key={i}>
          <rect x={126} y={oy + i * c} width={48} height={c - 4} rx={5} fill={colors.blue} fillOpacity={0.16} stroke={colors.blue} />
          <text x={150} y={oy + i * c + 27} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink} fontFamily={mono}>
            {p}
          </text>
        </g>
      ))}
      <text x={ox + 2 * c} y={32} textAnchor="middle" fontSize={12} fontWeight={700} fill={colors.orange}>
        y: (4,) → 아래로 복제
      </text>
      {y.map((v, j) => (
        <g key={j}>
          <rect x={ox + j * c} y={40} width={c - 4} height={30} rx={5} fill={colors.orange} fillOpacity={0.16} stroke={colors.orange} />
          <text x={ox + j * c + (c - 4) / 2} y={60} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink} fontFamily={mono}>
            {v}
          </text>
        </g>
      ))}
      <text x={210} y={oy + 2 * c} textAnchor="middle" fontSize={16} fontWeight={700} fill={inkSecondary}>
        −
      </text>
      {pred.map((p, i) =>
        y.map((v, j) => {
          const diag = i === j;
          return (
            <g key={`${i}${j}`}>
              <rect x={ox + j * c} y={oy + i * c} width={c - 4} height={c - 4} rx={5} fill={diag ? colors.green : colors.red} fillOpacity={diag ? 0.22 : 0.1} stroke={diag ? colors.green : colors.red} strokeOpacity={diag ? 1 : 0.5} />
              <text x={ox + j * c + (c - 4) / 2} y={oy + i * c + 27} textAnchor="middle" fontSize={11} fontWeight={diag ? 700 : 400} fill={ink} fontFamily={mono}>
                {(p - v).toFixed(1).replace("-", "−")}
              </text>
            </g>
          );
        }),
      )}
      <text x={ox + 2 * c} y={oy + 4 * c + 18} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
        결과: (4, 4) — 16칸의 평균이 손실이 된다
      </text>
      <Tag x={480} y={96} w={226} h={64} lines={["원하는 것: 대각선 4칸", "pred.squeeze(1) − y → (4,)"]} color={colors.green} tint={0.12} size={12} />
      <Tag x={480} y={176} w={226} h={64} lines={["실제로 계산된 것: 16칸", "빨강 12칸은 엉뚱한 쌍의 차이"]} color={colors.red} tint={0.1} size={12} />
    </DiagramFrame>
  );
}

/** make_moons(1000, noise=0.2, random_state=0)에 본문 구조(2 → h → h → 2, ReLU)·설정(Adam, lr 0.01, 전체 배치 300 epoch)으로
 *  NumPy에서 다시 학습한 결정 영역. 84 × 54 격자의 행마다 "클래스 0부터 번갈아 이어지는 칸 수"(run-length)를 적었다. */
const MOONS_GRID: { h: number; acc: number; rle: string }[] = [
  {
    h: 1,
    acc: 86.5,
    rle:
      "84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;81.3;77.7;74.10;70.14;66.18;63.21;59.25;55.29;52.32;48.36;" +
      "44.40;41.43;37.47;33.51;30.54;26.58;22.62;19.65;15.69;11.73;8.76;4.80;0.84;0.84;0.84;0.84;0.84;0.84;0.84;0.84;" +
      "0.84;0.84;0.84;0.84;0.84;0.84;0.84;0.84",
  },
  {
    h: 2,
    acc: 88.5,
    rle:
      "84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;84;77.7;67.17;58.26;49.35;40.44;31.53;28.56;27.57;" +
      "26.58;25.59;24.60;24.60;23.61;22.62;21.63;20.64;19.65;18.66;18.66;17.67;16.68;15.69;14.70;13.71;13.71;12.72;" +
      "11.73;10.74;9.75;8.76;8.76;7.77;6.78",
  },
  {
    h: 4,
    acc: 95.7,
    rle:
      "79.5;78.6;77.7;77.7;76.8;75.9;74.10;73.11;73.11;72.12;71.13;70.14;70.14;69.15;68.16;67.17;66.18;66.18;" +
      "31.1.33.19;30.3.31.20;30.5.28.21;29.7.27.21;28.9.25.22;28.10.23.23;27.12.21.24;27.13.19.25;26.15.18.25;" +
      "25.17.16.26;25.18.14.27;24.20.12.28;24.21.11.28;23.23.9.29;22.25.7.30;22.26.5.31;21.28.3.32;21.30.1.32;20.64;" +
      "19.65;19.65;18.66;18.66;17.67;16.68;16.68;15.69;15.69;14.70;13.71;13.71;12.72;12.72;11.73;10.74;10.74",
  },
  {
    h: 64,
    acc: 97.0,
    rle:
      "52.32;53.31;54.30;55.29;56.28;56.28;57.27;57.27;57.27;58.26;58.26;58.26;59.25;59.25;59.25;60.24;60.24;60.24;" +
      "60.24;30.3.28.23;28.8.26.22;27.12.23.22;27.12.24.21;26.14.23.21;26.14.24.20;25.16.24.19;25.16.23.20;" +
      "24.18.21.21;24.18.20.22;23.20.18.23;22.22.16.24;22.22.15.25;22.23.12.27;22.24.10.28;22.25.7.30;21.28.3.32;" +
      "21.63;21.63;21.63;21.63;21.63;21.63;21.63;21.63;21.63;22.62;22.62;22.62;22.62;22.62;22.62;22.62;22.62;23.61",
  },
];
/** 같은 데이터에서 무작위로 고른 160개 점 (x, y, 클래스) */
const MOONS_PTS =
  "0.04,0.88,0 -0.72,0.46,0 1.73,-0.26,1 0.8,-0.16,0 1.81,0.16,1 0.42,-0.71,1 0.98,-0.04,0 1.71,-0.16,1" +
  "1.09,-0.28,0 1.29,-0.78,1 1.09,-0.21,1 0.35,0.12,1 0.1,0.27,1 1.7,-0.45,1 -1.0,0.54,0 2.08,0.78,1 0.17,0.8,0" +
  "0.63,0.97,0 -0.18,0.99,0 2.05,0.48,1 0.89,0.35,0 0.81,-0.68,1 0.98,-0.71,1 -0.03,1.15,0 0.66,-0.39,1" +
  "-1.1,-0.17,0 0.93,-0.32,1 1.75,-0.16,1 -0.13,0.19,1 -0.8,0.67,0 -0.36,1.09,0 0.19,-0.17,1 0.6,0.61,0" +
  "0.73,0.32,0 1.24,-0.78,1 0.31,-0.39,1 -0.71,0.88,0 0.1,-0.11,1 0.61,-0.3,1 -0.12,1.34,0 1.93,0.13,1" +
  "0.77,-0.67,1 0.04,-0.47,1 0.94,0.09,0 0.92,-0.39,1 -0.07,0.4,1 1.36,-0.18,1 1.04,-0.54,1 0.48,-0.89,1" +
  "1.82,0.28,1 -0.87,0.69,0 0.16,-0.48,1 0.27,0.1,1 1.13,-0.36,1 -0.44,0.75,0 1.58,0.75,1 -0.18,0.97,0" +
  "-0.65,0.63,0 0.88,0.72,0 1.82,0.4,1 -0.35,0.98,0 0.12,-0.09,1 0.19,1.27,0 -0.38,1.1,0 2.09,0.33,1 -1.19,0.13,0" +
  "0.31,-0.4,1 1.33,-0.44,1 0.07,1.11,0 0.58,1.0,0 0.94,0.55,0 -0.8,0.4,0 0.04,0.8,0 0.36,-0.64,1 0.54,-0.14,1" +
  "-0.84,0.58,0 0.57,0.15,1 0.64,-0.2,1 -0.44,0.61,0 0.43,-0.62,1 0.38,-0.09,1 0.53,0.64,0 -0.62,-0.05,0" +
  "0.54,0.6,0 1.78,0.07,1 1.43,-0.36,1 -0.74,0.07,0 0.43,0.72,0 0.49,-0.53,1 -0.14,0.07,1 -0.62,1.14,0" +
  "0.42,0.83,0 1.34,-0.68,1 0.87,0.51,0 -0.81,0.5,0 -0.89,0.78,0 -0.66,-0.35,0 1.76,0.24,1 0.96,0.38,0" +
  "-0.02,-0.16,1 1.07,-0.03,1 -0.95,0.25,0 1.26,-0.35,1 -0.87,0.91,0 0.06,-0.33,1 0.63,-0.33,1 0.03,1.22,0" +
  "0.12,1.1,0 1.56,-0.26,1 0.97,0.87,0 0.12,-0.02,1 1.08,-0.43,1 1.98,0.19,1 0.64,-0.74,1 0.01,1.01,0 1.06,0.51,0" +
  "-0.69,0.79,0 -0.09,1.11,0 1.65,-0.6,1 1.0,0.52,0 -0.98,-0.02,0 0.22,0.14,1 2.08,-0.17,1 1.91,-0.25,1" +
  "-0.21,1.0,0 0.29,-0.08,1 0.26,0.86,0 -0.92,0.54,0 0.23,-0.54,1 1.06,-0.61,1 -1.24,0.31,0 -0.35,0.8,0" +
  "-0.61,1.05,0 0.87,0.64,0 1.78,0.62,1 0.41,0.6,0 0.15,1.1,0 -0.8,0.39,0 -0.21,0.71,0 0.79,0.15,0 0.56,-0.58,1" +
  "1.03,-0.51,1 1.28,0.35,0 0.43,-0.78,1 1.92,0.11,1 2.16,0.33,1 1.68,-0.41,1 1.06,-0.26,1 0.32,-0.02,1" +
  "0.61,0.71,0 0.3,1.01,0 -0.95,0.14,0 -0.15,0.12,1 0.46,0.88,0 1.88,0.33,1 1.87,0.75,1 0.39,1.13,0 1.49,-0.16,1" +
  "-0.47,1.15,0 -0.69,0.52,0";

export function BnLnExample() {
  // 본문 예제: z = [[2, 4], [6, 8]] (행 = 샘플, 열 = 특징). BN은 열마다, LN은 행마다 평균·분산을 낸다.
  const P = "bnl";
  const z = [
    [2, 4],
    [6, 8],
  ];
  const cw = 44;
  const ch = 30;
  const mat = (x0: number, y0: number, vals: number[][], small = false) =>
    vals.map((row, i) =>
      row.map((v, j) => (
        <g key={`${x0}-${i}-${j}`}>
          <rect x={x0 + j * cw} y={y0 + i * (small ? 26 : ch)} width={cw} height={small ? 26 : ch} fill={card2Bg} stroke="var(--border-strong)" />
          <text x={x0 + j * cw + cw / 2} y={y0 + i * (small ? 26 : ch) + (small ? 17 : 19)} textAnchor="middle" fontSize={small ? 11.5 : 13} fontWeight={700} fill={ink} fontFamily={mono}>
            {String(v).replace("-", "−")}
          </text>
        </g>
      )),
    );
  const heads = (x0: number, y0: number) => (
    <g>
      {["특징1", "특징2"].map((h, j) => (
        <text key={h} x={x0 + j * cw + cw / 2} y={y0 - 7} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {h}
        </text>
      ))}
      {["샘플1", "샘플2"].map((h, i) => (
        <text key={h} x={x0 - 6} y={y0 + i * ch + 19} textAnchor="end" fontSize={10} fill={inkSecondary}>
          {h}
        </text>
      ))}
    </g>
  );
  const tokens = ["나는", "오늘", "학교에", "간다"];
  return (
    <DiagramFrame
      title="같은 숫자, 다른 축: BatchNorm은 열(특징)마다, LayerNorm은 행(샘플)마다"
      caption="본문의 2 × 2 예제다(행 = 샘플, 열 = 특징). BatchNorm은 같은 특징을 여러 샘플에 걸쳐 모아(axis=0) 평균·분산을 내므로 특징1은 평균 4·분산 4, 특징2는 평균 6·분산 4가 되고, 결과는 '각 특징 안에서 샘플1이 작고 샘플2가 크다'로 정규화된다. LayerNorm은 한 샘플의 특징들을 모아(axis=1) 샘플1은 평균 3·분산 1, 샘플2는 평균 7·분산 1이 되고, 결과는 '각 샘플 안에서 특징1이 작고 특징2가 크다'가 된다. Transformer에서는 토큰 하나가 샘플 하나라서, 토큰마다 자기 d_model개 값만으로 정규화하고 다른 토큰이나 다른 문장은 보지 않는다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={114} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.blue}>
        BatchNorm: axis=0
      </text>
      {heads(70, 44)}
      {mat(70, 44, z)}
      <rect x={72} y={41} width={cw - 4} height={2 * ch + 6} rx={6} fill="none" stroke={colors.blue} strokeWidth={2.2} />
      <rect x={72 + cw} y={41} width={cw - 4} height={2 * ch + 6} rx={6} fill="none" stroke={colors.orange} strokeWidth={2.2} />
      <Lines x={92} y={122} lines={["μ = 4", "σ² = 4"]} size={10.5} color={colors.blue} weight={700} />
      <Lines x={136} y={122} lines={["μ = 6", "σ² = 4"]} size={10.5} color={colors.orange} weight={700} />
      <Arr x1={114} y1={148} x2={114} y2={166} color={inkSecondary} marker={`${P}-ink`} />
      {mat(70, 172, [
        [-1, -1],
        [1, 1],
      ], true)}
      <text x={64} y={204} textAnchor="end" fontSize={10} fill={inkSecondary}>
        결과
      </text>
      <line x1={238} y1={10} x2={238} y2={250} stroke="var(--border-hairline)" />
      <text x={354} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.violet}>
        LayerNorm: axis=1
      </text>
      {heads(296, 44)}
      {mat(296, 44, z)}
      <rect x={293} y={46} width={2 * cw + 6} height={ch - 4} rx={6} fill="none" stroke={colors.violet} strokeWidth={2.2} />
      <rect x={293} y={46 + ch} width={2 * cw + 6} height={ch - 4} rx={6} fill="none" stroke={colors.green} strokeWidth={2.2} />
      <text x={392} y={63} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        μ = 3, σ² = 1
      </text>
      <text x={392} y={93} fontSize={10.5} fontWeight={700} fill={colors.green}>
        μ = 7, σ² = 1
      </text>
      <Arr x1={340} y1={112} x2={340} y2={166} color={inkSecondary} marker={`${P}-ink`} />
      {mat(296, 172, [
        [-1, 1],
        [-1, 1],
      ], true)}
      <text x={290} y={204} textAnchor="end" fontSize={10} fill={inkSecondary}>
        결과
      </text>
      <line x1={478} y1={10} x2={478} y2={250} stroke="var(--border-hairline)" />
      <text x={598} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        Transformer: 토큰마다
      </text>
      {[1, 0].map((layer) => (
        <g key={layer} opacity={layer === 1 ? 0.35 : 1}>
          {tokens.map((tk, i) =>
            Array.from({ length: 8 }, (_, j) => (
              <rect key={`${layer}-${i}-${j}`} x={548 + j * 16 + layer * 12} y={46 + i * 22 - layer * 12} width={16} height={22} fill={layer === 0 && i === 2 ? colors.violet : card2Bg} fillOpacity={layer === 0 && i === 2 ? 0.3 : 1} stroke="var(--border-strong)" strokeWidth={0.8} />
            )),
          )}
        </g>
      ))}
      <rect x={546} y={44 + 2 * 22} width={8 * 16 + 4} height={26} rx={5} fill="none" stroke={colors.violet} strokeWidth={2.2} />
      {tokens.map((tk, i) => (
        <text key={tk} x={542} y={46 + i * 22 + 15} textAnchor="end" fontSize={10} fill={i === 2 ? colors.violet : inkSecondary} fontWeight={i === 2 ? 800 : 400}>
          {tk}
        </text>
      ))}
      <text x={612} y={150} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        ← d_model개 값 →
      </text>
      <text x={694} y={36} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
        뒤: 배치의 다른 문장
      </text>
      <Lines x={598} y={176} lines={["'학교에' 토큰 하나의 값으로만", "평균·분산을 낸다", "→ 길이·패딩·배치 크기와 무관"]} size={10.5} color={ink} weight={600} />
    </DiagramFrame>
  );
}

export function FloatFormats() {
  // IEEE 754 FP32(1·8·23), FP16(1·5·10), bfloat16(1·8·7). BF16은 FP32의 앞 16비트를 잘라 낸 모양이다.
  const cw = 10.5;
  const x0 = 64;
  const rows = [
    { t: "FP32", seg: [1, 8, 23], max: "3.4 × 10³⁸", min: "1.2 × 10⁻³⁸", y: 34 },
    { t: "BF16", seg: [1, 8, 7], max: "3.4 × 10³⁸", min: "1.2 × 10⁻³⁸", y: 104 },
    { t: "FP16", seg: [1, 5, 10], max: "65,504", min: "6.1 × 10⁻⁵", y: 164 },
  ];
  const segCol = [colors.red, colors.blue, colors.orange];
  const segName = ["부호", "지수", "가수"];
  return (
    <DiagramFrame
      title="숫자 형식의 비트 구성: 지수는 범위를, 가수는 정밀도를 정한다"
      caption="부호 1비트(빨강) 뒤에 지수(파랑)와 가수(주황)가 온다. 지수 비트 수가 표현할 수 있는 크기의 범위를, 가수 비트 수가 유효숫자(정밀도)를 정한다. BF16은 FP32의 앞 16비트를 그대로 잘라 낸 형식이라 지수가 8비트로 같고 범위도 FP32와 같지만, 가수가 7비트뿐이라 유효숫자가 약 2~3자리로 줄어든다. FP16은 가수 10비트로 BF16보다 정밀하지만 지수가 5비트라 범위가 65,504까지로 좁고, 아주 작은 기울기는 0이 되기 쉽다."
      viewBox="0 0 720 230"
      minWidth={600}
    >
      {rows.map((r) => {
        let off = 0;
        return (
          <g key={r.t}>
            <text x={x0 - 10} y={r.y + 16} textAnchor="end" fontSize={12.5} fontWeight={800} fill={ink}>
              {r.t}
            </text>
            {r.seg.map((n, k) => {
              const sx = x0 + off * cw;
              off += n;
              return (
                <g key={k}>
                  {Array.from({ length: n }, (_, b) => (
                    <rect key={b} x={sx + b * cw} y={r.y} width={cw} height={22} fill={segCol[k]} fillOpacity={0.35} stroke={segCol[k]} strokeWidth={0.8} />
                  ))}
                  <text x={sx + (n * cw) / 2} y={r.y + 36} textAnchor="middle" fontSize={10} fontWeight={700} fill={segCol[k]}>
                    {k === 0 ? "1" : `${segName[k]} ${n}`}
                  </text>
                </g>
              );
            })}
            <text x={430} y={r.y + 10} fontSize={10.5} fill={inkSecondary}>
              최댓값
            </text>
            <text x={490} y={r.y + 10} fontSize={11} fontWeight={800} fill={ink}>
              {r.max}
            </text>
            <text x={430} y={r.y + 28} fontSize={10.5} fill={inkSecondary}>
              가장 작은 정규수
            </text>
            <text x={540} y={r.y + 28} fontSize={11} fontWeight={800} fill={ink}>
              {r.min}
            </text>
          </g>
        );
      })}
      <path d={`M${x0},${34 + 24} L${x0},${104 - 4} M${x0 + 16 * cw},${34 + 24} L${x0 + 16 * cw},${104 - 4}`} stroke={inkMuted} strokeDasharray="3 3" />
      <text x={x0 + 16 * cw + 8} y={88} fontSize={10} fill={inkSecondary}>
        FP32의 앞 16비트 = BF16
      </text>
      <text x={14} y={222} fontSize={10} fill={inkSecondary}>
        <tspan fill={colors.red} fontWeight={700}>■</tspan> 부호 <tspan dx={10} fill={colors.blue} fontWeight={700}>■</tspan> 지수: 범위를 정한다 <tspan dx={10} fill={colors.orange} fontWeight={700}>■</tspan> 가수: 유효숫자(정밀도)를 정한다
      </text>
    </DiagramFrame>
  );
}

export function Fp16Range() {
  // 본문 코드: FP16에서 1e-8은 0이 되고, 1024배 하면 1.025e-5(비정규수)로 살아남아 ÷1024로 1.0012e-8이 복원된다. 70000은 inf.
  const P = "f16";
  const sx = log10Scale(1e-10, 1e6, 40, 690);
  const y = 112;
  const regions = [
    { a: 1e-10, b: 6e-8, c: colors.red, o: 0.12, t: "0이 된다", sub: "(underflow)" },
    { a: 6e-8, b: 6.1e-5, c: colors.yellow, o: 0.28, t: "비정규수", sub: "(정밀도 낮음)" },
    { a: 6.1e-5, b: 65504, c: colors.blue, o: 0.2, t: "정규수", sub: "(정상 범위)" },
    { a: 65504, b: 1e6, c: colors.red, o: 0.12, t: "inf", sub: "(overflow)" },
  ];
  return (
    <DiagramFrame
      title="FP16이 담을 수 있는 크기와 loss scaling"
      caption="가로축은 수의 크기(로그 눈금)다. FP16은 약 6 × 10⁻⁸보다 작은 수를 0으로, 65,504보다 큰 수를 inf로 만든다. 6 × 10⁻⁸ ~ 6.1 × 10⁻⁵ 구간은 비정규수로, 표현은 되지만 유효숫자가 줄어든다. 본문 코드처럼 10⁻⁸ 크기의 기울기는 FP16에서 0이 되지만, 손실을 1024배 키우면 기울기도 1024배인 약 1.0 × 10⁻⁵가 되어 살아남고, 갱신 직전에 1024로 나누면 1.0012 × 10⁻⁸로 거의 복원된다. 너무 크게 키우면 오른쪽 끝을 넘어 inf가 되므로 GradScaler가 배율을 자동으로 조절한다. BF16과 FP32는 10⁻³⁸ ~ 10³⁸까지 담아 이 그림 전체가 정상 범위다."
      viewBox="0 0 720 238"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ green: colors.green, red: colors.red }} />
      {regions.map((r) => (
        <g key={r.t}>
          <rect x={sx(r.a)} y={y - 34} width={sx(r.b) - sx(r.a)} height={34} fill={r.c} fillOpacity={r.o} />
          <text x={(sx(r.a) + sx(r.b)) / 2} y={y - 19} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
            {r.t}
          </text>
          <text x={(sx(r.a) + sx(r.b)) / 2} y={y - 6} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {r.sub}
          </text>
        </g>
      ))}
      <line x1={sx(1e-10)} x2={sx(1e6)} y1={y} y2={y} stroke={inkMuted} strokeWidth={1.2} />
      {[-10, -8, -6, -4, -2, 0, 2, 4, 6].map((e) => (
        <g key={e}>
          <line x1={sx(10 ** e)} x2={sx(10 ** e)} y1={y} y2={y + 5} stroke={inkMuted} />
          <text x={sx(10 ** e)} y={y + 18} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {pow10Label(10 ** e)}
          </text>
        </g>
      ))}
      <text x={sx(6.1e-5)} y={y - 40} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        6.1×10⁻⁵
      </text>
      <text x={sx(65504)} y={y - 40} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        65,504
      </text>
      <text x={sx(6e-8)} y={y - 40} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        6×10⁻⁸
      </text>
      <circle cx={sx(1e-8)} cy={y} r={5.5} fill={colors.red} />
      <text x={sx(1e-8)} y={y + 36} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.red}>
        기울기 10⁻⁸ → 0 ✗
      </text>
      <circle cx={sx(1.025e-5)} cy={y} r={5.5} fill={colors.green} />
      <ArrPath d={`M${sx(1e-8) + 4},${y + 44} C${sx(1e-8) + 60},${y + 74} ${sx(1.025e-5) - 60},${y + 74} ${sx(1.025e-5) - 2},${y + 10}`} color={colors.green} marker={`${P}-green`} width={1.6} />
      <text x={(sx(1e-8) + sx(1.025e-5)) / 2} y={y + 80} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.green}>
        × 1024 (loss scaling)
      </text>
      <Lines x={sx(1.025e-5) + 10} y={y + 34} lines={["1.025×10⁻⁵로 살아남음 ✓", "갱신 직전 ÷ 1024 → 1.0012×10⁻⁸"]} size={10.5} anchor="start" color={colors.green} weight={700} />
      <circle cx={sx(70000)} cy={y} r={5.5} fill={colors.red} />
      <text x={sx(70000)} y={y + 36} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.red}>
        70,000 → inf ✗
      </text>
      <rect x={sx(1e-10)} y={196} width={sx(1e6) - sx(1e-10)} height={14} rx={3} fill={colors.violet} fillOpacity={0.25} />
      <text x={(sx(1e-10) + sx(1e6)) / 2} y={207} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink}>
        BF16 · FP32: 이 구간 전체가 정상 범위 (10⁻³⁸ ~ 3.4×10³⁸)
      </text>
    </DiagramFrame>
  );
}

export function MoonsCapacity() {
  // MOONS_GRID 참조. 유닛 1개는 같은 설정으로 시드 6개 중 5개가 모든 ReLU가 꺼져 한 클래스만 답했다(그림은 살아남은 시드).
  const NX = 84;
  const NY = 54;
  const pts = MOONS_PTS.split(" ").map((t) => t.split(",").map(Number));
  const pw = 160;
  const ph = (pw * 2.7) / 4.2;
  return (
    <DiagramFrame
      title="은닉 유닛 수에 따른 결정 경계 (make_moons)"
      caption="본문 코드와 같은 구조(2 → h → h → 2, ReLU)와 설정(Adam, 학습률 0.01, 300 epoch)으로 은닉 유닛 수 h만 바꿔 학습한 결정 영역이다(NumPy로 다시 학습한 결과). 유닛이 1개면 경계가 직선 하나뿐이고, 2개·4개면 꺾인 직선 몇 조각으로 초승달을 흉내 낸다. 64개면 경계가 두 초승달 사이의 곡선을 따라간다. 숫자는 훈련 데이터 1,000개의 정확도다. 같은 설정이라도 초기값에 따라 결과가 달라지며, 유닛이 1개일 때는 시드 6개 중 5개에서 ReLU가 모두 꺼져 한 클래스만 답했다."
      viewBox="0 0 720 176"
      minWidth={600}
    >
      {MOONS_GRID.map((m, j) => {
        const x0 = 16 + j * (pw + 16);
        const y0 = 26;
        const sx = linear(-1.6, 2.6, x0, x0 + pw);
        const sy = linear(-1.1, 1.6, y0 + ph, y0);
        const cw = pw / NX;
        const chh = ph / NY;
        // 행마다 "파랑 칸 수.주황 칸 수.파랑 칸 수…"로 줄여 둔 결정 영역을 칸 단위 값(0 파랑, 1 주황)으로 펼친다.
        const keys = m.rle.split(";").map((row) => row.split(".").flatMap((nStr, k) => Array<number>(Number(nStr)).fill(k % 2)));
        return (
          <g key={m.h}>
            <text x={x0 + pw / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {`은닉 유닛 ${m.h}개`}
            </text>
            <g opacity={0.18}>
              <GridCells keys={keys} x={x0} y={y0} cw={cw} ch={chh} pad={0.4 / cw} fill={(k) => (k === 0 ? colors.blue : colors.orange)} />
            </g>
            {pts.map((p, i) => {
              const x = Math.round(sx(p[0]) * 10) / 10;
              const y = Math.round(sy(p[1]) * 10) / 10;
              return p[2] === 0 ? <circle key={i} cx={x} cy={y} r={2.2} fill={colors.blue} /> : <rect key={i} x={x - 2} y={y - 2} width={4} height={4} fill={colors.orange} />;
            })}
            <rect x={x0} y={y0} width={pw} height={ph} fill="none" stroke="var(--border-strong)" />
            <text x={x0 + pw / 2} y={y0 + ph + 18} textAnchor="middle" fontSize={11} fontWeight={700} fill={m.h === 64 ? colors.green : inkSecondary}>
              {`훈련 정확도 ${m.acc.toFixed(1)}%`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function NumpyVsTorchLoop() {
  // 본문의 두 학습 루프를 한 줄씩 짝지었다.
  const L = [
    { t: "y_pred = w * X + b", g: 0 },
    { t: "error = y_pred - y_true", g: 1 },
    { t: "loss = (error ** 2).mean()", g: 1 },
    { t: "grad_w = (2 * error * X).mean()", g: 2 },
    { t: "grad_b = (2 * error).mean()", g: 2 },
    { t: "w -= lr * grad_w", g: 3 },
    { t: "b -= lr * grad_b", g: 3 },
  ];
  const R = [
    { t: "pred = model(Xt)", g: 0 },
    { t: "loss = mse_loss(pred, yt)", g: 1 },
    { t: "opt.zero_grad()", g: 2 },
    { t: "loss.backward()", g: 2 },
    { t: "opt.step()", g: 3 },
  ];
  const gc = [colors.blue, colors.violet, colors.red, colors.orange];
  const gname = ["순전파", "손실", "기울기", "갱신"];
  const lh = 24;
  const ly0 = 52;
  const ry0 = 52;
  const span = (rows: { g: number }[], g: number, y0: number) => {
    const idx = rows.map((r, i) => (r.g === g ? i : -1)).filter((i) => i >= 0);
    return { top: y0 + idx[0] * lh, bot: y0 + (idx[idx.length - 1] + 1) * lh };
  };
  return (
    <DiagramFrame
      title="같은 학습 루프, 다른 분업: 미분과 갱신이 어디로 갔나"
      caption="왼쪽은 본문의 NumPy 루프, 오른쪽은 PyTorch 루프다. 같은 색끼리 같은 일을 한다. NumPy에서 빨간 두 줄(grad_w, grad_b)은 '선형회귀 + MSE'에만 맞는, 손으로 유도한 미분 공식이라 모델을 바꾸면 다시 유도해야 한다. PyTorch에서는 그 자리를 loss.backward()가, 갱신 두 줄을 opt.step()이 맡고, 루프 안에 w나 b가 한 번도 등장하지 않는다. 그래서 model을 더 복잡한 신경망으로 바꿔도 루프는 한 글자도 고치지 않는다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <text x={150} y={30} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        NumPy 수동 구현
      </text>
      <text x={570} y={30} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        PyTorch
      </text>
      {[0, 1, 2, 3].map((g) => {
        const a = span(L, g, ly0);
        const b = span(R, g, ry0 + (g >= 2 ? 0 : 0));
        return (
          <g key={g}>
            <path d={`M296,${a.top + 2} C350,${a.top + 2} 370,${b.top + 2} 424,${b.top + 2} L424,${b.bot - 2} C370,${b.bot - 2} 350,${a.bot - 2} 296,${a.bot - 2} Z`} fill={gc[g]} fillOpacity={0.12} />
            <text x={360} y={(a.top + a.bot + b.top + b.bot) / 4 + 4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={gc[g]}>
              {gname[g]}
            </text>
          </g>
        );
      })}
      {L.map((l, i) => (
        <g key={l.t}>
          <rect x={14} y={ly0 + i * lh + 2} width={282} height={lh - 4} rx={4} fill={gc[l.g]} fillOpacity={l.g === 2 ? 0.22 : 0.08} stroke={gc[l.g]} strokeOpacity={0.6} />
          <text x={24} y={ly0 + i * lh + 16} fontSize={10.5} fill={ink} fontFamily={mono} fontWeight={l.g === 2 ? 700 : 400}>
            {l.t}
          </text>
        </g>
      ))}
      {R.map((r, i) => (
        <g key={r.t}>
          <rect x={424} y={ry0 + i * lh + 2} width={282} height={lh - 4} rx={4} fill={gc[r.g]} fillOpacity={0.08} stroke={gc[r.g]} strokeOpacity={0.6} />
          <text x={434} y={ry0 + i * lh + 16} fontSize={10.5} fill={ink} fontFamily={mono}>
            {r.t}
          </text>
        </g>
      ))}
      <Tag x={14} y={230} w={282} h={26} lines={["빨간 줄: 모델이 바뀌면 다시 유도해야 한다"]} color={colors.red} size={10.5} />
      <Tag x={424} y={176} w={282} h={42} lines={["w, b를 직접 부르는 줄이 하나도 없다", "model만 바꾸면 루프는 그대로"]} color={colors.green} size={10.5} />
    </DiagramFrame>
  );
}

export function DropoutSubnets() {
  // 학습 중 매 스텝 다른 뉴런을 끈다(그림은 설명용 마스크). 평가 때는 전부 켜고 아무것도 하지 않는다(역드롭아웃).
  const P = "dsn";
  const layers = [3, 5, 5, 2];
  const masks: number[][][] = [
    [[], [1, 3], [0], []],
    [[], [0, 4], [2, 3], []],
    [[], [2], [1, 4], []],
    [[], [], [], []],
  ];
  const titles = ["스텝 1", "스텝 2", "스텝 3", "평가 (model.eval())"];
  const pw = 118;
  const net = (x0: number, mask: number[][], evalMode: boolean) => {
    const pos = layers.map((n, l) => Array.from({ length: n }, (_, i) => ({ x: x0 + 10 + l * ((pw - 20) / 3), y: 58 + (i - (n - 1) / 2) * 24 + 52 })));
    const off = (l: number, i: number) => mask[l].includes(i);
    return (
      <g>
        {pos.slice(0, -1).map((col, l) =>
          col.map((a, i) =>
            pos[l + 1].map((b, k) => (off(l, i) || off(l + 1, k) ? null : <line key={`${l}-${i}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={evalMode ? colors.green : colors.blue} strokeOpacity={0.35} strokeWidth={0.9} />)),
          ),
        )}
        {pos.map((col, l) =>
          col.map((p, i) =>
            off(l, i) ? (
              <g key={`${l}-${i}`}>
                <circle cx={p.x} cy={p.y} r={7} fill="var(--surface-card)" stroke={inkMuted} strokeDasharray="2 2" />
                <path d={`M${p.x - 4},${p.y - 4} L${p.x + 4},${p.y + 4} M${p.x - 4},${p.y + 4} L${p.x + 4},${p.y - 4}`} stroke={colors.red} strokeWidth={1.6} />
              </g>
            ) : (
              <circle key={`${l}-${i}`} cx={p.x} cy={p.y} r={7} fill={l === 0 || l === 3 ? card2Bg : evalMode ? colors.green : colors.blue} fillOpacity={l === 0 || l === 3 ? 1 : 0.7} stroke={l === 0 || l === 3 ? inkMuted : "none"} />
            ),
          ),
        )}
      </g>
    );
  };
  const bx = linear(0, 1.1, 0, 120);
  return (
    <DiagramFrame
      title="드롭아웃: 매 스텝 다른 부분망을 학습하고, 평가 때는 전체를 쓴다"
      caption="학습 중에는 스텝마다 은닉 뉴런 일부를 확률 p로 끈다(✗, 그림은 설명용 예시). 어떤 뉴런도 특정 동료가 항상 있다고 기대할 수 없어 각자 쓸모 있는 특징을 배우게 되고, 스텝마다 다른 부분망을 학습하는 셈이 된다. 평가 때는 전부 켠다. 그때 다음 층에 들어가는 평균이 학습 때와 같도록, 학습 중 살아남은 값을 1/(1 − p)배 해 두는 것이 역드롭아웃이다. 오른쪽은 본문 코드(p = 0.2)의 결과로, 끄기만 하면 평균이 0.8로 줄지만 역드롭아웃은 1을 지킨다."
      viewBox="0 0 720 236"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      {titles.map((t, j) => {
        const x0 = 10 + j * (pw + 8);
        return (
          <g key={t}>
            <text x={x0 + pw / 2} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={j === 3 ? colors.green : ink}>
              {t}
            </text>
            <rect x={x0} y={28} width={pw} height={164} rx={8} fill="none" stroke="var(--border-hairline)" />
            {net(x0, masks[j], j === 3)}
            <text x={x0 + pw / 2} y={210} textAnchor="middle" fontSize={10} fill={j === 3 ? colors.green : inkSecondary} fontWeight={700}>
              {j === 3 ? "전부 켜고 그대로" : "살아남은 값 × 1/(1 − p)"}
            </text>
          </g>
        );
      })}
      <text x={600} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        평균 (p = 0.2, 값이 모두 1)
      </text>
      {[
        { t: "끄기만", v: 0.8, c: colors.red },
        { t: "역드롭아웃", v: 1.0, c: colors.blue },
        { t: "평가 (전부 켬)", v: 1.0, c: colors.green },
      ].map((b, i) => {
        const y = 48 + i * 48;
        return (
          <g key={b.t}>
            <text x={538} y={y} fontSize={10.5} fontWeight={700} fill={ink}>
              {b.t}
            </text>
            <rect x={538} y={y + 6} width={bx(b.v)} height={16} rx={3} fill={b.c} fillOpacity={0.6} />
            <text x={538 + bx(b.v) - 6} y={y + 18} textAnchor="end" fontSize={10.5} fontWeight={800} fill={ink}>
              {b.v.toFixed(1)}
            </text>
          </g>
        );
      })}
      <line x1={538 + bx(1)} x2={538 + bx(1)} y1={46} y2={190} stroke={inkMuted} strokeDasharray="3 3" />
    </DiagramFrame>
  );
}

export function EarlyStopping() {
  // 개념도: 훈련 손실은 계속 줄고 검증 손실은 U자. patience = 10 epoch 동안 개선이 없으면 멈추고 최저점 체크포인트로 돌아간다.
  const P = "ers";
  const train = (t: number) => 0.12 + 0.9 * Math.exp(-t / 9);
  const val = (t: number) => 0.3 + 0.75 * Math.exp(-t / 7) + 0.00055 * t * t;
  const acc = (t: number) => 0.87 - 0.37 * Math.exp(-t / 5);
  const ts = Array.from({ length: 601 }, (_, i) => i / 10);
  const tBest = ts.reduce((b, t) => (val(t) < val(b) ? t : b), 0);
  const best = Math.round(tBest);
  const stop = best + 10;
  const G = { left: 50, top: 18, width: 330, height: 170 };
  const sx = linear(0, 60, G.left, G.left + G.width);
  const sy = linear(0, 1.1, G.top + G.height, G.top);
  const G2 = { left: 450, top: 18, width: 250, height: 170 };
  const sx2 = linear(0, 60, G2.left, G2.left + G2.width);
  const sy2 = linear(0.4, 1, G2.top + G2.height, G2.top);
  return (
    <DiagramFrame
      title="조기 종료: 검증 손실이 가장 낮았던 시점으로 돌아간다"
      caption={`개념도다. 왼쪽: 훈련 손실(파랑)은 학습할수록 계속 줄지만 검증 손실(주황)은 ${best} epoch 부근에서 바닥을 찍고 다시 오른다. 조기 종료는 검증 손실을 기록하다가 patience(여기서는 10 epoch) 동안 최저 기록을 깨지 못하면 ${stop} epoch에서 멈추고, 최저였던 ${best} epoch의 체크포인트를 최종 모델로 쓴다. 오른쪽: 같은 구간에서 검증 정확도는 거의 그대로다. 모델이 틀리는 샘플을 점점 더 확신하며 틀리기 시작하면 교차 엔트로피가 먼저 오르므로, 과적합은 정확도보다 손실에서 먼저 보인다.`}
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ green: colors.green }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 20, 40, 60]} yTicks={[0, 0.5, 1]} xLabel="epoch" yLabel="손실" />
      <rect x={sx(best)} y={G.top} width={sx(stop) - sx(best)} height={G.height} fill={colors.yellow} fillOpacity={0.18} />
      <text x={(sx(best) + sx(stop)) / 2} y={G.top + 12} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={inkSecondary}>
        patience 10
      </text>
      <clipPath id={`${P}-clip`}>
        <rect x={G.left} y={G.top} width={G.width} height={G.height} />
      </clipPath>
      <g clipPath={`url(#${P}-clip)`}>
        <path d={linePath(sample(train, 0, 60, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.2} />
        <path d={linePath(sample(val, 0, stop, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={2.4} />
        <path d={linePath(sample(val, stop, 60, 60).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={1.4} strokeDasharray="4 3" opacity={0.6} />
      </g>
      <circle cx={sx(best)} cy={sy(val(best))} r={5} fill={colors.green} stroke="var(--surface-card)" strokeWidth={1.5} />
      <line x1={sx(stop)} x2={sx(stop)} y1={G.top} y2={G.top + G.height} stroke={colors.red} strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={sx(stop) + 4} y={G.top + G.height - 6} fontSize={10} fontWeight={800} fill={colors.red}>
        {`${stop}에서 멈춤`}
      </text>
      <ArrPath d={`M${sx(stop) - 2},${sy(val(stop)) - 8} C${sx(stop) - 10},${sy(val(stop)) - 40} ${sx(best) + 10},${sy(val(best)) - 44} ${sx(best) + 2},${sy(val(best)) - 9}`} color={colors.green} marker={`${P}-green`} width={1.6} />
      <text x={(sx(best) + sx(stop)) / 2} y={sy(val(best)) - 46} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`${best} epoch 체크포인트로`}
      </text>
      <text x={sx(52)} y={sy(train(52)) - 8} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.blue}>
        훈련
      </text>
      <text x={sx(33)} y={sy(val(33)) + 4} fontSize={10.5} fontWeight={800} fill={colors.orange}>
        검증
      </text>
      <Axes {...G2} sx={sx2} sy={sy2} xTicks={[0, 20, 40, 60]} yTicks={[0.4, 0.6, 0.8, 1]} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="epoch" />
      <rect x={sx2(best)} y={G2.top} width={sx2(60) - sx2(best)} height={G2.height} fill={colors.orange} fillOpacity={0.08} />
      <path d={linePath(sample(acc, 0, 60, 160).map(([x, y]) => [sx2(x), sy2(y)] as [number, number]))} fill="none" stroke={colors.green} strokeWidth={2.2} />
      <text x={G2.left + G2.width / 2} y={12} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        검증 정확도
      </text>
      <Lines x={sx2(best) + 8} y={sy2(0.62)} lines={["이 구간에서 정확도는 그대로,", "손실만 오른다 = 과신"]} size={10} anchor="start" color={colors.orange} weight={700} />
    </DiagramFrame>
  );
}

export function WarmupCosine() {
  // 예시 설정: 전체 T = 10,000 스텝, 워밍업 500 스텝, η_max = 3×10⁻⁴, η_min = 3×10⁻⁵. 본문의 코사인 식 그대로.
  const T = 10000;
  const W = 500;
  const eMax = 3e-4;
  const eMin = 3e-5;
  const lr = (t: number) => (t < W ? (eMax * t) / W : eMin + 0.5 * (eMax - eMin) * (1 + Math.cos((Math.PI * (t - W)) / (T - W))));
  const G = { left: 64, top: 18, width: 470, height: 170 };
  const sx = linear(0, T, G.left, G.left + G.width);
  const sy = linear(0, 3.4e-4, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="선형 워밍업 + 코사인 감쇠 학습률 스케줄"
      caption="예시 설정(전체 10,000 스텝, 워밍업 500 스텝, 최대 3 × 10⁻⁴, 최소 3 × 10⁻⁵)으로 본문의 식을 그대로 그렸다. 처음 500 스텝은 0 근처에서 최댓값까지 선형으로 올려, 파라미터와 Adam의 통계가 아직 불안정할 때 큰 걸음을 피한다. 그 뒤에는 코사인 곡선을 따라 처음에는 천천히, 중간에는 빠르게, 끝에서는 다시 천천히 줄여 최솟값에 닿는다. 앞부분의 큰 학습률은 넓게 탐색하고, 끝부분의 작은 학습률은 최솟값 근처에서 진동하지 않고 정착하게 한다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 2500, 5000, 7500, 10000]} yTicks={[0, 1e-4, 2e-4, 3e-4]} fmtX={(v) => v.toLocaleString("en-US")} fmtY={(v) => (v === 0 ? "0" : `${Math.round(v * 1e4)}×10⁻⁴`)} xLabel="스텝" />
      <rect x={sx(0)} y={G.top} width={sx(W) - sx(0)} height={G.height} fill={colors.yellow} fillOpacity={0.2} />
      <line x1={G.left} x2={G.left + G.width} y1={sy(eMax)} y2={sy(eMax)} stroke={inkMuted} strokeDasharray="4 3" />
      <line x1={G.left} x2={G.left + G.width} y1={sy(eMin)} y2={sy(eMin)} stroke={inkMuted} strokeDasharray="4 3" />
      <path d={linePath(sample(lr, 0, T, 400).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <text x={sx(W) + 6} y={sy(1.2e-4)} fontSize={10} fontWeight={700} fill={inkSecondary}>
        ← 워밍업 500 스텝
      </text>
      <text x={sx(1000)} y={sy(2.2e-4)} fontSize={10.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        큰 학습률: 넓게 탐색
      </text>
      <text x={sx(9900)} y={sy(eMin) - 10} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        작은 학습률: 최솟값 근처에 정착
      </text>
      <text x={G.left + G.width + 8} y={sy(eMax) + 4} fontSize={10} fill={inkSecondary}>
        η_max
      </text>
      <text x={G.left + G.width + 8} y={sy(eMin) + 4} fontSize={10} fill={inkSecondary}>
        η_min
      </text>
      <Lines x={598} y={60} lines={["워밍업: 0 → η_max", "(선형)", "", "이후: 코사인으로", "η_max → η_min"]} size={10.5} anchor="start" color={ink} weight={600} />
    </DiagramFrame>
  );
}

const ADAMW_CURVES = {
  l2zero: [1, 0.9405, 0.8827, 0.8267, 0.7726, 0.7205, 0.6702, 0.6219, 0.5755, 0.5311, 0.4888, 0.4484, 0.41, 0.3737, 0.3394, 0.3071, 0.2768, 0.2484, 0.2221, 0.1977, 0.1751, 0.1544, 0.1355, 0.1183, 0.1028, 0.0888, 0.0762, 0.0651, 0.0552, 0.0466, 0.0391, 0.0325, 0.0269, 0.0221, 0.018, 0.0146, 0.0117, 0.0093, 0.0074, 0.0058, 0.0045, 0.0035, 0.0026, 0.002, 0.0015, 0.0011, 0.0008, 0.0006, 0.0004, 0.0003, 0.0002],
  wzero0_0001: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9998, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997],
  wzero0_01: [1, 0.9994, 0.9988, 0.9982, 0.9976, 0.997, 0.9964, 0.9958, 0.9952, 0.9946, 0.994, 0.9934, 0.9928, 0.9922, 0.9916, 0.991, 0.9904, 0.9899, 0.9893, 0.9887, 0.9881, 0.9875, 0.9869, 0.9863, 0.9857, 0.9851, 0.9845, 0.9839, 0.9833, 0.9828, 0.9822, 0.9816, 0.981, 0.9804, 0.9798, 0.9792, 0.9786, 0.978, 0.9775, 0.9769, 0.9763, 0.9757, 0.9751, 0.9745, 0.9739, 0.9734, 0.9728, 0.9722, 0.9716, 0.971, 0.9704],
  wzero1_0: [1, 0.9417, 0.8869, 0.8352, 0.7865, 0.7407, 0.6976, 0.6569, 0.6186, 0.5826, 0.5486, 0.5167, 0.4866, 0.4582, 0.4315, 0.4064, 0.3827, 0.3604, 0.3394, 0.3196, 0.301, 0.2835, 0.267, 0.2514, 0.2368, 0.223, 0.21, 0.1977, 0.1862, 0.1754, 0.1652, 0.1555, 0.1465, 0.1379, 0.1299, 0.1223, 0.1152, 0.1085, 0.1022, 0.0962, 0.0906, 0.0853, 0.0804, 0.0757, 0.0713, 0.0671, 0.0632, 0.0595, 0.0561, 0.0528, 0.0497],
  l2n0_1: [1, 0.9575, 0.9169, 0.8771, 0.839, 0.8022, 0.767, 0.732, 0.6987, 0.6665, 0.6364, 0.607, 0.579, 0.552, 0.5257, 0.501, 0.4765, 0.4529, 0.4306, 0.4093, 0.3886, 0.3688, 0.3494, 0.3312, 0.314, 0.2979, 0.2824, 0.2671, 0.2528, 0.24, 0.2272, 0.2152, 0.2035, 0.1924, 0.1818, 0.1719, 0.1629, 0.1543, 0.1457, 0.138, 0.1313, 0.1243, 0.1172, 0.1105, 0.1036, 0.0979, 0.0933, 0.0885, 0.083, 0.0782, 0.0736],
  l2n1_0: [1, 0.9937, 0.9881, 0.9818, 0.9758, 0.9699, 0.9645, 0.9579, 0.9518, 0.9456, 0.9406, 0.9352, 0.9301, 0.9251, 0.9196, 0.9149, 0.9092, 0.9033, 0.898, 0.8926, 0.887, 0.8814, 0.8754, 0.8697, 0.8643, 0.8593, 0.8541, 0.8484, 0.843, 0.8386, 0.8336, 0.8287, 0.8235, 0.8185, 0.8134, 0.8085, 0.8041, 0.7997, 0.7947, 0.7904, 0.7866, 0.7823, 0.7774, 0.7726, 0.7673, 0.7628, 0.7592, 0.7551, 0.7501, 0.7455, 0.7409],
  l2n10_0: [1, 0.999, 0.9988, 0.9978, 0.997, 0.9963, 0.9962, 0.9947, 0.9937, 0.9926, 0.9926, 0.9923, 0.9922, 0.9921, 0.9915, 0.9917, 0.9909, 0.9899, 0.9893, 0.9887, 0.9879, 0.987, 0.9856, 0.9845, 0.9837, 0.9833, 0.9826, 0.9814, 0.9805, 0.9805, 0.9799, 0.9794, 0.9786, 0.9779, 0.9771, 0.9765, 0.9763, 0.9761, 0.9753, 0.9751, 0.9755, 0.9753, 0.9745, 0.9738, 0.9725, 0.972, 0.9723, 0.9722, 0.9712, 0.9704, 0.9697],
  wn: [1, 0.9936, 0.9881, 0.9817, 0.9757, 0.9698, 0.9644, 0.9578, 0.9516, 0.9454, 0.9404, 0.9351, 0.9299, 0.9249, 0.9194, 0.9147, 0.909, 0.9031, 0.8978, 0.8924, 0.8868, 0.8812, 0.8751, 0.8694, 0.864, 0.859, 0.8538, 0.848, 0.8426, 0.8382, 0.8332, 0.8283, 0.8231, 0.8181, 0.813, 0.8081, 0.8037, 0.7992, 0.7942, 0.7899, 0.7861, 0.7818, 0.7769, 0.7721, 0.7667, 0.7623, 0.7586, 0.7546, 0.7496, 0.745, 0.7404],
};
const WARMUP_Q = [[1, 0.3872, 1.4794, 78.0207, 815.02], [2, 0.4641, 1.1996, 9.9957, 32.1351], [3, 0.5129, 1.126, 5.0828, 11.3677], [4, 0.5468, 1.0914, 3.6405, 6.4858], [6, 0.5971, 1.0601, 2.6122, 3.9735], [10, 0.6561, 1.0354, 1.9757, 2.5768], [16, 0.7057, 1.0217, 1.665, 2.0332], [25, 0.7508, 1.0137, 1.4717, 1.6934], [40, 0.7938, 1.0089, 1.3445, 1.4979], [63, 0.8278, 1.0054, 1.2569, 1.3654], [100, 0.8592, 1.0034, 1.195, 1.2737], [160, 0.8848, 1.0021, 1.1491, 1.2049], [250, 0.9057, 1.0013, 1.1156, 1.1579], [400, 0.9233, 1.0009, 1.0896, 1.1216], [630, 0.9372, 1.0004, 1.0707, 1.0962], [1000, 0.9485, 1.0003, 1.0566, 1.0758]];
const GRAD_NORMS = {
  g0_8: [1, 0.7897, 0.6452, 0.5192, 0.418, 0.3363, 0.265, 0.2192, 0.177, 0.1381, 0.1116, 0.08743, 0.06865, 0.0529, 0.0422, 0.03384, 0.02746, 0.02182, 0.01735, 0.01375, 0.01076, 0.00854, 0.006842, 0.005538, 0.004436, 0.003534, 0.002794, 0.002197, 0.00176, 0.001425, 0.001116, 0.000878, 0.000705, 0.000568, 0.00045, 0.000356, 0.000284, 0.000226, 0.000177, 0.000138, 0.00011, 8.8e-05, 7.2e-05, 5.7e-05, 4.5e-05, 3.7e-05, 3e-05, 2.4e-05, 1.9e-05, 1.5e-05, 1.2e-05],
  g1_0: [1, 0.9873, 0.988, 0.9882, 0.9611, 0.9878, 0.9843, 0.985, 0.9643, 0.9732, 0.9792, 0.9745, 0.9799, 0.9616, 0.952, 0.9567, 0.9523, 0.936, 0.9194, 0.9237, 0.9212, 0.9081, 0.9207, 0.923, 0.9274, 0.952, 0.9255, 0.9226, 0.9423, 0.9467, 0.9784, 0.9781, 0.9674, 0.9859, 0.9752, 1.007, 1.013, 1.034, 1.032, 1.012, 0.999, 1.012, 1.008, 1.023, 0.9997, 0.9926, 0.9904, 0.9745, 0.9796, 0.9747, 0.979],
  g1_2: [1, 1.193, 1.442, 1.767, 2.136, 2.584, 3.069, 3.791, 4.632, 5.447, 6.598, 7.954, 9.395, 11.35, 13.47, 16.28, 19.45, 23.26, 28.21, 34.02, 39.63, 47.35, 57.55, 69.13, 82.18, 96.91, 118, 140.4, 170.6, 207.4, 251.3, 302.4, 360, 427.1, 490.1, 596.7, 708, 870.3, 1041, 1221, 1425, 1730, 2072, 2484, 2953, 3572, 4307, 5145, 6277, 7721, 9166],
  res: [1, 1.007, 1.013, 1.023, 1.029, 1.038, 1.047, 1.058, 1.067, 1.077, 1.09, 1.102, 1.112, 1.125, 1.136, 1.148, 1.156, 1.162, 1.173, 1.185, 1.195, 1.209, 1.222, 1.233, 1.244, 1.261, 1.275, 1.289, 1.305, 1.315, 1.328, 1.337, 1.351, 1.359, 1.376, 1.389, 1.409, 1.424, 1.432, 1.45, 1.459, 1.478, 1.49, 1.512, 1.52, 1.54, 1.555, 1.564, 1.575, 1.591, 1.611],
};

export function ForwardReverseMode() {
  // 입력(파라미터) n = 6개, 은닉 4, 출력(손실) m = 1인 합성 함수 f = f₃ ∘ f₂ ∘ f₁의 야코비안 J = J₃J₂J₁(1 × 6).
  const P = "frm";
  const c = 12;
  const col = (x: number, yc: number, n: number, color: string, op = 0.35) => (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={yc - (n * c) / 2 + i * c} width={c} height={c} fill={color} fillOpacity={op} stroke={color} strokeWidth={1} />
      ))}
    </g>
  );
  const row = (x: number, yc: number, n: number, color: string, op = 0.35) => (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * c} y={yc - c / 2} width={c} height={c} fill={color} fillOpacity={op} stroke={color} strokeWidth={1} />
      ))}
    </g>
  );
  const ya = 84;
  const yb = 196;
  const step = (x1: number, x2: number, y: number, t: string, color: string) => (
    <g>
      <Arr x1={x1} y1={y} x2={x2} y2={y} color={color} marker={`${P}-${color === colors.blue ? "blue" : "orange"}`} />
      <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={color}>
        {t}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="자동미분의 두 모드: 야코비안 사슬을 어느 쪽부터 곱하는가"
      caption="입력(파라미터) 6개, 출력(손실) 1개인 함수의 야코비안 J = J₃J₂J₁을 벡터와 곱하는 두 방법이다. 칸 하나가 숫자 하나다. 순방향 모드(위)는 입력 쪽 방향 벡터 v(6개)에서 출발해 순전파와 같은 방향으로 J₁, J₂, J₃을 차례로 곱한다. 한 번 지나가면 '입력을 v 방향으로 움직였을 때 출력의 변화' 하나를 얻으므로, 기울기 6개를 다 얻으려면 v를 바꿔 가며 6번 지나가야 한다. 역방향 모드(아래)는 출력 쪽 uᵀ(손실이면 숫자 1)에서 출발해 거꾸로 J₃, J₂, J₁을 곱하고, 한 번에 기울기 6개를 모두 얻는다. 파라미터가 수억 개이고 손실이 하나인 신경망에서 역전파(역방향 모드)가 표준인 이유다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <text x={20} y={22} fontSize={11.5} fontWeight={800} fill={colors.blue}>
        순방향 모드 (JVP): J v를 오른쪽부터 = 순전파 방향
      </text>
      {col(40, ya, 6, colors.blue, 0.6)}
      <text x={32} y={ya + 4} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
        v
      </text>
      {step(60, 112, ya, "× J₁", colors.blue)}
      {col(120, ya, 4, colors.blue)}
      {step(140, 192, ya, "× J₂", colors.blue)}
      {col(200, ya, 4, colors.blue)}
      {step(220, 272, ya, "× J₃", colors.blue)}
      {col(280, ya, 1, colors.blue, 0.8)}
      <Lines x={302} y={ya - 4} lines={["= J v", "출력 변화 1개"]} size={10.5} anchor="start" color={ink} weight={700} gap={1.4} />
      <text x={20} y={136} fontSize={10.5} fill={inkSecondary}>
        입력 방향 하나당 한 번 → 기울기 6개를 다 얻으려면 v = e₁, …, e₆으로 6번
      </text>
      <line x1={14} x2={420} y1={150} y2={150} stroke="var(--border-hairline)" />
      <text x={20} y={170} fontSize={11.5} fontWeight={800} fill={colors.orange}>
        역방향 모드 (VJP): uᵀ J를 왼쪽부터 = 역전파 방향
      </text>
      {row(40, yb, 1, colors.orange, 0.8)}
      <text x={32} y={yb + 4} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
        uᵀ
      </text>
      {step(60, 104, yb, "× J₃", colors.orange)}
      {row(112, yb, 4, colors.orange)}
      {step(168, 212, yb, "× J₂", colors.orange)}
      {row(220, yb, 4, colors.orange)}
      {step(276, 312, yb, "× J₁", colors.orange)}
      {row(320, yb, 6, colors.orange, 0.6)}
      <text x={356} y={yb + 22} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={ink}>
        = 기울기 6개 전부
      </text>
      <text x={20} y={244} fontSize={10.5} fill={inkSecondary}>
        출력 하나당 한 번 → 손실은 스칼라이므로 한 번이면 끝
      </text>
      <line x1={440} y1={14} x2={440} y2={248} stroke="var(--border-hairline)" />
      <text x={456} y={34} fontSize={11.5} fontWeight={800} fill={ink}>
        기울기 전체에 필요한 패스 수
      </text>
      <text x={456} y={66} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        순방향: 입력 수 n번
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={456 + i * 30} y={74} width={26} height={18} rx={3} fill={colors.blue} fillOpacity={0.5} />
      ))}
      <text x={456} y={120} fontSize={10.5} fontWeight={700} fill={colors.orange}>
        역방향: 출력 수 m번
      </text>
      <rect x={456} y={128} width={26} height={18} rx={3} fill={colors.orange} fillOpacity={0.6} />
      <rect x={456} y={164} width={246} height={74} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <Lines x={468} y={186} lines={["신경망: n ≈ 수억(파라미터), m = 1(손실)", "역방향 1번의 비용 ≈ 순전파의 2~3배", "입력 1개·출력 여럿이면 순방향이 유리"]} size={10.5} anchor="start" color={ink} weight={600} gap={1.55} />
    </DiagramFrame>
  );
}

export function DualNumberTrace() {
  // 본문 코드: f(x) = x³ + 3x를 x = 2에서. 이원수: x = 2 + 1ε → x·x = 4 + 4ε → (x·x)·x = 8 + 12ε, 3x = 6 + 3ε → 합 14 + 15ε.
  // 역방향(micrograd): y.grad = 1 → b.grad = c.grad = 1 → a.grad = x = 2, x는 b에서 a = 4, a에서 2x·a.grad = 8, c에서 3을 받아 15.
  const P = "dnt";
  const W = 100;
  const H = 42;
  const node = (p: number[], op: string, top: string, bottom: string | null, color: string) => (
    <g>
      <rect x={p[0]} y={p[1]} width={W} height={H} rx={7} fill={color} fillOpacity={0.1} stroke={color} strokeWidth={1.4} />
      <text x={p[0] + W / 2} y={p[1] + 13} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={inkSecondary}>
        {op}
      </text>
      <text x={p[0] + W / 2} y={p[1] + (bottom ? 26 : 31)} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
        {top}
      </text>
      {bottom && (
        <text x={p[0] + W / 2} y={p[1] + 38} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.orange} fontFamily={mono}>
          {bottom}
        </text>
      )}
    </g>
  );
  // 세 줄: a는 위, x·b·y는 가운데, c는 아래.
  const pos = (oy: number) => ({ x: [16, oy + 30], a: [142, oy], b: [268, oy + 30], c: [142, oy + 60], y: [394, oy + 30] });
  const T = pos(26);
  const B = pos(158);
  const edges = (p: ReturnType<typeof pos>, color: string, m: string) => (
    <g>
      <Arr x1={p.x[0] + W} y1={p.x[1] + 14} x2={p.a[0] - 3} y2={p.a[1] + H / 2} color={color} marker={m} width={1.3} />
      <Arr x1={p.x[0] + W} y1={p.x[1] + H / 2} x2={p.b[0] - 3} y2={p.b[1] + H / 2} color={color} marker={m} width={1.3} />
      <Arr x1={p.x[0] + W} y1={p.x[1] + H - 14} x2={p.c[0] - 3} y2={p.c[1] + H / 2} color={color} marker={m} width={1.3} />
      <Arr x1={p.a[0] + W} y1={p.a[1] + H / 2} x2={p.b[0] - 3} y2={p.b[1] + 12} color={color} marker={m} width={1.3} />
      <Arr x1={p.b[0] + W} y1={p.b[1] + H / 2} x2={p.y[0] - 3} y2={p.y[1] + H / 2} color={color} marker={m} width={1.3} />
      <Arr x1={p.c[0] + W} y1={p.c[1] + H / 2} x2={p.y[0] + 14} y2={p.y[1] + H + 3} color={color} marker={m} width={1.3} />
    </g>
  );
  return (
    <DiagramFrame
      title="같은 f′(2) = 15를 얻는 두 길: 이원수(순방향)와 역전파(역방향)"
      caption="본문 코드의 f(x) = x³ + 3x를 x = 2에서 미분한다(a = x·x, b = a·x, c = 3·x, y = b + c). 위(순방향 모드): 모든 값을 '값 + 미분·ε' 한 쌍으로 들고 다닌다. x = 2 + 1ε에서 출발해 곱셈마다 (a + bε)(c + dε) = ac + (ad + bc)ε, 즉 곱의 미분법을 적용하면 순전파 한 번이 끝날 때 14 + 15ε, 곧 f(2) = 14와 f′(2) = 15가 함께 나온다. 그래프를 저장하지도 거꾸로 가지도 않는다. 아래(역방향 모드, micrograd): 순전파로 값만 계산해 저장한 뒤, 출력의 기울기 1에서 출발해 국소 미분을 곱하며 거꾸로 내려간다. x는 세 경로에서 4, 8, 3을 받아 더한 15가 된다. 입력이 하나뿐인 이 예에서는 두 방법의 일이 비슷하지만, 입력이 n개면 순방향은 n번, 역방향은 한 번이다."
      viewBox="0 0 720 300"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, ink: inkMuted }} />
      <text x={16} y={16} fontSize={11} fontWeight={800} fill={colors.blue}>
        순방향 모드: (값 + 미분ε) 한 쌍이 앞으로 흐른다 →
      </text>
      {edges(T, colors.blue, `${P}-blue`)}
      {node(T.x, "x", "2 + 1ε", null, colors.blue)}
      {node(T.a, "a = x·x", "4 + 4ε", null, colors.blue)}
      {node(T.b, "b = a·x", "8 + 12ε", null, colors.blue)}
      {node(T.c, "c = 3·x", "6 + 3ε", null, colors.blue)}
      {node(T.y, "y = b + c", "14 + 15ε", null, colors.blue)}
      <line x1={10} x2={506} y1={138} y2={138} stroke="var(--border-hairline)" />
      <text x={16} y={152} fontSize={11} fontWeight={800} fill={colors.orange}>
        역방향 모드: 값을 저장한 뒤, 기울기(grad)가 거꾸로 흐른다 ←
      </text>
      {edges(B, inkMuted, `${P}-ink`)}
      {node(B.x, "x", "2", "grad 15", colors.orange)}
      {node(B.a, "a = x·x", "4", "grad 2", colors.orange)}
      {node(B.b, "b = a·x", "8", "grad 1", colors.orange)}
      {node(B.c, "c = 3·x", "6", "grad 1", colors.orange)}
      {node(B.y, "y = b + c", "14", "grad 1", colors.orange)}
      <line x1={516} y1={14} x2={516} y2={288} stroke="var(--border-hairline)" />
      <text x={530} y={34} fontSize={11.5} fontWeight={800} fill={ink}>
        곱셈 규칙 = 곱의 미분법
      </text>
      <text x={530} y={58} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
        (a + bε)(c + dε)
      </text>
      <text x={530} y={76} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
        = ac + (ad + bc)ε
      </text>
      <Lines x={530} y={98} lines={["ε² = 0이라 2차 이상 항이 사라진다", "한 번에 값과 미분, 저장 없음"]} size={10} anchor="start" color={colors.blue} weight={700} gap={1.5} />
      <text x={530} y={176} fontSize={11.5} fontWeight={800} fill={ink}>
        x.grad = 세 경로의 합
      </text>
      <Lines x={530} y={200} lines={["b를 거쳐: a × 1 = 4", "a를 거쳐: 2x × a.grad = 2·2 × 2 = 8", "c를 거쳐: 3 × 1 = 3", "합: 4 + 8 + 3 = 15"]} size={10} anchor="start" color={colors.orange} weight={700} gap={1.6} />
    </DiagramFrame>
  );
}

export function CheckpointMemory() {
  // 층 L = 16. 모두 저장하면 활성화 16개. k = 4층마다 체크포인트(4개)를 두고 역전파 중 한 구간(4층)씩만 다시 계산하면 최대 4 + 4 = 8개.
  // 일반적으로 L/k + k, k = √L에서 최소 2√L(L = 100이면 20).
  const L = 16;
  const cw = 22;
  const x0 = 62;
  const cell = (i: number, y: number, fill: string, op: number, dashed = false) => (
    <rect key={i} x={x0 + i * cw} y={y} width={cw - 3} height={20} rx={3} fill={fill} fillOpacity={op} stroke={dashed ? colors.orange : "none"} strokeDasharray={dashed ? "3 2" : undefined} strokeWidth={1.4} />
  );
  const G = { left: 476, top: 34, width: 222, height: 160 };
  const sx = log10Scale(1, 100, G.left, G.left + G.width);
  const sy = linear(0, 110, G.top + G.height, G.top);
  const mem = (k: number) => 100 / k + k;
  return (
    <DiagramFrame
      title="그레이디언트 체크포인팅: 계산을 한 번 더 해서 메모리를 √L로 줄인다"
      caption="층이 16개인 신경망의 역전파에 필요한 활성화 저장을 칸으로 그렸다. 위: 보통의 역전파는 순전파에서 계산한 활성화 16개를 모두 들고 있어야 한다(메모리 ∝ L). 아래: 4층마다 체크포인트(진한 칸, 4·8·12·16층) 4개만 남기고 나머지는 버린다. 역전파가 13~16층 구간에 오면 12층 체크포인트에서 그 구간만 순전파를 다시 해 활성화를 되살리고(점선 칸), 그 구간이 끝나면 버린다. 한순간에 들고 있는 것은 체크포인트 4개 + 다시 계산한 3개 = 7개로, 대략 L/k + k다. 오른쪽: 층 100개를 k층마다 끊으면 메모리는 100/k + k로, k = √100 = 10에서 최소 20이다. 대가는 순전파를 대략 한 번 더 하는 계산이다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      <text x={x0} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        보통의 역전파: 활성화를 모두 저장
      </text>
      {Array.from({ length: L }, (_, i) => cell(i, 34, colors.blue, 0.55))}
      <text x={x0 - 8} y={48} textAnchor="end" fontSize={10} fill={inkSecondary}>
        저장
      </text>
      <text x={x0 + L * cw + 6} y={48} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        16개
      </text>
      <text x={x0} y={92} fontSize={11.5} fontWeight={800} fill={ink}>
        체크포인팅 (k = 4층마다)
      </text>
      {Array.from({ length: L }, (_, i) => cell(i, 102, colors.blue, i % 4 === 3 ? 0.85 : 0.08))}
      <text x={x0 - 8} y={116} textAnchor="end" fontSize={10} fill={inkSecondary}>
        저장
      </text>
      <text x={x0 + L * cw + 6} y={116} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        4개
      </text>
      {Array.from({ length: L }, (_, i) => (i >= 12 && i < 15 ? cell(i, 132, colors.orange, 0.3, true) : null))}
      <text x={x0 - 8} y={146} textAnchor="end" fontSize={10} fill={inkSecondary}>
        재계산
      </text>
      <text x={x0 + L * cw + 6} y={146} fontSize={10.5} fontWeight={800} fill={colors.orange}>
        +3개
      </text>
      <path d={`M${x0 + 11 * cw + 9},123 C${x0 + 11 * cw + 9},${142} ${x0 + 11 * cw + 12},${142} ${x0 + 12 * cw - 2},${142}`} fill="none" stroke={colors.orange} strokeWidth={1.3} />
      <Lines x={x0 + 11 * cw} y={176} lines={["역전파가 13~16층 구간에 오면", "12층 체크포인트에서 13~15층만 다시 순전파"]} size={10} anchor="middle" color={colors.orange} weight={700} gap={1.4} />
      {Array.from({ length: L }, (_, i) => (
        <text key={i} x={x0 + i * cw + (cw - 3) / 2} y={224} textAnchor="middle" fontSize={9} fill={inkSecondary}>
          {i + 1}
        </text>
      ))}
      <text x={x0 + (L * cw) / 2} y={240} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        층 번호
      </text>
      <line x1={448} y1={14} x2={448} y2={244} stroke="var(--border-hairline)" />
      <text x={G.left} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        L = 100층일 때 최대 메모리
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 3, 10, 30, 100]} yTicks={[0, 50, 100]} xLabel="체크포인트 간격 k" />
      <path d={linePath(sample((u) => mem(10 ** u), 0, 2, 120).map(([u, y]) => [sx(10 ** u), sy(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <circle cx={sx(10)} cy={sy(20)} r={4.5} fill={colors.violet} />
      <text x={sx(10)} y={sy(20) + 18} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        k = √L = 10 → 20
      </text>
      <text x={sx(1) + 6} y={sy(101) + 14} fontSize={9.5} fontWeight={700} fill={inkSecondary}>
        k = 1: 모두 저장
      </text>
      <text x={G.left + G.width / 2} y={G.top + 34} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.violet}>
        메모리 = L/k + k
      </text>
    </DiagramFrame>
  );
}

export function AdamBiasCorrection() {
  // 편향 보정 분모 1 − 0.9ᵗ, 1 − 0.999ᵗ(본문 표). 기울기가 일정할 때 보정하지 않은 걸음은 보정한 걸음의 (1 − 0.9ᵗ)/√(1 − 0.999ᵗ)배.
  const L = { left: 56, top: 30, width: 270, height: 170 };
  const R = { left: 430, top: 30, width: 270, height: 170 };
  const lx = log10Scale(1, 1e4, L.left, L.left + L.width);
  const ly = linear(0, 1, L.top + L.height, L.top);
  const rx = log10Scale(1, 1e4, R.left, R.left + R.width);
  const ry = linear(0, 7, R.top + R.height, R.top);
  const curve = (f: (t: number) => number, sx: (v: number) => number, sy: (v: number) => number) =>
    linePath(sample((u) => f(10 ** u), 0, 4, 200).map(([u, y]) => [sx(10 ** u), sy(y)] as [number, number]));
  const b1 = (t: number) => 1 - 0.9 ** t;
  const b2 = (t: number) => 1 - 0.999 ** t;
  const infl = (t: number) => b1(t) / Math.sqrt(b2(t));
  const table = [1, 10, 100, 1000, 5000];
  return (
    <DiagramFrame
      title="Adam의 편향 보정: 0에서 출발한 이동평균을 1 − βᵗ로 나눠 되살린다"
      caption="왼쪽: 0에서 시작한 이동평균은 기댓값이 실제의 (1 − βᵗ)배로 줄어 있다. β₁ = 0.9인 m은 수십 스텝이면 1에 가까워지지만, β₂ = 0.999인 v는 수천 스텝이 걸린다(점은 본문 표의 값). 오른쪽: 기울기가 일정할 때, 보정하지 않은 Adam의 걸음이 보정한 걸음의 몇 배인지다. m은 거의 회복됐는데 v는 아직 작게 잡혀 있는 동안 걸음이 부풀려진다. t = 10 근처에서 약 6.5배, t = 100에서도 약 3.2배이고, 수천 스텝이 지나야 1배로 돌아온다."
      viewBox="0 0 720 252"
      minWidth={620}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        보정 분모 1 − βᵗ
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[1, 10, 100, 1e3, 1e4]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtX={pow10Label} xLabel="스텝 t (로그 눈금)" />
      <path d={curve(b1, lx, ly)} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <path d={curve(b2, lx, ly)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      {table.map((t) => (
        <g key={t}>
          <circle cx={lx(t)} cy={ly(b2(t))} r={3.8} fill={colors.orange} />
          <text x={lx(t) + (t === 5000 ? -6 : 6)} y={ly(b2(t)) + (t === 5000 ? 16 : -6)} textAnchor={t === 5000 ? "end" : "start"} fontSize={9.5} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {b2(t).toFixed(3)}
          </text>
        </g>
      ))}
      <text x={lx(14)} y={ly(0.93)} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.blue}>
        m: 1 − 0.9ᵗ
      </text>
      <text x={lx(1000) - 10} y={ly(0.66)} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.orange}>
        v: 1 − 0.999ᵗ
      </text>
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        보정하지 않으면 걸음이 몇 배가 되나
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[1, 10, 100, 1e3, 1e4]} yTicks={[0, 1, 2, 3, 4, 5, 6, 7]} fmtX={pow10Label} xLabel="스텝 t (로그 눈금)" />
      <line x1={R.left} x2={R.left + R.width} y1={ry(1)} y2={ry(1)} stroke={colors.green} strokeWidth={1.4} strokeDasharray="5 3" />
      <text x={R.left + 6} y={ry(1) + 15} fontSize={10} fontWeight={800} fill={colors.green}>
        보정한 걸음 = 1배
      </text>
      <path d={curve(infl, rx, ry)} fill="none" stroke={colors.red} strokeWidth={2.4} />
      <circle cx={rx(10)} cy={ry(infl(10))} r={4} fill={colors.red} />
      <text x={rx(10) + 7} y={ry(infl(10)) - 4} fontSize={10} fontWeight={800} fill={colors.red}>
        {`t = 10: ${infl(10).toFixed(1)}배`}
      </text>
      <circle cx={rx(100)} cy={ry(infl(100))} r={4} fill={colors.red} />
      <text x={rx(100) + 7} y={ry(infl(100)) - 4} fontSize={10} fontWeight={800} fill={colors.red}>
        {`t = 100: ${infl(100).toFixed(1)}배`}
      </text>
      <text x={rx(160)} y={ry(5.6)} fontSize={10} fill={inkSecondary}>
        (1 − 0.9ᵗ) / √(1 − 0.999ᵗ)
      </text>
    </DiagramFrame>
  );
}

export function AdamwDecay() {
  // NumPy 시뮬레이션: w₀ = 1, η = 10⁻³, β = (0.9, 0.999), 3000스텝, 60스텝 간격 기록.
  // 왼쪽: 데이터 기울기 0. Adam + L2는 λ = 10⁻⁴, 10⁻², 1 모두 같은 곡선(l2zero). AdamW는 λ에 따라 (1 − ηλ)ᵗ.
  // 오른쪽: λ = 0.1, 데이터 기울기 = 표준편차 σ인 잡음(200회 평균). Adam + L2는 σ에 따라 감쇠가 달라지고, AdamW는 σ와 무관.
  const ts = ADAMW_CURVES.l2zero.map((_, i) => i * 60);
  const L = { left: 52, top: 30, width: 280, height: 170 };
  const R = { left: 410, top: 30, width: 256, height: 170 };
  const lx = linear(0, 3000, L.left, L.left + L.width);
  const rx = linear(0, 3000, R.left, R.left + R.width);
  const yy = (G: { top: number; height: number }) => linear(0, 1, G.top + G.height, G.top);
  const ly = yy(L);
  const ry = yy(R);
  const line = (ys: number[], sx: (v: number) => number, sy: (v: number) => number) => linePath(ys.map((y, i) => [sx(ts[i]), sy(y)] as [number, number]));
  return (
    <DiagramFrame
      title="Adam + L2 ≠ AdamW: 감쇠가 √v̂로 나뉘면 λ라는 손잡이가 고장 난다"
      caption="학습률 10⁻³로 3000스텝 동안 가중치 하나(처음 값 1)가 어떻게 줄어드는지 시뮬레이션했다. 왼쪽: 데이터에서 오는 기울기가 0인 파라미터다. Adam에 L2를 넣으면 기울기가 λw뿐이라 m̂/√v̂ ≈ 1이 되어, λ가 10⁻⁴이든 1이든 매 스텝 약 η씩 똑같이 줄어든다(빨간 선 하나에 세 경우가 겹쳐 있다). AdamW는 감쇠를 따로 (1 − ηλ)배로 걸므로 λ에 따라 결과가 달라진다. 오른쪽: λ = 0.1이고 데이터 기울기가 크기 σ인 잡음인 세 파라미터다(200회 평균). Adam + L2에서는 기울기가 크게 흔들릴수록 √v̂가 커져 감쇠가 약해지지만(σ = 10은 거의 그대로), AdamW에서는 세 파라미터가 모두 같은 비율로 줄어든다."
      viewBox="0 0 720 252"
      minWidth={620}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        데이터 기울기가 0인 파라미터
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 1000, 2000, 3000]} yTicks={[0, 0.5, 1]} xLabel="스텝" yLabel="가중치 w" />
      <path d={line(ADAMW_CURVES.l2zero, lx, ly)} fill="none" stroke={colors.red} strokeWidth={3} />
      <path d={line(ADAMW_CURVES.wzero0_0001, lx, ly)} fill="none" stroke={colors.blue} strokeWidth={2} strokeDasharray="6 3" />
      <path d={line(ADAMW_CURVES.wzero0_01, lx, ly)} fill="none" stroke={colors.blue} strokeWidth={2} strokeDasharray="2 3" />
      <path d={line(ADAMW_CURVES.wzero1_0, lx, ly)} fill="none" stroke={colors.blue} strokeWidth={2} />
      <text x={lx(3000)} y={ly(1) + 14} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.blue}>
        AdamW λ = 10⁻⁴, 10⁻²
      </text>
      <text x={lx(2950)} y={ly(0.05) - 8} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        AdamW λ = 1
      </text>
      <Lines x={lx(1300)} y={ly(0.62)} lines={["Adam + L2", "λ = 10⁻⁴, 10⁻², 1이", "모두 이 한 선"]} size={10} anchor="start" color={colors.red} weight={800} gap={1.35} />
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        기울기 잡음이 다른 세 파라미터 (λ = 0.1)
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 1000, 2000, 3000]} yTicks={[0, 0.5, 1]} xLabel="스텝" />
      <path d={line(ADAMW_CURVES.l2n0_1, rx, ry)} fill="none" stroke={colors.red} strokeWidth={2.2} />
      <path d={line(ADAMW_CURVES.l2n1_0, rx, ry)} fill="none" stroke={colors.red} strokeWidth={2.2} strokeDasharray="6 3" />
      <path d={line(ADAMW_CURVES.l2n10_0, rx, ry)} fill="none" stroke={colors.red} strokeWidth={2.2} strokeDasharray="2 3" />
      <path d={line(ADAMW_CURVES.wn, rx, ry)} fill="none" stroke={colors.blue} strokeWidth={3} strokeOpacity={0.55} />
      <text x={rx(3000) + 4} y={ry(0.97) + 4} fontSize={9.5} fontWeight={800} fill={colors.red}>
        σ = 10
      </text>
      <text x={rx(3000) + 4} y={ry(0.74) + 12} fontSize={9.5} fontWeight={800} fill={colors.red}>
        σ = 1
      </text>
      <text x={rx(3000) + 4} y={ry(0.07) + 4} fontSize={9.5} fontWeight={800} fill={colors.red}>
        σ = 0.1
      </text>
      <text x={rx(1500)} y={ry(0.75)} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        AdamW: 세 σ 모두 이 한 선
      </text>
      <text x={rx(1200)} y={ry(0.3)} fontSize={10} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        Adam + L2: σ에 따라 제각각
      </text>
    </DiagramFrame>
  );
}

export function WarmupVariance() {
  // 기울기를 평균 0, 분산 1인 잡음으로 단순화하고 파라미터 20만 개의 v̂ₜ(β₂ = 0.999)를 시뮬레이션. 적응 학습률 배율 1/√v̂의 분위수.
  // WARMUP_Q 행: [t, 1%, 50%, 99%, 99.9%]. 초록: 1000스텝 선형 워밍업(t/1000)을 곱한 99% 분위수.
  const G = { left: 64, top: 26, width: 430, height: 186 };
  const sx = log10Scale(1, 1000, G.left, G.left + G.width);
  const sy = log10Scale(0.03, 1000, G.top + G.height, G.top);
  const pts = (k: number, f: (t: number) => number = () => 1) => linePath(WARMUP_Q.map((r) => [sx(r[0]), sy(r[k] * f(r[0]))] as [number, number]));
  const band = `${pts(1)} ${WARMUP_Q.slice()
    .reverse()
    .map((r) => `L${sx(r[0]).toFixed(1)},${sy(r[3]).toFixed(1)}`)
    .join(" ")} Z`;
  return (
    <DiagramFrame
      title="워밍업이 필요한 이유: 초반에는 적응 학습률이 극단적으로 흩어진다"
      caption="기울기를 평균 0, 분산 1인 잡음으로 단순화하고, 파라미터 20만 개 각각의 v̂(β₂ = 0.999)로 적응 학습률 배율 1/√v̂을 계산한 시뮬레이션이다(두 축 모두 로그 눈금). 첫 스텝의 v̂은 기울기 제곱 하나뿐이라, 우연히 기울기가 작았던 파라미터는 배율이 수십~수백 배로 폭주한다(상위 1%가 78배, 상위 0.1%가 815배). 기울기가 쌓일수록 퍼짐이 줄어 100스텝이면 상위 1%도 1.2배다. 초록 선은 1000스텝 동안 학습률을 0에서 선형으로 올리는 워밍업을 곱한 상위 1%의 배율로, 초반의 폭주가 눌려 내내 1배 근처를 넘지 않는다. RAdam 논문이 보인 '초반 적응 학습률의 큰 분산'을 숫자로 본 것이다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 10, 100, 1000]} yTicks={[0.1, 1, 10, 100, 1000]} fmtX={(v) => String(v)} fmtY={(v) => (v < 1 ? String(v) : String(v))} xLabel="스텝 t (로그 눈금)" yLabel="학습률 배율 1/√v̂" />
      <path d={band} fill={colors.violet} fillOpacity={0.12} />
      <path d={pts(4)} fill="none" stroke={colors.red} strokeWidth={1.6} strokeDasharray="4 3" />
      <path d={pts(3)} fill="none" stroke={colors.red} strokeWidth={2.4} />
      <path d={pts(2)} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <path d={pts(1)} fill="none" stroke={colors.violet} strokeWidth={1.2} strokeOpacity={0.6} />
      <path d={pts(3, (t) => t / 1000)} fill="none" stroke={colors.green} strokeWidth={2.6} />
      <line x1={G.left} x2={G.left + G.width} y1={sy(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="2 3" />
      {[
        { t: "상위 0.1%", c: colors.red, w: 1.6, d: "4 3" },
        { t: "상위 1%", c: colors.red, w: 2.4 },
        { t: "중앙값", c: colors.violet, w: 2.4 },
        { t: "하위 1% (띠 = 하위 1%~상위 1%)", c: colors.violet, w: 1.2 },
        { t: "상위 1% × 워밍업(1000스텝)", c: colors.green, w: 2.6 },
      ].map((e, i) => (
        <g key={e.t}>
          <line x1={sx(22)} x2={sx(40)} y1={G.top + 12 + i * 15} y2={G.top + 12 + i * 15} stroke={e.c} strokeWidth={e.w} strokeDasharray={e.d} />
          <text x={sx(44)} y={G.top + 16 + i * 15} fontSize={10} fontWeight={700} fill={e.c}>
            {e.t}
          </text>
        </g>
      ))}
      <rect x={520} y={34} width={186} height={164} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={534} y={56} fontSize={11.5} fontWeight={800} fill={ink}>
        배율의 상위 분위수
      </text>
      <text x={640} y={76} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.red}>
        1%
      </text>
      <text x={692} y={76} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.red}>
        0.1%
      </text>
      {WARMUP_Q.filter((r) => [1, 10, 100, 1000].includes(r[0])).map((r, i) => (
        <g key={r[0]}>
          <text x={534} y={96 + i * 20} fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
            {`t = ${r[0]}`}
          </text>
          <text x={640} y={96 + i * 20} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.red} fontFamily={mono}>
            {r[3] < 10 ? r[3].toFixed(2) : r[3].toFixed(0)}
          </text>
          <text x={692} y={96 + i * 20} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.red} fontFamily={mono}>
            {r[4] < 10 ? r[4].toFixed(2) : r[4].toFixed(0)}
          </text>
        </g>
      ))}
      <Lines x={534} y={184} lines={["처음 몇 스텝이 가장 위험하다"]} size={10} anchor="start" color={ink} weight={700} />
    </DiagramFrame>
  );
}

export function GradNormDepth() {
  // NumPy: 폭 256인 층 50개, 가중치 ~ N(0, (배율)²/256). 출력 쪽 단위 기울기를 역전파해 각 층에 도착한 노름(10회 기하평균).
  // 잔차: g ← g + Wᵀg, W ~ N(0, (1/√50)²/256).
  const G = { left: 70, top: 22, width: 430, height: 196 };
  const sx = linear(0, 50, G.left, G.left + G.width);
  const sy = log10Scale(1e-6, 1e5, G.top + G.height, G.top);
  const series = [
    { k: "g1_2" as const, c: colors.red, t: "층마다 1.2배", end: "9.2 × 10³" },
    { k: "res" as const, c: colors.green, t: "잔차 연결", end: "1.6" },
    { k: "g1_0" as const, c: inkSecondary, t: "정확히 1배", end: "≈ 1" },
    { k: "g0_8" as const, c: colors.blue, t: "층마다 0.8배", end: "1.2 × 10⁻⁵" },
  ];
  const endY: Record<string, number> = { g1_2: -4, res: -12, g1_0: 14, g0_8: 4 };
  return (
    <DiagramFrame
      title="기울기는 야코비안의 곱을 지나간다: 50층 뒤에는 10⁻⁵배 또는 9000배"
      caption="폭 256인 선형 층 50개를 무작위 가중치로 만들고, 출력 쪽에서 크기 1인 기울기를 역전파했을 때 각 층에 도착하는 기울기의 크기다(세로축은 로그 눈금, 10회 반복의 기하평균). 가중치 스케일이 벡터를 층마다 평균 0.8배로 줄이면 50층 뒤 0.8⁵⁰ ≈ 10⁻⁵로 사라지고, 1.2배로 늘리면 1.2⁵⁰ ≈ 9000배로 폭발한다. 정확히 1배일 때만 유지되지만 이 균형은 칼날 위에 서 있다. 초록: 잔차 연결 h + F(h)는 야코비안이 I + ∂F/∂h라 원래 기울기가 그대로 더해지는 경로가 있어, F를 작게 초기화하면 50층을 지나도 약 1.6배에 머문다."
      viewBox="0 0 720 256"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 10, 20, 30, 40, 50]} yTicks={[1e-6, 1e-4, 1e-2, 1, 1e2, 1e4]} fmtY={pow10Label} xLabel="출력에서 거꾸로 지나온 층 수" yLabel="기울기 크기" />
      {series.map((s) => (
        <g key={s.k}>
          <path d={linePath(GRAD_NORMS[s.k].map((v, i) => [sx(i), sy(v)] as [number, number]))} fill="none" stroke={s.c} strokeWidth={s.k === "g1_0" ? 1.8 : 2.4} />
          <text x={sx(50) + 8} y={sy(GRAD_NORMS[s.k][50]) + endY[s.k]} fontSize={10.5} fontWeight={800} fill={s.c}>
            {`${s.t}: ${s.end}`}
          </text>
        </g>
      ))}
      <line x1={sx(0)} x2={sx(50)} y1={sy(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="2 3" />
    </DiagramFrame>
  );
}

export function ClipNormVsValue() {
  // 왼쪽: 2차원 예 g = (6, 8), 임계값 c = 5. 노름 클리핑 → (3, 4)(방향 유지), 원소별 클리핑 → (5, 5)(방향 53.1° → 45°).
  // 오른쪽: 본문 코드 g = (30, 40, 120), 노름 130 → 5로 클리핑하면 (1.154, 1.538, 4.615), 원소별 [−5, 5]면 (5, 5, 5)(방향이 약 32° 틀어짐).
  const P = "cnv";
  const S = 17;
  const ox = 60;
  const oy = 214;
  const px = (x: number) => ox + x * S;
  const py = (y: number) => oy - y * S;
  const bars = [
    { t: "원래 (÷26)", v: [30 / 26, 40 / 26, 120 / 26], c: inkMuted },
    { t: "노름 클리핑", v: [1.154, 1.538, 4.615], c: colors.green },
    { t: "원소별 클리핑", v: [5, 5, 5], c: colors.red },
  ];
  const by = linear(0, 5.5, 214, 64);
  return (
    <DiagramFrame
      title="기울기 클리핑: 노름 기준은 길이만, 원소별은 방향까지 바꾼다"
      caption="왼쪽: 2차원으로 그린 원리다. 기울기 g = (6, 8)(길이 10)을 임계값 5로 자를 때, 노름 기준 클리핑은 반지름 5인 원 위로 길이만 줄여 (3, 4)가 되고 방향은 그대로다. 원소마다 [−5, 5]로 자르면 상자 모서리 (5, 5)가 되어 방향이 53°에서 45°로 바뀐다. 오른쪽: 본문 코드의 세 성분 기울기 (30, 40, 120)이다. 노름 클리핑 후 (1.154, 1.538, 4.615)는 원래 비율 30 : 40 : 120을 그대로 지키지만(회색 막대는 원래 값을 26으로 나눠 같은 비율로 그린 것), 원소별 클리핑은 (5, 5, 5)가 되어 방향이 약 32° 틀어진다."
      viewBox="0 0 720 256"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, green: colors.green, red: colors.red }} />
      <line x1={px(0)} x2={px(10.5)} y1={py(0)} y2={py(0)} stroke={inkMuted} />
      <line x1={px(0)} x2={px(0)} y1={py(0)} y2={py(10.5)} stroke={inkMuted} />
      <path d={`M${px(5)},${py(0)} A${5 * S},${5 * S} 0 0 0 ${px(0)},${py(5)}`} fill={colors.green} fillOpacity={0.08} stroke={colors.green} strokeWidth={1.4} />
      <rect x={px(0)} y={py(5)} width={5 * S} height={5 * S} fill="none" stroke={colors.red} strokeWidth={1.4} strokeDasharray="4 3" />
      <Arr x1={px(0)} y1={py(0)} x2={px(6) - 2} y2={py(8) + 3} color={inkSecondary} marker={`${P}-ink`} width={2} />
      <Arr x1={px(0)} y1={py(0)} x2={px(3) - 1.5} y2={py(4) + 2} color={colors.green} marker={`${P}-green`} width={2.6} />
      <Arr x1={px(0)} y1={py(0)} x2={px(5) - 2} y2={py(5) + 2} color={colors.red} marker={`${P}-red`} width={2.2} />
      <text x={px(6) + 6} y={py(8) + 2} fontSize={10.5} fontWeight={800} fill={ink}>
        g = (6, 8)
      </text>
      <text x={px(5) + 6} y={py(5) + 4} fontSize={10.5} fontWeight={800} fill={colors.red}>
        원소별 → (5, 5)
      </text>
      <text x={px(3) - 6} y={py(4) - 2} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        노름 → (3, 4)
      </text>
      <text x={px(7.8)} y={py(1.2)} fontSize={9.5} fill={colors.green} fontWeight={700}>
        반지름 5인 원
      </text>
      <text x={px(5.2)} y={py(-0.9)} fontSize={9.5} fill={colors.red} fontWeight={700}>
        [−5, 5] 상자
      </text>
      <text x={20} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        2차원으로 보면
      </text>
      <line x1={300} y1={14} x2={300} y2={244} stroke="var(--border-hairline)" />
      <text x={318} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        본문 코드: g = (30, 40, 120), 노름 130 → 5
      </text>
      <line x1={340} x2={706} y1={by(0)} y2={by(0)} stroke={inkMuted} />
      <line x1={340} x2={706} y1={by(5)} y2={by(5)} stroke={colors.red} strokeDasharray="3 3" strokeOpacity={0.6} />
      <text x={336} y={by(5) + 4} textAnchor="end" fontSize={9.5} fill={colors.red}>
        5
      </text>
      {bars.map((b, gi) => (
        <g key={b.t}>
          {b.v.map((v, j) => {
            const x = 352 + gi * 120 + j * 32;
            return (
              <g key={j}>
                <rect x={x} y={by(v)} width={26} height={by(0) - by(v)} rx={2} fill={b.c} fillOpacity={gi === 0 ? 0.35 : 0.6} />
                <text x={x + 13} y={by(v) - 4} textAnchor="middle" fontSize={9} fontWeight={800} fill={ink}>
                  {gi === 0 ? [30, 40, 120][j] : v.toFixed(gi === 1 ? 2 : 0)}
                </text>
                <text x={x + 13} y={by(0) + 12} textAnchor="middle" fontSize={9} fill={inkSecondary}>
                  {`g${"₁₂₃"[j]}`}
                </text>
              </g>
            );
          })}
          <text x={352 + gi * 120 + 45} y={by(0) + 28} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={gi === 0 ? inkSecondary : b.c}>
            {b.t}
          </text>
        </g>
      ))}
      <Lines x={472 + 45} y={48} lines={["비율 유지"]} size={10} anchor="middle" color={colors.green} weight={800} />
      <Lines x={592 + 45} y={48} lines={["방향 32° 틀어짐"]} size={10} anchor="middle" color={colors.red} weight={800} />
    </DiagramFrame>
  );
}
