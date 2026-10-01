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


export function AttentionPatterns() {
  // 칸이 칠해져 있으면 행(보는 토큰)이 열(참조되는 토큰)을 볼 수 있다는 뜻이다.
  const cell = 22;
  const panel = (
    ox: number,
    title: string,
    sub: string,
    rows: number,
    cols: number,
    allowed: (i: number, j: number) => boolean,
    color: string,
    split?: number,
  ) => (
    <g>
      <text x={ox + (cols * cell) / 2} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        {title}
      </text>
      <text x={ox + (cols * cell) / 2} y={40} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {sub}
      </text>
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (__, j) => {
          const on = allowed(i, j);
          return (
            <rect
              key={`${i}-${j}`}
              x={ox + j * cell}
              y={56 + i * cell}
              width={cell - 3}
              height={cell - 3}
              rx={3}
              fill={on ? color : inkMuted}
              fillOpacity={on ? 0.75 : 0.15}
            />
          );
        }),
      )}
      {split !== undefined && (
        <line x1={ox + split * cell - 1.5} y1={50} x2={ox + split * cell - 1.5} y2={56 + rows * cell + 4} stroke={ink} strokeDasharray="4 3" />
      )}
    </g>
  );
  return (
    <DiagramFrame
      title="세 아키텍처의 attention 패턴"
      caption="칠해진 칸은 행의 토큰이 열의 토큰을 볼 수 있다는 뜻이다. BERT는 모든 토큰이 서로를 보고(양방향), GPT는 자기와 앞 토큰만 본다(causal). T5의 디코더는 인코더가 읽은 입력 전체(점선 왼쪽)와 자기 앞까지의 출력(점선 오른쪽)을 본다."
      viewBox="0 0 660 230"
      minWidth={520}
    >
      {panel(40, "BERT (Encoder-only)", "앞뒤 모두 본다", 5, 5, () => true, colors.blue)}
      {panel(250, "GPT (Decoder-only)", "앞만 본다", 5, 5, (i, j) => j <= i, colors.violet)}
      {panel(450, "T5 디코더 (Enc-Dec)", "입력 전체 + 앞 출력", 4, 7, (i, j) => j < 3 || j - 3 <= i, colors.aqua, 3)}
      <text x={450 + 1.5 * cell} y={56 + 4 * cell + 22} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        입력(인코더)
      </text>
      <text x={450 + 5 * cell} y={56 + 4 * cell + 22} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        출력(디코더)
      </text>
    </DiagramFrame>
  );
}

export function LoraDiagram() {
  // h = W₀x + BAx. W₀는 고정, 작은 A(r×k)와 B(d×r)만 학습한다.
  return (
    <DiagramFrame
      title="LoRA: 큰 가중치는 고정하고 옆에 작은 길을 낸다"
      caption="입력 x는 고정된 원래 가중치 W₀를 그대로 지나고, 옆길에서는 x를 r차원으로 줄이는 A와 다시 d차원으로 늘리는 B를 지난다. 두 결과를 더한 h = W₀x + BAx가 출력이다. B를 0으로 시작하므로 학습 첫 순간의 모델은 원래 모델과 똑같다."
      viewBox="0 0 640 270"
      minWidth={500}
    >
      <ArrowDefs />
      <Box x={20} y={115} w={70} h={40} label="입력 x" sub="k차원" fill={card2Bg} />
      <Box x={170} y={40} w={180} h={90} label="W₀ (d × k)" sub="사전학습 가중치 · 고정(학습 안 함)" fill={card2Bg} />
      <Box x={170} y={170} w={60} h={70} label="A" sub="r × k" fill={colors.orange} labelColor="#fff" subColor="#fff" />
      <Box x={290} y={185} w={60} h={40} label="B" sub="d × r" fill={colors.orange} labelColor="#fff" subColor="#fff" />
      <Box x={430} y={115} w={50} h={40} label="+" fill={colors.violet} labelColor="#fff" fontSize={18} />
      <Box x={540} y={115} w={80} h={40} label="출력 h" sub="d차원" fill={card2Bg} />
      <Arrow x1={90} y1={128} x2={168} y2={90} />
      <Arrow x1={90} y1={142} x2={168} y2={200} />
      <Arrow x1={230} y1={205} x2={288} y2={205} />
      <Arrow x1={350} y1={85} x2={428} y2={128} />
      <Arrow x1={350} y1={205} x2={428} y2={142} />
      <Arrow x1={480} y1={135} x2={538} y2={135} />
      <text x={260} y={258} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        학습하는 부분: d·r + r·k개
      </text>
      <text x={259} y={198} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        r차원
      </text>
    </DiagramFrame>
  );
}
