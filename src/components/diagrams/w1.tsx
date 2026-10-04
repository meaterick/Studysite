import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, seeded, gaussian, starPath, mono } from "./chart";

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


export function NumpyAxis() {
  // 「NumPy 첫걸음」 본문 코드의 scores 배열 그대로: axis=0은 열마다, axis=1은 행마다 합친다.
  const data = [
    [90, 85, 100],
    [70, 95, 80],
  ];
  const cw = 54;
  const ch = 34;
  const x0 = 70;
  const y0 = 64;
  const colSum = [160, 180, 180];
  const rowSum = [275, 245];
  const bx = 440;
  return (
    <DiagramFrame
      title="축(axis)과 브로드캐스팅을 한 장으로"
      caption="axis=0은 위아래로(행을 따라) 훑어 열마다 하나씩, axis=1은 좌우로(열을 따라) 훑어 행마다 하나씩 값을 남긴다. 합쳐진 축은 결과에서 사라진다. 오른쪽: 모양이 (3,)인 배열은 (2, 3) 배열의 각 행에 맞춰 복제된 것처럼 계산된다."
      viewBox="0 0 700 270"
      minWidth={520}
    >
      <ArrowDefs />
      <Label x={x0 + (cw * 3) / 2} y={30} text="scores  · shape (2, 3)" size={12} weight={700} color={ink} />
      <Label x={x0 - 30} y={y0 + ch / 2 + 4} text="1반" size={11} />
      <Label x={x0 - 30} y={y0 + ch * 1.5 + 4} text="2반" size={11} />
      {data.map((row, r) =>
        row.map((v, c) => (
          <g key={`${r}-${c}`}>
            <rect x={x0 + c * cw} y={y0 + r * ch} width={cw} height={ch} fill={card2Bg} stroke="var(--border-strong)" />
            <text x={x0 + c * cw + cw / 2} y={y0 + r * ch + ch / 2 + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
              {v}
            </text>
          </g>
        ))
      )}
      {colSum.map((v, c) => (
        <g key={`c${c}`}>
          <Arrow x1={x0 + c * cw + cw / 2} y1={y0 + ch * 2 + 4} x2={x0 + c * cw + cw / 2} y2={y0 + ch * 2 + 34} color={colors.blue} />
          <rect x={x0 + c * cw + 4} y={y0 + ch * 2 + 40} width={cw - 8} height={28} rx={6} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} />
          <text x={x0 + c * cw + cw / 2} y={y0 + ch * 2 + 58} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.blue}>
            {v}
          </text>
        </g>
      ))}
      <Label x={x0 + (cw * 3) / 2} y={y0 + ch * 2 + 90} text="sum(axis=0) → shape (3,)" size={11.5} weight={700} color={colors.blue} />
      {rowSum.map((v, r) => (
        <g key={`r${r}`}>
          <Arrow x1={x0 + cw * 3 + 4} y1={y0 + r * ch + ch / 2} x2={x0 + cw * 3 + 34} y2={y0 + r * ch + ch / 2} color={colors.orange} />
          <rect x={x0 + cw * 3 + 40} y={y0 + r * ch + 4} width={48} height={ch - 8} rx={6} fill={colors.orange} fillOpacity={0.14} stroke={colors.orange} />
          <text x={x0 + cw * 3 + 64} y={y0 + r * ch + ch / 2 + 4} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.orange}>
            {v}
          </text>
        </g>
      ))}
      <Label x={x0 + cw * 3 + 64} y={y0 - 14} text="sum(axis=1)" size={11.5} weight={700} color={colors.orange} />
      <Label x={x0 + cw * 3 + 64} y={y0 + ch * 2 + 18} text="→ shape (2,)" size={11} color={colors.orange} />

      <line x1={bx - 26} y1={24} x2={bx - 26} y2={250} stroke="var(--border-hairline)" />
      <Label x={bx + 119} y={30} text="브로드캐스팅: (2, 3) − (3,)" size={12} weight={700} color={ink} />
      {[0, 1].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`b${r}${c}`} x={bx + c * 34} y={y0 + r * 30} width={34} height={30} fill={card2Bg} stroke="var(--border-strong)" />
        ))
      )}
      <text x={bx + 119} y={y0 + 36} textAnchor="middle" fontSize={20} fontWeight={700} fill={ink}>
        −
      </text>
      {[0, 1, 2].map((c) => (
        <rect key={`v${c}`} x={bx + 136 + c * 34} y={y0} width={34} height={30} fill={colors.aqua} fillOpacity={0.18} stroke={colors.aqua} strokeWidth={1.5} />
      ))}
      {[0, 1, 2].map((c) => (
        <rect key={`d${c}`} x={bx + 136 + c * 34} y={y0 + 30} width={34} height={30} fill="none" stroke={colors.aqua} strokeDasharray="4 3" />
      ))}
      <Label x={bx + 187} y={y0 + 50} text="(복제)" size={10.5} color={colors.aqua} />
      <Label x={bx + 119} y={y0 + 96} text="오른쪽 끝 차원부터 비교해" size={11} />
      <Label x={bx + 119} y={y0 + 113} text="같거나 한쪽이 1이면 맞춰진다" size={11} />
      <Label x={bx + 119} y={y0 + 140} text="(2, 3) − (2,)  → 오류 (3 ≠ 2)" size={11} weight={700} color={colors.red} />
      <Label x={bx + 119} y={y0 + 160} text="(2, 3) − (2, 1) → 각 행에서 빼기" size={11} weight={700} color={colors.green} />
    </DiagramFrame>
  );
}

export function BayesFrequency() {
  // 유병률 1%, 민감도 99%, 위양성률 5%를 1만 명의 "자연 빈도"로 바꿔 그린다.
  const box = (x: number, y: number, w: number, label: string, sub: string, color: string, strong = false) => (
    <g>
      <rect x={x} y={y} width={w} height={46} rx={9} fill={color} fillOpacity={strong ? 0.2 : 0.08} stroke={color} strokeWidth={strong ? 2 : 1.2} />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize={13} fontWeight={700} fill={strong ? color : ink}>
        {label}
      </text>
      <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        {sub}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="베이즈 정리를 사람 수로: 1만 명에게 검사했다면"
      caption="양성 판정 594명 가운데 실제 환자는 99명뿐이다. 환자가 드물면(1%) 건강한 사람 중 5%의 오판(495명)이 진짜 환자보다 많아진다. 이것이 P(병|양성) ≈ 16.7%의 정체다."
      viewBox="0 0 680 300"
      minWidth={500}
    >
      <ArrowDefs />
      {box(280, 10, 120, "10,000명", "검사를 받은 사람", colors.violet)}
      <Arrow x1={315} y1={58} x2={175} y2={92} />
      <Arrow x1={365} y1={58} x2={505} y2={92} />
      <Label x={215} y={72} text="유병률 1%" size={11} anchor="end" />
      <Label x={465} y={72} text="99%" size={11} anchor="start" />
      {box(100, 96, 150, "환자 100명", "실제로 병이 있음", colors.red)}
      {box(430, 96, 150, "건강 9,900명", "병이 없음", colors.blue)}
      <Arrow x1={150} y1={144} x2={95} y2={182} />
      <Arrow x1={200} y1={144} x2={255} y2={182} />
      <Arrow x1={480} y1={144} x2={425} y2={182} />
      <Arrow x1={530} y1={144} x2={585} y2={182} />
      <Label x={108} y={160} text="민감도 99%" size={10.5} anchor="end" />
      <Label x={242} y={160} text="1%" size={10.5} anchor="start" />
      <Label x={438} y={160} text="위양성률 5%" size={10.5} anchor="end" />
      <Label x={572} y={160} text="95%" size={10.5} anchor="start" />
      {box(30, 186, 120, "양성 99명", "진짜 양성", colors.red, true)}
      {box(200, 186, 110, "음성 1명", "놓친 환자", colors.red)}
      {box(370, 186, 120, "양성 495명", "가짜 양성", colors.blue, true)}
      {box(540, 186, 120, "음성 9,405명", "맞게 음성", colors.blue)}
      <text x={340} y={268} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
        P(병 | 양성) = 99 ÷ (99 + 495) = 99 ÷ 594 ≈ 16.7%
      </text>
    </DiagramFrame>
  );
}

export function DotProductAngle() {
  // 같은 길이의 a(파랑)와 b(주황) 사이 각도에 따라 cos θ가 1 → 0 → −1로 바뀐다.
  const panels = [
    { deg: 30, title: "비슷한 방향", cos: "cos θ ≈ 0.87", dot: "a·b > 0" },
    { deg: 90, title: "직교(수직)", cos: "cos θ = 0", dot: "a·b = 0" },
    { deg: 180, title: "정반대 방향", cos: "cos θ = −1", dot: "a·b < 0" },
  ];
  const L = 70;
  return (
    <DiagramFrame
      title="내적과 각도: 방향이 얼마나 같은가"
      caption="a·b = |a||b|cos θ. 길이가 같아도 각도에 따라 내적의 부호와 크기가 바뀐다. 첫 그림의 점선은 b를 a 방향으로 내린 그림자(투영)로, 그 길이 |b|cos θ에 |a|를 곱한 것이 내적이다."
      viewBox="0 0 660 200"
      minWidth={480}
    >
      <defs>
        {[
          ["dp-blue", colors.blue],
          ["dp-orange", colors.orange],
        ].map(([id, c]) => (
          <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={c} />
          </marker>
        ))}
      </defs>
      {panels.map((p, i) => {
        const ox = 40 + i * 220 + (p.deg === 180 ? 80 : 20);
        const oy = 120;
        const rad = (p.deg * Math.PI) / 180;
        const bx = ox + L * Math.cos(rad);
        const by = oy - L * Math.sin(rad);
        const arcR = 22;
        const ax = ox + arcR;
        const ex = ox + arcR * Math.cos(rad);
        const ey = oy - arcR * Math.sin(rad);
        return (
          <g key={p.deg}>
            <line x1={ox} y1={oy} x2={ox + L} y2={oy} stroke={colors.blue} strokeWidth={2} markerEnd="url(#dp-blue)" />
            <line x1={ox} y1={oy} x2={bx} y2={by} stroke={colors.orange} strokeWidth={2} markerEnd="url(#dp-orange)" />
            <path d={`M ${ax} ${oy} A ${arcR} ${arcR} 0 0 0 ${ex} ${ey}`} fill="none" stroke={inkSecondary} strokeWidth={1.2} />
            {i === 0 && <line x1={bx} y1={by} x2={bx} y2={oy} stroke={colors.orange} strokeDasharray="3 3" />}
            <text x={ox + L + 8} y={oy + 4} fontSize={12} fontWeight={700} fill={colors.blue}>
              a
            </text>
            <text x={bx + (p.deg === 180 ? -14 : 6)} y={by - 4} fontSize={12} fontWeight={700} fill={colors.orange}>
              b
            </text>
            <Label x={40 + i * 220 + 90} y={30} text={`θ = ${p.deg}° · ${p.title}`} size={12} weight={700} color={ink} />
            <Label x={40 + i * 220 + 90} y={160} text={p.cos} size={11.5} weight={700} color={ink} />
            <Label x={40 + i * 220 + 90} y={178} text={p.dot} size={11} />
          </g>
        );
      })}
    </DiagramFrame>
  );
}

// ───────────────────────── 1주차 핵심 과정: 추가 그림 ─────────────────────────

export function RulesVsMl() {
  // 같은 재료(입력·규칙·출력)의 자리가 바뀐다는 것을 색으로 보여 준다: 규칙은 주황, 정답(출력)은 파랑.
  const P = "rvm";
  const row = (
    yc: number,
    title: string,
    sub: string,
    in1: string,
    in2: [string, string],
    in2Color: string,
    proc: [string, string],
    out: [string, string],
    outColor: string,
  ) => (
    <g>
      <Lines x={20} y={yc - 4} lines={[title]} size={13} weight={700} color={ink} anchor="start" />
      <Lines x={20} y={yc + 14} lines={[sub]} size={10.5} anchor="start" />
      <Tag x={172} y={yc - 48} w={124} h={38} lines={["입력", in1]} color={inkMuted} tint={0.08} size={12} />
      <Tag x={172} y={yc + 10} w={124} h={38} lines={in2} color={in2Color} tint={0.14} size={12} />
      <Arr x1={298} y1={yc - 29} x2={350} y2={yc - 9} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={298} y1={yc + 29} x2={350} y2={yc + 9} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={354} y={yc - 26} w={150} h={52} lines={proc} color={colors.violet} tint={0.1} size={12.5} />
      <Arr x1={506} y1={yc} x2={550} y2={yc} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={554} y={yc - 26} w={150} h={52} lines={out} color={outColor} tint={0.16} size={12.5} />
    </g>
  );
  return (
    <DiagramFrame
      title="규칙을 '넣는' 프로그래밍과 규칙을 '얻는' 머신러닝"
      caption="두 방식은 입력·규칙·출력이라는 같은 재료를 쓰지만 자리가 바뀐다. 전통적 프로그래밍은 사람이 쓴 규칙(주황)을 넣어 답(파랑)을 얻고, 머신러닝은 답이 달린 데이터를 넣어 규칙(주황)을 얻는다. 이렇게 얻은 규칙에 새 입력을 넣어 답을 내는 것이 추론이다."
      viewBox="0 0 720 250"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {row(64, "전통적 프로그래밍", "규칙을 사람이 적는다", "메일 본문", ["규칙", "'무료'가 있으면 스팸"], colors.orange, ["프로그램 실행", "규칙대로 계산"], ["출력", "스팸 / 정상"], colors.blue)}
      <line x1={20} y1={126} x2={700} y2={126} stroke="var(--border-hairline)" />
      {row(188, "머신러닝", "규칙을 데이터에서 찾는다", "메일 2만 통", ["출력(정답)", "사람이 단 스팸/정상"], colors.blue, ["학습 알고리즘", "손실을 줄이는 θ 찾기"], ["규칙 = 모델 fθ", "학습된 파라미터 θ"], colors.orange)}
    </DiagramFrame>
  );
}

export function ThetaSearch() {
  // 「함수를 찾는 게임」 예제 그대로: 데이터 (1,2),(2,4),(3,7), 모델 fθ(x) = θx, 손실 MSE(θ) = (14θ² − 62θ + 69)/3.
  const data: [number, number][] = [
    [1, 2],
    [2, 4],
    [3, 7],
  ];
  const mse = (t: number) => (14 * t * t - 62 * t + 69) / 3;
  const tStar = 31 / 14;
  const L = { left: 56, top: 34, width: 250, height: 196 };
  const lx = linear(0, 3.5, L.left, L.left + L.width);
  const ly = linear(0, 10, L.top + L.height, L.top);
  const R = { left: 424, top: 34, width: 266, height: 196 };
  const rx = linear(0.8, 3.4, R.left, R.left + R.width);
  const ry = linear(0, 10, R.top + R.height, R.top);
  const cand = [
    { t: 1, color: colors.blue, label: "θ = 1", loss: "7" },
    { t: 2, color: colors.aqua, label: "θ = 2", loss: "0.33" },
    { t: 3, color: colors.orange, label: "θ = 3", loss: "3" },
  ];
  const lineEnd = (t: number) => Math.min(3.4, 10 / t);
  const slope1 = (28 * 1 - 62) / 3; // θ = 1에서 dL/dθ ≈ −11.3
  const curve = sample(mse, 0.8, 3.4, 120).map(([t, v]) => [rx(t), ry(v)] as [number, number]);
  return (
    <DiagramFrame
      title="함수를 찾는 게임: 후보 θ마다 손실을 재면 '골짜기'가 보인다"
      caption="왼쪽은 데이터 세 점과 후보 직선 fθ(x) = θx, 오른쪽은 같은 후보들의 평균제곱오차(MSE)다. 보라색 점선은 최적 직선의 오차이고, 오차 제곱의 평균이 오른쪽 곡선의 높이가 된다. 곡선의 바닥 θ* = 31/14 ≈ 2.21이 '가장 잘 맞는 직선'이다. θ = 1에서는 곡선의 기울기가 음수라 θ를 키우는 쪽이 내리막이다. 이 기울기를 따라 바닥으로 내려가는 방법이 경사하강법이다."
      viewBox="0 0 720 290"
      minWidth={540}
    >
      <Lines x={L.left + L.width / 2} y={18} lines={["① 데이터와 후보 직선 fθ(x) = θx"]} size={12} weight={700} color={ink} />
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 1, 2, 3]} yTicks={[0, 2, 4, 6, 8, 10]} xLabel="x (입력)" yLabel="y (정답)" />
      {cand.map((c) => (
        <g key={c.t}>
          <line x1={lx(0)} y1={ly(0)} x2={lx(lineEnd(c.t))} y2={ly(c.t * lineEnd(c.t))} stroke={c.color} strokeWidth={1.6} strokeOpacity={0.85} />
          <text x={lx(lineEnd(c.t)) + 4} y={ly(c.t * lineEnd(c.t)) + 4} fontSize={10.5} fontWeight={700} fill={c.color}>
            {c.label}
          </text>
        </g>
      ))}
      <line x1={lx(0)} y1={ly(0)} x2={lx(3.4)} y2={ly(tStar * 3.4)} stroke={colors.violet} strokeWidth={3} />
      <text x={lx(3.4) + 4} y={ly(tStar * 3.4) - 4} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        θ* ≈ 2.21
      </text>
      {data.map(([x, y]) => (
        <g key={x}>
          <line x1={lx(x)} y1={ly(y)} x2={lx(x)} y2={ly(tStar * x)} stroke={colors.violet} strokeWidth={1.4} strokeDasharray="3 3" />
          <circle cx={lx(x)} cy={ly(y)} r={4.5} fill={ink} />
        </g>
      ))}

      <Lines x={R.left + R.width / 2} y={18} lines={["② 후보마다의 손실 L(θ) (MSE)"]} size={12} weight={700} color={ink} />
      <Axes {...R} sx={rx} sy={ry} xTicks={[1, 1.5, 2, 2.5, 3]} yTicks={[0, 2, 4, 6, 8, 10]} xLabel="θ (기울기 후보)" yLabel="MSE 손실" />
      <path d={linePath(curve)} fill="none" stroke={inkSecondary} strokeWidth={2} />
      <line x1={rx(0.84)} y1={ry(7 + slope1 * -0.16)} x2={rx(1.36)} y2={ry(7 + slope1 * 0.36)} stroke={colors.blue} strokeWidth={1.8} strokeDasharray="5 3" />
      <Lines x={rx(1.1)} y={ry(9.1)} lines={["θ = 1의 기울기 ≈ −11.3 < 0", "→ θ를 키우면 손실이 준다"]} size={10} color={colors.blue} anchor="start" />
      {cand.map((c) => (
        <g key={c.t}>
          <circle cx={rx(c.t)} cy={ry(mse(c.t))} r={5} fill={c.color} />
          <text x={rx(c.t) + (c.t === 2 ? -8 : 9)} y={ry(mse(c.t)) + (c.t === 2 ? -9 : 4)} textAnchor={c.t === 2 ? "end" : "start"} fontSize={10.5} fontWeight={700} fill={c.color}>
            {c.loss}
          </text>
        </g>
      ))}
      <path d={starPath(rx(tStar), ry(mse(tStar)), 8)} fill={colors.violet} />
      <Lines x={rx(tStar) + 8} y={ry(mse(tStar)) - 30} lines={["θ* ≈ 2.21", "손실 ≈ 0.12 (최소)"]} size={10.5} weight={700} color={colors.violet} anchor="start" />
    </DiagramFrame>
  );
}

export function TaskTypes() {
  // 「답의 모양」으로 세 유형을 구분한다. 점은 결정적 의사난수로 매번 같게 그린다.
  const P = "tty";
  const rand = seeded(11);
  const pw = 212;
  const xs = [12, 254, 496];
  const top = 46;
  const ch = 140;
  const map = (x0: number, u: number, v: number): [number, number] => [x0 + 20 + u * 172, top + ch - v * ch];
  const clsA = Array.from({ length: 9 }, () => [0.28 + 0.1 * gaussian(rand), 0.3 + 0.1 * gaussian(rand)]);
  const clsB = Array.from({ length: 9 }, () => [0.72 + 0.1 * gaussian(rand), 0.68 + 0.1 * gaussian(rand)]);
  const reg = Array.from({ length: 10 }, (_, i) => {
    const u = 0.06 + i * 0.095;
    return [u, 0.14 + 0.66 * u + 0.05 * gaussian(rand)];
  });
  const ring = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + 0.12 * gaussian(rand);
    const r = 0.33 + 0.035 * gaussian(rand);
    return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
  });
  const gen = [0.7, 2.3, 3.9, 5.3].map((a) => [0.5 + 0.33 * Math.cos(a), 0.5 + 0.33 * Math.sin(a)]);
  const panels = [
    { title: "분류 (classification)", color: colors.blue, answer: "답: 정해진 보기 중 하나", ex: "예: 스팸/정상, 개·고양이·새" },
    { title: "회귀 (regression)", color: colors.aqua, answer: "답: 연속된 숫자 하나", ex: "예: 내일 기온, 다음 달 매출" },
    { title: "생성 (generation)", color: colors.violet, answer: "답: 새로운 결과물", ex: "예: 문장, 이미지, 음성" },
  ];
  const [qx, qy] = map(xs[0], 0.44, 0.8);
  const [n1x, n1y] = map(xs[1], 0.78, 0);
  const [l1x, l1y] = map(xs[1], 0.78, 0.14 + 0.66 * 0.78);
  const [o1x] = map(xs[1], 0, 0);
  return (
    <DiagramFrame
      title="분류·회귀·생성: 답의 모양으로 구분한다"
      caption="분류는 경계를 기준으로 새 입력(보라 테두리 점)을 보기 중 하나로 나누고, 회귀는 새 x에 대응하는 숫자 ŷ를 읽어 낸다. 생성은 학습 데이터(회색)가 놓인 분포를 배워 그 분포에서 새로운 표본(별)을 뽑는다."
      viewBox="0 0 720 262"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, aqua: colors.aqua }} />
      {panels.map((p, i) => (
        <g key={p.title}>
          <rect x={xs[i]} y={6} width={pw} height={250} rx={12} fill="none" stroke="var(--border-hairline)" />
          <text x={xs[i] + pw / 2} y={28} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={p.color}>
            {p.title}
          </text>
          <text x={xs[i] + pw / 2} y={222} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
            {p.answer}
          </text>
          <text x={xs[i] + pw / 2} y={240} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
            {p.ex}
          </text>
        </g>
      ))}
      {/* 분류 */}
      <line x1={map(xs[0], 0.04, 0.96)[0]} y1={map(xs[0], 0.04, 0.96)[1]} x2={map(xs[0], 0.96, 0.04)[0]} y2={map(xs[0], 0.96, 0.04)[1]} stroke={inkSecondary} strokeWidth={1.6} strokeDasharray="6 4" />
      {clsA.map(([u, v], k) => {
        const [x, y] = map(xs[0], u, v);
        return <circle key={`a${k}`} cx={x} cy={y} r={4.2} fill={colors.blue} fillOpacity={0.8} />;
      })}
      {clsB.map(([u, v], k) => {
        const [x, y] = map(xs[0], u, v);
        return <rect key={`b${k}`} x={x - 4} y={y - 4} width={8} height={8} fill={colors.orange} fillOpacity={0.85} />;
      })}
      <circle cx={qx} cy={qy} r={6.5} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <text x={qx - 10} y={qy - 10} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={4} paintOrder="stroke">
        새 입력 → 스팸 쪽
      </text>
      <text x={map(xs[0], 0.02, 0.04)[0]} y={map(xs[0], 0.02, 0.04)[1]} fontSize={10} fill={colors.blue}>
        ● 정상
      </text>
      <text x={map(xs[0], 0.7, 0.98)[0]} y={map(xs[0], 0.7, 0.98)[1]} fontSize={10} fill={colors.orange}>
        ■ 스팸
      </text>
      {/* 회귀 */}
      <line x1={o1x} y1={top + ch} x2={map(xs[1], 1, 0)[0]} y2={top + ch} stroke={inkMuted} />
      <line x1={o1x} y1={top + ch} x2={o1x} y2={top} stroke={inkMuted} />
      <line x1={map(xs[1], 0, 0.14)[0]} y1={map(xs[1], 0, 0.14)[1]} x2={map(xs[1], 1, 0.8)[0]} y2={map(xs[1], 1, 0.8)[1]} stroke={colors.aqua} strokeWidth={2.2} />
      {reg.map(([u, v], k) => {
        const [x, y] = map(xs[1], u, v);
        return <circle key={`r${k}`} cx={x} cy={y} r={3.8} fill={inkSecondary} fillOpacity={0.75} />;
      })}
      <line x1={n1x} y1={n1y} x2={l1x} y2={l1y + 6} stroke={colors.aqua} strokeDasharray="4 3" markerEnd={`url(#${P}-aqua)`} />
      <line x1={l1x} y1={l1y} x2={o1x + 8} y2={l1y} stroke={colors.aqua} strokeDasharray="4 3" markerEnd={`url(#${P}-aqua)`} />
      <text x={n1x} y={n1y + 14} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.aqua}>
        새 x
      </text>
      <text x={o1x + 12} y={l1y - 6} fontSize={10.5} fontWeight={700} fill={colors.aqua}>
        ŷ = 숫자
      </text>
      {/* 생성 */}
      {ring.map(([u, v], k) => {
        const [x, y] = map(xs[2], u, v);
        return <circle key={`g${k}`} cx={x} cy={y} r={3.4} fill={inkMuted} fillOpacity={0.7} />;
      })}
      {gen.map(([u, v], k) => {
        const [x, y] = map(xs[2], u, v);
        return <path key={`s${k}`} d={starPath(x, y, 8)} fill={colors.violet} />;
      })}
      <text x={map(xs[2], 0.5, 0.5)[0]} y={map(xs[2], 0.5, 0.5)[1] - 4} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        학습 데이터의 분포
      </text>
      <text x={map(xs[2], 0.5, 0.5)[0]} y={map(xs[2], 0.5, 0.5)[1] + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.violet}>
        ★ 새로 뽑은 표본
      </text>
    </DiagramFrame>
  );
}

export function DiscriminativeGenerative() {
  // 같은 두 무리 데이터를 두고, 판별 모델은 경계(P(y|x))만, 생성 모델은 무리마다의 분포(P(x|y))를 배운다.
  const rand = seeded(5);
  const k = 42;
  const mu0: [number, number] = [-1.15, -0.55];
  const mu1: [number, number] = [1.1, 0.6];
  const sd = 0.55;
  const pts0 = Array.from({ length: 22 }, () => [mu0[0] + sd * gaussian(rand), mu0[1] + sd * gaussian(rand)]);
  const pts1 = Array.from({ length: 22 }, () => [mu1[0] + sd * gaussian(rand), mu1[1] + sd * gaussian(rand)]);
  const nx = mu1[0] - mu0[0];
  const ny = mu1[1] - mu0[1];
  const nl = Math.hypot(nx, ny);
  const n: [number, number] = [nx / nl, ny / nl];
  const d: [number, number] = [-n[1], n[0]];
  const m: [number, number] = [(mu0[0] + mu1[0]) / 2, (mu0[1] + mu1[1]) / 2];
  const panels = [
    { x0: 14, title: "판별 모델: P(y | x)를 배운다", color: colors.blue },
    { x0: 368, title: "생성 모델: P(x | y)·P(y)를 배운다", color: colors.violet },
  ];
  const plot = { top: 38, w: 338, h: 196 };
  const toXY = (x0: number, u: number, v: number): [number, number] => [x0 + plot.w / 2 + u * k, plot.top + plot.h / 2 - v * k];
  const poly = (x0: number, sign: number) =>
    [
      [m[0] + 7 * d[0], m[1] + 7 * d[1]],
      [m[0] - 7 * d[0], m[1] - 7 * d[1]],
      [m[0] - 7 * d[0] + sign * 9 * n[0], m[1] - 7 * d[1] + sign * 9 * n[1]],
      [m[0] + 7 * d[0] + sign * 9 * n[0], m[1] + 7 * d[1] + sign * 9 * n[1]],
    ]
      .map(([u, v]) => toXY(x0, u, v).map((c) => c.toFixed(1)).join(","))
      .join(" ");
  const newSamples: [number, number][] = [
    [mu0[0] - 0.35, mu0[1] + 0.45],
    [mu0[0] + 0.5, mu0[1] - 0.3],
    [mu1[0] + 0.45, mu1[1] + 0.3],
    [mu1[0] - 0.4, mu1[1] - 0.45],
  ];
  return (
    <DiagramFrame
      title="판별 모델과 생성 모델: 같은 데이터, 다른 질문"
      caption="왼쪽: 판별 모델은 '이 x는 어느 쪽인가'만 알면 되므로 두 무리를 가르는 경계(P(스팸|x) = 0.5인 선)만 배운다. 오른쪽: 생성 모델은 무리마다 데이터가 어떻게 퍼져 있는지(점선 등고선)를 배운다. 분포를 알면 그럴듯한 새 x(별)를 뽑을 수 있고, 베이즈 정리로 분류도 할 수 있다."
      viewBox="0 0 720 290"
      minWidth={540}
    >
      <defs>
        {panels.map((p) => (
          <clipPath key={p.x0} id={`dg-clip-${p.x0}`}>
            <rect x={p.x0} y={plot.top} width={plot.w} height={plot.h} rx={10} />
          </clipPath>
        ))}
      </defs>
      {panels.map((p, i) => (
        <g key={p.x0}>
          <text x={p.x0 + plot.w / 2} y={24} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={p.color}>
            {p.title}
          </text>
          <g clipPath={`url(#dg-clip-${p.x0})`}>
            {i === 0 && (
              <>
                <polygon points={poly(p.x0, -1)} fill={colors.blue} fillOpacity={0.09} />
                <polygon points={poly(p.x0, 1)} fill={colors.orange} fillOpacity={0.09} />
                <line
                  x1={toXY(p.x0, m[0] + 7 * d[0], m[1] + 7 * d[1])[0]}
                  y1={toXY(p.x0, m[0] + 7 * d[0], m[1] + 7 * d[1])[1]}
                  x2={toXY(p.x0, m[0] - 7 * d[0], m[1] - 7 * d[1])[0]}
                  y2={toXY(p.x0, m[0] - 7 * d[0], m[1] - 7 * d[1])[1]}
                  stroke={colors.violet}
                  strokeWidth={2.4}
                />
              </>
            )}
            {i === 1 &&
              [mu0, mu1].map((mu, j) =>
                [1, 2].map((s) => (
                  <circle
                    key={`${j}-${s}`}
                    cx={toXY(p.x0, mu[0], mu[1])[0]}
                    cy={toXY(p.x0, mu[0], mu[1])[1]}
                    r={sd * s * k}
                    fill={j === 0 ? colors.blue : colors.orange}
                    fillOpacity={s === 1 ? 0.1 : 0.05}
                    stroke={j === 0 ? colors.blue : colors.orange}
                    strokeWidth={1.3}
                    strokeDasharray="5 4"
                  />
                )),
              )}
            {pts0.map(([u, v], j) => {
              const [x, y] = toXY(p.x0, u, v);
              return <circle key={`p0${j}`} cx={x} cy={y} r={3.8} fill={colors.blue} fillOpacity={i === 1 ? 0.55 : 0.85} />;
            })}
            {pts1.map(([u, v], j) => {
              const [x, y] = toXY(p.x0, u, v);
              return <rect key={`p1${j}`} x={x - 3.6} y={y - 3.6} width={7.2} height={7.2} fill={colors.orange} fillOpacity={i === 1 ? 0.55 : 0.85} />;
            })}
            {i === 1 &&
              newSamples.map(([u, v], j) => {
                const [x, y] = toXY(p.x0, u, v);
                return <path key={`ns${j}`} d={starPath(x, y, 8.5)} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1} />;
              })}
          </g>
          <rect x={p.x0} y={plot.top} width={plot.w} height={plot.h} rx={10} fill="none" stroke="var(--border-hairline)" />
        </g>
      ))}
      <text x={toXY(14, m[0] + 1.9 * d[0], m[1] + 1.9 * d[1])[0] + 8} y={toXY(14, m[0] + 1.9 * d[0], m[1] + 1.9 * d[1])[1]} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        결정 경계
      </text>
      <Lines x={14 + plot.w / 2} y={256} lines={["경계만 배운다: 'x가 어느 쪽인가?'", "데이터가 어떻게 생겼는지는 모른다"]} size={11} color={inkSecondary} />
      <Lines x={368 + plot.w / 2} y={256} lines={["무리마다의 분포를 배운다", "→ 새 x(★)를 뽑을 수 있다"]} size={11} color={inkSecondary} />
    </DiagramFrame>
  );
}

export function LearningParadigms() {
  const P = "lp";
  const W = 342;
  const H = 172;
  const cells = [
    { x: 12, y: 10, title: "① 지도학습", color: colors.blue, signal: "학습 신호: 사람이 붙인 정답 (x, y)" },
    { x: 366, y: 10, title: "② 비지도학습", color: colors.aqua, signal: "학습 신호: 정답 없음 — x 안의 구조" },
    { x: 12, y: 192, title: "③ 자기지도학습", color: colors.violet, signal: "학습 신호: 데이터에서 가린 부분 = 자동 정답" },
    { x: 366, y: 192, title: "④ 강화학습", color: colors.orange, signal: "학습 신호: 행동에 대한 보상 (늦고 드물다)" },
  ];
  const photo = (x: number, y: number) => (
    <g>
      <rect x={x} y={y} width={46} height={34} rx={4} fill={card2Bg} stroke={inkMuted} />
      <circle cx={x + 34} cy={y + 10} r={4} fill={colors.yellow} />
      <path d={`M${x + 4},${y + 30} L${x + 18},${y + 14} L${x + 28},${y + 24} L${x + 34},${y + 19} L${x + 43},${y + 30} Z`} fill={inkMuted} fillOpacity={0.6} />
    </g>
  );
  const rand = seeded(23);
  const clusters: [number, number][] = [
    [62, 66],
    [148, 98],
    [70, 126],
  ];
  return (
    <DiagramFrame
      title="4대 학습 패러다임: 무엇을 신호로 배우는가"
      caption="네 패러다임은 모델 구조가 아니라 학습 신호로 나뉜다. 지도학습은 사람이 단 정답을, 비지도학습은 정답 없이 데이터의 구조를, 자기지도학습은 원문에서 가린 부분을 정답으로, 강화학습은 행동 뒤에 받는 보상을 신호로 쓴다. LLM 사전학습은 ③, RLHF는 ④에 해당한다."
      viewBox="0 0 720 374"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet, orange: colors.orange, blue: colors.blue }} />
      {cells.map((c) => (
        <g key={c.title}>
          <rect x={c.x} y={c.y} width={W} height={H} rx={12} fill="none" stroke="var(--border-hairline)" />
          <rect x={c.x} y={c.y} width={W} height={28} rx={12} fill={c.color} fillOpacity={0.14} />
          <text x={c.x + 14} y={c.y + 19} fontSize={12.5} fontWeight={700} fill={c.color}>
            {c.title}
          </text>
          <text x={c.x + 14} y={c.y + H - 12} fontSize={10.5} fontWeight={600} fill={ink}>
            {c.signal}
          </text>
        </g>
      ))}
      {/* ① 지도학습 */}
      {[0, 1].map((r) => (
        <g key={r}>
          {photo(36, 48 + r * 52)}
          <Arr x1={88} y1={65 + r * 52} x2={124} y2={65 + r * 52} color={inkSecondary} marker={`${P}-ink`} />
          <Tag x={128} y={52 + r * 52} w={78} h={26} lines={[r === 0 ? "고양이" : "개"]} color={colors.blue} tint={0.14} size={12} />
        </g>
      ))}
      <Lines x={222} y={70} lines={["입력 x마다", "사람이 정답 y를", "붙여 둔다"]} size={10.5} anchor="start" />
      <text x={56} y={152} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        입력 x
      </text>
      <text x={167} y={152} textAnchor="middle" fontSize={10} fill={colors.blue}>
        정답 y
      </text>
      {/* ② 비지도학습 */}
      {clusters.map(([cx, cy], j) => (
        <g key={j}>
          <circle cx={366 + cx} cy={10 + cy} r={24} fill="none" stroke={colors.aqua} strokeDasharray="4 3" strokeWidth={1.4} />
          {Array.from({ length: 7 }, (_, q) => (
            <circle key={q} cx={366 + cx + Math.max(-15, Math.min(15, 7 * gaussian(rand)))} cy={10 + cy + Math.max(-14, Math.min(14, 6 * gaussian(rand)))} r={3.2} fill={inkMuted} />
          ))}
        </g>
      ))}
      <Lines x={366 + 206} y={70} lines={["정답이 없어도", "비슷한 것끼리 묶거나", "(군집화) 차원을 줄인다"]} size={10.5} anchor="start" />
      {/* ③ 자기지도학습 */}
      {["오늘", "날씨가", "정말"].map((t, j) => (
        <Tag key={t} x={30 + j * 66} y={238} w={60} h={28} lines={[t]} color={inkMuted} tint={0.08} size={12} weight={600} />
      ))}
      <Tag x={228} y={238} w={60} h={28} lines={["?"]} color={colors.violet} tint={0.16} size={13} dashed />
      <Arr x1={258} y1={268} x2={258} y2={290} color={colors.violet} marker={`${P}-violet`} />
      <Tag x={228} y={292} w={60} h={28} lines={["좋다"]} color={colors.violet} tint={0.28} size={12} />
      <Lines x={218} y={302} lines={["가린 단어의 원래 값", "= 사람 없이 얻은 정답"]} size={10.5} weight={600} color={colors.violet} anchor="end" />
      {/* ④ 강화학습 */}
      <Tag x={392} y={248} w={104} h={44} lines={["에이전트", "정책 π"]} color={colors.orange} tint={0.14} size={12} />
      <Tag x={592} y={248} w={104} h={44} lines={["환경", "게임·사용자"]} color={inkMuted} tint={0.08} size={12} />
      <ArrPath d="M496,256 C540,226 548,226 590,256" color={colors.orange} marker={`${P}-orange`} />
      <ArrPath d="M592,286 C548,316 540,316 498,286" color={colors.blue} marker={`${P}-blue`} />
      <text x={544} y={226} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        행동 a
      </text>
      <text x={544} y={328} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.blue}>
        보상 r · 다음 상태 s
      </text>
    </DiagramFrame>
  );
}

export function PythonNameTags() {
  // 변수 = 값(객체)에 붙인 이름표. b = a는 같은 리스트에 이름표를 하나 더 붙일 뿐이고, copy()는 새 리스트를 만든다.
  const P = "pnt";
  const cell = (x: number, y: number, v: string, isNew = false) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={30} height={28} fill={isNew ? colors.green : card2Bg} fillOpacity={isNew ? 0.2 : 1} stroke="var(--border-strong)" />
      <text x={x + 15} y={y + 19} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink} fontFamily={mono}>
        {v}
      </text>
    </g>
  );
  const tag = (x: number, y: number, name: string, color: string) => (
    <g>
      <rect x={x} y={y} width={34} height={24} rx={6} fill={color} fillOpacity={0.16} stroke={color} />
      <text x={x + 17} y={y + 16.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} fontFamily={mono}>
        {name}
      </text>
    </g>
  );
  const code = (y: number, lines: string[]) => (
    <g>
      <rect x={14} y={y} width={196} height={80} rx={8} fill={card2Bg} stroke="var(--border-hairline)" />
      {lines.map((l, i) => (
        <text key={i} x={26} y={y + 24 + i * 22} fontSize={12.5} fill={ink} fontFamily={mono}>
          {l}
        </text>
      ))}
    </g>
  );
  return (
    <DiagramFrame
      title="변수는 상자가 아니라 이름표: b = a는 복사가 아니다"
      caption="위: b = a는 리스트를 복사하지 않고, 같은 리스트에 b라는 이름표를 하나 더 붙인다. 그래서 b로 4를 추가하면 a로 봐도 바뀌어 있다. 아래: a.copy()는 내용이 같은 새 리스트를 만들므로 c를 고쳐도 a는 그대로다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, ink: inkSecondary }} />
      {code(12, ["a = [1, 2, 3]", "b = a", "b.append(4)"])}
      <Arr x1={216} y1={52} x2={250} y2={52} color={inkSecondary} marker={`${P}-ink`} />
      {tag(262, 22, "a", colors.blue)}
      {tag(262, 60, "b", colors.orange)}
      <Arr x1={298} y1={34} x2={346} y2={46} color={colors.blue} marker={`${P}-blue`} />
      <Arr x1={298} y1={72} x2={346} y2={60} color={colors.orange} marker={`${P}-orange`} />
      {[1, 2, 3, 4].map((v, i) => cell(350 + i * 30, 38, String(v), i === 3))}
      <text x={410} y={84} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        리스트 객체는 하나뿐
      </text>
      <text x={500} y={42} fontSize={12.5} fill={ink} fontFamily={mono}>
        print(a)
      </text>
      <text x={500} y={62} fontSize={12.5} fontWeight={700} fill={ink} fontFamily={mono}>
        → [1, 2, 3, 4]
      </text>
      <text x={500} y={82} fontSize={11} fontWeight={700} fill={colors.red}>
        a도 바뀌었다
      </text>

      <line x1={14} y1={118} x2={706} y2={118} stroke="var(--border-hairline)" />

      {code(132, ["a = [1, 2, 3]", "c = a.copy()", "c.append(4)"])}
      <Arr x1={216} y1={172} x2={250} y2={172} color={inkSecondary} marker={`${P}-ink`} />
      {tag(262, 138, "a", colors.blue)}
      {tag(262, 186, "c", colors.orange)}
      <Arr x1={298} y1={150} x2={346} y2={152} color={colors.blue} marker={`${P}-blue`} />
      <Arr x1={298} y1={198} x2={346} y2={198} color={colors.orange} marker={`${P}-orange`} />
      {[1, 2, 3].map((v, i) => cell(350 + i * 30, 138, String(v)))}
      {[1, 2, 3, 4].map((v, i) => cell(350 + i * 30, 184, String(v), i === 3))}
      <text x={500} y={162} fontSize={12.5} fill={ink} fontFamily={mono}>
        print(a)
      </text>
      <text x={500} y={182} fontSize={12.5} fontWeight={700} fill={ink} fontFamily={mono}>
        → [1, 2, 3]
      </text>
      <text x={500} y={202} fontSize={11} fontWeight={700} fill={colors.green}>
        a는 그대로 (객체가 둘)
      </text>
    </DiagramFrame>
  );
}

export function ListIndexSlice() {
  // 본문의 scores = [90, 85, 77, 60]. 인덱스는 칸을, 슬라이스 번호는 칸 사이의 '경계'를 가리킨다고 보면 [1:3]이 쉽다.
  const vals = [90, 85, 77, 60];
  const x0 = 170;
  const cw = 72;
  const y = 46;
  const h = 44;
  return (
    <DiagramFrame
      title="인덱싱과 슬라이싱: 번호는 0부터, 슬라이스는 '경계'로 읽는다"
      caption="양수 인덱스는 앞에서 0, 1, 2, 3으로, 음수 인덱스는 뒤에서 −1, −2, …로 센다. 슬라이스 번호를 칸 사이의 경계로 생각하면 scores[1:3]은 '경계 1부터 경계 3까지'라서 1번·2번 칸(85, 77)만 나오고 3번 칸은 빠진다. 꺼낸 개수는 끝 − 시작 = 3 − 1 = 2개다."
      viewBox="0 0 660 202"
      minWidth={520}
    >
      <text x={x0 - 14} y={36} textAnchor="end" fontSize={11} fontWeight={600} fill={colors.blue}>
        인덱스
      </text>
      <text x={x0 - 14} y={110} textAnchor="end" fontSize={11} fontWeight={600} fill={colors.orange}>
        음수 인덱스
      </text>
      <text x={x0 - 14} y={154} textAnchor="end" fontSize={11} fontWeight={600} fill={colors.violet}>
        슬라이스 경계
      </text>
      {vals.map((v, i) => (
        <g key={v}>
          <rect
            x={x0 + i * cw}
            y={y}
            width={cw}
            height={h}
            fill={i === 1 || i === 2 ? colors.violet : card2Bg}
            fillOpacity={i === 1 || i === 2 ? 0.16 : 1}
            stroke="var(--border-strong)"
          />
          <text x={x0 + i * cw + cw / 2} y={y + 28} textAnchor="middle" fontSize={15} fontWeight={700} fill={ink} fontFamily={mono}>
            {v}
          </text>
          <text x={x0 + i * cw + cw / 2} y={36} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.blue} fontFamily={mono}>
            {i}
          </text>
          <text x={x0 + i * cw + cw / 2} y={110} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.orange} fontFamily={mono}>
            {i - 4}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((b) => (
        <g key={b}>
          <line x1={x0 + b * cw} y1={124} x2={x0 + b * cw} y2={138} stroke={colors.violet} strokeWidth={2} />
          <text x={x0 + b * cw} y={154} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.violet} fontFamily={mono}>
            {b}
          </text>
        </g>
      ))}
      <path d={`M${x0 + cw},162 L${x0 + cw},170 L${x0 + 3 * cw},170 L${x0 + 3 * cw},162`} fill="none" stroke={colors.violet} strokeWidth={2} />
      <text x={x0 + 2 * cw} y={190} textAnchor="middle" fontSize={12} fontWeight={700} fill={colors.violet} fontFamily={mono}>
        scores[1:3] → [85, 77]
      </text>
      <text x={x0 + 4 * cw + 24} y={62} fontSize={12} fill={ink} fontFamily={mono}>
        scores[0] → 90
      </text>
      <text x={x0 + 4 * cw + 24} y={84} fontSize={12} fill={ink} fontFamily={mono}>
        scores[-1] → 60
      </text>
    </DiagramFrame>
  );
}

export function NumpyElementwise() {
  // a = [1, 2, 3], b = [10, 20, 30]. 리스트의 +는 이어 붙이기, 배열의 + · *는 같은 자리끼리, @는 곱해서 모두 더하기.
  const P = "npe";
  const pos = [colors.blue, colors.orange, colors.aqua];
  const cw = 32;
  const chh = 26;
  const row = (cx: number, y: number, vals: (number | string)[], tint: (i: number) => string, faded = false) => {
    const x0 = cx - (vals.length * cw) / 2;
    return vals.map((v, i) => (
      <g key={`${cx}-${y}-${i}`} opacity={faded ? 0.55 : 1}>
        <rect x={x0 + i * cw} y={y} width={cw} height={chh} fill={tint(i)} fillOpacity={0.16} stroke={tint(i)} />
        <text x={x0 + i * cw + cw / 2} y={y + 17.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink} fontFamily={mono}>
          {v}
        </text>
      </g>
    ));
  };
  const cols = [
    { cx: 92, code: "[1, 2] + [3, 4]", kind: "리스트" },
    { cx: 270, code: "a + b", kind: "배열" },
    { cx: 448, code: "a * b", kind: "배열" },
    { cx: 626, code: "a @ b", kind: "배열" },
  ];
  const op = (cx: number, s: string) => (
    <text x={cx} y={100} textAnchor="middle" fontSize={15} fontWeight={700} fill={inkSecondary} fontFamily={mono}>
      {s}
    </text>
  );
  const down = (cx: number) => <Arr x1={cx} y1={134} x2={cx} y2={152} color={inkSecondary} marker={`${P}-ink`} />;
  return (
    <DiagramFrame
      title="같은 기호, 다른 계산: 리스트의 +와 배열의 + · * · @"
      caption="파이썬 리스트의 +는 두 리스트를 이어 붙인다. NumPy 배열의 +와 *는 같은 자리(같은 색)끼리 계산해 모양 (3,)을 그대로 남긴다. @는 같은 자리끼리 곱한 뒤 모두 더해 숫자 하나를 내는 내적이다: 1·10 + 2·20 + 3·30 = 140."
      viewBox="0 0 720 252"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {cols.map((c) => (
        <g key={c.cx}>
          <text x={c.cx} y={22} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink} fontFamily={mono}>
            {c.code}
          </text>
          <text x={c.cx} y={38} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
            ({c.kind})
          </text>
        </g>
      ))}
      <line x1={180} y1={10} x2={180} y2={244} stroke="var(--border-hairline)" />
      {/* 리스트 + */}
      {row(92, 50, [1, 2], () => colors.blue)}
      {op(92, "+")}
      {row(92, 106, [3, 4], () => colors.orange)}
      {down(92)}
      {row(92, 156, [1, 2, 3, 4], (i) => (i < 2 ? colors.blue : colors.orange))}
      <Lines x={92} y={210} lines={["이어 붙이기", "길이 2 + 2 = 4"]} size={11} weight={700} color={ink} />
      {/* a + b */}
      {row(270, 50, [1, 2, 3], (i) => pos[i])}
      {op(270, "+")}
      {row(270, 106, [10, 20, 30], (i) => pos[i])}
      {down(270)}
      {row(270, 156, [11, 22, 33], (i) => pos[i])}
      <Lines x={270} y={210} lines={["같은 자리끼리 더하기", "모양 (3,) 그대로"]} size={11} weight={700} color={ink} />
      {/* a * b */}
      {row(448, 50, [1, 2, 3], (i) => pos[i])}
      {op(448, "*")}
      {row(448, 106, [10, 20, 30], (i) => pos[i])}
      {down(448)}
      {row(448, 156, [10, 40, 90], (i) => pos[i])}
      <Lines x={448} y={210} lines={["같은 자리끼리 곱하기", "내적이 아니다"]} size={11} weight={700} color={ink} />
      {/* a @ b */}
      {row(626, 50, [1, 2, 3], (i) => pos[i])}
      {op(626, "@")}
      {row(626, 106, [10, 20, 30], (i) => pos[i])}
      <text x={626} y={148} textAnchor="middle" fontSize={11} fill={inkSecondary} fontFamily={mono}>
        10 + 40 + 90
      </text>
      <rect x={626 - 30} y={156} width={60} height={chh} rx={6} fill={colors.violet} fillOpacity={0.18} stroke={colors.violet} strokeWidth={1.6} />
      <text x={626} y={173.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink} fontFamily={mono}>
        140
      </text>
      <Lines x={626} y={210} lines={["곱해서 모두 더하기", "= 내적, 결과는 숫자 하나"]} size={11} weight={700} color={ink} />
    </DiagramFrame>
  );
}

export function MatVecRows() {
  // 본문 예: W = [[1, 2], [3, 4], [0, −1]], x = [1, 1] → Wx = [3, 7, −1]. 행마다 내적 하나.
  const rowsW = [
    [1, 2],
    [3, 4],
    [0, -1],
  ];
  const res = [3, 7, -1];
  const rc = [colors.blue, colors.orange, colors.aqua];
  const cw = 44;
  const chh = 38;
  const top = 50;
  const wx = 40;
  const xx = 170;
  const rx = 260;
  const bracket = (x: number, y: number, w: number, h: number) => (
    <g stroke={ink} strokeWidth={1.6} fill="none">
      <path d={`M${x + 6},${y - 4} L${x - 2},${y - 4} L${x - 2},${y + h + 4} L${x + 6},${y + h + 4}`} />
      <path d={`M${x + w - 6},${y - 4} L${x + w + 2},${y - 4} L${x + w + 2},${y + h + 4} L${x + w - 6},${y + h + 4}`} />
    </g>
  );
  const fmt = (v: number) => (v < 0 ? `(${v})` : String(v)).replace("-", "−");
  return (
    <DiagramFrame
      title="행렬-벡터 곱 Wx = 행마다 x와 내적하기"
      caption="W의 각 행(색)과 x의 내적이 결과의 같은 색 칸이 된다. 곱하려면 W의 열 수(2)와 x의 길이(2)가 같아야 하고, 결과의 길이는 W의 행 수(3)다. 신경망의 한 층에서는 W의 한 행이 출력 뉴런 하나의 가중치다."
      viewBox="0 0 720 230"
      minWidth={540}
    >
      <text x={wx + cw} y={30} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        W (3×2)
      </text>
      <text x={xx + cw / 2} y={30} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        x (2)
      </text>
      <text x={rx + cw / 2} y={30} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        Wx (3)
      </text>
      {rowsW.map((r, i) =>
        r.map((v, j) => (
          <g key={`${i}-${j}`}>
            <rect x={wx + j * cw} y={top + i * chh} width={cw} height={chh} fill={rc[i]} fillOpacity={0.15} stroke="var(--border-strong)" />
            <text x={wx + j * cw + cw / 2} y={top + i * chh + 24} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
              {String(v).replace("-", "−")}
            </text>
          </g>
        )),
      )}
      {bracket(wx, top, 2 * cw, 3 * chh)}
      <text x={wx + 2 * cw + 22} y={top + 1.5 * chh + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={inkSecondary}>
        ·
      </text>
      {[1, 1].map((v, j) => (
        <g key={j}>
          <rect x={xx} y={top + 0.5 * chh + j * chh} width={cw} height={chh} fill={colors.violet} fillOpacity={0.15} stroke="var(--border-strong)" />
          <text x={xx + cw / 2} y={top + 0.5 * chh + j * chh + 24} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
            {v}
          </text>
        </g>
      ))}
      {bracket(xx, top + 0.5 * chh, cw, 2 * chh)}
      <text x={xx + cw + 24} y={top + 1.5 * chh + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={inkSecondary}>
        =
      </text>
      {res.map((v, i) => (
        <g key={i}>
          <rect x={rx} y={top + i * chh} width={cw} height={chh} fill={rc[i]} fillOpacity={0.28} stroke={rc[i]} strokeWidth={1.4} />
          <text x={rx + cw / 2} y={top + i * chh + 24} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
            {String(v).replace("-", "−")}
          </text>
        </g>
      ))}
      {bracket(rx, top, cw, 3 * chh)}
      {rowsW.map((r, i) => (
        <text key={i} x={340} y={top + i * chh + 24} fontSize={12.5} fill={rc[i]} fontWeight={700}>
          {`${i + 1}행 · x = ${fmt(r[0])}×1 + ${fmt(r[1])}×1 = ${String(res[i]).replace("-", "−")}`}
        </text>
      ))}
      <Lines
        x={20}
        y={196}
        lines={["모양 규칙: (3×2) · (2) → (3)  —  W의 열 수 = x의 길이일 때만 곱할 수 있고, 결과 길이는 W의 행 수", "신경망 한 층: 출력 뉴런 하나 = W의 한 행 · 입력 x  →  층 전체 = Wx 한 번"]}
        size={11.5}
        color={inkSecondary}
        anchor="start"
        gap={1.6}
      />
    </DiagramFrame>
  );
}

export function VectorLengthDirection() {
  // 왼쪽: [3, 4]의 길이 5와 단위벡터 [0.6, 0.8]. 오른쪽: a=[1,2], b=[2,1] 사이 각 ≈ 36.9°. b를 10배 늘려도 각도(코사인 유사도)는 그대로.
  const P = "vld";
  const u = 34;
  const o1: [number, number] = [56, 224];
  const p1 = (x: number, y: number): [number, number] => [o1[0] + x * u, o1[1] - y * u];
  const v = 48;
  const o2: [number, number] = [400, 224];
  const p2 = (x: number, y: number): [number, number] => [o2[0] + x * v, o2[1] - y * v];
  const angA = Math.atan2(2, 1);
  const angB = Math.atan2(1, 2);
  const arcR = 40;
  const arc = `M${o2[0] + arcR * Math.cos(angB)},${o2[1] - arcR * Math.sin(angB)} A${arcR},${arcR} 0 0 0 ${o2[0] + arcR * Math.cos(angA)},${o2[1] - arcR * Math.sin(angA)}`;
  const grid = (o: [number, number], s: number, nx: number, ny: number) => (
    <g>
      {Array.from({ length: nx + 1 }, (_, i) => (
        <line key={`x${i}`} x1={o[0] + i * s} y1={o[1]} x2={o[0] + i * s} y2={o[1] - ny * s} stroke="var(--border-hairline)" />
      ))}
      {Array.from({ length: ny + 1 }, (_, j) => (
        <line key={`y${j}`} x1={o[0]} y1={o[1] - j * s} x2={o[0] + nx * s} y2={o[1] - j * s} stroke="var(--border-hairline)" />
      ))}
      <line x1={o[0]} y1={o[1]} x2={o[0] + nx * s} y2={o[1]} stroke={inkMuted} strokeWidth={1.2} />
      <line x1={o[0]} y1={o[1]} x2={o[0]} y2={o[1] - ny * s} stroke={inkMuted} strokeWidth={1.2} />
    </g>
  );
  const [ax, ay] = p1(3, 4);
  const [ux, uy] = p1(0.6, 0.8);
  const [a2x, a2y] = p2(1, 2);
  const [b2x, b2y] = p2(2, 1);
  const [l2x, l2y] = p2(4, 2);
  return (
    <DiagramFrame
      title="벡터의 길이와 방향: 코사인 유사도는 방향만 본다"
      caption="왼쪽: [3, 4]의 길이는 피타고라스 정리로 5이고, 자기 길이로 나누면 방향은 그대로인 단위벡터 [0.6, 0.8]이 된다(점선 원은 길이 1). 오른쪽: a = [1, 2]와 b = [2, 1] 사이 각은 약 36.9°, cos θ = 0.8이다. b를 10배 늘린 [20, 10]은 같은 방향이라 내적은 4 → 40으로 커져도 코사인 유사도는 0.8 그대로다."
      viewBox="0 0 720 262"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, violet: colors.violet }} />
      <text x={170} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 길이(노름)와 단위벡터
      </text>
      {grid(o1, u, 7, 5)}
      <line x1={o1[0]} y1={o1[1]} x2={ax} y2={o1[1]} stroke={colors.blue} strokeDasharray="4 3" />
      <line x1={ax} y1={o1[1]} x2={ax} y2={ay} stroke={colors.blue} strokeDasharray="4 3" />
      <text x={(o1[0] + ax) / 2} y={o1[1] + 16} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        3
      </text>
      <text x={ax + 8} y={(o1[1] + ay) / 2} fontSize={11} fontWeight={700} fill={colors.blue}>
        4
      </text>
      <Arr x1={o1[0]} y1={o1[1]} x2={ax} y2={ay} color={colors.blue} marker={`${P}-blue`} width={2.4} />
      <text x={ax + 10} y={ay - 2} fontSize={12} fontWeight={700} fill={colors.blue}>
        a = [3, 4]
      </text>
      <text x={ax + 10} y={ay + 16} fontSize={11} fontWeight={700} fill={colors.blue}>
        |a| = √(3² + 4²) = 5
      </text>
      <path d={`M${o1[0] + u},${o1[1]} A${u},${u} 0 0 0 ${o1[0]},${o1[1] - u}`} fill="none" stroke={colors.orange} strokeDasharray="3 3" />
      <Arr x1={o1[0]} y1={o1[1]} x2={ux} y2={uy} color={colors.orange} marker={`${P}-orange`} width={2.4} />
      <Lines x={o1[0] + 36} y={o1[1] - 22} lines={["단위벡터 a/|a|", "= [0.6, 0.8]"]} size={10.5} weight={700} color={colors.orange} anchor="start" />

      <line x1={366} y1={14} x2={366} y2={250} stroke="var(--border-hairline)" />
      <text x={545} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 길이를 바꿔도 각도는 그대로
      </text>
      {grid(o2, v, 6, 4)}
      <line x1={o2[0]} y1={o2[1]} x2={l2x} y2={l2y} stroke={colors.orange} strokeWidth={6} strokeOpacity={0.18} strokeLinecap="round" />
      <Lines x={l2x + 8} y={l2y - 4} lines={["10b = [20, 10]", "(같은 방향, 10배 길이)"]} size={10.5} weight={700} color={colors.orange} anchor="start" />
      <path d={arc} fill="none" stroke={colors.violet} strokeWidth={1.6} />
      <text x={o2[0] + 46} y={o2[1] - 34} fontSize={12} fontWeight={700} fill={colors.violet}>
        θ
      </text>
      <Arr x1={o2[0]} y1={o2[1]} x2={a2x} y2={a2y} color={colors.blue} marker={`${P}-blue`} width={2.4} />
      <Arr x1={o2[0]} y1={o2[1]} x2={b2x} y2={b2y} color={colors.orange} marker={`${P}-orange`} width={2.4} />
      <text x={a2x + 6} y={a2y - 2} fontSize={12} fontWeight={700} fill={colors.blue}>
        a = [1, 2]
      </text>
      <text x={b2x + 6} y={b2y + 20} fontSize={12} fontWeight={700} fill={colors.orange}>
        b = [2, 1]
      </text>
      <Lines x={708} y={176} lines={["θ ≈ 36.9°, cos θ = 0.8", "a·b = 4 → a·(10b) = 40", "cos θ는 그대로 0.8"]} size={10.5} weight={700} color={ink} anchor="end" />
    </DiagramFrame>
  );
}

export function ConditionalVenn() {
  // 조건부확률 = 정보가 주어지면 '세계'를 그 사건으로 좁힌다. 100일 중 비 30일, 우산 40일, 둘 다 24일인 장난감 예.
  const P = "cvn";
  return (
    <DiagramFrame
      title="조건부확률: '안다'는 것은 세계를 좁히는 것"
      caption="100일 가운데 우산을 챙긴 날은 40일이라 P(우산) = 0.4다. 그런데 '비가 왔다'는 것을 알면 비가 오지 않은 70일은 더 이상 후보가 아니다. 남은 30일 중 우산을 챙긴 날이 24일이므로 P(우산 | 비) = 24/30 = 0.8이 된다. 공식 P(A|B) = P(A∩B)/P(B)의 분모가 바로 이 '좁혀진 세계'의 크기다."
      viewBox="0 0 720 262"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <defs>
        <clipPath id="cvn-clip-left">
          <circle cx={128} cy={132} r={72} />
        </clipPath>
        <clipPath id="cvn-clip-right">
          <circle cx={560} cy={132} r={98} />
        </clipPath>
      </defs>
      <rect x={16} y={30} width={300} height={200} rx={10} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={28} y={50} fontSize={11.5} fontWeight={700} fill={ink}>
        전체: 100일
      </text>
      <circle cx={128} cy={132} r={72} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} strokeWidth={1.6} />
      <circle cx={210} cy={132} r={80} fill={colors.orange} fillOpacity={0.1} stroke={colors.orange} strokeWidth={1.6} />
      <circle cx={210} cy={132} r={80} fill={colors.violet} fillOpacity={0.32} clipPath="url(#cvn-clip-left)" />
      <text x={86} y={136} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        비
      </text>
      <text x={86} y={152} textAnchor="middle" fontSize={10.5} fill={colors.blue}>
        30일
      </text>
      <text x={252} y={136} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
        우산
      </text>
      <text x={252} y={152} textAnchor="middle" fontSize={10.5} fill={colors.orange}>
        40일
      </text>
      <text x={168} y={136} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.violet}>
        둘 다
      </text>
      <text x={168} y={152} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.violet}>
        24일
      </text>
      <text x={166} y={250} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        P(우산) = 40/100 = 0.4
      </text>

      <Arr x1={330} y1={132} x2={444} y2={132} color={inkSecondary} marker={`${P}-ink`} width={2} />
      <Lines x={387} y={104} lines={["'비가 왔다'를 알면", "비 밖은 지운다"]} size={10.5} weight={600} color={inkSecondary} />

      <circle cx={560} cy={132} r={98} fill={colors.blue} fillOpacity={0.12} stroke={colors.blue} strokeWidth={2} />
      <circle cx={672} cy={132} r={110} fill={colors.violet} fillOpacity={0.32} clipPath="url(#cvn-clip-right)" />
      <text x={560} y={24} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.blue}>
        새 세계 = 비 온 30일
      </text>
      <text x={520} y={138} textAnchor="middle" fontSize={11} fill={colors.blue}>
        우산 없이 6일
      </text>
      <text x={612} y={128} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.violet}>
        우산
      </text>
      <text x={612} y={144} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.violet}>
        24일
      </text>
      <text x={560} y={250} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        P(우산 | 비) = 24/30 = 0.8
      </text>
    </DiagramFrame>
  );
}

export function BaseRateCurve() {
  // 민감도 99%, 위양성률 5%인 같은 검사를 유병률만 바꿔 가며 P(병|양성)을 그린다.
  const P = "brc";
  const post = (p: number) => (0.99 * p) / (0.99 * p + 0.05 * (1 - p));
  const A = { left: 74, top: 26, width: 600, height: 200 };
  const sx = log10Scale(0.001, 0.5, A.left, A.left + A.width);
  const sy = linear(0, 1, A.top + A.height, A.top);
  const pts = sample((t) => post(10 ** t), -3, Math.log10(0.5), 160).map(([t, v]) => [sx(10 ** t), sy(v)] as [number, number]);
  const marks = [
    { p: 0.01, label: "유병률 1% → 16.7%" },
    { p: 0.1, label: "유병률 10% → 68.8%" },
  ];
  return (
    <DiagramFrame
      title="검사는 그대로인데 결과의 의미가 바뀐다: 기저율과 P(병 | 양성)"
      caption="민감도 99%·위양성률 5%인 같은 검사라도, 유병률(가로축, 로그 눈금)이 낮을수록 양성 판정이 실제 병을 뜻할 확률(세로축)은 급격히 떨어진다. 직관은 위쪽 점선(99%)처럼 답하지만, 유병률 1%에서는 16.7%에 불과하다. 이 간격이 '기저율 무시'의 크기다."
      viewBox="0 0 720 284"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ red: colors.red }} />
      <Axes
        {...A}
        sx={sx}
        sy={sy}
        xTicks={[0.001, 0.01, 0.1, 0.5]}
        yTicks={[0, 0.25, 0.5, 0.75, 1]}
        fmtX={(v) => `${+(v * 100).toFixed(1)}%`}
        fmtY={(v) => `${Math.round(v * 100)}%`}
        xLabel="유병률 P(병) — 로그 눈금"
        yLabel="P(병 | 양성)"
      />
      <line x1={A.left} y1={sy(0.99)} x2={A.left + A.width} y2={sy(0.99)} stroke={colors.red} strokeDasharray="6 4" />
      <text x={A.left + 8} y={sy(0.99) - 6} fontSize={10.5} fontWeight={700} fill={colors.red}>
        직관이 기대하는 값: 민감도 99%
      </text>
      <path d={linePath(pts)} fill="none" stroke={colors.blue} strokeWidth={2.6} />
      <Arr x1={sx(0.01)} y1={sy(0.99) + 4} x2={sx(0.01)} y2={sy(post(0.01)) - 8} color={colors.red} marker={`${P}-red`} width={1.4} dashed />
      <text x={sx(0.01) + 6} y={sy(0.58)} fontSize={10.5} fill={colors.red}>
        기저율 무시로 생기는 착각
      </text>
      {marks.map((m) => (
        <g key={m.p}>
          <circle cx={sx(m.p)} cy={sy(post(m.p))} r={5.5} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={sx(m.p) + 10} y={sy(post(m.p)) + 16} fontSize={11} fontWeight={700} fill={colors.blue}>
            {m.label}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function LrConvergenceModes() {
  // L(w) = (w − 3)², w₀ = 0. 오차 w − 3이 매 스텝 (1 − 2η)배가 되므로 손실은 (1 − 2η)²배가 된다.
  const P = "lrc";
  const traj = (eta: number, n: number) => Array.from({ length: n + 1 }, (_, t) => 3 - 3 * (1 - 2 * eta) ** t);
  const L = { left: 46, top: 32, width: 256, height: 190 };
  const lx = linear(0, 8, L.left, L.left + L.width);
  const ly = linear(-7, 14, L.top + L.height, L.top);
  const clampY = (w: number) => Math.max(-7, Math.min(14, w));
  const left = [
    { eta: 0.1, color: colors.blue, label: "η = 0.1 (배율 0.8)" },
    { eta: 0.5, color: colors.green, label: "η = 0.5 (배율 0)" },
    { eta: 0.9, color: colors.violet, label: "η = 0.9 (배율 −0.8)" },
    { eta: 1.1, color: colors.red, label: "η = 1.1 (배율 −1.2)" },
  ];
  const R = { left: 392, top: 32, width: 196, height: 190 };
  const rx = linear(0, 10, R.left, R.left + R.width);
  const ry = log10Scale(0.05, 600, R.top + R.height, R.top);
  const right = [
    { eta: 0.01, color: inkMuted, label: "η = 0.01: ×0.96" },
    { eta: 0.1, color: colors.blue, label: "η = 0.1: ×0.64" },
    { eta: 1.1, color: colors.red, label: "η = 1.1: ×1.44" },
  ];
  return (
    <DiagramFrame
      title="학습률 η가 정하는 배율 (1 − 2η): 수렴·진동·발산"
      caption="왼쪽: w₀ = 0에서 출발한 w의 궤적. 배율이 0.8이면 한쪽에서 다가가고, 0이면 한 번에 도착하고, −0.8이면 정답(점선 w = 3)을 넘나들며 다가가고, −1.2면 넘나들수록 멀어진다(발산). 오른쪽: 손실 (w − 3)²을 로그 눈금으로 그리면 매 스텝 일정한 배율 (1 − 2η)²으로 줄거나 늘어 직선이 된다. 이것이 지수적 감소(증가)다. η = 0.9는 |1 − 2η|가 η = 0.1과 같아 손실도 같은 속도로 준다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ green: colors.green }} />
      <defs>
        <clipPath id="lrc-clip">
          <rect x={L.left} y={L.top} width={L.width} height={L.height} />
        </clipPath>
      </defs>
      <text x={L.left + L.width / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 스텝마다의 w
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 2, 4, 6, 8]} yTicks={[-5, 0, 5, 10]} xLabel="스텝 t" yLabel="w" fmtY={(v) => String(v).replace("-", "−")} />
      <line x1={L.left} y1={ly(3)} x2={L.left + L.width} y2={ly(3)} stroke={inkSecondary} strokeDasharray="5 4" />
      <text x={L.left + L.width + 4} y={ly(3) + 4} fontSize={10} fontWeight={700} fill={inkSecondary}>
        w = 3
      </text>
      <g clipPath="url(#lrc-clip)">
        {left.map((sr) => {
          const ws = traj(sr.eta, 8);
          return (
            <g key={sr.eta}>
              <path d={linePath(ws.map((w, t) => [lx(t), ly(w)]))} fill="none" stroke={sr.color} strokeWidth={1.8} />
              {ws.map((w, t) => (Math.abs(w) < 14 ? <circle key={t} cx={lx(t)} cy={ly(clampY(w))} r={3} fill={sr.color} /> : null))}
            </g>
          );
        })}
      </g>
      {left.map((sr, i) => (
        <g key={sr.eta}>
          <rect x={L.left + (i % 2) * 150} y={268 + Math.floor(i / 2) * 18} width={10} height={10} rx={2} fill={sr.color} />
          <text x={L.left + 14 + (i % 2) * 150} y={277 + Math.floor(i / 2) * 18} fontSize={10.5} fill={ink}>
            {sr.label}
          </text>
        </g>
      ))}

      <text x={R.left + R.width / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 손실 (w − 3)², 로그 눈금
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0.1, 1, 10, 100]} xLabel="스텝 t" yLabel="손실" />
      {right.map((sr) => {
        // 9·1.44¹⁰ ≈ 345라 열 스텝 모두 세로축(최대 600) 안에 들어온다
        const pts = Array.from({ length: 11 }, (_, t) => [rx(t), ry(9 * (1 - 2 * sr.eta) ** (2 * t))] as [number, number]);
        const end = pts[10];
        return (
          <g key={sr.eta}>
            <path d={linePath(pts)} fill="none" stroke={sr.color} strokeWidth={2} />
            <text x={end[0] + 6} y={end[1] + 4} fontSize={10.5} fontWeight={700} fill={sr.color}>
              {sr.label}
            </text>
          </g>
        );
      })}
      <Arr x1={rx(0) + 2} y1={ry(9)} x2={rx(1) - 2} y2={R.top + R.height - 6} color={colors.green} marker={`${P}-green`} width={1.8} />
      <text x={rx(1) + 6} y={R.top + R.height - 10} fontSize={10.5} fontWeight={700} fill={colors.green}>
        η = 0.5: 한 번에 0
      </text>
      <text x={R.left + R.width / 2} y={276} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        로그 눈금에서 직선 = 매 스텝 같은 배율
      </text>
    </DiagramFrame>
  );
}

export function ChainRuleChain() {
  // 본문 예: (x, y) = (2, 6), w = 1, L = (wx − y)². 앞으로 값을 계산하고, 뒤로 국소 미분을 곱한다.
  const P = "crc";
  const nodes = [
    { x: 84, label: "w = 1" },
    { x: 280, label: "ŷ = 2" },
    { x: 476, label: "e = −4" },
    { x: 648, label: "L = 16" },
  ];
  const ops = ["× x  (x = 2)", "− y  (y = 6)", "제곱"];
  const local = ["∂ŷ/∂w = x = 2", "∂e/∂ŷ = 1", "∂L/∂e = 2e = −8"];
  const grads = ["∂L/∂w = −8 × 2 = −16", "∂L/∂ŷ = −8 × 1 = −8", "∂L/∂e = −8", "∂L/∂L = 1"];
  // 아래 줄 상자의 반폭: 첫 상자(최종 기울기)만 넓다
  const half = (i: number) => (i === 0 ? 78 : 64);
  return (
    <DiagramFrame
      title="연쇄법칙: 앞으로 계산하고, 뒤로 곱한다"
      caption="위(파랑): w에서 시작해 ŷ = wx, 오차 e = ŷ − y, 손실 L = e²을 차례로 계산한다. 아래(주황): 끝에서부터 각 단계의 국소 미분(2e, 1, x)을 하나씩 곱해 오면 ∂L/∂w = 2(wx − y)·x = −16이 된다. 기울기가 음수이므로 w를 키우는 쪽으로 갱신한다. 3주차의 역전파는 이 곱셈을 모든 층에 자동으로 반복한다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <text x={16} y={22} fontSize={11.5} fontWeight={700} fill={colors.blue}>
        앞으로: 값을 계산
      </text>
      <text x={16} y={222} fontSize={11.5} fontWeight={700} fill={colors.orange}>
        뒤로: 국소 미분을 곱한다
      </text>
      {nodes.map((n, i) => (
        <g key={n.label}>
          <Tag x={n.x - 52} y={50} w={104} h={36} lines={[n.label]} color={i === 0 ? colors.violet : colors.blue} tint={0.14} size={13} />
          <Tag
            x={n.x - half(i)}
            y={150}
            w={2 * half(i)}
            h={34}
            lines={[grads[i]]}
            color={colors.orange}
            tint={i === 0 ? 0.24 : 0.1}
            size={11}
          />
        </g>
      ))}
      {ops.map((o, i) => (
        <g key={o}>
          <Arr x1={nodes[i].x + 54} y1={68} x2={nodes[i + 1].x - 56} y2={68} color={colors.blue} marker={`${P}-blue`} width={1.8} />
          <text x={(nodes[i].x + nodes[i + 1].x) / 2} y={58} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.blue}>
            {o}
          </text>
          <Arr
            x1={nodes[i + 1].x - half(i + 1) - 2}
            y1={167}
            x2={nodes[i].x + half(i) + 4}
            y2={167}
            color={colors.orange}
            marker={`${P}-orange`}
            width={1.8}
          />
          <text x={(nodes[i].x + nodes[i + 1].x) / 2 + (i === 0 ? 6 : 0)} y={142} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
            {`× ${local[i]}`}
          </text>
        </g>
      ))}
      {nodes.map((n) => (
        <line key={n.x} x1={n.x} y1={88} x2={n.x} y2={148} stroke="var(--border-strong)" strokeDasharray="2 3" />
      ))}
    </DiagramFrame>
  );
}

export function CriticalPoints() {
  // 왼쪽: 울퉁불퉁한 1차원 손실에서 출발점에 따라 다른 바닥에 멈춘다. 오른쪽: 안장점 z = x² − y² (기울기 0이지만 최소가 아님).
  const P = "cpt";
  const f = (w: number) => 2.6 - 2.1 * Math.exp(-((w - 1.3) ** 2) / 0.55) - 1.25 * Math.exp(-((w + 1.5) ** 2) / 0.4) + 0.12 * w * w;
  const A = { left: 30, top: 40, width: 300, height: 170 };
  const sx = linear(-3, 3, A.left, A.left + A.width);
  const sy = linear(0, 3.6, A.top + A.height, A.top);
  const descend = (w0: number) => {
    let w = w0;
    for (let i = 0; i < 600; i++) {
      const g = (f(w + 1e-4) - f(w - 1e-4)) / 2e-4;
      w -= 0.02 * g;
    }
    return w;
  };
  const runs = [
    { start: -2.75, color: colors.orange, name: "A" },
    { start: -0.15, color: colors.blue, name: "B" },
  ].map((r) => ({ ...r, end: descend(r.start) }));
  const curve = sample(f, -3, 3, 160).map(([w, v]) => [sx(w), sy(v)] as [number, number]);
  const halo = { stroke: "var(--surface-card)", strokeWidth: 4, paintOrder: "stroke" as const };
  // 안장점 투영
  const cx = 545;
  const cy = 146;
  const proj = (x: number, y: number): [number, number] => {
    const z = x * x - y * y;
    return [cx + (x - y) * 0.866 * 92, cy + (x + y) * 0.5 * 54 - z * 54];
  };
  const steps = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const along = (fixed: number, axis: "x" | "y") =>
    linePath(
      Array.from({ length: 41 }, (_, i) => {
        const t = -1 + i * 0.05;
        return axis === "x" ? proj(t, fixed) : proj(fixed, t);
      }),
    );
  return (
    <DiagramFrame
      title="기울기가 0인 곳이 모두 최솟값은 아니다: 극소점과 안장점"
      caption="왼쪽: 같은 경사하강법이라도 A에서 출발하면 주변보다만 낮은 극소점에, B에서 출발하면 가장 낮은 최솟값에 멈춘다(화살표는 내리막을 따라간 경로). 오른쪽: 안장점에서는 한 방향(파랑)으로는 오르막이라 그릇 바닥처럼 보이지만 다른 방향(주황)으로는 내리막이다. 두 곳 모두 기울기가 0이라 갱신이 느려지거나 멈춘다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <text x={A.left + A.width / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 출발점에 따라 다른 바닥
      </text>
      <path d={linePath(curve)} fill="none" stroke={inkSecondary} strokeWidth={2.2} />
      {runs.map((r) => {
        const seg = sample(f, r.start, r.end - 0.08, 40).map(([w, v]) => [sx(w), sy(v) - 8] as [number, number]);
        return (
          <g key={r.name}>
            <path d={linePath(seg)} fill="none" stroke={r.color} strokeWidth={2.6} markerEnd={`url(#${P}-${r.name === "A" ? "orange" : "blue"})`} />
            <circle cx={sx(r.start)} cy={sy(f(r.start)) - 8} r={5} fill={r.color} />
            <text x={sx(r.start)} y={sy(f(r.start)) - 18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={r.color}>
              {r.name}
            </text>
            <circle cx={sx(r.end)} cy={sy(f(r.end))} r={5.5} fill="none" stroke={r.color} strokeWidth={2} />
          </g>
        );
      })}
      <Lines x={sx(runs[0].end)} y={sy(f(runs[0].end)) + 22} lines={["극소점", "(local minimum)"]} size={10.5} weight={700} color={colors.orange} />
      <Lines x={sx(runs[1].end) + 14} y={sy(f(runs[1].end)) + 4} lines={["최솟값", "(global minimum)"]} size={10.5} weight={700} color={colors.blue} anchor="start" />
      <text x={A.left + A.width / 2} y={250} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        가로: 파라미터 w · 세로: 손실 L(w)
      </text>

      <line x1={360} y1={14} x2={360} y2={250} stroke="var(--border-hairline)" />
      <text x={545} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 안장점 (saddle point): z = x² − y²
      </text>
      {steps.map((st) => (
        <path key={`y${st}`} d={along(st, "x")} fill="none" stroke={colors.blue} strokeOpacity={st === 0 ? 1 : 0.35} strokeWidth={st === 0 ? 2.6 : 1} />
      ))}
      {steps.map((st) => (
        <path key={`x${st}`} d={along(st, "y")} fill="none" stroke={colors.orange} strokeOpacity={st === 0 ? 1 : 0.35} strokeWidth={st === 0 ? 2.6 : 1} />
      ))}
      <circle cx={proj(0, 0)[0]} cy={proj(0, 0)[1]} r={5.5} fill={ink} />
      <text x={proj(0, 0)[0]} y={proj(0, 0)[1] - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink} {...halo}>
        기울기 0
      </text>
      <text x={proj(1, 0)[0] + 6} y={proj(1, 0)[1] - 4} fontSize={10.5} fontWeight={700} fill={colors.blue} {...halo}>
        이 방향은 오르막
      </text>
      <text x={proj(0, 1)[0] - 6} y={proj(0, 1)[1] + 16} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.orange} {...halo}>
        이 방향은 내리막
      </text>
    </DiagramFrame>
  );
}
