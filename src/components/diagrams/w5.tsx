import DiagramFrame, { colors, ink, inkMuted, inkSecondary, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

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
