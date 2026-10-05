import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, seeded, gaussian, mono, pow10Label, GridCells } from "./chart";

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

export function CnnDepthTimeline() {
  // ILSVRC 분류 top-5 오류율(%). 2012 AlexNet 15.3(2위 26.2), 2013 ZFNet 11.7, 2014 GoogLeNet 6.7·VGG 7.3, 2015 ResNet 3.57.
  // 사람(훈련된 주석자) 약 5.1%는 Russakovsky et al.(2015)의 보고.
  const bars = [
    { yr: "2010", name: "", err: 28.2, depth: "얕은 모델", c: inkMuted },
    { yr: "2011", name: "", err: 25.8, depth: "얕은 모델", c: inkMuted },
    { yr: "2012", name: "AlexNet", err: 15.3, depth: "8층", c: colors.orange },
    { yr: "2013", name: "ZFNet", err: 11.7, depth: "8층", c: inkMuted },
    { yr: "2014", name: "VGG", err: 7.3, depth: "19층", c: colors.green },
    { yr: "2014", name: "GoogLeNet", err: 6.7, depth: "22층", c: inkMuted },
    { yr: "2015", name: "ResNet", err: 3.57, depth: "152층", c: colors.violet },
  ];
  const G = { left: 56, top: 20, width: 470, height: 170 };
  const bw = 46;
  const step = G.width / bars.length;
  const sy = linear(0, 30, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="깊이의 혁명: ImageNet(ILSVRC) top-5 오류율과 층 수"
      caption="해마다 ILSVRC 분류 부문의 대표 결과다. CNN이 아닌 얕은 모델이 25~28%에 머물던 2012년, 8층의 AlexNet이 15.3%로 2위(26.2%)를 크게 앞섰다. 이후 3 × 3 커널을 19층까지 쌓은 VGG(7.3%, 2014년 2위), 22층의 GoogLeNet(6.7%, 2014년 우승)을 거쳐, 잔차 연결로 152층을 학습시킨 ResNet이 3.57%로 2015년에 우승했다. 점선은 훈련된 사람 주석자의 오류율(약 5.1%)이다. 층이 깊어질수록 오류가 줄었고, 그 깊이를 가능하게 한 것이 ReLU·GPU·작은 커널·잔차 연결이었다. 1998년의 LeNet은 32 × 32 흑백 손글씨용이라 이 대회에는 없다."
      viewBox="0 0 720 240"
      minWidth={600}
    >
      <Axes {...G} sx={(v) => v} sy={sy} yTicks={[0, 10, 20, 30]} fmtY={(v) => `${v}%`} />
      <line x1={G.left} x2={G.left + G.width} y1={sy(5.1)} y2={sy(5.1)} stroke={colors.red} strokeWidth={1.2} strokeDasharray="5 3" />
      <text x={G.left + G.width + 6} y={sy(5.1) + 4} fontSize={9.5} fontWeight={700} fill={colors.red}>
        ← 사람 약 5.1%
      </text>
      {bars.map((b, i) => {
        const cx = G.left + step * (i + 0.5);
        return (
          <g key={`${b.yr}-${b.name}`}>
            {b.yr === "2012" && <rect x={cx - bw / 2 - 10} y={sy(26.2)} width={8} height={sy(0) - sy(26.2)} fill={inkMuted} fillOpacity={0.35} />}
            {b.yr === "2012" && (
              <text x={cx - bw / 2 - 6} y={sy(26.2) - 4} textAnchor="middle" fontSize={8.5} fill={inkSecondary}>
                2위
              </text>
            )}
            <rect x={cx - bw / 2} y={sy(b.err)} width={bw} height={sy(0) - sy(b.err)} rx={3} fill={b.c} fillOpacity={b.c === inkMuted ? 0.35 : 0.75} />
            <text x={cx} y={sy(b.err) - 5} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
              {b.err}
            </text>
            <text x={cx} y={G.top + G.height + 14} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              {b.yr}
            </text>
            <text x={cx} y={G.top + G.height + 28} textAnchor="middle" fontSize={10.5} fontWeight={b.c === inkMuted ? 400 : 800} fill={b.c === inkMuted ? inkSecondary : b.c}>
              {b.name || "—"}
            </text>
            <text x={cx} y={G.top + G.height + 42} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {b.depth}
            </text>
          </g>
        );
      })}
      <Tag x={548} y={30} w={160} h={66} lines={["LeNet (1998)", "MNIST 손글씨, 32 × 32 흑백", "conv + pool + FC 골격"]} color={colors.blue} size={11} />
      <Lines x={548} y={114} lines={["AlexNet: ReLU · Dropout · GPU", "VGG: 3 × 3 커널을 깊게", "ResNet: 잔차 연결로 152층"]} size={10.5} anchor="start" color={ink} weight={600} gap={1.6} />
    </DiagramFrame>
  );
}

export function VggStack() {
  // 3 × 3 conv 세 번(stride 1)의 수용영역 3 → 5 → 7 = 7 × 7 conv 한 번. 파라미터는 C = 64에서 110,592 vs 200,704.
  const S = 22;
  const x0 = 40;
  const y0 = 34;
  const rings = [
    { k: 7, c: colors.violet, t: "3번째 층: 7 × 7" },
    { k: 5, c: colors.green, t: "2번째 층: 5 × 5" },
    { k: 3, c: colors.blue, t: "1번째 층: 3 × 3" },
  ];
  const bx = linear(0, 210000, 0, 250);
  return (
    <DiagramFrame
      title="작은 커널을 깊게: 3 × 3 세 번 = 7 × 7 한 번의 시야, 더 적은 파라미터"
      caption="왼쪽: 입력의 7 × 7 격자에서 가운데 출력 하나가 보는 범위다. 3 × 3 합성곱(stride 1)을 한 번 거치면 3 × 3, 두 번이면 5 × 5, 세 번이면 7 × 7을 본다. 7 × 7 합성곱 한 층과 같은 범위다. 오른쪽: 입력·출력 채널이 64일 때 파라미터 수다. 7 × 7 한 층은 49 × 64 × 64 = 200,704개, 3 × 3 세 층은 3 × 9 × 64 × 64 = 110,592개로 약 45% 적다. 게다가 세 층 사이마다 ReLU를 거쳐 비선형을 세 번 쓸 수 있다."
      viewBox="0 0 720 220"
      minWidth={580}
    >
      {Array.from({ length: 7 }, (_, i) =>
        Array.from({ length: 7 }, (_, j) => <rect key={`${i}-${j}`} x={x0 + j * S} y={y0 + i * S} width={S} height={S} fill={card2Bg} stroke="var(--border-strong)" strokeWidth={0.8} />),
      )}
      {rings.map((r) => {
        const off = (7 - r.k) / 2;
        return <rect key={r.k} x={x0 + off * S + 1.5} y={y0 + off * S + 1.5} width={r.k * S - 3} height={r.k * S - 3} rx={4} fill={r.c} fillOpacity={0.12} stroke={r.c} strokeWidth={2.2} />;
      })}
      <rect x={x0 + 3 * S + 5} y={y0 + 3 * S + 5} width={S - 10} height={S - 10} fill={ink} />
      <text x={x0 + 3.5 * S} y={y0 - 10} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        입력 7 × 7 위의 수용영역
      </text>
      {rings.map((r, i) => (
        <g key={`l${r.k}`}>
          <rect x={210} y={58 + i * 30} width={12} height={12} rx={2} fill={r.c} fillOpacity={0.4} stroke={r.c} />
          <text x={228} y={68 + i * 30} fontSize={10.5} fontWeight={700} fill={r.c}>
            {r.t}
          </text>
        </g>
      )).reverse()}
      <text x={210} y={164} fontSize={10} fill={inkSecondary}>
        ■ 가운데 출력 한 칸
      </text>
      <line x1={356} y1={14} x2={356} y2={206} stroke="var(--border-hairline)" />
      <text x={380} y={34} fontSize={12} fontWeight={800} fill={ink}>
        파라미터 수 (채널 C = 64)
      </text>
      {[
        { t: "7 × 7 한 층", v: 200704, f: "49 × 64 × 64", relu: "ReLU 1번", c: colors.red },
        { t: "3 × 3 세 층", v: 110592, f: "3 × 9 × 64 × 64", relu: "ReLU 3번", c: colors.green },
      ].map((b, i) => {
        const y = 56 + i * 64;
        return (
          <g key={b.t}>
            <text x={380} y={y + 12} fontSize={11} fontWeight={800} fill={ink}>
              {b.t}
            </text>
            <text x={470} y={y + 12} fontSize={10} fill={inkSecondary} fontFamily={mono}>
              {b.f}
            </text>
            <rect x={380} y={y + 20} width={bx(b.v)} height={20} rx={3} fill={b.c} fillOpacity={0.65} />
            <text x={380 + bx(b.v) + 6} y={y + 34} fontSize={11} fontWeight={800} fill={ink}>
              {b.v.toLocaleString("en-US")}
            </text>
            <text x={380} y={y + 54} fontSize={10} fill={inkSecondary}>
              {b.relu}
            </text>
          </g>
        );
      })}
      <text x={380} y={196} fontSize={11} fontWeight={800} fill={colors.green}>
        같은 7 × 7 시야, 파라미터 약 45% ↓, 비선형 3배
      </text>
    </DiagramFrame>
  );
}

export function CvTasks() {
  // 같은 장면(사람 둘, 자동차 하나)에 대한 네 과제의 출력.
  const pw = 160;
  const ph = 110;
  const person = (ox: number, oy: number, cx: number, cy: number, s: number, fill: string, op: number, stroke?: string) => (
    <g>
      <circle cx={ox + cx} cy={oy + cy} r={7 * s} fill={fill} fillOpacity={op} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
      <rect x={ox + cx - 10 * s} y={oy + cy + 9 * s} width={20 * s} height={34 * s} rx={7 * s} fill={fill} fillOpacity={op} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
    </g>
  );
  const car = (ox: number, oy: number, fill: string, op: number, stroke?: string) => (
    <g>
      <rect x={ox + 98} y={oy + 46} width={30} height={16} rx={5} fill={fill} fillOpacity={op} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
      <rect x={ox + 88} y={oy + 58} width={54} height={22} rx={6} fill={fill} fillOpacity={op} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
      <circle cx={ox + 100} cy={oy + 82} r={6.5} fill={fill} fillOpacity={Math.min(1, op + 0.15)} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
      <circle cx={ox + 130} cy={oy + 82} r={6.5} fill={fill} fillOpacity={Math.min(1, op + 0.15)} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
    </g>
  );
  const panels = [
    { t: "분류", sub: "사진 전체에 라벨 하나" },
    { t: "객체 탐지", sub: "물체마다 상자 + 클래스" },
    { t: "의미론적 분할", sub: "픽셀마다 클래스 (개체 구분 X)" },
    { t: "인스턴스 분할", sub: "픽셀마다 클래스 + 개체 번호" },
  ];
  return (
    <DiagramFrame
      title="같은 장면, 네 가지 질문: 분류 · 탐지 · 의미론적 분할 · 인스턴스 분할"
      caption="사람 둘과 자동차 하나가 있는 같은 장면이다. 분류는 사진 전체에 클래스 하나('사람')만 붙인다. 객체 탐지는 물체마다 위치(상자)와 클래스, 점수를 함께 낸다. 의미론적 분할은 픽셀 하나하나에 클래스를 칠하지만, 같은 클래스의 두 사람을 같은 색으로 칠해 서로 구분하지 않는다. 두 사람을 서로 다른 개체로 나눠 칠하는 것이 인스턴스 분할이다."
      viewBox="0 0 720 196"
      minWidth={620}
    >
      {panels.map((p, j) => {
        const ox = 14 + j * (pw + 16);
        const oy = 40;
        const base = inkMuted;
        return (
          <g key={p.t}>
            <text x={ox + pw / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {p.t}
            </text>
            <text x={ox + pw / 2} y={31} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {p.sub}
            </text>
            <rect x={ox} y={oy} width={pw} height={ph} rx={6} fill={j >= 2 ? colors.yellow : card2Bg} fillOpacity={j >= 2 ? 0.12 : 1} stroke="var(--border-strong)" />
            {j === 0 && (
              <g>
                {person(ox, oy, 34, 22, 1, base, 0.55)}
                {person(ox, oy, 64, 26, 0.9, base, 0.55)}
                {car(ox, oy, base, 0.5)}
              </g>
            )}
            {j === 1 && (
              <g>
                {person(ox, oy, 34, 22, 1, base, 0.45)}
                {person(ox, oy, 64, 26, 0.9, base, 0.45)}
                {car(ox, oy, base, 0.4)}
                <rect x={ox + 22} y={oy + 13} width={24} height={64} fill="none" stroke={colors.blue} strokeWidth={2} />
                <rect x={ox + 53} y={oy + 18} width={22} height={58} fill="none" stroke={colors.blue} strokeWidth={2} />
                <rect x={ox + 85} y={oy + 43} width={60} height={47} fill="none" stroke={colors.orange} strokeWidth={2} />
                <text x={ox + 22} y={oy + 10} fontSize={8.5} fontWeight={800} fill={colors.blue}>
                  사람 0.97
                </text>
                <text x={ox + 55} y={oy + 104} fontSize={8.5} fontWeight={800} fill={colors.blue}>
                  사람 0.91
                </text>
                <text x={ox + 98} y={oy + 39} fontSize={8.5} fontWeight={800} fill={colors.orange}>
                  자동차 0.95
                </text>
              </g>
            )}
            {j === 2 && (
              <g>
                {person(ox, oy, 34, 22, 1, colors.blue, 0.75)}
                {person(ox, oy, 64, 26, 0.9, colors.blue, 0.75)}
                {car(ox, oy, colors.orange, 0.7)}
              </g>
            )}
            {j === 3 && (
              <g>
                {person(ox, oy, 34, 22, 1, colors.blue, 0.75)}
                {person(ox, oy, 64, 26, 0.9, colors.violet, 0.75)}
                {car(ox, oy, colors.orange, 0.7)}
              </g>
            )}
            <text x={ox + pw / 2} y={oy + ph + 20} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={j === 0 ? ink : inkSecondary}>
              {["→ '사람'", "상자 3개", "사람 = 파랑 (둘 다)", "사람1 · 사람2 · 자동차"][j]}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function VitPatchCount() {
  // 224 × 224 이미지를 패치 32·16·8로 자르면 토큰 49·196·784개. Self-Attention 쌍의 수는 토큰 수의 제곱.
  const S = 120;
  const cfg = [
    { p: 32, c: colors.green },
    { p: 16, c: colors.blue },
    { p: 8, c: colors.red },
  ];
  return (
    <DiagramFrame
      title="패치 크기와 토큰 수: 패치를 반으로 줄이면 토큰은 4배, 어텐션은 16배"
      caption="224 × 224 컬러 이미지를 정사각형 패치로 자른 모습이다. 16 × 16 패치면 가로세로 14개씩 196개의 토큰이 되고, 패치 하나는 16 × 16 × 3 = 768개의 숫자를 편 벡터가 된다. 패치를 32로 키우면 토큰이 49개로 줄고, 8로 줄이면 784개로 늘어난다. Self-Attention은 모든 토큰 쌍을 비교하므로 계산량이 토큰 수의 제곱에 비례해, 16 → 8로 패치를 반으로 줄이면 토큰은 4배, 어텐션 계산은 16배가 된다."
      viewBox="0 0 720 230"
      minWidth={600}
    >
      {cfg.map((c, j) => {
        const x0 = 30 + j * 230;
        const n = 224 / c.p;
        const cell = S / n;
        const tokens = n * n;
        return (
          <g key={c.p}>
            <text x={x0 + S / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={c.c}>
              {`패치 ${c.p} × ${c.p}`}
            </text>
            <rect x={x0} y={28} width={S} height={S} fill={c.c} fillOpacity={0.08} stroke={c.c} strokeWidth={1.4} />
            {Array.from({ length: n - 1 }, (_, k) => (
              <g key={k}>
                <line x1={x0 + (k + 1) * cell} x2={x0 + (k + 1) * cell} y1={28} y2={28 + S} stroke={c.c} strokeOpacity={0.55} strokeWidth={0.7} />
                <line x1={x0} x2={x0 + S} y1={28 + (k + 1) * cell} y2={28 + (k + 1) * cell} stroke={c.c} strokeOpacity={0.55} strokeWidth={0.7} />
              </g>
            ))}
            <rect x={x0} y={28} width={cell} height={cell} fill={c.c} fillOpacity={0.55} />
            <Lines x={x0 + S + 12} y={52} lines={[`${n} × ${n}`, `= ${tokens}토큰`]} size={11.5} anchor="start" color={ink} weight={800} />
            <Lines x={x0 + S + 12} y={98} lines={["패치 하나", `${c.p}·${c.p}·3`, `= ${(c.p * c.p * 3).toLocaleString("en-US")}차원`]} size={10} anchor="start" color={inkSecondary} />
            <text x={x0 + S / 2} y={176} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
              어텐션 쌍 = 토큰 수²
            </text>
            <text x={x0 + S / 2} y={196} textAnchor="middle" fontSize={12} fontWeight={800} fill={c.c}>
              {`${(tokens * tokens).toLocaleString("en-US")} (${(tokens * tokens) / 2401}배)`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function AeVsVaeLatent() {
  // 개념도: 일반 오토인코더의 잠재 점들은 불규칙하게 흩어져 빈 틈이 많고, VAE는 입력마다 분포를 두고 N(0, I) 근처로 모아 공간을 메운다.
  const P = "avl";
  const rand = seeded(5);
  const cols = [colors.blue, colors.orange, colors.green, colors.violet];
  const aeCenters = [
    [-2.4, 1.6],
    [2.1, 2.2],
    [1.6, -2.3],
    [-1.9, -1.6],
  ];
  const ae = aeCenters.flatMap((c, k) => Array.from({ length: 9 }, () => ({ x: c[0] + 0.35 * gaussian(rand), y: c[1] + 0.35 * gaussian(rand), k })));
  const vaeCenters = [
    [-0.7, 0.5],
    [0.6, 0.6],
    [0.5, -0.6],
    [-0.6, -0.5],
  ];
  const vae = vaeCenters.flatMap((c, k) => Array.from({ length: 7 }, () => ({ x: c[0] + 0.4 * gaussian(rand), y: c[1] + 0.4 * gaussian(rand), k, sx: 0.55 + 0.2 * rand(), sy: 0.55 + 0.2 * rand() })));
  const S = 190;
  const panel = (x0: number, title: string, sub: string) => {
    const sx = linear(-3.4, 3.4, x0, x0 + S);
    const sy = linear(-3.4, 3.4, 36 + S, 36);
    return { sx, sy, head: (
      <g>
        <text x={x0 + S / 2} y={14} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
          {title}
        </text>
        <text x={x0 + S / 2} y={29} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {sub}
        </text>
        <rect x={x0} y={36} width={S} height={S} fill="none" stroke="var(--border-strong)" />
        <line x1={sx(0)} x2={sx(0)} y1={36} y2={36 + S} stroke={inkMuted} strokeOpacity={0.4} />
        <line x1={x0} x2={x0 + S} y1={sy(0)} y2={sy(0)} stroke={inkMuted} strokeOpacity={0.4} />
      </g>
    ) };
  };
  const L = panel(40, "오토인코더의 잠재공간", "입력 하나 → 점 하나");
  const R = panel(330, "VAE의 잠재공간", "입력 하나 → 분포 N(μ, σ²) 하나");
  return (
    <DiagramFrame
      title="잠재공간의 차이: 점으로 흩어진 오토인코더, 분포로 메운 VAE"
      caption="개념도다. 색은 서로 다른 종류의 입력(예: 숫자 0~3)이다. 왼쪽: 일반 오토인코더는 입력을 잠재공간의 점 하나로 보내고 복원만 배우므로, 점들이 덩어리째 흩어지고 사이에 빈 틈이 크다. 빈 틈에서 z를 고르면(✗) 디코더가 무엇을 낼지 보장이 없다. 오른쪽: VAE는 입력마다 평균 μ와 표준편차 σ를 가진 분포(타원)를 내고, KL 항이 이 분포들을 표준정규분포(점선 원) 쪽으로 끌어당겨 서로 겹치게 한다. 그래서 N(0, I)에서 아무 z나 뽑아도(✓) 학습된 분포들이 덮은 자리에 떨어져 그럴듯한 데이터가 나온다."
      viewBox="0 0 720 262"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ red: colors.red, green: colors.green }} />
      {L.head}
      {ae.map((p, i) => (
        <circle key={i} cx={L.sx(p.x)} cy={L.sy(p.y)} r={3.4} fill={cols[p.k]} />
      ))}
      <text x={L.sx(0.2)} y={L.sy(0.1) + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill={colors.red}>
        ✗
      </text>
      <Lines x={L.sx(0.2)} y={L.sy(-0.5) + 6} lines={["빈 틈에서 뽑은 z:", "무엇이 나올지 모름"]} size={9.5} color={colors.red} weight={700} />
      {R.head}
      <circle cx={R.sx(0)} cy={R.sy(0)} r={R.sx(2) - R.sx(0)} fill="none" stroke={inkSecondary} strokeWidth={1.4} strokeDasharray="5 3" />
      <text x={R.sx(1.45)} y={R.sy(-1.75)} fontSize={9.5} fill={inkSecondary}>
        N(0, I)
      </text>
      {vae.map((p, i) => (
        <ellipse key={i} cx={R.sx(p.x)} cy={R.sy(p.y)} rx={(R.sx(p.sx) - R.sx(0)) * 1} ry={(R.sx(p.sy) - R.sx(0)) * 1} fill={cols[p.k]} fillOpacity={0.12} stroke={cols[p.k]} strokeOpacity={0.5} strokeWidth={0.8} />
      ))}
      {vae.map((p, i) => (
        <circle key={`c${i}`} cx={R.sx(p.x)} cy={R.sy(p.y)} r={2.2} fill={cols[p.k]} />
      ))}
      <text x={R.sx(0.95)} y={R.sy(1.25) + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        ✓
      </text>
      <Lines x={605} y={92} lines={["KL 항이", "분포들을 원점 쪽으로", "모아 겹치게 한다", "", "N(0, I)에서 뽑은 z도", "덮인 자리에 떨어진다"]} size={10} anchor="start" color={ink} weight={600} />
    </DiagramFrame>
  );
}

export function DiffusionChain() {
  // DDPM의 선형 β 스케줄(1e-4 → 0.02, T = 1000)로 ᾱ_t를 계산해 x_t = √ᾱ_t·x₀ + √(1 − ᾱ_t)·ε를 그린다(20 × 20 웃는 얼굴, 시드 고정 노이즈).
  const P = "dfc";
  const N = 20;
  const T = 1000;
  const alphaBar: number[] = [1];
  for (let t = 1; t <= T; t++) alphaBar.push(alphaBar[t - 1] * (1 - (1e-4 + ((0.02 - 1e-4) * (t - 1)) / (T - 1))));
  const x0 = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => {
      const dx = j - 9.5;
      const dy = i - 9.5;
      const r = Math.hypot(dx, dy);
      const eye = Math.hypot(j - 6.5, i - 7) < 1.5 || Math.hypot(j - 12.5, i - 7) < 1.5;
      const smile = r > 4.6 && r < 6.2 && dy > 1.5;
      const face = r < 8.6;
      return eye || smile ? -1 : face ? 0.85 : -0.6;
    }),
  );
  const rand = seeded(11);
  const eps = x0.map((row) => row.map(() => gaussian(rand)));
  const steps = [0, 100, 250, 500, 1000];
  const S = 5.4;
  const gap = 140;
  const left = 22;
  return (
    <DiagramFrame
      title="확산 모델: 노이즈를 조금씩 더하고(고정), 조금씩 걷어 낸다(학습)"
      caption={`위쪽 화살표가 순확산이다. DDPM의 노이즈 스케줄(T = 1000 단계)로 원본 x₀에 노이즈를 섞으면 x_t = √ᾱ_t·x₀ + √(1 − ᾱ_t)·ε가 되고, 원본이 남는 비율 √ᾱ_t는 t = 250에서 ${Math.sqrt(alphaBar[250]).toFixed(2)}, t = 500에서 ${Math.sqrt(alphaBar[500]).toFixed(2)}, t = 1000에서 ${Math.sqrt(alphaBar[1000]).toFixed(3)}로 줄어 결국 순수한 노이즈가 된다. 이 과정에는 학습할 것이 없다. 아래쪽 화살표가 학습하는 역확산이다. 신경망(보통 U-Net)이 x_t에 섞인 노이즈 ε를 예측하고, 그만큼 걷어 내 한 단계 덜 흐린 이미지로 한 걸음씩 되돌린다. 생성할 때는 순수한 노이즈에서 출발해 이 걸음을 반복한다.`}
      viewBox="0 0 720 244"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet }} />
      {steps.map((t, k) => {
        const ox = left + k * gap;
        const oy = 58;
        const a = Math.sqrt(alphaBar[t]);
        const b = Math.sqrt(1 - alphaBar[t]);
        return (
          <g key={t}>
            <rect x={ox - 1} y={oy - 1} width={N * S + 2} height={N * S + 2} fill="var(--surface-card)" stroke="var(--border-strong)" />
            <GridCells
              keys={x0.map((row, i) =>
                row.map((v, j) => {
                  // 밝기 g ∈ [0, 1]을 진하기 1 − g로 바꿔 40단계로 나눈다(단계 0은 칸을 비운다).
                  const g = Math.max(0, Math.min(1, (a * v + b * eps[i][j] + 1) / 2));
                  return Math.round((1 - g) * 40) || null;
                }),
              )}
              x={ox}
              y={oy}
              cw={S}
              crisp
              fill={() => ink}
              opacity={(k) => k / 40}
            />
            <text x={ox + (N * S) / 2} y={oy + N * S + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
              {t === 0 ? "x₀ (원본)" : `x${String(t).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])}${t === T ? " (노이즈)" : ""}`}
            </text>
            <text x={ox + (N * S) / 2} y={oy + N * S + 30} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {`√ᾱ = ${a < 0.01 ? a.toFixed(3) : a.toFixed(2)}`}
            </text>
          </g>
        );
      })}
      {steps.slice(0, -1).map((t, k) => {
        const xa = left + k * gap + N * S + 6;
        const xb = left + (k + 1) * gap - 6;
        return (
          <g key={`a${t}`}>
            <Arr x1={xa} y1={44} x2={xb} y2={44} color={inkSecondary} marker={`${P}-ink`} width={1.4} />
            <Arr x1={xb} y1={208} x2={xa} y2={208} color={colors.violet} marker={`${P}-violet`} width={1.8} />
          </g>
        );
      })}
      <text x={360} y={22} textAnchor="middle" fontSize={11} fontWeight={800} fill={inkSecondary}>
        순확산 q: 가우시안 노이즈를 조금씩 더한다 (고정된 절차, 학습 없음) →
      </text>
      <text x={360} y={232} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet}>
        ← 역확산 p_θ: 신경망이 섞인 노이즈 ε를 예측해 한 단계씩 걷어 낸다 (학습)
      </text>
    </DiagramFrame>
  );
}

export function IouExamples() {
  // 본문 예제: (0, 0, 4, 4)와 (2, 2, 6, 6) → 4 / 28 ≈ 0.143. 오른쪽은 같은 크기 상자를 가로로 밀어 IoU 0.5·0.8을 만든 비교.
  const S = 20;
  const ox = 40;
  const oy = 176;
  const px = (x: number) => ox + x * S;
  const py = (y: number) => oy - y * S;
  const iou = (a: number[], b: number[]) => {
    const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
    const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    const I = ix * iy;
    return I / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - I);
  };
  const pairs = [
    { d: 4 - 8 / 3, label: "IoU 0.50" },
    { d: 4 - 32 / 9, label: "IoU 0.80" },
  ];
  return (
    <DiagramFrame
      title="IoU: 겹친 넓이 ÷ 합친 넓이"
      caption="왼쪽은 본문 예제다. 넓이 16인 두 상자 (0, 0, 4, 4)와 (2, 2, 6, 6)은 2 × 2 = 4만큼 겹치고, 합친 넓이는 16 + 16 − 4 = 28이라 IoU는 4 / 28 ≈ 0.143이다. 한 변의 절반씩만 어긋났는데도 꽤 낮다. 오른쪽은 같은 크기의 상자를 가로로만 밀었을 때다. 한 변의 1/3쯤 어긋나면 IoU 0.5, 1/9쯤이면 0.8이 된다. 탐지에서는 보통 IoU 0.5 이상을 '맞혔다'로 본다."
      viewBox="0 0 720 222"
      minWidth={560}
    >
      {Array.from({ length: 7 }, (_, k) => (
        <g key={k}>
          <line x1={px(k)} x2={px(k)} y1={py(0)} y2={py(6.5)} stroke="var(--border-hairline)" />
          <line x1={px(0)} x2={px(6.5)} y1={py(k)} y2={py(k)} stroke="var(--border-hairline)" />
          <text x={px(k)} y={py(0) + 14} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {k}
          </text>
          <text x={px(0) - 6} y={py(k) + 3} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
            {k}
          </text>
        </g>
      ))}
      <rect x={px(0)} y={py(4)} width={4 * S} height={4 * S} fill={colors.blue} fillOpacity={0.15} stroke={colors.blue} strokeWidth={2} />
      <rect x={px(2)} y={py(6)} width={4 * S} height={4 * S} fill={colors.orange} fillOpacity={0.15} stroke={colors.orange} strokeWidth={2} />
      <rect x={px(2)} y={py(4)} width={2 * S} height={2 * S} fill={colors.violet} fillOpacity={0.55} />
      <text x={px(1)} y={py(0.5)} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.blue}>
        A
      </text>
      <text x={px(5)} y={py(5.3)} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.orange}>
        B
      </text>
      <Lines x={200} y={58} lines={["|A ∩ B| = 2 × 2 = 4", "|A ∪ B| = 16 + 16 − 4 = 28", "IoU = 4 / 28 ≈ 0.143"]} size={11} anchor="start" color={ink} weight={700} gap={1.7} />
      <text x={200} y={140} fontSize={10.5} fontWeight={800} fill={colors.red}>
        {"✗ 0.5에 못 미쳐 '틀림'으로 본다"}
      </text>
      <line x1={392} y1={14} x2={392} y2={210} stroke="var(--border-hairline)" />
      {pairs.map((p, i) => {
        const x0 = 420 + i * 150;
        const s = 22;
        const a = [0, 0, 4, 4];
        const b = [p.d, 0, p.d + 4, 4];
        return (
          <g key={p.label}>
            <rect x={x0} y={60} width={4 * s} height={4 * s} fill={colors.blue} fillOpacity={0.15} stroke={colors.blue} strokeWidth={2} />
            <rect x={x0 + p.d * s} y={60} width={4 * s} height={4 * s} fill={colors.orange} fillOpacity={0.15} stroke={colors.orange} strokeWidth={2} />
            <rect x={x0 + p.d * s} y={60} width={(4 - p.d) * s} height={4 * s} fill={colors.violet} fillOpacity={0.35} />
            <text x={x0 + ((4 + p.d) * s) / 2} y={172} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.green}>
              {`IoU ${iou(a, b).toFixed(2)} ✓`}
            </text>
          </g>
        );
      })}
      <text x={555} y={34} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        같은 크기 상자를 옆으로 밀면
      </text>
    </DiagramFrame>
  );
}

export function NmsSteps() {
  // 본문 예제의 상자 셋: A(0.9), B(0.8, IoU(A, B) = 0.70), C(0.6, IoU(A, C) = 0.10, IoU(B, C) = 0.20). 좌표는 그 값이 나오도록 잡았다.
  const boxes = [
    { n: "A", s: 0.9, b: [0, 0, 10, 10], c: colors.blue },
    { n: "B", s: 0.8, b: [0.9, -1, 11.9, 10], c: colors.orange },
    { n: "C", s: 0.6, b: [8.2, 1.3, 16.2, 10.3], c: colors.violet },
  ];
  const states = [
    { t: "① 후보 세 개", keep: ["A", "B", "C"], gone: [] as string[], fixed: [] as string[], note: "점수순: A 0.9 > B 0.8 > C 0.6" },
    { t: "② A 확정, B 제거", keep: ["A", "C"], gone: ["B"], fixed: ["A"], note: "IoU(A, B) = 0.70 > 0.5 → 중복" },
    { t: "③ C는 남겨 확정", keep: ["A", "C"], gone: ["B"], fixed: ["A", "C"], note: "IoU(A, C) = 0.10 < 0.5 → 다른 물체" },
  ];
  const s = 8.4;
  return (
    <DiagramFrame
      title="NMS 한 바퀴: 가장 높은 상자를 확정하고 많이 겹치는 상자를 지운다"
      caption="본문 예제의 세 상자다(겹침이 본문의 IoU 값과 같도록 그렸다). ① 점수가 가장 높은 A를 먼저 확정한다. ② A와 IoU 0.7로 많이 겹치는 B는 임계값 0.5를 넘으므로 같은 물체의 중복으로 보고 지운다. ③ A와 IoU 0.1뿐인 C는 남고, 남은 후보 중 가장 높으므로 확정한다. 결과는 A와 C 두 상자다. 임계값을 너무 낮추면 붙어 있는 다른 물체까지 지우고, 너무 높이면 중복이 남는다."
      viewBox="0 0 720 210"
      minWidth={600}
    >
      {states.map((st, j) => {
        const x0 = 22 + j * 236;
        const y0 = 46;
        const tx = (v: number) => x0 + 10 + v * s;
        const ty = (v: number) => y0 + 10 + (10.3 - v) * s;
        return (
          <g key={st.t}>
            <text x={x0 + 100} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {st.t}
            </text>
            <rect x={x0} y={y0 - 6} width={200} height={124} rx={8} fill={card2Bg} stroke="var(--border-hairline)" />
            {boxes.map((bx) => {
              const gone = st.gone.includes(bx.n);
              const fixed = st.fixed.includes(bx.n);
              return (
                <g key={bx.n} opacity={gone ? 0.35 : 1}>
                  <rect x={tx(bx.b[0])} y={ty(bx.b[3])} width={(bx.b[2] - bx.b[0]) * s} height={(bx.b[3] - bx.b[1]) * s} fill={fixed ? bx.c : "none"} fillOpacity={fixed ? 0.12 : 0} stroke={bx.c} strokeWidth={fixed ? 2.6 : 1.6} strokeDasharray={gone ? "4 3" : undefined} />
                  <text x={tx(bx.b[0]) + (bx.n === "B" ? (bx.b[2] - bx.b[0]) * s - 4 : 4)} y={ty(bx.b[3]) + (bx.n === "B" ? (bx.b[3] - bx.b[1]) * s + 12 : -4)} textAnchor={bx.n === "B" ? "end" : "start"} fontSize={10} fontWeight={800} fill={bx.c}>
                    {`${bx.n} ${bx.s}${gone ? " ✗" : fixed ? " ✓" : ""}`}
                  </text>
                </g>
              );
            })}
            <text x={x0 + 100} y={y0 + 136} textAnchor="middle" fontSize={10} fontWeight={700} fill={j === 0 ? inkSecondary : j === 1 ? colors.red : colors.green}>
              {st.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function ApSteps() {
  // 본문 예제: 정답 2개, 점수순 판정 TP, FP, TP → Precision 1, 1/2, 2/3, Recall 0.5, 0.5, 1 → AP = (1 + 0.667) / 2 ≈ 0.833.
  const runs = [
    { t: "TP, FP, TP", seq: [true, false, true], c: colors.blue },
    { t: "TP, TP, FP", seq: [true, true, false], c: colors.green },
  ];
  const stats = (seq: boolean[]) => {
    let tp = 0;
    return seq.map((ok, i) => {
      if (ok) tp++;
      return { ok, p: tp / (i + 1), r: tp / 2 };
    });
  };
  const S = 118;
  return (
    <DiagramFrame
      title="AP: 점수 높은 상자부터 내려가며 Precision을 모은다"
      caption="본문 예제다. 정답 물체가 2개이고 탐지기가 점수순으로 상자 셋을 냈다. 위에서부터 TP, FP, TP라면 Precision은 1 → 1/2 → 2/3, Recall은 0.5 → 0.5 → 1이다. TP가 나온 지점의 Precision(1과 2/3)을 더해 정답 수 2로 나누면 AP ≈ 0.833이고, 이는 오른쪽 PR 그래프에서 칠한 넓이(0.5 × 1 + 0.5 × 0.667)와 같다. 점수가 높은 상자가 더 정확해 TP, TP, FP 순서라면 AP는 1이 된다. AP는 '맞힌 상자에 더 높은 점수를 주는가'까지 평가한다."
      viewBox="0 0 720 220"
      minWidth={600}
    >
      {runs.map((run, k) => {
        const x0 = 16 + k * 356;
        const st = stats(run.seq);
        const G = { left: x0 + 220, top: 30, width: S, height: S };
        const sx = linear(0, 1, G.left, G.left + S);
        const sy = linear(0, 1.05, G.top + S, G.top);
        const tpPts = st.filter((q) => q.ok);
        const ap = tpPts.reduce((sum, q) => sum + q.p, 0) / 2;
        return (
          <g key={run.t}>
            <text x={x0 + 4} y={18} fontSize={12} fontWeight={800} fill={run.c}>
              {`판정 순서: ${run.t}`}
            </text>
            <text x={x0 + 4} y={42} fontSize={9.5} fill={inkSecondary}>
              순위
            </text>
            <text x={x0 + 44} y={42} fontSize={9.5} fill={inkSecondary}>
              판정
            </text>
            <text x={x0 + 90} y={42} fontSize={9.5} fill={inkSecondary}>
              Precision
            </text>
            <text x={x0 + 150} y={42} fontSize={9.5} fill={inkSecondary}>
              Recall
            </text>
            {st.map((q, i) => (
              <g key={i}>
                <text x={x0 + 12} y={64 + i * 24} fontSize={11} fontWeight={700} fill={ink}>
                  {i + 1}
                </text>
                <text x={x0 + 44} y={64 + i * 24} fontSize={11} fontWeight={800} fill={q.ok ? colors.green : colors.red}>
                  {q.ok ? "TP ✓" : "FP ✗"}
                </text>
                <text x={x0 + 90} y={64 + i * 24} fontSize={11} fontWeight={q.ok ? 800 : 400} fill={q.ok ? run.c : inkSecondary} fontFamily={mono}>
                  {q.p === 1 ? "1" : q.p === 0.5 ? "1/2" : "2/3"}
                </text>
                <text x={x0 + 150} y={64 + i * 24} fontSize={11} fill={ink} fontFamily={mono}>
                  {q.r}
                </text>
              </g>
            ))}
            <text x={x0 + 4} y={150} fontSize={10.5} fontWeight={700} fill={ink}>
              {`AP = (${tpPts.map((q) => (q.p === 1 ? "1" : "0.667")).join(" + ")}) / 2`}
            </text>
            <text x={x0 + 4} y={170} fontSize={13} fontWeight={800} fill={run.c}>
              {`= ${ap.toFixed(3)}`}
            </text>
            <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="Recall" />
            {tpPts.map((q, i) => {
              const r0 = i === 0 ? 0 : tpPts[i - 1].r;
              return <rect key={i} x={sx(r0)} y={sy(q.p)} width={sx(q.r) - sx(r0)} height={sy(0) - sy(q.p)} fill={run.c} fillOpacity={0.25} stroke={run.c} strokeWidth={1} />;
            })}
            {st.map((q, i) => (
              <circle key={i} cx={sx(q.r)} cy={sy(q.p)} r={4} fill={q.ok ? run.c : "var(--surface-card)"} stroke={run.c} strokeWidth={1.5} />
            ))}
            <text transform={`translate(${G.left - 30}, ${G.top + S / 2}) rotate(-90)`} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              Precision
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function DiceIou() {
  // 12 × 8 격자의 두 마스크: 정답 A(5 × 6 = 30칸), 예측 B(30칸), 겹침 20칸 → IoU 0.5, Dice 0.667. Dice = 2·IoU / (1 + IoU).
  const C = 12;
  const R = 8;
  const cell = 17;
  const inA = (r: number, c: number) => r >= 1 && r <= 5 && c >= 1 && c <= 6;
  const inB = (r: number, c: number) => r >= 2 && r <= 6 && c >= 2 && c <= 7;
  let a = 0;
  let b = 0;
  let both = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (inA(r, c)) a++;
      if (inB(r, c)) b++;
      if (inA(r, c) && inB(r, c)) both++;
    }
  const iou = both / (a + b - both);
  const dice = (2 * both) / (a + b);
  const G = { left: 440, top: 18, width: 170, height: 170 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="분할의 평가: 픽셀 IoU와 Dice"
      caption={`왼쪽: 정답 마스크 A(파란 테두리, ${a}픽셀)와 예측 마스크 B(주황, ${b}픽셀)가 ${both}픽셀 겹친다. IoU = ${both} / (${a} + ${b} − ${both}) = ${iou.toFixed(2)}, Dice = 2 × ${both} / (${a} + ${b}) = ${dice.toFixed(3)}이다. 오른쪽: Dice = 2·IoU / (1 + IoU)라서 두 지표는 같은 순서로 움직이고 Dice가 항상 IoU 이상이다(대각선 위). 둘 다 겹친 부분만으로 계산하므로, 배경이 99%인 영상에서 '전부 배경'만 답하면 픽셀 정확도는 99%여도 Dice는 0이다.`}
      viewBox="0 0 720 230"
      minWidth={580}
    >
      {Array.from({ length: R }, (_, r) =>
        Array.from({ length: C }, (_, c) => {
          const A_ = inA(r, c);
          const B_ = inB(r, c);
          return <rect key={`${r}-${c}`} x={30 + c * cell} y={24 + r * cell} width={cell} height={cell} fill={A_ && B_ ? colors.violet : B_ ? colors.orange : A_ ? colors.blue : card2Bg} fillOpacity={A_ && B_ ? 0.55 : A_ || B_ ? 0.25 : 1} stroke="var(--border-hairline)" strokeWidth={0.6} />;
        }),
      )}
      <rect x={30 + 1 * cell} y={24 + 1 * cell} width={6 * cell} height={5 * cell} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <rect x={30 + 2 * cell} y={24 + 2 * cell} width={6 * cell} height={5 * cell} fill="none" stroke={colors.orange} strokeWidth={2.4} strokeDasharray="5 3" />
      <Lines x={30} y={180} lines={[`|A| = ${a}, |B| = ${b}, |A ∩ B| = ${both}`, `IoU = ${iou.toFixed(2)}   Dice = ${dice.toFixed(3)}`]} size={11} anchor="start" color={ink} weight={700} gap={1.6} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="IoU" yLabel="Dice" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="4 3" />
      <path d={linePath(sample((u) => (2 * u) / (1 + u), 0, 1, 80).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <circle cx={sx(iou)} cy={sy(dice)} r={5} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
      <text x={sx(iou) + 8} y={sy(dice) + 14} fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`(${iou.toFixed(2)}, ${dice.toFixed(3)})`}
      </text>
      <Lines x={628} y={60} lines={["Dice =", "2·IoU / (1 + IoU)", "", "순위는 같고", "Dice ≥ IoU"]} size={10.5} anchor="start" color={ink} weight={600} />
    </DiagramFrame>
  );
}

export function Im2col() {
  // 본문 코드: 5×5 입력(0~24), 3×3 커널 [[1,0,−1]]×3. 창 9개를 한 줄씩 편 (9, 9) 행렬 @ 커널(9) = 9개 → 3×3, 모두 −6.
  const P = "i2c";
  const x0 = 22;
  const y0 = 44;
  const c = 24;
  const wins = [
    { r: 0, col: 0, color: colors.blue },
    { r: 1, col: 2, color: colors.orange },
  ];
  const mx = 214;
  const mc = 15;
  const kern = [1, 0, -1, 1, 0, -1, 1, 0, -1];
  const rowOf = (r: number, col: number) => r * 3 + col;
  const winVals = (r: number, col: number) => [0, 1, 2].flatMap((a) => [0, 1, 2].map((b) => (r + a) * 5 + col + b));
  const hl = (row: number) => wins.find((w) => rowOf(w.r, w.col) === row)?.color;
  const fmt = (v: number) => (v < 0 ? `−${-v}` : String(v));
  return (
    <DiagramFrame
      title="im2col: 합성곱을 행렬 곱 한 번으로 바꾼다"
      caption="본문 코드의 5 × 5 입력(0~24)과 3 × 3 커널이다. 왼쪽: 커널이 지나가는 3 × 3 창은 9개다(파랑은 첫 창, 주황은 둘째 줄 셋째 창). 가운데: 창 하나를 한 줄(원소 9개)로 펴서 9줄을 쌓으면 (9, 9) im2col 행렬이 된다. 같은 픽셀이 여러 줄에 중복 복사되는 것이 메모리 비용이다. 오른쪽: 커널도 길이 9인 벡터로 펴서 행렬-벡터 곱을 한 번 하면 9개 값이 나오고, 3 × 3으로 접으면 이중 반복문의 결과와 같다. 입력이 연속된 숫자라 모든 창에서 '왼쪽 열 − 오른쪽 열'이 −6이다. 채널이 있으면 커널 벡터가 (K²C_in × C_out) 가중치 행렬이 되어, GPU가 가장 잘하는 거대한 행렬 곱 하나가 된다."
      viewBox="0 0 720 262"
      minWidth={640}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, ink: inkMuted }} />
      <text x={x0} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        입력 5 × 5
      </text>
      {Array.from({ length: 25 }, (_, v) => {
        const r = Math.floor(v / 5);
        const q = v % 5;
        return (
          <g key={v}>
            <rect x={x0 + q * c} y={y0 + r * c} width={c} height={c} fill="none" stroke={inkMuted} strokeOpacity={0.6} />
            <text x={x0 + q * c + c / 2} y={y0 + r * c + 16} textAnchor="middle" fontSize={10} fill={ink} fontFamily={mono}>
              {v}
            </text>
          </g>
        );
      })}
      {wins.map((w) => (
        <rect key={w.col} x={x0 + w.col * c + 1.5} y={y0 + w.r * c + 1.5} width={3 * c - 3} height={3 * c - 3} fill={w.color} fillOpacity={0.12} stroke={w.color} strokeWidth={2.2} />
      ))}
      <text x={x0} y={196} fontSize={10.5} fontWeight={700} fill={ink}>
        커널 3 × 3
      </text>
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((q) => (
          <g key={`k${r}${q}`}>
            <rect x={x0 + q * 20} y={204 + r * 18} width={20} height={18} fill={colors.violet} fillOpacity={0.12} stroke={colors.violet} strokeOpacity={0.6} />
            <text x={x0 + q * 20 + 10} y={204 + r * 18 + 13} textAnchor="middle" fontSize={9.5} fill={ink} fontFamily={mono}>
              {fmt(kern[r * 3 + q])}
            </text>
          </g>
        )),
      )}
      <ArrPath d={`M${x0 + 3 * c + 4},${y0 + 20} C${x0 + 3 * c + 40},${y0 + 10} ${mx - 40},${y0 + 4} ${mx - 4},${y0 + 7}`} color={colors.blue} marker={`${P}-blue`} width={1.4} />
      <ArrPath d={`M${x0 + 5 * c + 4},${y0 + c + 30} C${x0 + 5 * c + 30},${y0 + c + 30} ${mx - 30},${y0 + 5 * mc + 8} ${mx - 4},${y0 + 5 * mc + 8}`} color={colors.orange} marker={`${P}-orange`} width={1.4} />
      <text x={mx} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        im2col 행렬 (창 9개 × 원소 9개)
      </text>
      {Array.from({ length: 9 }, (_, row) => {
        const vals = winVals(Math.floor(row / 3), row % 3);
        const color = hl(row);
        return (
          <g key={row}>
            {color && <rect x={mx} y={y0 + row * mc} width={9 * mc + 9 * 2} height={mc} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={1.4} />}
            {vals.map((v, j) => (
              <text key={j} x={mx + j * (mc + 2) + 8} y={y0 + row * mc + 11} textAnchor="middle" fontSize={8.5} fill={color ? ink : inkSecondary} fontWeight={color ? 800 : 400} fontFamily={mono}>
                {v}
              </text>
            ))}
          </g>
        );
      })}
      <rect x={mx} y={y0} width={9 * (mc + 2)} height={9 * mc} fill="none" stroke={inkMuted} />
      <text x={mx + 9 * (mc + 2) + 12} y={y0 + 4.5 * mc + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill={ink}>
        @
      </text>
      {kern.map((v, j) => (
        <g key={j}>
          <rect x={mx + 9 * (mc + 2) + 26} y={y0 + j * mc} width={22} height={mc} fill={colors.violet} fillOpacity={0.12} stroke={colors.violet} strokeOpacity={0.6} />
          <text x={mx + 9 * (mc + 2) + 37} y={y0 + j * mc + 11} textAnchor="middle" fontSize={8.5} fill={ink} fontFamily={mono}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={mx + 9 * (mc + 2) + 64} y={y0 + 4.5 * mc + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill={ink}>
        =
      </text>
      {Array.from({ length: 9 }, (_, j) => {
        const color = hl(j);
        return (
          <g key={j}>
            <rect x={mx + 9 * (mc + 2) + 78} y={y0 + j * mc} width={24} height={mc} fill={color ?? inkMuted} fillOpacity={color ? 0.2 : 0.08} stroke={color ?? inkMuted} strokeOpacity={0.7} />
            <text x={mx + 9 * (mc + 2) + 90} y={y0 + j * mc + 11} textAnchor="middle" fontSize={8.5} fill={ink} fontWeight={800} fontFamily={mono}>
              −6
            </text>
          </g>
        );
      })}
      <Arr x1={mx + 9 * (mc + 2) + 108} y1={y0 + 4.5 * mc} x2={mx + 9 * (mc + 2) + 134} y2={y0 + 4.5 * mc} color={inkMuted} marker={`${P}-ink`} />
      <text x={mx + 9 * (mc + 2) + 121} y={y0 + 4.5 * mc - 8} textAnchor="middle" fontSize={9} fill={inkSecondary}>
        접기
      </text>
      {Array.from({ length: 9 }, (_, j) => {
        const color = hl(j);
        const ox = mx + 9 * (mc + 2) + 140;
        return (
          <g key={`o${j}`}>
            <rect x={ox + (j % 3) * 28} y={y0 + 36 + Math.floor(j / 3) * 22} width={28} height={22} fill={color ?? inkMuted} fillOpacity={color ? 0.2 : 0.06} stroke={color ?? inkMuted} strokeOpacity={0.7} />
            <text x={ox + (j % 3) * 28 + 14} y={y0 + 36 + Math.floor(j / 3) * 22 + 15} textAnchor="middle" fontSize={10} fill={ink} fontWeight={800} fontFamily={mono}>
              −6
            </text>
          </g>
        );
      })}
      <text x={mx + 9 * (mc + 2) + 182} y={y0 + 28} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
        출력 3 × 3
      </text>
      <Lines x={mx} y={y0 + 9 * mc + 26} lines={["채널이 있으면: (창 수 × K²·C_in) @ (K²·C_in × C_out)", "메모리 약 K²배를 내주고, 최적화된 행렬 곱(GEMM) 하나를 얻는다"]} size={10.5} anchor="start" color={inkSecondary} weight={600} gap={1.55} />
    </DiagramFrame>
  );
}

export function ConvBackprop1d() {
  // 1차원 예: x₁…x₅ ⋆ (k₁, k₂, k₃) = y₁…y₃, yᵢ = xᵢk₁ + xᵢ₊₁k₂ + xᵢ₊₂k₃. 위에서 내려온 기울기 G₁…G₃.
  // ∂L/∂x₃ = G₁k₃ + G₂k₂ + G₃k₁: 0을 두 칸씩 덧댄 G를 뒤집은 커널(k₃, k₂, k₁)로 합성곱(full).
  const P = "cbp";
  const kc = [colors.blue, colors.orange, colors.green];
  const panel = (ox: number, back: boolean) => {
    const X = (j: number) => ox + 20 + j * 46;
    const yTop = 62;
    const yBot = 168;
    return (
      <g>
        {[0, 1, 2].flatMap((i) =>
          [0, 1, 2].map((a) => {
            const strong = back && i + a === 2;
            const x1 = X(i + 1);
            const x2 = X(i + a);
            return back ? (
              <Arr key={`${i}${a}`} x1={x1} y1={yTop + 12} x2={x2 + (x1 - x2) * 0.12} y2={yBot - 14} color={kc[a]} marker={`${P}-${["blue", "orange", "green"][a]}`} width={strong ? 2.6 : 1.1} />
            ) : (
              <Arr key={`${i}${a}`} x1={x2} y1={yBot - 12} x2={x1 + (x2 - x1) * 0.12} y2={yTop + 14} color={kc[a]} marker={`${P}-${["blue", "orange", "green"][a]}`} width={1.4} />
            );
          }),
        )}
        {[0, 1, 2].map((i) => (
          <g key={`t${i}`}>
            <circle cx={X(i + 1)} cy={yTop} r={12} fill={back ? colors.red : colors.violet} fillOpacity={0.15} stroke={back ? colors.red : colors.violet} strokeWidth={1.5} />
            <text x={X(i + 1)} y={yTop + 4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
              {back ? `G${"₁₂₃"[i]}` : `y${"₁₂₃"[i]}`}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((j) => (
          <g key={`b${j}`}>
            <circle cx={X(j)} cy={yBot} r={12} fill={back && j === 2 ? colors.red : inkMuted} fillOpacity={back && j === 2 ? 0.2 : 0.12} stroke={back && j === 2 ? colors.red : inkMuted} strokeWidth={1.5} />
            <text x={X(j)} y={yBot + 4} textAnchor="middle" fontSize={back ? 9.5 : 10.5} fontWeight={800} fill={ink}>
              {back ? `∂x${"₁₂₃₄₅"[j]}` : `x${"₁₂₃₄₅"[j]}`}
            </text>
          </g>
        ))}
      </g>
    );
  };
  const cells = (ox: number, y: number, labels: string[], color: string, hlFrom = -1, hlTo = -1) =>
    labels.map((l, i) => (
      <g key={i}>
        <rect x={ox + i * 30} y={y} width={30} height={22} fill={i >= hlFrom && i <= hlTo ? color : inkMuted} fillOpacity={i >= hlFrom && i <= hlTo ? 0.18 : 0.06} stroke={i >= hlFrom && i <= hlTo ? color : inkMuted} strokeOpacity={0.7} />
        <text x={ox + i * 30 + 15} y={y + 15} textAnchor="middle" fontSize={10} fontWeight={700} fill={l === "0" ? inkSecondary : ink}>
          {l}
        </text>
      </g>
    ));
  return (
    <DiagramFrame
      title="합성곱의 역전파도 합성곱이다: 뒤집은 커널과 전치 합성곱"
      caption="1차원으로 그린 합성곱이다(색은 커널 가중치 k₁·k₂·k₃). 왼쪽: 순전파에서 출력 yᵢ는 입력 세 칸을 커널로 가중합한다. 가운데: 역전파에서는 같은 연결을 거꾸로 지나 기울기 G가 입력으로 돌아간다. 가운데 입력 x₃은 y₁에는 k₃로, y₂에는 k₂로, y₃에는 k₁로 기여했으므로 ∂L/∂x₃ = G₁k₃ + G₂k₂ + G₃k₁이다. 오른쪽: 이것은 G 양옆에 0을 K − 1 = 2칸씩 덧대고 커널을 180° 뒤집은 (k₃, k₂, k₁)로 합성곱한 것(full 합성곱)과 같다. 3칸에서 5칸으로 커지는 이 연산을 층으로 쓴 것이 전치 합성곱이다. 커널의 기울기 ∂L/∂k는 입력 x와 G의 합성곱으로 계산된다."
      viewBox="0 0 720 256"
      minWidth={640}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, green: colors.green }} />
      <text x={20} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        순전파: y = x ⋆ k
      </text>
      {panel(0, false)}
      <text x={250} y={24} fontSize={11.5} fontWeight={800} fill={colors.red}>
        역전파: 같은 연결을 거꾸로
      </text>
      {panel(230, true)}
      <text x={342} y={204} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.red}>
        ∂L/∂x₃ = G₁k₃ + G₂k₂ + G₃k₁
      </text>
      {[0, 1, 2].map((a) => (
        <g key={a}>
          <line x1={22 + a * 70} x2={40 + a * 70} y1={232} y2={232} stroke={kc[a]} strokeWidth={2.4} />
          <text x={44 + a * 70} y={236} fontSize={10} fontWeight={700} fill={kc[a]}>
            {`k${"₁₂₃"[a]}`}
          </text>
        </g>
      ))}
      <line x1={476} y1={14} x2={476} y2={244} stroke="var(--border-hairline)" />
      <text x={492} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        = 뒤집은 커널로 full 합성곱
      </text>
      <text x={492} y={52} fontSize={10} fill={inkSecondary}>
        G 양옆에 0을 2칸씩
      </text>
      {cells(492, 60, ["0", "0", "G₁", "G₂", "G₃", "0", "0"], colors.red, 2, 4)}
      <text x={492} y={106} fontSize={10} fill={inkSecondary}>
        뒤집은 커널 (∂x₃ 자리)
      </text>
      {cells(492 + 60, 114, ["k₃", "k₂", "k₁"], colors.violet, 0, 2)}
      <text x={492} y={160} fontSize={10} fill={inkSecondary}>
        결과: 3칸 → 5칸
      </text>
      {cells(492 + 15, 168, ["∂x₁", "∂x₂", "∂x₃", "∂x₄", "∂x₅"], colors.red, 2, 2)}
      <Lines x={492} y={214} lines={["이 연산을 층으로 쓰면 전치 합성곱", "∂L/∂k = x ⋆ G (입력과 기울기의 합성곱)"]} size={10} anchor="start" color={ink} weight={700} gap={1.55} />
    </DiagramFrame>
  );
}

export function DepthwiseSeparable() {
  // C_in = 32, C_out = 64, K = 3. 표준: 9·32·64 = 18,432. depthwise 9·32 = 288 + pointwise 32·64 = 2,048 → 2,336(약 7.9분의 1).
  const cin = 32;
  const cout = 64;
  const K = 3;
  const std = K * K * cin * cout;
  const dw = K * K * cin;
  const pw = cin * cout;
  const cube = (x: number, y: number, f: number, d: number, color: string, op = 0.25) => {
    const dx = d * 0.7;
    const dy = d * 0.45;
    return (
      <g>
        <path d={`M${x},${y} L${x + dx},${y - dy} L${x + dx + f},${y - dy} L${x + f},${y} Z`} fill={color} fillOpacity={op * 0.7} stroke={color} strokeWidth={1} />
        <path d={`M${x + f},${y} L${x + dx + f},${y - dy} L${x + dx + f},${y - dy + f} L${x + f},${y + f} Z`} fill={color} fillOpacity={op * 1.2} stroke={color} strokeWidth={1} />
        <rect x={x} y={y} width={f} height={f} fill={color} fillOpacity={op} stroke={color} strokeWidth={1.2} />
      </g>
    );
  };
  const by = linear(0, 20000, 214, 54);
  return (
    <DiagramFrame
      title="depthwise separable 합성곱: 공간과 채널을 나눠 파라미터를 8분의 1로"
      caption="입력 채널 32개, 출력 채널 64개, 3 × 3 커널의 예다. 위: 표준 합성곱은 출력 채널마다 3 × 3 × 32 크기의 필터 하나(공간 패턴과 채널 섞기를 한 번에)를 두므로 9 × 32 × 64 = 18,432개다. 아래: MobileNet의 depthwise separable은 두 단계로 나눈다. ① depthwise: 채널마다 3 × 3 필터 하나씩, 채널끼리는 섞지 않는다(9 × 32 = 288). ② pointwise: 1 × 1 × 32 필터 64개로 채널만 섞는다(32 × 64 = 2,048). 합계 2,336개로 약 7.9분의 1이고, 비율은 1/C_out + 1/K² = 1/64 + 1/9 ≈ 0.127이다. 연산량도 같은 비율로 준다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <text x={20} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        표준 합성곱: 필터 64개, 각각 3 × 3 × 32
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>{cube(28 + i * 74, 62, 26, 46, colors.violet)}</g>
      ))}
      <text x={326} y={84} fontSize={14} fontWeight={800} fill={inkSecondary}>
        … × 64
      </text>
      <line x1={14} x2={400} y1={110} y2={110} stroke="var(--border-hairline)" />
      <text x={20} y={130} fontSize={11.5} fontWeight={800} fill={ink}>
        ① depthwise: 채널마다 3 × 3 하나 (32개)
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>{cube(28 + i * 40, 150, 26, 3, [colors.blue, colors.orange, colors.green, colors.red, colors.aqua, colors.magenta][i])}</g>
      ))}
      <text x={276} y={170} fontSize={14} fontWeight={800} fill={inkSecondary}>
        … × 32
      </text>
      <text x={20} y={206} fontSize={11.5} fontWeight={800} fill={ink}>
        ② pointwise: 1 × 1 × 32 필터 64개
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>{cube(28 + i * 60, 236, 9, 46, colors.aqua)}</g>
      ))}
      <text x={276} y={248} fontSize={14} fontWeight={800} fill={inkSecondary}>
        … × 64
      </text>
      <line x1={420} y1={14} x2={420} y2={248} stroke="var(--border-hairline)" />
      <text x={436} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        파라미터 수
      </text>
      <line x1={440} x2={706} y1={by(0)} y2={by(0)} stroke={inkMuted} />
      <rect x={470} y={by(std)} width={70} height={by(0) - by(std)} rx={3} fill={colors.violet} fillOpacity={0.55} />
      <text x={505} y={by(std) - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        {std.toLocaleString("en-US")}
      </text>
      <rect x={600} y={by(dw + pw)} width={70} height={by(0) - by(pw)} rx={3} fill={colors.aqua} fillOpacity={0.6} />
      <rect x={600} y={by(dw)} width={70} height={by(0) - by(dw)} rx={0} fill={colors.blue} fillOpacity={0.7} />
      <text x={635} y={by(dw + pw) - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        {(dw + pw).toLocaleString("en-US")}
      </text>
      <text x={505} y={by(0) + 16} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        표준
      </text>
      <text x={635} y={by(0) + 16} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        depthwise + pointwise
      </text>
      <Lines x={600} y={90} lines={[`depthwise ${dw}`, `pointwise ${pw.toLocaleString("en-US")}`]} size={10} anchor="start" color={ink} weight={700} gap={1.45} />
      <text x={570} y={52} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.green}>
        {`약 ${(std / (dw + pw)).toFixed(1)}분의 1`}
      </text>
    </DiagramFrame>
  );
}

export function VggParamsFlops() {
  // VGG16(224 × 224 입력)의 블록별 파라미터 수와 곱셈-덧셈(MAC) 수를 직접 센 값. 합계 138.4M 파라미터, 15.5G MAC.
  const blocks = [
    { t: "블록 1", res: "224²", p: 38720, m: 1936392192, c: colors.blue },
    { t: "블록 2", res: "112²", p: 221440, m: 2774532096, c: colors.aqua },
    { t: "블록 3", res: "56²", p: 1475328, m: 4624220160, c: colors.green },
    { t: "블록 4", res: "28²", p: 5899776, m: 4624220160, c: colors.yellow },
    { t: "블록 5", res: "14²", p: 7079424, m: 1387266048, c: colors.orange },
    { t: "FC 3층", res: "", p: 123642856, m: 123633664, c: colors.red },
  ];
  const tp = blocks.reduce((s, b) => s + b.p, 0);
  const tm = blocks.reduce((s, b) => s + b.m, 0);
  const x0 = 110;
  const W = 590;
  const bar = (y: number, key: "p" | "m", total: number) => {
    let acc = 0;
    return blocks.map((b) => {
      const w = (b[key] / total) * W;
      const x = x0 + acc;
      acc += w;
      const pct = (b[key] / total) * 100;
      return (
        <g key={b.t}>
          <rect x={x} y={y} width={Math.max(w, 0.8)} height={34} fill={b.c} fillOpacity={0.7} />
          {w > 36 && (
            <text x={x + w / 2} y={y + 21} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
              {`${pct.toFixed(pct < 10 ? 1 : 0)}%`}
            </text>
          )}
        </g>
      );
    });
  };
  return (
    <DiagramFrame
      title="VGG16: 파라미터는 FC층에, 연산은 해상도 큰 앞쪽 합성곱층에"
      caption="224 × 224 이미지를 넣은 VGG16의 블록별 비중을 직접 센 것이다(전체 1억 3,800만 파라미터, 곱셈-덧셈 155억 번). 위: 파라미터의 89%가 마지막 FC 3층에 있고, 합성곱 블록 1~2는 0.2%에 불과하다. 아래: 연산은 정반대다. 해상도가 큰 블록 1~4가 90% 가까이를 차지하고 FC층은 1%도 안 된다. 합성곱의 파라미터 수(K²·C_in·C_out)는 입력 크기와 무관하지만 연산량은 출력 해상도 H × W에 비례하기 때문이다. 그래서 모델을 가볍게 할 때 메모리를 줄이려면 FC층을, 속도를 높이려면 앞쪽 합성곱층을 손본다."
      viewBox="0 0 720 220"
      minWidth={600}
    >
      <text x={x0 - 10} y={58} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
        파라미터
      </text>
      <text x={x0 - 10} y={72} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
        138.4M
      </text>
      {bar(42, "p", tp)}
      <text x={x0 - 10} y={136} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
        연산(MAC)
      </text>
      <text x={x0 - 10} y={150} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
        15.5G
      </text>
      {bar(120, "m", tm)}
      {blocks.map((b, i) => (
        <g key={b.t}>
          <rect x={x0 + i * 98} y={182} width={12} height={12} fill={b.c} fillOpacity={0.7} />
          <text x={x0 + i * 98 + 16} y={192} fontSize={10.5} fontWeight={700} fill={ink}>
            {b.t}
          </text>
          {b.res && (
            <text x={x0 + i * 98 + 16} y={206} fontSize={9.5} fill={inkSecondary}>
              {`해상도 ${b.res}`}
            </text>
          )}
        </g>
      ))}
      <text x={x0} y={26} fontSize={10.5} fill={inkSecondary}>
        왼쪽(입력 쪽) → 오른쪽(출력 쪽) 순서로 쌓은 비중
      </text>
    </DiagramFrame>
  );
}

export function ElboGap() {
  // 정확히 계산되는 예: p(z) = N(0, 1), p(x | z) = N(z, 0.5²), 관측 x = 1.5. 진짜 사후분포 p(z | x) = N(1.2, 0.2), log p(x) = −1.931.
  // q = N(μ, s²)일 때 ELBO = E_q[log p(x | z)] − KL(q ‖ p(z)), log p(x) − ELBO = KL(q ‖ p(z | x)).
  const npdf = (z: number, m: number, s: number) => Math.exp(-((z - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
  const x = 1.5;
  const logpx = -0.5 * Math.log(2 * Math.PI * 1.25) - (x * x) / (2 * 1.25);
  const ell = (m: number, s: number) => -0.5 * Math.log(2 * Math.PI * 0.25) - ((x - m) ** 2 + s * s) / 0.5;
  const klPrior = (m: number, s: number) => 0.5 * (m * m + s * s - 1 - Math.log(s * s));
  const qs = [
    { t: "q₁ = N(0, 1²) (사전분포 그대로)", m: 0, s: 1, c: colors.blue },
    { t: "q₂ = N(0.8, 0.6²)", m: 0.8, s: 0.6, c: colors.orange },
    { t: "q₃ = N(1.2, 0.45²) (진짜 사후분포)", m: 1.2, s: Math.sqrt(0.2), c: colors.violet },
  ].map((q) => ({ ...q, rec: ell(q.m, q.s), kl: klPrior(q.m, q.s), elbo: ell(q.m, q.s) - klPrior(q.m, q.s) }));
  const G = { left: 40, top: 30, width: 260, height: 160 };
  const sx = linear(-3, 3.5, G.left, G.left + G.width);
  const sy = linear(0, 0.95, G.top + G.height, G.top);
  const curve = (m: number, s: number) => linePath(sample((z) => npdf(z, m, s), -3, 3.5, 200).map(([a, b]) => [sx(a), sy(b)] as [number, number]));
  const nx = linear(-7.2, -1.2, 378, 700);
  const m2 = (v: number) => v.toFixed(2).replace("-", "−");
  return (
    <DiagramFrame
      title="ELBO: 로그가능도의 하한, 간극은 정확히 KL(q ‖ 진짜 사후분포)"
      caption="정확히 계산되는 작은 예다. 잠재변수 z ~ N(0, 1)에서 x ~ N(z, 0.5²)가 나오는 모델에서 x = 1.5를 관측하면 진짜 사후분포는 N(1.2, 0.2)이고 log p(x) = −1.93이다. 왼쪽: 인코더가 고를 수 있는 근사 분포 q 세 가지다. 오른쪽: 각 q의 ELBO = (복원 항) − KL(q ‖ 사전분포)를 계산해 log p(x)와 비교했다. 사전분포를 그대로 쓰는 q₁은 복원을 못 해 ELBO가 −6.73으로 4.80 모자라고, q₂는 0.51 모자라며, 진짜 사후분포인 q₃에서 간극이 0이 되어 ELBO가 log p(x)와 같아진다. 모자란 양은 정확히 KL(q ‖ p(z | x))이므로, ELBO를 키우는 것은 인코더를 진짜 사후분포에 가깝게 만드는 일이다."
      viewBox="0 0 720 252"
      minWidth={640}
    >
      <text x={G.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        잠재변수 z의 분포 (x = 1.5를 관측)
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[-3, -2, -1, 0, 1, 2, 3]} yTicks={[]} fmtX={(v) => String(v).replace("-", "−")} xLabel="z" />
      <path d={`${curve(1.2, Math.sqrt(0.2))} L${sx(3.5)},${sy(0)} L${sx(-3)},${sy(0)} Z`} fill={colors.violet} fillOpacity={0.15} />
      <path d={curve(1.2, Math.sqrt(0.2))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <path d={curve(0, 1)} fill="none" stroke={colors.blue} strokeWidth={2} strokeDasharray="6 3" />
      <path d={curve(0.8, 0.6)} fill="none" stroke={colors.orange} strokeWidth={2} />
      <text x={sx(1.2) + 22} y={sy(0.86)} fontSize={10} fontWeight={800} fill={colors.violet}>
        진짜 사후분포 p(z | x) = q₃
      </text>
      <text x={sx(-2.9)} y={sy(0.45)} fontSize={10} fontWeight={800} fill={colors.blue}>
        q₁ = 사전분포
      </text>
      <text x={sx(-0.9)} y={sy(0.62)} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.orange}>
        q₂
      </text>
      <line x1={354} y1={14} x2={354} y2={238} stroke="var(--border-hairline)" />
      <text x={370} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        ELBO와 log p(x)의 간극
      </text>
      <line x1={nx(-7.2)} x2={nx(-1.2)} y1={206} y2={206} stroke={inkMuted} />
      {[-7, -6, -5, -4, -3, -2].map((t) => (
        <text key={t} x={nx(t)} y={220} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {`−${-t}`}
        </text>
      ))}
      <line x1={nx(logpx)} x2={nx(logpx)} y1={34} y2={206} stroke={colors.violet} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={nx(logpx) - 4} y={236} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.violet}>
        {`log p(x) = ${m2(logpx)}`}
      </text>
      {qs.map((q, i) => {
        const y = 54 + i * 52;
        const gap = logpx - q.elbo;
        return (
          <g key={q.t}>
            <text x={370} y={y - 10} fontSize={10} fontWeight={800} fill={q.c}>
              {q.t}
            </text>
            {gap > 0.01 && <line x1={nx(q.elbo)} x2={nx(logpx)} y1={y + 4} y2={y + 4} stroke={colors.red} strokeWidth={6} strokeOpacity={0.3} />}
            <circle cx={nx(q.elbo)} cy={y + 4} r={5} fill={q.c} />
            <text x={nx(q.elbo) + (gap > 1 ? 8 : -8)} y={y + 22} textAnchor={gap > 1 ? "start" : "end"} fontSize={9.5} fill={inkSecondary}>
              {`ELBO = 복원 ${m2(q.rec)} − KL ${q.kl.toFixed(2)} = ${m2(q.elbo)}`}
            </text>
            {gap > 0.01 && (
              <text x={gap > 1 ? (nx(q.elbo) + nx(logpx)) / 2 : nx(q.elbo) - 10} y={gap > 1 ? y : y + 8} textAnchor={gap > 1 ? "middle" : "end"} fontSize={9.5} fontWeight={800} fill={colors.red}>
                {`간극 ${gap.toFixed(2)}`}
              </text>
            )}
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function VaeKlCurves() {
  // KL(N(μ, σ²) ‖ N(0, 1)) = ½(μ² + σ² − 1 − log σ²). 본문 표: (0, 1) → 0, (1, 1) → 0.5, (2, 1) → 2, (0, 0.5) → 0.318, (0, 2) → 0.807.
  const kl = (m: number, s: number) => 0.5 * (m * m + s * s - 1 - Math.log(s * s));
  const L = { left: 52, top: 30, width: 270, height: 170 };
  const R = { left: 420, top: 30, width: 270, height: 170 };
  const lx = linear(-2.5, 2.5, L.left, L.left + L.width);
  const ly = linear(0, 3.2, L.top + L.height, L.top);
  const rx = linear(0, 3, R.left, R.left + R.width);
  const ry = linear(0, 3.2, R.top + R.height, R.top);
  const dot = (x: number, y: number, label: string, anchor: "start" | "end" = "start") => (
    <g>
      <circle cx={x} cy={y} r={4.5} fill={colors.red} stroke="var(--surface-card)" strokeWidth={1.5} />
      <text x={x + (anchor === "start" ? 8 : -8)} y={y - 6} textAnchor={anchor} fontSize={10} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="VAE의 KL 항: 평균은 원점으로, 분산은 1로 끌어당긴다"
      caption="인코더가 내놓은 N(μ, σ²)와 사전분포 N(0, 1) 사이의 KL 발산 ½(μ² + σ² − 1 − log σ²)를 한 변수씩 바꿔 그렸다. 점은 본문 표의 값이다. 왼쪽: σ = 1로 두면 KL = ½μ²라, 평균이 원점에서 멀어질수록 제곱으로 벌점이 커진다. 오른쪽: μ = 0으로 두면 σ = 1에서 0이고, 분산이 너무 커져도 벌점을 받지만 σ → 0 쪽은 −log σ² 때문에 끝없이 커진다. KL 항이 없다면 인코더는 분산을 0으로 줄여(점 하나로 인코딩) VAE를 일반 오토인코더로 되돌린다. 이 벽이 그것을 막는다."
      viewBox="0 0 720 248"
      minWidth={600}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        σ = 1로 두고 μ를 바꾸면: ½μ²
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[-2, -1, 0, 1, 2]} yTicks={[0, 1, 2, 3]} fmtX={(v) => String(v).replace("-", "−")} xLabel="평균 μ" yLabel="KL" />
      <path d={linePath(sample((m) => kl(m, 1), -2.5, 2.5, 160).map(([a, b]) => [lx(a), ly(b)] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      {dot(lx(0), ly(0), "(0, 1) → 0")}
      {dot(lx(1), ly(0.5), "(1, 1) → 0.5")}
      {dot(lx(2), ly(2), "(2, 1) → 2.0", "end")}
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        μ = 0으로 두고 σ를 바꾸면
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} yTicks={[0, 1, 2, 3]} xLabel="표준편차 σ" />
      <path d={linePath(sample((s) => Math.min(kl(0, s), 3.4), 0.06, 3, 240).map(([a, b]) => [rx(a), ry(b)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      {dot(rx(0.5), ry(kl(0, 0.5)), "(0, 0.5) → 0.318")}
      {dot(rx(1), ry(0), "(0, 1) → 0")}
      {dot(rx(2), ry(kl(0, 2)), "(0, 2) → 0.807", "end")}
      <Lines x={rx(0.18)} y={ry(2.95)} lines={["σ → 0: −log σ² 때문에", "끝없이 커지는 벽"]} size={10} anchor="start" color={colors.orange} weight={800} gap={1.35} />
    </DiagramFrame>
  );
}

export function Reparameterization() {
  // 오른쪽: ∂/∂μ E_{z~N(μ,1)}[z²]를 μ = 1에서 표본 하나로 추정(참값 2μ = 2). 재매개변수화 2(μ + ε)의 표준편차는 2,
  // 점수 함수 추정 z²(z − μ) = ε + 2ε² + ε³의 표준편차는 √30 ≈ 5.5(이론값). 히스토그램은 시드 고정 표본 4000개.
  const P = "rpm";
  const rand = seeded(11);
  const N = 4000;
  const rep: number[] = [];
  const sf: number[] = [];
  for (let i = 0; i < N; i++) {
    const e = gaussian(rand);
    rep.push(2 * (1 + e));
    sf.push((1 + e) ** 2 * e);
  }
  const lo = -12;
  const hi = 18;
  const hist = (v: number[]) => {
    const h = Array.from({ length: hi - lo }, () => 0);
    v.forEach((a) => {
      const k = Math.floor(a - lo);
      if (k >= 0 && k < h.length) h[k]++;
    });
    return h;
  };
  const hr = hist(rep);
  const hs = hist(sf);
  const G = { left: 430, top: 34, width: 270, height: 150 };
  const sx = linear(lo, hi, G.left, G.left + G.width);
  const sy = linear(0, Math.max(...hr, ...hs) * 1.08, G.top + G.height, G.top);
  const box = (x: number, y: number, w: number, label: string, color: string) => <Tag x={x} y={y} w={w} h={28} lines={[label]} color={color} size={10.5} />;
  const oval = (cx: number, cy: number, rx: number, label: string, color: string) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={15} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
        {label}
      </text>
    </g>
  );
  const chain = (y: number, ok: boolean) => (
    <g>
      {box(14, y, 40, "x", inkMuted)}
      <Arr x1={56} y1={y + 14} x2={68} y2={y + 14} color={inkMuted} marker={`${P}-ink`} />
      {box(70, y, 62, "인코더 φ", colors.blue)}
      <Arr x1={134} y1={y + 14} x2={146} y2={y + 14} color={inkMuted} marker={`${P}-ink`} />
      {box(148, y, 46, "μ, σ", colors.blue)}
      <Arr x1={196} y1={y + 14} x2={208} y2={y + 14} color={inkMuted} marker={`${P}-ink`} />
      {ok ? box(210, y, 86, "z = μ + σ·ε", colors.green) : oval(253, y + 14, 43, "z ~ N(μ, σ²)", colors.red)}
      <Arr x1={298} y1={y + 14} x2={310} y2={y + 14} color={inkMuted} marker={`${P}-ink`} />
      {box(312, y, 66, "디코더·손실", colors.violet)}
    </g>
  );
  return (
    <DiagramFrame
      title="재매개변수화 트릭: 무작위성을 바깥으로 빼서 기울기가 통하게 한다"
      caption="왼쪽 위: 인코더가 낸 μ, σ로 z를 바로 뽑으면 샘플링 노드(점선 타원)는 미분할 수 없는 무작위 연산이라, 손실의 기울기가 인코더로 돌아갈 길이 끊긴다. 왼쪽 아래: z = μ + σ·ε로 쓰고 무작위성은 학습과 무관한 입력 ε ~ N(0, 1)에만 두면, z는 μ와 σ의 평범한 미분 가능한 함수가 되어 역전파가 그대로 통한다(∂z/∂μ = 1, ∂z/∂σ = ε). 오른쪽: 같은 기울기 ∂/∂μ E[z²](z ~ N(μ, 1), μ = 1에서 참값 2)를 표본 하나로 추정한 값의 분포다(4,000번). 둘 다 평균은 2로 편향이 없지만, 재매개변수화 추정 2(μ + ε)는 표준편차가 2인 데 비해 점수 함수 추정(REINFORCE) z²(z − μ)는 √30 ≈ 5.5로 훨씬 넓게, 긴 꼬리를 달고 흩어진다."
      viewBox="0 0 720 262"
      minWidth={640}
    >
      <Markers prefix={P} colors={{ ink: inkMuted, red: colors.red, green: colors.green }} />
      <text x={14} y={20} fontSize={11.5} fontWeight={800} fill={colors.red}>
        그대로 뽑으면: 샘플링에서 기울기가 끊긴다
      </text>
      {chain(34, false)}
      <path d={`M${345},${66} C${330},${92} ${282},${92} ${266},${68}`} fill="none" stroke={colors.red} strokeWidth={1.6} strokeDasharray="4 3" markerEnd={`url(#${P}-red)`} />
      <text x={252} y={102} textAnchor="end" fontSize={11.5} fontWeight={800} fill={colors.red}>
        ✕ 여기서 기울기가 끊긴다
      </text>
      <line x1={10} x2={400} y1={116} y2={116} stroke="var(--border-hairline)" />
      <text x={14} y={136} fontSize={11.5} fontWeight={800} fill={colors.green}>
        재매개변수화: z = μ + σ·ε, 무작위성은 ε에만
      </text>
      <path d={`M${345},${170} C${330},${146} ${190},${146} ${173},${168}`} fill="none" stroke={colors.green} strokeWidth={1.8} strokeDasharray="4 3" markerEnd={`url(#${P}-green)`} />
      {chain(170, true)}
      {oval(253, 236, 40, "ε ~ N(0, 1)", inkMuted)}
      <Arr x1={253} y1={221} x2={253} y2={200} color={inkMuted} marker={`${P}-ink`} />
      <Lines x={14} y={226} lines={["초록 점선: 기울기가", "μ, σ를 거쳐 인코더까지"]} size={10} anchor="start" color={colors.green} weight={800} gap={1.4} />
      <line x1={410} y1={14} x2={410} y2={248} stroke="var(--border-hairline)" />
      <text x={G.left} y={20} fontSize={11} fontWeight={800} fill={ink}>
        기울기 추정값의 분포 (참값 2)
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[-10, -5, 0, 2, 5, 10, 15]} yTicks={[]} fmtX={(v) => String(v).replace("-", "−")} />
      {hs.map((v, k) => (
        <rect key={`s${k}`} x={sx(lo + k) + 0.5} y={sy(v)} width={sx(lo + k + 1) - sx(lo + k) - 1} height={sy(0) - sy(v)} fill={colors.orange} fillOpacity={0.45} />
      ))}
      {hr.map((v, k) => (
        <rect key={`r${k}`} x={sx(lo + k) + 0.5} y={sy(v)} width={sx(lo + k + 1) - sx(lo + k) - 1} height={sy(0) - sy(v)} fill="none" stroke={colors.green} strokeWidth={1.6} />
      ))}
      <line x1={sx(2)} x2={sx(2)} y1={G.top} y2={G.top + G.height} stroke={ink} strokeDasharray="4 3" />
      <rect x={G.left + 150} y={G.top + 6} width={12} height={10} fill="none" stroke={colors.green} strokeWidth={1.6} />
      <text x={G.left + 166} y={G.top + 15} fontSize={10} fontWeight={700} fill={colors.green}>
        재매개변수화 (표준편차 2)
      </text>
      <rect x={G.left + 150} y={G.top + 24} width={12} height={10} fill={colors.orange} fillOpacity={0.45} />
      <text x={G.left + 166} y={G.top + 33} fontSize={10} fontWeight={700} fill={colors.orange}>
        점수 함수 (표준편차 5.5)
      </text>
      <text x={G.left + G.width / 2} y={G.top + G.height + 32} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        표본 하나로 낸 기울기 추정값
      </text>
    </DiagramFrame>
  );
}

const HEART = ["............", "..##....##..", ".####..####.", ".##########.", ".##########.", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............", "............"];

export function DdpmTrainingStep() {
  // DDPM 선형 스케줄(β: 10⁻⁴ → 0.02, T = 1000)에서 t = 250: √ᾱ ≈ 0.72, √(1 − ᾱ) ≈ 0.69. x₀는 12 × 12 하트(값 −1 또는 1).
  const P = "ddp";
  const T = 1000;
  let ab = 1;
  for (let t = 1; t <= 250; t++) ab *= 1 - (1e-4 + ((0.02 - 1e-4) * (t - 1)) / (T - 1));
  const a = Math.sqrt(ab);
  const b = Math.sqrt(1 - ab);
  const x0 = HEART.flatMap((r) => r.split("").map((ch) => (ch === "#" ? 1 : -1)));
  const rand = seeded(5);
  const eps = x0.map(() => gaussian(rand));
  const xt = x0.map((v, i) => a * v + b * eps[i]);
  const c = 7;
  // 값을 [−range, range]에서 회색 33단계(0 검정 ~ 32 흰색)로 나눠 12 × 12 칸으로 그린다.
  const img = (x: number, y: number, vals: number[], range: number) => (
    <g>
      <GridCells
        keys={Array.from({ length: 12 }, (_, r) => vals.slice(r * 12, r * 12 + 12).map((v) => Math.round(((Math.max(-range, Math.min(range, v)) + range) / (2 * range)) * 32)))}
        x={x}
        y={y}
        cw={c}
        crisp
        fill={(k) => {
          const g = Math.round((k / 32) * 255);
          return `rgb(${g},${g},${g})`;
        }}
      />
      <rect x={x} y={y} width={12 * c} height={12 * c} fill="none" stroke={inkMuted} />
    </g>
  );
  const top = 46;
  return (
    <DiagramFrame
      title="확산 모델의 학습 한 스텝: 섞은 노이즈를 맞혀라"
      caption={`DDPM 학습의 한 스텝을 실제 숫자로 따라갔다. ① 데이터 x₀(12 × 12 하트, 값 −1 또는 1)를 고르고 ② 시점 t를 무작위로 고른다(여기서는 t = 250, 선형 스케줄에서 √ᾱ_t ≈ ${a.toFixed(2)}, √(1 − ᾱ_t) ≈ ${b.toFixed(2)}). ③ 표준정규 노이즈 ε을 뽑아 ④ 닫힌 형태 x_t = √ᾱ_t·x₀ + √(1 − ᾱ_t)·ε로 t단계를 한 번에 건너뛴다. ⑤ 신경망은 x_t와 t를 받아 섞인 노이즈를 예측하고, 손실은 정답 ε과의 평균제곱오차다. 노이즈를 정확히 맞히면 x₀ = (x_t − √(1 − ᾱ_t)·ε) / √ᾱ_t로 원본이 그대로 돌아온다(맨 오른쪽, 정답 ε을 넣어 계산). 이 노이즈 예측은 데이터 분포의 점수 ∇ log p(x_t)를 추정하는 것과 같다.`}
      viewBox="0 0 720 236"
      minWidth={640}
    >
      <Markers prefix={P} colors={{ ink: inkMuted, red: colors.red }} />
      <text x={20} y={top - 12} fontSize={10.5} fontWeight={800} fill={ink}>
        ① 데이터 x₀
      </text>
      {img(20, top, x0, 1)}
      <text x={134} y={top - 12} fontSize={10.5} fontWeight={800} fill={ink}>
        ③ 노이즈 ε ~ N(0, I)
      </text>
      {img(134, top, eps, 2.2)}
      <text x={120} y={top + 48} textAnchor="middle" fontSize={16} fontWeight={800} fill={inkSecondary}>
        +
      </text>
      <Arr x1={226} y1={top + 42} x2={262} y2={top + 42} color={inkMuted} marker={`${P}-ink`} />
      <text x={268} y={top - 12} fontSize={10.5} fontWeight={800} fill={ink}>
        ④ x_t (t = 250)
      </text>
      {img(268, top, xt, 2.2)}
      <Lines x={20} y={top + 112} lines={[`x_t = ${a.toFixed(2)}·x₀ + ${b.toFixed(2)}·ε`, "② t는 무작위로 (1 ~ 1000)"]} size={10.5} anchor="start" color={ink} weight={700} gap={1.5} />
      <Arr x1={358} y1={top + 42} x2={386} y2={top + 42} color={inkMuted} marker={`${P}-ink`} />
      <Tag x={388} y={top + 18} w={116} h={48} lines={["⑤ 신경망", "ε_θ(x_t, t)"]} color={colors.violet} size={11} />
      <Arr x1={506} y1={top + 42} x2={530} y2={top + 42} color={inkMuted} marker={`${P}-ink`} />
      <rect x={532} y={top} width={84} height={84} rx={4} fill="none" stroke={colors.violet} strokeDasharray="4 3" />
      <text x={574} y={top + 46} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet}>
        예측 ε̂
      </text>
      <Lines x={446} y={top + 98} lines={["손실 = ‖ε − ε̂‖²", "(정답 ε과의 MSE)"]} size={11} anchor="middle" color={colors.red} weight={800} gap={1.4} />
      <path d={`M${176},${top + 90} C${176},${top + 150} ${560},${top + 150} ${574},${top + 90}`} fill="none" stroke={colors.red} strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={636} y={top - 12} fontSize={10} fontWeight={800} fill={ink}>
        ε을 맞히면 원본
      </text>
      {img(632, top, xt.map((v, i) => (v - b * eps[i]) / a), 1)}
      <text x={674} y={top + 102} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        (x_t − 0.69ε) / 0.72
      </text>
    </DiagramFrame>
  );
}

export function LinearityHypothesis() {
  // 왼쪽: 2차원 예 w = (2, 1). 크기 ε인 L2 걸음(w 방향)은 로짓을 ε‖w‖₂ = 2.24ε, L∞ 상자의 모서리 ε·sign(w)는 ε‖w‖₁ = 3ε 바꾼다.
  // 오른쪽: 본문 코드 출력(ε = 0.01): n = 10 → 0.061 / 0.0044, 1,000 → 7.74 / 0.29, 150,528 → 1,202.9 / 2.25.
  const P = "lin";
  const S = 46;
  const cx = 150;
  const cy = 130;
  const w = [2, 1];
  const nw = Math.hypot(w[0], w[1]);
  const px = (u: number) => cx + u * S;
  const py = (v: number) => cy - v * S;
  const G = { left: 420, top: 30, width: 270, height: 170 };
  const sx = log10Scale(5, 3e5, G.left, G.left + G.width);
  const sy = log10Scale(1e-3, 1e4, G.top + G.height, G.top);
  const pts = [
    [10, 0.0612, 0.00437],
    [1000, 7.739, 0.2939],
    [150528, 1202.9, 2.254],
  ];
  return (
    <DiagramFrame
      title="선형성 가설: 차원이 클수록 '맞춘' 작은 변화가 로짓을 크게 움직인다"
      caption="왼쪽: 선형 로짓 w·x에서 w = (2, 1)인 2차원 예다. 회색 선은 로짓이 같은 등고선이다. 각 좌표를 최대 ε만큼만 바꿀 수 있으면(초록 상자) 로짓을 가장 크게 올리는 곳은 모서리 ε·sign(w)이고, 그 변화량은 ε‖w‖₁ = 3ε로, 같은 크기의 L2 걸음(w 방향, 원 위)의 ε‖w‖₂ ≈ 2.24ε보다 크다. FGSM이 기울기의 부호를 쓰는 이유다. 오른쪽: 본문 코드의 출력이다(ε = 0.01, 두 축 모두 로그 눈금). 부호를 w에 맞춘 노이즈의 효과는 차원 n에 비례해(약 ε·0.8n) 커지지만, 같은 크기의 무작위 부호 노이즈는 서로 상쇄되어 √n에 비례해서만 커진다. 224 × 224 × 3 이미지에서는 픽셀당 0.01의 변화가 로짓을 1,200이나 움직인다."
      viewBox="0 0 720 252"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ red: colors.red, blue: colors.blue }} />
      <text x={20} y={20} fontSize={11.5} fontWeight={800} fill={ink}>
        같은 ε, 다른 방향 (w = (2, 1))
      </text>
      <defs>
        <clipPath id="lin-clip">
          <rect x={20} y={30} width={300} height={210} />
        </clipPath>
      </defs>
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
        const off = (k * 0.5) / nw;
        const d = [-w[1] / nw, w[0] / nw];
        const o = [(w[0] / nw) * off, (w[1] / nw) * off];
        return <line key={k} x1={px(o[0] - 3 * d[0])} y1={py(o[1] - 3 * d[1])} x2={px(o[0] + 3 * d[0])} y2={py(o[1] + 3 * d[1])} stroke={inkMuted} strokeOpacity={0.45} clipPath="url(#lin-clip)" />;
      })}
      <rect x={px(-1)} y={py(1)} width={2 * S} height={2 * S} fill={colors.green} fillOpacity={0.08} stroke={colors.green} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={S} fill="none" stroke={colors.blue} strokeWidth={1.4} strokeDasharray="4 3" />
      <Arr x1={cx} y1={cy} x2={px(w[0] / nw) - 2} y2={py(w[1] / nw) + 2} color={colors.blue} marker={`${P}-blue`} width={2.2} />
      <Arr x1={cx} y1={cy} x2={px(1) - 3} y2={py(1) + 3} color={colors.red} marker={`${P}-red`} width={2.4} />
      <circle cx={cx} cy={cy} r={4} fill={ink} />
      <text x={cx - 8} y={cy + 16} textAnchor="end" fontSize={10} fontWeight={700} fill={ink}>
        x
      </text>
      <text x={px(1) + 6} y={py(1) - 4} fontSize={10} fontWeight={800} fill={colors.red}>
        ε·sign(w): +3ε
      </text>
      <text x={px(w[0] / nw) + 6} y={py(w[1] / nw) + 14} fontSize={10} fontWeight={800} fill={colors.blue}>
        ε·w/‖w‖₂: +2.24ε
      </text>
      <text x={px(-1)} y={py(-1) + 16} fontSize={9.5} fontWeight={700} fill={colors.green}>
        각 좌표 ±ε 상자
      </text>
      <text x={px(1.6)} y={py(-1.6)} fontSize={9.5} fill={inkSecondary}>
        회색: 로짓 등고선
      </text>
      <line x1={330} y1={14} x2={330} y2={240} stroke="var(--border-hairline)" />
      <text x={G.left - 50} y={20} fontSize={11.5} fontWeight={800} fill={ink}>
        본문 코드: 로짓 변화의 크기 (ε = 0.01)
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[10, 100, 1e3, 1e4, 1e5]} yTicks={[1e-3, 1e-1, 10, 1e3]} fmtX={pow10Label} fmtY={pow10Label} xLabel="입력 차원 n (로그 눈금)" />
      <path d={linePath([5, 3e5].map((n) => [sx(n), sy(0.01 * 0.798 * n)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={1.6} strokeDasharray="5 3" />
      <path d={linePath([5, 3e5].map((n) => [sx(n), sy(0.01 * 0.798 * Math.sqrt(n))] as [number, number]))} fill="none" stroke={inkSecondary} strokeWidth={1.6} strokeDasharray="5 3" />
      {pts.map(([n, t, r]) => (
        <g key={n}>
          <circle cx={sx(n)} cy={sy(t)} r={4.5} fill={colors.red} />
          <circle cx={sx(n)} cy={sy(r)} r={4.5} fill={inkSecondary} />
        </g>
      ))}
      <text x={sx(150528) - 6} y={sy(1202.9) - 8} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.red}>
        맞춘 노이즈: 1,203
      </text>
      <text x={sx(150528) - 6} y={sy(2.254) + 18} textAnchor="end" fontSize={10} fontWeight={800} fill={inkSecondary}>
        무작위 노이즈: 2.25
      </text>
      <text x={sx(200)} y={sy(0.01 * 0.798 * 200) - 10} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.red}>
        ∝ n
      </text>
      <text x={sx(200)} y={sy(0.01 * 0.798 * Math.sqrt(200)) + 16} fontSize={10} fontWeight={800} fill={inkSecondary}>
        ∝ √n
      </text>
    </DiagramFrame>
  );
}
