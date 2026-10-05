import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, Lines, Tag, linear, log10Scale, pow10Label, linePath, sample, seeded, starPath, mono } from "./chart";

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

// ───────────────────────── 6주차 핵심 과정: 추가 그림 ─────────────────────────

const chip6 = (x: number, y: number, text: string, color: string, w = 64, h = 24, tint = 0.14, size = 11, weight = 700) => (
  <g key={`${x}-${y}-${text}`}>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} fillOpacity={tint} stroke={color} strokeWidth={1.2} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={weight} fill={ink}>
      {text}
    </text>
  </g>
);

export function PerplexityWorked() {
  // 본문 예제: "오늘 날씨가 정말 맑다", 정답 토큰에 준 확률 0.5, 0.25, 0.125 → L = 2 ln 2 ≈ 1.386, perplexity = 4.
  const P = "ppw";
  const toks = ["오늘", "날씨가", "정말", "맑다"];
  const probs = [0.5, 0.25, 0.125];
  const L = -probs.reduce((s, p) => s + Math.log(p), 0) / probs.length;
  const G = { left: 438, top: 40, width: 250, height: 146 };
  const gx = linear(0, 1, G.left, G.left + G.width);
  const gy = linear(0, 3.2, G.top + G.height, G.top);
  const curve = linePath(sample((p) => -Math.log(p), 0.04, 1, 120).map(([p, v]) => [gx(p), gy(v)] as [number, number]));
  return (
    <DiagramFrame
      title="다음 토큰 예측의 손실과 perplexity: 한 문장을 손으로"
      caption={`왼쪽: 토큰 4개짜리 문장 하나에서 '앞부분 → 바로 다음 토큰' 문제가 3개 저절로 생긴다. 모델이 정답 토큰에 준 확률이 0.5, 0.25, 0.125라면 오른쪽 곡선 −ln p 위의 세 점(0.69, 1.39, 2.08)이 각 문제의 손실이다. 정답에 낮은 확률을 줄수록 손실이 가파르게 커진다. 셋의 평균 L = ${L.toFixed(3)}이고, perplexity e^L = 4는 '매 스텝 후보 4개 사이에서 고르게 헷갈리는 정도'다. 학습 전 모델(어휘 5만 개에 균등)은 L ≈ 10.8, perplexity 50,000이다.`}
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, orange: colors.orange }} />
      <text x={14} y={22} fontSize={12} fontWeight={700} fill={ink}>
        ① 문장 하나 = 예측 문제 3개
      </text>
      {probs.map((p, i) => {
        const y = 40 + i * 52;
        const tx = 14 + (i + 1) * 62 + 30;
        return (
          <g key={i}>
            {toks.slice(0, i + 1).map((t, k) => chip6(14 + k * 62, y, t, inkMuted, 58, 26, 0.08, 11, 600))}
            <Arr x1={14 + (i + 1) * 62 - 1} y1={y + 13} x2={tx - 4} y2={y + 13} color={inkSecondary} marker={`${P}-ink`} />
            {chip6(tx, y, toks[i + 1], colors.blue, 62, 26, 0.16, 11.5)}
            <text x={tx + 70} y={y + 17} fontSize={11} fontWeight={700} fill={colors.blue} fontFamily={mono}>
              {`p = ${p}`}
            </text>
          </g>
        );
      })}
      <text x={14} y={210} fontSize={10.5} fill={inkSecondary}>
        입력(회색)을 보고 바로 다음 토큰(파랑)을 맞힌다
      </text>
      <text x={14} y={226} fontSize={10.5} fill={inkSecondary}>
        토큰 T개 문서 = 문제 T−1개, causal mask로 한 번에 계산
      </text>

      <text x={G.left - 36} y={22} fontSize={12} fontWeight={700} fill={ink}>
        ② 각 손실 = −ln p, 평균이 L
      </text>
      <Axes {...G} sx={gx} sy={gy} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[0, 1, 2, 3]} xLabel="정답 토큰에 준 확률 p" yLabel="손실 −ln p" />
      <path d={curve} fill="none" stroke={inkSecondary} strokeWidth={2} />
      <line x1={G.left} x2={G.left + G.width} y1={gy(L)} y2={gy(L)} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="5 4" />
      <text x={G.left + G.width} y={gy(L) - 6} textAnchor="end" fontSize={11} fontWeight={700} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`평균 L = ${L.toFixed(3)} → e^L = 4`}
      </text>
      {probs.map((p) => (
        <g key={p}>
          <circle cx={gx(p)} cy={gy(-Math.log(p))} r={5} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={gx(p) + 8} y={gy(-Math.log(p)) - 6} fontSize={10.5} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {(-Math.log(p)).toFixed(2)}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function BertMasking() {
  // BERT의 MLM: 입력 토큰의 15%를 맞힐 대상으로 고르고, 그중 80%는 [MASK], 10%는 무작위 토큰, 10%는 그대로 둔다.
  const P = "bmk";
  const rand = seeded(11);
  const picked = new Set<number>();
  while (picked.size < 15) picked.add(Math.floor(rand() * 100));
  const s = 14;
  const rows = [
    { pct: "80%", n: "약 12개", from: "사과", to: "[MASK]", toColor: colors.violet, note: "가려진 자리를 앞뒤 문맥으로 맞힌다" },
    { pct: "10%", n: "약 1.5개", from: "사과", to: "자동차", toColor: colors.red, note: "엉뚱한 단어가 와도 의심하게 만든다" },
    { pct: "10%", n: "약 1.5개", from: "사과", to: "사과", toColor: colors.green, note: "멀쩡해 보이는 자리도 확인하게 만든다" },
  ];
  return (
    <DiagramFrame
      title="BERT의 빈칸 맞히기(MLM): 15%를 고르고, 80 · 10 · 10으로 바꾼다"
      caption="왼쪽: 입력 토큰 100개 중 15개(주황)를 맞힐 대상으로 고른다. 오른쪽: 고른 자리의 80%만 [MASK]로 가리고, 10%는 무작위 다른 토큰으로, 10%는 원래 토큰 그대로 둔다. 어느 경우든 그 자리에서 원래 토큰('사과')을 맞혀야 한다. 실제 사용할 때는 입력에 [MASK]가 없으므로, 가려지지 않은 토큰도 맞는지 판단하도록 훈련하는 장치다. 고르지 않은 85개 자리에는 손실을 매기지 않는다."
      viewBox="0 0 720 206"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={14} y={20} fontSize={11.5} fontWeight={700} fill={ink}>
        입력 토큰 100개 중 15%
      </text>
      {Array.from({ length: 100 }, (_, i) => (
        <rect key={i} x={14 + (i % 10) * s} y={32 + Math.floor(i / 10) * s} width={s - 2.5} height={s - 2.5} rx={2} fill={picked.has(i) ? colors.orange : inkMuted} fillOpacity={picked.has(i) ? 0.85 : 0.18} />
      ))}
      <text x={14} y={192} fontSize={10.5} fill={inkSecondary}>
        주황 15개만 손실 계산
      </text>
      <Arr x1={168} y1={102} x2={206} y2={102} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      {rows.map((r, i) => {
        const y = 30 + i * 54;
        return (
          <g key={i}>
            <text x={216} y={y + 17} fontSize={14} fontWeight={800} fill={colors.orange}>
              {r.pct}
            </text>
            <text x={216} y={y + 33} fontSize={10} fill={inkSecondary}>
              {r.n}
            </text>
            {chip6(278, y + 2, r.from, colors.orange, 58, 26, 0.16, 11.5)}
            <Arr x1={340} y1={y + 15} x2={366} y2={y + 15} color={inkSecondary} marker={`${P}-ink`} />
            {chip6(372, y + 2, r.to, r.toColor, 72, 26, 0.16, 11.5)}
            <text x={456} y={y + 19} fontSize={11} fill={inkSecondary}>
              {r.note}
            </text>
          </g>
        );
      })}
      <text x={216} y={192} fontSize={11} fontWeight={700} fill={ink}>
        {"세 경우 모두 정답은 원래 토큰 '사과'"}
      </text>
    </DiagramFrame>
  );
}

export function EmergenceMetric() {
  // Schaeffer et al.(2023)의 논지를 단순화한 그림. 토큰 하나의 정답률 p가 log N에 따라 매끄럽게 오른다고 가정하면,
  // 답의 토큰 5개를 모두 맞혀야 1점을 주는 지표(p⁵)는 어느 크기에서 갑자기 뛰는 것처럼 보인다. 수치는 설명용 가정이다.
  const G = { left: 64, top: 22, width: 360, height: 168 };
  const sx = linear(8, 12, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const p = (lg: number) => 0.3 + ((0.97 - 0.3) * (lg - 8)) / 4;
  const path = (f: (lg: number) => number) => linePath(sample(f, 8, 12, 100).map(([x, y]) => [sx(x), sy(y)] as [number, number]));
  return (
    <DiagramFrame
      title="창발은 채점 방식의 착시일 수 있다: 같은 실력, 다른 지표"
      caption="토큰 하나를 맞히는 정답률 p(파랑)가 모델 크기의 로그에 따라 꾸준히 오른다고 하자. 그런데 답이 토큰 5개로 이루어져 있고 전부 맞혀야만 1점을 준다면, 점수는 p⁵(빨강)다. 작은 모델에서는 거의 0에 붙어 있다가 어느 크기를 넘으면 가파르게 올라, 능력이 '갑자기 생긴' 것처럼 보인다. 같은 모델을 부분 점수로 재면 매끄럽게 오른다는 것이 Schaeffer 등(2023)의 반론이다. 값은 설명을 위한 가정이다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[8, 9, 10, 11, 12]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtX={(v) => pow10Label(10 ** v)} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="모델 크기 N (파라미터 수, 로그 눈금)" yLabel="정답률" />
      <path d={path(p)} fill="none" stroke={colors.blue} strokeWidth={2.6} />
      <path d={path((lg) => p(lg) ** 5)} fill="none" stroke={colors.red} strokeWidth={2.6} />
      <text x={sx(8.1)} y={sy(0.74)} fontSize={11.5} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        토큰 하나의 정답률 p
      </text>
      <text x={sx(11.85)} y={sy(0.06)} textAnchor="end" fontSize={11.5} fontWeight={700} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        5토큰 답 전체 정답률 = p⁵
      </text>
      <Lines
        x={456}
        y={44}
        lines={["같은 모델, 같은 실력인데", "채점 방식만 다르다"]}
        size={12}
        anchor="start"
        color={ink}
        weight={700}
      />
      <Lines
        x={456}
        y={100}
        lines={["• 부분 점수(토큰 단위)로 재면", "   크기에 따라 꾸준히 오른다", "• 전부 맞혀야 1점이면 p를 다섯 번", "   곱하므로, 작은 모델은 0 근처에", "   머물다가 갑자기 치솟는다"]}
        size={11}
        anchor="start"
      />
    </DiagramFrame>
  );
}

export function ComputeAllocation() {
  // C ≈ 6ND, D ≈ 20N. 본문 예제(10²¹·10²³·10²⁵ FLOPs의 최적점)와 Gopher·Chinchilla·Llama 3 8B의 실제 (N, D).
  const P = "cal";
  const G = { left: 74, top: 16, width: 350, height: 236 };
  const sx = log10Scale(1e9, 1e12, G.left, G.left + G.width);
  const sy = log10Scale(1e10, 1e14, G.top + G.height, G.top);
  const iso = (C: number) => linePath([1e9, 1e12].map((n) => [sx(n), sy(C / (6 * n))] as [number, number]));
  const nLabel: Record<number, string> = { 1e9: "1B", 1e10: "10B", 1e11: "100B", 1e12: "1T" };
  const dLabel: Record<number, string> = { 1e10: "100억", 1e11: "1,000억", 1e12: "1조", 1e13: "10조", 1e14: "100조" };
  const opt = [
    { C: 1e21, label: "10²¹ FLOPs: 2.9B · 580억 토큰" },
    { C: 1e23, label: "10²³: 29B · 5,800억" },
    { C: 1e25, label: "10²⁵: 290B · 5.8조" },
  ].map((o) => ({ ...o, N: Math.sqrt(o.C / 120) }));
  const models = [
    { name: "Gopher 280B · 3,000억 토큰", N: 280e9, D: 300e9, color: colors.red, dx: -8, dy: 22, anchor: "end" as const },
    { name: "Chinchilla 70B · 1.4조 토큰", N: 70e9, D: 1.4e12, color: colors.blue, dx: 10, dy: 4, anchor: "start" as const },
    { name: "Llama 3 8B · 15조 토큰", N: 8e9, D: 15e12, color: colors.violet, dx: 10, dy: 4, anchor: "start" as const },
  ];
  return (
    <DiagramFrame
      title="컴퓨트를 모델과 데이터에 나누기: C ≈ 6ND 위에서 D ≈ 20N을 고른다"
      caption="회색 점선은 컴퓨트가 같은 (N, D) 조합이다(C = 6ND). 같은 점선 위에서는 모델을 키우면 데이터가 줄어든다. 초록 직선 D = 20N과 만나는 점이 Chinchilla가 찾은 최적 배분이고, 초록 점은 본문 예제의 세 예산이다. 컴퓨트가 100배가 되면 N과 D가 각각 10배씩 는다. 주황 점선은 Gopher와 Chinchilla가 쓴 비슷한 컴퓨트(약 5–6×10²³)다. 모델을 4배 키운 Gopher(예측 손실 1.99)보다 데이터를 늘린 Chinchilla(1.94)가 낮다. Llama 3 8B처럼 추론 비용을 아끼려고 일부러 작은 모델에 데이터를 훨씬 많이 먹이는 경우도 흔하다."
      viewBox="0 0 720 296"
      minWidth={560}
    >
      <defs>
        <clipPath id={`${P}-clip`}>
          <rect x={G.left} y={G.top} width={G.width} height={G.height} />
        </clipPath>
      </defs>
      <Axes
        {...G}
        sx={sx}
        sy={sy}
        xTicks={[1e9, 1e10, 1e11, 1e12]}
        yTicks={[1e10, 1e11, 1e12, 1e13, 1e14]}
        fmtX={(v) => nLabel[v] ?? ""}
        fmtY={(v) => dLabel[v] ?? ""}
        xLabel="파라미터 수 N"
        yLabel="학습 토큰 수 D"
      />
      <g clipPath={`url(#${P}-clip)`}>
        {[1e21, 1e23, 1e25].map((C) => (
          <path key={C} d={iso(C)} fill="none" stroke={inkMuted} strokeWidth={1.4} strokeDasharray="5 4" />
        ))}
        <path d={iso(5.5e23)} fill="none" stroke={colors.orange} strokeWidth={1.6} strokeDasharray="3 3" />
        <path d={linePath([1e9, 1e12].map((n) => [sx(n), sy(20 * n)] as [number, number]))} fill="none" stroke={colors.green} strokeWidth={2.6} />
      </g>
      {[
        { C: 1e21, n: 1.25e9, t: "C = 10²¹" },
        { C: 1e23, n: 3.2e11, t: "C = 10²³" },
        { C: 1e25, n: 3.6e11, t: "C = 10²⁵" },
      ].map((l) => (
        <text key={l.C} x={sx(l.n)} y={sy(l.C / (6 * l.n)) - 6} fontSize={10} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
          {l.t}
        </text>
      ))}
      <text x={sx(1.6e9)} y={sy(20 * 1.6e9) - 10} fontSize={11} fontWeight={700} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke" transform={`rotate(-25 ${sx(1.6e9)} ${sy(20 * 1.6e9) - 10})`}>
        D = 20N
      </text>
      {opt.map((o) => (
        <g key={o.C}>
          <circle cx={sx(o.N)} cy={sy(20 * o.N)} r={5} fill={colors.green} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={sx(o.N) + 9} y={sy(20 * o.N) + 14} fontSize={10} fontWeight={600} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {o.label}
          </text>
        </g>
      ))}
      {models.map((m) => (
        <g key={m.name}>
          <path d={starPath(sx(m.N), sy(m.D), 8)} fill={m.color} stroke="var(--surface-card)" strokeWidth={1.2} />
          <text x={sx(m.N) + m.dx} y={sy(m.D) + m.dy} textAnchor={m.anchor} fontSize={10.5} fontWeight={700} fill={m.color} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {m.name}
          </text>
        </g>
      ))}
      <Lines x={482} y={30} lines={["점선 하나 = 같은 컴퓨트", "그 위의 어디에 서느냐가", "손실을 정한다"]} size={11.5} anchor="start" color={ink} weight={700} />
      <Lines
        x={482}
        y={100}
        lines={["• 오른쪽 아래: 모델만 크고 데이터 부족", "   (Gopher, 예측 손실 1.99)", "• 초록 선 근처: 컴퓨트 최적", "   (Chinchilla, 예측 손실 1.94)", "• 왼쪽 위: 일부러 과잉학습", "   작은 모델이라 추론이 싸다"]}
        size={10.5}
        anchor="start"
      />
    </DiagramFrame>
  );
}

export function SftLossMask() {
  // 본문 예제의 SFT 데이터 한 건. 손실은 응답(ASSISTANT) 토큰에만 계산한다.
  const P = "slm";
  const toks = [
    { t: "[USER]", w: 58, ans: false },
    { t: "파이썬에서", w: 66, ans: false },
    { t: "리스트를", w: 58, ans: false },
    { t: "뒤집는", w: 50, ans: false },
    { t: "방법은?", w: 56, ans: false },
    { t: "[ASSISTANT]", w: 88, ans: false },
    { t: "두", w: 28, ans: true },
    { t: "가지가", w: 50, ans: true },
    { t: "있습니다.", w: 62, ans: true },
    { t: "lst.reverse()는", w: 106, ans: true },
    { t: "…", w: 26, ans: true },
  ];
  let acc = 14;
  const pos = toks.map((k) => {
    const x = acc;
    acc += k.w + 3;
    return x;
  });
  const userEnd = pos[4] + toks[4].w;
  const ansStart = pos[6];
  const ansEnd = pos[10] + toks[10].w;
  return (
    <DiagramFrame
      title="SFT: 같은 다음 토큰 예측, 다만 응답 토큰에만 손실"
      caption="위: 사전학습만 마친 base 모델은 질문을 받아도 웹의 질문 목록처럼 비슷한 질문을 이어 쓰기 쉽다. (지시, 응답) 쌍으로 SFT를 하면 같은 질문에 답을 쓴다. 아래: SFT 데이터 한 건을 토큰으로 펼친 것이다. 학습 방식은 사전학습과 똑같은 다음 토큰 예측이지만, 질문 쪽 토큰(회색, 0)은 손실에서 빼고 응답 쪽 토큰(초록, 1)의 예측만 손실에 넣는다. 질문을 따라 쓰는 법이 아니라 질문을 보고 답하는 법을 배우게 하려는 것이다. 역할 표시의 실제 모양(채팅 템플릿)은 모델마다 다르다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {[
        { y: 12, who: "Base 모델", out: "파이썬에서 딕셔너리를 정렬하는 방법은? 파이썬에서 문자열을…", note: "질문 목록을 이어 쓴다", color: inkMuted },
        { y: 54, who: "SFT 모델", out: "두 가지가 있습니다. lst.reverse()는 원본을 뒤집고…", note: "질문에 답한다", color: colors.green },
      ].map((r) => (
        <g key={r.who}>
          <text x={14} y={r.y + 18} fontSize={11.5} fontWeight={700} fill={ink}>
            {r.who}
          </text>
          {chip6(90, r.y + 2, "파이썬에서 리스트를 뒤집는 방법은?", colors.blue, 214, 26, 0.12, 11, 600)}
          <Arr x1={308} y1={r.y + 15} x2={330} y2={r.y + 15} color={inkSecondary} marker={`${P}-ink`} />
          <text x={336} y={r.y + 13} fontSize={11} fill={r.color === inkMuted ? inkSecondary : ink} fontStyle={r.color === inkMuted ? "italic" : undefined}>
            {r.out}
          </text>
          <text x={336} y={r.y + 28} fontSize={10} fontWeight={700} fill={r.color}>
            {r.note}
          </text>
        </g>
      ))}
      <line x1={14} y1={98} x2={706} y2={98} stroke="var(--border-hairline)" />
      <text x={14} y={120} fontSize={11.5} fontWeight={700} fill={ink}>
        SFT 데이터 한 건을 토큰으로 펼치면
      </text>
      {toks.map((k, i) => (
        <g key={i}>
          {chip6(pos[i], 132, k.t, k.ans ? colors.green : inkMuted, k.w, 26, k.ans ? 0.14 : 0.08, k.t.startsWith("[") || k.t.startsWith("lst") ? 10 : 11, 600)}
          <rect x={pos[i]} y={166} width={k.w} height={20} rx={4} fill={k.ans ? colors.green : inkMuted} fillOpacity={k.ans ? 0.75 : 0.2} />
          <text x={pos[i] + k.w / 2} y={180} textAnchor="middle" fontSize={11} fontWeight={700} fill={k.ans ? "#fff" : inkSecondary}>
            {k.ans ? 1 : 0}
          </text>
        </g>
      ))}
      <path d={`M${pos[0]},196 v6 H${userEnd} v-6`} fill="none" stroke={inkMuted} />
      <text x={(pos[0] + userEnd) / 2} y={218} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        질문: 문맥으로만 보고 손실은 0
      </text>
      <path d={`M${ansStart},196 v6 H${ansEnd} v-6`} fill="none" stroke={colors.green} />
      <text x={(ansStart + ansEnd) / 2} y={218} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.green}>
        응답: 이 토큰들을 맞히는 손실만 계산
      </text>
    </DiagramFrame>
  );
}

export function FinetuneMemory() {
  // 70B 모델, 활성값 제외. 풀 파인튜닝은 파라미터당 16바이트(bf16 가중치 2 + 기울기 2 + Adam의 fp32 사본·모멘텀·분산 12).
  // LoRA는 고정 가중치(bf16 2바이트)에 LoRA 파라미터(전체의 약 0.3%, 약 2억 개)와 그 학습 상태 ≈ 3GB를 더한다. QLoRA는 고정 가중치를 4비트(0.5바이트)로 둔다.
  const sx = linear(0, 1200, 150, 596);
  const seg = {
    w16: { c: colors.blue, t: 0.7, name: "가중치 (bf16, 2바이트)" },
    grad: { c: colors.aqua, t: 0.75, name: "기울기 (2바이트)" },
    adam: { c: colors.orange, t: 0.7, name: "Adam 상태: fp32 사본·모멘텀·분산 (12바이트)" },
    w4: { c: colors.violet, t: 0.7, name: "4비트 가중치 (0.5바이트)" },
    lora: { c: colors.red, t: 0.9, name: "LoRA 파라미터와 학습 상태 (≈3GB)" },
  };
  const rows = [
    { name: "풀 파인튜닝", sub: "모든 파라미터 학습", parts: [{ k: "w16", v: 140 }, { k: "grad", v: 140 }, { k: "adam", v: 840 }], total: "1,120 GB", gpus: "80GB GPU 14장 이상" },
    { name: "LoRA", sub: "원본은 고정", parts: [{ k: "w16", v: 140 }, { k: "lora", v: 3 }], total: "≈ 143 GB", gpus: "80GB GPU 2장" },
    { name: "QLoRA", sub: "원본을 4비트로", parts: [{ k: "w4", v: 35 }, { k: "lora", v: 3 }], total: "≈ 38 GB", gpus: "GPU 1장" },
  ] as const;
  return (
    <DiagramFrame
      title="70B 모델을 파인튜닝할 때 GPU 메모리: 풀 파인튜닝 · LoRA · QLoRA"
      caption="풀 파인튜닝은 파라미터 하나에 약 16바이트가 들어 70B 모델이면 활성값을 빼고도 1,120GB다. 그중 3/4이 Adam의 학습 상태다. LoRA는 원본 가중치를 고정하므로 기울기와 Adam 상태가 원본에는 필요 없고, 학습하는 작은 행렬 B, A(전체의 약 0.3%)의 몫만 남는다. QLoRA는 고정된 원본까지 4비트로 줄여 한 장의 GPU에 들어간다. 그림의 LoRA 크기(랭크 16, 모든 선형층)와 GPU 대수는 어림값이다."
      viewBox="0 0 720 246"
      minWidth={560}
    >
      <line x1={sx(80)} y1={14} x2={sx(80)} y2={190} stroke={inkSecondary} strokeDasharray="4 3" />
      <text x={sx(80) + 4} y={22} fontSize={10} fill={inkSecondary}>
        GPU 한 장 80GB
      </text>
      {rows.map((r, i) => {
        const y = 34 + i * 54;
        let acc = 0;
        return (
          <g key={r.name}>
            <text x={14} y={y + 14} fontSize={12} fontWeight={700} fill={ink}>
              {r.name}
            </text>
            <text x={14} y={y + 29} fontSize={10} fill={inkSecondary}>
              {r.sub}
            </text>
            {r.parts.map((pt) => {
              const sg = seg[pt.k];
              const x0 = sx(acc);
              acc += pt.v;
              return <rect key={pt.k} x={x0} y={y} width={Math.max(2.5, sx(acc) - x0)} height={30} fill={sg.c} fillOpacity={sg.t} stroke="var(--surface-card)" strokeWidth={0.8} />;
            })}
            <text x={sx(acc) + 8} y={y + 13} fontSize={12} fontWeight={800} fill={ink}>
              {r.total}
            </text>
            <text x={sx(acc) + 8} y={y + 27} fontSize={10} fill={inkSecondary}>
              {r.gpus}
            </text>
          </g>
        );
      })}
      <line x1={sx(0)} y1={190} x2={sx(1200)} y2={190} stroke={inkMuted} />
      {[0, 200, 400, 600, 800, 1000, 1200].map((v) => (
        <text key={v} x={sx(v)} y={203} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {v === 0 ? "0" : `${v.toLocaleString()}GB`}
        </text>
      ))}
      {Object.values(seg).map((sg, i) => {
        const x = 14 + (i % 3) * 236;
        const y = 216 + Math.floor(i / 3) * 16;
        return (
          <g key={sg.name}>
            <rect x={x} y={y - 9} width={11} height={11} rx={2} fill={sg.c} fillOpacity={sg.t} />
            <text x={x + 16} y={y} fontSize={10} fill={inkSecondary}>
              {sg.name}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function QuantizationGrid() {
  // 본문 코드의 가중치 8개(default_rng(0))를 INT8과 INT4로 양자화한다. 눈금 간격 = max|w| / qmax.
  const P = "qgr";
  const w = [0.126, -0.132, 0.64, 0.105, -0.536, 0.362, 1.304, 0.947];
  const maxAbs = Math.max(...w.map(Math.abs));
  const s8 = maxAbs / 127;
  const s4 = maxAbs / 7;
  const q = (v: number, s: number) => Math.round(v / s) * s;
  const err = (s: number) => w.reduce((a, v) => a + Math.abs(v - q(v, s)), 0) / w.length;
  const sx = linear(-1.4, 1.4, 46, 694);
  const order = [...w].sort((a, b) => a - b);
  const rowY = { orig: 50, i8: 118, i4: 196 };
  return (
    <DiagramFrame
      title="양자화는 가중치를 눈금에 맞춰 반올림하는 것: INT8과 INT4"
      caption={`위: 본문 코드의 가중치 8개. 가운데: INT8은 절댓값이 가장 큰 1.304를 127에 맞춰 눈금 간격이 ${s8.toFixed(4)}로 촘촘해, 반올림해도 거의 제자리다(평균 오차 ${err(s8).toFixed(4)}). 아래: INT4는 정수가 −7~7의 15단계뿐이라 눈금 간격이 ${s4.toFixed(3)}로 넓다. 0.105와 0.126이 똑같이 0.186이 되는 등 값이 크게 옮겨져 평균 오차가 ${err(s4).toFixed(3)}, 약 20배다. 비트를 줄이면 메모리는 줄지만 이 반올림 오차를 감수해야 한다.`}
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ red: colors.red }} />
      <text x={14} y={18} fontSize={11.5} fontWeight={700} fill={ink}>
        원래 가중치 (FP16)
      </text>
      <line x1={sx(-1.4)} y1={rowY.orig} x2={sx(1.4)} y2={rowY.orig} stroke={inkMuted} />
      {order.map((v, i) => (
        <g key={v}>
          <circle cx={sx(v)} cy={rowY.orig} r={4.5} fill={colors.blue} />
          <text x={sx(v)} y={rowY.orig - (i % 2 === 0 ? 9 : 21)} textAnchor="middle" fontSize={9.5} fill={inkSecondary} fontFamily={mono}>
            {v.toFixed(3).replace("-", "−")}
          </text>
        </g>
      ))}

      <text x={14} y={rowY.i8 - 30} fontSize={11.5} fontWeight={700} fill={ink}>
        {`INT8: 눈금 255개, 간격 ${s8.toFixed(4)}`}
      </text>
      <path
        d={Array.from({ length: 255 }, (_, k) => `M${sx((k - 127) * s8).toFixed(2)} ${rowY.i8 - 7}v14`).join("")}
        stroke={inkMuted}
        strokeWidth={0.5}
        opacity={0.6}
      />
      {w.map((v) => (
        <circle key={v} cx={sx(q(v, s8))} cy={rowY.i8} r={4.5} fill={colors.green} />
      ))}
      <text x={706} y={rowY.i8 - 30} textAnchor="end" fontSize={11} fontWeight={700} fill={colors.green}>
        {`평균 오차 ${err(s8).toFixed(4)}`}
      </text>

      <text x={14} y={rowY.i4 - 34} fontSize={11.5} fontWeight={700} fill={ink}>
        {`INT4: 눈금 15개, 간격 ${s4.toFixed(3)}`}
      </text>
      {Array.from({ length: 15 }, (_, k) => (
        <g key={k}>
          <line x1={sx((k - 7) * s4)} x2={sx((k - 7) * s4)} y1={rowY.i4 - 9} y2={rowY.i4 + 9} stroke={inkSecondary} strokeWidth={1.2} />
          <text x={sx((k - 7) * s4)} y={rowY.i4 + 21} textAnchor="middle" fontSize={9} fill={inkMuted} fontFamily={mono}>
            {String(k - 7).replace("-", "−")}
          </text>
        </g>
      ))}
      {w.map((v) => {
        const t = q(v, s4);
        return (
          <g key={v}>
            <circle cx={sx(v)} cy={rowY.i4 - 16} r={3.5} fill="none" stroke={colors.blue} strokeWidth={1.4} />
            {Math.abs(sx(t) - sx(v)) > 3 && <Arr x1={sx(v)} y1={rowY.i4 - 14} x2={sx(t)} y2={rowY.i4 - 3} color={colors.red} marker={`${P}-red`} width={1.3} />}
            <circle cx={sx(t)} cy={rowY.i4} r={4.5} fill={colors.red} />
          </g>
        );
      })}
      <text x={706} y={rowY.i4 - 34} textAnchor="end" fontSize={11} fontWeight={700} fill={colors.red}>
        {`평균 오차 ${err(s4).toFixed(3)} (약 20배)`}
      </text>
    </DiagramFrame>
  );
}

export function SoftTargets() {
  // 본문 예제: "나는 __를 먹었다", 정답 "사과". 일반 정답 [1, 0, 0] vs 교사 분포 [0.7, 0.25, 0.05].
  const words = ["사과", "배", "자동차"];
  const panels = [
    { x0: 70, title: "일반 학습의 정답 (원-핫)", vals: [1, 0, 0], color: inkSecondary, note: "배와 자동차가 똑같이 0: 오답끼리의 차이가 없다" },
    { x0: 420, title: "교사 모델의 출력 (부드러운 정답)", vals: [0.7, 0.25, 0.05], color: colors.violet, note: "배 0.25 = 그럴듯한 오답, 자동차 0.05 = 말이 안 됨" },
  ];
  const base = 160;
  const hh = 110;
  return (
    <DiagramFrame
      title="지식 증류: 학생은 정답 하나가 아니라 교사의 분포 전체를 배운다"
      caption="'나는 __를 먹었다'의 정답이 '사과'일 때, 일반 학습의 정답은 사과에만 1을 준다. 교사 모델의 출력은 '배는 꽤 그럴듯하고 자동차는 말이 안 된다'는 정보까지 담고 있다. 학생 모델이 이 분포를 따라 배우면 한 예시에서 얻는 정보가 훨씬 많아져, 같은 크기를 처음부터 혼자 학습시킬 때보다 나은 경우가 많다."
      viewBox="0 0 720 206"
      minWidth={520}
    >
      {panels.map((p) => (
        <g key={p.title}>
          <text x={p.x0 + 110} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={p.color}>
            {p.title}
          </text>
          <line x1={p.x0} y1={base} x2={p.x0 + 220} y2={base} stroke={inkMuted} />
          {p.vals.map((v, i) => (
            <g key={i}>
              <rect x={p.x0 + 14 + i * 70} y={base - v * hh} width={52} height={Math.max(1, v * hh)} rx={4} fill={p.color} fillOpacity={0.7} />
              <text x={p.x0 + 40 + i * 70} y={base - v * hh - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
                {v}
              </text>
              <text x={p.x0 + 40 + i * 70} y={base + 16} textAnchor="middle" fontSize={11} fill={inkSecondary}>
                {words[i]}
              </text>
            </g>
          ))}
          <text x={p.x0 + 110} y={base + 36} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
            {p.note}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function BradleyTerryLoss() {
  // 본문 코드의 세 쌍: (r_w, r_l) = (2.0, 0.5), (1.0, 1.0), (0.2, 1.5).
  const pairs = [
    { rw: 2.0, rl: 0.5 },
    { rw: 1.0, rl: 1.0 },
    { rw: 0.2, rl: 1.5 },
  ];
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  const A = { left: 60, top: 34, width: 250, height: 150 };
  const B = { left: 430, top: 34, width: 250, height: 150 };
  const ax = linear(-4, 4, A.left, A.left + A.width);
  const ay = linear(0, 1, A.top + A.height, A.top);
  const bx = linear(-4, 4, B.left, B.left + B.width);
  const by = linear(0, 4, B.top + B.height, B.top);
  const curve = (f: (z: number) => number, sx: (v: number) => number, sy: (v: number) => number) =>
    linePath(sample(f, -3.95, 4, 120).map(([x, y]) => [sx(x), sy(y)] as [number, number]));
  return (
    <DiagramFrame
      title="보상모델의 학습 목표: 점수 차이 → 선호 확률 → 손실 (Bradley–Terry)"
      caption="왼쪽: 같은 프롬프트의 두 응답에 매긴 점수 차이를 시그모이드에 넣으면 '사람이 y_w를 고를 확률'이 된다. 차이가 0이면 50%다. 오른쪽: 그 확률의 −ln이 보상모델의 손실이다. 점은 본문 코드의 세 쌍이다. 선호 응답의 점수가 1.5 높으면 손실 0.20, 같으면 ln 2 ≈ 0.69, 거꾸로 1.3 낮으면 1.54다. 점수의 절댓값은 의미가 없고 차이만 의미가 있다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <text x={A.left + A.width / 2} y={18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        P(y_w 선호) = σ(r_w − r_l)
      </text>
      <Axes {...A} sx={ax} sy={ay} xTicks={[-4, -2, 0, 2, 4]} yTicks={[0, 0.5, 1]} fmtX={(v) => String(v).replace("-", "−")} xLabel="점수 차 r_w − r_l" yLabel="선호 확률" />
      <path d={curve(sig, ax, ay)} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <text x={B.left + B.width / 2} y={18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        손실 = −ln σ(r_w − r_l)
      </text>
      <Axes {...B} sx={bx} sy={by} xTicks={[-4, -2, 0, 2, 4]} yTicks={[0, 1, 2, 3, 4]} fmtX={(v) => String(v).replace("-", "−")} xLabel="점수 차 r_w − r_l" yLabel="손실" />
      <path d={curve((z) => Math.log(1 + Math.exp(-z)), bx, by)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      {pairs.map((pr, i) => {
        const d = pr.rw - pr.rl;
        const p = sig(d);
        const l = -Math.log(p);
        const lbl = `(${pr.rw.toFixed(1)}, ${pr.rl.toFixed(1)})`;
        return (
          <g key={i}>
            <circle cx={ax(d)} cy={ay(p)} r={5} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1.5} />
            <text x={ax(d) + (d < 0 ? -8 : 8)} y={ay(p) + (d < 0 ? -8 : 14)} textAnchor={d < 0 ? "end" : "start"} fontSize={10} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {`${lbl} → ${p.toFixed(3)}`}
            </text>
            <circle cx={bx(d)} cy={by(l)} r={5} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={1.5} />
            <text x={bx(d) + 8} y={by(l) - 7} fontSize={10} fontWeight={700} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {l.toFixed(2)}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function DpoBetaLoss() {
  // DPO 손실 = −log σ(β·Δ), Δ = 선호 응답과 비선호 응답의 (log π_θ − log π_ref) 차이. 본문 예제: β = 0.1, Δ = 1.5 → 0.62, Δ = 4 → 0.51.
  const G = { left: 62, top: 22, width: 380, height: 176 };
  const sx = linear(0, 30, G.left, G.left + G.width);
  const sy = linear(0, 0.75, G.top + G.height, G.top);
  const loss = (b: number, d: number) => Math.log(1 + Math.exp(-b * d));
  const betas = [
    { b: 0.01, color: colors.blue },
    { b: 0.1, color: colors.violet },
    { b: 0.5, color: colors.orange },
    { b: 1.0, color: colors.red },
  ];
  return (
    <DiagramFrame
      title="DPO의 β: 얼마나 벗어나면 멈추는가"
      caption="가로축은 학습 모델이 기준 모델보다 선호 응답의 로그확률을 비선호 응답보다 얼마나 더 끌어올렸는지(괄호 안의 차이)이고, 세로축은 DPO 손실이다. 차이가 0이면 β와 상관없이 ln 2 ≈ 0.69에서 출발한다. β가 크면(빨강) 조금만 벌어져도 손실이 0에 붙고, 평평해진 곳은 기울기도 0이라 기준 모델 근처에서 멈춘다(보수적). β가 작으면(파랑) 한참 더 벌려야 손실이 줄어 기준 모델에서 더 멀리 간다. 보라 곡선의 두 점이 본문 예제(β = 0.1, 차이 1.5 → 0.62, 차이 4.0 → 0.51)다."
      viewBox="0 0 720 248"
      minWidth={560}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 5, 10, 15, 20, 25, 30]} yTicks={[0, 0.25, 0.5, 0.693]} fmtY={(v) => (v === 0.693 ? "0.69" : String(v))} xLabel="로그확률 비율의 차이 (선호 − 비선호, 기준 모델 대비)" yLabel="DPO 손실" />
      {betas.map((bt, i) => (
        <g key={bt.b}>
          <path d={linePath(sample((d) => loss(bt.b, d), 0, 30, 150).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={bt.color} strokeWidth={2.4} />
          <line x1={sx(19)} x2={sx(21.5)} y1={sy(0.47) + i * 17} y2={sy(0.47) + i * 17} stroke={bt.color} strokeWidth={3} />
          <text x={sx(22.2)} y={sy(0.47) + i * 17 + 4} fontSize={11} fontWeight={700} fill={bt.color}>
            {`β = ${bt.b}`}
          </text>
        </g>
      ))}
      {[1.5, 4].map((d, i) => (
        <g key={d}>
          <circle cx={sx(d)} cy={sy(loss(0.1, d))} r={8} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={sx(d)} y={sy(loss(0.1, d)) + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff">
            {i + 1}
          </text>
        </g>
      ))}
      <Lines x={470} y={40} lines={["β가 크다 (빨강)"]} size={12} anchor="start" color={colors.red} weight={700} />
      <Lines x={470} y={60} lines={["조금만 벌어져도 손실 ≈ 0", "→ 기울기 ≈ 0, 더 밀 이유가 없다", "→ 기준 모델 근처에 묶인다"]} size={11} anchor="start" />
      <Lines x={470} y={130} lines={["β가 작다 (파랑)"]} size={12} anchor="start" color={colors.blue} weight={700} />
      <Lines x={470} y={150} lines={["한참 벌려야 손실이 준다", "→ 기준 모델에서 더 멀리 간다"]} size={11} anchor="start" />
      <Lines x={470} y={200} lines={["본문 예제 (β = 0.1, 보라 점)", "① 차이 1.5 → 손실 0.62", "② 차이 4.0 → 손실 0.51"]} size={10.5} anchor="start" color={colors.violet} weight={700} />
    </DiagramFrame>
  );
}

export function KlPenaltyChoice() {
  // 본문 예제: λ = 0.1. A: 보상 8, KL 1 → 7.9. B: 보상 9, KL 20 → 7.0.
  const lambda = 0.1;
  const sx = linear(0, 10, 170, 640);
  const rows = [
    { name: "응답 A", sub: "보상 8 · KL 1", r: 8, kl: 1, win: true },
    { name: "응답 B", sub: "보상 9 · KL 20 (이상한 말투)", r: 9, kl: 20, win: false },
  ];
  return (
    <DiagramFrame
      title="KL 페널티가 고르는 응답: 보상 − λ·KL"
      caption="초록 막대가 보상모델 점수, 빨간 빗금이 기준 모델에서 멀어진 만큼 깎이는 벌점(λ·KL, λ = 0.1)이다. 보상만 보면 B(9)가 낫지만, B는 기준 모델이 거의 쓰지 않는 말투라 KL이 20이고 벌점 2.0을 받아 7.0이 된다. A는 벌점 0.1만 받아 7.9로 이긴다. 보상모델의 빈틈을 노려 기준 모델에서 멀리 벗어나는 응답(보상 해킹)을 이렇게 억제한다."
      viewBox="0 0 720 186"
      minWidth={540}
    >
      <defs>
        <pattern id="klp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={colors.red} strokeWidth="2.4" />
        </pattern>
      </defs>
      {rows.map((r, i) => {
        const y = 20 + i * 62;
        const net = r.r - lambda * r.kl;
        return (
          <g key={r.name}>
            <text x={14} y={y + 15} fontSize={12.5} fontWeight={700} fill={ink}>
              {r.name}
            </text>
            <text x={14} y={y + 31} fontSize={10} fill={inkSecondary}>
              {r.sub}
            </text>
            <rect x={sx(0)} y={y} width={sx(r.r) - sx(0)} height={32} rx={4} fill={colors.green} fillOpacity={0.55} />
            <rect x={sx(net)} y={y} width={sx(r.r) - sx(net)} height={32} fill="url(#klp-hatch)" stroke={colors.red} strokeWidth={1} />
            <line x1={sx(net)} y1={y - 5} x2={sx(net)} y2={y + 37} stroke={ink} strokeWidth={2} />
            <text x={sx(r.r) + 8} y={y + 13} fontSize={10.5} fill={colors.red} fontWeight={700}>
              {`−${lambda} × ${r.kl} = −${(lambda * r.kl).toFixed(1)}`}
            </text>
            <text x={sx(r.r) + 8} y={y + 28} fontSize={11.5} fontWeight={800} fill={r.win ? colors.green : inkSecondary}>
              {`목적함수 ${net.toFixed(1)}${r.win ? "  ✓ 선택" : ""}`}
            </text>
          </g>
        );
      })}
      <line x1={sx(0)} y1={146} x2={sx(10)} y2={146} stroke={inkMuted} />
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <text key={v} x={sx(v)} y={160} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {v}
        </text>
      ))}
      <text x={sx(5)} y={178} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        점수
      </text>
    </DiagramFrame>
  );
}

export function BeamSearchTree() {
  // 본문 코드의 두 스텝짜리 장난감 모델. 그리디는 "그의"(0.2), 빔 너비 2는 "한편"(0.36)을 찾는다.
  const P = "bst";
  const first = [
    { t: "그", p: 0.5, y: 76, kept: true, kids: [{ t: "는", p: 0.3, y: 30 }, { t: "가", p: 0.3, y: 76 }, { t: "의", p: 0.4, y: 122 }] },
    { t: "한", p: 0.4, y: 192, kept: true, kids: [{ t: "편", p: 0.9, y: 172 }, { t: "번", p: 0.1, y: 212 }] },
    { t: "이", p: 0.1, y: 256, kept: false, kids: [{ t: "제", p: 1.0, y: 256 }] },
  ];
  const rx = 40;
  const x1 = 230;
  const x2 = 430;
  return (
    <DiagramFrame
      title="그리디 vs 빔 서치: 첫 스텝의 1등이 끝까지 1등은 아니다"
      caption="본문 코드의 두 스텝짜리 장난감 모델이다. 가지 옆 숫자는 그 스텝의 확률, 오른쪽 숫자는 두 확률을 곱한 문장 전체의 확률이다. 그리디(빨강)는 첫 스텝에서 0.5인 '그'를 고른 순간 '한편'으로 가는 길을 잃고 '그의'(0.20)를 낸다. 빔 너비 2인 빔 서치는 첫 스텝에서 상위 2개('그', '한')를 함께 살려 두었다가, 둘째 스텝에서 '한편'(0.36)이 더 좋다는 것을 발견한다. 3등 '이'는 첫 스텝에서 잘려 나간다."
      viewBox="0 0 720 290"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ red: colors.red }} />
      <circle cx={rx} cy={160} r={18} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={rx} y={164} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        시작
      </text>
      <text x={x1} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
        스텝 1 (빔: 상위 2개 유지)
      </text>
      <text x={x2} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
        스텝 2
      </text>
      <text x={600} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
        문장 전체 확률
      </text>
      {first.map((f) => {
        const greedy1 = f.t === "그";
        const beam1 = f.kept;
        return (
          <g key={f.t} opacity={f.kept ? 1 : 0.45}>
            <line x1={rx + 18} y1={160} x2={x1 - 22} y2={f.y} stroke={greedy1 ? colors.red : f.t === "한" ? colors.green : inkMuted} strokeWidth={greedy1 || f.t === "한" ? 2.4 : 1.4} />
            <text x={(rx + x1) / 2 + 6} y={(160 + f.y) / 2 - 6} fontSize={10.5} fontWeight={700} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {f.p}
            </text>
            <rect x={x1 - 22} y={f.y - 16} width={44} height={32} rx={8} fill={beam1 ? colors.blue : inkMuted} fillOpacity={beam1 ? 0.14 : 0.08} stroke={beam1 ? colors.blue : inkMuted} strokeWidth={beam1 ? 2 : 1.2} />
            <text x={x1} y={f.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
              {f.t}
            </text>
            {!f.kept && (
              <text x={x1 + 30} y={f.y + 5} fontSize={10.5} fontWeight={700} fill={colors.red}>
                ✗ 빔에서 탈락
              </text>
            )}
            {f.kids.map((k) => {
              const tot = f.p * k.p;
              const greedy = greedy1 && k.t === "의";
              const best = f.t === "한" && k.t === "편";
              const col = greedy ? colors.red : best ? colors.green : inkMuted;
              return (
                <g key={k.t}>
                  <line x1={x1 + 22} y1={f.y} x2={x2 - 22} y2={k.y} stroke={col} strokeWidth={greedy || best ? 2.4 : 1.2} />
                  <text x={(x1 + x2) / 2 + 4} y={(f.y + k.y) / 2 - 5} fontSize={10} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
                    {k.p}
                  </text>
                  <rect x={x2 - 22} y={k.y - 15} width={44} height={30} rx={8} fill={col} fillOpacity={greedy || best ? 0.16 : 0.06} stroke={col} strokeWidth={greedy || best ? 2 : 1} />
                  <text x={x2} y={k.y + 5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
                    {k.t}
                  </text>
                  <text x={560} y={k.y + 5} fontSize={12} fontWeight={greedy || best ? 800 : 500} fill={greedy ? colors.red : best ? colors.green : inkSecondary} fontFamily={mono}>
                    {`${f.t}${k.t} ${tot.toFixed(2)}`}
                  </text>
                  {greedy && (
                    <text x={624} y={k.y + 5} fontSize={10.5} fontWeight={700} fill={colors.red}>
                      ← 그리디
                    </text>
                  )}
                  {best && (
                    <text x={624} y={k.y + 5} fontSize={10.5} fontWeight={700} fill={colors.green}>
                      ← 빔 서치
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function TopkTopP() {
  // top-k = 3은 분포 모양과 상관없이 3개, top-p = 0.9는 누적확률이 0.9를 처음 넘는 지점까지. 가운데는 본문의 점심 예제(softmax([4, 3, 2.5, 1, 0.5, −1])).
  const lunchLogits = [4.0, 3.0, 2.5, 1.0, 0.5, -1.0];
  const e = lunchLogits.map((z) => Math.exp(z - 4));
  const zs = e.reduce((a, b) => a + b, 0);
  const lunch = e.map((v) => v / zs);
  const dists = [
    { title: "뾰족한 분포", sub: "1등이 거의 확실", p: [0.92, 0.04, 0.02, 0.01, 0.007, 0.003], labels: ["", "", "", "", "", ""] },
    { title: "본문 점심 예제", sub: "김밥·라면·국밥…", p: lunch, labels: ["김밥", "라면", "국밥", "파스타", "초밥", "죽"] },
    { title: "평평한 분포", sub: "후보들이 엇비슷", p: [0.22, 0.2, 0.18, 0.16, 0.13, 0.11], labels: ["", "", "", "", "", ""] },
  ];
  const keepP = (p: number[]) => {
    let c = 0;
    for (let i = 0; i < p.length; i++) {
      c += p[i];
      if (c >= 0.9) return i + 1;
    }
    return p.length;
  };
  const bw = 26;
  const base = 168;
  const hh = 120;
  return (
    <DiagramFrame
      title="top-k는 개수를, top-p는 확률질량을 고정한다"
      caption="세 분포 모두 확률이 큰 순서로 정렬했다. 점선은 top-k = 3의 경계로, 분포 모양과 상관없이 늘 3개를 남긴다. 진하게 칠한 막대는 top-p = 0.9가 남기는 후보, 즉 누적확률이 0.9를 처음 넘는 지점까지다. 1등이 거의 확실하면 1개로 줄고(왼쪽), 본문 점심 예제에서는 3개로 top-k = 3과 같으며(가운데), 후보가 엇비슷하면 6개 모두 남는다(오른쪽). top-p는 분포의 모양에 따라 후보 수를 스스로 조절한다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      {dists.map((d, j) => {
        const x0 = 22 + j * 236;
        const kp = keepP(d.p);
        return (
          <g key={d.title}>
            <text x={x0 + 96} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {d.title}
            </text>
            <text x={x0 + 96} y={33} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              {d.sub}
            </text>
            <line x1={x0} y1={base} x2={x0 + 6 * (bw + 6)} y2={base} stroke={inkMuted} />
            {d.p.map((v, i) => (
              <g key={i}>
                <rect x={x0 + 4 + i * (bw + 6)} y={base - v * hh} width={bw} height={Math.max(1, v * hh)} rx={3} fill={colors.violet} fillOpacity={i < kp ? 0.8 : 0.15} stroke={colors.violet} strokeWidth={i < kp ? 0 : 1} />
                <text x={x0 + 4 + i * (bw + 6) + bw / 2} y={base - v * hh - 4} textAnchor="middle" fontSize={8.5} fill={inkSecondary}>
                  {v >= 0.1 ? v.toFixed(2) : v.toFixed(3).replace(/^0/, "")}
                </text>
                {d.labels[i] && (
                  <text x={x0 + 4 + i * (bw + 6) + bw / 2} y={base + 13} textAnchor="middle" fontSize={8.5} fill={inkSecondary}>
                    {d.labels[i]}
                  </text>
                )}
              </g>
            ))}
            <line x1={x0 + 3 * (bw + 6) + 1} y1={44} x2={x0 + 3 * (bw + 6) + 1} y2={base + 4} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="4 3" />
            <text x={x0 + 3 * (bw + 6) + 5} y={54} fontSize={9.5} fontWeight={700} fill={colors.orange}>
              k = 3
            </text>
            <text x={x0 + 96} y={base + 34} textAnchor="middle" fontSize={11} fill={colors.orange} fontWeight={700}>
              top-k = 3 → 3개
            </text>
            <text x={x0 + 96} y={base + 52} textAnchor="middle" fontSize={11} fill={colors.violet} fontWeight={700}>
              {`top-p = 0.9 → ${kp}개`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function LatencyTimeline() {
  // 본문 예제: TTFT 0.5초, 초당 40토큰, 400토큰 → 10.5초. 아래 배치 크기 표는 경향을 보이기 위한 예시 값.
  const sx = linear(0, 10.5, 40, 690);
  const batches = [
    { b: 1, per: 40, total: 40 },
    { b: 8, per: 34, total: 272 },
    { b: 32, per: 22, total: 704 },
  ];
  const px = linear(0, 45, 0, 150);
  const tx = linear(0, 750, 0, 150);
  return (
    <DiagramFrame
      title="사용자가 느끼는 응답 시간과 서버의 처리량"
      caption="위: 프롬프트를 읽고 첫 토큰이 나오기까지(TTFT, 프리필)가 0.5초, 그 뒤 초당 40토큰씩 흘러나오면 400토큰짜리 답은 0.5 + 400/40 = 10.5초가 걸린다. 아래: 여러 요청을 배치로 묶으면 GPU 한 대가 초당 만드는 전체 토큰(처리량)은 크게 늘지만, 사용자 한 명이 보는 속도는 조금씩 느려진다. 아래 숫자는 경향을 보이기 위한 예시다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <rect x={sx(0)} y={30} width={sx(0.5) - sx(0)} height={28} fill={colors.orange} fillOpacity={0.8} />
      <rect x={sx(0.5)} y={30} width={sx(10.5) - sx(0.5)} height={28} fill={colors.blue} fillOpacity={0.18} stroke={colors.blue} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={sx(0.5 + i)} x2={sx(0.5 + i)} y1={30} y2={58} stroke={colors.blue} strokeWidth={1} opacity={0.6} />
      ))}
      <text x={sx(0)} y={22} fontSize={10.5} fontWeight={700} fill={colors.orange}>
        TTFT 0.5초 (프롬프트 읽기)
      </text>
      <text x={sx(5.5)} y={49} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={4} paintOrder="stroke">
        토큰 생성: 초당 40토큰 × 10초 = 400토큰 (눈금 1칸 = 1초 = 40토큰)
      </text>
      <line x1={sx(0)} y1={66} x2={sx(10.5)} y2={66} stroke={inkMuted} />
      {[0, 2, 4, 6, 8].map((v) => (
        <text key={v} x={sx(v)} y={79} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {`${v}초`}
        </text>
      ))}
      <text x={sx(10.5)} y={79} textAnchor="end" fontSize={10.5} fontWeight={800} fill={ink}>
        끝: 10.5초
      </text>
      <line x1={14} y1={94} x2={706} y2={94} stroke="var(--border-hairline)" />
      <text x={14} y={114} fontSize={11.5} fontWeight={700} fill={ink}>
        배치 크기를 키우면 (예시)
      </text>
      <text x={150} y={134} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        사용자 한 명의 속도 (토큰/초)
      </text>
      <text x={440} y={134} fontSize={10.5} fontWeight={700} fill={colors.green}>
        서버 전체 처리량 (토큰/초)
      </text>
      {batches.map((bt, i) => {
        const y = 144 + i * 28;
        return (
          <g key={bt.b}>
            <text x={14} y={y + 15} fontSize={11} fill={inkSecondary}>
              {`배치 ${bt.b}`}
            </text>
            <rect x={150} y={y} width={px(bt.per)} height={20} rx={3} fill={colors.violet} fillOpacity={0.7} />
            <text x={150 + px(bt.per) + 6} y={y + 14} fontSize={10.5} fontWeight={700} fill={colors.violet}>
              {bt.per}
            </text>
            <rect x={440} y={y} width={tx(bt.total)} height={20} rx={3} fill={colors.green} fillOpacity={0.7} />
            <text x={440 + tx(bt.total) + 6} y={y + 14} fontSize={10.5} fontWeight={700} fill={colors.green}>
              {bt.total}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function BigramHallucination() {
  // 본문 코드의 bigram 모델: 사실 문장 3개만 학습. '는' 다음에는 세 나라가 각각 1/3, 앞의 도시 정보는 이미 사라졌다.
  const cities = ["파리", "도쿄", "로마"];
  const countries = ["프랑스", "일본", "이탈리아"];
  const ys = [44, 104, 164];
  const cx = { s: 34, city: 120, neun: 236, country: 352, rest: 470 };
  return (
    <DiagramFrame
      title="사실만 배운 bigram 모델이 거짓 문장을 만드는 이유"
      caption="학습 문장은 '파리는 프랑스의 수도이다' 등 세 개뿐이고 모두 사실이다. 그런데 bigram 모델은 바로 앞 토큰 하나만 보므로, '는' 자리에서 앞의 도시가 무엇이었는지 정보가 끊긴다. '는' 다음에 세 나라가 각각 한 번씩 나왔으니 확률도 1/3씩이다. 그래서 '파리는 일본의 수도이다'(빨강)도 학습 데이터와 똑같이 그럴듯한 문장이 되고, 만들 수 있는 9개 문장 중 사실은 3개뿐이다. 모델은 토큰이 이어지는 확률을 배웠을 뿐 어떤 조합이 사실인지는 배운 적이 없다."
      viewBox="0 0 720 196"
      minWidth={560}
    >
      {chip6(cx.s - 22, ys[1] - 13, "<s>", inkMuted, 44, 26, 0.1, 11)}
      {cities.map((c, i) => (
        <g key={c}>
          <line x1={cx.s + 22} y1={ys[1]} x2={cx.city - 32} y2={ys[i]} stroke={inkMuted} strokeWidth={1.2} />
          {chip6(cx.city - 30, ys[i] - 13, c, colors.blue, 60, 26, 0.14, 12)}
          <line x1={cx.city + 30} y1={ys[i]} x2={cx.neun - 26} y2={ys[1]} stroke={i === 0 ? colors.red : inkMuted} strokeWidth={i === 0 ? 2.2 : 1.2} />
        </g>
      ))}
      <circle cx={cx.neun} cy={ys[1]} r={24} fill={colors.orange} fillOpacity={0.15} stroke={colors.orange} strokeWidth={2} />
      <text x={cx.neun} y={ys[1] + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill={ink}>
        는
      </text>
      {countries.map((c, i) => (
        <g key={c}>
          <line x1={cx.neun + 24} y1={ys[1]} x2={cx.country - 38} y2={ys[i]} stroke={i === 0 ? colors.green : i === 1 ? colors.red : inkMuted} strokeWidth={i < 2 ? 2.2 : 1.2} strokeDasharray={i === 1 ? "6 4" : undefined} />
          <text x={(cx.neun + cx.country) / 2 - 4} y={(ys[1] + ys[i]) / 2 + (i === 1 ? -6 : 4)} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            1/3
          </text>
          {chip6(cx.country - 36, ys[i] - 13, c, colors.violet, 72, 26, 0.14, 12)}
          <line x1={cx.country + 36} y1={ys[i]} x2={cx.rest - 6} y2={ys[1]} stroke={inkMuted} strokeWidth={1.2} />
        </g>
      ))}
      {chip6(cx.rest - 4, ys[1] - 13, "의 수도 이다", inkMuted, 96, 26, 0.1, 11.5)}
      <text x={cx.neun} y={ys[2] + 10} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        여기서 앞 정보가 끊긴다
      </text>
      <Lines
        x={586}
        y={40}
        lines={["파리는 프랑스의 수도이다", "학습 문장 (사실)"]}
        size={11}
        anchor="start"
        color={colors.green}
        weight={700}
      />
      <Lines x={586} y={96} lines={["파리는 일본의 수도이다", "지어낸 문장!"]} size={11} anchor="start" color={colors.red} weight={700} />
      <Lines x={586} y={152} lines={["9개 조합 중", "사실은 3개뿐"]} size={11} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

export function GuessVsAbstain() {
  // 본문 예제: 4지선다를 정말 모를 때. 채점 ①: 정답 1, 오답·모르겠다 0. 채점 ②: 오답 −1/3.
  const sy = linear(-0.1, 0.3, 160, 40);
  const panels = [
    { x0: 70, title: "채점 ①: 정답 1점, 오답 0점, '모르겠다' 0점", guess: 0.25, verdict: "찍는 쪽이 이득 → 모델이 찍도록 길들여진다", vColor: colors.red },
    { x0: 420, title: "채점 ②: 오답에 −1/3점", guess: 0.25 * 1 + 0.75 * (-1 / 3), verdict: "찍어도 기대 점수 0 → 모르면 보류해도 손해 없음", vColor: colors.green },
  ];
  return (
    <DiagramFrame
      title="평가 방식이 행동을 만든다: 모를 때 찍기 vs '모르겠다'"
      caption="4지선다 문제를 정말 모를 때, 찍으면 1/4 확률로 맞는다. 채점 ①처럼 오답과 '모르겠다'가 똑같이 0점이면 찍기의 기대 점수(0.25)가 '모르겠다'(0)보다 높아, 점수를 최대화하도록 학습·평가된 모델은 모를 때도 그럴듯하게 지어내는 쪽을 배운다. 채점 ②처럼 오답에 −1/3점을 주면 찍기의 기대 점수가 0.25 × 1 + 0.75 × (−1/3) = 0이 되어 보류해도 손해가 없다."
      viewBox="0 0 720 220"
      minWidth={560}
    >
      {panels.map((p) => (
        <g key={p.title}>
          <text x={p.x0 + 110} y={20} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
            {p.title}
          </text>
          <line x1={p.x0} y1={sy(0)} x2={p.x0 + 220} y2={sy(0)} stroke={inkMuted} />
          {[
            { name: "찍기 (기대 점수)", v: p.guess, c: colors.orange },
            { name: "모르겠다", v: 0, c: colors.blue },
          ].map((b, i) => (
            <g key={b.name}>
              <rect x={p.x0 + 30 + i * 100} y={Math.min(sy(b.v), sy(0))} width={60} height={Math.max(2, Math.abs(sy(b.v) - sy(0)))} rx={3} fill={b.c} fillOpacity={0.75} />
              <text x={p.x0 + 60 + i * 100} y={Math.min(sy(b.v), sy(0)) - 6} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
                {Math.abs(b.v) < 1e-9 ? "0" : b.v.toFixed(2)}
              </text>
              <text x={p.x0 + 60 + i * 100} y={sy(0) + 18} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
                {b.name}
              </text>
            </g>
          ))}
          <text x={p.x0 + 110} y={sy(0) + 44} textAnchor="middle" fontSize={11} fontWeight={700} fill={p.vColor}>
            {p.verdict}
          </text>
        </g>
      ))}
      <line x1={360} y1={10} x2={360} y2={206} stroke="var(--border-hairline)" />
    </DiagramFrame>
  );
}

export function CalibrationDiagram() {
  // 본문 코드의 12개 답: 확신도 구간별 평균 확신 vs 실제 정답률. 전체 평균 확신 0.80, 실제 0.58.
  const conf = [0.95, 0.9, 0.9, 0.85, 0.8, 0.8, 0.75, 0.7, 0.6, 0.55, 0.95, 0.9];
  const correct = [1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0];
  const bins = [
    [0.5, 0.7],
    [0.7, 0.85],
    [0.85, 1.01],
  ].map(([lo, hi]) => {
    const idx = conf.map((c, i) => (c >= lo && c < hi ? i : -1)).filter((i) => i >= 0);
    return {
      c: idx.reduce((a, i) => a + conf[i], 0) / idx.length,
      a: idx.reduce((a, i) => a + correct[i], 0) / idx.length,
      n: idx.length,
    };
  });
  const allC = conf.reduce((a, b) => a + b, 0) / conf.length;
  const allA = correct.reduce((a, b) => a + b, 0) / correct.length;
  const G = { left: 64, top: 18, width: 250, height: 190 };
  const sx = linear(0.4, 1, G.left, G.left + G.width);
  const sy = linear(0.4, 1, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="보정(calibration) 확인: 말한 확신 vs 실제 정답률"
      caption={`본문 코드의 답 12개를 확신도 구간으로 묶어, 구간마다 '모델이 말한 평균 확신'(가로)과 '실제 정답률'(세로)을 찍었다. 대각선 위에 있으면 보정이 잘 된 것이다. 세 점이 모두 대각선 아래에 있다. 말한 것보다 덜 맞히는 과신(overconfidence) 상태로, 전체로는 평균 ${allC.toFixed(2)}를 확신했지만 실제로는 ${allA.toFixed(2)}만 맞혔다. 점의 크기는 구간에 든 답의 개수다.`}
      viewBox="0 0 720 248"
      minWidth={540}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0.4, 0.6, 0.8, 1]} yTicks={[0.4, 0.6, 0.8, 1]} xLabel="모델이 말한 확신도" yLabel="실제 정답률" />
      <line x1={sx(0.4)} y1={sy(0.4)} x2={sx(1)} y2={sy(1)} stroke={colors.green} strokeWidth={1.6} strokeDasharray="5 4" />
      <text x={sx(0.42)} y={sy(0.42) - 16} fontSize={10.5} fontWeight={700} fill={colors.green} transform={`rotate(-37 ${sx(0.42)} ${sy(0.42) - 16})`}>
        완벽한 보정 (말한 만큼 맞힘)
      </text>
      {bins.map((b, i) => (
        <g key={i}>
          <line x1={sx(b.c)} y1={sy(b.c)} x2={sx(b.c)} y2={sy(b.a)} stroke={colors.red} strokeWidth={1.4} strokeDasharray="3 3" />
          <circle cx={sx(b.c)} cy={sy(b.a)} r={4 + b.n * 1.3} fill={colors.red} fillOpacity={0.75} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={sx(b.c)} y={sy(b.a) + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#fff">
            {b.n}
          </text>
        </g>
      ))}
      <path d={starPath(sx(allC), sy(allA), 8)} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={1.2} />
      <Lines x={360} y={36} lines={["대각선 아래 = 과신"]} size={12} anchor="start" color={colors.red} weight={700} />
      <Lines x={360} y={58} lines={["말한 확신보다 실제 정답률이 낮다.", "빨간 점선의 길이가 그 차이다."]} size={10.5} anchor="start" />
      {bins.map((b, i) => (
        <text key={i} x={360} y={104 + i * 17} fontSize={10.5} fill={ink} fontFamily={mono}>
          {`확신 ${b.c.toFixed(2)} → 정답 ${b.a.toFixed(2)}  (${b.n}개)`}
        </text>
      ))}
      <text x={360} y={155} fontSize={10.5} fontWeight={700} fill={colors.orange} fontFamily={mono}>
        {`★ 전체 ${allC.toFixed(2)} → ${allA.toFixed(2)}  (12개)`}
      </text>
      <Lines x={360} y={184} lines={["사전학습만 한 모델은 객관식에서 꽤 잘 보정되어", "있다는 보고가 있지만, 사후학습을 거치거나 긴", "자유 서술에서는 어긋나기 쉽다."]} size={10} anchor="start" />
    </DiagramFrame>
  );
}

export function HallucinationMap() {
  // 본문의 환각 요인 ①~⑤와 완화책을 단계별로 정리한 지도.
  const stages = [
    { name: "사전학습", cause: ["손실은 '그럴듯함'만 잰다", "드물게 나온 사실은", "구별하기 어렵다"], color: colors.blue },
    { name: "사후학습", cause: ["모르는 사실을 억지로", "학습시키면 지어내기↑", "보정이 나빠지기도"], color: colors.violet },
    { name: "평가", cause: ["'모르겠다' = 0점이면", "찍기가 이득", "→ 추측하도록 길들여짐"], color: colors.orange },
    { name: "디코딩", cause: ["확률 낮은 오답도", "샘플링될 수 있고", "틀린 토큰이 뒤로 이어짐"], color: colors.aqua },
    { name: "사용", cause: ["컨텍스트 창 밖 정보,", "컷오프 이후의 일은", "볼 수 없다"], color: colors.red },
  ];
  const w = 128;
  const gap = 10;
  return (
    <DiagramFrame
      title="환각은 한 군데서 생기지 않는다: 단계별 원인과 완화책"
      caption="환각의 원인은 학습·사후학습·평가·생성·사용의 여러 단계에 흩어져 있다. 그래서 완화책도 여러 겹으로 쓴다. 검색 증강(RAG)과 도구는 모델이 모르거나 볼 수 없는 정보를 채우고, 인용 검증은 근거를 확인하며, 보류를 허용하는 학습·평가는 찍는 습관을 줄인다. 그러나 어느 것도 환각을 없애지는 못하고 줄일 뿐이라, 중요한 용도에서는 사람이 근거를 대조해야 한다."
      viewBox="0 0 720 266"
      minWidth={560}
    >
      {stages.map((s, i) => {
        const x = 14 + i * (w + gap);
        return (
          <g key={s.name}>
            <rect x={x} y={12} width={w} height={30} rx={8} fill={s.color} fillOpacity={0.85} />
            <text x={x + w / 2} y={32} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#fff">
              {s.name}
            </text>
            {i < stages.length - 1 && <path d={`M${x + w + 1},27 l${gap - 2},0`} stroke={inkMuted} strokeWidth={2} />}
            <rect x={x} y={50} width={w} height={70} rx={8} fill={s.color} fillOpacity={0.08} stroke={s.color} strokeWidth={1.2} />
            <Lines x={x + w / 2} y={70} lines={s.cause} size={10.5} color={ink} />
          </g>
        );
      })}
      <text x={14} y={146} fontSize={11.5} fontWeight={700} fill={ink}>
        완화책: 줄일 수는 있지만 없애지는 못한다
      </text>
      {[
        { t: "검색 증강 (RAG)", s: "모르는·최신 정보를 근거로 채움", x: 14, w: 168 },
        { t: "근거 인용 + 검증", s: "인용이 주장을 뒷받침하는지 확인", x: 190, w: 168 },
        { t: "외부 도구", s: "계산기·검색으로 직접 확인", x: 366, w: 160 },
        { t: "보류 학습·평가", s: "모르면 '모르겠다'를 허용", x: 534, w: 172 },
      ].map((m) => (
        <Tag key={m.t} x={m.x} y={156} w={m.w} h={46} lines={[m.t, m.s]} color={colors.green} tint={0.1} size={11.5} />
      ))}
      <rect x={14} y={214} width={692} height={40} rx={8} fill={colors.red} fillOpacity={0.08} stroke={colors.red} strokeDasharray="5 4" />
      <text x={360} y={238} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.red}>
        남는 위험: 검색이 틀리거나 근거를 오독 · 가짜 인용 · 주장과 무관한 인용 → 중요한 용도는 사람이 근거를 대조
      </text>
    </DiagramFrame>
  );
}

export function RlLlmMapping() {
  // 본문의 대응: Agent = LLM, State = 지금까지의 문맥, Action = 다음 토큰, Reward = 응답이 끝난 뒤의 점수. 예제: r = (0, 0, 1), γ = 0.9 → G₀ = 0.81.
  const rows = [
    { k: "에이전트", rl: "행동을 고르는 주체", llm: "LLM" },
    { k: "상태 s_t", rl: "지금 환경의 모습", llm: "대화 + 지금까지 생성한 토큰" },
    { k: "행동 a_t", rl: "고를 수 있는 선택", llm: "다음 토큰 하나" },
    { k: "정책 π(a | s)", rl: "상태 → 행동의 규칙", llm: "언어모델의 다음 토큰 분포" },
    { k: "보상 r_t", rl: "행동 직후의 평가", llm: "응답이 끝난 뒤 보상모델 점수" },
  ];
  const tokens = ["오늘", "날씨는", "맑습니다", "<끝>"];
  return (
    <DiagramFrame
      title="강화학습의 언어로 다시 쓴 LLM 생성"
      caption="왼쪽: 강화학습의 요소가 RLHF에서 무엇에 해당하는지다. LLM이 에이전트이고, 지금까지의 문맥이 상태, 다음 토큰 하나를 고르는 것이 행동, 다음 토큰 분포 자체가 정책이다. 오른쪽: 보상은 토큰마다 주어지지 않고 응답이 끝난 뒤에 한 번 주어진다. 본문 예제처럼 보상이 0, 0, 1이고 γ = 0.9이면 첫 시점의 이득은 0 + 0.9 × 0 + 0.9² × 1 = 0.81이다. 같은 보상이라도 늦게 받을수록 할인된다."
      viewBox="0 0 720 232"
      minWidth={600}
    >
      <text x={92} y={18} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={inkSecondary}>
        요소
      </text>
      <text x={210} y={18} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={inkSecondary}>
        일반 강화학습
      </text>
      <text x={344} y={18} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.violet}>
        RLHF에서
      </text>
      {rows.map((r, i) => {
        const y = 28 + i * 36;
        return (
          <g key={r.k}>
            <rect x={30} y={y} width={124} height={30} rx={6} fill={card2Bg} stroke="var(--border-strong)" />
            <text x={92} y={y + 19} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink} fontFamily={mono}>
              {r.k}
            </text>
            <text x={210} y={y + 19} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              {r.rl}
            </text>
            <rect x={266} y={y} width={156} height={30} rx={6} fill={colors.violet} fillOpacity={0.1} stroke={colors.violet} strokeOpacity={0.6} />
            <text x={344} y={y + 19} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink}>
              {r.llm}
            </text>
          </g>
        );
      })}
      <line x1={440} y1={10} x2={440} y2={220} stroke="var(--border-hairline)" />
      <text x={580} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        보상은 응답이 끝난 뒤에 한 번
      </text>
      {tokens.map((tk, i) => (
        <g key={tk}>
          {chip6(456 + i * 64, 36, tk, i === 3 ? colors.red : colors.blue, 58, 26, 0.14, 10.5)}
          <text x={485 + i * 64} y={80} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={i === 3 ? colors.green : inkSecondary}>
            {i === 3 ? "보상 R" : "r = 0"}
          </text>
        </g>
      ))}
      <line x1={452} x2={708} y1={98} y2={98} stroke="var(--border-hairline)" />
      <text x={580} y={118} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        본문 예제: γ = 0.9로 할인한 이득
      </text>
      {[
        { t: "t = 0", r: 0, w: "× 1" },
        { t: "t = 1", r: 0, w: "× 0.9" },
        { t: "t = 2", r: 1, w: "× 0.81" },
      ].map((s, i) => (
        <g key={s.t}>
          <text x={490 + i * 80} y={142} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {s.t}
          </text>
          {chip6(462 + i * 80, 148, `r = ${s.r}`, s.r ? colors.green : inkMuted, 56, 24, 0.14, 10.5)}
          <text x={490 + i * 80} y={188} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.violet}>
            {s.w}
          </text>
        </g>
      ))}
      <text x={580} y={214} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.violet}>
        G₀ = 0 + 0 + 0.81 × 1 = 0.81
      </text>
    </DiagramFrame>
  );
}

export function ValueIteration() {
  // 본문 코드: 칸 5개, 4번 칸 도착 시 보상 1, γ = 0.9. 한 번 훑을 때마다(왼쪽→오른쪽, 제자리 갱신) 가치가 한 칸씩 왼쪽으로 퍼진다.
  const n = 5;
  const gamma = 0.9;
  const V = new Array(n).fill(0);
  const hist: number[][] = [];
  for (let sweep = 0; sweep < 4; sweep++) {
    for (let s = 0; s < n - 1; s++) {
      const right = s + 1 === n - 1 ? 1 : gamma * V[s + 1];
      const left = gamma * V[Math.max(s - 1, 0)];
      V[s] = Math.max(right, left);
    }
    hist.push([...V]);
  }
  const cw = 78;
  const x0 = 120;
  return (
    <DiagramFrame
      title="가치 반복: 목표의 가치가 한 칸씩 거꾸로 퍼진다"
      caption="본문 코드를 그대로 돌린 결과다. 오른쪽 끝(4번 칸)에 도착하면 보상 1을 받고 끝나며, 각 칸은 '오른쪽/왼쪽 중 더 좋은 행동의 값'으로 갱신된다(벨만 최적 방정식). 첫 번째 훑기에서는 목표 바로 옆 칸만 1이 되고, 훑을 때마다 가치가 한 칸씩 왼쪽으로 전해진다. 네 번째 훑기 뒤에는 [0.729, 0.81, 0.9, 1]로 수렴해 더 이상 바뀌지 않는다. 한 칸 멀어질 때마다 γ = 0.9배가 되고, 모든 칸의 최선의 행동은 오른쪽(→)이다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      {Array.from({ length: n }, (_, j) => (
        <text key={j} x={x0 + j * cw + cw / 2} y={22} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={j === n - 1 ? colors.green : inkSecondary}>
          {j === n - 1 ? "4번 (목표)" : `${j}번 칸`}
        </text>
      ))}
      {hist.map((row, r) => (
        <g key={r}>
          <text x={x0 - 10} y={50 + r * 40} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
            {`${r + 1}번째 훑기 후`}
          </text>
          {row.map((v, j) => {
            const goal = j === n - 1;
            return (
              <g key={j}>
                <rect x={x0 + j * cw + 2} y={30 + r * 40} width={cw - 4} height={32} rx={6} fill={goal ? colors.green : colors.violet} fillOpacity={goal ? 0.2 : 0.06 + 0.5 * v} stroke={goal ? colors.green : "var(--border-strong)"} />
                <text x={x0 + j * cw + cw / 2} y={51 + r * 40} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
                  {goal ? "+1 끝" : v === 0 ? "0" : String(Number(v.toFixed(3)))}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      {Array.from({ length: n - 1 }, (_, j) => (
        <text key={j} x={x0 + j * cw + cw / 2} y={210} textAnchor="middle" fontSize={14} fontWeight={800} fill={colors.violet}>
          →
        </text>
      ))}
      <text x={x0 - 10} y={210} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
        최선의 행동
      </text>
      {[0, 1, 2].map((j) => (
        <text key={j} x={x0 + (j + 1) * cw} y={228} textAnchor="middle" fontSize={9.5} fill={colors.violet} fontWeight={700}>
          × 0.9
        </text>
      ))}
    </DiagramFrame>
  );
}

export function EpsilonGreedy() {
  // 본문 코드(rng 시드 0, 2000번)의 실제 출력. 당첨 확률 0.3·0.5·0.7. 최선 머신만 누르면 기대 보상 0.7.
  const runs = [
    { eps: "ε = 0", avg: 0.289, counts: [2000, 0, 0], note: "처음 당첨된 0.3에 갇힘" },
    { eps: "ε = 0.1", avg: 0.677, counts: [96, 73, 1831], note: "균형: 대부분 0.7을 누름" },
    { eps: "ε = 0.5", avg: 0.587, counts: [333, 341, 1326], note: "탐색이 너무 잦음" },
  ];
  const mc = [colors.red, colors.orange, colors.green];
  const bx = linear(0, 2000, 0, 300);
  const ay = linear(0, 0.8, 196, 40);
  return (
    <DiagramFrame
      title="ε-탐욕: 탐색과 활용의 균형"
      caption="본문 코드의 실제 출력이다(당첨 확률 0.3, 0.5, 0.7인 슬롯머신 세 대, 2,000번). 왼쪽은 머신별로 누른 횟수다. ε = 0은 처음 당첨된 0번 머신(0.3)만 2,000번 눌러 평균 보상이 0.289에 그친다. ε = 0.5는 좋은 머신을 알고도 절반 가까이 다른 것을 눌러 0.587이다. ε = 0.1은 대부분 0.7짜리를 누르면서도 가끔 탐색해 0.677로, 최선 머신만 누를 때의 기대값 0.7(점선)에 가장 가깝다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <text x={20} y={20} fontSize={11.5} fontWeight={800} fill={ink}>
        머신별 선택 횟수 (2,000번 중)
      </text>
      {runs.map((r, i) => {
        const y = 40 + i * 58;
        let acc = 0;
        return (
          <g key={r.eps}>
            <text x={20} y={y + 15} fontSize={11.5} fontWeight={800} fill={ink}>
              {r.eps}
            </text>
            {r.counts.map((c, k) => {
              const x = 84 + bx(acc);
              acc += c;
              const w = bx(c);
              return (
                <g key={k}>
                  {w > 0 && <rect x={x} y={y} width={w} height={22} fill={mc[k]} fillOpacity={0.6} stroke="var(--surface-card)" />}
                  {w > 34 && (
                    <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
                      {c}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={84} y={y + 38} fontSize={9.5} fill={inkSecondary}>
              {`${r.note}${r.counts[0] && r.counts[1] ? ` (0.3: ${r.counts[0]}, 0.5: ${r.counts[1]})` : ""}`}
            </text>
          </g>
        );
      })}
      {["0.3", "0.5", "0.7"].map((t, k) => (
        <g key={t}>
          <rect x={84 + k * 92} y={212} width={12} height={12} rx={2} fill={mc[k]} fillOpacity={0.6} />
          <text x={100 + k * 92} y={222} fontSize={10} fill={ink}>
            {`당첨 ${t} 머신`}
          </text>
        </g>
      ))}
      <line x1={420} y1={14} x2={420} y2={226} stroke="var(--border-hairline)" />
      <text x={560} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        평균 보상
      </text>
      <line x1={450} x2={690} y1={ay(0.7)} y2={ay(0.7)} stroke={colors.green} strokeDasharray="5 3" />
      <text x={690} y={ay(0.7) - 5} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.green}>
        최선 머신만: 0.7
      </text>
      <line x1={450} x2={690} y1={ay(0)} y2={ay(0)} stroke={inkMuted} />
      {runs.map((r, i) => {
        const cx = 490 + i * 80;
        return (
          <g key={`a${r.eps}`}>
            <rect x={cx - 24} y={ay(r.avg)} width={48} height={ay(0) - ay(r.avg)} rx={3} fill={i === 1 ? colors.green : colors.blue} fillOpacity={i === 1 ? 0.7 : 0.45} />
            <text x={cx} y={ay(r.avg) + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
              {r.avg.toFixed(3)}
            </text>
            <text x={cx} y={ay(0) + 16} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
              {r.eps}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function RlMethodMap() {
  // 본문이 소개한 방법들의 관계: 가치 기반(Q-Learning → DQN), 정책 기반(정책 경사), 둘을 합친 액터-크리틱(→ PPO → RLHF).
  const P = "rmm";
  return (
    <DiagramFrame
      title="강화학습 방법의 지도: 가치를 배우거나, 정책을 배우거나, 둘 다"
      caption="가치 기반 방법은 벨만 방정식으로 Q(s, a)를 배운 뒤 Q가 가장 큰 행동을 고른다. 상태가 적으면 표(Q-Learning)로, 많으면 신경망(DQN)으로 Q를 근사한다. 정책 기반 방법은 Q를 거치지 않고 정책 π(a | s) 자체를 신경망으로 두고 기대 이득이 커지는 기울기 방향으로 직접 갱신한다. 액터-크리틱은 둘을 합쳐 critic(가치)이 actor(정책)의 갱신을 평가해 분산을 줄인다. PPO는 여기에 '기존 정책에서 너무 멀리 가지 않게' 하는 제약을 더한 방법이고, RLHF가 LLM을 학습시킬 때 쓴다."
      viewBox="0 0 720 222"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet }} />
      <Tag x={20} y={20} w={200} h={46} lines={["가치 기반", "Q(s, a)를 배우고 최댓값 행동 선택"]} color={colors.blue} size={11.5} />
      <Tag x={20} y={90} w={92} h={46} lines={["Q-Learning", "Q를 표로"]} color={colors.blue} size={10.5} tint={0.08} />
      <Tag x={128} y={90} w={92} h={46} lines={["DQN", "Q를 신경망으로"]} color={colors.blue} size={10.5} tint={0.08} />
      <Arr x1={66} y1={68} x2={66} y2={88} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={174} y1={68} x2={174} y2={88} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={500} y={20} w={200} h={46} lines={["정책 기반 (정책 경사)", "π(a | s)를 직접 기울기로 갱신"]} color={colors.orange} size={11.5} />
      <Tag x={250} y={90} w={220} h={46} lines={["액터-크리틱", "actor = 정책, critic = 가치 평가"]} color={colors.violet} size={11.5} />
      <Arr x1={220} y1={50} x2={300} y2={88} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={500} y1={50} x2={420} y2={88} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={270} y={160} w={180} h={42} lines={["PPO", "멀리 가지 않게 제약 (Proximal)"]} color={colors.violet} size={11.5} tint={0.2} />
      <Arr x1={360} y1={138} x2={360} y2={158} color={colors.violet} marker={`${P}-violet`} width={1.6} />
      <Tag x={510} y={160} w={190} h={42} lines={["RLHF", "보상 = 보상모델 점수, 정책 = LLM"]} color={colors.green} size={11.5} />
      <Arr x1={452} y1={181} x2={508} y2={181} color={colors.violet} marker={`${P}-violet`} width={1.6} />
      <Lines x={120} y={168} lines={["바탕: 벨만 방정식", "Q(s, a) = E[r + γ Q(s′, a′)]"]} size={10.5} color={inkSecondary} weight={600} />
    </DiagramFrame>
  );
}

export function MajorityVote() {
  // 본문: 정답·오답 두 갈래면 이항분포로 과반 확률. 오답이 세 갈래(0.2씩)로 흩어지면 최다 득표만 받으면 된다(동점은 무작위).
  const ns = Array.from({ length: 21 }, (_, i) => 2 * i + 1);
  const lfact = (k: number) => {
    let s = 0;
    for (let i = 2; i <= k; i++) s += Math.log(i);
    return s;
  };
  const binom = (p: number, n: number) => {
    let s = 0;
    for (let k = Math.floor(n / 2) + 1; k <= n; k++) s += Math.exp(lfact(n) - lfact(k) - lfact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
    return s;
  };
  const plural = (n: number) => {
    const pr = [0.4, 0.2, 0.2, 0.2];
    let tot = 0;
    for (let a = 0; a <= n; a++)
      for (let b = 0; b <= n - a; b++)
        for (let c = 0; c <= n - a - b; c++) {
          const d = n - a - b - c;
          const ks = [a, b, c, d];
          const m = Math.max(...ks);
          if (a !== m) continue;
          const ties = ks.filter((k) => k === m).length;
          let lp = lfact(n);
          ks.forEach((k, i) => (lp += -lfact(k) + k * Math.log(pr[i])));
          tot += Math.exp(lp) / ties;
        }
    return tot;
  };
  const G = { left: 56, top: 18, width: 430, height: 180 };
  const sx = linear(1, 41, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const series = [
    { t: "p = 0.8", f: (n: number) => binom(0.8, n), c: colors.green },
    { t: "p = 0.6", f: (n: number) => binom(0.6, n), c: colors.blue },
    { t: "p = 0.4, 오답이 흩어짐 (0.2 × 3)", f: plural, c: colors.violet },
    { t: "p = 0.4, 오답이 한 갈래", f: (n: number) => binom(0.4, n), c: colors.red },
  ].map((s) => ({ ...s, ys: ns.map((n) => s.f(n)) }));
  const p21 = series[2].ys[10];
  return (
    <DiagramFrame
      title="자기일관성(다수결): 대체로 맞히는 문제만 더 확실해진다"
      caption={`같은 문제를 n번 풀어 다수결한 정답률이다. 한 번 정답률이 0.8이면 세 번만 풀어도 0.896(본문 예제), 0.6이면 101번에 0.98까지 오른다. 정답·오답 두 갈래이고 한 번 정답률이 0.4이면 반대로 n을 늘릴수록 떨어진다(세 번이면 0.352). 하지만 오답이 여러 갈래로 흩어지면 정답이 과반일 필요 없이 가장 많은 표만 받으면 되므로, 정답 0.4에 오답 세 개가 0.2씩인 경우 21표 다수결은 약 ${Math.round(p21 * 100)}%까지 오른다(동점은 무작위로 고른다고 할 때). 표본이 독립이라는 가정이 깨져 오답이 한곳에 몰리면 이 이득은 사라진다.`}
      viewBox="0 0 720 240"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 5, 11, 21, 31, 41]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="푼 횟수 n (다수결)" yLabel="정답률" />
      {series.map((s) => (
        <g key={s.t}>
          <path d={linePath(ns.map((n, i) => [sx(n), sy(s.ys[i])] as [number, number]))} fill="none" stroke={s.c} strokeWidth={2.4} />
          {ns.map((n, i) => (
            <circle key={n} cx={sx(n)} cy={sy(s.ys[i])} r={2.2} fill={s.c} />
          ))}
        </g>
      ))}
      <circle cx={sx(3)} cy={sy(0.896)} r={5} fill="none" stroke={colors.green} strokeWidth={1.8} />
      <text x={sx(3) + 6} y={sy(0.896) + 16} fontSize={10} fontWeight={800} fill={colors.green}>
        0.896
      </text>
      <circle cx={sx(3)} cy={sy(0.352)} r={5} fill="none" stroke={colors.red} strokeWidth={1.8} />
      <text x={sx(3) + 8} y={sy(0.352) + 4} fontSize={10} fontWeight={800} fill={colors.red}>
        0.352
      </text>
      <circle cx={sx(21)} cy={sy(p21)} r={5} fill="none" stroke={colors.violet} strokeWidth={1.8} />
      <text x={sx(21) + 4} y={sy(p21) + 18} fontSize={10} fontWeight={800} fill={colors.violet}>
        {`21표: ${Math.round(p21 * 100)}%`}
      </text>
      {series.map((s, i) => (
        <g key={`l${s.t}`}>
          <line x1={506} x2={530} y1={50 + i * 34} y2={50 + i * 34} stroke={s.c} strokeWidth={2.4} />
          <Lines x={536} y={54 + i * 34} lines={s.t.split(", ")} size={10.5} anchor="start" color={s.c} weight={700} gap={1.2} />
        </g>
      ))}
      <text x={506} y={196} fontSize={10} fill={inkSecondary}>
        p = 한 번 풀 때의 정답률
      </text>
    </DiagramFrame>
  );
}

export function BestOfN() {
  // 본문 best_of_n: p = 0.3, 통과한 후보가 없으면 오답. 상한 = p·TPR / (p·TPR + (1 − p)·FPR).
  const p = 0.3;
  const vs = [
    { tpr: 1.0, fpr: 0.0, c: colors.green, t: "완벽한 검증기" },
    { tpr: 0.9, fpr: 0.1, c: colors.blue, t: "TPR 0.9, FPR 0.1" },
    { tpr: 0.9, fpr: 0.5, c: colors.red, t: "TPR 0.9, FPR 0.5" },
  ];
  const bon = (n: number, tpr: number, fpr: number) => {
    const a = p * tpr;
    const b = (1 - p) * fpr;
    return (1 - (1 - a - b) ** n) * (a / (a + b));
  };
  const G = { left: 300, top: 18, width: 300, height: 180 };
  const sx = log10Scale(1, 64, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const P = "bon";
  return (
    <DiagramFrame
      title="best-of-n: 표본을 늘려도 검증기의 정밀도에서 멈춘다"
      caption="왼쪽: 후보 n개를 만들고 검증기가 통과시킨 것 하나를 고른다. 오른쪽: 본문 코드의 best_of_n(p = 0.3)이다. 검증기가 완벽하면 '적어도 하나가 맞을 확률' 1 − 0.7ⁿ을 따라 16개면 99.7%가 된다. 오답을 10% 통과시키는 검증기는 79.4%, 50% 통과시키는 검증기는 43.5%에서 멈춘다(점선). 이 상한 p·TPR / (p·TPR + (1 − p)·FPR)은 2주차의 Precision과 같은 식이라, n을 16에서 64로 늘려도 거의 변하지 않는다. 그 지점부터는 생성이 아니라 검증이 병목이다."
      viewBox="0 0 720 240"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {chip6(14, 92, "문제", colors.violet, 52, 28, 0.14, 11)}
      <Arr x1={68} y1={106} x2={88} y2={106} color={inkSecondary} marker={`${P}-ink`} />
      {["✓", "✗", "✗", "✓", "✗"].map((m, i) => (
        <g key={i}>
          <rect x={92} y={28 + i * 30} width={66} height={24} rx={5} fill={m === "✓" ? colors.green : colors.red} fillOpacity={0.12} stroke={m === "✓" ? colors.green : colors.red} />
          <text x={125} y={44 + i * 30} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink}>
            {`후보 ${i + 1} ${m}`}
          </text>
        </g>
      ))}
      <Arr x1={162} y1={106} x2={182} y2={106} color={inkSecondary} marker={`${P}-ink`} />
      <rect x={186} y={78} width={74} height={56} rx={8} fill={colors.blue} fillOpacity={0.12} stroke={colors.blue} />
      <text x={223} y={100} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.blue}>
        검증기
      </text>
      <text x={223} y={116} textAnchor="middle" fontSize={9} fill={inkSecondary}>
        정답 통과 TPR
      </text>
      <text x={223} y={128} textAnchor="middle" fontSize={9} fill={inkSecondary}>
        오답 통과 FPR
      </text>
      <Lines x={223} y={160} lines={["통과한 것 중", "하나를 낸다"]} size={10} color={ink} weight={700} />
      <text x={125} y={196} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        한 번 정답률 p = 0.3
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 2, 4, 8, 16, 32, 64]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="후보 수 n (로그 눈금)" />
      {vs.map((v) => {
        const cap = (p * v.tpr) / (p * v.tpr + (1 - p) * v.fpr);
        return (
          <g key={v.t}>
            <line x1={G.left} x2={G.left + G.width} y1={sy(cap)} y2={sy(cap)} stroke={v.c} strokeDasharray="4 3" strokeOpacity={0.7} />
            <path d={linePath(sample((lx) => bon(10 ** lx, v.tpr, v.fpr), 0, Math.log10(64), 80).map(([x, y]) => [sx(10 ** x), sy(y)] as [number, number]))} fill="none" stroke={v.c} strokeWidth={2.4} />
            {[1, 4, 16, 64].map((n) => (
              <circle key={n} cx={sx(n)} cy={sy(bon(n, v.tpr, v.fpr))} r={3.2} fill={v.c} />
            ))}
          </g>
        );
      })}
      {vs.map((v, i) => {
        const cap = (p * v.tpr) / (p * v.tpr + (1 - p) * v.fpr);
        return (
          <g key={`l${v.t}`}>
            <line x1={614} x2={634} y1={50 + i * 44} y2={50 + i * 44} stroke={v.c} strokeWidth={2.4} />
            <Lines x={640} y={46 + i * 44} lines={[v.t, `상한 ${(cap * 100).toFixed(1)}%`]} size={9.5} anchor="start" color={v.c} weight={700} gap={1.3} />
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function KlOptimalPolicy() {
  // 본문 코드: π_ref = (0.5, 0.3, 0.2), r = (1, 2, 0). π* ∝ π_ref·e^(r/β)를 β = 0.1, 1, 10에서. 오른쪽: 응답 두 개짜리 예(π_ref = (0.5, 0.5), r = (1, 0))의 π*(y₁) = σ(1/β).
  const piRef = [0.5, 0.3, 0.2];
  const r = [1, 2, 0];
  const pis = (b: number) => {
    const w = piRef.map((p, i) => p * Math.exp(r[i] / b));
    const z = w.reduce((s, v) => s + v, 0);
    return w.map((v) => v / z);
  };
  const groups = [
    { t: "π_ref", v: piRef, c: inkMuted },
    { t: "β = 10", v: pis(10), c: colors.blue },
    { t: "β = 1", v: pis(1), c: colors.violet },
    { t: "β = 0.1", v: pis(0.1), c: colors.red },
  ];
  const L = { left: 52, top: 30, width: 330, height: 160 };
  const ly = linear(0, 1, L.top + L.height, L.top);
  const R = { left: 470, top: 30, width: 230, height: 160 };
  const rx = log10Scale(0.01, 100, R.left, R.left + R.width);
  const ry = linear(0.4, 1, R.top + R.height, R.top);
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  return (
    <DiagramFrame
      title="KL 규제 보상 최대화의 답: π* ∝ π_ref · e^(r/β)"
      caption="왼쪽: 본문 코드의 응답 3개짜리 세계(기준 모델 π_ref = (0.5, 0.3, 0.2), 보상 r = (1, 2, 0))에서 최적 정책 π*를 β별로 계산했다. 막대 위 숫자는 확률이다. β = 10이면 e^(r/β)가 1에 가까워 기준 모델을 거의 그대로 따르고, β = 1이면 보상이 높은 응답 2 쪽으로 기울며, β = 0.1이면 보상 최댓값인 응답 2에 확률이 거의 전부 몰린다. 오른쪽: 응답 두 개짜리 예(π_ref = (0.5, 0.5), r = (1, 0))에서 보상이 높은 응답의 확률 π*(y₁) = σ(1/β)다. β가 보상을 쫓는 쪽(작은 β)과 기준 모델에 머무는 쪽(큰 β) 사이를 잇는 온도 손잡이라는 것이 보인다."
      viewBox="0 0 720 248"
      minWidth={600}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        응답 3개, r = (1, 2, 0)
      </text>
      <Axes {...L} sx={linear(0, 1, L.left, L.left + L.width)} sy={ly} yTicks={[0, 0.5, 1]} yLabel="확률" />
      {groups.map((g, gi) => (
        <g key={g.t}>
          {g.v.map((v, i) => {
            const x = L.left + 14 + gi * 80 + i * 21;
            return (
              <g key={i}>
                <rect x={x} y={ly(v)} width={18} height={Math.max(0.6, ly(0) - ly(v))} rx={2} fill={g.c} fillOpacity={0.35 + 0.2 * i} />
                <text x={x + 9} y={ly(v) - 4} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={ink}>
                  {v < 0.005 ? "0" : v.toFixed(2).replace(/^0/, "")}
                </text>
              </g>
            );
          })}
          <text x={L.left + 14 + gi * 80 + 31} y={L.top + L.height + 16} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={g.c}>
            {g.t}
          </text>
        </g>
      ))}
      <text x={L.left + 4} y={L.top + L.height + 34} fontSize={9.5} fill={inkSecondary}>
        각 묶음의 막대: 응답 1 · 2 · 3 (보상 1 · 2 · 0)
      </text>
      <line x1={420} y1={14} x2={420} y2={236} stroke="var(--border-hairline)" />
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        응답 2개, r = (1, 0): π*(y₁) = σ(1/β)
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0.01, 0.1, 1, 10, 100]} yTicks={[0.5, 0.75, 1]} fmtX={(v) => String(v)} xLabel="β (로그 눈금)" />
      <path d={linePath(sample((u) => sig(1 / 10 ** u), -2, 2, 200).map(([u, y]) => [rx(10 ** u), ry(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      {[0.1, 1, 10].map((b) => (
        <g key={b}>
          <circle cx={rx(b)} cy={ry(sig(1 / b))} r={4.5} fill={colors.violet} />
          <text x={rx(b) + 7} y={ry(sig(1 / b)) + (b === 1 ? -7 : b === 0.1 ? 16 : -9)} fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {`β = ${b}: ${sig(1 / b).toFixed(3)}`}
          </text>
        </g>
      ))}
      <text x={rx(0.012)} y={ry(0.86)} fontSize={9.5} fontWeight={700} fill={colors.red}>
        보상만 쫓기
      </text>
      <text x={rx(90)} y={ry(0.44)} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.blue}>
        기준 모델에 머물기
      </text>
    </DiagramFrame>
  );
}

export function DpoZCancel() {
  // 2단계: r(y) = β log(π*/π_ref) + β log Z. 상수 β log Z는 같은 프롬프트의 모든 응답에서 같아 Bradley–Terry의 차이에서 사라진다.
  // 오른쪽: DPO 기울기의 가중치 σ(r̂(y_l) − r̂(y_w)) = σ(−마진).
  const by = linear(0, 5, 196, 42);
  const logZ = 2.4;
  const ys = [
    { t: "y_w (선호)", ratio: 1.9, c: colors.green },
    { t: "y_l (비선호)", ratio: 0.7, c: colors.red },
  ];
  const G = { left: 450, top: 34, width: 250, height: 160 };
  const sx = linear(-6, 6, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="DPO 손실: 계산할 수 없는 β log Z는 빼기에서 사라진다"
      caption="왼쪽: 2단계의 식대로 보상을 두 조각으로 나눠 쌓았다. 회색은 응답과 무관한 상수 β log Z(가능한 모든 응답에 대한 합이라 계산할 수 없다)이고, 색 막대는 정책과 기준 모델의 로그확률 비율 β log(π/π_ref)다. 사람의 선호(Bradley–Terry)는 두 보상의 차이만 보므로 회색 부분은 정확히 지워지고, 남는 것은 로그확률 비율의 차이뿐이다. 그래서 보상모델 없이 정책의 로그확률만으로 손실을 계산할 수 있다. 오른쪽: DPO 기울기에 곱해지는 가중치 σ(r̂(y_l) − r̂(y_w))다. 모델이 이미 선호 응답의 암묵적 보상을 높게 매긴 쌍(마진이 큰 양수)은 가중치가 0에 가깝고, 거꾸로 매긴 쌍일수록 1에 가깝게 크게 고친다."
      viewBox="0 0 720 248"
      minWidth={600}
    >
      <text x={20} y={20} fontSize={11.5} fontWeight={800} fill={ink}>
        보상 = β log(π/π_ref) + β log Z
      </text>
      {ys.map((y, i) => {
        const x = 70 + i * 120;
        return (
          <g key={y.t}>
            <rect x={x} y={by(logZ)} width={56} height={by(0) - by(logZ)} fill={inkMuted} fillOpacity={0.3} />
            <rect x={x} y={by(logZ + y.ratio)} width={56} height={by(logZ) - by(logZ + y.ratio)} fill={y.c} fillOpacity={0.55} />
            <text x={x + 28} y={by(logZ / 2) + 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={ink}>
              β log Z
            </text>
            <text x={x + 28} y={by(0) + 16} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={y.c}>
              {y.t}
            </text>
          </g>
        );
      })}
      <line x1={60} x2={320} y1={by(logZ)} y2={by(logZ)} stroke={ink} strokeDasharray="4 3" />
      <text x={322} y={by(logZ) + 4} fontSize={9.5} fill={inkSecondary}>
        같은 높이
      </text>
      <line x1={136} x2={300} y1={by(logZ + 1.9)} y2={by(logZ + 1.9)} stroke={colors.green} strokeDasharray="3 3" />
      <line x1={250} x2={300} y1={by(logZ + 0.7)} y2={by(logZ + 0.7)} stroke={colors.red} strokeDasharray="3 3" />
      <line x1={296} x2={296} y1={by(logZ + 1.9)} y2={by(logZ + 0.7)} stroke={ink} strokeWidth={1.6} />
      <Lines x={304} y={by(logZ + 1.4)} lines={["차이에는", "비율만 남는다"]} size={10} anchor="start" color={ink} weight={800} gap={1.35} />
      <text x={20} y={232} fontSize={10} fill={inkSecondary}>
        P(y_w ≻ y_l) = σ(보상 차이) → 회색 β log Z가 빼기에서 소거
      </text>
      <line x1={420} y1={14} x2={420} y2={240} stroke="var(--border-hairline)" />
      <text x={G.left} y={20} fontSize={11.5} fontWeight={800} fill={ink}>
        기울기의 가중치 σ(r̂_l − r̂_w)
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[-6, -3, 0, 3, 6]} yTicks={[0, 0.5, 1]} fmtX={(v) => String(v).replace("-", "−")} xLabel="마진 r̂(y_w) − r̂(y_l)" />
      <rect x={sx(-6)} y={G.top} width={sx(0) - sx(-6)} height={G.height} fill={colors.red} fillOpacity={0.06} />
      <path d={linePath(sample((m) => 1 / (1 + Math.exp(m)), -6, 6, 160).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <Lines x={sx(-5.7)} y={sy(0.62)} lines={["거꾸로 매긴 쌍:", "크게 고친다"]} size={10} anchor="start" color={colors.red} weight={800} gap={1.35} />
      <Lines x={sx(5.8)} y={sy(0.42)} lines={["이미 맞게 매긴 쌍:", "거의 안 고친다"]} size={10} anchor="end" color={colors.green} weight={800} gap={1.35} />
    </DiagramFrame>
  );
}

export function BaselineVariance() {
  // 본문 코드: 행동 3개, θ = 0(균등 정책), 보상 (10, 11, 12). 추정치 (R_a − b)(e_a − p)는 행동마다 하나씩 3가지 값만 가진다.
  // b = 0: 분산 합 ≈ 80.9, b = 11: ≈ 0.22. 두 경우 모두 평균 (−1/3, 0, 1/3). 그림은 성분 0과 성분 2만 그린다.
  const P = "blv";
  const R = [10, 11, 12];
  const p = [1 / 3, 1 / 3, 1 / 3];
  const g = (b: number, a: number) => [0, 1, 2].map((k) => (R[a] - b) * ((k === a ? 1 : 0) - p[k]));
  const vecs = (b: number, cx: number, cy: number, S: number, color: string, mk: string, labels: boolean) => (
    <g>
      {[0, 1, 2].map((a) => {
        const v = g(b, a);
        const len = Math.hypot(v[0], v[2]);
        if (len < 0.05) return <circle key={a} cx={cx} cy={cy} r={3} fill={color} />;
        const ex = cx + v[0] * S;
        const ey = cy - v[2] * S;
        return (
          <g key={a}>
            <Arr x1={cx} y1={cy} x2={ex} y2={ey} color={color} marker={mk} width={1.6} />
            {labels && (
              <text x={ex + (v[0] > 0 ? 6 : -6)} y={ey + (v[2] > 0 ? 4 : 14)} textAnchor={v[0] > 0 ? "start" : "end"} fontSize={9.5} fontWeight={700} fill={color}>
                {`행동 ${a}${a === 2 ? "를" : "을"} 뽑으면`}
              </text>
            )}
          </g>
        );
      })}
      <Arr x1={cx} y1={cy} x2={cx - S / 3} y2={cy - S / 3} color={colors.violet} marker={`${P}-violet`} width={2.6} />
    </g>
  );
  const axes = (cx: number, cy: number, S: number, xr: number, yr: number) => (
    <g>
      <line x1={cx - xr * S} x2={cx + xr * S} y1={cy} y2={cy} stroke={inkMuted} strokeOpacity={0.6} />
      <line x1={cx} x2={cx} y1={cy - yr * S} y2={cy + yr * 0.9 * S} stroke={inkMuted} strokeOpacity={0.6} />
    </g>
  );
  const S = 10;
  return (
    <DiagramFrame
      title="기준선은 평균을 그대로 두고 분산만 줄인다"
      caption="본문 코드의 상황(균등한 정책, 행동 3개의 보상 10 · 11 · 12)에서 표본 하나로 낸 정책 경사 추정치를 화살표로 그렸다(3차원 기울기 중 가로 성분 0과 세로 성분 2만). 뽑힌 행동에 따라 추정치는 세 가지 중 하나다. 왼쪽: 기준선이 없으면 보상이 모두 양수라 뽑힌 행동이 무엇이든 그 확률을 크게 올리는 긴 화살표가 나오고, 진짜 기울기(보라, 세 화살표의 평균)는 그 사이에 파묻힌 짧은 화살표다. 가운데: 평균 보상 11을 빼면 같은 축척에서 거의 점으로 줄어든다. 오른쪽은 가운데를 10배 확대한 것으로, 행동 1의 추정치는 0이 되고 나머지 둘도 평균 가까이에 모인다. 분산 합이 약 80.9에서 0.22로 수백 배 줄어 같은 정확도의 기울기를 훨씬 적은 표본으로 얻는다."
      viewBox="0 0 720 252"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ red: colors.red, green: colors.green, violet: colors.violet }} />
      <text x={14} y={20} fontSize={11.5} fontWeight={800} fill={colors.red}>
        기준선 없음: R·∇log π
      </text>
      {axes(150, 130, S, 9, 9.4)}
      {vecs(0, 150, 130, S, colors.red, `${P}-red`, true)}
      <text x={14} y={238} fontSize={10.5} fontWeight={800} fill={ink}>
        분산 합 ≈ 80.9
      </text>
      <line x1={318} y1={14} x2={318} y2={242} stroke="var(--border-hairline)" />
      <text x={330} y={20} fontSize={11.5} fontWeight={800} fill={colors.green}>
        b = 11: (R − 11)·∇log π
      </text>
      {axes(420, 130, S, 8, 9.4)}
      {vecs(11, 420, 130, S, colors.green, `${P}-green`, false)}
      <text x={330} y={238} fontSize={10.5} fontWeight={800} fill={ink}>
        분산 합 ≈ 0.22 (같은 축척)
      </text>
      <rect x={530} y={40} width={176} height={176} rx={8} fill="none" stroke={inkMuted} strokeDasharray="4 3" />
      <text x={540} y={58} fontSize={10} fontWeight={800} fill={inkSecondary}>
        가운데를 10배 확대
      </text>
      {axes(626, 128, 100, 0.85, 0.75)}
      {vecs(11, 626, 128, 100, colors.green, `${P}-green`, false)}
      <text x={548} y={110} fontSize={9.5} fontWeight={700} fill={colors.green}>
        행동 0
      </text>
      <text x={596} y={78} fontSize={9.5} fontWeight={700} fill={colors.green}>
        행동 2
      </text>
      <text x={632} y={146} fontSize={9.5} fontWeight={700} fill={colors.green}>
        행동 1 = 0
      </text>
      <text x={540} y={206} fontSize={9.5} fontWeight={800} fill={colors.violet}>
        보라: 평균(진짜 기울기)
      </text>
    </DiagramFrame>
  );
}

export function PpoClipObjective() {
  // L = min(ρA, clip(ρ, 1 − ε, 1 + ε)A), ε = 0.2. 점은 본문 코드의 표(ρ = 0.5, 0.8, 1.0, 1.2, 1.5).
  const eps = 0.2;
  const term = (rho: number, A: number) => Math.min(rho * A, Math.min(Math.max(rho, 1 - eps), 1 + eps) * A);
  const pts = [0.5, 0.8, 1.0, 1.2, 1.5];
  const panel = (ox: number, A: number, color: string) => {
    const G = { left: ox + 50, top: 34, width: 260, height: 170 };
    const sx = linear(0, 2, G.left, G.left + G.width);
    const sy = A > 0 ? linear(0, 2, G.top + G.height, G.top) : linear(-2, 0, G.top + G.height, G.top);
    const yt = A > 0 ? [0, 0.5, 1, 1.5, 2] : [-2, -1.5, -1, -0.5, 0];
    return (
      <g>
        <text x={G.left} y={20} fontSize={11.5} fontWeight={800} fill={color}>
          {A > 0 ? "좋은 행동 (A = +1)" : "나쁜 행동 (A = −1)"}
        </text>
        <rect x={sx(1 - eps)} y={G.top} width={sx(1 + eps) - sx(1 - eps)} height={G.height} fill={inkMuted} fillOpacity={0.1} />
        <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.5, 0.8, 1, 1.2, 1.5, 2]} yTicks={yt} fmtX={(v) => String(v)} fmtY={(v) => String(v).replace("-", "−")} xLabel="확률비 ρ = π_θ / π_old" />
        <path d={linePath(sample((r) => r * A, 0, 2, 40).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={inkMuted} strokeWidth={1.4} strokeDasharray="4 3" />
        <path d={linePath(sample((r) => term(r, A), 0, 2, 400).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={color} strokeWidth={2.8} />
        {pts.map((r) => (
          <g key={r}>
            <circle cx={sx(r)} cy={sy(term(r, A))} r={4} fill={color} stroke="var(--surface-card)" strokeWidth={1.4} />
            <text x={sx(r) + (A > 0 ? -4 : -6)} y={sy(term(r, A)) + (A > 0 ? -8 : 15)} textAnchor="end" fontSize={9} fontWeight={800} fill={color} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {term(r, A).toFixed(1).replace("-", "−")}
            </text>
          </g>
        ))}
        <text x={sx(1)} y={G.top + 12} textAnchor="middle" fontSize={9} fill={inkSecondary}>
          [0.8, 1.2]
        </text>
        {A > 0 ? (
          <Lines x={sx(1.95)} y={sy(0.85)} lines={["1.2 넘게 올려도", "이득 없음 (기울기 0)"]} size={9.5} anchor="end" color={color} weight={800} gap={1.35} />
        ) : (
          <Lines x={sx(1.95)} y={sy(-0.35)} lines={["확률이 올라간 잘못은", "끝까지 벌한다 (−ρ)"]} size={9.5} anchor="end" color={color} weight={800} gap={1.35} />
        )}
        {A > 0 ? (
          <Lines x={sx(0.05)} y={sy(1.8)} lines={["회색 점선: 자르지 않은 ρA"]} size={9} anchor="start" color={inkSecondary} />
        ) : (
          <Lines x={sx(0.05)} y={sy(-1.1)} lines={["0.8 아래로 내린 공은", "인정하지 않음 (−0.8)"]} size={9.5} anchor="start" color={color} weight={800} gap={1.35} />
        )}
      </g>
    );
  };
  return (
    <DiagramFrame
      title="PPO의 클리핑: 좋은 쪽 이득은 잘라 내고, 나쁜 쪽 손해는 그대로 둔다"
      caption="ε = 0.2일 때 PPO 목적함수 항 min(ρA, clip(ρ, 0.8, 1.2)·A)를 확률비 ρ에 따라 그렸다. 점과 숫자는 본문 코드가 출력하는 표의 값이고, 회색 점선은 자르지 않은 ρA, 회색 띠는 클리핑 구간이다. 왼쪽: 이점이 양수인 행동은 확률을 1.2배까지만 올리면 이득이 끝나 그 위로는 평평하다(기울기 0). 오른쪽: 이점이 음수인 행동은 확률을 0.8배 아래로 더 내린 공은 −0.8에서 잘라 인정하지 않지만, 확률이 올라가 버린 잘못(ρ > 1)은 −ρ 그대로 끝까지 반영한다. 항상 비관적인 쪽을 골라, 한 번 모은 데이터로 여러 번 갱신해도 정책이 이전 정책에서 멀리 달아나지 않는다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      {panel(0, 1, colors.green)}
      <line x1={360} y1={14} x2={360} y2={244} stroke="var(--border-hairline)" />
      {panel(360, -1, colors.red)}
    </DiagramFrame>
  );
}

export function SpecAcceptReject() {
  // 본문 코드: p = (0.5, 0.2, 0.15, 0.1, 0.05), q = (0.3, 0.3, 0.2, 0.1, 0.1). 수락 질량 min(p, q), 잔여 (p − q)₊ = (0.2, 0, 0, 0, 0).
  // 실제 시뮬레이션 출력 빈도(2만 번): (0.496, 0.203, 0.152, 0.100, 0.049), 수락률 0.798(이론 0.8).
  const p = [0.5, 0.2, 0.15, 0.1, 0.05];
  const q = [0.3, 0.3, 0.2, 0.1, 0.1];
  const freq = [0.4961, 0.2026, 0.1519, 0.1, 0.0494];
  const G = { left: 60, top: 30, width: 420, height: 180 };
  const sy = linear(0, 0.55, G.top + G.height, G.top);
  const gx = (i: number) => G.left + 20 + i * 82;
  const alpha = p.reduce((s, v, i) => s + Math.min(v, q[i]), 0);
  return (
    <DiagramFrame
      title="투기적 디코딩의 수락-거절: 초안이 엉터리여도 출력 분포는 정확히 p"
      caption="본문 코드의 목표 분포 p(큰 모델)와 초안 분포 q다. 토큰마다 왼쪽 막대가 초안 q, 오른쪽 막대가 최종 출력의 확률이다. 초안이 x를 제안하면 확률 min(1, p/q)로 수락하므로, 수락되어 나오는 확률은 min(p, q)(초록)이다. 초안이 p보다 많이 제안한 몫(q − p, 빨간 빗금)은 거절되고, 거절되면 잔여 분포 (p − q)₊에서 다시 뽑는다. 여기서는 토큰 0만 p가 q보다 커서, 거절된 확률 0.2가 모두 토큰 0으로 간다(주황). 초록 + 주황을 쌓으면 모든 토큰에서 정확히 p(검은 테두리)가 되고, 2만 번 시뮬레이션한 빈도(점)도 p와 일치한다. 수락률은 Σ min(p, q) = 0.8이다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      <defs>
        <pattern id="sar-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={colors.red} strokeWidth="1.6" />
        </pattern>
      </defs>
      <Axes {...G} sx={linear(0, 1, G.left, G.left + G.width)} sy={sy} yTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} yLabel="확률" />
      {p.map((pv, i) => {
        const x = gx(i);
        const acc = Math.min(pv, q[i]);
        const res = Math.max(pv - q[i], 0);
        const rej = Math.max(q[i] - pv, 0);
        return (
          <g key={i}>
            <rect x={x} y={sy(q[i])} width={24} height={sy(0) - sy(q[i])} fill={colors.blue} fillOpacity={0.3} stroke={colors.blue} strokeWidth={1} />
            {rej > 0 && <rect x={x} y={sy(q[i])} width={24} height={sy(acc) - sy(q[i])} fill="url(#sar-hatch)" />}
            <rect x={x + 28} y={sy(acc)} width={24} height={sy(0) - sy(acc)} fill={colors.green} fillOpacity={0.55} />
            {res > 0 && <rect x={x + 28} y={sy(acc + res)} width={24} height={sy(acc) - sy(acc + res)} fill={colors.orange} fillOpacity={0.65} />}
            <rect x={x + 28} y={sy(pv)} width={24} height={sy(0) - sy(pv)} fill="none" stroke={ink} strokeWidth={1.6} />
            <circle cx={x + 40} cy={sy(freq[i])} r={3.2} fill={ink} />
            <text x={x + 26} y={G.top + G.height + 15} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={ink}>
              {`토큰 ${i}`}
            </text>
            <text x={x + 40} y={sy(pv) - 6} textAnchor="middle" fontSize={9} fontWeight={800} fill={ink}>
              {`p ${pv}`}
            </text>
            <text x={x + 12} y={sy(q[i]) - 6} textAnchor="middle" fontSize={9} fill={colors.blue}>
              {`q ${q[i]}`}
            </text>
          </g>
        );
      })}
      <rect x={510} y={34} width={196} height={180} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      {[
        { c: colors.blue, t: "초안 q가 제안", fill: 0.3 },
        { c: colors.green, t: "수락: min(p, q)", fill: 0.55 },
        { c: colors.red, t: "거절: q − p (빗금)", fill: 0 },
        { c: colors.orange, t: "다시 뽑기: (p − q)₊", fill: 0.65 },
      ].map((l, i) => (
        <g key={l.t}>
          <rect x={524} y={50 + i * 24} width={14} height={12} fill={l.fill ? l.c : "url(#sar-hatch)"} fillOpacity={l.fill || 1} stroke={l.c} />
          <text x={544} y={60 + i * 24} fontSize={10.5} fontWeight={700} fill={ink}>
            {l.t}
          </text>
        </g>
      ))}
      <rect x={524} y={146} width={14} height={12} fill="none" stroke={ink} strokeWidth={1.6} />
      <text x={544} y={156} fontSize={10.5} fontWeight={700} fill={ink}>
        목표 p (초록 + 주황)
      </text>
      <circle cx={531} cy={176} r={3.2} fill={ink} />
      <text x={544} y={180} fontSize={10.5} fontWeight={700} fill={ink}>
        실제 출력 빈도
      </text>
      <text x={524} y={204} fontSize={10.5} fontWeight={800} fill={colors.green}>
        {`수락률 = Σ min(p, q) = ${alpha.toFixed(1)}`}
      </text>
    </DiagramFrame>
  );
}

export function SpecTimeline() {
  // 초안 k = 4개를 쓰고 큰 모델이 한 번에 5개 위치를 검증. 예: 앞의 2개 수락, 3번째 거절 → 잔여 분포에서 1개 뽑아 이번 호출로 3토큰.
  const P = "spt";
  const big = (x: number, y: number, w: number, label: string) => <Tag x={x} y={y} w={w} h={34} lines={[label]} color={colors.violet} size={10.5} />;
  const tok = (x: number, y: number, t: string, color: string, op = 0.2) => (
    <g>
      <rect x={x} y={y} width={34} height={24} rx={4} fill={color} fillOpacity={op} stroke={color} strokeWidth={1.4} />
      <text x={x + 17} y={y + 16} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
        {t}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="초안-검증 한 바퀴: 큰 모델 한 번 호출로 여러 토큰"
      caption="위: 보통의 디코딩은 토큰 하나마다 큰 모델 전체를 한 번씩 호출한다. 호출마다 수십 GB의 가중치를 메모리에서 읽어야 해서 느리다. 아래: 투기적 디코딩은 작은 초안 모델이 토큰 4개를 빠르게 연달아 쓰고, 큰 모델은 그 5개 위치의 분포를 한 번의 순전파로 계산해 앞에서부터 수락-거절을 한다. 이 예에서는 앞의 두 토큰이 수락되고 셋째가 거절되어, 그 자리에서 잔여 분포로 한 토큰을 다시 뽑고 멈춘다. 큰 모델 한 번 호출로 3토큰을 얻었다. 넷이 모두 수락되면 마지막 위치에서 보너스 토큰까지 5토큰이다. 어떤 경우에도 최소 한 토큰은 생긴다."
      viewBox="0 0 720 248"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      <text x={20} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        보통의 디코딩: 큰 모델 3번 호출 → 3토큰
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          {big(20 + i * 150, 36, 104, "큰 모델 호출")}
          {tok(132 + i * 150, 41, `t${i + 1}`, colors.violet)}
        </g>
      ))}
      <line x1={14} x2={706} y1={92} y2={92} stroke="var(--border-hairline)" />
      <text x={20} y={114} fontSize={11.5} fontWeight={800} fill={ink}>
        투기적 디코딩: 초안 4개 → 큰 모델 1번 검증
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Tag x={20 + i * 62} y={128} w={52} h={24} lines={["초안"]} color={colors.blue} size={9.5} />
          {tok(26 + i * 62, 160, `d${i + 1}`, colors.blue)}
        </g>
      ))}
      <Arr x1={268} y1={172} x2={296} y2={172} color={inkMuted} marker={`${P}-ink`} />
      {big(300, 155, 132, "큰 모델 1번 (5개 위치)")}
      <Arr x1={436} y1={172} x2={458} y2={172} color={inkMuted} marker={`${P}-ink`} />
      {tok(462, 160, "d1 ✓", colors.green, 0.3)}
      {tok(500, 160, "d2 ✓", colors.green, 0.3)}
      {tok(538, 160, "d3 ✗", colors.red, 0.25)}
      {tok(576, 160, "새 t", colors.orange, 0.35)}
      <text x={680} y={177} textAnchor="end" fontSize={11} fontWeight={800} fill={colors.green}>
        = 3토큰
      </text>
      <Lines x={462} y={204} lines={["d3에서 처음 거절 → 잔여 분포 (p − q)₊에서", "한 토큰을 다시 뽑고 d4는 버린다"]} size={10} anchor="start" color={inkSecondary} weight={600} gap={1.45} />
      <Lines x={20} y={210} lines={["초안 모델 한 스텝은 큰 모델의 수십 분의 1 비용", "넷 다 수락되면 보너스 1개까지 5토큰"]} size={10} anchor="start" color={inkSecondary} weight={600} gap={1.45} />
    </DiagramFrame>
  );
}

export function SpecSpeedup() {
  // 호출당 기대 토큰 (1 − α^(k+1))/(1 − α), 속도 향상 = 그 값 / (kc + 1). 본문 예: α = 0.8, k = 4 → 3.36토큰, c = 0.05 → 2.8배, c = 0.2 → 1.87배.
  const tok = (a: number, k: number) => (1 - a ** (k + 1)) / (1 - a);
  const sp = (a: number, k: number, c: number) => tok(a, k) / (k * c + 1);
  const ks = Array.from({ length: 13 }, (_, i) => i);
  const L = { left: 52, top: 30, width: 280, height: 170 };
  const lx = linear(0, 12, L.left, L.left + L.width);
  const ly = linear(0, 10, L.top + L.height, L.top);
  const R = { left: 420, top: 30, width: 280, height: 170 };
  const rx = linear(0, 12, R.left, R.left + R.width);
  const ry = linear(0, 5, R.top + R.height, R.top);
  const alphas = [
    { a: 0.9, c: colors.green },
    { a: 0.8, c: colors.violet },
    { a: 0.6, c: colors.orange },
  ];
  const best = (c: number) => ks.reduce((b, k) => (sp(0.8, k, c) > sp(0.8, b, c) ? k : b), 0);
  return (
    <DiagramFrame
      title="초안 길이 k: 기대 토큰은 포화하고, 속도 향상에는 최적점이 있다"
      caption="왼쪽: 큰 모델 한 번 호출로 얻는 기대 토큰 수 (1 − α^(k+1))/(1 − α)다(각 위치의 수락이 확률 α로 독립이라고 단순화). k를 늘려도 1/(1 − α)에 포화한다. 수락률 0.8에서 초안 4개면 3.36, 8개면 4.33이다(본문 코드의 출력). 오른쪽: 초안 모델 한 스텝의 비용이 큰 모델의 c배일 때 실제 속도 향상(α = 0.8)이다. 초안 비용 kc는 k에 비례해 계속 늘므로 최적의 k가 생긴다. c = 0.05이면 k = 4에서 2.8배(본문 예제), k = 8 근처에서 최대 약 3.1배이고, 초안이 비싼 c = 0.2이면 k = 4에서 최대 약 1.87배에 그친다. 초안은 충분히 비슷하면서 아주 싸야 한다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        호출당 기대 토큰 수
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 2, 4, 6, 8, 10, 12]} yTicks={[0, 2, 4, 6, 8, 10]} xLabel="초안 길이 k" />
      {alphas.map((o) => (
        <g key={o.a}>
          <line x1={L.left} x2={L.left + L.width} y1={ly(1 / (1 - o.a))} y2={ly(1 / (1 - o.a))} stroke={o.c} strokeDasharray="3 3" strokeOpacity={0.6} />
          <path d={linePath(ks.map((k) => [lx(k), ly(tok(o.a, k))] as [number, number]))} fill="none" stroke={o.c} strokeWidth={2.2} />
          {ks.map((k) => (
            <circle key={k} cx={lx(k)} cy={ly(tok(o.a, k))} r={2.6} fill={o.c} />
          ))}
          <text x={L.left + L.width - 4} y={ly(1 / (1 - o.a)) - 5} textAnchor="end" fontSize={9.5} fontWeight={800} fill={o.c}>
            {`α = ${o.a} (상한 ${(1 / (1 - o.a)).toFixed(1)})`}
          </text>
        </g>
      ))}
      <text x={lx(4) + 4} y={ly(2.85)} fontSize={9.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        k = 4: 3.36
      </text>
      <text x={lx(8) + 4} y={ly(4.33) + 16} fontSize={9.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        k = 8: 4.33
      </text>
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        실제 속도 향상 (α = 0.8)
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 2, 4, 6, 8, 10, 12]} yTicks={[0, 1, 2, 3, 4, 5]} xLabel="초안 길이 k" />
      <line x1={R.left} x2={R.left + R.width} y1={ry(1)} y2={ry(1)} stroke={inkMuted} strokeDasharray="2 3" />
      {[
        { c: 0.05, col: colors.green },
        { c: 0.2, col: colors.red },
      ].map((o) => {
        const k = best(o.c);
        return (
          <g key={o.c}>
            <path d={linePath(ks.map((kk) => [rx(kk), ry(sp(0.8, kk, o.c))] as [number, number]))} fill="none" stroke={o.col} strokeWidth={2.2} />
            {ks.map((kk) => (
              <circle key={kk} cx={rx(kk)} cy={ry(sp(0.8, kk, o.c))} r={2.6} fill={o.col} />
            ))}
            <circle cx={rx(k)} cy={ry(sp(0.8, k, o.c))} r={5.5} fill="none" stroke={o.col} strokeWidth={1.8} />
            <text x={o.c === 0.05 ? rx(12) : rx(k) + 8} y={ry(sp(0.8, k, o.c)) - (o.c === 0.05 ? 12 : 8)} textAnchor={o.c === 0.05 ? "end" : "start"} fontSize={9.5} fontWeight={800} fill={o.col} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {`c = ${o.c}: 최대 ${sp(0.8, k, o.c).toFixed(2)}배 (k = ${k})`}
            </text>
          </g>
        );
      })}
      <text x={rx(4) - 6} y={ry(2.8) - 10} textAnchor="end" fontSize={9.5} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        k = 4: 2.8배
      </text>
    </DiagramFrame>
  );
}
