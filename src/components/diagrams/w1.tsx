import DiagramFrame, { colors, ink, inkSecondary, card2Bg } from "./DiagramFrame";
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
