import DiagramFrame, { colors, inkSecondary, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function AiHierarchy() {
  // AI ⊃ ML ⊃ DL ⊃ LLM은 "방법" 기준의 포함관계다. 생성형 AI는 "기능" 기준이라 ML·DL 경계를 가로질러 겹쳐 그린다.
  const layers = [
    { label: "인공지능 (AI)", note: "예: 규칙·탐색 기반 시스템", color: colors.blue, x: 20, y: 20, w: 600, h: 290 },
    { label: "머신러닝 (ML)", note: "데이터로부터 규칙을 학습", color: colors.aqua, x: 44, y: 54, w: 552, h: 240 },
    { label: "딥러닝 (DL)", note: "다층 신경망", color: colors.violet, x: 68, y: 88, w: 330, h: 190 },
  ];
  const gen = { x: 180, y: 146, w: 392, h: 140 };
  return (
    <DiagramFrame
      title="AI의 지형도: 포함 관계와 겹치는 범주"
      caption="AI ⊃ 머신러닝 ⊃ 딥러닝 ⊃ LLM은 포함관계다. 생성형 AI(점선)는 '새 데이터를 만드는가'라는 다른 기준의 범주라서 딥러닝 경계를 가로지른다."
      viewBox="0 0 640 330"
      minWidth={440}
    >
      {layers.map((l) => (
        <g key={l.label}>
          <rect x={l.x} y={l.y} width={l.w} height={l.h} rx={14} fill="none" stroke={l.color} strokeWidth={2} />
          <rect x={l.x} y={l.y} width={l.w} height={22} rx={10} fill={l.color} />
          <text x={l.x + 12} y={l.y + 15.5} fontSize={12.5} fontWeight={700} fill="#fff">
            {l.label}
          </text>
          <text x={l.x + l.w - 12} y={l.y + 15.5} textAnchor="end" fontSize={10.5} fill="#fff">
            {l.note}
          </text>
        </g>
      ))}
      <text x={124} y={196} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        CNN 분류기
      </text>
      <text x={124} y={212} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        (판별 모델)
      </text>
      <text x={497} y={108} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        로지스틱 회귀 · 결정 트리
      </text>
      <text x={497} y={124} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        (신경망 아님, 생성 안 함)
      </text>
      <rect
        x={gen.x}
        y={gen.y}
        width={gen.w}
        height={gen.h}
        rx={14}
        fill={colors.orange}
        fillOpacity={0.08}
        stroke={colors.orange}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <text x={gen.x + 12} y={gen.y + 18} fontSize={12} fontWeight={700} fill={colors.orange}>
        생성형 AI: 새 데이터를 만든다
      </text>
      <text x={gen.x + 12} y={gen.y + 36} fontSize={10.5} fill={inkSecondary}>
        확산 모델 · GAN · VAE
      </text>
      <rect x={196} y={196} width={180} height={62} rx={10} fill={card2Bg} stroke={colors.violet} strokeWidth={1.5} />
      <text x={286} y={222} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.violet}>
        LLM (대규모 언어 모델)
      </text>
      <text x={286} y={240} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        다음 토큰 예측으로 사전학습
      </text>
      <text x={485} y={206} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        n-gram 언어모델 · HMM
      </text>
      <text x={485} y={222} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        (생성하지만 신경망 아님)
      </text>
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

