import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, Lines, Tag, linear, log10Scale, linePath, mono, pow10Label } from "./chart";

export function ResNetSkip() {
  const x = 260;
  const w = 140;
  return (
    <DiagramFrame
      title="ResNet 잔차 연결(Residual Connection)"
      viewBox="0 0 560 340"
      caption="y = F(x) + x. 역전파 시 dL/dx = dL/dy · (F′(x) + 1)이며, '+1' 항이 기울기가 사라지지 않도록 지름길을 만든다."
    >
      <ArrowDefs />
      <Box x={x} y={16} w={w} h={40} label="입력 x" fill={card2Bg} />
      <Box x={x} y={90} w={w} h={40} label="Conv – BN – ReLU" fill={card2Bg} fontSize={11.5} />
      <Box x={x} y={150} w={w} h={40} label="Conv – BN" fill={card2Bg} fontSize={11.5} />
      <Box x={x} y={230} w={w} h={40} label="(+)  y = F(x) + x" fill={colors.violet} labelColor="#fff" fontSize={12} />
      <Box x={x} y={290} w={w} h={36} label="ReLU" fill={card2Bg} />

      <Arrow x1={x + w / 2} y1={56} x2={x + w / 2} y2={88} />
      <Arrow x1={x + w / 2} y1={130} x2={x + w / 2} y2={148} />
      <Arrow x1={x + w / 2} y1={190} x2={x + w / 2} y2={228} />
      <Arrow x1={x + w / 2} y1={270} x2={x + w / 2} y2={288} />

      {/* skip path */}
      <path
        d={`M ${x} 36 C 60 36, 60 250, ${x} 250`}
        fill="none"
        stroke={colors.orange}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      <Label x={100} y={150} text="skip connection" color={colors.orange} weight={700} anchor="middle" />
    </DiagramFrame>
  );
}

export function TransferLearning() {
  const blocks = ["Conv 블록 1", "Conv 블록 2", "Conv 블록 3", "FC (새 클래스 수)"];
  const y = 100;
  const w = 120;
  const gap = 20;
  return (
    <DiagramFrame
      title="전이학습: 사전학습된 백본 + 새 분류 헤드"
      viewBox="0 0 620 220"
      caption="① 특징추출: 백본을 얼리고(freeze) 마지막 층만 학습(데이터가 매우 적을 때). ② 파인튜닝: 작은 학습률로 전체(또는 상위층)까지 갱신."
    >
      <ArrowDefs />
      {blocks.map((b, i) => {
        const x = 20 + i * (w + gap);
        const isHead = i === blocks.length - 1;
        return (
          <g key={i}>
            <Box
              x={x}
              y={y}
              w={w}
              h={56}
              label={b}
              sub={isHead ? "새로 학습" : "ImageNet 사전학습"}
              fill={isHead ? colors.orange : card2Bg}
              labelColor={isHead ? "#fff" : ink}
              subColor={isHead ? "#fff" : inkSecondary}
              fontSize={11.5}
              subSize={9.5}
            />
            {!isHead && (
              <rect x={x} y={y - 14} width={w} height={8} fill={colors.blue} opacity={0.7} rx={2} />
            )}
            {i < blocks.length - 1 && <Arrow x1={x + w} y1={y + 28} x2={x + w + gap - 4} y2={y + 28} />}
          </g>
        );
      })}
      <Label x={20} y={y - 24} text="파란 막대 = freeze(특징추출 모드)" color={colors.blue} anchor="start" />
    </DiagramFrame>
  );
}

export function ConvChannels() {
  // 다채널 합성곱: 커널 하나는 입력 채널 수만큼 깊이를 갖고, 그 결과는 출력 채널 하나다. 커널 수 = 출력 채널 수.
  const layer = (x: number, y: number, w: number, h: number, depth: number, color: string, label: string, sub: string) => (
    <g>
      {Array.from({ length: depth }, (_, d) => (
        <rect key={d} x={x + d * 8} y={y - d * 8} width={w} height={h} rx={3} fill={color} fillOpacity={0.12 + d * 0.06} stroke={color} />
      ))}
      <text x={x + w / 2 + (depth - 1) * 4} y={y + h + 20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        {label}
      </text>
      <text x={x + w / 2 + (depth - 1) * 4} y={y + h + 36} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {sub}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="채널이 여러 개일 때의 합성곱"
      caption="RGB 입력처럼 채널이 3개면 커널 하나도 3×3×3 크기다. 세 채널에서 곱한 값을 모두 더해 출력의 한 칸을 만든다. 이런 커널을 64개 쓰면 출력 채널도 64개가 되고, 파라미터는 (3×3×3 + 편향 1) × 64 = 1,792개다."
      viewBox="0 0 680 230"
      minWidth={500}
    >
      <ArrowDefs />
      {layer(30, 60, 110, 110, 3, colors.blue, "입력 H × W × 3", "R · G · B 채널")}
      <text x={195} y={112} textAnchor="middle" fontSize={20} fontWeight={700} fill={ink}>
        ⊛
      </text>
      {layer(230, 90, 46, 46, 3, colors.orange, "커널 3 × 3 × 3", "× 64개")}
      <text x={232} y={52} fontSize={10.5} fill={inkSecondary}>
        커널 하나 = 입력 채널 수만큼의 깊이
      </text>
      <Arrow x1={320} y1={115} x2={380} y2={115} />
      <text x={350} y={104} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        채널 합
      </text>
      {layer(410, 50, 100, 100, 6, colors.violet, "출력 H′ × W′ × 64", "커널 하나 → 출력 채널 하나")}
    </DiagramFrame>
  );
}

// ───────────────────────── 4주차 핵심 과정: 추가 그림 ─────────────────────────

export function ConvPaddingStride() {
  // 본문 예제: 5×5 입력, 3×3 커널. (P, S) = (0, 1) → 3×3, (1, 1) → 5×5, (0, 2) → 2×2.
  const P = "cps";
  const cases = [
    { p: 0, s: 1, out: 3, title: "P = 0, S = 1", formula: "⌊(5 + 0 − 3)/1⌋ + 1 = 3", note: "가장자리만큼 줄어든다" },
    { p: 1, s: 1, out: 5, title: "P = 1, S = 1", formula: "⌊(5 + 2 − 3)/1⌋ + 1 = 5", note: "same padding: 크기 유지" },
    { p: 0, s: 2, out: 2, title: "P = 0, S = 2", formula: "⌊(5 + 0 − 3)/2⌋ + 1 = 2", note: "두 칸씩 건너뛰어 빨리 줄어든다" },
  ];
  const c = 17;
  return (
    <DiagramFrame
      title="padding과 stride가 출력 크기를 정한다: 5×5 입력, 3×3 커널"
      caption="파란 테두리가 커널의 첫 위치, 주황 점선이 한 번 이동한 위치다. padding(회색 점선 칸, 값 0)은 가장자리를 감싸 커널이 가장자리 픽셀에도 중심을 둘 수 있게 하고, stride는 커널이 한 번에 건너뛰는 칸 수다. 아래 출력 격자의 크기가 공식 ⌊(N + 2P − K)/S⌋ + 1의 결과와 같다."
      viewBox="0 0 720 312"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {cases.map((cs, i) => {
        const n = 5 + 2 * cs.p;
        const x0 = 20 + i * 238 + (238 - 20 - n * c) / 2;
        const y0 = 40;
        const outC = cs.out === 5 ? 14 : 20;
        const ox = 20 + i * 238 + (218 - cs.out * outC) / 2;
        const oy = 222;
        const cx = 20 + i * 238 + 109;
        return (
          <g key={cs.title}>
            <text x={20 + i * 238 + 109} y={24} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
              {cs.title}
            </text>
            {Array.from({ length: n }, (_, r) =>
              Array.from({ length: n }, (_, q) => {
                const pad = r < cs.p || q < cs.p || r >= n - cs.p || q >= n - cs.p;
                return (
                  <rect
                    key={`${r}-${q}`}
                    x={x0 + q * c}
                    y={y0 + r * c}
                    width={c}
                    height={c}
                    fill={pad ? "none" : card2Bg}
                    stroke={pad ? inkMuted : "var(--border-strong)"}
                    strokeDasharray={pad ? "2 2" : undefined}
                    strokeWidth={0.8}
                  />
                );
              }),
            )}
            <rect x={x0} y={y0} width={3 * c} height={3 * c} fill={colors.blue} fillOpacity={0.15} stroke={colors.blue} strokeWidth={2.2} />
            <rect x={x0 + cs.s * c} y={y0} width={3 * c} height={3 * c} fill="none" stroke={colors.orange} strokeWidth={2} strokeDasharray="5 3" />
            <text x={x0 + n * c + 6} y={y0 + c} fontSize={10} fill={colors.orange} fontWeight={700}>
              {`→ ${cs.s}칸`}
            </text>
            <text x={cx} y={y0 + n * c + 20} textAnchor="middle" fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
              {cs.formula}
            </text>
            <Arr x1={cx} y1={y0 + n * c + 28} x2={cx} y2={oy - 20} color={inkSecondary} marker={`${P}-ink`} />
            {Array.from({ length: cs.out }, (_, r) =>
              Array.from({ length: cs.out }, (_, q) => (
                <rect key={`o${r}-${q}`} x={ox + q * outC} y={oy + r * outC} width={outC} height={outC} fill={colors.violet} fillOpacity={r === 0 && q === 0 ? 0.45 : 0.15} stroke={colors.violet} strokeWidth={0.8} />
              )),
            )}
            <text x={cx} y={oy - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.violet}>
              {`출력 ${cs.out}×${cs.out}`}
            </text>
            <text x={cx} y={302} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
              {cs.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function FcVsConv() {
  // 연결 방식과 파라미터 수: 224×224×3 입력에서 64개 특징을 뽑을 때 합성곱 1,792개 vs 완전연결 9,633,856개.
  const P = "fvc";
  const c = 18;
  const n = 6;
  const gx = (x0: number) => (q: number) => x0 + q * c;
  const fx = gx(30);
  const cx = gx(400);
  const gy = (r: number) => 46 + r * c;
  const out = (x: number) => [x, 46 + (n * c) / 2] as const;
  const A = { left: 190, top: 200, width: 400, height: 54 };
  const sx = log10Scale(1000, 1e7, A.left, A.left + A.width);
  return (
    <DiagramFrame
      title="완전연결 vs 합성곱: 연결 수와 파라미터 수"
      caption="왼쪽: 완전연결(FC)층은 출력 하나가 모든 픽셀과 각각 다른 가중치로 연결된다. 오른쪽: 합성곱층의 출력 하나는 3×3 창만 보고, 같은 커널(같은 색 가중치)을 모든 위치에서 재사용한다. 그래서 224×224×3 사진에서 특징 64개를 뽑는 데 합성곱은 1,792개, 완전연결은 약 963만 개(약 5,400배)의 파라미터가 필요하다(아래 막대는 로그 눈금)."
      viewBox="0 0 720 280"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={30 + (n * c) / 2 + 90} y={26} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.red}>
        완전연결: 모든 픽셀 × 출력마다 다른 가중치
      </text>
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, q) => (
          <g key={`f${r}${q}`}>
            <rect x={fx(q)} y={gy(r)} width={c} height={c} fill={card2Bg} stroke="var(--border-strong)" strokeWidth={0.8} />
            <line x1={fx(q) + c / 2} y1={gy(r) + c / 2} x2={out(250)[0]} y2={out(250)[1]} stroke={colors.red} strokeOpacity={0.28} strokeWidth={0.8} />
          </g>
        )),
      )}
      <circle cx={250} cy={out(250)[1]} r={13} fill={colors.red} fillOpacity={0.2} stroke={colors.red} strokeWidth={1.6} />
      <text x={250} y={out(250)[1] + 28} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        출력 1개 = 연결 36개
      </text>

      <line x1={360} y1={14} x2={360} y2={176} stroke="var(--border-hairline)" />
      <text x={400 + (n * c) / 2 + 90} y={26} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.blue}>
        합성곱: 3×3 창만, 같은 커널을 공유
      </text>
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, q) => {
          const w1 = r < 3 && q < 3;
          const w2 = r >= 2 && r < 5 && q >= 3;
          const k = w1 ? (r * 3 + q) : w2 ? ((r - 2) * 3 + (q - 3)) : -1;
          const pal = [colors.blue, colors.orange, colors.aqua, colors.yellow, colors.magenta, colors.green, colors.violet, colors.red, inkSecondary];
          return <rect key={`c${r}${q}`} x={cx(q)} y={gy(r)} width={c} height={c} fill={k >= 0 ? pal[k] : card2Bg} fillOpacity={k >= 0 ? 0.55 : 1} stroke="var(--border-strong)" strokeWidth={0.8} />;
        }),
      )}
      {[
        [cx(1.5), gy(1.5), 620, 66],
        [cx(4.5), gy(3.5), 620, 112],
      ].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1 + c / 2} y1={y1 + c / 2} x2={x2} y2={y2} stroke={colors.blue} strokeWidth={1.4} />
          <circle cx={x2} cy={y2} r={11} fill={colors.blue} fillOpacity={0.2} stroke={colors.blue} strokeWidth={1.6} />
        </g>
      ))}
      <Lines x={642} y={84} lines={["같은 색 = 같은", "가중치(공유)"]} size={10.5} anchor="start" />
      <text x={510} y={168} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        출력 1개 = 연결 9개, 가중치 9개를 모든 위치에서 재사용
      </text>

      {[
        { v: 1792, label: "합성곱 3×3, 64채널: 1,792", color: colors.blue, y: 206 },
        { v: 9633856, label: "완전연결 → 64: 9,633,856", color: colors.red, y: 234 },
      ].map((b) => (
        <g key={b.label}>
          <rect x={A.left} y={b.y} width={sx(b.v) - A.left} height={20} rx={4} fill={b.color} fillOpacity={0.75} />
          <text x={sx(b.v) + 6} y={b.y + 14} fontSize={11} fontWeight={700} fill={b.color}>
            {b.label}
          </text>
        </g>
      ))}
      <text x={A.left - 10} y={226} textAnchor="end" fontSize={11} fontWeight={700} fill={ink}>
        파라미터 수
      </text>
      {[1e3, 1e4, 1e5, 1e6, 1e7].map((t) => (
        <text key={t} x={sx(t)} y={270} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {pow10Label(t)}
        </text>
      ))}
    </DiagramFrame>
  );
}

export function PoolMaxVsAvg() {
  // 본문 코드의 4×4 특징 지도 y. 왼쪽 위 블록에만 강한 반응 9가 있다.
  const y = [
    [1, 1, 2, 1],
    [1, 9, 1, 1],
    [1, 1, 1, 2],
    [1, 1, 1, 1],
  ];
  const maxP = [
    [9, 2],
    [1, 2],
  ];
  const avgP = [
    [3, 1.25],
    [1, 1.25],
  ];
  const blockColor = [
    [colors.orange, colors.blue],
    [colors.aqua, colors.violet],
  ];
  const c = 40;
  const grid = (x0: number, y0: number, m: number[][], size: number, title: string, color?: string) => (
    <g>
      <text x={x0 + (m.length * size) / 2} y={y0 - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill={color ?? ink}>
        {title}
      </text>
      {m.map((row, r) =>
        row.map((v, q) => {
          const bc = blockColor[Math.floor((r * 2) / m.length)][Math.floor((q * 2) / m.length)];
          return (
            <g key={`${r}${q}`}>
              <rect x={x0 + q * size} y={y0 + r * size} width={size} height={size} fill={bc} fillOpacity={v === 9 ? 0.5 : 0.14} stroke="var(--border-strong)" />
              <text x={x0 + q * size + size / 2} y={y0 + r * size + size / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
                {v}
              </text>
            </g>
          );
        }),
      )}
    </g>
  );
  return (
    <DiagramFrame
      title="같은 특징 지도, 다른 요약: Max Pooling과 Average Pooling"
      caption="4×4 특징 지도를 2×2 블록(같은 색)마다 하나의 값으로 줄인다. 왼쪽 위 블록에 강한 반응 9가 있을 때 Max Pooling은 9를 그대로 살려 '이 패턴이 여기 있었다'는 사실을 넘기고, Average Pooling은 (1 + 1 + 1 + 9)/4 = 3으로 희석해 '블록 전체가 얼마나 활성화됐나'를 넘긴다."
      viewBox="0 0 720 240"
      minWidth={540}
    >
      {grid(40, 50, y, c, "입력 특징 지도 4×4")}
      <text x={240} y={136} textAnchor="middle" fontSize={20} fontWeight={700} fill={inkSecondary}>
        →
      </text>
      {grid(300, 70, maxP, 52, "Max Pooling 2×2", colors.red)}
      {grid(500, 70, avgP, 52, "Average Pooling 2×2", colors.blue)}
      <text x={352} y={208} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        강한 반응 9가 그대로
      </text>
      <text x={552} y={208} textAnchor="middle" fontSize={11} fill={inkSecondary}>
        9가 3으로 희석
      </text>
    </DiagramFrame>
  );
}

export function ReceptiveField1d() {
  // 본문 예제: conv 3×3(s1) → max pool 2×2(s2) → conv 3×3(s1). 맨 위 한 칸이 입력 8칸을 본다(1차원으로 그림).
  const u = 44;
  const left = 70;
  const X = (pos: number) => left + pos * u;
  const rows = [
    { y: 228, name: "입력 픽셀", rj: "r = 1, j = 1", units: Array.from({ length: 12 }, (_, i) => ({ center: i + 0.5, hot: i <= 7 })) },
    { y: 166, name: "conv 3 (s1)", rj: "r = 3, j = 1", units: Array.from({ length: 10 }, (_, k) => ({ center: k + 1.5, hot: k <= 5 })) },
    { y: 104, name: "pool 2 (s2)", rj: "r = 4, j = 2", units: Array.from({ length: 5 }, (_, m) => ({ center: 2 * m + 2, hot: m <= 2 })) },
    { y: 42, name: "conv 3 (s1)", rj: "r = 8, j = 2", units: Array.from({ length: 3 }, (_, n) => ({ center: 2 * n + 4, hot: n === 0 })) },
  ];
  const w = 30;
  const h = 24;
  // 위층의 '뜨거운' 칸이 아래층의 어떤 칸을 보는지
  const links: [number, number, number, number][] = [];
  rows[3].units.forEach((t, n) => {
    if (!t.hot) return;
    [n, n + 1, n + 2].forEach((m) => links.push([X(t.center), rows[3].y + h, X(rows[2].units[m].center), rows[2].y]));
  });
  rows[2].units.forEach((t, m) => {
    if (!t.hot) return;
    [2 * m, 2 * m + 1].forEach((k) => links.push([X(t.center), rows[2].y + h, X(rows[1].units[k].center), rows[1].y]));
  });
  rows[1].units.forEach((t, k) => {
    if (!t.hot) return;
    [k, k + 1, k + 2].forEach((i) => links.push([X(t.center), rows[1].y + h, X(rows[0].units[i].center), rows[0].y]));
  });
  return (
    <DiagramFrame
      title="수용영역이 넓어지는 과정: conv → pool(stride 2) → conv"
      caption="맨 위 한 칸(진하게)이 아래층의 어떤 칸들을 거쳐 입력의 어디까지 보는지 따라간 것이다(가로 한 방향만 그림). 첫 conv 뒤 수용영역은 3칸, 풀링 뒤 4칸이고, 풀링이 칸 사이 간격(점프 j)을 2로 늘려 놓았기 때문에 마지막 3×3 conv는 2칸이 아니라 4칸을 더 넓혀 8칸을 본다. 본문 표의 r = 3, 4, 8과 같다."
      viewBox="0 0 720 292"
      minWidth={560}
    >
      {links.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.violet} strokeOpacity={0.4} strokeWidth={1.2} />
      ))}
      {rows.map((r) => (
        <g key={r.name + r.y}>
          <text x={14} y={r.y + 16} fontSize={11} fontWeight={700} fill={ink}>
            {r.name}
          </text>
          {r.units.map((t, i) => (
            <rect key={i} x={X(t.center) - w / 2} y={r.y} width={w} height={h} rx={5} fill={t.hot ? colors.violet : card2Bg} fillOpacity={t.hot ? (r.y === 42 ? 0.7 : 0.25) : 1} stroke={t.hot ? colors.violet : "var(--border-strong)"} />
          ))}
          <text x={X(12) + 14} y={r.y + 16} fontSize={11} fontWeight={700} fill={colors.violet} fontFamily={mono}>
            {r.rj}
          </text>
        </g>
      ))}
      <path d={`M${X(0)},${258} L${X(0)},264 L${X(8)},264 L${X(8)},258`} fill="none" stroke={colors.violet} strokeWidth={1.6} />
      <text x={X(4)} y={282} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.violet}>
        맨 위 한 칸이 보는 입력: 8칸
      </text>
    </DiagramFrame>
  );
}

export function ResidualGradientProduct() {
  // 블록마다 곱해지는 값: 잔차 없음 0.5, 잔차 있음 1 + F′ = 1.01. 50블록 뒤 0.5⁵⁰ ≈ 8.9×10⁻¹⁶, 1.01⁵⁰ ≈ 1.64.
  const A = { left: 74, top: 24, width: 470, height: 196 };
  const sx = linear(0, 50, A.left, A.left + A.width);
  const sy = log10Scale(1e-16, 100, A.top + A.height, A.top);
  const plain = Array.from({ length: 51 }, (_, n) => [sx(n), sy(0.5 ** n)] as [number, number]);
  const res = Array.from({ length: 51 }, (_, n) => [sx(n), sy(1.01 ** n)] as [number, number]);
  return (
    <DiagramFrame
      title="블록 50개를 거슬러 온 기울기: 곱셈의 차이"
      caption="잔차 연결이 없으면 블록마다 국소 미분(여기서는 0.5)이 곱해져 50블록 뒤 기울기가 약 8.9×10⁻¹⁶, 사실상 0이 된다(세로축은 로그 눈금). 잔차 연결이 있으면 블록마다 1 + F′이 곱해지므로 F′ = 0.01처럼 작아도 1.01⁵⁰ ≈ 1.64로 살아 있다. 앞쪽 층까지 학습 신호가 도착하는 이유가 이 '+1'이다."
      viewBox="0 0 720 270"
      minWidth={540}
    >
      <Axes {...A} sx={sx} sy={sy} xTicks={[0, 10, 20, 30, 40, 50]} yTicks={[1e-15, 1e-10, 1e-5, 1]} fmtY={pow10Label} xLabel="거슬러 올라간 블록 수" yLabel="앞쪽에 도착한 기울기 크기" />
      <path d={linePath(res)} fill="none" stroke={colors.green} strokeWidth={2.6} />
      <path d={linePath(plain)} fill="none" stroke={colors.red} strokeWidth={2.6} />
      <text x={sx(50) + 8} y={sy(1.64) + 4} fontSize={11.5} fontWeight={700} fill={colors.green}>
        1.01⁵⁰ ≈ 1.64
      </text>
      <text x={sx(50) + 8} y={sy(8.9e-16) + 4} fontSize={11.5} fontWeight={700} fill={colors.red}>
        0.5⁵⁰ ≈ 8.9×10⁻¹⁶
      </text>
      <text x={sx(20)} y={sy(1.01 ** 20) - 10} fontSize={11} fontWeight={700} fill={colors.green}>
        잔차 연결: 블록마다 × (1 + F′)
      </text>
      <text x={sx(14)} y={sy(0.5 ** 14) + 22} fontSize={11} fontWeight={700} fill={colors.red} stroke="var(--surface-card)" strokeWidth={4} paintOrder="stroke">
        잔차 없음: 블록마다 × F′
      </text>
    </DiagramFrame>
  );
}

export function ProjectionShortcut() {
  const P = "prs";
  return (
    <DiagramFrame
      title="모양이 바뀌는 블록의 지름길: 1×1 합성곱(stride 2)으로 맞춘다"
      caption="단계가 바뀌는 블록에서 F(x) 경로는 stride 2로 해상도를 절반(56 → 28)으로 줄이고 채널을 두 배(64 → 128)로 늘린다. 그대로는 x와 더할 수 없으므로, 지름길에 1×1 합성곱(stride 2)을 두어 x도 같은 128×28×28로 바꾼 뒤 더한다(projection shortcut). 모양이 같은 블록에서는 지름길이 아무 계산 없는 x 그대로다."
      viewBox="0 0 720 230"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet }} />
      <Tag x={14} y={86} w={110} h={52} lines={["x", "64 × 56 × 56"]} color={inkMuted} tint={0.1} size={13} />
      <Arr x1={126} y1={100} x2={164} y2={60} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={168} y={30} w={150} h={52} lines={["3×3 conv, stride 2", "→ 128 × 28 × 28"]} color={colors.blue} tint={0.12} size={11.5} />
      <Arr x1={320} y1={56} x2={346} y2={56} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={350} y={30} w={150} h={52} lines={["BN·ReLU → 3×3 conv", "→ 128 × 28 × 28"]} color={colors.blue} tint={0.12} size={11.5} />
      <text x={425} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        F(x)
      </text>
      <Arr x1={126} y1={124} x2={164} y2={162} color={colors.violet} marker={`${P}-violet`} />
      <Tag x={168} y={140} w={332} h={52} lines={["지름길: 1×1 conv, stride 2", "채널만 섞어 64 → 128, 해상도 56 → 28"]} color={colors.violet} tint={0.12} size={11.5} />
      <Arr x1={502} y1={56} x2={556} y2={100} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={502} y1={166} x2={556} y2={124} color={colors.violet} marker={`${P}-violet`} />
      <circle cx={576} cy={112} r={20} fill={card2Bg} stroke="var(--border-strong)" strokeWidth={1.6} />
      <text x={576} y={118} textAnchor="middle" fontSize={18} fontWeight={700} fill={ink}>
        +
      </text>
      <Arr x1={598} y1={112} x2={622} y2={112} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={626} y={86} w={86} h={52} lines={["y", "128×28×28"]} color={colors.green} tint={0.14} size={12} />
      <text x={360} y={222} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        덧셈 y = F(x) + 지름길(x)은 두 텐서의 모양이 같아야 한다
      </text>
    </DiagramFrame>
  );
}

export function BatchnormDropout() {
  // 본문 코드 그대로: BatchNorm 입력(배치 4 × 채널 3)과 Dropout(p = 0.5, np.random.seed(0)의 마스크 [1,1,1,1,0,1]).
  const P = "bnd";
  const raw = [
    [10, 12, 8, 14],
    [1, 3, -1, 5],
    [100, 120, 90, 130],
  ];
  const norm = raw.map((ch) => {
    const m = ch.reduce((a, b) => a + b, 0) / ch.length;
    const sd = Math.sqrt(ch.reduce((a, b) => a + (b - m) ** 2, 0) / ch.length);
    return ch.map((v) => (v - m) / sd);
  });
  const chColor = [colors.blue, colors.orange, colors.aqua];
  const bx = linear(-10, 140, 70, 370);
  const ax = linear(-2, 2, 70, 370);
  const h = [1, 2, 3, 4, 5, 6];
  const mask = [1, 1, 1, 1, 0, 1];
  return (
    <DiagramFrame
      title="BatchNorm과 Dropout을 숫자로: 위 두 코드 셀의 결과"
      caption="왼쪽: 세 채널은 값의 범위가 크게 다르지만(세 번째 채널은 90~130), 채널마다 자기 평균을 빼고 표준편차로 나누면 모두 평균 0·표준편차 1 근처의 같은 눈금에 놓인다. 그 뒤 학습되는 γ·β로 채널마다 다시 크기와 위치를 정한다. 오른쪽: Dropout(p = 0.5)은 학습 때 무작위로 뉴런을 끄고(5번) 살아남은 값을 1/(1 − p) = 2배로 키워 평균 크기를 맞춘다. 평가 때는 아무것도 끄지 않는다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={220} y={20} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        BatchNorm: 채널마다 (x − μ) / σ
      </text>
      <text x={14} y={48} fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        정규화 전
      </text>
      <line x1={70} y1={92} x2={370} y2={92} stroke={inkMuted} />
      {[0, 50, 100].map((t) => (
        <text key={t} x={bx(t)} y={106} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
      {raw.map((ch, i) =>
        ch.map((v, j) => <circle key={`r${i}${j}`} cx={bx(v)} cy={62 + i * 11} r={4.2} fill={chColor[i]} fillOpacity={0.85} />),
      )}
      <Arr x1={220} y1={116} x2={220} y2={138} color={inkSecondary} marker={`${P}-ink`} />
      <text x={14} y={160} fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        정규화 후
      </text>
      <line x1={70} y1={206} x2={370} y2={206} stroke={inkMuted} />
      {[-2, -1, 0, 1, 2].map((t) => (
        <text key={t} x={ax(t)} y={220} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {String(t).replace("-", "−")}
        </text>
      ))}
      {norm.map((ch, i) =>
        ch.map((v, j) => <circle key={`n${i}${j}`} cx={ax(v)} cy={174 + i * 11} r={4.2} fill={chColor[i]} fillOpacity={0.85} />),
      )}
      {["채널 1 (8~14)", "채널 2 (−1~5)", "채널 3 (90~130)"].map((t, i) => (
        <g key={t}>
          <rect x={70 + i * 102} y={238} width={10} height={10} rx={2} fill={chColor[i]} />
          <text x={84 + i * 102} y={247} fontSize={10} fill={ink}>
            {t}
          </text>
        </g>
      ))}

      <line x1={400} y1={14} x2={400} y2={252} stroke="var(--border-hairline)" />
      <text x={560} y={20} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        Dropout (p = 0.5): 끄고 2배로
      </text>
      {[
        { y: 44, label: "출력 h", vals: h.map(String) },
        { y: 112, label: "마스크", vals: mask.map(String) },
        { y: 180, label: "h·mask / (1 − p)", vals: h.map((v, i) => String((v * mask[i]) / 0.5)) },
      ].map((r) => (
        <g key={r.label}>
          <text x={560} y={r.y - 6} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
            {r.label}
          </text>
          {r.vals.map((v, i) => {
            const off = mask[i] === 0;
            return (
              <g key={i}>
                <rect x={428 + i * 44} y={r.y} width={38} height={32} rx={6} fill={off ? colors.red : r.y === 180 ? colors.green : colors.blue} fillOpacity={off ? 0.14 : 0.12} stroke={off ? colors.red : "var(--border-strong)"} />
                <text x={447 + i * 44} y={r.y + 21} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink} fontFamily={mono}>
                  {v}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      <line x1={428 + 4 * 44} y1={44} x2={428 + 4 * 44 + 38} y2={76} stroke={colors.red} strokeWidth={1.6} />
      <line x1={428 + 4 * 44 + 38} y1={44} x2={428 + 4 * 44} y2={76} stroke={colors.red} strokeWidth={1.6} />
      <text x={560} y={236} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        학습: model.train() · 평가: model.eval()이면 모두 켜고 그대로
      </text>
    </DiagramFrame>
  );
}

export function AugmentationLabel() {
  // "이 변환을 해도 사람이 같은 라벨을 붙이는가?" — 라벨을 보존하는 증강과 라벨을 바꾸는 증강.
  // 자동차는 (0, 0)~(96, 55) 좌표로 그리고, 0.8배로 줄여 놓는다. flip이면 좌우 반전.
  const car = (x: number, y: number, flip: boolean) => (
    <g transform={`translate(${x} ${y}) scale(0.8)${flip ? " translate(96 0) scale(-1 1)" : ""}`}>
      <path d="M0,30 L8,30 L22,12 L60,12 L78,28 L96,32 L96,46 L0,46 Z" fill={colors.blue} fillOpacity={0.75} />
      <path d="M28,16 L44,16 L44,28 L20,28 Z" fill="var(--surface-card)" />
      <path d="M48,16 L58,16 L70,28 L48,28 Z" fill="var(--surface-card)" />
      <circle cx={22} cy={47} r={8} fill={ink} />
      <circle cx={74} cy={47} r={8} fill={ink} />
      <circle cx={94} cy={36} r={2.5} fill={colors.yellow} />
    </g>
  );
  const sign = (cx: number, cy: number, flip: boolean) => (
    <g transform={flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      <circle cx={cx} cy={cy} r={30} fill={colors.blue} />
      <path d={`M${cx + 6},${cy + 18} L${cx + 6},${cy - 4} L${cx - 8},${cy - 4}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${cx - 6},${cy - 14} L${cx - 18},${cy - 4} L${cx - 6},${cy + 6} Z`} fill="#fff" />
    </g>
  );
  const cols = [
    { x0: 12, title: "일반 사진 · 좌우 반전", verdict: "✓ 라벨 유지", ok: true, note: "자동차는 반전해도 자동차" },
    { x0: 250, title: "손글씨 숫자 · 상하좌우 반전", verdict: "✗ 라벨이 바뀜", ok: false, note: "6이 9가 된다" },
    { x0: 488, title: "교통 표지판 · 좌우 반전", verdict: "✗ 라벨이 바뀜", ok: false, note: "좌회전이 우회전이 된다" },
  ];
  return (
    <DiagramFrame
      title="데이터 증강의 기준: 변환해도 같은 라벨인가?"
      caption="증강은 '사람이 봐도 같은 라벨'인 변환만 써야 한다. 자동차 사진은 좌우로 뒤집어도 자동차지만, 손글씨 6을 뒤집으면 9가 되고 좌회전 표지판을 좌우로 뒤집으면 우회전 표지판이 된다. 이런 변환은 모델에게 틀린 정답을 가르친다. 같은 변환이 데이터에 따라 안전하기도, 위험하기도 하다."
      viewBox="0 0 720 230"
      minWidth={560}
    >
      {cols.map((c, i) => (
        <g key={c.title}>
          <rect x={c.x0} y={8} width={222} height={214} rx={12} fill="none" stroke="var(--border-hairline)" />
          <text x={c.x0 + 111} y={30} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
            {c.title}
          </text>
          <text x={c.x0 + 111} y={118} textAnchor="middle" fontSize={18} fill={inkSecondary}>
            →
          </text>
          <rect x={c.x0 + 51} y={160} width={120} height={26} rx={13} fill={c.ok ? colors.green : colors.red} fillOpacity={0.16} stroke={c.ok ? colors.green : colors.red} />
          <text x={c.x0 + 111} y={178} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={c.ok ? colors.green : colors.red}>
            {c.verdict}
          </text>
          <text x={c.x0 + 111} y={208} textAnchor="middle" fontSize={11} fill={inkSecondary}>
            {c.note}
          </text>
          {i === 0 && (
            <>
              {car(c.x0 + 10, 84, false)}
              {car(c.x0 + 135, 84, true)}
            </>
          )}
          {i === 1 && (
            <>
              <text x={c.x0 + 56} y={136} textAnchor="middle" fontSize={64} fontWeight={700} fill={ink}>
                6
              </text>
              <text x={c.x0 + 166} y={136} textAnchor="middle" fontSize={64} fontWeight={700} fill={colors.red} transform={`rotate(180 ${c.x0 + 166} 113)`}>
                6
              </text>
            </>
          )}
          {i === 2 && (
            <>
              {sign(c.x0 + 56, 110, false)}
              {sign(c.x0 + 166, 110, true)}
            </>
          )}
        </g>
      ))}
    </DiagramFrame>
  );
}

export function SanityChecks() {
  // Karpathy 레시피의 두 검산: ① 10클래스 초기 손실 ≈ ln 10 ≈ 2.30, ② 배치 하나는 거의 0까지 외워야 한다.
  const panels = [
    {
      title: "② 초기 손실이 ln(클래스 수)인가",
      ok: (t: number) => 2.302 * Math.exp(-t / 120) + 0.6 * (1 - Math.exp(-t / 120)),
      bad: (t: number) => 6.5 * Math.exp(-t / 40) + 1.4,
      okLabel: "정상: 2.30에서 출발",
      badLabel: "의심: 6.5에서 출발 (초기화·손실 버그)",
      ref: Math.log(10),
      refLabel: "ln 10 ≈ 2.30",
    },
    {
      title: "③ 배치 하나에 과적합되는가",
      ok: (t: number) => 2.302 * Math.exp(-t / 18) + 0.01,
      bad: (t: number) => 2.302 - 0.05 * (1 - Math.exp(-t / 30)) + 0.04 * Math.sin(t / 3),
      okLabel: "정상: 거의 0까지 외움",
      badLabel: "버그: 2.3 근처에서 안 내려감",
      ref: 0,
      refLabel: "",
    },
  ];
  return (
    <DiagramFrame
      title="학습 진단 레시피의 두 가지 빠른 검산"
      caption="왼쪽: 10개 클래스 분류기가 처음에 모든 클래스에 1/10씩 주고 있다면 손실은 −ln(1/10) = ln 10 ≈ 2.30에서 출발해야 한다. 크게 벗어나면 학습 전에 이미 손실 함수나 초기화에 버그가 있다는 뜻이다. 오른쪽: 데이터 몇 개짜리 배치 하나는 어떤 모델이든 거의 완벽히 외울 수 있어야 한다. 이것조차 안 되면 데이터가 아니라 파이프라인(기울기가 흐르지 않음, 레이블이 밀림 등)의 버그다."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      {panels.map((p, i) => {
        const A = { left: 56 + i * 360, top: 34, width: 280, height: 160 };
        const sx = linear(0, 300, A.left, A.left + A.width);
        const sy = linear(0, 8, A.top + A.height, A.top);
        const ok = Array.from({ length: 61 }, (_, k) => [sx(k * 5), sy(p.ok(k * 5))] as [number, number]);
        const bad = Array.from({ length: 61 }, (_, k) => [sx(k * 5), sy(p.bad(k * 5))] as [number, number]);
        return (
          <g key={p.title}>
            <text x={A.left + A.width / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {p.title}
            </text>
            <Axes {...A} sx={sx} sy={sy} xTicks={[0, 100, 200, 300]} yTicks={[0, 2, 4, 6, 8]} xLabel="반복(step)" yLabel="손실" />
            {p.ref > 0 && (
              <>
                <line x1={A.left} y1={sy(p.ref)} x2={A.left + A.width} y2={sy(p.ref)} stroke={colors.green} strokeDasharray="5 4" />
                <text x={A.left + A.width - 4} y={sy(p.ref) - 6} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.green}>
                  {p.refLabel}
                </text>
              </>
            )}
            <path d={linePath(bad)} fill="none" stroke={colors.red} strokeWidth={2.2} />
            <path d={linePath(ok)} fill="none" stroke={colors.green} strokeWidth={2.4} />
            <text x={A.left + 10} y={A.top + 14} fontSize={10.5} fontWeight={700} fill={colors.red}>
              {p.badLabel}
            </text>
            <text x={A.left + 10} y={A.top + 30} fontSize={10.5} fontWeight={700} fill={colors.green}>
              {p.okLabel}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}
