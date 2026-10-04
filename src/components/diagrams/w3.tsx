import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Tag, linear, log10Scale, linePath, sample, mono, normCdf, pow10Label } from "./chart";

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
