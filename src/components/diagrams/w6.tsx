import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function LlmPipeline() {
  const stages = [
    { label: "웹·책·코드\n수조 토큰", stepLabel: "① 사전학습\n(다음 토큰 예측)", color: card2Bg },
    { label: "Base 모델\n(이어쓰기 기계)", stepLabel: "② SFT\n(지시,응답) 쌍", color: colors.blue },
    { label: "Instruct 모델", stepLabel: "③ 선호 학습\nRLHF / DPO", color: colors.aqua },
    { label: "Chat 모델\n(도움·정직·무해)", stepLabel: "", color: colors.violet },
  ];
  const w = 130;
  const gap = 40;
  const y = 90;
  return (
    <DiagramFrame
      title="LLM 학습 파이프라인: 사전학습 → SFT → 선호 학습"
      viewBox="0 0 680 220"
      caption="사전학습 손실 L = −(1/T)Σ log P(xₜ|x&lt;ₜ). 각 단계는 서로 다른 데이터 형태(원문 → 지시응답 쌍 → 선호 비교쌍)를 사용한다."
    >
      <ArrowDefs />
      {stages.map((s, i) => {
        const x = 20 + i * (w + gap);
        return (
          <g key={i}>
            <Box x={x} y={y} w={w} h={64} label={s.label.split("\n")[0]} sub={s.label.split("\n")[1]} fill={s.color} labelColor={i > 0 ? "#fff" : ink} subColor={i > 0 ? "#eaf2fd" : inkSecondary} fontSize={12} subSize={10} />
            {i < stages.length - 1 && (
              <>
                <Arrow x1={x + w} y1={y + 32} x2={x + w + gap - 4} y2={y + 32} />
                <text x={x + w + gap / 2} y={y - 12} textAnchor="middle" fontSize={9.5} fill={colors.orange} fontWeight={700}>
                  {s.stepLabel.split("\n")[0]}
                </text>
                <text x={x + w + gap / 2} y={y - 2} textAnchor="middle" fontSize={9} fill={inkMuted}>
                  {s.stepLabel.split("\n")[1]}
                </text>
              </>
            )}
          </g>
        );
      })}
      <Label x={340} y={190} text="④ 추론 시 계산·도구·검색으로 확장 (W7)" color={inkMuted} />
    </DiagramFrame>
  );
}

export function ScalingLawPlot() {
  const width = 520;
  const height = 260;
  const padL = 56;
  const padB = 36;
  const padT = 20;
  const padR = 20;
  const px = (t: number) => padL + t * (width - padL - padR);
  const py = (t: number) => height - padB - t * (height - padB - padT);
  const path = `M ${px(0)} ${py(0.9)} L ${px(1)} ${py(0.08)}`;
  return (
    <DiagramFrame
      title="스케일링 법칙: 로그-로그 그래프에서 직선(멱법칙)"
      viewBox={`0 0 ${width} ${height}`}
      caption="손실 L ≈ E + A/Nᵅ + B/Dᵝ. 컴퓨트를 늘리면(로그 축) 손실이 예측 가능한 기울기로 꾸준히 줄어든다."
    >
      <ArrowDefs />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={gridline} />
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={gridline} />
      <Label x={width / 2} y={height - 8} text="컴퓨트 (log scale) →" color={inkMuted} />
      <text x={18} y={padT + 10} fontSize={11} fill={inkMuted} transform={`rotate(-90 18 ${(height) / 2})`} textAnchor="middle">
        손실 (log)
      </text>
      <path d={path} fill="none" stroke={colors.blue} strokeWidth={2.6} />
      {[0.1, 0.35, 0.6, 0.85].map((t, i) => (
        <circle key={i} cx={px(t)} cy={py(0.9 - t * 0.82)} r={3.5} fill={colors.orange} />
      ))}
      <Label x={px(0.15)} y={py(0.85) - 10} text="C = 6ND" color={colors.orange} anchor="start" />
      <Label x={px(0.55)} y={py(0.9 - 0.55 * 0.82) + 22} text="Chinchilla: D ≈ 20N" color={inkSecondary} anchor="middle" />
    </DiagramFrame>
  );
}

export function DecodingTemperature() {
  const logits = [3.0, 2.0, 1.0, 0.0, -1.0];
  const temps = [0.2, 1.0, 2.0];
  const labels = ["A", "B", "C", "D", "E"];
  const softmax = (T: number) => {
    const exps = logits.map((z) => Math.exp(z / T));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  };
  const panelW = 170;
  const barW = 22;
  const baseY = 200;
  const maxH = 150;
  return (
    <DiagramFrame
      title="Temperature가 다음 토큰 확률분포에 미치는 영향"
      viewBox="0 0 560 240"
      caption="같은 logits이라도 T가 낮으면 1등 토큰에 확률이 집중(결정적)되고, T가 높으면 분포가 평평해진다(다양·무작위)."
    >
      {temps.map((T, ti) => {
        const probs = softmax(T);
        const offsetX = 20 + ti * panelW;
        return (
          <g key={ti}>
            <text x={offsetX + (barW + 8) * 2.5} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              T = {T}
            </text>
            {probs.map((p, i) => {
              const h = p * maxH;
              return (
                <g key={i}>
                  <rect
                    x={offsetX + i * (barW + 8)}
                    y={baseY - h}
                    width={barW}
                    height={h}
                    fill={ti === 0 ? colors.blue : ti === 1 ? colors.aqua : colors.orange}
                    rx={3}
                  />
                  <text x={offsetX + i * (barW + 8) + barW / 2} y={baseY + 16} textAnchor="middle" fontSize={10} fill={inkMuted}>
                    {labels[i]}
                  </text>
                </g>
              );
            })}
            <line x1={offsetX - 6} y1={baseY} x2={offsetX + 5 * (barW + 8) - 8} y2={baseY} stroke={gridline} />
          </g>
        );
      })}
    </DiagramFrame>
  );
}
