import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, seeded, gaussian, starPath, mono, normCdf } from "./chart";

export function AiHierarchy() {
  // AI ⊃ ML ⊃ DL ⊃ LLM은 "방법" 기준의 포함관계다. 생성형 AI는 "기능" 기준이라 ML·DL 경계를 가로질러 겹쳐 그린다.
  const layers = [
    { label: "인공지능 (AI)", note: "예: 규칙·탐색 기반 시스템", color: colors.blue, x: 20, y: 20, w: 600, h: 290 },
    { label: "머신러닝 (ML)", note: "데이터에서 규칙을 학습", color: colors.aqua, x: 44, y: 54, w: 552, h: 240 },
    { label: "딥러닝 (DL)", note: "다층 신경망", color: colors.violet, x: 68, y: 88, w: 330, h: 190 },
  ];
  const gen = { x: 180, y: 146, w: 392, h: 140 };
  return (
    <DiagramFrame
      title="AI·머신러닝·딥러닝의 포함 관계와 생성형 AI"
      caption="AI ⊃ 머신러닝 ⊃ 딥러닝 ⊃ LLM은 포함 관계다. 생성형 AI(점선)는 '새 데이터를 만드는가'라는 다른 기준으로 묶은 범주라서 딥러닝의 경계에 걸쳐 있다."
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
      title="손실을 줄이는 학습 루프"
      viewBox="0 0 760 220"
      caption="θ ← θ − η∇θL을 반복하면서 예측이 정답에 가까워지도록 파라미터를 갱신한다."
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
        text="θ ← θ − η · ∇θL  (기울기 반대 방향으로 학습률 η만큼 이동)"
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
      title="축(axis)과 브로드캐스팅"
      caption="axis=0은 위아래로(행을 따라) 합쳐 열마다 값이 하나씩 나오고, axis=1은 좌우로(열을 따라) 합쳐 행마다 값이 하나씩 나온다. 합친 축은 결과의 모양에서 빠진다. 오른쪽: 모양이 (3,)인 배열은 (2, 3) 배열의 각 행에 하나씩 복제된 것처럼 계산된다."
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
      title="베이즈 정리를 사람 수로 계산하기: 1만 명이 검사를 받으면"
      caption="양성 판정을 받은 594명 가운데 실제 환자는 99명뿐이다. 환자가 드물면(1%) 건강한 사람의 5%만 잘못 판정해도 그 수(495명)가 실제 환자보다 많아진다. 그래서 P(병|양성)은 약 16.7%에 그친다."
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
      {box(30, 186, 120, "양성 99명", "진양성", colors.red, true)}
      {box(200, 186, 110, "음성 1명", "위음성(놓친 환자)", colors.red)}
      {box(370, 186, 120, "양성 495명", "위양성", colors.blue, true)}
      {box(540, 186, 120, "음성 9,405명", "진음성", colors.blue)}
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
      caption="두 방식 모두 입력·규칙·출력으로 이루어지지만, 무엇을 넣고 무엇을 얻는지가 반대다. 전통적 프로그래밍은 사람이 작성한 규칙(주황)을 넣어 답(파랑)을 얻고, 머신러닝은 답이 달린 데이터를 넣어 규칙(주황)을 얻는다. 이렇게 얻은 규칙에 새 입력을 넣어 답을 내는 것이 추론이다."
      viewBox="0 0 720 250"
      minWidth={540}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {row(64, "전통적 프로그래밍", "사람이 규칙을 작성한다", "메일 본문", ["규칙", "'무료'가 있으면 스팸"], colors.orange, ["프로그램 실행", "규칙대로 계산"], ["출력", "스팸 / 정상"], colors.blue)}
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
      title="함수를 찾는 게임: 후보 θ마다 손실을 계산하면 골짜기가 보인다"
      caption="왼쪽은 데이터 세 점과 후보 직선 fθ(x) = θx이고, 오른쪽은 각 후보의 평균제곱오차(MSE)다. 보라색 점선은 최적 직선과 각 점 사이의 오차이며, 이 오차를 제곱해 평균한 값이 오른쪽 곡선의 높이다. 곡선이 가장 낮은 θ* = 31/14 ≈ 2.21이 '가장 잘 맞는 직선'의 기울기다. θ = 1에서는 곡선의 기울기가 음수이므로 θ를 키우는 쪽이 내리막이다. 이 기울기를 따라 최저점으로 내려가는 방법이 경사하강법이다."
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

      <Lines x={R.left + R.width / 2} y={18} lines={["② 후보별 손실 L(θ) (MSE)"]} size={12} weight={700} color={ink} />
      <Axes {...R} sx={rx} sy={ry} xTicks={[1, 1.5, 2, 2.5, 3]} yTicks={[0, 2, 4, 6, 8, 10]} xLabel="θ (기울기 후보)" yLabel="MSE 손실" />
      <path d={linePath(curve)} fill="none" stroke={inkSecondary} strokeWidth={2} />
      <line x1={rx(0.84)} y1={ry(7 + slope1 * -0.16)} x2={rx(1.36)} y2={ry(7 + slope1 * 0.36)} stroke={colors.blue} strokeWidth={1.8} strokeDasharray="5 3" />
      <Lines x={rx(1.1)} y={ry(9.1)} lines={["θ = 1에서 기울기 ≈ −11.3 < 0", "→ θ를 키우면 손실이 줄어든다"]} size={10} color={colors.blue} anchor="start" />
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
      caption="분류는 경계를 기준으로 새 입력(보라 테두리 점)이 어느 보기에 속하는지 정하고, 회귀는 새 x에 대응하는 숫자 ŷ를 예측한다. 생성은 학습 데이터(회색)의 분포를 배운 뒤 그 분포에서 새 표본(별)을 뽑는다."
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
      title="판별 모델과 생성 모델: 무엇을 학습하는가"
      caption="왼쪽: 판별 모델은 'x가 어느 클래스인가'만 알면 되므로 두 클래스를 가르는 경계(P(스팸|x) = 0.5인 선)만 학습한다. 오른쪽: 생성 모델은 클래스마다 데이터가 어떻게 분포하는지(점선 등고선)를 학습한다. 분포를 알면 그럴듯한 새 x(별)를 뽑을 수 있고, 베이즈 정리로 분류도 할 수 있다."
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
      <Lines x={368 + plot.w / 2} y={256} lines={["클래스별 분포를 배운다", "→ 새 x(★)를 뽑을 수 있다"]} size={11} color={inkSecondary} />
    </DiagramFrame>
  );
}

export function LearningParadigms() {
  const P = "lp";
  const W = 342;
  const H = 172;
  const cells = [
    { x: 12, y: 10, title: "① 지도학습", color: colors.blue, signal: "학습 신호: 사람이 붙인 정답 (x, y)" },
    { x: 366, y: 10, title: "② 비지도학습", color: colors.aqua, signal: "학습 신호: 정답 없음, 데이터 자체의 구조" },
    { x: 12, y: 192, title: "③ 자기지도학습", color: colors.violet, signal: "학습 신호: 데이터에서 가린 부분(자동으로 생기는 정답)" },
    { x: 366, y: 192, title: "④ 강화학습", color: colors.orange, signal: "학습 신호: 행동에 대한 보상(늦게, 드물게 온다)" },
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
      title="4대 학습 패러다임: 무엇을 학습 신호로 삼는가"
      caption="네 패러다임을 가르는 기준은 모델 구조가 아니라 학습 신호다. 지도학습은 사람이 단 정답을, 비지도학습은 정답 없이 데이터 자체의 구조를, 자기지도학습은 원문에서 가린 부분을, 강화학습은 행동 뒤에 받는 보상을 신호로 쓴다. LLM 사전학습은 ③, RLHF는 ④에 해당한다."
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
      <Lines x={218} y={302} lines={["가려 둔 원래 단어", "= 사람이 달지 않은 정답"]} size={10.5} weight={600} color={colors.violet} anchor="end" />
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
      caption="위: b = a는 리스트를 복사하지 않고, 같은 리스트에 b라는 이름표를 하나 더 붙인다. 그래서 b에 4를 추가하면 a에서도 바뀐 내용이 보인다. 아래: a.copy()는 내용이 같은 새 리스트를 만들므로 c를 고쳐도 a는 그대로다."
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
      title="리스트의 +와 NumPy 배열의 +, *, @는 계산이 다르다"
      caption="파이썬 리스트의 +는 두 리스트를 이어 붙인다. NumPy 배열의 +와 *는 같은 자리(같은 색)끼리 계산하므로 결과의 모양도 (3,) 그대로다. @는 같은 자리끼리 곱한 뒤 모두 더해 숫자 하나를 만드는 내적이다(1·10 + 2·20 + 3·30 = 140)."
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
      title="행렬-벡터 곱 Wx: W의 각 행과 x의 내적"
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
      caption="왼쪽: [3, 4]의 길이는 피타고라스 정리로 5이고, 자기 길이로 나누면 방향은 같고 길이가 1인 단위벡터 [0.6, 0.8]이 된다(점선 원의 반지름이 1). 오른쪽: a = [1, 2]와 b = [2, 1] 사이 각은 약 36.9°, cos θ = 0.8이다. b를 10배 늘린 [20, 10]은 같은 방향이라 내적은 4 → 40으로 커져도 코사인 유사도는 0.8 그대로다."
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
      title="조건부확률: 조건을 알면 따져 볼 범위가 좁아진다"
      caption="100일 가운데 우산을 챙긴 날은 40일이므로 P(우산) = 0.4다. 그런데 '비가 왔다'는 사실을 알면 비가 오지 않은 70일은 더 따질 필요가 없다. 남은 30일 중 우산을 챙긴 날이 24일이므로 P(우산 | 비) = 24/30 = 0.8이다. 공식 P(A|B) = P(A∩B)/P(B)의 분모 P(B)가 이렇게 좁혀진 범위의 크기다."
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
      <Lines x={387} y={104} lines={["'비가 왔다'를 알면", "비 안 온 날은 제외"]} size={10.5} weight={600} color={inkSecondary} />

      <circle cx={560} cy={132} r={98} fill={colors.blue} fillOpacity={0.12} stroke={colors.blue} strokeWidth={2} />
      <circle cx={672} cy={132} r={110} fill={colors.violet} fillOpacity={0.32} clipPath="url(#cvn-clip-right)" />
      <text x={560} y={24} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.blue}>
        남은 범위 = 비 온 30일
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
      title="같은 검사라도 기저율에 따라 달라지는 P(병 | 양성)"
      caption="민감도 99%, 위양성률 5%인 같은 검사라도 유병률(가로축, 로그 눈금)이 낮을수록 양성 판정을 받은 사람이 실제 환자일 확률(세로축)은 급격히 떨어진다. 직관적으로는 위쪽 점선(99%) 정도라고 생각하기 쉽지만, 유병률 1%에서는 16.7%밖에 되지 않는다. 이 차이가 기저율을 무시해서 생기는 오류의 크기다."
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
        직관적으로 떠올리는 값: 민감도 99%
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
      caption="왼쪽: w₀ = 0에서 출발한 w의 궤적이다. 배율이 0.8이면 한쪽에서 서서히 다가가고, 0이면 한 번에 도착하며, −0.8이면 정답(점선 w = 3)을 사이에 두고 오가며 다가가고, −1.2면 오갈수록 멀어진다(발산). 오른쪽: 손실 (w − 3)²은 매 스텝 일정한 배율 (1 − 2η)²으로 줄거나 늘어나므로 로그 눈금에서 직선이 된다. 이것이 지수적 감소(증가)다. η = 0.9는 |1 − 2η|가 η = 0.1일 때와 같아서 손실도 같은 속도로 줄어든다."
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
        ① 스텝별 w
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
      caption="위(파랑): w에서 시작해 ŷ = wx, 오차 e = ŷ − y, 손실 L = e²을 차례로 계산한다. 아래(주황): 끝에서부터 각 단계의 국소 미분(2e, 1, x)을 하나씩 곱해 나가면 ∂L/∂w = 2(wx − y)·x = −16이 된다. 기울기가 음수이므로 w를 키우는 쪽으로 갱신한다. 3주차에 배울 역전파는 이 곱셈을 모든 층에 대해 자동으로 반복한다."
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
      caption="왼쪽: 같은 경사하강법이라도 A에서 출발하면 주변보다만 낮은 극소점에, B에서 출발하면 전체에서 가장 낮은 최솟값에 멈춘다(화살표는 내리막을 따라간 경로). 오른쪽: 안장점에서는 한 방향(파랑)으로는 오르막이라 그릇 바닥처럼 보이지만 다른 방향(주황)으로는 내리막이다. 두 곳 모두 기울기가 0이라 갱신이 느려지거나 멈춘다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <text x={A.left + A.width / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 출발점에 따라 달라지는 도착점
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

// ───────────────────────── 1주차 보충 과정 그림 ─────────────────────────

const chip1 = (x: number, y: number, text: string, color: string, w = 64, h = 24, tint = 0.14, size = 11, weight = 700, font?: string) => (
  <g key={`${x}-${y}-${text}`}>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} fillOpacity={tint} stroke={color} strokeWidth={1.2} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={weight} fill={ink} fontFamily={font}>
      {text}
    </text>
  </g>
);

export function ClassObjects() {
  // 본문 코드의 Perceptron 클래스: 틀(클래스) 하나로 w, b가 다른 객체를 여러 개 찍어 낸다.
  const P = "clo";
  return (
    <DiagramFrame
      title="클래스는 틀이고, 객체는 그 틀로 찍어 낸 것이다"
      caption="왼쪽의 Perceptron 클래스는 '어떤 속성(w, b)을 갖고 어떤 동작(predict)을 하는가'를 적은 틀이다. Perceptron(w=2, b=1)처럼 호출하면 __init__이 자동으로 실행되어 자기만의 w, b를 가진 객체가 하나 생긴다. 같은 틀로 만든 p와 q는 서로의 값에 영향을 주지 않는다. p.predict(3)을 호출하면 파이썬이 self 자리에 p를 넣어 주므로, 계산에는 p의 w와 b가 쓰인다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, violet: colors.violet }} />
      <rect x={14} y={20} width={220} height={150} rx={10} fill={colors.violet} fillOpacity={0.06} stroke={colors.violet} strokeWidth={1.6} strokeDasharray="6 4" />
      <text x={26} y={42} fontSize={12.5} fontWeight={800} fill={colors.violet} fontFamily={mono}>
        class Perceptron
      </text>
      <text x={224} y={42} textAnchor="end" fontSize={10} fill={inkSecondary}>
        틀 (설계도)
      </text>
      {[
        { y: 68, indent: 0, t: "def __init__(self, w, b):" },
        { y: 84, indent: 1, t: "self.w = w" },
        { y: 100, indent: 1, t: "self.b = b" },
        { y: 126, indent: 0, t: "def predict(self, x):" },
        { y: 142, indent: 1, t: "return self.w * x + self.b" },
      ].map((l) => (
        <text key={l.y} x={26 + l.indent * 18} y={l.y} fontSize={10.5} fill={ink} fontFamily={mono}>
          {l.t}
        </text>
      ))}
      {[
        { y: 22, name: "p = Perceptron(w=2, b=1)", w: "2", b: "1", c: colors.blue },
        { y: 112, name: "q = Perceptron(w=-1, b=0.5)", w: "−1", b: "0.5", c: colors.orange },
      ].map((o) => (
        <g key={o.name}>
          <Arr x1={236} y1={95} x2={286} y2={o.y + 30} color={inkSecondary} marker={`${P}-ink`} />
          <text x={292} y={o.y + 6} fontSize={10} fill={inkSecondary} fontFamily={mono}>
            {o.name}
          </text>
          <rect x={292} y={o.y + 14} width={150} height={56} rx={10} fill={o.c} fillOpacity={0.12} stroke={o.c} strokeWidth={1.6} />
          <text x={304} y={o.y + 36} fontSize={11.5} fontWeight={800} fill={o.c}>
            {o.name[0]} (객체)
          </text>
          <text x={304} y={o.y + 56} fontSize={11} fill={ink} fontFamily={mono}>
            {`w = ${o.w},  b = ${o.b}`}
          </text>
        </g>
      ))}
      <rect x={470} y={38} width={236} height={124} rx={10} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={482} y={60} fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
        p.predict(3)
      </text>
      <Arr x1={588} y1={66} x2={588} y2={80} color={colors.violet} marker={`${P}-violet`} />
      <text x={482} y={98} fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
        predict(self=p, x=3)
      </text>
      <Arr x1={588} y1={104} x2={588} y2={118} color={colors.violet} marker={`${P}-violet`} />
      <text x={482} y={136} fontSize={11} fontWeight={700} fill={ink} fontFamily={mono}>
        p.w × 3 + p.b = 2×3 + 1 = 7
      </text>
      <text x={588} y={186} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.violet}>
        self = 이 메서드를 호출한 객체 자신
      </text>
      <text x={124} y={196} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        붕어빵 틀 하나로 속이 다른 붕어빵을 여러 개
      </text>
    </DiagramFrame>
  );
}

export function ExceptionFlow() {
  // 본문 코드의 safe_divide와 RunningMean.result()의 raise.
  const P = "exf";
  const box = (x: number, y: number, w: number, lines: string[], c: string, tint = 0.1) => (
    <g>
      <rect x={x} y={y} width={w} height={lines.length * 15 + 12} rx={6} fill={c} fillOpacity={tint} stroke={c} strokeWidth={1.2} />
      {lines.map((l, i) => (
        // 앞 공백 두 칸 = 들여쓰기 한 단계 (SVG는 공백을 합쳐 버리므로 x로 민다)
        <text key={i} x={x + 10 + ((l.length - l.trimStart().length) / 2) * 12} y={y + 18 + i * 13.8} fontSize={10.2} fill={ink}>
          {l.trimStart()}
        </text>
      ))}
    </g>
  );
  return (
    <DiagramFrame
      title="예외 처리: 오류가 나면 except로 건너뛴다"
      caption="왼쪽: safe_divide(10, 2)는 try 블록을 끝까지 실행해 5.0을 반환한다. 가운데: safe_divide(10, 0)은 a / b에서 ZeroDivisionError가 발생하는 순간 try의 나머지를 건너뛰고 except 블록으로 넘어가, 경고를 출력하고 None을 반환한다. 프로그램은 멈추지 않는다. 오른쪽: 함수 안에서 raise로 일으킨 예외는 그 함수를 빠져나와 호출한 쪽으로 올라가고, 호출한 쪽의 try/except가 받아서 처리한다. 끝까지 잡는 곳이 없으면 그때 프로그램이 멈춘다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ green: colors.green, orange: colors.orange, red: colors.red }} />
      <text x={110} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.green}>
        safe_divide(10, 2)
      </text>
      {box(20, 30, 180, ["try:", "  return a / b   → 5.0"], colors.green)}
      <Arr x1={110} y1={74} x2={110} y2={104} color={colors.green} marker={`${P}-green`} />
      {chip1(40, 108, "5.0 반환", colors.green, 140, 28, 0.14, 11)}
      <text x={355} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.orange}>
        safe_divide(10, 0)
      </text>
      {box(260, 30, 190, ["try:", "  return a / b   ✗ 0으로 나눔"], colors.orange)}
      <text x={355} y={96} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.red} stroke="var(--surface-card)" strokeWidth={4} paintOrder="stroke">
        ZeroDivisionError 발생 → 나머지를 건너뜀
      </text>
      <Arr x1={355} y1={74} x2={355} y2={118} color={colors.red} marker={`${P}-red`} width={1.8} />
      {box(260, 122, 190, ["except ZeroDivisionError:", "  print(\"0으로 나눌 수 없습니다.\")", "  return None"], colors.orange)}
      <Arr x1={355} y1={181} x2={355} y2={198} color={colors.orange} marker={`${P}-orange`} />
      {chip1(275, 202, "None 반환, 실행은 계속", colors.orange, 160, 28, 0.14, 11)}
      <line x1={476} y1={14} x2={476} y2={240} stroke="var(--border-hairline)" />
      <text x={596} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.violet}>
        raise: 호출한 쪽으로 알린다
      </text>
      {box(494, 30, 212, ["valid_loss.result()", "  count == 0 → raise ValueError(...)"], colors.violet)}
      <ArrPath d="M600,74 C600,96 600,104 600,118" color={colors.red} marker={`${P}-red`} width={1.8} />
      <text x={608} y={100} fontSize={9.5} fontWeight={700} fill={colors.red}>
        함수를 빠져나와 위로
      </text>
      {box(494, 122, 212, ["호출한 쪽:", "try: valid_loss.result()", "except ValueError as e:", "  print(\"처리한 오류:\", e)"], colors.violet)}
      <text x={600} y={214} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        잡는 except가 없으면 프로그램이 멈춘다
      </text>
    </DiagramFrame>
  );
}

export function RunningMeanTrace() {
  // 본문 코드의 RunningMean: 2, 4, 9를 차례로 더한다. 새 평균 = 옛 평균 + (새 값 − 옛 평균) / 개수.
  const P = "rmt";
  const sx = linear(0, 10, 150, 560);
  const steps = [
    { x: 2, n: 1, old: 0, neu: 2 },
    { x: 4, n: 2, old: 2, neu: 3 },
    { x: 9, n: 3, old: 3, neu: 5 },
  ];
  return (
    <DiagramFrame
      title="평균을 차례로 갱신하기: 새 값 쪽으로 1/개수만큼 다가간다"
      caption="본문 RunningMean의 add()가 하는 일이다. 새 값이 들어오면 지금 평균에서 새 값까지 거리의 1/개수만큼만 움직인다. 첫 값 2에는 끝까지(1/1), 두 번째 값 4에는 절반(1/2)만 다가가 3, 세 번째 값 9에는 1/3만 다가가 5가 된다. 결과는 (2 + 4 + 9) / 3 = 5와 같지만, 값을 모두 저장하지 않고 개수와 평균 두 숫자만 유지한다. 값이 쌓일수록 새 값 하나가 평균을 움직이는 폭이 작아진다."
      viewBox="0 0 720 204"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ violet: colors.violet }} />
      {steps.map((st, i) => {
        const y = 30 + i * 50;
        return (
          <g key={i}>
            <text x={14} y={y + 5} fontSize={11} fontWeight={700} fill={ink} fontFamily={mono}>
              {`add(${st.x})  count=${st.n}`}
            </text>
            <line x1={sx(0)} x2={sx(10)} y1={y} y2={y} stroke="var(--border-strong)" />
            <circle cx={sx(st.old)} cy={y} r={5} fill={inkMuted} />
            <text x={sx(st.old)} y={y + 18} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {`이전 평균 ${st.old}`}
            </text>
            {st.neu !== st.old && <Arr x1={sx(st.old) + 6} y1={y - 3} x2={sx(st.neu) - 3} y2={y - 3} color={colors.violet} marker={`${P}-violet`} width={2.2} />}
            <circle cx={sx(st.neu)} cy={y} r={st.neu === st.x ? 7 : 5} fill={colors.violet} />
            <path d={starPath(sx(st.x), y, st.neu === st.x ? 5 : 7)} fill={colors.orange} />
            <text x={sx(st.x)} y={y - 10} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.orange}>
              {`새 값 ${st.x}`}
            </text>
            <text x={588} y={y + 4} fontSize={10.5} fontWeight={700} fill={colors.violet} fontFamily={mono}>
              {`${st.old} + (${st.x}−${st.old})/${st.n} = ${st.neu}`}
            </text>
          </g>
        );
      })}
      {[0, 2, 4, 6, 8, 10].map((t) => (
        <text key={t} x={sx(t)} y={186} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
    </DiagramFrame>
  );
}

export function VenvIsolation() {
  // 가상환경이 없으면 모든 프로젝트가 한 설치 공간을 공유해 버전이 부딪친다. venv는 프로젝트마다 따로 둔다.
  const pkg = (x: number, y: number, t: string, c: string) => chip1(x, y, t, c, 108, 22, 0.14, 10, 600, mono);
  return (
    <DiagramFrame
      title="가상환경(venv): 프로젝트마다 따로 쓰는 설치 공간"
      caption="왼쪽: 가상환경 없이 설치하면 모든 프로젝트가 컴퓨터의 설치 공간 하나를 함께 쓴다. 프로젝트 A가 numpy 1.26을, B가 numpy 2.1을 요구하면 둘 중 하나는 깨진다. 오른쪽: python -m venv .venv로 프로젝트 폴더 안에 독립된 설치 공간을 만들고 활성화한 뒤 패키지를 설치하면, 프로젝트마다 필요한 버전을 따로 쓸 수 있다. 필요한 패키지 목록은 requirements.txt로 공유한다."
      viewBox="0 0 720 220"
      minWidth={580}
    >
      <text x={175} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.red}>
        가상환경 없이: 한곳에 모두 설치
      </text>
      <rect x={20} y={30} width={310} height={170} rx={10} fill={colors.red} fillOpacity={0.04} stroke={colors.red} strokeWidth={1.2} />
      {chip1(36, 44, "프로젝트 A", colors.blue, 120, 26, 0.12, 11)}
      {chip1(194, 44, "프로젝트 B", colors.orange, 120, 26, 0.12, 11)}
      <text x={175} y={96} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        둘 다 같은 설치 공간을 쓴다
      </text>
      <rect x={60} y={106} width={230} height={70} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      {pkg(72, 116, "numpy 1.26?", colors.blue)}
      {pkg(170, 116, "numpy 2.1?", colors.orange)}
      <text x={175} y={164} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.red}>
        ✗ 한 버전만 남는다 → 충돌
      </text>
      <line x1={360} y1={14} x2={360} y2={206} stroke="var(--border-hairline)" />
      <text x={545} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.green}>
        가상환경: 프로젝트마다 독립
      </text>
      {[
        { x: 380, name: "프로젝트 A/", pk: ["numpy 1.26", "pandas 2.0"], c: colors.blue },
        { x: 550, name: "프로젝트 B/", pk: ["numpy 2.1", "torch 2.4"], c: colors.orange },
      ].map((p) => (
        <g key={p.name}>
          <rect x={p.x} y={30} width={156} height={170} rx={10} fill={p.c} fillOpacity={0.05} stroke={p.c} strokeWidth={1.2} />
          <text x={p.x + 12} y={50} fontSize={11.5} fontWeight={800} fill={p.c}>
            {p.name}
          </text>
          <rect x={p.x + 12} y={62} width={132} height={86} rx={8} fill={card2Bg} stroke="var(--border-strong)" strokeDasharray="4 3" />
          <text x={p.x + 22} y={80} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
            .venv/
          </text>
          {p.pk.map((k, i) => pkg(p.x + 24, 88 + i * 26, k, p.c))}
          <text x={p.x + 78} y={170} textAnchor="middle" fontSize={9.5} fill={inkSecondary} fontFamily={mono}>
            requirements.txt
          </text>
          <text x={p.x + 78} y={188} textAnchor="middle" fontSize={9.5} fill={colors.green} fontWeight={700}>
            ✓ 자기 버전 유지
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function GitFlow() {
  // Git의 네 영역과 명령. .gitignore에 적은 파일은 처음부터 스테이징에 들어가지 않는다.
  const P = "gtf";
  const areas = [
    { t: "작업 폴더", s: "지금 고치는 파일들", x: 14, c: colors.blue },
    { t: "스테이징", s: "다음 커밋에 담을 변경", x: 194, c: colors.violet },
    { t: "로컬 저장소", s: "커밋 기록 (내 컴퓨터)", x: 374, c: colors.orange },
    { t: "원격 저장소", s: "GitHub (공유)", x: 554, c: colors.green },
  ];
  const w = 152;
  return (
    <DiagramFrame
      title="Git의 네 영역: add → commit → push, 그리고 pull"
      caption="파일을 고치면 작업 폴더가 바뀐다. git add로 다음 기록에 담을 변경을 고르고(스테이징), git commit -m '무엇을 왜'로 하나의 기록을 남긴다. git push는 그 기록을 GitHub에 올리고, git pull은 다른 사람이 올린 기록을 받아 온다. git clone은 원격 저장소를 처음 통째로 받는 명령이고, git status는 지금 무엇이 바뀌었는지 보여 준다. .gitignore에 적은 비밀값(.env), 가상환경(.venv/), 큰 데이터는 처음부터 기록에 들어가지 않는다. 한 번 올라간 비밀값은 지워도 기록에 남으므로 키 자체를 폐기해야 한다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, green: colors.green, red: colors.red }} />
      {areas.map((a) => (
        <g key={a.t}>
          <rect x={a.x} y={40} width={w} height={70} rx={10} fill={a.c} fillOpacity={0.12} stroke={a.c} strokeWidth={1.6} />
          <text x={a.x + w / 2} y={68} textAnchor="middle" fontSize={13} fontWeight={800} fill={ink}>
            {a.t}
          </text>
          <text x={a.x + w / 2} y={88} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {a.s}
          </text>
        </g>
      ))}
      {[
        { from: 0, cmd: "git add" },
        { from: 1, cmd: "git commit" },
        { from: 2, cmd: "git push" },
      ].map((e) => (
        <g key={e.cmd}>
          <Arr x1={areas[e.from].x + w + 2} y1={62} x2={areas[e.from + 1].x - 4} y2={62} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
          <text x={(areas[e.from].x + w + areas[e.from + 1].x) / 2} y={30} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink} fontFamily={mono}>
            {e.cmd}
          </text>
        </g>
      ))}
      <ArrPath d={`M${areas[3].x + 40},112 C${areas[3].x + 20},160 ${areas[0].x + 140},160 ${areas[0].x + 110},114`} color={colors.green} marker={`${P}-green`} width={1.8} />
      <text x={360} y={160} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.green} fontFamily={mono}>
        git pull (처음엔 git clone)
      </text>
      <rect x={14} y={178} width={340} height={46} rx={8} fill={colors.red} fillOpacity={0.06} stroke={colors.red} strokeDasharray="5 4" />
      <text x={24} y={196} fontSize={10.5} fontWeight={800} fill={colors.red} fontFamily={mono}>
        .gitignore
      </text>
      <text x={100} y={196} fontSize={10.5} fill={ink}>
        .env (API 키) · .venv/ · 큰 데이터·모델
      </text>
      <text x={24} y={214} fontSize={10} fill={inkSecondary}>
        → 처음부터 기록에 넣지 않는다
      </text>
      <rect x={374} y={178} width={332} height={46} rx={8} fill={card2Bg} stroke="var(--border-hairline)" />
      <text x={384} y={196} fontSize={10.5} fontWeight={700} fill={ink}>
        하루 작업 흐름: ① pull ② venv 활성화·설치 ③ 실험
      </text>
      <text x={384} y={214} fontSize={10.5} fontWeight={700} fill={ink}>
        ④ add → commit -m &quot;무엇을 왜&quot; → push
      </text>
    </DiagramFrame>
  );
}

export function BasisChange() {
  // 본문 예제: v = [3, 1]. 표준기저로는 (3, 1), 기저 b₁ = [1, 1], b₂ = [1, −1]로는 (2, 1).
  const P = "bch";
  const S = 26;
  const panel = (ox: number, oy: number, basis: [number[], number[]], coords: [number, number], colorsP: [string, string], title: string) => {
    const tx = (a: number, b: number) => ({ x: ox + (a * basis[0][0] + b * basis[1][0]) * S, y: oy - (a * basis[0][1] + b * basis[1][1]) * S });
    const lines = [];
    for (let k = -4; k <= 4; k++) {
      const p0 = tx(k, -4);
      const p1 = tx(k, 4);
      const q0 = tx(-4, k);
      const q1 = tx(4, k);
      lines.push(<line key={`a${k}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={colorsP[1]} strokeOpacity={0.18} />);
      lines.push(<line key={`b${k}`} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke={colorsP[0]} strokeOpacity={0.18} />);
    }
    const mid = tx(coords[0], 0);
    const end = tx(coords[0], coords[1]);
    const e1 = tx(1, 0);
    const e2 = tx(0, 1);
    return (
      <g>
        <clipPath id={`${P}-c${ox}`}>
          <rect x={ox - 110} y={oy - 112} width={250} height={170} />
        </clipPath>
        <g clipPath={`url(#${P}-c${ox})`}>{lines}</g>
        <rect x={ox - 110} y={oy - 112} width={250} height={170} fill="none" stroke="var(--border-hairline)" />
        <text x={ox + 15} y={oy - 122} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
          {title}
        </text>
        <Arr x1={ox} y1={oy} x2={e1.x} y2={e1.y} color={colorsP[0]} marker={`${P}-a`} width={2.4} />
        <Arr x1={ox} y1={oy} x2={e2.x} y2={e2.y} color={colorsP[1]} marker={`${P}-b`} width={2.4} />
        <line x1={ox} y1={oy} x2={mid.x} y2={mid.y} stroke={colorsP[0]} strokeWidth={1.6} strokeDasharray="4 3" />
        <line x1={mid.x} y1={mid.y} x2={end.x} y2={end.y} stroke={colorsP[1]} strokeWidth={1.6} strokeDasharray="4 3" />
        <Arr x1={ox} y1={oy} x2={end.x} y2={end.y} color={colors.red} marker={`${P}-v`} width={2.6} />
        <circle cx={ox} cy={oy} r={2.5} fill={ink} />
        <text x={end.x + 6} y={end.y - 6} fontSize={11.5} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
          v = [3, 1]
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="기저를 바꾸면 같은 벡터의 좌표가 바뀐다"
      caption="빨간 화살표는 두 그림에서 똑같은 벡터 v = [3, 1]이다. 왼쪽은 표준기저 e₁ = [1, 0], e₂ = [0, 1]의 격자로 잰 것이라 v = 3e₁ + 1e₂, 좌표는 (3, 1)이다. 오른쪽은 b₁ = [1, 1], b₂ = [1, −1]로 만든 비스듬한 격자로 잰 것이라 v = 2b₁ + 1b₂, 좌표는 (2, 1)이다. 점선은 각 기저 방향으로 몇 칸 갔는지를 보여 준다. 벡터는 그대로이고 자(기저)만 바뀌었다. PCA와 고유벡터 분해는 데이터를 표현하기에 더 좋은 기저를 찾는 방법이다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ a: colors.blue, b: colors.orange, v: colors.red }} />
      {panel(140, 172, [[1, 0], [0, 1]], [3, 1], [colors.blue, colors.orange], "표준기저: 좌표 (3, 1)")}
      {panel(470, 160, [[1, 1], [1, -1]], [2, 1], [colors.blue, colors.orange], "기저 b₁, b₂: 좌표 (2, 1)")}
      <text x={140 + 26 / 2 + 18} y={196} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        e₁
      </text>
      <text x={120} y={150} fontSize={10.5} fontWeight={700} fill={colors.orange}>
        e₂
      </text>
      <text x={484} y={130} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.blue}>
        b₁
      </text>
      <text x={486} y={198} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        b₂
      </text>
      <Lines x={640} y={70} lines={["3e₁ + 1e₂", "= 2b₁ + 1b₂", "= [3, 1]"]} size={11} anchor="start" color={ink} weight={700} gap={1.6} />
    </DiagramFrame>
  );
}

export function MatmulRowCol() {
  // 본문 예제: A = [[1, 2], [0, 1]], B = [[1, 0], [3, 1]] → AB = [[7, 2], [3, 1]]. C₁₁ = A의 1행 · B의 1열 = 1·1 + 2·3 = 7.
  const A = [
    [1, 2],
    [0, 1],
  ];
  const B = [
    [1, 0],
    [3, 1],
  ];
  const C = [
    [7, 2],
    [3, 1],
  ];
  const c = 38;
  const mat = (x: number, y: number, M: number[][], label: string, hi: (i: number, j: number) => boolean, color: string) => (
    <g>
      <text x={x + c} y={y - 10} textAnchor="middle" fontSize={13} fontWeight={800} fill={ink}>
        {label}
      </text>
      {M.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}${j}`}>
            <rect x={x + j * c} y={y + i * c} width={c - 3} height={c - 3} rx={4} fill={hi(i, j) ? color : inkMuted} fillOpacity={hi(i, j) ? 0.3 : 0.08} stroke={hi(i, j) ? color : "var(--border-hairline)"} strokeWidth={hi(i, j) ? 1.6 : 1} />
            <text x={x + j * c + (c - 3) / 2} y={y + i * c + c / 2 + 3} textAnchor="middle" fontSize={14} fontWeight={700} fill={ink}>
              {v}
            </text>
          </g>
        )),
      )}
    </g>
  );
  return (
    <DiagramFrame
      title="행렬 곱 C = AB: C의 (i, j)칸 = A의 i행 · B의 j열"
      caption="AB의 1행 1열은 A의 1행 [1, 2](파랑)와 B의 1열 [1, 3](주황)을 내적한 1·1 + 2·3 = 7이다. 나머지 칸도 같은 방식으로 '행 하나 · 열 하나'를 내적해 채운다. 그래서 A의 열 개수와 B의 행 개수(안쪽)가 같아야 곱할 수 있고, 결과의 모양은 A의 행 개수 × B의 열 개수(바깥)가 된다."
      viewBox="0 0 720 196"
      minWidth={560}
    >
      {mat(20, 50, A, "A", (i) => i === 0, colors.blue)}
      <text x={110} y={92} textAnchor="middle" fontSize={18} fontWeight={700} fill={inkSecondary}>
        ×
      </text>
      {mat(130, 50, B, "B", (_, j) => j === 0, colors.orange)}
      <text x={220} y={92} textAnchor="middle" fontSize={18} fontWeight={700} fill={inkSecondary}>
        =
      </text>
      {mat(240, 50, C, "AB", (i, j) => i === 0 && j === 0, colors.violet)}
      <text x={20} y={156} fontSize={12} fontWeight={700} fill={ink} fontFamily={mono}>
        C₁₁ = [1, 2] · [1, 3] = 1·1 + 2·3 = 7
      </text>
      <line x1={352} y1={14} x2={352} y2={182} stroke="var(--border-hairline)" />
      <text x={370} y={34} fontSize={12} fontWeight={800} fill={ink}>
        모양 규칙: (m × n)(n × p) = (m × p)
      </text>
      {[
        { a: "2 × 3", b: "3 × 4", r: "= 2 × 4", ok: true },
        { a: "2 × 3", b: "2 × 3", r: "안쪽 3 ≠ 2 → 곱할 수 없다", ok: false },
        { a: "n × d", b: "d × 1", r: "= n × 1 (행렬 × 벡터)", ok: true },
      ].map((r, i) => {
        const y = 62 + i * 40;
        return (
          <g key={i}>
            {chip1(370, y, r.a, colors.blue, 64, 26, 0.12, 11.5, 700, mono)}
            {chip1(442, y, r.b, colors.orange, 64, 26, 0.12, 11.5, 700, mono)}
            <text x={514} y={y + 18} fontSize={11} fontWeight={700} fill={r.ok ? colors.green : colors.red}>
              {`${r.ok ? "✓" : "✗"} ${r.r}`}
            </text>
          </g>
        );
      })}
      <text x={370} y={182} fontSize={10.5} fill={inkSecondary}>
        안쪽 두 숫자가 맞아야 하고, 바깥 두 숫자가 결과의 모양이다
      </text>
    </DiagramFrame>
  );
}

export function MatmulOrder() {
  // 같은 x = [1, 1]에 A, B를 다른 순서로: (AB)x = A(Bx) = [9, 4], (BA)x = B(Ax) = [3, 10].
  const P = "mor";
  const G = { left: 50, top: 18, width: 300, height: 190 };
  const sx = linear(-1, 11, G.left, G.left + G.width);
  const sy = linear(-1, 11, G.top + G.height, G.top);
  const pts = {
    x: [1, 1],
    Bx: [1, 4],
    ABx: [9, 4],
    Ax: [3, 1],
    BAx: [3, 10],
  };
  const dot = (p: number[], c: string, label: string, dx = 8, dy = -6, anchor: "start" | "middle" | "end" = "start") => (
    <g>
      <circle cx={sx(p[0])} cy={sy(p[1])} r={4.5} fill={c} />
      <text x={sx(p[0]) + dx} y={sy(p[1]) + dy} textAnchor={anchor} fontSize={10.5} fontWeight={700} fill={c} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
  return (
    <DiagramFrame
      title="순서를 바꾸면 결과가 바뀐다: AB ≠ BA"
      caption="(AB)x는 A(Bx)라서 오른쪽의 B를 먼저 적용한다. A는 '둘째 좌표의 2배를 첫째 좌표에 더하기', B는 '첫째 좌표의 3배를 둘째 좌표에 더하기'다. 같은 x = [1, 1]에서 출발해 B 먼저(파랑) 가면 [1, 4]를 거쳐 [9, 4]에, A 먼저(주황) 가면 [3, 1]을 거쳐 [3, 10]에 도착한다. 함수 합성 f(g(x))와 g(f(x))가 다르듯, 앞 변환의 출력이 뒤 변환의 입력이 되므로 순서에 따라 결과가 달라진다."
      viewBox="0 0 720 240"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 2, 4, 6, 8, 10]} />
      <Arr x1={sx(1)} y1={sy(1)} x2={sx(1)} y2={sy(4) + 6} color={colors.blue} marker={`${P}-blue`} width={2.2} />
      <Arr x1={sx(1) + 5} y1={sy(4)} x2={sx(9) - 6} y2={sy(4)} color={colors.blue} marker={`${P}-blue`} width={2.2} />
      <Arr x1={sx(1) + 5} y1={sy(1)} x2={sx(3) - 6} y2={sy(1)} color={colors.orange} marker={`${P}-orange`} width={2.2} />
      <Arr x1={sx(3)} y1={sy(1) - 5} x2={sx(3)} y2={sy(10) + 6} color={colors.orange} marker={`${P}-orange`} width={2.2} />
      {dot(pts.x, ink, "x = [1, 1]", 0, 18, "middle")}
      {dot(pts.Bx, colors.blue, "Bx = [1, 4]", 0, -10, "middle")}
      {dot(pts.ABx, colors.blue, "A(Bx) = [9, 4]", 0, -10, "middle")}
      {dot(pts.Ax, colors.orange, "Ax = [3, 1]", 9, 4)}
      {dot(pts.BAx, colors.orange, "B(Ax) = [3, 10]", 9, 4)}
      <Lines x={390} y={44} lines={["A = [[1, 2], [0, 1]]", "B = [[1, 0], [3, 1]]"]} size={11.5} anchor="start" color={ink} weight={700} gap={1.5} />
      <Lines x={390} y={100} lines={["AB = [[7, 2], [3, 1]]  (B 먼저)", "BA = [[1, 2], [3, 7]]  (A 먼저)"]} size={11} anchor="start" color={inkSecondary} gap={1.5} />
      <Lines x={390} y={156} lines={["역전파에서는 이 순서를 거꾸로,", "전치해서 되짚어 간다: (AB)ᵀ = BᵀAᵀ"]} size={10.5} anchor="start" color={colors.violet} weight={700} gap={1.5} />
    </DiagramFrame>
  );
}

export function InverseSingular() {
  // 본문 예제: A = [[1, 2], [0, 1]]은 행렬식 1, A⁻¹ = [[1, −2], [0, 1]]로 되돌린다. [[1, 2], [2, 4]]는 행렬식 0이라 평면을 직선으로 뭉갠다.
  const P = "ivs";
  const S = 24;
  const sq = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const poly = (ox: number, oy: number, M: number[][], pts: number[][]) =>
    pts
      .map(([a, b], i) => {
        const x = M[0][0] * a + M[0][1] * b;
        const y = M[1][0] * a + M[1][1] * b;
        return `${i === 0 ? "M" : "L"}${ox + x * S},${oy - y * S}`;
      })
      .join(" ") + " Z";
  const I = [
    [1, 0],
    [0, 1],
  ];
  const A = [
    [1, 2],
    [0, 1],
  ];
  const grid = (ox: number, oy: number, w: number, h: number) =>
    Array.from({ length: 9 }, (_, k) => (
      <g key={k}>
        <line x1={ox + (k - 1) * S} y1={oy - h} x2={ox + (k - 1) * S} y2={oy + 30} stroke="var(--border-hairline)" />
        <line x1={ox - 30} y1={oy - (k - 1) * S} x2={ox + w} y2={oy - (k - 1) * S} stroke="var(--border-hairline)" />
      </g>
    ));
  return (
    <DiagramFrame
      title="역행렬은 변환을 되돌리고, 행렬식이 0이면 되돌릴 수 없다"
      caption="왼쪽: A는 단위 정사각형(회색)을 오른쪽으로 민 평행사변형(파랑)으로 바꾼다. 넓이는 행렬식 1·1 − 2·0 = 1 그대로다. A⁻¹ = [[1, −2], [0, 1]]은 둘째 좌표의 2배를 다시 빼서 정확히 원래 정사각형으로 되돌린다(AA⁻¹ = I). 오른쪽: [[1, 2], [2, 4]]는 행렬식이 1·4 − 2·2 = 0이라, 정사각형 전체를 직선 y = 2x 위의 선분(빨강)으로 납작하게 만든다. 서로 다른 점이 같은 점으로 겹치므로 원래 위치를 되찾을 수 없고, 그래서 역행렬이 존재하지 않는다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {grid(70, 196, 220, 170)}
      <path d={poly(70, 196, I, sq)} fill={inkMuted} fillOpacity={0.25} stroke={inkSecondary} strokeWidth={1.4} />
      <path d={poly(70, 196, A, sq)} fill={colors.blue} fillOpacity={0.2} stroke={colors.blue} strokeWidth={2} />
      <text x={150} y={32} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.blue}>
        A: 행렬식 1 → 되돌릴 수 있다
      </text>
      <ArrPath d="M150,150 C130,120 100,130 92,160" color={colors.green} marker={`${P}-ink`} width={1.6} />
      <text x={134} y={112} fontSize={10.5} fontWeight={700} fill={colors.green}>
        A⁻¹로 원래대로
      </text>
      <text x={186} y={174} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        A × 정사각형
      </text>
      <line x1={340} y1={14} x2={340} y2={222} stroke="var(--border-hairline)" />
      {grid(420, 206, 260, 190)}
      <path d={poly(420, 206, I, sq)} fill={inkMuted} fillOpacity={0.25} stroke={inkSecondary} strokeWidth={1.4} />
      <line x1={420} y1={206} x2={420 + 3 * S} y2={206 - 6 * S} stroke={colors.red} strokeWidth={4} strokeLinecap="round" />
      <line x1={420 - 10} y1={206 + 20} x2={420 + 4.2 * S} y2={206 - 8.4 * S} stroke={colors.red} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
      <text x={560} y={32} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.red}>
        [[1, 2], [2, 4]]: 행렬식 0
      </text>
      <Lines x={520} y={100} lines={["정사각형 전체가", "선분 하나로 납작해짐", "(1, 0) → (1, 2)", "(0, 1) → (2, 4)", "(1, 1) → (3, 6)"]} size={10.5} anchor="start" color={ink} />
      <text x={520} y={196} fontSize={10.5} fontWeight={700} fill={colors.red}>
        ✗ 원래 점을 되찾을 수 없다
      </text>
    </DiagramFrame>
  );
}

export function NormalRule() {
  // 본문 예제: 키 ~ N(170, 6²). 68-95-99.7 규칙과 182cm(z = 2) → 상위 약 2.5%.
  const mu = 170;
  const sd = 6;
  const G = { left: 50, top: 22, width: 560, height: 150 };
  const sx = linear(mu - 3.6 * sd, mu + 3.6 * sd, G.left, G.left + G.width);
  const pdf = (x: number) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
  const sy = linear(0, pdf(mu), G.top + G.height, G.top + 62);
  const area = (a: number, b: number) => `${linePath([[sx(a), sy(0)], ...sample(pdf, a, b, 80).map(([x, y]) => [sx(x), sy(y)] as [number, number]), [sx(b), sy(0)]])} Z`;
  const bands = [
    { k: 3, c: colors.blue, o: 0.12, t: "99.7%" },
    { k: 2, c: colors.blue, o: 0.2, t: "95%" },
    { k: 1, c: colors.blue, o: 0.3, t: "68%" },
  ];
  return (
    <DiagramFrame
      title="정규분포의 68-95-99.7 규칙과 z-점수"
      caption="평균 170cm, 표준편차 6cm인 키의 분포다. 값의 약 68%가 평균 ± 1σ(164~176cm), 약 95%가 ± 2σ(158~182cm), 약 99.7%가 ± 3σ(152~188cm) 안에 든다. 182cm는 z = (182 − 170) / 6 = 2로 '평균에서 표준편차 2개만큼 위'다. ± 2σ 밖이 약 5%이고 정규분포는 좌우 대칭이므로, 182cm 이상(빨강)은 그 절반인 약 2.5%다. 곡선은 확률이 아니라 밀도이고, 확률은 곡선 아래 넓이다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      {bands.map((b) => (
        <path key={b.k} d={area(mu - b.k * sd, mu + b.k * sd)} fill={b.c} fillOpacity={b.o} />
      ))}
      <path d={area(182, mu + 3.6 * sd)} fill={colors.red} fillOpacity={0.55} />
      <path d={linePath(sample(pdf, mu - 3.6 * sd, mu + 3.6 * sd, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={ink} strokeWidth={2} />
      <line x1={G.left} x2={G.left + G.width} y1={sy(0)} y2={sy(0)} stroke={inkMuted} />
      {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
        <g key={z}>
          <line x1={sx(mu + z * sd)} x2={sx(mu + z * sd)} y1={sy(0)} y2={sy(0) + 5} stroke={inkMuted} />
          <text x={sx(mu + z * sd)} y={sy(0) + 18} textAnchor="middle" fontSize={10.5} fill={ink}>
            {mu + z * sd}
          </text>
          <text x={sx(mu + z * sd)} y={sy(0) + 32} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {z === 0 ? "μ" : `${z > 0 ? "+" : "−"}${Math.abs(z)}σ`}
          </text>
        </g>
      ))}
      {bands.map((b, i) => {
        const y = G.top + 12 + i * 20;
        return (
          <g key={`l${b.k}`}>
            {[-1, 1].map((sgn) => (
              <line key={sgn} x1={sx(mu + sgn * b.k * sd)} x2={sx(mu + sgn * b.k * sd)} y1={y} y2={sy(pdf(mu + b.k * sd))} stroke={colors.blue} strokeOpacity={0.45} strokeDasharray="3 3" />
            ))}
            <line x1={sx(mu - b.k * sd)} x2={sx(mu + b.k * sd)} y1={y} y2={y} stroke={colors.blue} strokeWidth={1.4} />
            <text x={sx(mu)} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {`± ${b.k}σ: ${b.t}`}
            </text>
          </g>
        );
      })}
      <Lines x={sx(182) + 5} y={sy(pdf(182)) - 22} lines={["182cm 이상", "약 2.5%"]} size={10.5} anchor="start" color={colors.red} weight={800} />
      <Lines x={622} y={70} lines={["z = (x − μ)/σ", "", "182cm:", "(182 − 170)/6", "= 2"]} size={10.5} anchor="start" color={ink} weight={700} />
    </DiagramFrame>
  );
}

export function CltSums() {
  // 균등분포 U(0, 1)을 n개 더한 값의 분포(Irwin–Hall). 점선은 같은 평균(n/2)·분산(n/12)의 정규분포.
  const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
  const choose = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
  const irwin = (n: number) => (x: number) => {
    if (x < 0 || x > n) return 0;
    let s = 0;
    for (let k = 0; k <= Math.floor(x); k++) s += (k % 2 === 0 ? 1 : -1) * choose(n, k) * (x - k) ** (n - 1);
    return s / fact(n - 1);
  };
  const ns = [1, 2, 3, 12];
  const ticks = [
    [0, 0.5, 1],
    [0, 1, 2],
    [0, 1.5, 3],
    [3, 6, 9],
  ];
  const pw = 160;
  return (
    <DiagramFrame
      title="중심극한정리: 더하는 값이 많을수록 합의 분포가 종 모양에 가까워진다"
      caption="0~1 사이 균등분포(평평한 직사각형)를 따르는 값을 1개, 2개, 3개, 12개 더한 합의 분포다(파랑). 하나일 때는 평평하고, 둘이면 삼각형, 셋이면 벌써 종에 가까워지며, 열둘이면 같은 평균·분산의 정규분포(점선)와 거의 겹친다. 원래 분포가 무엇이든, 서로 독립인 작은 요인이 많이 더해지면 그 합은 정규분포에 가까워진다. 그래서 측정 오차나 센서 잡음을 흔히 정규분포로 모델링한다."
      viewBox="0 0 720 196"
      minWidth={580}
    >
      {ns.map((n, j) => {
        const x0 = 20 + j * (pw + 16);
        const f = irwin(n);
        const mu = n / 2;
        const sd = Math.sqrt(n / 12);
        const g = (x: number) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
        const top = n === 1 ? 1.25 : g(mu) * 1.25;
        const sx = linear(n === 1 ? -0.3 : mu - 3.6 * sd, n === 1 ? 1.3 : mu + 3.6 * sd, x0, x0 + pw);
        const sy = linear(0, top, 150, 40);
        const lo = n === 1 ? -0.3 : mu - 3.6 * sd;
        const hi = n === 1 ? 1.3 : mu + 3.6 * sd;
        return (
          <g key={n}>
            <text x={x0 + pw / 2} y={24} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {n === 1 ? "균등분포 1개" : `${n}개의 합`}
            </text>
            <path d={`${linePath(sample(f, lo, hi, 200).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} L${sx(hi)},${sy(0)} L${sx(lo)},${sy(0)} Z`} fill={colors.blue} fillOpacity={0.25} stroke={colors.blue} strokeWidth={2} />
            {n > 1 && <path d={linePath(sample(g, lo, hi, 120).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={1.6} strokeDasharray="5 3" />}
            <line x1={x0} x2={x0 + pw} y1={sy(0)} y2={sy(0)} stroke={inkMuted} />
            {ticks[j].map((t) => (
              <g key={t}>
                <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(0) + 4} stroke={inkMuted} />
                <text x={sx(t)} y={168} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
                  {t}
                </text>
              </g>
            ))}
          </g>
        );
      })}
      <line x1={500} x2={520} y1={186} y2={186} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={526} y={190} fontSize={10} fill={inkSecondary}>
        같은 평균·분산의 정규분포
      </text>
    </DiagramFrame>
  );
}

export function SigmaSpread() {
  // 본문 코드: σ = 0.2와 σ = 1.5의 정규 잡음에서 |값| > 1인 비율. 0.2는 5σ 밖(사실상 0), 1.5는 약 50.5%.
  const G = { left: 50, top: 18, width: 420, height: 150 };
  const sx = linear(-4, 4, G.left, G.left + G.width);
  const sy = linear(0, 2.15, G.top + G.height, G.top);
  const pdf = (sd: number) => (x: number) => Math.exp(-(x * x) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
  const tail = (sd: number) => 2 * (1 - normCdf(1 / sd));
  const area = (f: (x: number) => number, a: number, b: number) => `${linePath([[sx(a), sy(0)], ...sample(f, a, b, 60).map(([x, y]) => [sx(x), sy(y)] as [number, number]), [sx(b), sy(0)]])} Z`;
  const curves = [
    { sd: 0.2, c: colors.violet },
    { sd: 1.5, c: colors.orange },
  ];
  return (
    <DiagramFrame
      title="σ가 클수록 넓게 퍼진다: |값| > 1인 비율"
      caption={`본문 코드의 두 잡음이다. σ = 0.2(보라)는 평균 근처에 촘촘히 몰려 있어, 1 이상 벗어나려면 5σ 밖으로 나가야 하므로 그런 값은 사실상 없다(5000개 중 0개 수준). σ = 1.5(주황)는 넓게 퍼져서 0.67σ만 벗어나도 |값| > 1이 되므로 약 ${(tail(1.5) * 100).toFixed(1)}%, 5000개 중 2,500개 안팎이 해당한다(칠한 부분). σ = 0.2 곡선의 꼭대기는 약 2.0으로 1보다 크다. 곡선은 확률이 아니라 밀도이므로 전체 넓이만 1이면 높이는 1을 넘을 수 있다.`}
      viewBox="0 0 720 216"
      minWidth={560}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[-4, -2, -1, 0, 1, 2, 4]} yTicks={[0, 1, 2]} fmtX={(v) => String(v).replace("-", "−")} xLabel="잡음 값" yLabel="밀도" />
      {curves.map((c) => (
        <g key={c.sd}>
          <path d={area(pdf(c.sd), -4, -1)} fill={c.c} fillOpacity={0.3} />
          <path d={area(pdf(c.sd), 1, 4)} fill={c.c} fillOpacity={0.3} />
          <path d={linePath(sample(pdf(c.sd), -4, 4, 400).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={c.c} strokeWidth={2.2} />
        </g>
      ))}
      <line x1={sx(-1)} x2={sx(-1)} y1={G.top} y2={sy(0)} stroke={inkSecondary} strokeDasharray="4 3" />
      <line x1={sx(1)} x2={sx(1)} y1={G.top} y2={sy(0)} stroke={inkSecondary} strokeDasharray="4 3" />
      <Lines x={sx(1) + 8} y={sy(1.99) + 4} lines={["← 꼭대기 ≈ 2.0", "(밀도는 1보다 클 수 있다)"]} size={10.5} anchor="start" color={colors.violet} weight={700} gap={1.4} />
      <Lines x={496} y={60} lines={["σ = 0.2", `|값| > 1: ${(tail(0.2) * 100).toFixed(5)}%`, "→ 5000개 중 거의 0개"]} size={11} anchor="start" color={colors.violet} weight={700} />
      <Lines x={496} y={130} lines={["σ = 1.5", `|값| > 1: ${(tail(1.5) * 100).toFixed(1)}%`, "→ 5000개 중 약 2,500개"]} size={11} anchor="start" color={colors.orange} weight={700} />
    </DiagramFrame>
  );
}
/** 본문 SVD 코드의 X(앞 두 열)와 rank-1 근사 X1(앞 두 열): "x,y,x1,y1" 50개 */
const LOWRANK_PTS =
  "0.38,-0.04,0.35,0.01 1.92,0.03,1.91,0.05 -1.61,0.11,-1.53,-0.04 3.91,0.28,4.01,0.1 -2.11,-0.38,-2.28,-0.05 " +
  "-1.87,0.01,-1.84,-0.04 -6.98,-0.07,-6.92,-0.17 -3.74,-0.22,-3.8,-0.09 -1.63,-0.09,-1.66,-0.04 " +
  "1.23,0.31,1.38,0.03 -0.39,0.41,-0.17,-0.0 -2.0,0.11,-1.92,-0.05 2.71,0.03,2.69,0.06 -2.23,-0.28,-2.34,-0.06 " +
  "-1.37,0.07,-1.32,-0.03 -3.03,-0.06,-3.02,-0.07 -0.48,0.16,-0.39,-0.01 0.64,0.11,0.69,0.02 " +
  "-1.96,-0.04,-1.96,-0.05 2.35,0.45,2.55,0.06 -3.78,0.45,-3.5,-0.08 4.04,0.23,4.11,0.1 0.79,-0.09,0.74,0.02 " +
  "4.37,0.59,4.62,0.11 5.4,0.39,5.54,0.13 1.07,-0.36,0.87,0.02 -0.01,0.2,0.09,0.0 -3.87,0.12,-3.76,-0.09 " +
  "1.29,0.21,1.38,0.03 -3.55,-0.2,-3.61,-0.09 -1.31,-0.35,-1.47,-0.04 5.22,-0.15,5.08,0.12 0.99,-0.08,0.94,0.02 " +
  "4.75,0.4,4.9,0.12 1.9,-0.66,1.54,0.04 0.16,0.21,0.26,0.01 3.01,-0.19,2.88,0.07 5.47,-0.4,5.2,0.12 " +
  "-1.98,0.28,-1.82,-0.04 0.15,0.6,0.45,0.01 0.57,-0.19,0.46,0.01 -1.13,-0.33,-1.29,-0.03 -3.83,0.19,-3.69,-0.09 " +
  "1.74,0.39,1.92,0.05 -2.26,0.51,-1.98,-0.05 -0.86,0.47,-0.61,-0.01 -1.3,-0.22,-1.4,-0.03 0.75,0.31,0.9,0.02 " +
  "0.48,-0.18,0.39,0.01 -4.02,-0.42,-4.19,-0.1";

export function NormBalls() {
  // 본문 예제: a = [3, 4]의 L2 노름 5(직선), L1 노름 7(축을 따라 3 + 4). 오른쪽은 노름이 1인 점들의 모양.
  const P = "nbl";
  const S = 34;
  const ox = 60;
  const oy = 190;
  const px = (x: number) => ox + x * S;
  const py = (y: number) => oy - y * S;
  const R = 62;
  const cx = 560;
  const cy = 112;
  return (
    <DiagramFrame
      title="노름: L2는 직선 거리, L1은 축을 따라 간 거리"
      caption="왼쪽: 본문 예제 a = [3, 4]다. L2 노름은 원점에서 끝점까지의 직선 거리 √(3² + 4²) = 5이고, L1 노름은 좌표축을 따라서만 움직인 거리 |3| + |4| = 7(맨해튼 거리)이다. 오른쪽: 노름이 정확히 1인 점들을 모으면 L2는 원, L1은 꼭짓점이 축 위에 있는 마름모가 된다. 2주차의 L2·L1 정규화가 파라미터를 이 모양 안쪽으로 끌어당기며, 마름모의 뾰족한 꼭짓점 때문에 L1은 일부 파라미터를 정확히 0으로 만들기 쉽다."
      viewBox="0 0 720 232"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ blue: colors.blue }} />
      {Array.from({ length: 6 }, (_, k) => (
        <g key={k}>
          <line x1={px(k)} x2={px(k)} y1={py(0)} y2={py(5)} stroke="var(--border-hairline)" />
          <line x1={px(0)} x2={px(5)} y1={py(k)} y2={py(k)} stroke="var(--border-hairline)" />
          <text x={px(k)} y={py(0) + 14} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {k}
          </text>
          <text x={px(0) - 6} y={py(k) + 3} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
            {k}
          </text>
        </g>
      ))}
      <path d={`M${px(0)},${py(0)} L${px(3)},${py(0)} L${px(3)},${py(4)}`} fill="none" stroke={colors.orange} strokeWidth={3} strokeDasharray="7 4" />
      <Arr x1={px(0)} y1={py(0)} x2={px(3)} y2={py(4)} color={colors.blue} marker={`${P}-blue`} width={3} />
      <circle cx={px(3)} cy={py(4)} r={4} fill={ink} />
      <text x={px(3) + 8} y={py(4) - 4} fontSize={11} fontWeight={800} fill={ink}>
        a = [3, 4]
      </text>
      <text x={px(1.1)} y={py(2.4)} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        L2 = 5
      </text>
      <text x={px(1.5)} y={py(0) - 8} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        3
      </text>
      <text x={px(3) + 8} y={py(2)} fontSize={10.5} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        4
      </text>
      <Lines x={300} y={70} lines={["L2 = √(3² + 4²) = 5", "L1 = |3| + |4| = 7"]} size={12} anchor="start" color={ink} weight={800} gap={1.7} />
      <text x={300} y={130} fontSize={10.5} fill={colors.blue} fontWeight={700}>
        ─ 파랑: 대각선으로 곧장 (L2)
      </text>
      <text x={300} y={150} fontSize={10.5} fill={colors.orange} fontWeight={700}>
        ┄ 주황: 축을 따라서만 (L1)
      </text>
      <line x1={cx - R - 20} x2={cx + R + 20} y1={cy} y2={cy} stroke={inkMuted} />
      <line x1={cx} x2={cx} y1={cy - R - 20} y2={cy + R + 20} stroke={inkMuted} />
      <circle cx={cx} cy={cy} r={R} fill={colors.blue} fillOpacity={0.08} stroke={colors.blue} strokeWidth={2} />
      <path d={`M${cx + R},${cy} L${cx},${cy - R} L${cx - R},${cy} L${cx},${cy + R} Z`} fill={colors.orange} fillOpacity={0.12} stroke={colors.orange} strokeWidth={2} />
      <text x={cx + R + 4} y={cy - 6} fontSize={9.5} fill={inkSecondary}>
        1
      </text>
      <text x={cx + 6} y={cy - R - 6} fontSize={9.5} fill={inkSecondary}>
        1
      </text>
      <text x={cx + R * 0.72} y={cy - R * 0.72 - 6} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        ‖x‖₂ = 1
      </text>
      <line x1={cx - R * 0.5 - 2} y1={cy + R * 0.5 + 2} x2={cx - R - 2} y2={cy + R * 0.82} stroke={colors.orange} strokeWidth={1} />
      <text x={cx - R - 5} y={cy + R * 0.82 + 4} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.orange}>
        ‖x‖₁ = 1
      </text>
      <text x={cx} y={cy + R + 36} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={ink}>
        노름이 1인 점들의 모양
      </text>
    </DiagramFrame>
  );
}

export function EigenDirections() {
  // 본문 예제 A = [[2, 1], [1, 2]]: 고유벡터 [1, 1](λ = 3), [1, −1](λ = 1). 단위원 위의 벡터들을 A로 보낸다.
  const P = "egd";
  const S = 34;
  const cx = 180;
  const cy = 116;
  const A = [
    [2, 1],
    [1, 2],
  ];
  const n = 16;
  const vecs = Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const v = [Math.cos(t), Math.sin(t)];
    const w = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
    const eig = Math.abs(Math.abs(v[0]) - Math.abs(v[1])) < 1e-9;
    return { v, w, eig, t };
  });
  return (
    <DiagramFrame
      title="고유벡터: 변환해도 방향이 그대로인 벡터"
      caption="본문 예제 A = [[2, 1], [1, 2]]다. 단위원 위의 벡터(회색 점)를 A로 보내면(화살표 끝) 대부분 방향이 틀어지며 타원 위로 옮겨 간다. 그런데 [1, 1] 방향(파랑)은 방향이 그대로인 채 길이만 3배가 되고(고유값 3), [1, −1] 방향(주황)은 방향도 길이도 그대로다(고유값 1). 이 두 방향이 A의 고유벡터이고, 이 두 방향을 축으로 삼으면 A가 하는 일은 '한 축은 3배, 다른 축은 1배'로 단순해진다. 타원의 장축과 단축 방향이 곧 고유벡터 방향이다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkMuted, blue: colors.blue, orange: colors.orange }} />
      <line x1={cx - 120} x2={cx + 120} y1={cy} y2={cy} stroke="var(--border-hairline)" />
      <line x1={cx} x2={cx} y1={cy - 112} y2={cy + 112} stroke="var(--border-hairline)" />
      <circle cx={cx} cy={cy} r={S} fill="none" stroke={inkMuted} strokeDasharray="3 3" />
      <ellipse cx={cx} cy={cy} rx={3 * S} ry={S} transform={`rotate(-45 ${cx} ${cy})`} fill={colors.violet} fillOpacity={0.05} stroke={colors.violet} strokeOpacity={0.5} strokeDasharray="4 3" />
      {vecs.map((e, i) =>
        e.eig ? null : (
          <g key={i}>
            <line x1={cx + e.v[0] * S} y1={cy - e.v[1] * S} x2={cx + e.w[0] * S} y2={cy - e.w[1] * S} stroke={inkMuted} strokeWidth={1} opacity={0.7} markerEnd={`url(#${P}-ink)`} />
            <circle cx={cx + e.v[0] * S} cy={cy - e.v[1] * S} r={2.4} fill={inkMuted} />
          </g>
        ),
      )}
      {[
        { v: [1, 1], lam: 3, c: colors.blue, m: "blue" },
        { v: [-1, -1], lam: 3, c: colors.blue, m: "blue" },
        { v: [1, -1], lam: 1, c: colors.orange, m: "orange" },
        { v: [-1, 1], lam: 1, c: colors.orange, m: "orange" },
      ].map((e, i) => {
        const u = [e.v[0] / Math.SQRT2, e.v[1] / Math.SQRT2];
        return (
          <g key={i}>
            <line x1={cx - u[0] * 110} y1={cy + u[1] * 110} x2={cx + u[0] * 110} y2={cy - u[1] * 110} stroke={e.c} strokeOpacity={0.25} />
            <Arr x1={cx} y1={cy} x2={cx + u[0] * S * e.lam} y2={cy - u[1] * S * e.lam} color={e.c} marker={`${P}-${e.m}`} width={2.6} />
            <circle cx={cx + u[0] * S} cy={cy - u[1] * S} r={3.2} fill={e.c} />
          </g>
        );
      })}
      <text x={cx + 3 * S * 0.707 + 8} y={cy - 3 * S * 0.707} fontSize={11} fontWeight={800} fill={colors.blue}>
        [1, 1] → 3배
      </text>
      <text x={cx + S * 0.707 + 10} y={cy + S * 0.707 + 14} fontSize={11} fontWeight={800} fill={colors.orange}>
        [1, −1] → 1배
      </text>
      <Lines x={380} y={44} lines={["A = [[2, 1], [1, 2]]", "", "A[1, 1] = [3, 3] = 3·[1, 1]", "A[1, −1] = [1, −1] = 1·[1, −1]", "", "특성방정식 (2 − λ)² − 1 = 0", "→ λ = 3, λ = 1"]} size={11.5} anchor="start" color={ink} weight={600} gap={1.45} />
      <text x={380} y={210} fontSize={10} fill={inkSecondary}>
        회색: 단위원 위의 벡터 v → 화살표 끝 Av (방향이 틀어진다)
      </text>
    </DiagramFrame>
  );
}

export function SvdSteps() {
  // 전단 행렬 M = [[1, 1], [0, 1]]의 SVD: M = U Σ Vᵀ, 특이값 1.618과 0.618. 단위원과 두 기준 벡터가 단계마다 어떻게 바뀌는지.
  const M = [
    [1, 1],
    [0, 1],
  ];
  const ata = [
    [M[0][0] * M[0][0] + M[1][0] * M[1][0], M[0][0] * M[0][1] + M[1][0] * M[1][1]],
    [M[0][1] * M[0][0] + M[1][1] * M[1][0], M[0][1] * M[0][1] + M[1][1] * M[1][1]],
  ];
  const tr = ata[0][0] + ata[1][1];
  const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0];
  const l1 = tr / 2 + Math.sqrt((tr * tr) / 4 - det);
  const l2 = tr / 2 - Math.sqrt((tr * tr) / 4 - det);
  const s1 = Math.sqrt(l1);
  const s2 = Math.sqrt(l2);
  const v1 = (() => {
    const x = [ata[0][1], l1 - ata[0][0]];
    const n = Math.hypot(x[0], x[1]);
    return [x[0] / n, x[1] / n];
  })();
  const v2 = [-v1[1], v1[0]];
  const mul = (A: number[][], x: number[]) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
  const Vt = [v1, v2];
  const u1 = mul(M, v1).map((t) => t / s1);
  const u2 = mul(M, v2).map((t) => t / s2);
  const U = [
    [u1[0], u2[0]],
    [u1[1], u2[1]],
  ];
  const stages = [
    { t: "단위원", f: (x: number[]) => x },
    { t: "① Vᵀ: 회전", f: (x: number[]) => mul(Vt, x) },
    { t: "② Σ: 축 방향으로 늘이기", f: (x: number[]) => { const y = mul(Vt, x); return [s1 * y[0], s2 * y[1]]; } },
    { t: "③ U: 다시 회전 = M", f: (x: number[]) => { const y = mul(Vt, x); return mul(U, [s1 * y[0], s2 * y[1]]); } },
  ];
  const S = 46;
  const P = "svd";
  return (
    <DiagramFrame
      title="SVD: 어떤 행렬이든 회전 → 늘이기 → 회전"
      caption={`전단 행렬 M = [[1, 1], [0, 1]](본문 모나리자 그림의 변환과 같은 종류)을 M = UΣVᵀ로 분해한 것이다. 단위원과 두 표준기저 벡터 e₁(파랑), e₂(주황)가 단계마다 어떻게 바뀌는지 따라가 보자. ① Vᵀ는 원을 돌리기만 하고, ② Σ는 가로·세로 축 방향으로 특이값 ${s1.toFixed(3)}배와 ${s2.toFixed(3)}배로 늘이고 줄여 타원을 만들며, ③ U가 그 타원을 다시 돌린다. 마지막 결과는 M을 한 번에 곱한 것과 같다(e₁ → [1, 0], e₂ → [1, 1]). 특이값은 이 타원의 반축 길이이고, 큰 특이값의 방향에 데이터의 주요 구조가 담긴다.`}
      viewBox="0 0 720 210"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ blue: colors.blue, orange: colors.orange, ink: inkSecondary }} />
      {stages.map((st, j) => {
        const cx = 90 + j * 180;
        const cy = 104;
        const circle = Array.from({ length: 73 }, (_, i) => {
          const t = (i / 72) * Math.PI * 2;
          const p = st.f([Math.cos(t), Math.sin(t)]);
          return [cx + p[0] * S, cy - p[1] * S] as [number, number];
        });
        const e1 = st.f([1, 0]);
        const e2 = st.f([0, 1]);
        return (
          <g key={j}>
            <text x={cx} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
              {st.t}
            </text>
            <line x1={cx - 78} x2={cx + 78} y1={cy} y2={cy} stroke="var(--border-hairline)" />
            <line x1={cx} x2={cx} y1={cy - 78} y2={cy + 78} stroke="var(--border-hairline)" />
            <path d={`${linePath(circle)} Z`} fill={colors.violet} fillOpacity={0.08} stroke={colors.violet} strokeWidth={1.8} />
            <Arr x1={cx} y1={cy} x2={cx + e1[0] * S} y2={cy - e1[1] * S} color={colors.blue} marker={`${P}-blue`} width={2.4} />
            <Arr x1={cx} y1={cy} x2={cx + e2[0] * S} y2={cy - e2[1] * S} color={colors.orange} marker={`${P}-orange`} width={2.4} />
            {j < 3 && <Arr x1={cx + 80} y1={cy} x2={cx + 100} y2={cy} color={inkSecondary} marker={`${P}-ink`} width={1.4} />}
          </g>
        );
      })}
      <text x={360} y={200} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        {`M = U Σ Vᵀ, 특이값 σ₁ = ${s1.toFixed(3)}, σ₂ = ${s2.toFixed(3)} (σ₁·σ₂ = |det M| = 1)`}
      </text>
    </DiagramFrame>
  );
}

export function LowRankApprox() {
  // 본문 코드: X(50 × 3, 셋째 열 = 앞 두 열의 합) 특이값 [28.11, 2.54, 0], rank-1 근사의 상대 오차 0.09.
  const pts = LOWRANK_PTS.split(" ").map((t) => t.split(",").map(Number));
  const G = { left: 50, top: 22, width: 330, height: 150 };
  const sx = linear(-7.5, 6, G.left, G.left + G.width);
  const sy = linear(-0.8, 0.8, G.top + G.height, G.top);
  const S = [28.11, 2.54, 0];
  const tot = S.reduce((a, s) => a + s * s, 0);
  const by = linear(0, 30, 172, 40);
  return (
    <DiagramFrame
      title="저랭크 근사: 큰 특이값 몇 개만 남긴다"
      caption="본문 코드의 데이터(50 × 3, 셋째 열 = 앞 두 열의 합)다. 왼쪽은 앞 두 열을 점으로 찍은 것이고(세로를 크게 확대했다), 주황 점은 가장 큰 특이값 하나만 남긴 rank-1 근사다. rank-1 근사 점들은 한 직선 위에 놓이는데, 데이터가 한 방향으로 길쭉하므로 원래 점과의 차이(회색 선)는 작다. 오른쪽: 특이값은 [28.11, 2.54, 0]이다. 셋째 값이 0이라 셋째 방향에는 정보가 없고(rank 2), 첫째 특이값이 '에너지'(특이값 제곱)의 99.2%를 담아 rank-1 근사의 상대 오차는 약 9%에 그친다. 이미지 압축, PCA, LoRA 모두 이 저랭크 근사를 바탕으로 한다."
      viewBox="0 0 720 222"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[-6, -3, 0, 3, 6]} yTicks={[-0.5, 0, 0.5]} fmtX={(v) => String(v).replace("-", "−")} fmtY={(v) => String(v).replace("-", "−")} xLabel="첫째 열" yLabel="둘째 열" />
      {pts.map((p, i) => (
        <line key={`l${i}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[2])} y2={sy(p[3])} stroke={inkMuted} strokeWidth={0.9} />
      ))}
      {pts.map((p, i) => (
        <circle key={`o${i}`} cx={sx(p[0])} cy={sy(p[1])} r={3} fill={colors.blue} fillOpacity={0.75} />
      ))}
      {pts.map((p, i) => (
        <circle key={`r${i}`} cx={sx(p[2])} cy={sy(p[3])} r={2.4} fill={colors.orange} />
      ))}
      <text x={G.left + 8} y={G.top + 12} fontSize={9.5} fontWeight={700} fill={colors.blue}>
        ● 원래 데이터
      </text>
      <text x={G.left + 100} y={G.top + 12} fontSize={9.5} fontWeight={700} fill={colors.orange}>
        ● rank-1 근사
      </text>
      <line x1={420} y1={14} x2={420} y2={210} stroke="var(--border-hairline)" />
      <text x={566} y={22} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        특이값과 에너지 비율
      </text>
      <line x1={450} x2={690} y1={by(0)} y2={by(0)} stroke={inkMuted} />
      {S.map((s, i) => (
        <g key={i}>
          <rect x={470 + i * 74} y={by(s)} width={46} height={Math.max(1, by(0) - by(s))} rx={3} fill={i === 0 ? colors.violet : colors.blue} fillOpacity={i === 0 ? 0.7 : 0.45} />
          <text x={493 + i * 74} y={by(s) - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
            {s}
          </text>
          <text x={493 + i * 74} y={by(0) + 14} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {`σ${"₁₂₃"[i]}`}
          </text>
          <text x={493 + i * 74} y={by(0) + 28} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={i === 0 ? colors.violet : inkSecondary}>
            {`${((s * s * 100) / tot).toFixed(1)}%`}
          </text>
        </g>
      ))}
      <text x={566} y={216} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.violet}>
        σ₁만 남기면 상대 오차 ≈ 0.09
      </text>
    </DiagramFrame>
  );
}

export function ProbVsLikelihood() {
  // 같은 이항식 C(10, k)·p^k·(1 − p)^(10 − k)을 p = 0.5로 고정하고 k를 바꾸면 확률, k = 7로 고정하고 p를 바꾸면 가능도.
  const choose = (n: number, k: number) => {
    let c = 1;
    for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
    return c;
  };
  const pmf = Array.from({ length: 11 }, (_, k) => choose(10, k) * 0.5 ** 10);
  const L = (p: number) => choose(10, 7) * p ** 7 * (1 - p) ** 3;
  const G1 = { left: 50, top: 24, width: 270, height: 150 };
  const bx = linear(-0.6, 10.6, G1.left, G1.left + G1.width);
  const by = linear(0, 0.3, G1.top + G1.height, G1.top);
  const G2 = { left: 420, top: 24, width: 270, height: 150 };
  const lx = linear(0, 1, G2.left, G2.left + G2.width);
  const ly = linear(0, 0.3, G2.top + G2.height, G2.top);
  return (
    <DiagramFrame
      title="확률과 가능도: 같은 식에서 무엇을 고정하는가"
      caption="두 그림 모두 같은 식 C(10, k)·pᵏ(1 − p)¹⁰⁻ᵏ에서 나온다. 왼쪽은 동전이 공정하다고(p = 0.5) 고정하고 앞면 횟수 k를 바꿔 가며 구한 확률이다. 막대를 모두 더하면 1이고, 정확히 7번이 나올 확률은 약 11.7%다. 오른쪽은 '10번 중 7번'이라는 데이터를 고정하고 p를 바꿔 가며 구한 가능도다. 이 곡선은 넓이가 1일 필요가 없는 p의 함수이고, 가장 높은 점인 p = 0.7이 최대가능도추정값이다. 두 그림의 주황 점(k = 7, p = 0.5)은 같은 값 0.117이다."
      viewBox="0 0 720 226"
      minWidth={600}
    >
      <text x={G1.left + G1.width / 2} y={14} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.blue}>
        확률: p = 0.5 고정, k가 변수
      </text>
      <Axes {...G1} sx={bx} sy={by} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 0.1, 0.2, 0.3]} xLabel="앞면 횟수 k" />
      {pmf.map((v, k) => (
        <rect key={k} x={bx(k) - 9} y={by(v)} width={18} height={by(0) - by(v)} rx={2} fill={k === 7 ? colors.orange : colors.blue} fillOpacity={k === 7 ? 0.8 : 0.45} />
      ))}
      <text x={bx(7)} y={by(pmf[7]) - 6} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={colors.orange}>
        0.117
      </text>
      <text x={G1.left + G1.width - 4} y={G1.top + 12} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
        막대의 합 = 1
      </text>
      <line x1={370} y1={14} x2={370} y2={214} stroke="var(--border-hairline)" />
      <text x={G2.left + G2.width / 2} y={14} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.violet}>
        가능도: k = 7 고정, p가 변수
      </text>
      <Axes {...G2} sx={lx} sy={ly} xTicks={[0, 0.25, 0.5, 0.7, 1]} yTicks={[0, 0.1, 0.2, 0.3]} xLabel="앞면 확률 p" />
      <path d={linePath(sample(L, 0, 1, 160).map(([x, y]) => [lx(x), ly(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <line x1={lx(0.7)} x2={lx(0.7)} y1={ly(L(0.7))} y2={ly(0)} stroke={colors.violet} strokeDasharray="4 3" />
      <circle cx={lx(0.7)} cy={ly(L(0.7))} r={4.5} fill={colors.violet} />
      <text x={lx(0.7) - 9} y={ly(L(0.7)) - 3} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`최대: p̂ = 0.7 (L = ${L(0.7).toFixed(3)})`}
      </text>
      <circle cx={lx(0.5)} cy={ly(L(0.5))} r={4.5} fill={colors.orange} />
      <text x={lx(0.5) - 8} y={ly(L(0.5)) - 6} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.orange}>
        0.117
      </text>
    </DiagramFrame>
  );
}

export function MleVsMap() {
  // 본문 예제: 10번 중 7번 앞면. 가능도 p⁷(1 − p)³의 최대는 0.7, 사전분포 Beta(2, 2)를 곱한 사후 p⁸(1 − p)⁴의 최대는 8/12 ≈ 0.667.
  const norm = (f: (p: number) => number) => {
    const xs = sample(f, 0, 1, 400);
    const m = Math.max(...xs.map(([, y]) => y));
    return (p: number) => f(p) / m;
  };
  const prior = norm((p) => p * (1 - p));
  const lik = norm((p) => p ** 7 * (1 - p) ** 3);
  const post = norm((p) => p ** 8 * (1 - p) ** 4);
  const G = { left: 50, top: 22, width: 420, height: 160 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1.12, G.top + G.height, G.top);
  const curves = [
    { f: prior, c: inkMuted, t: "사전분포 Beta(2, 2)", dash: "5 4", peak: 0.5 },
    { f: lik, c: colors.blue, t: "가능도 p⁷(1 − p)³", dash: undefined, peak: 0.7 },
    { f: post, c: colors.violet, t: "사후 ∝ 가능도 × 사전", dash: undefined, peak: 8 / 12 },
  ];
  return (
    <DiagramFrame
      title="MLE와 MAP: 사전분포가 추정값을 끌어당긴다"
      caption="본문 예제(10번 중 7번 앞면)다. 세 곡선은 모양을 비교하기 쉽도록 각각 최댓값이 1이 되게 맞췄다. 가능도(파랑)는 p = 0.7에서 가장 높아 MLE는 0.7이다. '동전은 대체로 공정하다'는 사전분포 Beta(2, 2)(회색 점선, 0.5 근처를 선호)를 곱한 사후분포(보라)는 p⁸(1 − p)⁴에 비례하고, 사후분포가 최대인 MAP는 8/12 ≈ 0.667로 0.5 쪽으로 조금 당겨진다. 데이터가 많아질수록 가능도가 뾰족해져 사전분포의 영향은 줄고, MAP는 MLE에 가까워진다."
      viewBox="0 0 720 226"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[]} xLabel="앞면 확률 p" grid={false} />
      {curves.map((c) => (
        <g key={c.t}>
          <path d={linePath(sample(c.f, 0, 1, 200).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={c.c} strokeWidth={2.4} strokeDasharray={c.dash} />
          <line x1={sx(c.peak)} x2={sx(c.peak)} y1={sy(1)} y2={sy(0)} stroke={c.c} strokeDasharray="2 3" opacity={0.7} />
        </g>
      ))}
      <text x={sx(0.7) + 4} y={sy(0) - 6} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        MLE 0.7
      </text>
      <text x={sx(8 / 12) - 4} y={sy(0) - 6} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.violet}>
        MAP 0.667
      </text>
      <text x={sx(0.5) - 4} y={sy(1) - 6} textAnchor="end" fontSize={10} fontWeight={700} fill={inkSecondary}>
        사전분포의 중심 0.5
      </text>
      {curves.map((c, i) => (
        <g key={`l${c.t}`}>
          <line x1={496} x2={522} y1={56 + i * 30} y2={56 + i * 30} stroke={c.c} strokeWidth={2.4} strokeDasharray={c.dash} />
          <text x={528} y={60 + i * 30} fontSize={10.5} fontWeight={700} fill={c.c}>
            {c.t}
          </text>
        </g>
      ))}
      <Lines x={496} y={160} lines={["로그를 취해 미분:", "8/p = 4/(1 − p) → p = 8/12"]} size={10.5} anchor="start" color={ink} weight={600} />
    </DiagramFrame>
  );
}

export function LogUnderflow() {
  // 본문 코드: 0.5¹⁰⁰⁰ ≈ 9.3×10⁻³⁰², 0.5¹¹⁰⁰ = 0.0(언더플로). float64의 가장 작은 정규수 약 2.2×10⁻³⁰⁸, 가장 작은 비정규수 약 4.9×10⁻³²⁴(= 0.5¹⁰⁷⁴).
  const G = { left: 64, top: 20, width: 400, height: 170 };
  const sx = linear(0, 1200, G.left, G.left + G.width);
  const sy = linear(-360, 0, G.top + G.height, G.top);
  const lg = (n: number) => n * Math.log10(0.5);
  return (
    <DiagramFrame
      title="확률을 계속 곱하면 0이 된다: 로그를 더해 계산하는 이유"
      caption="확률 0.5를 n번 곱한 값의 크기(10의 몇 제곱인지)다. 곱은 n이 커질수록 지수적으로 작아져 n = 1000이면 9.3 × 10⁻³⁰²로 아직 표현되지만, float64의 가장 작은 정규수(약 2.2 × 10⁻³⁰⁸)를 지나 가장 작은 비정규수(약 4.9 × 10⁻³²⁴ = 0.5¹⁰⁷⁴)보다 작아지면 0이 되어 버린다(본문 코드의 0.5¹¹⁰⁰ = 0.0). 로그를 취하면 곱이 합 n·log 0.5가 되어 n = 1100에서도 −762.46으로 아무 문제 없이 계산된다. 그래서 실제 구현에서는 늘 로그가능도(또는 음의 로그가능도)를 쓴다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 300, 600, 900, 1200]} yTicks={[0, -100, -200, -300]} fmtY={(v) => (v === 0 ? "1" : `10${String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])}`)} xLabel="곱한 횟수 n" />
      <rect x={G.left} y={sy(-323.3)} width={G.width} height={sy(-360) - sy(-323.3)} fill={colors.red} fillOpacity={0.1} />
      <text x={G.left + 6} y={sy(-345)} fontSize={10} fontWeight={700} fill={colors.red}>
        이 아래는 표현 불가 → 0.0
      </text>
      <line x1={G.left} x2={G.left + G.width} y1={sy(-307.65)} y2={sy(-307.65)} stroke={colors.orange} strokeDasharray="4 3" />
      <text x={G.left + 6} y={sy(-307.65) - 5} fontSize={9.5} fill={colors.orange} fontWeight={700}>
        가장 작은 정규수 ≈ 2.2×10⁻³⁰⁸
      </text>
      <path d={linePath(sample(lg, 0, 1074, 100).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <line x1={sx(1074)} x2={sx(1200)} y1={sy(-360)} y2={sy(-360)} stroke={colors.red} strokeWidth={3} />
      <circle cx={sx(1000)} cy={sy(lg(1000))} r={4.5} fill={colors.blue} />
      <line x1={sx(1000) - 64} y1={sy(lg(1000)) - 17} x2={sx(1000) - 5} y2={sy(lg(1000)) - 2} stroke={colors.blue} strokeWidth={1} />
      <text x={sx(1000) - 67} y={sy(lg(1000)) - 14} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.blue}>
        n = 1000: 9.3×10⁻³⁰²
      </text>
      <circle cx={sx(1100)} cy={sy(-360)} r={4.5} fill={colors.red} />
      <text x={sx(1100)} y={sy(-360) - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        n = 1100: 0.0
      </text>
      <line x1={490} y1={14} x2={490} y2={224} stroke="var(--border-hairline)" />
      <text x={600} y={34} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        로그로 더하면
      </text>
      <Lines x={506} y={64} lines={["곱: 0.5 × 0.5 × … (1100번)", "= 0.0 (언더플로)", "", "로그의 합: 1100 × ln 0.5", "= −762.46 ✓"]} size={11} anchor="start" color={ink} weight={600} gap={1.5} />
      <Lines x={600} y={178} lines={["그래서 학습은 가능도 최대화 대신", "−log 가능도 최소화로 푼다"]} size={10} anchor="middle" color={inkSecondary} gap={1.45} />
    </DiagramFrame>
  );
}

export function CrossEntropyDecomp() {
  // 본문 숫자: H(fair) = 1, H(fair, biased) = 1.737 → KL(fair‖biased) = 0.737. H(biased) = 0.469, H(biased, fair) = 1 → KL(biased‖fair) = 0.531.
  const lg = (x: number) => Math.log2(x);
  const fair = [0.5, 0.5];
  const biased = [0.9, 0.1];
  const H = (p: number[]) => -p.reduce((s, v) => s + (v > 0 ? v * lg(v) : 0), 0);
  const CE = (p: number[], q: number[]) => -p.reduce((s, v, i) => s + v * lg(q[i]), 0);
  const rows = [
    { t: "기준 p = 공정한 동전 (0.5, 0.5)", sub: "모델 q = (0.9, 0.1)", h: H(fair), ce: CE(fair, biased) },
    { t: "기준 p = 치우친 동전 (0.9, 0.1)", sub: "모델 q = (0.5, 0.5)", h: H(biased), ce: CE(biased, fair) },
  ];
  const bx = linear(0, 2, 0, 380);
  return (
    <DiagramFrame
      title="교차 엔트로피 = 엔트로피 + KL 발산, 그리고 KL은 비대칭이다"
      caption="본문 예제의 숫자다(단위: 비트). 위: 실제 분포가 공정한 동전인데 모델이 (0.9, 0.1)이라고 예측하면 교차 엔트로피는 1.737비트로, 실제 분포의 엔트로피 1비트보다 0.737비트 크다. 이 차이가 '잘못된 분포를 써서 낭비한 비트', 즉 KL(p‖q)다. 아래: 기준과 모델을 바꾸면 엔트로피는 0.469, 교차 엔트로피는 1이라 KL은 0.531로 달라진다. KL은 거리처럼 보이지만 대칭이 아니다. 앞쪽 분포에서 자주 일어나는 사건에 뒤쪽 분포가 낮은 확률을 줄수록 값이 커지기 때문이다."
      viewBox="0 0 720 200"
      minWidth={580}
    >
      {rows.map((r, i) => {
        const y = 30 + i * 74;
        const kl = r.ce - r.h;
        return (
          <g key={r.t}>
            <text x={14} y={y + 12} fontSize={11} fontWeight={800} fill={ink}>
              {r.t}
            </text>
            <text x={14} y={y + 28} fontSize={10} fill={inkSecondary}>
              {r.sub}
            </text>
            <rect x={250} y={y} width={bx(r.h)} height={30} fill={colors.blue} fillOpacity={0.55} />
            <rect x={250 + bx(r.h)} y={y} width={bx(kl)} height={30} fill={colors.red} fillOpacity={0.55} />
            <text x={250 + bx(r.h) / 2} y={y + 19} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
              {`H(p) = ${r.h.toFixed(3)}`}
            </text>
            <text x={250 + bx(r.h) + bx(kl) / 2} y={y + 19} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
              {`KL = ${kl.toFixed(3)}`}
            </text>
            <text x={250 + bx(r.ce) + 8} y={y + 19} fontSize={11} fontWeight={800} fill={colors.violet}>
              {`= H(p, q) = ${r.ce.toFixed(3)}`}
            </text>
          </g>
        );
      })}
      <text x={250} y={188} fontSize={10} fill={inkSecondary}>
        파랑 = 피할 수 없는 불확실성 H(p), 빨강 = 모델이 틀려서 더 쓰는 비트 KL(p‖q)
      </text>
    </DiagramFrame>
  );
}

export function KlDirection() {
  // 두 봉우리 분포 p = ½N(−2, 0.6²) + ½N(2, 0.6²)에 정규분포 q 하나를 맞출 때. KL(p‖q) 최소: N(0, 2.09²), KL(q‖p) 최소: N(2.0, 0.61²)(수치 최적화).
  const npdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
  const p = (x: number) => 0.5 * npdf(x, -2, 0.6) + 0.5 * npdf(x, 2, 0.6);
  const panels = [
    { t: "KL(p‖q) 최소화", sub: "p가 있는 곳을 모두 덮는다 (평균 찾기)", q: (x: number) => npdf(x, 0, 2.088), c: colors.blue, note: "q = N(0, 2.09²)" },
    { t: "KL(q‖p) 최소화", sub: "봉우리 하나에 집중한다 (모드 찾기)", q: (x: number) => npdf(x, 1.997, 0.605), c: colors.orange, note: "q = N(2.0, 0.61²)" },
  ];
  const pw = 300;
  return (
    <DiagramFrame
      title="KL 발산의 방향에 따라 근사 분포의 모양이 달라진다"
      caption="봉우리가 둘인 분포 p(회색)에 정규분포 q 하나를 맞춘다고 하자(수치 최적화 결과). KL(p‖q)를 줄이면 p가 확률을 두는 곳에서 q가 작으면 큰 벌점을 받으므로, q가 두 봉우리를 모두 덮도록 넓게 퍼진다(평균은 0, 표준편차 2.09). 반대로 KL(q‖p)를 줄이면 q가 확률을 두는 곳에서 p가 작으면 벌점을 받으므로, q는 봉우리 하나에만 좁게 맞춰진다(평균 2, 표준편차 0.61). 6주차 RLHF의 KL 벌점과 4주차 VAE에서도 어느 방향의 KL을 쓰느냐에 따라 결과의 성격이 달라진다."
      viewBox="0 0 720 210"
      minWidth={600}
    >
      {panels.map((pn, j) => {
        const x0 = 30 + j * (pw + 50);
        const sx = linear(-5, 5, x0, x0 + pw);
        const sy = linear(0, 0.72, 170, 40);
        return (
          <g key={pn.t}>
            <text x={x0 + pw / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={pn.c}>
              {pn.t}
            </text>
            <text x={x0 + pw / 2} y={31} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              {pn.sub}
            </text>
            <path d={`${linePath(sample(p, -5, 5, 240).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} L${sx(5)},${sy(0)} L${sx(-5)},${sy(0)} Z`} fill={inkMuted} fillOpacity={0.25} stroke={inkMuted} strokeWidth={1.6} />
            <path d={linePath(sample(pn.q, -5, 5, 240).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={pn.c} strokeWidth={2.6} />
            <line x1={x0} x2={x0 + pw} y1={sy(0)} y2={sy(0)} stroke={inkMuted} />
            {[-4, -2, 0, 2, 4].map((t) => (
              <text key={t} x={sx(t)} y={sy(0) + 14} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
                {String(t).replace("-", "−")}
              </text>
            ))}
            <text x={x0 + pw / 2} y={198} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={pn.c}>
              {pn.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function ConditionZigzag() {
  // 곡률이 가로 1, 세로 κ = 10인 이차 함수 L = ½(x² + 10y²)에서 최선의 고정 학습률 2/(a_max + a_min)로 경사하강법(같은 축척).
  // 두 방향 모두 스텝마다 (κ − 1)/(κ + 1) = 0.82배가 되고, 세로는 부호가 바뀐다. 오른쪽은 본문 코드의 스텝 수(1, 69, 691, 6908).
  const kappa = 10;
  const lr = 2 / (kappa + 1);
  const path: [number, number][] = [[3, 0.8]];
  for (let t = 0; t < 16; t++) {
    const [x, y] = path[path.length - 1];
    path.push([x - lr * x, y - lr * kappa * y]);
  }
  const S = 46;
  const cx = 205;
  const cy = 122;
  const tx = (x: number) => cx + x * S;
  const ty = (y: number) => cy - y * S;
  const f0 = 0.5 * (path[0][0] ** 2 + kappa * path[0][1] ** 2);
  const steps = [
    { k: 1, n: 1 },
    { k: 10, n: 69 },
    { k: 100, n: 691 },
    { k: 1000, n: 6908 },
  ];
  const bx = (n: number) => (Math.log10(n) / 4) * 180;
  return (
    <DiagramFrame
      title="조건수가 크면 경사하강법이 지그재그로 느려진다"
      caption={`왼쪽: 가로 방향 곡률 1, 세로 방향 곡률 10(κ = 10)인 이차 함수의 등고선(가로세로 같은 축척)과, 최선의 고정 학습률 2/(a_max + a_min)로 움직인 경사하강법의 경로다(원점이 최솟값). 가파른 세로 방향에서는 스텝마다 부호가 바뀌며 골짜기의 양쪽 벽 사이를 오가고, 완만한 가로 방향으로는 스텝마다 오차의 ${((kappa - 1) / (kappa + 1)).toFixed(2)}배씩만 줄어 계곡 바닥을 따라 느리게 내려간다. 오른쪽: 본문 코드로 오차를 10⁻⁶ 아래로 줄이는 데 걸린 스텝 수다. 조건수가 10배가 될 때마다 스텝 수도 약 10배(69 → 691 → 6908)가 되지만, 곡률을 반영해 보폭을 정하는 뉴턴 방법은 κ와 상관없이 한 스텝에 끝난다.`}
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <text x={14} y={20} fontSize={11} fontWeight={800} fill={ink}>
        κ = 10: 가로 곡률 1, 세로 곡률 10
      </text>
      <line x1={tx(-4.2)} x2={tx(4.2)} y1={cy} y2={cy} stroke={inkMuted} strokeOpacity={0.5} />
      <line x1={cx} x2={cx} y1={ty(1.6)} y2={ty(-1.6)} stroke={inkMuted} strokeOpacity={0.5} />
      {[1, 0.55, 0.25, 0.08].map((r) => (
        <ellipse key={r} cx={cx} cy={cy} rx={Math.sqrt(2 * f0 * r) * S} ry={Math.sqrt((2 * f0 * r) / kappa) * S} fill="none" stroke={inkMuted} strokeOpacity={0.6} />
      ))}
      <path d={linePath(path.map(([x, y]) => [tx(x), ty(y)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={1.8} />
      {path.map(([x, y], i) => (
        <circle key={i} cx={tx(x)} cy={ty(y)} r={i === 0 ? 4.5 : 2.6} fill={colors.red} />
      ))}
      <circle cx={cx} cy={cy} r={4.5} fill={ink} />
      <text x={tx(path[0][0]) + 8} y={ty(path[0][1]) - 4} fontSize={10.5} fontWeight={800} fill={ink}>
        출발
      </text>
      <text x={cx - 8} y={cy + 16} textAnchor="end" fontSize={10} fontWeight={700} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        최솟값
      </text>
      <text x={14} y={204} fontSize={10.5} fontWeight={800} fill={colors.red}>
        ● 경사하강법: 세로로는 진동하고 가로로는 0.82배씩 줄어듦
      </text>
      <text x={14} y={221} fontSize={10} fill={inkSecondary}>
        같은 축척으로 그려 등고선이 가로로 √10 ≈ 3.2배 길다
      </text>
      <line x1={412} y1={14} x2={412} y2={224} stroke="var(--border-hairline)" />
      <text x={566} y={24} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        오차 10⁻⁶까지 걸린 스텝 수 (로그 눈금)
      </text>
      {steps.map((s, i) => (
        <g key={s.k}>
          <text x={430} y={62 + i * 38} fontSize={10.5} fontWeight={700} fill={ink}>
            {`κ = ${s.k}`}
          </text>
          <rect x={490} y={50 + i * 38} width={Math.max(3, bx(s.n))} height={18} rx={3} fill={colors.red} fillOpacity={0.3 + 0.12 * i} />
          <text x={490 + Math.max(3, bx(s.n)) + 6} y={63 + i * 38} fontSize={11} fontWeight={800} fill={ink}>
            {s.n.toLocaleString("en-US")}
          </text>
        </g>
      ))}
      <Lines x={566} y={204} lines={["스텝 수 ≈ (κ/2)·ln(1/ε), 조건수에 비례", "뉴턴 방법은 κ와 상관없이 1스텝"]} size={10} anchor="middle" color={inkSecondary} gap={1.5} />
    </DiagramFrame>
  );
}
