import DiagramFrame, { colors, ink, inkMuted, inkSecondary, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, mono, pow10Label } from "./chart";

export function TransformerDecoderBlock() {
  const x = 210;
  const w = 200;
  const steps = [
    { label: "토큰 임베딩 + 위치 정보", h: 36 },
    { label: "LayerNorm", h: 30 },
    { label: "Masked Multi-Head Attention", h: 40 },
    { label: "(+) 잔차 연결", h: 28 },
    { label: "LayerNorm", h: 30 },
    { label: "MLP (d → 4d → d, GELU)", h: 40 },
    { label: "(+) 잔차 연결", h: 28 },
  ];
  let y = 16;
  const positions = steps.map((s) => {
    const py = y;
    y += s.h + 10;
    return py;
  });
  return (
    <DiagramFrame
      title="GPT형 디코더 블록 (× N 층 반복)"
      viewBox="0 0 620 420"
      caption="이 블록을 N번 쌓은 뒤 LayerNorm → Linear(d→어휘크기) → softmax로 다음 토큰 확률을 얻는다."
    >
      <ArrowDefs />
      {steps.map((s, i) => (
        <g key={i}>
          <Box
            x={x}
            y={positions[i]}
            w={w}
            h={s.h}
            label={s.label}
            fill={s.label.includes("잔차") ? colors.violet : s.label.includes("Attention") ? colors.blue : s.label.includes("MLP") ? colors.aqua : card2Bg}
            labelColor={s.label.includes("잔차") || s.label.includes("Attention") || s.label.includes("MLP") ? "#fff" : ink}
            fontSize={11.5}
          />
          {i < steps.length - 1 && (
            <Arrow x1={x + w / 2} y1={positions[i] + s.h} x2={x + w / 2} y2={positions[i + 1]} />
          )}
        </g>
      ))}
      <Arrow x1={x + w / 2} y1={positions[positions.length - 1] + steps[steps.length - 1].h} x2={x + w / 2} y2={380} />
      <Box x={x} y={380} w={w} h={30} label="LayerNorm → Linear → softmax" fill={colors.orange} labelColor="#fff" fontSize={10.5} />
      <Label x={x + w + 40} y={positions[3] + 14} text="× N층" color={inkMuted} weight={700} anchor="start" />
    </DiagramFrame>
  );
}

export function TokenizerBpe() {
  const stages = [
    { label: "l o w   l o w e r   l o w e s t", note: "문자 단위 시작" },
    { label: "[lo] w   [lo] w e r   [lo] w e s t", note: "가장 빈번한 쌍 'l o' 병합" },
    { label: "[low]   [low] e r   [low] e s t", note: "'lo w' 병합" },
    { label: "[low]   [low][er]   [low][est]", note: "'e r', 'e s t' 순으로 병합" },
  ];
  return (
    <DiagramFrame
      title="BPE(Byte-Pair Encoding) 토크나이저"
      viewBox="0 0 640 260"
      caption="가장 빈번하게 붙어 나오는 문자 쌍을 반복적으로 병합해 어휘를 만든다. 어휘 크기와 시퀀스 길이는 절충 관계."
    >
      {stages.map((s, i) => (
        <g key={i}>
          <rect x={20} y={20 + i * 58} width={600} height={44} rx={8} fill="var(--surface-card-2)" stroke="var(--border-hairline)" />
          <text x={36} y={20 + i * 58 + 27} fontSize={13} fontFamily="var(--font-mono-code)" fill={ink}>
            {s.label}
          </text>
          <text x={584} y={20 + i * 58 + 27} fontSize={10.5} textAnchor="end" fill={colors.orange}>
            {s.note}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function CausalMask() {
  // 왼쪽: 마스크를 씌운 점수 행렬, 오른쪽: 행별 softmax 결과. 미래(대각선 위) 칸은 −∞ → 0이 된다.
  const tokens = ["고양이가", "생선을", "맛있게", "먹었다"];
  const scores = [
    [1.2, 0, 0, 0],
    [0.5, 0.9, 0, 0],
    [0.1, 1.0, 0.4, 0],
    [0.3, 0.6, -0.5, 0.4],
  ];
  const weights = scores.map((row, i) => {
    const e = row.slice(0, i + 1).map((s) => Math.exp(s));
    const sum = e.reduce((a, b) => a + b, 0);
    return row.map((_, j) => (j <= i ? e[j] / sum : 0));
  });
  const cell = 46;
  const grid = (ox: number, title: string, render: (i: number, j: number) => { text: string; fill: string; opacity: number; color: string }) => (
    <g>
      <text x={ox + cell * 2} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        {title}
      </text>
      {tokens.map((t, j) => (
        <text key={`c${j}`} x={ox + j * cell + cell / 2} y={48} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {t}
        </text>
      ))}
      {tokens.map((_, i) =>
        tokens.map((__, j) => {
          const c = render(i, j);
          return (
            <g key={`${i}-${j}`}>
              <rect x={ox + j * cell} y={58 + i * cell} width={cell - 3} height={cell - 3} rx={4} fill={c.fill} fillOpacity={c.opacity} stroke="var(--border-hairline)" />
              <text x={ox + j * cell + (cell - 3) / 2} y={58 + i * cell + cell / 2 + 2} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={c.color}>
                {c.text}
              </text>
            </g>
          );
        }),
      )}
    </g>
  );
  return (
    <DiagramFrame
      title="Causal mask: 대각선 위(미래)를 가린다"
      caption="행은 '보는' 토큰(Query), 열은 '참조되는' 토큰(Key)이다. 대각선 위 칸에 −∞를 넣으면 softmax 뒤 정확히 0이 되어, 각 행은 자기 자신과 앞 토큰들 사이에서만 비율을 나눠 갖는다. 그래서 첫 토큰은 자기 자신에게 100%를 준다."
      viewBox="0 0 640 260"
      minWidth={520}
    >
      <ArrowDefs />
      {tokens.map((t, i) => (
        <text key={t} x={84} y={58 + i * cell + cell / 2 + 2} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
      {grid(92, "점수 ÷ √dₖ + 마스크", (i, j) =>
        j > i
          ? { text: "−∞", fill: inkMuted, opacity: 0.18, color: inkMuted }
          : { text: scores[i][j].toFixed(1), fill: colors.blue, opacity: 0.15, color: ink },
      )}
      <Arrow x1={290} y1={150} x2={345} y2={150} />
      <text x={317} y={140} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        행별 softmax
      </text>
      {grid(360, "attention 가중치 (각 행의 합 = 1)", (i, j) =>
        j > i
          ? { text: "0", fill: inkMuted, opacity: 0.18, color: inkMuted }
          : { text: weights[i][j].toFixed(2), fill: colors.violet, opacity: 0.12 + weights[i][j] * 0.75, color: weights[i][j] > 0.5 ? "#fff" : ink },
      )}
    </DiagramFrame>
  );
}

export function GradientDecay() {
  // 야코비안 크기를 r 하나로 단순화했을 때 r^n: 1보다 조금만 작아도 소실, 조금만 커도 폭발.
  const W = 640;
  const H = 270;
  const x0 = 70;
  const x1 = 560;
  const yTop = 24;
  const yBot = 220;
  const nMax = 50;
  const logMin = -3;
  const logMax = 3;
  const sx = (n: number) => x0 + (n / nMax) * (x1 - x0);
  const sy = (v: number) => yBot - ((Math.log10(v) - logMin) / (logMax - logMin)) * (yBot - yTop);
  const series = [
    { r: 1.1, color: colors.orange, label: "r = 1.1 → 폭발" },
    { r: 1.0, color: inkSecondary, label: "r = 1.0 → 유지" },
    { r: 0.9, color: colors.blue, label: "r = 0.9 → 소실" },
  ];
  return (
    <DiagramFrame
      title="같은 수를 거듭 곱하면: 기울기 소실과 폭발"
      caption="세로축은 로그 눈금이다. 각 스텝의 야코비안 크기가 0.9면 50스텝 뒤 기울기는 약 0.005배로 줄고, 1.1이면 약 117배로 커진다. RNN은 문장 길이만큼 이 곱셈을 반복한다."
      viewBox={`0 0 ${W} ${H}`}
      minWidth={480}
    >
      <line x1={x0} y1={yBot} x2={x1} y2={yBot} stroke="var(--border-strong)" />
      <line x1={x0} y1={yTop} x2={x0} y2={yBot} stroke="var(--border-strong)" />
      {[-3, -2, -1, 0, 1, 2, 3].map((e) => (
        <g key={e}>
          <line x1={x0} y1={sy(10 ** e)} x2={x1} y2={sy(10 ** e)} stroke="var(--border-hairline)" />
          <text x={x0 - 8} y={sy(10 ** e) + 4} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
            {e === 0 ? "1" : `10${["⁻³", "⁻²", "⁻¹", "", "¹", "²", "³"][e + 3]}`}
          </text>
        </g>
      ))}
      {[0, 10, 20, 30, 40, 50].map((n) => (
        <text key={n} x={sx(n)} y={yBot + 16} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
          {n}
        </text>
      ))}
      <text x={(x0 + x1) / 2} y={yBot + 36} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        곱한 횟수 n (거슬러 올라간 시점 수)
      </text>
      {series.map((s) => {
        const pts = Array.from({ length: nMax + 1 }, (_, n) => `${sx(n).toFixed(1)},${sy(s.r ** n).toFixed(1)}`).join(" ");
        const end = s.r ** nMax;
        return (
          <g key={s.r}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} />
            <circle cx={sx(nMax)} cy={sy(end)} r={3.5} fill={s.color} />
            <text x={sx(nMax) + 8} y={sy(end) + 4} fontSize={11} fontWeight={700} fill={s.color}>
              {s.label}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function PositionalWaves() {
  // 성분마다 주파수가 다른 사인파. 한 위치에서 세로로 읽은 값들의 조합이 그 위치의 번호표가 된다.
  const W = 640;
  const H = 236;
  const x0 = 120;
  const x1 = 600;
  const pMax = 20;
  const rowH = 64;
  const amp = 22;
  const rows = [
    { theta: 1.0, label: "빠른 성분", color: colors.blue },
    { theta: 0.3, label: "중간 성분", color: colors.violet },
    { theta: 0.1, label: "느린 성분", color: colors.aqua },
  ];
  const sx = (p: number) => x0 + (p / pMax) * (x1 - x0);
  const marks = [3, 10];
  return (
    <DiagramFrame
      title="사인 위치 인코딩: 주파수가 다른 파동을 겹친 번호표"
      caption="성분마다 다른 빠르기로 도는 사인파를 쓴다. 세로선처럼 한 위치에서 값을 위아래로 읽으면 (빠른, 중간, 느린) 성분 값의 조합이 위치마다 달라져 고유한 번호표가 된다. 빠른 성분은 이웃 위치를, 느린 성분은 먼 위치를 구별한다."
      viewBox={`0 0 ${W} ${H}`}
      minWidth={480}
    >
      {rows.map((r, k) => {
        const cy = 40 + k * rowH;
        const pts = Array.from({ length: 201 }, (_, t) => {
          const p = (t / 200) * pMax;
          return `${sx(p).toFixed(1)},${(cy - amp * Math.sin(p * r.theta)).toFixed(1)}`;
        }).join(" ");
        return (
          <g key={r.label}>
            <line x1={x0} y1={cy} x2={x1} y2={cy} stroke="var(--border-hairline)" />
            <text x={x0 - 10} y={cy - 2} textAnchor="end" fontSize={11.5} fontWeight={700} fill={r.color}>
              {r.label}
            </text>
            <text x={x0 - 10} y={cy + 13} textAnchor="end" fontSize={10} fill={inkSecondary}>
              sin({r.theta} · pos)
            </text>
            <polyline points={pts} fill="none" stroke={r.color} strokeWidth={2} />
            {marks.map((p) => {
              const v = Math.sin(p * r.theta);
              return (
                <g key={p}>
                  <circle cx={sx(p)} cy={cy - amp * v} r={4} fill={r.color} />
                  <text x={sx(p) + 7} y={cy - amp * v - 6} fontSize={10.5} fontWeight={700} fill={ink}>
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      {marks.map((p) => (
        <g key={p}>
          <line x1={sx(p)} y1={14} x2={sx(p)} y2={40 + 2 * rowH + amp + 6} stroke={ink} strokeDasharray="4 4" />
          <text x={sx(p)} y={H - 10} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            pos = {p}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

// ───────────────────────── 5주차 핵심 과정: 추가 그림 ─────────────────────────

const chip = (x: number, y: number, text: string, color: string, w = 64, h = 26, tint = 0.14, size = 12) => (
  <g key={`${x}-${y}-${text}`}>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} fillOpacity={tint} stroke={color} strokeWidth={1.2} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={700} fill={ink}>
      {text}
    </text>
  </g>
);

export function TextToIds() {
  // 본문 코드 그대로: 어휘 {<unk>:0, 나는:1, 고양이:2, 를:3, 좋아한다:4, 강아지:5, 자동차:6, 샀다:7}
  const P = "tti";
  const vocab = ["<unk>", "나는", "고양이", "를", "좋아한다", "강아지", "자동차", "샀다"];
  const toks1 = ["나는", "고양이", "를", "좋아한다"];
  const toks2 = ["나는", "햄스터", "를", "좋아한다"];
  const ids1 = [1, 2, 3, 4];
  const ids2 = [1, 0, 3, 4];
  const ex = 96;
  const cw = 30;
  return (
    <DiagramFrame
      title="문장이 숫자가 되기까지: 토큰화 → 어휘 사전 → 임베딩 조회"
      caption="문장을 토큰으로 자르고(①), 어휘 사전에서 번호를 찾는다(②). 사전에 없는 '햄스터'는 0번 <unk>로 바뀌어 어떤 단어였는지 정보가 사라진다. ③ 번호 i의 임베딩은 임베딩 행렬 E(d × |V|)의 i번째 열이다. One-hot 벡터를 실제로 곱할 필요 없이 열 하나를 꺼내 오면(lookup) 되고, PyTorch의 nn.Embedding이 하는 일이 이것이다."
      viewBox="0 0 720 266"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={14} y={22} fontSize={11} fontWeight={700} fill={inkSecondary}>
        ① 토큰화
      </text>
      <text x={330} y={22} fontSize={11} fontWeight={700} fill={inkSecondary}>
        ② 어휘 사전에서 번호 찾기
      </text>
      {[toks1, toks2].map((toks, r) => (
        <g key={r}>
          {toks.map((t, i) => chip(14 + i * 72, 36 + r * 44, t, t === "햄스터" ? colors.red : colors.blue, 66))}
          <Arr x1={308} y1={49 + r * 44} x2={330} y2={49 + r * 44} color={inkSecondary} marker={`${P}-ink`} />
          {(r === 0 ? ids1 : ids2).map((id, i) => chip(338 + i * 40, 36 + r * 44, String(id), id === 0 ? colors.red : colors.violet, 34))}
        </g>
      ))}
      <text x={502} y={98} fontSize={10.5} fontWeight={700} fill={colors.red}>
        햄스터 → 0 (&lt;unk&gt;)
      </text>
      <rect x={530} y={30} width={180} height={60} rx={8} fill={card2Bg} stroke="var(--border-hairline)" />
      {vocab.map((v, i) => (
        <text key={v} x={540 + (i % 2) * 88} y={46 + Math.floor(i / 2) * 13} fontSize={9.5} fill={i === 2 ? colors.blue : inkSecondary} fontWeight={i === 2 ? 700 : 400} fontFamily={mono}>
          {`${i}: ${v}`}
        </text>
      ))}

      <line x1={14} y1={124} x2={706} y2={124} stroke="var(--border-hairline)" />
      <text x={14} y={146} fontSize={11} fontWeight={700} fill={inkSecondary}>
        ③ 임베딩 조회: E(d × |V| = 3 × 8)의 2번 열 = &apos;고양이&apos;의 벡터
      </text>
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => (
          <rect key={`${r}${c}`} x={ex + c * cw} y={164 + r * cw} width={cw} height={cw} fill={c === 2 ? colors.blue : card2Bg} fillOpacity={c === 2 ? 0.35 : 1} stroke="var(--border-strong)" strokeWidth={0.8} />
        )),
      )}
      {Array.from({ length: 8 }, (_, c) => (
        <text key={c} x={ex + c * cw + cw / 2} y={160} textAnchor="middle" fontSize={10} fill={c === 2 ? colors.blue : inkSecondary} fontWeight={c === 2 ? 700 : 400}>
          {c}
        </text>
      ))}
      <text x={ex - 10} y={214} textAnchor="end" fontSize={13} fontWeight={700} fill={ink}>
        E
      </text>
      <Arr x1={ex + 8 * cw + 10} y1={209} x2={ex + 8 * cw + 60} y2={209} color={colors.blue} marker={`${P}-ink`} width={1.8} />
      {Array.from({ length: 3 }, (_, r) => (
        <rect key={r} x={ex + 8 * cw + 70} y={164 + r * cw} width={cw} height={cw} fill={colors.blue} fillOpacity={0.35} stroke={colors.blue} />
      ))}
      <Lines x={ex + 8 * cw + 116} y={196} lines={["E · e₂ = E[:, 2]", "곱셈 대신 '열 꺼내기'", "d = 300, |V| = 50,000이면", "E에는 1,500만 개의 학습 값"]} size={10.5} anchor="start" />
    </DiagramFrame>
  );
}

export function OnehotVsEmbedding() {
  // One-hot은 서로 다른 단어끼리 코사인 유사도가 언제나 0. 학습된 임베딩(장난감 값)은 의미가 비슷한 단어끼리 크다.
  const words = ["고양이", "강아지", "자동차"];
  const emb = [
    [0.9, 0.6, 0.1],
    [0.6, 0.9, 0.2],
    [0.1, 0.1, 0.95],
  ];
  const cos = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b));
  const one = words.map((_, i) => words.map((__, j) => (i === j ? 1 : 0)));
  const dense = emb.map((a) => emb.map((b) => cos(a, b)));
  const c = 56;
  const grid = (x0: number, m: number[][], title: string, color: string, note: string) => (
    <g>
      <text x={x0 + (3 * c) / 2} y={24} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={color}>
        {title}
      </text>
      {words.map((w, j) => (
        <text key={`c${w}`} x={x0 + j * c + c / 2} y={52} textAnchor="middle" fontSize={11} fill={inkSecondary}>
          {w}
        </text>
      ))}
      {words.map((w, i) => (
        <text key={`r${w}`} x={x0 - 8} y={62 + i * c + c / 2 + 4} textAnchor="end" fontSize={11} fill={inkSecondary}>
          {w}
        </text>
      ))}
      {m.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}${j}`}>
            <rect x={x0 + j * c} y={62 + i * c} width={c - 3} height={c - 3} rx={6} fill={color} fillOpacity={0.08 + 0.6 * Math.max(0, v)} stroke="var(--border-hairline)" />
            <text x={x0 + j * c + (c - 3) / 2} y={62 + i * c + c / 2 + 3} textAnchor="middle" fontSize={13} fontWeight={700} fill={v > 0.7 ? "#fff" : ink}>
              {v.toFixed(2)}
            </text>
          </g>
        )),
      )}
      <text x={x0 + (3 * c) / 2} y={250} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        {note}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="One-hot과 임베딩: 단어끼리의 코사인 유사도 표"
      caption="왼쪽: One-hot 벡터는 서로 다른 단어끼리 내적이 항상 0이라, '고양이'가 '자동차'보다 '강아지'와 비슷하다는 정보를 담을 수 없다. 오른쪽: 의미가 비슷한 단어끼리 가까워지도록 학습된 임베딩(여기서는 장난감 3차원 값)에서는 고양이-강아지의 유사도가 높고 고양이-자동차는 낮다."
      viewBox="0 0 720 262"
      minWidth={540}
    >
      {grid(110, one, "One-hot: 다른 단어끼리 모두 0", colors.orange, "대각선 밖이 전부 0 = 유사도 정보 없음")}
      {grid(470, dense, "학습된 임베딩: 비슷한 단어끼리 크다", colors.blue, `고양이·강아지 ${dense[0][1].toFixed(2)} vs 고양이·자동차 ${dense[0][2].toFixed(2)}`)}
      <line x1={360} y1={14} x2={360} y2={250} stroke="var(--border-hairline)" />
    </DiagramFrame>
  );
}

export function SkipgramWindow() {
  // 본문 예제: "나는 고양이를 정말 좋아한다", 윈도우 크기 1 → (중심, 문맥) 쌍 6개.
  const toks = ["나는", "고양이를", "정말", "좋아한다"];
  const w = 84;
  const x0 = 110;
  return (
    <DiagramFrame
      title="Skip-gram의 학습 데이터: 창을 밀며 (중심, 문맥) 쌍을 뽑는다"
      caption="중심 단어(보라)를 한 칸씩 옮기며, 앞뒤 한 칸(윈도우 1) 안의 단어(주황)를 '맞혀야 할 문맥'으로 삼는다. 사람이 정답을 달지 않았는데도 문장 하나에서 쌍 6개가 저절로 생긴다. 말뭉치가 수십억 단어면 이런 쌍도 수십억 개다."
      viewBox="0 0 720 230"
      minWidth={540}
    >
      {toks.map((_, c) => {
        const y = 22 + c * 48;
        const ctx = [c - 1, c + 1].filter((k) => k >= 0 && k < toks.length);
        const lo = Math.max(0, c - 1);
        const hi = Math.min(toks.length - 1, c + 1);
        return (
          <g key={c}>
            <text x={14} y={y + 18} fontSize={11} fontWeight={700} fill={inkSecondary}>
              {`중심 ${c + 1}`}
            </text>
            <rect x={x0 + lo * (w + 6) - 4} y={y - 4} width={(hi - lo + 1) * (w + 6) + 2} height={34} rx={8} fill="none" stroke={colors.violet} strokeDasharray="4 3" opacity={0.6} />
            {toks.map((t, k) => chip(x0 + k * (w + 6), y, t, k === c ? colors.violet : ctx.includes(k) ? colors.orange : inkMuted, w, 26, k === c || ctx.includes(k) ? 0.18 : 0.06))}
            <text x={490} y={y + 18} fontSize={11.5} fill={ink}>
              {ctx.map((k) => `(${toks[c]}, ${toks[k]})`).join("  ")}
            </text>
          </g>
        );
      })}
      <text x={490} y={212} fontSize={11.5} fontWeight={700} fill={colors.violet}>
        모두 6쌍 = 자동으로 만든 정답
      </text>
    </DiagramFrame>
  );
}

export function RnnUnrollBptt() {
  // 본문의 숫자 하나짜리 RNN: W = 0.5, U = 0.8, x₁ = 1, x₂ = 0.5 → h₁ ≈ 0.462, h₂ ≈ 0.551.
  const P = "rub";
  const cells = [
    { t: 1, x: "x₁ = 1", h: "h₁ = 0.462" },
    { t: 2, x: "x₂ = 0.5", h: "h₂ = 0.551" },
    { t: 3, x: "x₃", h: "h₃" },
    { t: 4, x: "x₄", h: "h₄" },
  ];
  const cx = (i: number) => 120 + i * 140;
  return (
    <DiagramFrame
      title="RNN을 시간축으로 펼치기: 앞으로는 같은 W·U, 뒤로는 야코비안의 곱"
      caption="파란 화살표가 순전파다. 모든 시점이 같은 W, U로 hₜ = tanh(W·xₜ + U·hₜ₋₁)을 계산하므로, h₂ 안에는 h₁을 거쳐 x₁의 정보도 섞여 있다(앞 두 칸은 본문 예제의 실제 값). 주황 화살표가 BPTT다. 마지막 손실에서 h₁까지 기울기가 오려면 ∂hₜ/∂hₜ₋₁을 시점마다 한 번씩, 모두 세 번 곱해야 한다. 문장이 길수록 곱셈 횟수가 늘어 기울기가 사라지거나 폭발한다."
      viewBox="0 44 720 206"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, ink: inkSecondary }} />
      <Tag x={14} y={86} w={58} h={36} lines={["h₀ = 0"]} color={inkMuted} tint={0.08} size={11.5} />
      {cells.map((c, i) => (
        <g key={c.t}>
          <rect x={cx(i) - 40} y={80} width={80} height={48} rx={10} fill={colors.violet} fillOpacity={0.12} stroke={colors.violet} strokeWidth={1.5} />
          <text x={cx(i)} y={100} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
            tanh
          </text>
          <text x={cx(i)} y={117} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            같은 W, U
          </text>
          <Arr x1={cx(i)} y1={180} x2={cx(i)} y2={132} color={colors.blue} marker={`${P}-blue`} />
          <text x={cx(i)} y={196} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
            {c.x}
          </text>
          <text x={cx(i)} y={70} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.blue}>
            {c.h}
          </text>
          <Arr x1={i === 0 ? 74 : cx(i - 1) + 42} y1={104} x2={cx(i) - 44} y2={104} color={colors.blue} marker={`${P}-blue`} width={1.8} />
        </g>
      ))}
      <Arr x1={cx(3) + 42} y1={104} x2={cx(3) + 92} y2={104} color={colors.blue} marker={`${P}-blue`} width={1.8} />
      <Tag x={cx(3) + 96} y={84} w={60} h={40} lines={["손실 L"]} color={colors.red} tint={0.14} size={12} />
      {[3, 2, 1].map((i) => (
        <g key={i}>
          <ArrPath d={`M${cx(i) - 6},140 C${cx(i) - 40},170 ${cx(i - 1) + 40},170 ${cx(i - 1) + 6},140`} color={colors.orange} marker={`${P}-orange`} width={1.8} />
          <text x={(cx(i) + cx(i - 1)) / 2} y={184} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
            {`× ∂h${["", "₁", "₂", "₃", "₄"][i + 1]}/∂h${["", "₁", "₂", "₃", "₄"][i]}`}
          </text>
        </g>
      ))}
      <ArrPath d={`M${cx(3) + 120},128 C${cx(3) + 110},160 ${cx(3) + 60},160 ${cx(3) + 10},140`} color={colors.orange} marker={`${P}-orange`} width={1.8} />
      <text x={360} y={236} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.orange}>
        ∂L/∂h₁ = ∂L/∂h₄ × (∂h₄/∂h₃)(∂h₃/∂h₂)(∂h₂/∂h₁): 곱셈이 시점 수만큼 쌓인다
      </text>
    </DiagramFrame>
  );
}

export function Seq2seqBottleneck() {
  // 위: 고정 크기 문맥 벡터 c 하나. 아래: 본문 코드의 Attention(점수 [2.0, 0.5, 2.5] → 가중치 35% · 8% · 57%).
  const P = "s2b";
  const enc = ["I", "love", "cats"];
  const dec = ["나는", "고양이를", "좋아한다"];
  const ex = (i: number) => 60 + i * 86;
  const dx = (i: number) => 470 + i * 86;
  const weights = [0.348, 0.078, 0.574];
  return (
    <DiagramFrame
      title="Seq2Seq의 병목과 Attention의 해법"
      caption="위: 인코더가 원문 전체를 마지막 은닉 상태 하나(문맥 벡터 c)에 압축해 넘기므로, 문장이 길수록 앞부분 정보가 희석된다. 아래: Attention을 쓰면 디코더가 '고양이를'을 만들 차례에 인코더의 모든 상태를 다시 보고, 지금 상태와 관련된 정도(내적 → softmax)만큼 섞어 이번 스텝만의 문맥 c_t를 만든다. 비율은 본문 코드의 결과(I 35%, love 8%, cats 57%)다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, orange: colors.orange }} />
      <text x={14} y={22} fontSize={12} fontWeight={700} fill={colors.red}>
        Attention 없음: 고정 크기 c 하나에 전부 압축
      </text>
      {enc.map((t, i) => (
        <g key={t}>
          <rect x={ex(i) - 30} y={48} width={60} height={34} rx={8} fill={colors.blue} fillOpacity={0.12} stroke={colors.blue} />
          <text x={ex(i)} y={70} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            {`h${i + 1}`}
          </text>
          <text x={ex(i)} y={100} textAnchor="middle" fontSize={11} fill={inkSecondary}>
            {t}
          </text>
          {i < 2 && <Arr x1={ex(i) + 31} y1={65} x2={ex(i + 1) - 33} y2={65} color={inkSecondary} marker={`${P}-ink`} />}
        </g>
      ))}
      <Arr x1={ex(2) + 31} y1={65} x2={340} y2={65} color={colors.red} marker={`${P}-ink`} width={2} />
      <rect x={344} y={54} width={30} height={22} rx={5} fill={colors.red} fillOpacity={0.2} stroke={colors.red} strokeWidth={1.6} />
      <text x={359} y={70} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.red}>
        c
      </text>
      <Arr x1={376} y1={65} x2={438} y2={65} color={colors.red} marker={`${P}-ink`} width={2} />
      {dec.map((t, i) => (
        <g key={t}>
          <rect x={dx(i) - 34} y={48} width={68} height={34} rx={8} fill={colors.violet} fillOpacity={0.12} stroke={colors.violet} />
          <text x={dx(i)} y={70} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            {t}
          </text>
          {i < 2 && <Arr x1={dx(i) + 35} y1={65} x2={dx(i + 1) - 37} y2={65} color={inkSecondary} marker={`${P}-ink`} />}
        </g>
      ))}
      <text x={359} y={100} textAnchor="middle" fontSize={10.5} fill={colors.red}>
        병목
      </text>

      <line x1={14} y1={122} x2={706} y2={122} stroke="var(--border-hairline)" />
      <text x={14} y={146} fontSize={12} fontWeight={700} fill={colors.green}>
        Attention: 스텝마다 모든 인코더 상태를 다시 보고 섞는다
      </text>
      {enc.map((t, i) => (
        <g key={`a${t}`}>
          <rect x={ex(i) - 30} y={230} width={60} height={34} rx={8} fill={colors.blue} fillOpacity={0.12} stroke={colors.blue} />
          <text x={ex(i)} y={252} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            {`h${i + 1}`}
          </text>
          <text x={ex(i)} y={282} textAnchor="middle" fontSize={11} fill={inkSecondary}>
            {t}
          </text>
          <line x1={ex(i)} y1={228} x2={420} y2={196} stroke={colors.orange} strokeWidth={1 + weights[i] * 9} strokeOpacity={0.8} />
          <text x={ex(i) + 4 + i * 10} y={214 - i * 4} fontSize={11.5} fontWeight={700} fill={colors.orange}>
            {`${Math.round(weights[i] * 100)}%`}
          </text>
        </g>
      ))}
      <Tag x={420} y={172} w={120} h={48} lines={["c_t = Σ α·h", "이번 스텝만의 문맥"]} color={colors.orange} tint={0.14} size={11.5} />
      <Arr x1={542} y1={196} x2={576} y2={196} color={colors.orange} marker={`${P}-orange`} width={2} />
      <rect x={580} y={178} width={96} height={36} rx={8} fill={colors.violet} fillOpacity={0.18} stroke={colors.violet} strokeWidth={1.6} />
      <text x={628} y={201} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        &apos;고양이를&apos; 생성
      </text>
      <text x={628} y={234} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        다음 스텝엔 비율이 다시 바뀐다
      </text>
    </DiagramFrame>
  );
}

export function TeacherForcing() {
  // 본문 예제: 정답 "나는 고양이를 좋아한다". 스텝 3에서 모델이 '싫어한다'로 틀렸다고 하자.
  const P = "tfc";
  const x = (i: number) => 104 + i * 126;
  const rows = [
    { y: 10, title: "학습 (Teacher Forcing)", color: colors.green, inputs: ["<sos>", "나는", "고양이를", "좋아한다"], preds: ["나는", "고양이를", "싫어한다 ✗", "<eos>"], note: ["입력 = 정답 문장을", "한 칸 밀어 넣은 것", "스텝 3이 틀려도", "스텝 4 입력은 정답"] },
    { y: 152, title: "추론 (정답 없음)", color: colors.orange, inputs: ["<sos>", "나는", "고양이를", "싫어한다"], preds: ["나는", "고양이를", "싫어한다 ✗", "…어긋남"], note: ["입력 = 직전 스텝의", "자기 예측", "한 번 틀리면", "뒤가 줄줄이 어긋난다"] },
  ];
  return (
    <DiagramFrame
      title="Teacher Forcing과 노출 편향: 학습 때와 추론 때 입력이 다르다"
      caption="학습 때는 디코더의 각 스텝 입력으로 정답 문장을 한 칸 밀어 넣는다(초록). 스텝 3에서 '싫어한다'로 틀려도 스텝 4의 입력은 정답 '좋아한다'라 오차가 번지지 않고 학습이 안정적이다. 추론 때는 정답이 없어 모델 자신의 예측(주황 화살표)을 다음 입력으로 쓰므로, 학습 때 한 번도 겪지 못한 '자기 실수가 섞인 입력'을 처음 만난다. 이 불일치가 노출 편향이다."
      viewBox="0 0 720 286"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ orange: colors.orange }} />
      <line x1={14} y1={144} x2={706} y2={144} stroke="var(--border-hairline)" />
      {rows.map((r, ri) => {
        const py = r.y + 20; // 예측 칩 위쪽
        const dy = r.y + 56; // 디코더 상자 위쪽
        const iy = r.y + 98; // 입력 칩 위쪽
        return (
          <g key={r.title}>
            <text x={14} y={r.y + 10} fontSize={12} fontWeight={700} fill={r.color}>
              {r.title}
            </text>
            <text x={14} y={py + 16} fontSize={10} fill={inkSecondary}>
              예측
            </text>
            <text x={14} y={iy + 17} fontSize={10} fill={inkSecondary}>
              입력
            </text>
            {r.inputs.map((t, i) => (
              <g key={i}>
                {chip(x(i) - 46, py, r.preds[i], r.preds[i].includes("✗") || r.preds[i].includes("어긋") ? colors.red : colors.blue, 92, 24, 0.12, 11)}
                <line x1={x(i)} y1={dy} x2={x(i)} y2={py + 24} stroke={inkSecondary} strokeWidth={1.4} />
                <rect x={x(i) - 40} y={dy} width={80} height={28} rx={8} fill={colors.violet} fillOpacity={0.1} stroke={colors.violet} />
                <text x={x(i)} y={dy + 18} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
                  {`디코더 ${i + 1}`}
                </text>
                <line x1={x(i)} y1={iy} x2={x(i)} y2={dy + 28} stroke={inkSecondary} strokeWidth={1.4} />
                {chip(x(i) - 46, iy, t, ri === 1 && i === 3 ? colors.red : r.color, 92, 26, 0.16, 11.5)}
                {ri === 1 && i < 3 && (
                  <ArrPath d={`M${x(i) + 46},${py + 12} C${x(i) + 80},${py + 12} ${x(i + 1) - 80},${iy + 13} ${x(i + 1) - 48},${iy + 13}`} color={colors.orange} marker={`${P}-orange`} />
                )}
              </g>
            ))}
            <Lines x={584} y={r.y + 46} lines={r.note} size={10.5} anchor="start" color={r.color} weight={600} />
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function PathLengthParallel() {
  const P = "plp";
  const n = 6;
  const lx = (i: number) => 40 + i * 52;
  const rx = (i: number) => 400 + i * 52;
  return (
    <DiagramFrame
      title="정보가 지나는 길: RNN은 O(n) 줄, Self-Attention은 한 걸음"
      caption="왼쪽: RNN에서 1번 토큰의 정보가 6번 토큰에 닿으려면 은닉 상태를 5번 거쳐야 하고(경로 길이 O(n)), 앞 계산이 끝나야 다음을 할 수 있어 순차적으로만 처리된다. 오른쪽: Self-Attention에서는 6번 토큰이 모든 앞 토큰을 내적 한 번으로 직접 본다(경로 길이 1). 모든 쌍을 한꺼번에 행렬곱으로 계산하므로 병렬화가 쉽지만, 쌍의 수가 n²이라 문맥이 길수록 비용이 제곱으로 커진다."
      viewBox="0 0 720 178"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ red: colors.red, green: colors.green }} />
      <text x={170} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.red}>
        RNN: 한 칸씩 전달 (5단계)
      </text>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <circle cx={lx(i)} cy={110} r={17} fill={i === 0 || i === n - 1 ? colors.red : card2Bg} fillOpacity={i === 0 || i === n - 1 ? 0.2 : 1} stroke={i === 0 || i === n - 1 ? colors.red : "var(--border-strong)"} strokeWidth={1.4} />
          <text x={lx(i)} y={115} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
            {i + 1}
          </text>
          {i < n - 1 && <Arr x1={lx(i) + 18} y1={110} x2={lx(i + 1) - 20} y2={110} color={colors.red} marker={`${P}-red`} width={1.8} />}
        </g>
      ))}
      <text x={170} y={160} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        경로 길이 O(n) · 순차 처리
      </text>
      <line x1={360} y1={14} x2={360} y2={166} stroke="var(--border-hairline)" />
      <text x={540} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.green}>
        Self-Attention: 모두 직접 연결 (1단계)
      </text>
      {Array.from({ length: n - 1 }, (_, i) => {
        const a = ((-90 - i * 19) * Math.PI) / 180;
        const sx0 = rx(n - 1) + 17 * Math.cos(a);
        const sy0 = 110 + 17 * Math.sin(a);
        const ex0 = rx(i) + 8;
        const ey0 = 94;
        return <path key={i} d={`M${sx0.toFixed(1)},${sy0.toFixed(1)} Q${(sx0 + ex0) / 2},${78 - (n - 1 - i) * 11} ${ex0},${ey0}`} fill="none" stroke={colors.green} strokeWidth={1.8} markerEnd={`url(#${P}-green)`} />;
      })}
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <circle cx={rx(i)} cy={110} r={17} fill={i === n - 1 ? colors.green : card2Bg} fillOpacity={i === n - 1 ? 0.2 : 1} stroke={i === n - 1 ? colors.green : "var(--border-strong)"} strokeWidth={1.4} />
          <text x={rx(i)} y={115} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
            {i + 1}
          </text>
        </g>
      ))}
      <text x={540} y={160} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        경로 길이 1 · 병렬 계산 · 대신 n²쌍
      </text>
    </DiagramFrame>
  );
}

export function AttentionSteps() {
  // 본문 예제: Query "생선을" = [1,1,0,1], d_k = 4. 점수 [1,3,0,1] → ÷2 → softmax → Value 가중합 [1.24, 1.65].
  const toks = ["고양이가", "생선을", "맛있게", "먹었다"];
  const keys = ["[1, 0, 0, 0]", "[1, 1, 1, 1]", "[0, 0, 1, 0]", "[1, 1, 0, −1]"];
  const vals = ["[2, 0]", "[0, 3]", "[1, 1]", "[4, 0]"];
  const scores = [1, 3, 0, 1];
  const scaled = scores.map((s) => s / 2);
  const ex = scaled.map((s) => Math.exp(s));
  const sum = ex.reduce((a, b) => a + b, 0);
  const w = ex.map((e) => e / sum);
  const y = (i: number) => 76 + i * 40;
  const cols = [
    { x: 150, t: "① q · k" },
    { x: 250, t: "② ÷ √4" },
    { x: 400, t: "③ softmax (행 합 = 1)" },
    { x: 610, t: "④ 가중치 × Value" },
  ];
  return (
    <DiagramFrame
      title="Self-Attention 한 줄을 손으로: Query '생선을'의 계산"
      caption="① '생선을'의 Query [1, 1, 0, 1]을 각 토큰의 Key와 내적해 점수 [1, 3, 0, 1]을 얻는다. ② √d_k = 2로 나눈다. ③ softmax로 합이 1인 비율 18.8%·51.0%·11.4%·18.8%로 바꾼다. ④ 그 비율로 Value를 섞으면 '생선을'의 새 표현 [1.24, 1.65]가 된다. 이 계산을 모든 토큰이 동시에 하는 것이 Self-Attention이다."
      viewBox="0 0 720 270"
      minWidth={560}
    >
      <text x={14} y={24} fontSize={11.5} fontWeight={700} fill={colors.violet} fontFamily={mono}>
        Query(생선을) = [1, 1, 0, 1]
      </text>
      {cols.map((c) => (
        <text key={c.t} x={c.x} y={52} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
          {c.t}
        </text>
      ))}
      {toks.map((t, i) => (
        <g key={t}>
          <rect x={10} y={y(i) - 16} width={700} height={34} rx={6} fill={i === 1 ? colors.violet : "none"} fillOpacity={0.06} />
          <text x={16} y={y(i) - 1} fontSize={11.5} fontWeight={700} fill={ink}>
            {t}
          </text>
          <text x={16} y={y(i) + 13} fontSize={9.5} fill={inkSecondary} fontFamily={mono}>
            {`K ${keys[i]}`}
          </text>
          <text x={150} y={y(i) + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
            {scores[i]}
          </text>
          <text x={250} y={y(i) + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
            {scaled[i]}
          </text>
          <rect x={320} y={y(i) - 9} width={w[i] * 220} height={18} rx={4} fill={colors.orange} fillOpacity={0.8} />
          <text x={326 + w[i] * 220} y={y(i) + 5} fontSize={11.5} fontWeight={700} fill={colors.orange}>
            {`${(w[i] * 100).toFixed(1)}%`}
          </text>
          <text x={610} y={y(i) + 5} textAnchor="middle" fontSize={11} fill={ink} fontFamily={mono}>
            {`${w[i].toFixed(3)} × ${vals[i]}`}
          </text>
        </g>
      ))}
      <line x1={540} y1={y(3) + 22} x2={690} y2={y(3) + 22} stroke={inkSecondary} />
      <text x={610} y={y(3) + 42} textAnchor="middle" fontSize={13} fontWeight={700} fill={colors.blue} fontFamily={mono}>
        합 = [1.24, 1.65]
      </text>
      <text x={400} y={y(3) + 42} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        e^0.5 : e^1.5 : e^0 : e^0.5 = 1.65 : 4.48 : 1 : 1.65
      </text>
    </DiagramFrame>
  );
}

export function AttentionMatrixShapes() {
  // n = 4 토큰, d_k = 3, d_v = 2로 그린 softmax(QKᵀ/√d_k)V. 둘째 행('생선을')을 끝까지 따라간다.
  const c = 20;
  const grid = (x: number, y: number, r: number, k: number, color: string, label: string, sub: string, hiRow = -1, heat?: number[][], note?: string) => (
    <g>
      {Array.from({ length: r }, (_, i) =>
        Array.from({ length: k }, (_, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + j * c}
            y={y + i * c}
            width={c}
            height={c}
            fill={color}
            fillOpacity={heat ? 0.1 + heat[i][j] * 0.75 : i === hiRow ? 0.5 : 0.14}
            stroke={i === hiRow ? color : "var(--border-strong)"}
            strokeWidth={i === hiRow ? 1.6 : 0.6}
          />
        )),
      )}
      <text x={x + (k * c) / 2} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        {label}
      </text>
      <text x={x + (k * c) / 2} y={y + r * c + 15} textAnchor="middle" fontSize={10} fill={inkSecondary} fontFamily={mono}>
        {sub}
      </text>
      {note && (
        <text x={x + (k * c) / 2} y={y + r * c + 29} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {note}
        </text>
      )}
    </g>
  );
  const A = [
    [1, 0, 0, 0].map((v) => v * 0.5 + 0.1),
    [0.188, 0.51, 0.114, 0.188],
    [0.15, 0.35, 0.3, 0.2],
    [0.08, 0.6, 0.12, 0.2],
  ];
  const sym = (x: number, s: string) => (
    <text x={x} y={110} textAnchor="middle" fontSize={16} fontWeight={700} fill={inkSecondary}>
      {s}
    </text>
  );
  return (
    <DiagramFrame
      title="모든 Query를 한꺼번에: softmax(QKᵀ/√d_k)·V를 shape으로 읽기"
      caption="Q(n × d_k)와 Kᵀ(d_k × n)를 곱하면 모든 토큰 쌍의 점수표 S(n × n)가 한 번에 나온다. softmax는 행마다 따로 적용해 각 행(한 Query가 나눠 주는 관심)의 합이 1이 되게 한다. 그 비율표 A에 V(n × d_v)를 곱하면 토큰마다 새 표현 하나씩, 입력과 같은 개수의 행이 나온다. 진하게 칠한 둘째 행이 앞 그림의 '생선을' 계산이다."
      viewBox="0 40 720 176"
      minWidth={560}
    >
      {grid(20, 70, 4, 3, colors.violet, "Q", "(n, d_k)", 1)}
      {sym(96, "·")}
      {grid(110, 80, 3, 4, colors.blue, "Kᵀ", "(d_k, n)")}
      {sym(208, "=")}
      {grid(224, 70, 4, 4, colors.orange, "S = QKᵀ/√d_k", "(n, n)", 1, undefined, "모든 쌍의 점수")}
      <text x={346} y={104} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        행별
      </text>
      <text x={346} y={120} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        softmax →
      </text>
      {grid(384, 70, 4, 4, colors.orange, "A", "(n, n)", 1, A, "각 행의 합 = 1")}
      {sym(480, "·")}
      {grid(494, 70, 4, 2, colors.aqua, "V", "(n, d_v)")}
      {sym(554, "=")}
      {grid(572, 70, 4, 2, colors.green, "출력", "(n, d_v)", 1)}
      <text x={360} y={204} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        {"n개 토큰이 각자 한 행씩: 행 i = 'i번째 토큰이 모두를 둘러보고 만든 새 표현'"}
      </text>
    </DiagramFrame>
  );
}

export function SqrtDkSoftmax() {
  // 왼쪽: 무작위 q·k의 표준편차는 √d_k(2, 8, 22.6), √d_k로 나누면 1. 오른쪽: 같은 점수 8개의 softmax, 그대로 vs √512배.
  // 점수 8개는 본문 코드(rng = default_rng(0))가 실제로 뽑는 값이라, 그림의 막대가 코드 출력과 같다.
  const dks = [4, 64, 512];
  const s = [-0.8251, -0.0029, 0.3352, -0.3498, 0.3804, -0.3241, -1.3851, -0.1507];
  const sm = (v: number[]) => {
    const m = Math.max(...v);
    const e = v.map((x) => Math.exp(x - m));
    const z = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / z);
  };
  const p1 = sm(s);
  const p2 = sm(s.map((x) => x * Math.sqrt(512)));
  const L = { left: 92, top: 40, width: 220, height: 150 };
  const sx = linear(0, 30, L.left, L.left + 200);
  return (
    <DiagramFrame
      title="√d_k로 나누는 이유: 차원이 커지면 점수가 커지고 softmax가 뾰족해진다"
      caption="왼쪽: 성분이 평균 0·분산 1인 q와 k의 내적은 d_k개 항의 합이라 표준편차가 √d_k로 커진다(빨강). √d_k로 나누면 차원과 상관없이 1로 돌아온다(초록). 오른쪽: 본문 코드의 점수 8개를 그대로 쓴 softmax다. 스케일이 맞으면 0.04~0.21로 고루 나뉘지만, 같은 점수가 √512 ≈ 22.6배가 되면 가장 큰 두 칸만 남고 나머지는 0이 된다. 이렇게 원-핫에 가까워진 softmax는 기울기가 거의 0이라 학습이 멈춘다."
      viewBox="0 0 720 226"
      minWidth={560}
    >
      <text x={L.left + L.width / 2 - 20} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 내적의 표준편차
      </text>
      {dks.map((dk, i) => {
        const y0 = L.top + 10 + i * 48;
        return (
          <g key={dk}>
            <text x={L.left - 10} y={y0 + 16} textAnchor="end" fontSize={11} fontWeight={700} fill={ink}>
              {`d_k = ${dk}`}
            </text>
            <rect x={L.left} y={y0} width={sx(Math.sqrt(dk)) - L.left} height={13} rx={3} fill={colors.red} fillOpacity={0.75} />
            <text x={sx(Math.sqrt(dk)) + 5} y={y0 + 11} fontSize={10.5} fontWeight={700} fill={colors.red}>
              {`√${dk} = ${Math.sqrt(dk).toFixed(1)}`}
            </text>
            <rect x={L.left} y={y0 + 17} width={sx(1) - L.left} height={13} rx={3} fill={colors.green} fillOpacity={0.8} />
            <text x={sx(1) + 5} y={y0 + 28} fontSize={10.5} fontWeight={700} fill={colors.green}>
              ÷√d_k → 1
            </text>
          </g>
        );
      })}
      <line x1={360} y1={14} x2={360} y2={216} stroke="var(--border-hairline)" />
      <text x={540} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 같은 점수 8개의 softmax
      </text>
      {[
        { p: p1, y: 46, base: 92, label: "스케일이 맞을 때: 고루 나눈다", color: colors.blue },
        { p: p2, y: 122, base: 212, label: "√512배 커진 점수: 두 칸만 남는다", color: colors.red },
      ].map((g) => (
        <g key={g.label}>
          <text x={390} y={g.y} fontSize={11} fontWeight={700} fill={g.color}>
            {g.label}
          </text>
          <line x1={390} y1={g.base} x2={700} y2={g.base} stroke={inkMuted} />
          {g.p.map((v, k) => (
            <g key={k}>
              <rect x={396 + k * 38} y={g.base - v * 80} width={28} height={Math.max(0.5, v * 80)} rx={3} fill={g.color} fillOpacity={0.75} />
              <text x={410 + k * 38} y={g.base - 4 - v * 80} textAnchor="middle" fontSize={9.5} fill={ink}>
                {v < 0.005 ? "0" : v.toFixed(2)}
              </text>
            </g>
          ))}
        </g>
      ))}
    </DiagramFrame>
  );
}

export function MultiheadPatterns() {
  // 실제 모델의 헤드에서 관찰되는 경향을 단순화한 예시(값은 손으로 정함). 모두 causal mask가 걸려 있다.
  const toks = ["고양이가", "생선을", "맛있게", "먹었다"];
  const heads = [
    {
      title: "헤드 1: 바로 앞 단어",
      color: colors.blue,
      m: [
        [1, 0, 0, 0],
        [0.8, 0.2, 0, 0],
        [0.1, 0.75, 0.15, 0],
        [0.05, 0.1, 0.75, 0.1],
      ],
    },
    {
      title: "헤드 2: 주어 찾기",
      color: colors.violet,
      m: [
        [1, 0, 0, 0],
        [0.7, 0.3, 0, 0],
        [0.6, 0.2, 0.2, 0],
        [0.75, 0.1, 0.05, 0.1],
      ],
    },
    {
      title: "헤드 3: 목적어 찾기",
      color: colors.orange,
      m: [
        [1, 0, 0, 0],
        [0.3, 0.7, 0, 0],
        [0.15, 0.6, 0.25, 0],
        [0.1, 0.7, 0.1, 0.1],
      ],
    },
  ];
  const c = 38;
  return (
    <DiagramFrame
      title="여러 헤드는 서로 다른 관계를 본다 (예시)"
      caption="같은 문장을 세 헤드가 각자의 Wq·Wk·Wv로 본 attention 가중치다(행 = 보는 토큰, 진할수록 큰 비율, 회색은 causal mask로 가린 미래). 헤드 1은 바로 앞 단어에, 헤드 2는 주어 '고양이가'에, 헤드 3은 목적어 '생선을'에 주목한다. 실제 학습된 모델에서도 이런 역할 분담이 관찰된다. 하나의 softmax로는 이 관계들이 평균 내어져 흐려지지만, 헤드를 나누면 각자 따로 담을 수 있다. 값은 설명을 위해 정한 예시다."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      {heads.map((h, k) => {
        const x0 = 70 + k * 228;
        return (
          <g key={h.title}>
            <text x={x0 + 2 * c} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={h.color}>
              {h.title}
            </text>
            {toks.map((t, j) => (
              <text key={`c${t}`} x={x0 + j * c + c / 2} y={44} textAnchor="middle" fontSize={9} fill={inkSecondary}>
                {t}
              </text>
            ))}
            {k === 0 &&
              toks.map((t, i) => (
                <text key={`r${t}`} x={x0 - 6} y={52 + i * c + c / 2 + 3} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
                  {t}
                </text>
              ))}
            {h.m.map((row, i) =>
              row.map((v, j) => (
                <rect
                  key={`${i}${j}`}
                  x={x0 + j * c}
                  y={52 + i * c}
                  width={c - 3}
                  height={c - 3}
                  rx={4}
                  fill={j > i ? inkMuted : h.color}
                  fillOpacity={j > i ? 0.12 : 0.08 + v * 0.85}
                  stroke="var(--border-hairline)"
                />
              )),
            )}
          </g>
        );
      })}
      <text x={360} y={226} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        세 헤드의 출력을 이어 붙인(concat) 뒤 Wᴼ로 하나로 합친다
      </text>
    </DiagramFrame>
  );
}

export function PeOrderTest() {
  // 본문 코드의 실험을 그림으로: 위치 정보가 없으면 '고양이가'의 출력이 두 문장에서 같다(True), 위치 인코딩을 더하면 달라진다(False).
  const s1 = ["고양이가", "생선을", "먹었다"];
  const s2 = ["먹었다", "생선을", "고양이가"];
  const finger = (seed: number) => Array.from({ length: 6 }, (_, i) => 0.25 + 0.7 * Math.abs(Math.sin(seed * 3.1 + i * 1.7)));
  const base = finger(1);
  const pe0 = finger(2.2);
  const pe2 = finger(4.7);
  const bars = (x: number, y: number, v: number[], color: string) => (
    <g>
      {v.map((h, i) => (
        <rect key={i} x={x + i * 9} y={y - h * 30} width={7} height={h * 30} rx={1.5} fill={color} fillOpacity={0.85} />
      ))}
    </g>
  );
  const sentence = (x: number, y: number, toks: string[], hi: number, color: string) =>
    toks.map((t, i) => chip(x + i * 70, y, t, i === hi ? color : inkMuted, 64, 24, i === hi ? 0.2 : 0.06, 11));
  return (
    <DiagramFrame
      title="위치 정보가 없으면 순서를 모른다: 같은 단어, 같은 출력"
      caption="'고양이가 생선을 먹었다'와 순서를 뒤집은 '먹었다 생선을 고양이가'를 마스크 없는 attention에 넣고, 두 문장에서 '고양이가'의 출력(막대 모양)을 비교했다. 위치 인코딩이 없으면 자리가 달라도 출력이 완전히 같다(본문 코드의 True). 자리마다 다른 위치 벡터를 더하면 같은 단어라도 자리에 따라 출력이 달라진다(False). 막대는 출력 벡터를 개념적으로 나타낸 것이다."
      viewBox="0 0 720 194"
      minWidth={560}
    >
      <text x={14} y={22} fontSize={12} fontWeight={700} fill={colors.red}>
        위치 인코딩 없음
      </text>
      {sentence(14, 34, s1, 0, colors.blue)}
      {sentence(14, 74, s2, 2, colors.blue)}
      {bars(240, 60, base, colors.blue)}
      {bars(240, 100, base, colors.blue)}
      <text x={316} y={78} fontSize={20} fontWeight={700} fill={colors.red}>
        =
      </text>
      <text x={240} y={124} fontSize={10.5} fill={inkSecondary}>
        &apos;고양이가&apos;의 출력이 같다
      </text>
      <line x1={360} y1={14} x2={360} y2={130} stroke="var(--border-hairline)" />
      <line x1={14} y1={144} x2={706} y2={144} stroke="var(--border-hairline)" />
      <text x={380} y={22} fontSize={12} fontWeight={700} fill={colors.green}>
        위치 인코딩을 더하면
      </text>
      {sentence(380, 34, s1, 0, colors.violet)}
      {sentence(380, 74, s2, 2, colors.violet)}
      {bars(606, 60, pe0, colors.violet)}
      {bars(606, 100, pe2, colors.violet)}
      <text x={666} y={84} fontSize={20} fontWeight={700} fill={colors.green}>
        ≠
      </text>
      <text x={606} y={124} fontSize={10.5} fill={inkSecondary}>
        자리에 따라 달라진다
      </text>
      <Lines
        x={360}
        y={166}
        lines={["Attn(PX) = P·Attn(X): 입력 순서를 섞으면 출력의 순서만 같이 섞일 뿐 각 토큰의 출력값은 그대로다(순열 등변)", "위치 벡터를 더하면 '몇 번째 자리인가'가 토큰 표현에 들어가 이 대칭이 깨진다"]}
        size={11}
        color={inkSecondary}
      />
    </DiagramFrame>
  );
}

export function AttentionMlpRoles() {
  const P = "amr";
  const toks = ["고양이가", "생선을", "맛있게", "먹었다"];
  const x = (i: number) => 120 + i * 130;
  return (
    <DiagramFrame
      title="블록 안의 역할 분담: Attention은 토큰끼리, MLP는 토큰마다"
      caption="아래(Attention): 각 토큰이 자기 앞의 토큰들에서 필요한 정보를 가져온다. 토큰 사이에 정보가 오가는 유일한 곳이다(누구를 참고할까). 위(MLP): 같은 가중치의 작은 신경망이 토큰 하나하나를 따로 변환한다(가져온 정보로 무엇을 알아낼까). 블록 파라미터의 약 2/3가 MLP에 있다. 두 부품 모두 결과를 입력에 더하는 잔차 연결로 감싸여 있다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, orange: colors.orange, aqua: colors.aqua }} />
      {toks.map((t, i) => (
        <g key={t}>
          {chip(x(i) - 46, 256, t, inkMuted, 92, 26, 0.08, 11.5)}
          <rect x={x(i) - 40} y={150} width={80} height={30} rx={8} fill={colors.orange} fillOpacity={0.1} stroke={colors.orange} strokeOpacity={0.5} />
          <rect x={x(i) - 40} y={58} width={80} height={36} rx={8} fill={colors.aqua} fillOpacity={0.16} stroke={colors.aqua} />
          <text x={x(i)} y={81} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            MLP
          </text>
          <Arr x1={x(i)} y1={148} x2={x(i)} y2={98} color={colors.aqua} marker={`${P}-aqua`} width={1.8} />
          <Arr x1={x(i)} y1={56} x2={x(i)} y2={28} color={inkSecondary} marker={`${P}-ink`} />
          <line x1={x(i)} y1={254} x2={x(i)} y2={182} stroke={inkSecondary} strokeWidth={1.2} />
        </g>
      ))}
      {[
        [3, 0],
        [3, 1],
        [3, 2],
        [2, 0],
        [2, 1],
        [1, 0],
      ].map(([to, from]) => (
        <ArrPath key={`${to}${from}`} d={`M${x(from)},${226} C${x(from) + 20},${200} ${x(to) - 30},${200} ${x(to) - 6},${184}`} color={colors.orange} marker={`${P}-orange`} width={1.4} />
      ))}
      <text x={14} y={226} fontSize={11.5} fontWeight={700} fill={colors.orange}>
        Attention
      </text>
      <text x={14} y={242} fontSize={10} fill={inkSecondary}>
        토큰 사이 이동
      </text>
      <text x={14} y={80} fontSize={11.5} fontWeight={700} fill={colors.aqua}>
        MLP
      </text>
      <text x={14} y={96} fontSize={10} fill={inkSecondary}>
        토큰마다 따로
      </text>
      <text x={14} y={110} fontSize={10} fill={inkSecondary}>
        (같은 가중치)
      </text>
      <text x={360} y={18} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        다음 블록으로
      </text>
    </DiagramFrame>
  );
}

export function LnVsBn() {
  // BatchNorm: 특징(열) 하나에 대해 배치(행들) 방향으로 평균·분산. LayerNorm: 토큰(행) 하나에 대해 특징 방향으로.
  const c = 24;
  const rows = 6;
  const cols = 8;
  const panel = (x0: number, title: string, sub: string, color: string, mode: "col" | "row", rowLabel: string) => (
    <g>
      <text x={x0 + (cols * c) / 2} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={color}>
        {title}
      </text>
      <text x={x0 + (cols * c) / 2} y={40} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {sub}
      </text>
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          const on = mode === "col" ? j === 2 : i === 3;
          return <rect key={`${i}${j}`} x={x0 + j * c} y={54 + i * c} width={c} height={c} fill={on ? color : card2Bg} fillOpacity={on ? 0.45 : 1} stroke="var(--border-strong)" strokeWidth={0.6} />;
        }),
      )}
      <text x={x0 + (cols * c) / 2} y={54 + rows * c + 18} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        특징(d개) →
      </text>
      <text transform={`translate(${x0 - 10}, ${54 + (rows * c) / 2}) rotate(-90)`} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {rowLabel}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="BatchNorm과 LayerNorm: 평균·분산을 어느 방향으로 구하나"
      caption="BatchNorm(4주차)은 특징 하나(칠한 열)마다 배치 안의 여러 샘플에 걸쳐 평균·분산을 구하므로 배치 크기와 구성에 영향을 받는다. LayerNorm은 토큰 하나(칠한 행)의 d개 특징만으로 평균·분산을 구해 토큰마다 혼자 정규화한다. 그래서 문장 길이·배치 크기와 상관없이 같은 방식으로 동작하고, 생성할 때 토큰을 하나씩 처리해도 문제가 없다. Transformer가 LayerNorm을 쓰는 이유다."
      viewBox="0 0 720 248"
      minWidth={540}
    >
      {panel(80, "BatchNorm", "특징 하나를 배치 방향으로", colors.orange, "col", "← 배치의 샘플들")}
      {panel(440, "LayerNorm", "토큰 하나를 특징 방향으로", colors.blue, "row", "← 문장의 토큰들")}
    </DiagramFrame>
  );
}

export function BpeSegmentation() {
  // 본문 코드의 병합 규칙 8개와 그 결과(직접 실행해 확인한 값).
  const merges = ["w + e → we", "l + o → lo", "we + r → wer", "wer + </w> → wer</w>", "n + e → ne", "lo + w → low", "low + </w> → low</w>", "we + s → wes"];
  const train: [string, string[]][] = [
    ["low", ["low</w>"]],
    ["lower", ["lo", "wer</w>"]],
    ["lowest", ["lo", "wes", "t", "</w>"]],
    ["newer", ["ne", "wer</w>"]],
    ["newest", ["ne", "wes", "t", "</w>"]],
  ];
  const fresh: [string, string[]][] = [
    ["slow", ["s", "low</w>"]],
    ["slower", ["s", "lo", "wer</w>"]],
    ["west", ["wes", "t", "</w>"]],
    ["renew", ["r", "e", "ne", "w", "</w>"]],
  ];
  const tokColor = (t: string) => (t.length >= 4 ? colors.blue : t.length >= 2 ? colors.violet : colors.orange);
  const row = (x: number, y: number, word: string, toks: string[]) => {
    let cx = x + 64;
    return (
      <g key={word}>
        <text x={x} y={y + 15} fontSize={11.5} fontWeight={700} fill={ink} fontFamily={mono}>
          {word}
        </text>
        {toks.map((t, i) => {
          const w = 12 + t.length * 7.4;
          const el = (
            <g key={i}>
              <rect x={cx} y={y} width={w} height={22} rx={5} fill={tokColor(t)} fillOpacity={0.16} stroke={tokColor(t)} />
              <text x={cx + w / 2} y={y + 15} textAnchor="middle" fontSize={10.5} fill={ink} fontFamily={mono}>
                {t}
              </text>
            </g>
          );
          cx += w + 4;
          return el;
        })}
      </g>
    );
  };
  return (
    <DiagramFrame
      title="BPE가 만든 조각들: 자주 나온 조합은 크게, 드문 조합은 잘게"
      caption="왼쪽은 본문 코드가 학습한 병합 규칙 8개(순서가 중요하다)다. 가운데: 학습 말뭉치에서 두 번 나온 'low'는 통째로 한 조각이 되고, 나머지는 서로 다르게 쪼개진다. 오른쪽: 처음 보는 단어도 아는 조각의 조합으로 표현되어 <unk>가 필요 없다. 아는 조각이 거의 없는 'renew'는 글자에 가깝게 잘게 쪼개진다. 색은 조각 길이(파랑: 긴 조각, 주황: 한 글자)다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <text x={14} y={22} fontSize={12} fontWeight={700} fill={ink}>
        학습된 병합 규칙
      </text>
      {merges.map((m, i) => (
        <text key={m} x={14} y={46 + i * 22} fontSize={11} fill={inkSecondary} fontFamily={mono}>
          {`${i + 1}. ${m}`}
        </text>
      ))}
      <line x1={212} y1={14} x2={212} y2={250} stroke="var(--border-hairline)" />
      <text x={226} y={22} fontSize={12} fontWeight={700} fill={ink}>
        학습 말뭉치의 단어
      </text>
      {train.map(([w, t], i) => row(226, 34 + i * 34, w, t))}
      <line x1={468} y1={14} x2={468} y2={250} stroke="var(--border-hairline)" />
      <text x={482} y={22} fontSize={12} fontWeight={700} fill={colors.green}>
        처음 보는 단어
      </text>
      {fresh.map(([w, t], i) => row(482, 34 + i * 34, w, t))}
      <text x={482} y={196} fontSize={10.5} fill={inkSecondary}>
        바이트 수준 BPE: &apos;안&apos; → UTF-8 3바이트
      </text>
      <text x={482} y={214} fontSize={11} fontWeight={700} fill={ink} fontFamily={mono}>
        EC 95 88
      </text>
      <text x={482} y={232} fontSize={10.5} fill={inkSecondary}>
        기본 어휘 256개로 어떤 글자든 표현
      </text>
    </DiagramFrame>
  );
}

/** 아래 첨자: base + 작은 글씨 sub(아래로) + rest(원래 줄로) */
const withSub = (base: string, sub: string, rest: string, size: number) => (
  <>
    {base}
    <tspan dy={size * 0.3} fontSize={size * 0.72}>
      {sub}
    </tspan>
    <tspan dy={-size * 0.3}>{rest}</tspan>
  </>
);

export function LstmCellStep() {
  // 본문 예제: c_{t−1} = 2.0, f = 0.9, i = 0.5, c̃ = 0.4 → c_t = 0.9 × 2.0 + 0.5 × 0.4 = 2.0.
  const P = "lcs";
  const y = 70;
  const box = (x: number, w: number, color: string, content: React.ReactNode, size = 11.5) => (
    <g>
      <rect x={x} y={y - 13} width={w} height={26} rx={6} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.2} />
      <text x={x + w / 2} y={y + 4} textAnchor="middle" fontSize={size} fontWeight={700} fill={ink}>
        {content}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="셀 상태 한 스텝: 옛 기억 × f + 새 후보 × i"
      caption="본문 예제의 숫자다. 셀 상태(컨베이어 벨트)를 따라 들어온 옛 기억 2.0은 forget gate 0.9를 곱해 1.8만 남고, 새 후보 0.4는 input gate 0.5를 곱해 0.2만 더해져 새 셀 상태는 2.0이 된다. 벨트 위에서는 행렬 곱이나 비선형 함수 없이 성분별 곱셈과 덧셈만 일어난다. 아래는 극단적인 두 경우다. f = 1, i = 0이면 기억이 그대로 보존되고, f = 0, i = 1이면 과거를 지우고 새 후보로 덮어쓴다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet, orange: colors.orange, green: colors.green }} />
      <rect x={20} y={y - 16} width={560} height={32} rx={16} fill={colors.violet} fillOpacity={0.08} stroke={colors.violet} strokeOpacity={0.4} />
      <text x={30} y={y - 22} fontSize={10} fontWeight={700} fill={colors.violet}>
        셀 상태 (장기 기억의 컨베이어 벨트)
      </text>
      {box(36, 104, colors.violet, withSub("c", "t−1", " = 2.0", 11.5))}
      <Arr x1={142} y1={y} x2={206} y2={y} color={colors.violet} marker={`${P}-violet`} width={2.2} />
      <circle cx={222} cy={y} r={15} fill="var(--surface-card)" stroke={colors.orange} strokeWidth={2} />
      <text x={222} y={y + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill={colors.orange}>
        ×
      </text>
      <Arr x1={238} y1={y} x2={374} y2={y} color={colors.violet} marker={`${P}-violet`} width={2.2} />
      <text x={306} y={y - 22} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        1.8
      </text>
      <circle cx={390} cy={y} r={15} fill="var(--surface-card)" stroke={colors.green} strokeWidth={2} />
      <text x={390} y={y + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill={colors.green}>
        +
      </text>
      <Arr x1={406} y1={y} x2={468} y2={y} color={colors.violet} marker={`${P}-violet`} width={2.2} />
      <text x={437} y={y - 22} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        1.8 + 0.2
      </text>
      {box(472, 96, colors.violet, withSub("c", "t", " = 2.0", 11.5))}
      <Arr x1={222} y1={136} x2={222} y2={y + 17} color={colors.orange} marker={`${P}-orange`} width={1.8} />
      {chip(170, 138, "f = 0.9", colors.orange, 104, 26, 0.14, 11.5)}
      <text x={222} y={180} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        forget gate: 옛 기억의 90% 유지
      </text>
      <Arr x1={390} y1={136} x2={390} y2={y + 17} color={colors.green} marker={`${P}-green`} width={1.8} />
      {chip(325, 138, "i ⊙ c̃ = 0.5 × 0.4", colors.green, 130, 26, 0.14, 11)}
      <text x={390} y={180} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        input gate: 새 후보의 50%만 쓰기
      </text>
      <Arr x1={568} y1={y} x2={600} y2={y} color={colors.violet} marker={`${P}-violet`} width={2.2} />
      <Lines x={606} y={y - 4} lines={["다음 스텝으로"]} size={10} anchor="start" color={inkSecondary} />
      <text x={520} y={y + 40} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        {withSub("h", "t", " = o ⊙ tanh(c", 10)}
        <tspan dy={3} fontSize={7.2}>
          t
        </tspan>
        <tspan dy={-3}>)</tspan>
      </text>
      <line x1={20} x2={700} y1={196} y2={196} stroke="var(--border-hairline)" />
      <text x={30} y={220} fontSize={11} fontWeight={700} fill={colors.green}>
        f = 1, i = 0 → 새 c = 옛 c: 기억 보존
      </text>
      <text x={380} y={220} fontSize={11} fontWeight={700} fill={colors.red}>
        f = 0, i = 1 → 새 c = c̃: 과거를 지우고 덮어쓰기
      </text>
    </DiagramFrame>
  );
}

export function LstmRetention() {
  // 본문: 셀 상태 경로에서 한 스텝마다 대략 f가 곱해진다. 0.99⁵⁰ ≈ 0.61, RNN 쪽 0.9⁵⁰ ≈ 0.005.
  // 오른쪽은 본문 LSTM 코드(시드 0)의 실제 출력: c = [1, −1]에서 시작해 다섯 스텝.
  const G = { left: 58, top: 18, width: 300, height: 170 };
  const sx = linear(0, 50, G.left, G.left + G.width);
  const sy = log10Scale(1e-3, 1, G.top + G.height, G.top);
  const cs = [
    [1, -1],
    [1.1, -1.38],
    [1.16, -1.34],
    [1.18, -1.51],
    [1.44, -1.29],
    [1.88, -1.12],
  ];
  const G2 = { left: 446, top: 18, width: 230, height: 170 };
  const sx2 = linear(0, 5, G2.left, G2.left + G2.width);
  const sy2 = linear(-2, 2, G2.top + G2.height, G2.top);
  return (
    <DiagramFrame
      title="셀 상태 경로는 기억을 오래 남긴다"
      caption="왼쪽: 셀 상태를 따라 한 스텝 거슬러 갈 때마다 대략 forget gate 값이 곱해진다. f = 0.99를 유지하면 50스텝 뒤에도 0.99⁵⁰ ≈ 0.61이 남지만, 단순 RNN에서 매 스텝 0.9씩 줄어드는 경우는 0.9⁵⁰ ≈ 0.005로 사실상 사라진다(세로축은 로그 눈금). 오른쪽: 본문 LSTM 코드의 실제 출력이다. forget gate 편향을 3으로 잡아 f가 0.94~1.00으로 1에 가깝고, 셀에 넣어 둔 기억 [1, −1]의 부호가 다섯 스텝 내내 유지된다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 10, 20, 30, 40, 50]} yTicks={[1e-3, 1e-2, 1e-1, 1]} fmtY={pow10Label} xLabel="거슬러 올라간 스텝 수" yLabel="남는 비율" />
      <path d={linePath(sample((t) => 0.99 ** t, 0, 50, 100).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.green} strokeWidth={2.4} />
      <path d={linePath(sample((t) => 0.9 ** t, 0, 50, 100).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={2.4} />
      <circle cx={sx(50)} cy={sy(0.99 ** 50)} r={4.5} fill={colors.green} />
      <circle cx={sx(50)} cy={sy(0.9 ** 50)} r={4.5} fill={colors.red} />
      <text x={sx(50) - 6} y={sy(0.99 ** 50) - 9} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.green}>
        LSTM f = 0.99: 0.99⁵⁰ ≈ 0.61
      </text>
      <text x={sx(50) - 6} y={sy(0.9 ** 50) + 16} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.red}>
        RNN 0.9: 0.9⁵⁰ ≈ 0.005
      </text>
      <Axes {...G2} sx={sx2} sy={sy2} xTicks={[0, 1, 2, 3, 4, 5]} yTicks={[-2, -1, 0, 1, 2]} fmtY={(v) => String(v).replace("-", "−")} xLabel="스텝 t" />
      <line x1={G2.left} x2={G2.left + G2.width} y1={sy2(0)} y2={sy2(0)} stroke={inkMuted} strokeOpacity={0.6} />
      {[0, 1].map((k) => (
        <g key={k}>
          <path d={linePath(cs.map((c, t) => [sx2(t), sy2(c[k])] as [number, number]))} fill="none" stroke={k === 0 ? colors.blue : colors.orange} strokeWidth={2.2} />
          {cs.map((c, t) => (
            <circle key={t} cx={sx2(t)} cy={sy2(c[k])} r={3.4} fill={k === 0 ? colors.blue : colors.orange} />
          ))}
        </g>
      ))}
      <text x={G2.left + G2.width / 2} y={10} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        본문 코드의 셀 상태 c (두 성분)
      </text>
      <text x={sx2(0) + 6} y={sy2(1) - 10} fontSize={10} fontWeight={700} fill={colors.blue}>
        c[0]: 1 → 1.88
      </text>
      <text x={sx2(0) + 6} y={sy2(-1) - 10} fontSize={10} fontWeight={700} fill={colors.orange}>
        c[1]: −1 → −1.12
      </text>
      <text x={G2.left + G2.width / 2} y={sy2(-1.88)} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        f = 0.94 ~ 1.00 (편향 3 → 시그모이드 ≈ 0.95)
      </text>
    </DiagramFrame>
  );
}

export function GruVsLstm() {
  // LSTM: 게이트 f, i, o + 후보 c̃(4묶음), 상태 c, h. GRU: 게이트 z, r + 후보 h̃(3묶음), 상태 h. 단순 RNN은 1묶음.
  const P = "gvl";
  const unit = 42;
  return (
    <DiagramFrame
      title="LSTM과 GRU: 게이트와 상태의 수"
      caption="LSTM은 forget·input·output 게이트와 새 후보, 네 묶음의 가중치를 갖고 셀 상태 c와 은닉 상태 h를 따로 유지한다. GRU는 forget과 input을 업데이트 게이트 z 하나로 합쳐 '옛 상태를 1 − z만큼, 새 후보를 z만큼' 섞고, 리셋 게이트 r로 새 후보를 만들 때 이전 상태를 얼마나 볼지 정한다. 상태도 h 하나뿐이다. 묶음 하나가 d_h(d_x + d_h) + d_h개 파라미터라면 단순 RNN은 1묶음, GRU는 3묶음, LSTM은 4묶음이다(본문 코드의 d_x = 3, d_h = 2에서 LSTM은 48개)."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {[
        { x: 16, t: "LSTM", c: colors.violet, gates: ["f: forget", "i: input", "o: output"], cand: "후보 c̃", states: ["c_t: 장기 기억", "h_t: 출력"], n: 4 },
        { x: 250, t: "GRU", c: colors.green, gates: ["z: update", "r: reset"], cand: "후보 h̃", states: ["h_t 하나"], n: 3 },
      ].map((m) => (
        <g key={m.t}>
          <rect x={m.x} y={10} width={214} height={150} rx={10} fill={m.c} fillOpacity={0.06} stroke={m.c} strokeOpacity={0.6} />
          <text x={m.x + 107} y={30} textAnchor="middle" fontSize={13} fontWeight={800} fill={m.c}>
            {m.t}
          </text>
          <text x={m.x + 12} y={52} fontSize={10} fontWeight={700} fill={inkSecondary}>
            게이트 (σ)
          </text>
          {m.gates.map((g, i) => chip(m.x + 12 + i * 66, 58, g, m.c, 62, 22, 0.14, 9.5))}
          <text x={m.x + 12} y={100} fontSize={10} fontWeight={700} fill={inkSecondary}>
            새 후보 (tanh)
          </text>
          {chip(m.x + 100, 88, m.cand, colors.orange, 62, 22, 0.14, 9.5)}
          <text x={m.x + 12} y={132} fontSize={10} fontWeight={700} fill={inkSecondary}>
            상태
          </text>
          {m.states.map((s, i) => chip(m.x + 50 + i * 82, 120, s, colors.blue, 78, 22, 0.14, 9.5))}
        </g>
      ))}
      <text x={600} y={30} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        GRU의 섞기
      </text>
      <text x={600} y={50} textAnchor="middle" fontSize={11} fill={ink}>
        {withSub("h", "t", " = (1 − z)·h", 11)}
        <tspan dy={3.3} fontSize={7.9}>
          t−1
        </tspan>
        <tspan dy={-3.3}> + z·h̃</tspan>
      </text>
      <line x1={500} x2={700} y1={92} y2={92} stroke={inkMuted} strokeWidth={6} strokeLinecap="round" opacity={0.3} />
      <circle cx={500} cy={92} r={7} fill={colors.blue} />
      <circle cx={700} cy={92} r={7} fill={colors.orange} />
      <circle cx={500 + 0.3 * 200} cy={92} r={8} fill={colors.green} stroke="var(--surface-card)" strokeWidth={2} />
      <text x={500} y={118} textAnchor="middle" fontSize={10} fill={colors.blue}>
        {withSub("h", "t−1", " (옛 상태)", 10)}
      </text>
      <text x={700} y={118} textAnchor="end" fontSize={10} fill={colors.orange}>
        h̃ (새 후보)
      </text>
      <text x={560} y={80} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.green}>
        z = 0.3
      </text>
      <Lines x={600} y={140} lines={["z가 작으면 옛 상태 유지", "(LSTM의 f ≈ 1, i ≈ 0)"]} size={9.5} color={inkSecondary} />
      <text x={16} y={186} fontSize={11} fontWeight={800} fill={ink}>
        파라미터 묶음 수 (묶음 하나 = d_h(d_x + d_h) + d_h)
      </text>
      {[
        { t: "단순 RNN", n: 1, c: inkMuted },
        { t: "GRU", n: 3, c: colors.green },
        { t: "LSTM", n: 4, c: colors.violet },
      ].map((r, i) => (
        <g key={r.t}>
          <text x={16} y={208 + i * 20} fontSize={10.5} fontWeight={700} fill={ink}>
            {r.t}
          </text>
          {Array.from({ length: r.n }, (_, k) => (
            <rect key={k} x={86 + k * (unit + 4)} y={197 + i * 20} width={unit} height={14} rx={3} fill={r.c} fillOpacity={0.55} />
          ))}
          <text x={86 + r.n * (unit + 4) + 2} y={208 + i * 20} fontSize={10.5} fontWeight={800} fill={ink}>
            {`× ${r.n}`}
          </text>
        </g>
      ))}
      <Lines x={330} y={212} lines={["본문 코드(d_x = 3, d_h = 2)에서 묶음 하나는", "2 × (3 + 2) + 2 = 12개 → LSTM은 4 × 12 = 48개"]} size={10} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

export function KvCacheSteps() {
  // 토큰 6개를 한 개씩 생성할 때 스텝마다 계산하는 K, V. 캐시 없이: 1 + 2 + … + 6 = 21번, 캐시: 6번.
  const n = 6;
  const cs = 26;
  const grid = (x0: number, cached: boolean) => (
    <g>
      {Array.from({ length: n }, (_, t) =>
        Array.from({ length: n }, (_, j) => {
          const need = j <= t;
          const fresh = need && (!cached || j === t);
          return <rect key={`${t}-${j}`} x={x0 + j * cs} y={44 + t * cs} width={cs - 3} height={cs - 3} rx={4} fill={!need ? "none" : fresh ? colors.orange : colors.blue} fillOpacity={!need ? 0 : fresh ? 0.6 : 0.3} stroke={need ? (fresh ? colors.orange : colors.blue) : "var(--border-hairline)"} strokeDasharray={need ? undefined : "2 2"} />;
        }),
      )}
      {Array.from({ length: n }, (_, j) => (
        <text key={j} x={x0 + j * cs + (cs - 3) / 2} y={38} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {j + 1}
        </text>
      ))}
    </g>
  );
  return (
    <DiagramFrame
      title="KV 캐시: 과거 토큰의 K, V를 다시 계산하지 않는다"
      caption="행은 생성 스텝(t번째 토큰을 만드는 중), 열은 그때 attention에 필요한 토큰 1~t의 Key·Value다. 주황은 그 스텝에서 새로 계산하는 것, 파랑은 캐시에서 읽기만 하는 것이다. 캐시가 없으면 스텝마다 지금까지의 모든 토큰의 K, V를 다시 만들어 여섯 스텝에 1 + 2 + … + 6 = 21번 계산하지만, 과거 토큰의 K, V는 뒤에 무엇이 오든 바뀌지 않으므로 캐시에 저장해 두면 스텝마다 새 토큰 하나만 계산해 6번이면 된다. n개를 생성하면 n(n + 1)/2번이 n번으로 준다."
      viewBox="0 0 720 230"
      minWidth={580}
    >
      <text x={40 + (n * cs) / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.red}>
        캐시 없이
      </text>
      {grid(40, false)}
      <text x={400 + (n * cs) / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.green}>
        KV 캐시
      </text>
      {grid(400, true)}
      {Array.from({ length: n }, (_, t) => (
        <g key={t}>
          <text x={34} y={44 + t * cs + 16} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
            {`스텝 ${t + 1}`}
          </text>
          <text x={394} y={44 + t * cs + 16} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
            {`스텝 ${t + 1}`}
          </text>
          <text x={40 + n * cs + 6} y={44 + t * cs + 16} fontSize={10} fontWeight={700} fill={colors.orange}>
            {`${t + 1}번 계산`}
          </text>
          <text x={400 + n * cs + 6} y={44 + t * cs + 16} fontSize={10} fontWeight={700} fill={colors.orange}>
            1번 계산
          </text>
        </g>
      ))}
      <text x={40} y={222} fontSize={11.5} fontWeight={800} fill={colors.red}>
        합계 21번 · n개면 n(n + 1)/2
      </text>
      <text x={400} y={222} fontSize={11.5} fontWeight={800} fill={colors.green}>
        합계 6번 · n개면 n
      </text>
      <text x={640} y={60} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        열 = 토큰 위치
      </text>
      <rect x={604} y={74} width={14} height={14} rx={3} fill={colors.orange} fillOpacity={0.6} />
      <text x={624} y={85} fontSize={10} fill={ink}>
        새로 계산
      </text>
      <rect x={604} y={96} width={14} height={14} rx={3} fill={colors.blue} fillOpacity={0.3} stroke={colors.blue} />
      <text x={624} y={107} fontSize={10} fill={ink}>
        캐시에서 읽음
      </text>
    </DiagramFrame>
  );
}

export function PrefillDecode() {
  // 개념도: 프리필은 프롬프트 전체를 한 번에(병렬, 연산 위주), 디코드는 토큰 하나씩(매번 캐시 전체를 읽음, 메모리 위주).
  const P = "pfd";
  const x0 = 30;
  const pre = 150;
  const step = 34;
  const nDec = 12;
  return (
    <DiagramFrame
      title="생성의 두 단계: 프리필과 디코드"
      caption="개념도다. 프리필에서는 프롬프트 전체를 학습 때처럼 한 번에 병렬로 처리해 KV 캐시를 채운다. 계산은 많지만 GPU가 한꺼번에 처리하므로 빠르고, 이 시간이 첫 글자가 나오기까지의 대기 시간이 된다. 디코드에서는 토큰을 하나씩 만들며 캐시에 덧붙이는데, 토큰마다 계산은 적지만 매번 캐시 전체(와 가중치)를 메모리에서 읽어야 해서 메모리 속도에 묶인다. 그래서 한동안 기다린 뒤 일정한 속도로 글자가 나온다. 아래 막대는 KV 캐시가 차는 모습이다."
      viewBox="0 0 720 210"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <Arr x1={x0} y1={30} x2={700} y2={30} color={inkMuted} marker={`${P}-ink`} width={1.2} />
      <text x={700} y={22} textAnchor="end" fontSize={10} fill={inkSecondary}>
        시간 →
      </text>
      <rect x={x0} y={42} width={pre} height={40} rx={6} fill={colors.violet} fillOpacity={0.25} stroke={colors.violet} />
      <text x={x0 + pre / 2} y={60} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.violet}>
        프리필
      </text>
      <text x={x0 + pre / 2} y={75} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        프롬프트 전체를 한 번에
      </text>
      {Array.from({ length: nDec }, (_, k) => (
        <rect key={k} x={x0 + pre + 8 + k * step} y={46} width={step - 6} height={32} rx={5} fill={colors.orange} fillOpacity={0.25} stroke={colors.orange} />
      ))}
      <text x={x0 + pre + 8 + (nDec * step) / 2} y={98} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.orange}>
        디코드: 토큰 하나씩 (매번 캐시 전체를 읽는다)
      </text>
      <line x1={x0} x2={x0 + pre} y1={112} y2={112} stroke={colors.violet} strokeWidth={1.4} />
      <line x1={x0} x2={x0} y1={106} y2={118} stroke={colors.violet} strokeWidth={1.4} />
      <line x1={x0 + pre} x2={x0 + pre} y1={106} y2={118} stroke={colors.violet} strokeWidth={1.4} />
      <text x={x0 + pre / 2} y={128} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.violet}>
        첫 토큰까지 대기 (연산 위주)
      </text>
      <text x={x0 + pre + 8 + step * 1.5} y={128} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.orange}>
        토큰당 일정한 간격 (메모리 위주)
      </text>
      <text x={14} y={160} fontSize={10} fontWeight={700} fill={inkSecondary}>
        KV 캐시
      </text>
      <rect x={x0 + 40} y={150} width={630} height={16} rx={3} fill="none" stroke="var(--border-strong)" />
      <rect x={x0 + 40} y={150} width={pre} height={16} rx={3} fill={colors.violet} fillOpacity={0.45} />
      {Array.from({ length: nDec }, (_, k) => (
        <rect key={k} x={x0 + 40 + pre + k * 10} y={150} width={9} height={16} fill={colors.orange} fillOpacity={0.55} />
      ))}
      <text x={x0 + 40 + pre / 2} y={184} textAnchor="middle" fontSize={9.5} fill={colors.violet}>
        프롬프트 토큰의 K, V
      </text>
      <text x={x0 + 40 + pre + 60} y={184} textAnchor="middle" fontSize={9.5} fill={colors.orange}>
        생성한 토큰마다 1칸씩
      </text>
    </DiagramFrame>
  );
}

export function GqaSharing() {
  // 본문 예: 32층, 헤드당 128차원, 2048토큰, fp16, 배치 1. KV 헤드 32(MHA) 1.07GB, 8(GQA) 0.27GB, 1(MQA) 0.034GB.
  const schemes = [
    { t: "MHA", sub: "Query 헤드마다 K·V 헤드", kv: 8, c: colors.red },
    { t: "GQA", sub: "Query 4개가 K·V 하나를 공유", kv: 2, c: colors.green },
    { t: "MQA", sub: "모든 Query가 K·V 하나를 공유", kv: 1, c: colors.violet },
  ];
  const mem = [
    { t: "MHA (K·V 헤드 32)", v: 1.073741824, c: colors.red },
    { t: "GQA (K·V 헤드 8)", v: 0.268435456, c: colors.green },
    { t: "MQA (K·V 헤드 1)", v: 0.033554432, c: colors.violet },
  ];
  const bx = linear(0, 1.1, 0, 230);
  return (
    <DiagramFrame
      title="K·V 헤드를 나눠 쓰면 KV 캐시가 준다: MHA · GQA · MQA"
      caption="위: Query 헤드(파랑) 여덟 개가 Key·Value 헤드(주황)를 어떻게 쓰는지다. MHA는 Query마다 자기 K·V가 있고, GQA는 Query 몇 개가 K·V 하나를 함께 쓰며, MQA는 모든 Query가 K·V 하나만 쓴다. 캐시에 저장하는 것은 K·V이므로 캐시 크기는 K·V 헤드 수에 비례한다. 아래: 본문 예(32층, 헤드당 128차원, 2,048토큰, fp16, 배치 1)에서 Query 헤드 32개에 K·V 헤드가 32개면 약 1.07GB, 8개(GQA, 4 : 1)면 약 0.27GB, 1개(MQA)면 약 0.03GB다. 배치가 8이면 MHA는 8.6GB로 불어난다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      {schemes.map((s, j) => {
        const x0 = 18 + j * 236;
        const qx = (i: number) => x0 + 14 + i * 24;
        const kvW = 192 / s.kv;
        const kx = (g: number) => x0 + 14 + g * kvW + kvW / 2 - 10;
        return (
          <g key={s.t}>
            <text x={x0 + 100} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={s.c}>
              {s.t}
            </text>
            <text x={x0 + 100} y={30} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {s.sub}
            </text>
            {Array.from({ length: 8 }, (_, i) => {
              const g = Math.floor(i / (8 / s.kv));
              return <line key={`l${i}`} x1={qx(i) + 9} y1={64} x2={kx(g) + 10} y2={98} stroke={s.c} strokeOpacity={0.6} />;
            })}
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={`q${i}`} x={qx(i)} y={44} width={18} height={20} rx={3} fill={colors.blue} fillOpacity={0.45} stroke={colors.blue} />
            ))}
            {Array.from({ length: s.kv }, (_, g) => (
              <rect key={`k${g}`} x={kx(g)} y={98} width={20} height={20} rx={3} fill={colors.orange} fillOpacity={0.55} stroke={colors.orange} />
            ))}
            <text x={x0 + 4} y={58} textAnchor="end" fontSize={9} fill={colors.blue}>
              Q
            </text>
            <text x={x0 + 4} y={112} textAnchor="end" fontSize={9} fill={colors.orange}>
              K·V
            </text>
          </g>
        );
      })}
      <line x1={14} x2={706} y1={136} y2={136} stroke="var(--border-hairline)" />
      <text x={20} y={156} fontSize={11.5} fontWeight={800} fill={ink}>
        KV 캐시 크기 (본문 예, Query 헤드 32개)
      </text>
      {mem.map((m, i) => {
        const y = 168 + i * 28;
        return (
          <g key={m.t}>
            <text x={20} y={y + 14} fontSize={10.5} fontWeight={700} fill={ink}>
              {m.t}
            </text>
            <rect x={160} y={y + 2} width={Math.max(2, bx(m.v))} height={16} rx={3} fill={m.c} fillOpacity={0.6} />
            <text x={160 + Math.max(2, bx(m.v)) + 6} y={y + 14} fontSize={10.5} fontWeight={800} fill={ink}>
              {m.v < 0.1 ? `${m.v.toFixed(3)} GB` : `${m.v.toFixed(2)} GB`}
            </text>
          </g>
        );
      })}
      <Lines x={470} y={176} lines={["32층 × K·V 헤드 수 × 128차원", "× 2,048토큰 × 2(K, V) × 2바이트", "", "배치 8이면 MHA는 약 8.6GB"]} size={10.5} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

export function RopeRotation() {
  // 본문 코드: θ = 0.3, q = [1, 0.5], k = [0.8, −0.2]. 위치 m의 q를 mθ, 위치 n의 k를 nθ만큼 돌려 내적한다.
  const theta = 0.3;
  const q = [1, 0.5];
  const k = [0.8, -0.2];
  const rot = (v: number[], a: number) => [Math.cos(a) * v[0] - Math.sin(a) * v[1], Math.sin(a) * v[0] + Math.cos(a) * v[1]];
  const cases = [
    [3, 1],
    [10, 8],
    [52, 50],
    [5, 1],
  ];
  const R = 58;
  return (
    <DiagramFrame
      title="RoPE: 돌린 각도의 차이, 즉 상대 거리만 점수에 남는다"
      caption="본문 코드의 q, k(θ = 0.3)다. 위치 m의 Query를 mθ만큼, 위치 n의 Key를 nθ만큼 돌린다(파랑 = q, 주황 = k). 위치가 (3, 1), (10, 8), (52, 50)으로 전혀 달라도 거리 m − n이 2로 같으면 두 화살표 사이의 각도가 같아 내적(점수)이 0.2389로 똑같다. 둘 다 같은 만큼 더 돌린 것뿐이기 때문이다. 거리가 4인 (5, 1)에서는 사이 각도가 θ × 2만큼 더 벌어져 점수가 달라진다. 실제 RoPE는 d차원 벡터를 두 성분씩 짝지어 쌍마다 다른 θ로 이 회전을 적용한다."
      viewBox="0 0 720 232"
      minWidth={600}
    >
      {cases.map(([m, n], j) => {
        const cx = 90 + j * 178;
        const cy = 108;
        const qr = rot(q, m * theta);
        const kr = rot(k, n * theta);
        const score = qr[0] * kr[0] + qr[1] * kr[1];
        const aq = Math.atan2(qr[1], qr[0]);
        const ak = Math.atan2(kr[1], kr[0]);
        const sc = R / 1.15;
        let d = aq - ak;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        const r0 = 24;
        const arc = `M${cx + r0 * Math.cos(ak)},${cy - r0 * Math.sin(ak)} A${r0},${r0} 0 0 ${d > 0 ? 0 : 1} ${cx + r0 * Math.cos(aq)},${cy - r0 * Math.sin(aq)}`;
        const same = m - n === 2;
        return (
          <g key={j}>
            <text x={cx} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
              {`m = ${m}, n = ${n}`}
            </text>
            <text x={cx} y={35} textAnchor="middle" fontSize={10} fill={same ? colors.green : colors.red} fontWeight={700}>
              {`거리 ${m - n}`}
            </text>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border-hairline)" />
            <line x1={cx - R - 6} x2={cx + R + 6} y1={cy} y2={cy} stroke="var(--border-hairline)" />
            <line x1={cx} x2={cx} y1={cy - R - 6} y2={cy + R + 6} stroke="var(--border-hairline)" />
            <path d={arc} fill="none" stroke={same ? colors.green : colors.red} strokeWidth={2} />
            <line x1={cx} y1={cy} x2={cx + qr[0] * sc} y2={cy - qr[1] * sc} stroke={colors.blue} strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={cx + qr[0] * sc} cy={cy - qr[1] * sc} r={3.5} fill={colors.blue} />
            <line x1={cx} y1={cy} x2={cx + kr[0] * sc} y2={cy - kr[1] * sc} stroke={colors.orange} strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={cx + kr[0] * sc} cy={cy - kr[1] * sc} r={3.5} fill={colors.orange} />
            <text x={cx} y={cy + R + 26} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={same ? colors.green : colors.red}>
              {`점수 ${score.toFixed(4)}`}
            </text>
            <text x={cx} y={cy + R + 42} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {`사이 각도 ${Math.round((Math.abs(d) * 180) / Math.PI)}°`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function ParamBreakdown() {
  // 본문 count_params: GPT-2 small(d = 768, L = 12, V = 50,257, ctx = 1,024) = 124,439,808.
  // 같은 구조를 d = 4096, L = 32로 키운 경우와 비교(편향 포함, weight tying).
  const parts = (d: number, L: number, V: number, ctx: number) => {
    const attn = L * (4 * d * d + 4 * d);
    const mlp = L * (8 * d * d + 5 * d);
    const ln = L * 4 * d + 2 * d;
    const emb = V * d + ctx * d;
    return { attn, mlp, ln, emb, total: attn + mlp + ln + emb };
  };
  const rows = [
    { t: "GPT-2 small", sub: "d = 768, L = 12", p: parts(768, 12, 50257, 1024) },
    { t: "같은 구조, d = 4096 · L = 32", sub: "", p: parts(4096, 32, 50257, 1024) },
  ];
  const W = 470;
  const segs = (p: ReturnType<typeof parts>) => [
    { k: "Attention", v: p.attn, c: colors.blue },
    { k: "MLP", v: p.mlp, c: colors.orange },
    { k: "임베딩", v: p.emb, c: colors.green },
    { k: "LN", v: p.ln, c: inkMuted },
  ];
  const fmt = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${(v / 1e6).toFixed(1)}M`);
  return (
    <DiagramFrame
      title="파라미터는 어디에 있나: 블록당 12d², 그중 3분의 2가 MLP"
      caption="왼쪽: 디코더 블록 하나는 Q·K·V·출력 투영 4d²(파랑)와 MLP d → 4d → d의 8d²(주황), 합해서 약 12d²다. 오른쪽: 본문 count_params로 센 GPT-2 small은 Attention 28.3M, MLP 56.7M, 임베딩(토큰 + 위치) 39.4M으로 합계 124,439,808개다. 작은 모델에서는 임베딩이 3분의 1을 차지하지만, 같은 구조를 d = 4096, L = 32로 키우면 본체 12Ld²가 압도해 임베딩은 3% 남짓으로 줄어든다."
      viewBox="0 0 720 214"
      minWidth={600}
    >
      <text x={80} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        블록 하나 = 12 × d²
      </text>
      {Array.from({ length: 12 }, (_, i) => {
        const c = i < 4 ? colors.blue : colors.orange;
        return <rect key={i} x={16 + (i % 4) * 24} y={32 + Math.floor(i / 4) * 30} width={21} height={26} rx={3} fill={c} fillOpacity={0.5} stroke={c} />;
      })}
      {["Q", "K", "V", "O"].map((t, i) => (
        <text key={t} x={16 + i * 24 + 10.5} y={50} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
          {t}
        </text>
      ))}
      <Lines x={114} y={43} lines={["Attention", "투영 4d²"]} size={9.5} anchor="start" color={colors.blue} weight={700} gap={1.2} />
      <Lines x={114} y={73} lines={["MLP d→4d", "4d²"]} size={9.5} anchor="start" color={colors.orange} weight={700} gap={1.2} />
      <Lines x={114} y={103} lines={["MLP 4d→d", "4d²"]} size={9.5} anchor="start" color={colors.orange} weight={700} gap={1.2} />
      <line x1={186} y1={14} x2={186} y2={200} stroke="var(--border-hairline)" />
      {rows.map((r, j) => {
        const y = 30 + j * 86;
        let acc = 0;
        return (
          <g key={r.t}>
            <text x={206} y={y} fontSize={11.5} fontWeight={800} fill={ink}>
              {r.t}
              {r.sub && <tspan dx={8} fontSize={10} fontWeight={400} fill={inkSecondary}>{r.sub}</tspan>}
            </text>
            <text x={696} y={y} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
              {`합계 ${j === 0 ? r.p.total.toLocaleString("en-US") : fmt(r.p.total)}`}
            </text>
            {segs(r.p).map((sgm) => {
              const w = (sgm.v / r.p.total) * W;
              const x = 206 + acc;
              acc += w;
              return (
                <g key={sgm.k}>
                  <rect x={x} y={y + 8} width={w} height={24} fill={sgm.c} fillOpacity={0.6} />
                  {w > 60 && (
                    <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
                      {`${sgm.k} ${Math.round((sgm.v / r.p.total) * 100)}%`}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={206} y={y + 48} fontSize={9.5} fill={inkSecondary}>
              {`Attention ${fmt(r.p.attn)} · MLP ${fmt(r.p.mlp)} · 임베딩 ${fmt(r.p.emb)}`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function TrainingMemory() {
  // 본문: 7B 모델. 추론 fp16 가중치 2N = 14GB. 학습(혼합 정밀도 + Adam) 16N = 112GB = 가중치 2 + 기울기 2 + fp32 원본 4 + Adam m·v 8.
  const N = 7;
  const sx = linear(0, 170, 220, 680);
  const train = [
    { t: ["fp16", "가중치"], b: 2, c: colors.blue },
    { t: ["fp16", "기울기"], b: 2, c: colors.orange },
    { t: ["fp32 원본", "가중치"], b: 4, c: colors.violet },
    { t: ["Adam m, v", "(fp32)"], b: 8, c: colors.green },
  ];
  let acc = 0;
  return (
    <DiagramFrame
      title="7B 모델의 메모리: 추론 14GB, 학습 112GB"
      caption="파라미터 70억 개(7B) 모델이다. 추론은 fp16 가중치(파라미터당 2바이트)만 있으면 되므로 약 14GB로 24GB GPU 한 장에 들어간다. 혼합 정밀도 + Adam으로 학습하려면 파라미터마다 fp16 가중치 2, fp16 기울기 2, fp32 원본 가중치 4, Adam의 m과 v 8바이트, 합해서 16바이트가 필요해 약 112GB가 된다. 활성화 메모리를 빼고도 80GB GPU 한 장을 넘는다. '추론은 되는데 파인튜닝은 안 된다'는 말이 나오는 이유이고, LoRA와 양자화가 이 격차를 줄인다."
      viewBox="0 0 720 196"
      minWidth={600}
    >
      {[24, 80, 160].map((g) => (
        <g key={g}>
          <line x1={sx(g)} x2={sx(g)} y1={22} y2={128} stroke={inkMuted} strokeDasharray="4 3" />
          <text x={sx(g)} y={16} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {g === 160 ? "80GB × 2" : `GPU ${g}GB`}
          </text>
        </g>
      ))}
      <text x={20} y={52} fontSize={11.5} fontWeight={800} fill={ink}>
        추론
      </text>
      <text x={20} y={67} fontSize={9.5} fill={inkSecondary}>
        fp16 가중치 2바이트
      </text>
      <rect x={sx(0)} y={38} width={sx(2 * N) - sx(0)} height={28} rx={3} fill={colors.blue} fillOpacity={0.6} />
      <text x={(sx(0) + sx(2 * N)) / 2} y={57} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
        14GB
      </text>
      <text x={20} y={112} fontSize={11.5} fontWeight={800} fill={ink}>
        학습
      </text>
      <text x={20} y={127} fontSize={9.5} fill={inkSecondary}>
        혼합 정밀도 + Adam 16바이트
      </text>
      {train.map((t) => {
        const x = sx(acc);
        acc += t.b * N;
        const w = sx(acc) - x;
        return (
          <g key={t.t.join("")}>
            <rect x={x} y={98} width={w} height={28} fill={t.c} fillOpacity={0.6} stroke="var(--surface-card)" />
            <text x={x + w / 2} y={116} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={ink}>
              {`${t.b * N}GB`}
            </text>
            <Lines x={x + w / 2} y={140} lines={t.t} size={9} color={inkSecondary} gap={1.2} />
          </g>
        );
      })}
      <text x={sx(16 * N) + 6} y={117} fontSize={11} fontWeight={800} fill={ink}>
        112GB
      </text>
      <text x={20} y={186} fontSize={10} fill={inkSecondary}>
        활성화(중간 계산값) 메모리는 별도로 더 든다.
      </text>
    </DiagramFrame>
  );
}
