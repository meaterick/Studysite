import DiagramFrame, { colors, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function AiHierarchy() {
  const layers = [
    { label: "인공지능 (AI)", sub: "지능적 행동을 하는 시스템 전반", color: colors.blue, inset: 0 },
    { label: "머신러닝 (ML)", sub: "데이터로부터 규칙을 학습", color: colors.aqua, inset: 34 },
    { label: "딥러닝 (DL)", sub: "다층 신경망", color: colors.violet, inset: 68 },
    { label: "생성형 AI / LLM", sub: "다음 토큰을 생성하는 대규모 모델", color: colors.orange, inset: 102 },
  ];
  return (
    <DiagramFrame title="AI의 지형도: 포함 관계" viewBox="0 0 640 300" minWidth={420}>
      <ArrowDefs />
      {layers.map((l, i) => {
        const x = 20 + l.inset;
        const y = 20 + l.inset * 0.62;
        const w = 600 - l.inset * 2;
        const h = 260 - l.inset * 1.24;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={14} fill="none" stroke={l.color} strokeWidth={2} />
            <rect x={x} y={y} width={w} height={22} rx={10} fill={l.color} />
            <text x={x + 12} y={y + 15.5} fontSize={12.5} fontWeight={700} fill="#fff">
              {l.label}
            </text>
            {i === layers.length - 1 && (
              <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" fontSize={11} fill={inkSecondary}>
                {l.sub}
              </text>
            )}
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function MlLoop() {
  const nodes = [
    { label: "데이터 (x, y)", sub: "입력·정답" },
    { label: "모델 fθ(x)", sub: "파라미터 θ" },
    { label: "예측 ŷ", sub: "" },
    { label: "손실 L(ŷ, y)", sub: "" },
    { label: "기울기 ∇θL", sub: "" },
  ];
  const y = 40;
  const w = 108;
  const h = 56;
  const gap = 22;
  return (
    <DiagramFrame
      title="머신러닝의 한 줄 정의: 손실을 줄이는 루프"
      viewBox="0 0 760 220"
      caption="θ ← θ − η∇θL 를 반복하며 예측이 정답에 가까워지도록 파라미터를 갱신한다."
    >
      <ArrowDefs />
      {nodes.map((n, i) => {
        const x = 20 + i * (w + gap);
        return (
          <g key={i}>
            <Box x={x} y={y} w={w} h={h} label={n.label} sub={n.sub || undefined} fill={card2Bg} />
            {i < nodes.length - 1 && (
              <Arrow x1={x + w} y1={y + h / 2} x2={x + w + gap - 4} y2={y + h / 2} />
            )}
          </g>
        );
      })}
      {/* return arrow: gradient -> theta update -> back to model */}
      <path
        d={`M ${20 + 4 * (w + gap) + w / 2} ${y + h} C ${20 + 4 * (w + gap) + w / 2} ${y + h + 60}, ${20 + 1 * (w + gap) + w / 2} ${y + h + 60}, ${20 + 1 * (w + gap) + w / 2} ${y + h + 6}`}
        fill="none"
        stroke={colors.orange}
        strokeWidth={1.8}
        markerEnd="url(#arrowhead)"
      />
      <Label
        x={20 + 2.5 * (w + gap)}
        y={y + h + 78}
        text="θ ← θ − η · ∇θL  (학습률 η 만큼 반대 방향으로 이동)"
        color={colors.orange}
        weight={700}
        size={12}
      />
    </DiagramFrame>
  );
}

export function GradientDescentCurve() {
  const width = 520;
  const height = 300;
  const padL = 50;
  const padB = 34;
  const padT = 16;
  const padR = 20;
  const xMin = -1;
  const xMax = 7;
  const yMax = 16;
  const px = (w: number) => padL + ((w - xMin) / (xMax - xMin)) * (width - padL - padR);
  const py = (L: number) => height - padB - (L / yMax) * (height - padB - padT);

  const curvePts: [number, number][] = [];
  for (let w = xMin; w <= xMax; w += 0.1) {
    curvePts.push([w, (w - 3) ** 2]);
  }
  const path = curvePts.map(([w, L], i) => `${i === 0 ? "M" : "L"} ${px(w).toFixed(1)} ${py(L).toFixed(1)}`).join(" ");

  // gradient descent steps, w0=0, lr=0.1
  const steps: number[] = [0];
  for (let i = 0; i < 7; i++) {
    const w = steps[steps.length - 1];
    const grad = 2 * (w - 3);
    steps.push(w - 0.1 * grad);
  }

  return (
    <DiagramFrame
      title="경사하강법: L(w) = (w − 3)² 을 최소화"
      viewBox={`0 0 ${width} ${height}`}
      caption="η=0.1일 때 w=0에서 시작해 최솟값 w=3으로 수렴한다. 점 사이 간격이 점점 좁아지는 것에 주목."
    >
      <ArrowDefs />
      {/* axes */}
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={gridline} strokeWidth={1} />
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={gridline} strokeWidth={1} />
      <Label x={width / 2} y={height - 6} text="w" color={inkMuted} />
      <Label x={16} y={padT + 8} text="L" color={inkMuted} anchor="start" />
      {/* min marker */}
      <line x1={px(3)} y1={py(0)} x2={px(3)} y2={padT} stroke={gridline} strokeDasharray="3 3" />
      <Label x={px(3)} y={height - padB + 16} text="w*=3" color={inkSecondary} />
      <path d={path} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      {steps.map((w, i) => (
        <g key={i}>
          <circle cx={px(w)} cy={py((w - 3) ** 2)} r={4} fill={colors.orange} />
          {i < steps.length - 1 && (
            <Arrow
              x1={px(w)}
              y1={py((w - 3) ** 2)}
              x2={px(steps[i + 1])}
              y2={py((steps[i + 1] - 3) ** 2)}
              color={colors.orange}
              strokeWidth={1.3}
            />
          )}
        </g>
      ))}
      <Label x={px(0) - 4} y={py(9) - 10} text="w₀=0" color={colors.orange} anchor="start" weight={700} />
    </DiagramFrame>
  );
}
