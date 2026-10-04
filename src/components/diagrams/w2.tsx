import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Label } from "./primitives";
import { Axes, Markers, Arr, Lines, Tag, linear, linePath, sample, seeded, gaussian, mono, solveLinear } from "./chart";

export function ConfusionMatrix() {
  const cell = 110;
  const x0 = 170;
  const y0 = 50;
  const cells = [
    { label: "TP", sub: "실제 양성 · 예측 양성", x: x0, y: y0, color: colors.aqua },
    { label: "FN", sub: "실제 양성 · 예측 음성", x: x0 + cell, y: y0, color: colors.red },
    { label: "FP", sub: "실제 음성 · 예측 양성", x: x0, y: y0 + cell, color: colors.red },
    { label: "TN", sub: "실제 음성 · 예측 음성", x: x0 + cell, y: y0 + cell, color: colors.aqua },
  ];
  return (
    <DiagramFrame
      title="혼동행렬과 Precision / Recall"
      viewBox="0 0 560 300"
      caption="Precision = TP/(TP+FP)는 예측 열(세로) 기준, Recall = TP/(TP+FN)은 실제 행(가로) 기준이다."
    >
      <ArrowDefs />
      <Label x={x0 + cell} y={30} text="예측" color={inkMuted} weight={700} />
      <Label x={x0 - 60} y={y0 + cell} text="실제" color={inkMuted} weight={700} />
      <Label x={x0} y={y0 - 8} text="양성" color={inkSecondary} />
      <Label x={x0 + cell} y={y0 - 8} text="음성" color={inkSecondary} />
      <Label x={x0 - 30} y={y0 + 20} text="양성" color={inkSecondary} anchor="end" />
      <Label x={x0 - 30} y={y0 + cell + 20} text="음성" color={inkSecondary} anchor="end" />
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={cell} height={cell} fill={card2Bg} stroke={c.color} strokeWidth={2} />
          <text x={c.x + cell / 2} y={c.y + cell / 2 - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill={c.color}>
            {c.label}
          </text>
          <text x={c.x + cell / 2} y={c.y + cell / 2 + 16} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {c.sub}
          </text>
        </g>
      ))}
      <Arrow x1={x0 - 10} y1={y0 + cell * 2 + 20} x2={x0 + cell * 2 + 10} y2={y0 + cell * 2 + 20} color={colors.blue} />
      <Label x={x0 + cell} y={y0 + cell * 2 + 36} text="Precision: 예측 '양성' 열 안에서 TP 비율" color={colors.blue} weight={700} />
    </DiagramFrame>
  );
}

export function DataSplitDiagram() {
  const width = 620;
  const barY = 40;
  const barH = 40;
  const segs = [
    { label: "Train 60~80%", w: 340, color: colors.blue },
    { label: "Val 10~20%", w: 130, color: colors.aqua },
    { label: "Test 10~20%", w: 130, color: colors.red },
  ];
  let cx = 20;
  const foldY = 150;
  const foldW = 90;
  const foldH = 34;
  const folds = 5;
  return (
    <DiagramFrame
      title="데이터 분할과 K-Fold 교차검증"
      viewBox={`0 0 ${width} 260`}
      caption="Test는 하이퍼파라미터 튜닝에 절대 사용하지 않고 최종 1회 평가에만 쓴다. K-Fold는 Val 위치를 바꿔가며 평균 성능을 측정한다."
    >
      {segs.map((s, i) => {
        const node = (
          <g key={i}>
            <rect x={cx} y={barY} width={s.w} height={barH} fill={s.color} opacity={0.85} />
            <text x={cx + s.w / 2} y={barY + barH / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
              {s.label}
            </text>
          </g>
        );
        cx += s.w;
        return node;
      })}
      <rect x={20} y={barY} width={600} height={barH} fill="none" stroke={gridline} />

      {Array.from({ length: folds }).map((_, r) => (
        <g key={r}>
          {Array.from({ length: folds }).map((_, c) => (
            <rect
              key={c}
              x={20 + c * (foldW + 6)}
              y={foldY + r * (foldH + 6)}
              width={foldW}
              height={foldH}
              fill={c === r ? colors.aqua : card2Bg}
              stroke={gridline}
            />
          ))}
          <text x={20 + folds * (foldW + 6) + 8} y={foldY + r * (foldH + 6) + foldH / 2 + 4} fontSize={11} fill={inkSecondary}>
            Fold {r + 1}: 검증 세트 ={" "}
            <tspan fontWeight={700} fill={colors.aqua}>
              {r + 1}
            </tspan>
          </text>
        </g>
      ))}
      <ArrowDefs />
    </DiagramFrame>
  );
}

export function SigmoidCurve() {
  // σ(z) = 1/(1+e^-z). z = 0에서 0.5를 지나고, 임계값 0.5는 결정 경계 z = wᵀx + b = 0과 같다.
  const W = 640;
  const H = 260;
  const x0 = 60;
  const x1 = 600;
  const yTop = 30;
  const yBot = 210;
  const zMin = -6;
  const zMax = 6;
  const sx = (z: number) => x0 + ((z - zMin) / (zMax - zMin)) * (x1 - x0);
  const sy = (p: number) => yBot - p * (yBot - yTop);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const z = zMin + (i / 120) * (zMax - zMin);
    return `${sx(z).toFixed(1)},${sy(1 / (1 + Math.exp(-z))).toFixed(1)}`;
  }).join(" ");
  const marks = [-4, -2, 0, 2, 4];
  return (
    <DiagramFrame
      title="시그모이드: 어떤 점수 z든 0~1의 확률로"
      caption="z가 클수록 1, 작을수록 0에 가까워지고 z = 0에서 정확히 0.5다. 그래서 'p ≥ 0.5이면 양성'은 'z = wᵀx + b ≥ 0이면 양성'과 같고, 결정 경계는 wᵀx + b = 0인 직선이다."
      viewBox={`0 0 ${W} ${H}`}
      minWidth={460}
    >
      <rect x={sx(0)} y={yTop} width={x1 - sx(0)} height={yBot - yTop} fill={colors.blue} fillOpacity={0.06} />
      <rect x={x0} y={yTop} width={sx(0) - x0} height={yBot - yTop} fill={colors.orange} fillOpacity={0.06} />
      <line x1={x0} y1={yBot} x2={x1} y2={yBot} stroke="var(--border-strong)" />
      <line x1={x0} y1={yTop} x2={x0} y2={yBot} stroke="var(--border-strong)" />
      {[0, 0.5, 1].map((p) => (
        <g key={p}>
          <line x1={x0} y1={sy(p)} x2={x1} y2={sy(p)} stroke="var(--border-hairline)" strokeDasharray={p === 0.5 ? "5 4" : undefined} />
          <text x={x0 - 8} y={sy(p) + 4} textAnchor="end" fontSize={11} fill={inkSecondary}>
            {p}
          </text>
        </g>
      ))}
      <line x1={sx(0)} y1={yTop} x2={sx(0)} y2={yBot} stroke={ink} strokeDasharray="5 4" />
      <polyline points={pts} fill="none" stroke={colors.violet} strokeWidth={2.5} />
      {marks.map((z) => {
        const p = 1 / (1 + Math.exp(-z));
        return (
          <g key={z}>
            <circle cx={sx(z)} cy={sy(p)} r={3.5} fill={colors.violet} />
            <text x={sx(z)} y={yBot + 16} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              {z}
            </text>
            <text x={sx(z) + (z < 0 ? 6 : -6)} y={sy(p) + (z < 0 ? -8 : 16)} textAnchor={z < 0 ? "start" : "end"} fontSize={10.5} fontWeight={700} fill={ink}>
              {p.toFixed(3)}
            </text>
          </g>
        );
      })}
      <text x={x1} y={yBot + 34} textAnchor="end" fontSize={11} fill={inkSecondary}>
        z = wᵀx + b
      </text>
      <text x={x0 + 10} y={yTop + 16} fontSize={11.5} fontWeight={700} fill={colors.orange}>
        음성으로 예측 (p &lt; 0.5)
      </text>
      <text x={x1 - 10} y={yBot - 10} textAnchor="end" fontSize={11.5} fontWeight={700} fill={colors.blue}>
        양성으로 예측 (p ≥ 0.5)
      </text>
    </DiagramFrame>
  );
}

export function LearningCurves() {
  // 훈련 데이터 양에 따른 훈련 오차(파랑)와 검증 오차(주황). 왼쪽: 과적합(틈이 큼), 오른쪽: 과소적합(둘 다 높게 만남).
  const panels = [
    { title: "과적합(분산이 큼)", train: [0.02, 0.05, 0.08, 0.1, 0.12], val: [0.6, 0.42, 0.32, 0.26, 0.22], note: "틈이 크다 → 데이터를 늘리면 좋아진다" },
    { title: "과소적합(편향이 큼)", train: [0.25, 0.33, 0.37, 0.39, 0.4], val: [0.62, 0.5, 0.45, 0.43, 0.42], note: "둘 다 높게 만난다 → 데이터보다 모델을 키워야" },
  ];
  const pw = 280;
  const ph = 150;
  const top = 36;
  return (
    <DiagramFrame
      title="학습 곡선으로 진단하기"
      caption="훈련 데이터를 늘려 가며 훈련 오차와 검증 오차를 그린 학습 곡선. 두 곡선 사이의 틈은 분산을, 두 곡선이 만나는 높이는 편향을 보여 준다."
      viewBox="0 0 660 250"
      minWidth={480}
    >
      {panels.map((p, k) => {
        const ox = 40 + k * 320;
        const sx = (i: number) => ox + (i / 4) * pw;
        const sy = (v: number) => top + ph - (v / 0.7) * ph;
        const line = (vals: number[]) => vals.map((v, i) => `${sx(i)},${sy(v)}`).join(" ");
        return (
          <g key={p.title}>
            <text x={ox + pw / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {p.title}
            </text>
            <line x1={ox} y1={top + ph} x2={ox + pw} y2={top + ph} stroke="var(--border-strong)" />
            <line x1={ox} y1={top} x2={ox} y2={top + ph} stroke="var(--border-strong)" />
            <polyline points={line(p.train)} fill="none" stroke={colors.blue} strokeWidth={2.4} />
            <polyline points={line(p.val)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
            <text x={ox + pw} y={top + ph + 16} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
              훈련 데이터 양 →
            </text>
            <text x={ox - 6} y={top + 6} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
              오차
            </text>
            <text x={sx(4) - 4} y={sy(p.train[4]) + (k === 0 ? 16 : 18)} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.blue}>
              훈련
            </text>
            <text x={sx(4) - 4} y={sy(p.val[4]) - 8} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.orange}>
              검증
            </text>
            <text x={ox + pw / 2} y={top + ph + 38} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              {p.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

// ───────────────────────── 2주차 핵심 과정: 추가 그림 ─────────────────────────

export function DataPrepPipeline() {
  const P = "dpp";
  const stages = [
    { x: 12, title: "① 수집", color: inkMuted, items: ["설문·로그·센서", "DB·웹 크롤링"] },
    { x: 192, title: "② 정제", color: colors.orange, items: ["1. 표기 통일", "2. 중복 제거", "3. 결측 채우기", "4. 이상치 처리"] },
    { x: 372, title: "③ 전처리", color: colors.blue, items: ["범주 → 숫자 (인코딩)", "범위 맞추기 (스케일링)", "새 특징 만들기"] },
    { x: 552, title: "④ 모델", color: colors.violet, items: ["숫자 벡터 X를", "입력받아 학습·예측", "fθ(X)"] },
  ];
  const w = 156;
  const top = 30;
  const h = 146;
  const issues = ["결측", "이상치", "표기 불일치", "중복"];
  return (
    <DiagramFrame
      title="모델 앞의 세 단계: 수집 → 정제 → 전처리"
      caption="원본 데이터에는 결측·이상치·표기 불일치·중복이 섞여 있다. 정제는 이 오류를 바로잡는 단계로 순서(표기 통일 → 중복 제거 → 결측 채우기)가 중요하고, 전처리는 정제된 표를 모델이 받는 숫자 벡터로 바꾼다. 어느 단계의 결함이든 모델은 그대로, 때로는 증폭해 출력한다(Garbage in, garbage out)."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {stages.map((s, i) => (
        <g key={s.title}>
          <rect x={s.x} y={top} width={w} height={h} rx={12} fill={s.color} fillOpacity={0.06} stroke={s.color} strokeWidth={1.4} />
          <rect x={s.x} y={top} width={w} height={28} rx={12} fill={s.color} fillOpacity={0.18} />
          <text x={s.x + w / 2} y={top + 19} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
            {s.title}
          </text>
          {s.items.map((it, j) => (
            <text key={it} x={s.x + 14} y={top + 50 + j * 20} fontSize={11} fill={ink}>
              {it}
            </text>
          ))}
          {i < stages.length - 1 && <Arr x1={s.x + w + 2} y1={top + h / 2} x2={stages[i + 1].x - 4} y2={top + h / 2} color={inkSecondary} marker={`${P}-ink`} width={2} />}
        </g>
      ))}
      {issues.map((t, j) => (
        <g key={t}>
          <rect x={22 + (j % 2) * 70} y={top + 98 + Math.floor(j / 2) * 24} width={64} height={20} rx={10} fill={colors.red} fillOpacity={0.14} stroke={colors.red} />
          <text x={54 + (j % 2) * 70} y={top + 112 + Math.floor(j / 2) * 24} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.red}>
            {t}
          </text>
        </g>
      ))}
      <text x={22} y={top + 91} fontSize={10.5} fill={inkSecondary}>
        흔한 문제
      </text>
      <text x={12} y={204} fontSize={11.5} fontWeight={700} fill={ink}>
        Garbage in, garbage out
      </text>
      <text x={172} y={204} fontSize={11} fill={inkSecondary}>
        — 앞 단계의 결함은 뒤에서 고칠 수 없다
      </text>
      <text x={12} y={228} fontSize={11} fontWeight={600} fill={colors.orange}>
        주의: 결측을 채울 중앙값, 스케일링의 평균·최솟값·최댓값 같은 통계는 훈련 데이터에서만 계산한다(「데이터 분할」 단계).
      </text>
    </DiagramFrame>
  );
}

export function OutlierIqrVsZ() {
  // 본문 예제 [12, 13, 13, 14, 14, 15, 16, 95]. 가로축은 0~30과 85~110 두 구간으로 끊어 그린다.
  const X = (v: number) => (v <= 30 ? 70 + v * 11.5 : 460 + (v - 85) * 9.6);
  const data = [12, 13, 13, 14, 14, 15, 16, 95];
  const rows = [
    { y: 92, title: "IQR 방법", sub: "사분위수는 극단값 하나에 거의 흔들리지 않는다" },
    { y: 214, title: "Z-score 방법", sub: "95가 평균·표준편차를 부풀려 자신을 가린다 (masking)" },
  ];
  const axis = (y: number) => (
    <g>
      <line x1={X(0)} y1={y} x2={X(30)} y2={y} stroke={inkMuted} />
      <line x1={X(85)} y1={y} x2={X(110)} y2={y} stroke={inkMuted} />
      {[0, 10, 20, 30, 90, 100, 110].map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={y} x2={X(t)} y2={y + 4} stroke={inkMuted} />
          <text x={X(t)} y={y + 16} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {t}
          </text>
        </g>
      ))}
      <text x={(X(30) + X(85)) / 2} y={y + 4} textAnchor="middle" fontSize={13} fill={inkMuted}>
        ≈
      </text>
    </g>
  );
  const dots = (y: number, flagged: boolean) => {
    const seen: Record<number, number> = {};
    return data.map((v, i) => {
      seen[v] = (seen[v] ?? 0) + 1;
      const is95 = v === 95;
      return (
        <circle
          key={i}
          cx={X(v)}
          cy={y - 7 - (seen[v] - 1) * 10}
          r={4.6}
          fill={is95 ? (flagged ? colors.red : colors.blue) : ink}
          fillOpacity={is95 ? 1 : 0.75}
        />
      );
    });
  };
  const r1 = rows[0].y;
  const r2 = rows[1].y;
  return (
    <DiagramFrame
      title="같은 데이터, 다른 결론: IQR과 Z-score로 이상치 찾기"
      caption="위: Q1 = 13, Q3 = 15.5인 상자는 95와 상관없이 정해지므로 상한선 19.25 밖의 95를 바로 잡아낸다. 아래: 95가 평균을 24로 끌어올리고 표준편차를 26.86으로 부풀린 탓에 '평균 + 3σ' 경계가 104.6까지 밀려나, 정작 95(z ≈ 2.64)는 정상 값으로 판정된다. 가로축은 30과 85 사이를 생략했다."
      viewBox="0 0 720 270"
      minWidth={560}
    >
      {rows.map((r) => (
        <g key={r.title}>
          <text x={12} y={r.y - 64} fontSize={12.5} fontWeight={700} fill={ink}>
            {r.title}
          </text>
          <text x={96} y={r.y - 64} fontSize={11} fill={inkSecondary}>
            {r.sub}
          </text>
          {axis(r.y)}
        </g>
      ))}
      {/* IQR */}
      <rect x={X(13)} y={r1 - 44} width={X(15.5) - X(13)} height={22} fill={colors.blue} fillOpacity={0.18} stroke={colors.blue} />
      <line x1={X(14)} y1={r1 - 44} x2={X(14)} y2={r1 - 22} stroke={colors.blue} strokeWidth={2} />
      <line x1={X(12)} y1={r1 - 33} x2={X(13)} y2={r1 - 33} stroke={colors.blue} />
      <line x1={X(15.5)} y1={r1 - 33} x2={X(16)} y2={r1 - 33} stroke={colors.blue} />
      <text x={X(13) - 4} y={r1 - 48} textAnchor="end" fontSize={10} fontWeight={700} fill={colors.blue}>
        Q1 = 13
      </text>
      <text x={X(15.5) + 4} y={r1 - 48} fontSize={10} fontWeight={700} fill={colors.blue}>
        Q3 = 15.5
      </text>
      <line x1={X(19.25)} y1={r1 - 40} x2={X(19.25)} y2={r1} stroke={colors.red} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={X(19.25) + 5} y={r1 - 26} fontSize={10.5} fontWeight={700} fill={colors.red}>
        상한선 = Q3 + 1.5×IQR = 19.25
      </text>
      {dots(r1, true)}
      <text x={X(95)} y={r1 - 20} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.red}>
        이상치 ✓
      </text>
      {/* Z-score */}
      <rect x={X(0)} y={r2 - 50} width={X(30) - X(0) + 10} height={44} fill={colors.violet} fillOpacity={0.08} />
      <text x={X(2)} y={r2 - 38} fontSize={10} fill={colors.violet}>
        μ ± σ = −2.9 ~ 50.9 (σ = 26.86)
      </text>
      <path d={`M${X(24)},${r2 - 2} l-6,-10 l12,0 Z`} fill={colors.violet} />
      <text x={X(24) + 9} y={r2 - 16} fontSize={10.5} fontWeight={700} fill={colors.violet}>
        평균 μ = 24
      </text>
      <line x1={X(104.58)} y1={r2 - 56} x2={X(104.58)} y2={r2} stroke={colors.red} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={X(104.58) - 5} y={r2 - 44} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.red}>
        μ + 3σ = 104.6
      </text>
      {dots(r2, false)}
      <text x={X(95)} y={r2 - 20} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        z = 2.64 → 놓침 ✗
      </text>
    </DiagramFrame>
  );
}

export function EncodingGeometry() {
  // 레이블 인코딩(대구 0, 부산 1, 서울 2)은 없던 거리를 만들고, 원-핫은 세 도시를 서로 같은 거리(√2)에 둔다.
  const P = "eng";
  const nx = (i: number) => 70 + i * 110;
  const ny = 110;
  const cities = ["대구", "부산", "서울"];
  const O: [number, number] = [520, 214];
  const tips: [number, number][] = [
    [656, 224],
    [520, 70],
    [418, 160],
  ];
  const vec = ["[1, 0, 0]", "[0, 1, 0]", "[0, 0, 1]"];
  const edge = (a: number, b: number) => {
    const [x1, y1] = tips[a];
    const [x2, y2] = tips[b];
    return (
      <g key={`${a}${b}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.violet} strokeWidth={2} />
        <text x={(x1 + x2) / 2 + (a === 0 && b === 2 ? 0 : 8)} y={(y1 + y2) / 2 + (a === 0 && b === 2 ? 16 : -4)} fontSize={11} fontWeight={700} fill={colors.violet}>
          √2
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="인코딩이 만드는 기하학: 레이블 인코딩 vs 원-핫"
      caption="왼쪽: 순서가 없는 도시를 0, 1, 2로 바꾸면 모델은 '서울은 부산보다 대구에서 두 배 멀다' 같은 없는 관계를 배울 수 있다. 오른쪽: 원-핫 인코딩은 도시마다 축 하나를 주어 어느 두 도시 사이의 거리도 √2로 같게 만든다. 순서형 변수(고졸 < 대졸 < 대학원졸)라면 왼쪽처럼 순서를 담은 정수가 오히려 맞다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ red: colors.red }} />
      <text x={175} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.orange}>
        레이블 인코딩: 없는 거리가 생긴다
      </text>
      <line x1={40} y1={ny} x2={330} y2={ny} stroke={inkMuted} strokeWidth={1.4} />
      {cities.map((c, i) => (
        <g key={c}>
          <circle cx={nx(i)} cy={ny} r={7} fill={colors.orange} />
          <text x={nx(i)} y={ny + 26} textAnchor="middle" fontSize={13} fontWeight={700} fill={ink}>
            {c}
          </text>
          <text x={nx(i)} y={ny + 44} textAnchor="middle" fontSize={12} fill={inkSecondary} fontFamily={mono}>
            = {i}
          </text>
        </g>
      ))}
      <path d={`M${nx(0)},${ny - 12} Q${(nx(0) + nx(1)) / 2},${ny - 40} ${nx(1)},${ny - 12}`} fill="none" stroke={colors.red} strokeWidth={1.4} />
      <text x={(nx(0) + nx(1)) / 2} y={ny - 11} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.red}>
        거리 1
      </text>
      <path d={`M${nx(0)},${ny - 14} Q${nx(1)},${ny - 84} ${nx(2)},${ny - 14}`} fill="none" stroke={colors.red} strokeWidth={1.4} strokeDasharray="5 3" />
      <text x={nx(1)} y={ny - 56} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.red}>
        거리 2 (?)
      </text>
      <Lines x={175} y={196} lines={["모델이 '대구 < 부산 < 서울' 순서와", "'서울 − 대구 = 2배' 같은 크기를 믿게 된다"]} size={11} color={inkSecondary} />
      <text x={175} y={246} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={colors.green}>
        순서형(고졸 0 &lt; 대졸 1 &lt; 대학원졸 2)에는 이 방식이 맞다
      </text>

      <line x1={360} y1={14} x2={360} y2={250} stroke="var(--border-hairline)" />
      <text x={540} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={colors.blue}>
        원-핫 인코딩: 모든 쌍이 같은 거리
      </text>
      {tips.map(([x, y], i) => (
        <line key={i} x1={O[0]} y1={O[1]} x2={x} y2={y} stroke={inkMuted} strokeDasharray="3 3" />
      ))}
      {edge(0, 1)}
      {edge(1, 2)}
      {edge(0, 2)}
      {tips.map(([x, y], i) => (
        <g key={cities[i]}>
          <circle cx={x} cy={y} r={7} fill={colors.blue} />
          <text x={x + (i === 2 ? -10 : 10)} y={y + (i === 1 ? -6 : 18)} textAnchor={i === 2 ? "end" : "start"} fontSize={12.5} fontWeight={700} fill={ink}>
            {cities[i]}
          </text>
          <text x={x + (i === 2 ? -10 : 10)} y={y + (i === 1 ? 10 : 34)} textAnchor={i === 2 ? "end" : "start"} fontSize={11} fill={inkSecondary} fontFamily={mono}>
            {vec[i]}
          </text>
        </g>
      ))}
      <circle cx={O[0]} cy={O[1]} r={3} fill={inkMuted} />
      <text x={O[0] - 6} y={O[1] + 14} textAnchor="end" fontSize={10} fill={inkSecondary}>
        원점
      </text>
    </DiagramFrame>
  );
}

export function ScalingCompare() {
  // x = [2, 4, 6, 8]와 이상치 100을 더한 경우. 아래 두 줄은 같은 눈금(−2 ~ 2.2)에 그려 '짓눌림'의 크기를 비교한다.
  const cols = [
    { x0: 20, title: "x = [2, 4, 6, 8]", raw: [2, 4, 6, 8], rawMax: 10, mm: [0, 0.333, 0.667, 1], z: [-1.342, -0.447, 0.447, 1.342] },
    { x0: 380, title: "이상치 100이 하나 더 들어오면", raw: [2, 4, 6, 8, 100], rawMax: 110, mm: [0, 0.0204, 0.0408, 0.0612, 1], z: [-0.578, -0.526, -0.473, -0.42, 1.997] },
  ];
  const W = 300;
  const rows = [
    { y: 72, label: "원본" },
    { y: 146, label: "Min-Max" },
    { y: 220, label: "Z-score" },
  ];
  return (
    <DiagramFrame
      title="Min-Max와 Z-score: 이상치 하나가 만드는 차이"
      caption="왼쪽: 이상치가 없으면 두 방법 모두 네 값을 고르게 펼친다. 오른쪽: 이상치 100이 들어오면 Min-Max는 분모(최댓값 − 최솟값)가 98로 커져 원래 네 값을 0~0.06에 짓누른다. Z-score도 영향을 받아 네 값이 −0.58~−0.42에 몰리지만, 같은 눈금으로 보면 간격이 Min-Max의 약 2.6배라 덜 짓눌린다. 회색 점선은 0이다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      {cols.map((c) => {
        const rawX = linear(0, c.rawMax, c.x0 + 40, c.x0 + 40 + W - 40);
        const sx = linear(-2, 2.2, c.x0 + 40, c.x0 + 40 + W - 40);
        return (
          <g key={c.title}>
            <text x={c.x0 + W / 2 + 20} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
              {c.title}
            </text>
            {rows.map((r) => (
              <g key={r.label}>
                <text x={c.x0 + 32} y={r.y + 4} textAnchor="end" fontSize={11} fontWeight={700} fill={r.label === "원본" ? ink : r.label === "Min-Max" ? colors.orange : colors.blue}>
                  {r.label}
                </text>
                <line x1={c.x0 + 40} y1={r.y} x2={c.x0 + W} y2={r.y} stroke={inkMuted} />
              </g>
            ))}
            {[0, c.rawMax / 2, c.rawMax].map((t) => (
              <text key={`rt${t}`} x={rawX(t)} y={rows[0].y + 18} textAnchor="middle" fontSize={10} fill={inkSecondary}>
                {t}
              </text>
            ))}
            {[-2, -1, 0, 1, 2].map((t) => (
              <g key={`t${t}`}>
                <line x1={sx(t)} y1={rows[1].y - 16} x2={sx(t)} y2={rows[2].y + 6} stroke={t === 0 ? inkMuted : "var(--border-hairline)"} strokeDasharray={t === 0 ? "3 3" : undefined} />
                <text x={sx(t)} y={rows[2].y + 20} textAnchor="middle" fontSize={10} fill={inkSecondary}>
                  {String(t).replace("-", "−")}
                </text>
              </g>
            ))}
            {c.raw.map((v, i) => (
              <circle key={`r${i}`} cx={rawX(v)} cy={rows[0].y} r={5} fill={v === 100 ? colors.red : ink} />
            ))}
            {c.mm.map((v, i) => (
              <circle key={`m${i}`} cx={sx(v)} cy={rows[1].y} r={5} fill={c.raw[i] === 100 ? colors.red : colors.orange} fillOpacity={0.85} />
            ))}
            {c.z.map((v, i) => (
              <circle key={`z${i}`} cx={sx(v)} cy={rows[2].y} r={5} fill={c.raw[i] === 100 ? colors.red : colors.blue} fillOpacity={0.85} />
            ))}
          </g>
        );
      })}
      <text x={540} y={rows[1].y - 14} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        네 값이 0 ~ 0.06에 짓눌림
      </text>
      <text x={540} y={rows[2].y - 14} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.blue}>
        네 값이 −0.58 ~ −0.42 (간격 0.16)
      </text>
      <line x1={360} y1={10} x2={360} y2={250} stroke="var(--border-hairline)" />
    </DiagramFrame>
  );
}

export function ScalingContours() {
  // 손실 L = ½(λ₁u² + λ₂v²). 스케일이 다르면 λ₂ = 12λ₁이라 등고선이 길쭉하고, 같은 학습률로는 세로로 진동하며 가로로 느리게 간다.
  const P = "scc";
  const k = 15;
  const panels = [
    { x0: 14, title: "스케일이 다를 때: 길쭉한 등고선", lu: 1, lv: 12, eta: 0.15, steps: 15, start: [-8, 1.732], levels: [2, 8, 18, 32, 50], note: "η = 0.15로 15스텝: 세로로 진동, 가로로 느림" },
    { x0: 372, title: "표준화한 뒤: 둥근 등고선", lu: 1, lv: 1, eta: 0.7, steps: 4, start: [-4.6, 3.2], levels: [2, 8, 18], note: "η = 0.7로 4스텝: 중심으로 곧장" },
  ];
  return (
    <DiagramFrame
      title="스케일링이 경사하강법을 빠르게 하는 이유"
      caption="왼쪽: 면적(수백 단위)과 방 개수(한 자릿수)처럼 스케일이 크게 다르면 손실 등고선이 길쭉한 타원이 된다. 가파른 방향(세로) 때문에 학습률을 작게 써야 하고, 경사하강법은 등고선에 수직으로 움직이므로 세로로 지그재그하며 완만한 가로 방향으로는 느리게 나아간다. 오른쪽: 표준화하면 등고선이 원에 가까워져 큰 학습률로 몇 걸음 만에 최솟값에 도착한다. 표준화는 정답(최솟값의 위치)이 아니라 찾아가는 길을 바꾼다."
      viewBox="0 0 720 270"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ red: colors.red }} />
      {panels.map((p) => {
        const cx = p.x0 + 167;
        const cy = 138;
        const pts: [number, number][] = [];
        let u = p.start[0];
        let v = p.start[1];
        for (let t = 0; t <= p.steps; t++) {
          pts.push([cx + u * k, cy - v * k]);
          u -= p.eta * p.lu * u;
          v -= p.eta * p.lv * v;
        }
        return (
          <g key={p.title}>
            <text x={cx} y={20} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
              {p.title}
            </text>
            <rect x={p.x0} y={34} width={334} height={196} rx={10} fill="none" stroke="var(--border-hairline)" />
            <line x1={p.x0 + 8} y1={cy} x2={p.x0 + 326} y2={cy} stroke="var(--border-hairline)" />
            <line x1={cx} y1={40} x2={cx} y2={224} stroke="var(--border-hairline)" />
            {p.levels.map((lv) => (
              <ellipse key={lv} cx={cx} cy={cy} rx={Math.sqrt((2 * lv) / p.lu) * k} ry={Math.sqrt((2 * lv) / p.lv) * k} fill="none" stroke={colors.blue} strokeOpacity={0.55} />
            ))}
            <path d={linePath(pts)} fill="none" stroke={colors.red} strokeWidth={2} />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 0 ? 4.5 : 2.8} fill={colors.red} />
            ))}
            <circle cx={cx} cy={cy} r={4} fill={ink} />
            <text x={cx + 7} y={cy - 7} fontSize={10.5} fontWeight={700} fill={ink}>
              최솟값
            </text>
            <text x={cx} y={250} textAnchor="middle" fontSize={11} fontWeight={600} fill={colors.red}>
              {p.note}
            </text>
          </g>
        );
      })}
      <text x={334} y={154} textAnchor="end" fontSize={10} fill={inkSecondary} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        w(방 개수) →
      </text>
      <text x={186} y={46} fontSize={10} fill={inkSecondary}>
        ↑ w(면적)
      </text>
    </DiagramFrame>
  );
}

export function CrossEntropyPenalty() {
  // 이진 교차 엔트로피: 정답 1이면 −log p, 정답 0이면 −log(1 − p).
  const A = { left: 70, top: 24, width: 440, height: 196 };
  const sx = linear(0, 1, A.left, A.left + A.width);
  const sy = linear(0, 5, A.top + A.height, A.top);
  const c1 = sample((p) => -Math.log(p), 0.0068, 1, 140).map(([p, v]) => [sx(p), sy(v)] as [number, number]);
  const c0 = sample((p) => -Math.log(1 - p), 0, 0.9932, 140).map(([p, v]) => [sx(p), sy(v)] as [number, number]);
  const pts = [
    { p: 0.99, v: -Math.log(0.99), label: "p = 0.99: 0.01", sub: "확신 있게 맞힘", dx: -8, anchor: "end" as const, dy: -34 },
    { p: 0.5, v: -Math.log(0.5), label: "p = 0.5: 0.69", sub: "반반", dx: 6, anchor: "start" as const, dy: 22 },
    { p: 0.01, v: -Math.log(0.01), label: "p = 0.01: 4.6", sub: "확신 있게 틀림", dx: 10, anchor: "start" as const, dy: 4 },
  ];
  return (
    <DiagramFrame
      title="교차 엔트로피: 틀린 쪽으로 확신할수록 벌점이 폭발한다"
      caption="파란 곡선은 정답이 1(스팸)일 때의 벌점 −log p, 주황 곡선은 정답이 0일 때의 벌점 −log(1 − p)다. 정답 쪽 확률이 1에 가까우면 벌점은 0에 가깝고, 반반(0.5)이면 0.69, 정답 쪽 확률이 0에 가까워질수록 벌점은 끝없이 커진다. 그래서 모델은 '자신 있게 틀리는' 예측을 가장 강하게 고친다."
      viewBox="0 0 720 262"
      minWidth={540}
    >
      <Axes {...A} sx={sx} sy={sy} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[0, 1, 2, 3, 4, 5]} xLabel="모델이 낸 스팸 확률 p" yLabel="손실(벌점)" />
      <path d={linePath(c0)} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      <path d={linePath(c1)} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      {pts.map((q) => (
        <g key={q.p}>
          <circle cx={sx(q.p)} cy={sy(q.v)} r={5} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1.5} />
          <g stroke="var(--surface-card)" strokeWidth={3.5} paintOrder="stroke">
            <Lines x={sx(q.p) + q.dx} y={sy(q.v) + q.dy} lines={[q.label, q.sub]} size={10.5} weight={700} color={colors.blue} anchor={q.anchor} />
          </g>
        </g>
      ))}
      <rect x={540} y={60} width={14} height={4} fill={colors.blue} />
      <Lines x={562} y={66} lines={["정답 y = 1일 때", "손실 = −log p"]} size={11} weight={700} color={colors.blue} anchor="start" />
      <rect x={540} y={120} width={14} height={4} fill={colors.orange} />
      <Lines x={562} y={126} lines={["정답 y = 0일 때", "손실 = −log(1 − p)"]} size={11} weight={700} color={colors.orange} anchor="start" />
    </DiagramFrame>
  );
}

export function LogisticStep() {
  // 본문 예: w = (0.5, −0.2), b = 0.1, 샘플 x = (2, 1), y = 1. 한 걸음(η = 0.5) 뒤 w = (0.789, −0.056), b = 0.245.
  const P = "lgs";
  const k = 60;
  const range = { x1: [-1, 4], x2: [-1.4, 2.25] };
  const panels = [
    { x0: 20, w: [0.5, -0.2], b: 0.1, title: "한 걸음 전", sub: "w = (0.5, −0.2), b = 0.1" },
    { x0: 392, w: [0.789, -0.056], b: 0.245, title: "한 걸음 후", sub: "w = (0.789, −0.056), b = 0.245" },
  ];
  const top = 46;
  const H = (range.x2[1] - range.x2[0]) * k;
  const W = (range.x1[1] - range.x1[0]) * k;
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  return (
    <DiagramFrame
      title="기울기 한 걸음이 결정 경계를 움직인다"
      caption="배경색은 모델이 각 위치에 매기는 양성 확률(파랑일수록 양성, 주황일수록 음성)이고 보라 선이 p = 0.5인 결정 경계다. 정답이 1인 샘플 x = (2, 1)에 p = 0.711밖에 주지 못했으므로 w ← w − η(p − y)x에 따라 w가 x 쪽으로 (0.289, 0.144)만큼 움직인다. 그 결과 경계가 샘플에서 멀어지고 확률이 0.854로 올라간다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ violet: colors.violet, ink }} />
      {panels.map((pn) => {
        const X = (v: number) => pn.x0 + (v - range.x1[0]) * k;
        const Y = (v: number) => top + (range.x2[1] - v) * k;
        // p = σ(w·x + b)는 w 방향으로만 변하므로 배경을 w 방향의 선형 그라디언트 하나로 칠한다(경계에서 p = 0.5).
        const wn = Math.hypot(pn.w[0], pn.w[1]);
        const star = [(-pn.b * pn.w[0]) / (wn * wn), (-pn.b * pn.w[1]) / (wn * wn)];
        const ux = pn.w[0] / wn;
        const uy = -pn.w[1] / wn;
        const half = 420;
        const stops = Array.from({ length: 41 }, (_, i) => {
          const off = i / 40;
          const pr = sig((wn * (off - 0.5) * 2 * half) / k);
          return <stop key={i} offset={off} stopColor={pr >= 0.5 ? colors.blue : colors.orange} stopOpacity={Math.abs(pr - 0.5) * 0.75} />;
        });
        // 경계 w1·x1 + w2·x2 + b = 0 → x2 = −(w1·x1 + b)/w2
        const bx = (x2: number) => -(pn.w[1] * x2 + pn.b) / pn.w[0];
        const p = sig(pn.w[0] * 2 + pn.w[1] * 1 + pn.b);
        return (
          <g key={pn.title}>
            <defs>
              <clipPath id={`${P}-clip-${pn.x0}`}>
                <rect x={pn.x0} y={top} width={W} height={H} />
              </clipPath>
              <linearGradient
                id={`${P}-grad-${pn.x0}`}
                gradientUnits="userSpaceOnUse"
                x1={X(star[0]) - ux * half}
                y1={Y(star[1]) - uy * half}
                x2={X(star[0]) + ux * half}
                y2={Y(star[1]) + uy * half}
              >
                {stops}
              </linearGradient>
            </defs>
            <text x={pn.x0 + W / 2} y={18} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
              {pn.title}
            </text>
            <text x={pn.x0 + W / 2} y={35} textAnchor="middle" fontSize={10.5} fill={inkSecondary} fontFamily={mono}>
              {pn.sub}
            </text>
            <g clipPath={`url(#${P}-clip-${pn.x0})`}>
              <rect x={pn.x0} y={top} width={W} height={H} fill={`url(#${P}-grad-${pn.x0})`} />
              <line x1={X(bx(range.x2[0]))} y1={Y(range.x2[0])} x2={X(bx(range.x2[1]))} y2={Y(range.x2[1])} stroke={colors.violet} strokeWidth={2.6} />
            </g>
            <rect x={pn.x0} y={top} width={W} height={H} fill="none" stroke="var(--border-strong)" />
            <line x1={X(0)} y1={top} x2={X(0)} y2={top + H} stroke={inkMuted} strokeDasharray="2 3" />
            <line x1={pn.x0} y1={Y(0)} x2={pn.x0 + W} y2={Y(0)} stroke={inkMuted} strokeDasharray="2 3" />
            <Arr x1={X(0)} y1={Y(0)} x2={X(pn.w[0] * 2)} y2={Y(pn.w[1] * 2)} color={ink} marker={`${P}-ink`} width={2} />
            <text x={X(pn.w[0] * 2) + 4} y={Y(pn.w[1] * 2) + 14} fontSize={10.5} fontWeight={700} fill={ink}>
              2w
            </text>
            <circle cx={X(2)} cy={Y(1)} r={8} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={2} />
            <text x={X(2) + 12} y={Y(1) - 8} fontSize={11.5} fontWeight={700} fill={ink} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {`x = (2, 1), y = 1`}
            </text>
            <text x={X(2) + 12} y={Y(1) + 10} fontSize={12} fontWeight={700} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {`p = ${p.toFixed(3)}`}
            </text>
          </g>
        );
      })}
      <Arr x1={344} y1={150} x2={386} y2={150} color={colors.violet} marker={`${P}-violet`} width={2.2} />
      <text x={365} y={140} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.violet}>
        한 걸음
      </text>
      <text x={20} y={top + H + 18} fontSize={10.5} fill={inkSecondary}>
        가로: x₁ · 세로: x₂ · 점선: 축(0) · 화살표: 경계에 수직인 w 방향(2배로 그림)
      </text>
    </DiagramFrame>
  );
}

export function GiniSplit() {
  // 본문 예제: 부모(함 5, 안함 3) → Sunny(3, 1), Rainy(2, 2).
  const P = "gsp";
  const node = (x: number, y: number, title: string, yes: number, no: number, g: string, color: string) => {
    const w = 170;
    const total = yes + no;
    return (
      <g>
        <rect x={x} y={y} width={w} height={74} rx={10} fill={color} fillOpacity={0.08} stroke={color} strokeWidth={1.4} />
        <text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
          {title}
        </text>
        <rect x={x + 15} y={y + 28} width={(140 * yes) / total} height={14} fill={colors.blue} />
        <rect x={x + 15 + (140 * yes) / total} y={y + 28} width={(140 * no) / total} height={14} fill={colors.orange} />
        <text x={x + 15} y={y + 56} fontSize={10.5} fill={colors.blue} fontWeight={700}>
          {`함 ${yes}`}
        </text>
        <text x={x + 155} y={y + 56} textAnchor="end" fontSize={10.5} fill={colors.orange} fontWeight={700}>
          {`안함 ${no}`}
        </text>
        <text x={x + w / 2} y={y + 68} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
          {g}
        </text>
      </g>
    );
  };
  const G = { left: 500, top: 40, width: 190, height: 150 };
  const gx = linear(0, 1, G.left, G.left + G.width);
  const gy = linear(0, 0.55, G.top + G.height, G.top);
  const curve = sample((p) => 2 * p * (1 - p), 0, 1, 60).map(([p, v]) => [gx(p), gy(v)] as [number, number]);
  const marks = [
    { p: 0.5, v: 0.5, label: "Rainy 0.5", color: colors.orange, dx: -8, dy: -8, anchor: "end" as const },
    { p: 0.625, v: 0.469, label: "부모 0.469", color: inkSecondary, dx: 6, dy: -10, anchor: "start" as const },
    { p: 0.75, v: 0.375, label: "Sunny 0.375", color: colors.aqua, dx: 9, dy: 6, anchor: "start" as const },
  ];
  return (
    <DiagramFrame
      title="지니 불순도로 분할 고르기: 섞임이 얼마나 줄었나"
      caption="막대는 각 노드의 '함'(파랑)과 '안함'(주황) 비율이다. 부모의 지니 0.469가 분할 뒤 샘플 수로 가중평균한 0.4375로 줄었으므로 정보이득은 약 0.031이다. 오른쪽 곡선처럼 두 클래스가 반반일 때(0.5) 가장 섞여 있고, 한 클래스만 남으면(0 또는 1) 0이 된다. 트리는 이 감소량이 가장 큰 질문을 고른다."
      viewBox="0 0 720 280"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {node(130, 14, "전체 8개", 5, 3, "G = 1 − (5/8)² − (3/8)² ≈ 0.469", inkMuted)}
      <Arr x1={190} y1={90} x2={110} y2={140} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={240} y1={90} x2={320} y2={140} color={inkSecondary} marker={`${P}-ink`} />
      <text x={136} y={112} textAnchor="end" fontSize={11} fontWeight={700} fill={ink}>
        Outlook = Sunny
      </text>
      <text x={294} y={112} fontSize={11} fontWeight={700} fill={ink}>
        Rainy
      </text>
      {node(20, 144, "Sunny 4개", 3, 1, "G = 0.375", colors.aqua)}
      {node(240, 144, "Rainy 4개", 2, 2, "G = 0.5", colors.orange)}
      <text x={215} y={246} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        분할 후 가중평균 = 4/8 × 0.375 + 4/8 × 0.5 = 0.4375
      </text>
      <text x={215} y={266} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.violet}>
        정보이득 = 0.469 − 0.4375 ≈ 0.031
      </text>
      <line x1={440} y1={14} x2={440} y2={270} stroke="var(--border-hairline)" />
      <text x={G.left + G.width / 2} y={24} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink}>
        두 클래스의 지니: G = 2p(1 − p)
      </text>
      <Axes {...G} sx={gx} sy={gy} xTicks={[0, 0.5, 1]} yTicks={[0, 0.25, 0.5]} xLabel="'함'의 비율 p" />
      <path d={linePath(curve)} fill="none" stroke={colors.violet} strokeWidth={2.2} />
      {marks.map((m) => (
        <g key={m.label}>
          <circle cx={gx(m.p)} cy={gy(m.v)} r={4.5} fill={m.color} />
          <text x={gx(m.p) + m.dx} y={gy(m.v) + m.dy} textAnchor={m.anchor} fontSize={10} fontWeight={700} fill={m.color}>
            {m.label}
          </text>
        </g>
      ))}
      <text x={gx(0.5)} y={gy(0.05)} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        양 끝(한 클래스만) = 0
      </text>
    </DiagramFrame>
  );
}

export function BootstrapBagging() {
  // 원본 8개에서 중복을 허용해 8번씩 뽑는다. 안 뽑힌 샘플(OOB)은 그 트리의 검증용.
  const P = "bsb";
  const pal = [colors.blue, colors.orange, colors.aqua, colors.yellow, colors.magenta, colors.green, colors.violet, colors.red];
  const draws = [
    [2, 5, 5, 1, 7, 2, 4, 5],
    [8, 3, 3, 6, 1, 8, 2, 6],
    [4, 7, 1, 4, 6, 3, 7, 5],
  ];
  const ball = (x: number, y: number, n: number) => (
    <g key={`${x}-${y}`}>
      <circle cx={x} cy={y} r={11} fill={pal[n - 1]} fillOpacity={0.85} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
        {n}
      </text>
    </g>
  );
  const tree = (cx: number, cy: number) => (
    <g>
      <line x1={cx} y1={cy - 10} x2={cx - 12} y2={cy + 8} stroke={colors.green} strokeWidth={1.6} />
      <line x1={cx} y1={cy - 10} x2={cx + 12} y2={cy + 8} stroke={colors.green} strokeWidth={1.6} />
      <circle cx={cx} cy={cy - 10} r={5} fill={colors.green} />
      <circle cx={cx - 12} cy={cy + 8} r={4} fill={colors.green} />
      <circle cx={cx + 12} cy={cy + 8} r={4} fill={colors.green} />
    </g>
  );
  return (
    <DiagramFrame
      title="배깅: 부트스트랩 표본으로 트리를 따로 키워 합친다"
      caption="원본 8개에서 중복을 허용해 8번씩 뽑으면 어떤 샘플은 두세 번 들어가고 어떤 샘플은 빠진다(OOB). 트리마다 조금씩 다른 데이터를 보므로 예측의 흔들림(분산)이 평균·다수결 과정에서 상쇄된다. 랜덤 포레스트는 여기에 '분할마다 일부 특징만 후보로' 를 더해 트리끼리의 상관을 더 낮춘다."
      viewBox="0 0 720 290"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={20} y={40} fontSize={11.5} fontWeight={700} fill={ink}>
        원본 (n = 8)
      </text>
      {Array.from({ length: 8 }, (_, i) => ball(134 + i * 30, 36, i + 1))}
      {draws.map((d, r) => {
        const y = 104 + r * 56;
        const used = new Set(d);
        const oob = Array.from({ length: 8 }, (_, i) => i + 1).filter((n) => !used.has(n));
        return (
          <g key={r}>
            <text x={20} y={y + 4} fontSize={11} fontWeight={700} fill={ink}>
              {`트리 ${r + 1}용 표본`}
            </text>
            {d.map((n, i) => ball(134 + i * 30, y, n))}
            <text x={378} y={y - 2} fontSize={10.5} fill={inkSecondary}>
              안 뽑힘(OOB)
            </text>
            <text x={378} y={y + 14} fontSize={11.5} fontWeight={700} fill={inkSecondary} fontFamily={mono}>
              {oob.join(", ")}
            </text>
            <Arr x1={466} y1={y} x2={500} y2={y} color={inkSecondary} marker={`${P}-ink`} />
            {tree(522, y)}
            <text x={540} y={y + 4} fontSize={11} fill={ink}>
              {`트리 ${r + 1}`}
            </text>
            <Arr x1={584} y1={y} x2={608} y2={y + (1 - r) * 22} color={inkSecondary} marker={`${P}-ink`} />
          </g>
        );
      })}
      <Tag x={612} y={110} w={96} h={100} lines={["결합", "분류: 다수결", "회귀: 평균"]} color={colors.violet} tint={0.12} size={12.5} />
      <Arr x1={128} y1={50} x2={128} y2={88} color={inkSecondary} marker={`${P}-ink`} />
      <text x={134} y={74} fontSize={10.5} fill={inkSecondary}>
        중복 허용해 8번 뽑기
      </text>
      <text x={20} y={276} fontSize={11} fill={inkSecondary}>
        한 샘플이 한 번도 안 뽑힐 확률 (1 − 1/n)ⁿ ≈ 1/e ≈ 0.368 → 표본마다 원본의 약 63%만 들어간다
      </text>
    </DiagramFrame>
  );
}

export function BoostingResiduals() {
  // 본문 예제: y = [10, 20, 30], F₀ = 20, 잔차 [−10, 0, 10], η = 0.1 → F₁ = [19, 20, 21]. 잔차를 매번 정확히 맞힌다면 남은 잔차가 0.9배씩 준다.
  const P = "bor";
  const ys = [10, 20, 30];
  const names = ["A", "B", "C"];
  const L = { left: 60, top: 36, width: 230, height: 190 };
  const ly = linear(5, 35, L.top + L.height, L.top);
  const lx = (i: number) => L.left + 40 + i * 75;
  const R = { left: 420, top: 36, width: 270, height: 190 };
  const rx = linear(0, 40, R.left, R.left + R.width);
  const ry = linear(5, 35, R.top + R.height, R.top);
  const cols = [colors.blue, inkSecondary, colors.orange];
  return (
    <DiagramFrame
      title="부스팅: 앞 모델이 남긴 잔차를 다음 모델이 조금씩 메운다"
      caption="왼쪽: 처음에는 평균 20을 예측(F₀)하고, 정답과의 차이(잔차 −10, 0, +10, 주황 화살표)를 새 트리 h₁이 학습한다. 학습률 0.1만큼만 더하면 F₁ = [19, 20, 21]로 한 걸음 다가간다. 오른쪽: 트리를 계속 더하면 매번 남은 잔차의 10%씩 줄어 예측이 정답(점선)에 수렴한다. 배깅이 독립적인 모델을 병렬로 합친다면, 부스팅은 이렇게 순차적으로 오차를 보완한다."
      viewBox="0 0 720 280"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ orange: colors.orange, blue: colors.blue }} />
      <text x={L.left + L.width / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ① 첫 번째 보완 (η = 0.1)
      </text>
      <Axes {...L} sx={linear(0, 1, L.left, L.left + L.width)} sy={ly} yTicks={[10, 20, 30]} grid={false} yLabel="값" />
      <line x1={L.left} y1={ly(20)} x2={L.left + L.width} y2={ly(20)} stroke={inkMuted} strokeDasharray="5 4" />
      <text x={L.left + 4} y={ly(20) - 6} fontSize={10.5} fill={inkSecondary}>
        F₀ = 평균 20
      </text>
      {ys.map((y, i) => (
        <g key={i}>
          {y !== 20 && <Arr x1={lx(i) - 10} y1={ly(20)} x2={lx(i) - 10} y2={ly(y) + (y > 20 ? 8 : -8)} color={colors.orange} marker={`${P}-orange`} width={1.8} />}
          <text x={lx(i) - 16} y={(ly(20) + ly(y)) / 2 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.orange}>
            {y === 20 ? "" : y > 20 ? "+10" : "−10"}
          </text>
          <circle cx={lx(i)} cy={ly(y)} r={5.5} fill={ink} />
          <text x={y === 20 ? lx(i) : lx(i) + 9} y={y === 20 ? ly(y) - 12 : ly(y) + 4} textAnchor={y === 20 ? "middle" : "start"} fontSize={10.5} fill={ink}>
            {`정답 ${y}`}
          </text>
          <rect x={lx(i) + 6} y={ly(20 + (y - 20) * 0.1) - 3} width={22} height={6} rx={3} fill={colors.blue} />
          <text x={lx(i)} y={L.top + L.height + 16} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
            {names[i]}
          </text>
        </g>
      ))}
      <text x={L.left + L.width / 2} y={262} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
        F₁ = F₀ + 0.1 × h₁ = [19, 20, 21] (파란 막대)
      </text>

      <text x={R.left + R.width / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        ② 트리를 더할수록
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 10, 20, 30, 40]} yTicks={[10, 20, 30]} xLabel="더한 트리 수 m" yLabel="예측 Fₘ" />
      {ys.map((y, i) => {
        const pts = Array.from({ length: 41 }, (_, m) => [rx(m), ry(y + (20 - y) * 0.9 ** m)] as [number, number]);
        return (
          <g key={i}>
            <line x1={R.left} y1={ry(y)} x2={R.left + R.width} y2={ry(y)} stroke={cols[i]} strokeDasharray="4 4" strokeOpacity={0.6} />
            <path d={linePath(pts)} fill="none" stroke={cols[i]} strokeWidth={2.2} />
            <text x={R.left + R.width + 4} y={ry(y) + 4} fontSize={10.5} fontWeight={700} fill={cols[i]}>
              {names[i]}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function BiasVarianceStrips() {
  // 본문 예제: 참값 10, 서로 다른 훈련 데이터 5세트로 학습한 세 모델의 예측.
  const P = "bvs";
  const sx = linear(5, 16, 170, 560);
  const models = [
    { y: 64, name: "A · 적당한 모델", sub: "편향↓ 분산↓", preds: [9.8, 10.3, 9.9, 10.1, 9.9], mean: 10.0, b2: "bias² = 0", v: "분산 ≈ 0.032", color: colors.green },
    { y: 134, name: "B · 복잡한 모델", sub: "과적합: 분산↑", preds: [6, 14, 8, 15, 7], mean: 10.0, b2: "bias² = 0", v: "분산 = 14.0", color: colors.orange },
    { y: 204, name: "C · 단순한 모델", sub: "과소적합: 편향↑", preds: [7.1, 7.3, 6.9, 7.2, 7.0], mean: 7.1, b2: "bias² = 8.41", v: "분산 ≈ 0.02", color: colors.blue },
  ];
  return (
    <DiagramFrame
      title="편향과 분산을 눈으로: 같은 모델을 다섯 번 학습시키면"
      caption="점 하나가 서로 다른 훈련 데이터로 학습한 모델 하나의 예측이고, 세모가 그 평균이다. A는 참값(초록 점선) 근처에 모여 있고, B는 평균은 참값과 같지만 낱개 예측이 6~15로 흩어진다(분산). C는 늘 일관되지만 평균 7.1이 참값에서 2.9만큼 벗어나 있다(편향). B와 C는 오차 크기가 비슷해도 원인이 반대라 처방도 반대다."
      viewBox="0 0 720 266"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ blue: colors.blue }} />
      <line x1={sx(10)} y1={28} x2={sx(10)} y2={226} stroke={colors.green} strokeWidth={1.6} strokeDasharray="5 4" />
      <text x={sx(10)} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.green}>
        참값 10
      </text>
      {models.map((m) => {
        const seen: Record<string, number> = {};
        return (
          <g key={m.name}>
            <text x={14} y={m.y - 2} fontSize={12} fontWeight={700} fill={ink}>
              {m.name}
            </text>
            <text x={14} y={m.y + 14} fontSize={10.5} fill={inkSecondary}>
              {m.sub}
            </text>
            <line x1={sx(5)} y1={m.y + 8} x2={sx(16)} y2={m.y + 8} stroke={inkMuted} />
            {[5, 7.5, 10, 12.5, 15].map((t) => (
              <line key={t} x1={sx(t)} y1={m.y + 5} x2={sx(t)} y2={m.y + 11} stroke={inkMuted} />
            ))}
            {m.preds.map((v, i) => {
              const key = v.toFixed(1);
              seen[key] = (seen[key] ?? 0) + 1;
              return <circle key={i} cx={sx(v)} cy={m.y - (seen[key] - 1) * 10} r={5} fill={m.color} fillOpacity={0.85} />;
            })}
            <path d={`M${sx(m.mean)},${m.y + 12} l-6,10 l12,0 Z`} fill={ink} />
            <text x={580} y={m.y} fontSize={11} fontWeight={700} fill={ink}>
              {m.b2}
            </text>
            <text x={580} y={m.y + 16} fontSize={11} fontWeight={700} fill={m.color}>
              {m.v}
            </text>
          </g>
        );
      })}
      <line x1={sx(6)} y1={models[1].y + 28} x2={sx(15)} y2={models[1].y + 28} stroke={colors.orange} strokeWidth={1.4} />
      <text x={sx(10.5)} y={models[1].y + 42} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.orange}>
        6 ~ 15로 흩어짐
      </text>
      <Arr x1={sx(7.1) + 6} y1={models[2].y + 30} x2={sx(10) - 2} y2={models[2].y + 30} color={colors.blue} marker={`${P}-blue`} />
      <text x={sx(10) + 6} y={models[2].y + 34} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        평균이 2.9만큼 빗나감 (편향)
      </text>
      {[5, 10, 15].map((t) => (
        <text key={t} x={sx(t)} y={models[2].y + 54} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {t}
        </text>
      ))}
    </DiagramFrame>
  );
}

export function PolyFitTriptych() {
  // sin(2πx) + 잡음(σ = 0.2) 30개 중 18개로 학습, 12개로 검증. 차수 1·4·12 다항식을 최소제곱으로 맞춘다(체비쇼프 기저로 계산해 수치적으로 안정).
  // 시드 40: 훈련 오차는 차수와 함께 줄고(0.19 → 0.04 → 0.02) 검증 오차는 U자(0.34 → 0.08 → 0.84)를 그린다.
  const rand = seeded(40);
  const all = Array.from({ length: 30 }, () => {
    const x = rand();
    return { x, y: Math.sin(2 * Math.PI * x) + 0.2 * gaussian(rand) };
  });
  const train = all.slice(0, 18);
  const val = all.slice(18);
  const cheb = (t: number, d: number) => {
    const T = [1, t];
    for (let k = 2; k <= d; k++) T.push(2 * t * T[k - 1] - T[k - 2]);
    return T.slice(0, d + 1);
  };
  const fit = (d: number) => {
    const rows = train.map((p) => cheb(2 * p.x - 1, d));
    const AtA = Array.from({ length: d + 1 }, (_, i) => Array.from({ length: d + 1 }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-12 : 0)));
    const Aty = Array.from({ length: d + 1 }, (_, i) => rows.reduce((s, r, k) => s + r[i] * train[k].y, 0));
    const c = solveLinear(AtA, Aty);
    return (x: number) => cheb(2 * x - 1, d).reduce((s, v, i) => s + v * c[i], 0);
  };
  const mse = (f: (x: number) => number, pts: { x: number; y: number }[]) => pts.reduce((s, p) => s + (f(p.x) - p.y) ** 2, 0) / pts.length;
  const panels = [
    { d: 1, title: "차수 1: 과소적합", color: colors.blue },
    { d: 4, title: "차수 4: 적당함", color: colors.green },
    { d: 12, title: "차수 12: 과적합", color: colors.red },
  ];
  const pw = 210;
  const ph = 150;
  const top = 40;
  return (
    <DiagramFrame
      title="다항식 차수를 올리면: 과소적합 → 적당함 → 과적합"
      caption="회색 점선이 데이터를 만든 참 함수 sin(2πx), 검은 점이 학습에 쓴 18개, 주황 테두리 점이 검증용 12개다. 차수 1은 곡선을 따라가지 못해 훈련·검증 오차가 모두 크고(편향), 차수 12는 훈련 점을 거의 지나가지만 점 사이에서 크게 출렁여 검증 오차가 커진다(분산). 아래 숫자는 각 그림의 실제 평균제곱오차다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      {panels.map((p, i) => {
        const x0 = 14 + i * 238;
        const sx = linear(0, 1, x0, x0 + pw);
        const sy = linear(-1.8, 1.8, top + ph, top);
        const f = fit(p.d);
        const curve = sample(f, 0, 1, 200).map(([x, y]) => [sx(x), sy(Math.max(-2.4, Math.min(2.4, y)))] as [number, number]);
        const truth = sample((x) => Math.sin(2 * Math.PI * x), 0, 1, 100).map(([x, y]) => [sx(x), sy(y)] as [number, number]);
        return (
          <g key={p.d}>
            <defs>
              <clipPath id={`pft-clip-${p.d}`}>
                <rect x={x0} y={top} width={pw} height={ph} />
              </clipPath>
            </defs>
            <text x={x0 + pw / 2} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <rect x={x0} y={top} width={pw} height={ph} fill="none" stroke="var(--border-hairline)" />
            <g clipPath={`url(#pft-clip-${p.d})`}>
              <path d={linePath(truth)} fill="none" stroke={inkMuted} strokeWidth={1.4} strokeDasharray="4 4" />
              <path d={linePath(curve)} fill="none" stroke={p.color} strokeWidth={2.4} />
              {train.map((q, k) => (
                <circle key={`t${k}`} cx={sx(q.x)} cy={sy(q.y)} r={3.4} fill={ink} />
              ))}
              {val.map((q, k) => (
                <circle key={`v${k}`} cx={sx(q.x)} cy={sy(q.y)} r={3.6} fill="var(--surface-card)" stroke={colors.orange} strokeWidth={1.6} />
              ))}
            </g>
            <text x={x0 + pw / 2} y={top + ph + 22} textAnchor="middle" fontSize={11} fill={ink}>
              {`훈련 MSE ${mse(f, train).toFixed(3)}`}
            </text>
            <text x={x0 + pw / 2} y={top + ph + 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.orange}>
              {`검증 MSE ${mse(f, val).toFixed(3)}`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function L1L2Geometry() {
  // 손실 등고선(타원)이 제약 영역(L2: 원, L1: 마름모)에 처음 닿는 점이 정규화된 해다. 마름모는 꼭짓점이 뾰족해 축 위(한 가중치 = 0)에서 먼저 닿기 쉽다.
  // 이 설정에서 L2의 접점은 약 (0.35, 0.94), L1의 접점은 꼭짓점 (0, 1)이다(아래에서 경계를 촘촘히 훑어 계산).
  const c: [number, number] = [1.1, 2.4];
  const phi = (-15 * Math.PI) / 180;
  const a1 = 1;
  const a2 = 2.2;
  const R = [
    [Math.cos(phi), -Math.sin(phi)],
    [Math.sin(phi), Math.cos(phi)],
  ];
  const Q = (w: [number, number]) => {
    const d = [w[0] - c[0], w[1] - c[1]];
    const u = R[0][0] * d[0] + R[1][0] * d[1];
    const v = R[0][1] * d[0] + R[1][1] * d[1];
    return a1 * u * u + a2 * v * v;
  };
  const best = (pts: [number, number][]) => pts.reduce((b, p) => (Q(p) < Q(b) ? p : b));
  const circle = Array.from({ length: 3600 }, (_, i) => [Math.cos((i / 3600) * 2 * Math.PI), Math.sin((i / 3600) * 2 * Math.PI)] as [number, number]);
  const diamond = Array.from({ length: 4000 }, (_, i) => {
    const t = (i / 4000) * 4;
    const seg = Math.floor(t);
    const f = t - seg;
    const corners: [number, number][] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ];
    return [corners[seg][0] + (corners[seg + 1][0] - corners[seg][0]) * f, corners[seg][1] + (corners[seg + 1][1] - corners[seg][1]) * f] as [number, number];
  });
  const sol2 = best(circle);
  const sol1 = best(diamond);
  const k = 40;
  const panels = [
    { x0: 14, title: "L2 (Ridge): 원 안에서", sol: sol2, color: colors.blue, note: `접점 w = (${sol2[0].toFixed(2)}, ${sol2[1].toFixed(2)}): 작아지지만 0은 아니다` },
    { x0: 372, title: "L1 (Lasso): 마름모 안에서", sol: sol1, color: colors.orange, note: `접점 w = (${Math.abs(sol1[0]) < 0.005 ? "0" : sol1[0].toFixed(2)}, ${sol1[1].toFixed(2)}): w₁이 정확히 0 → 희소` },
  ];
  return (
    <DiagramFrame
      title="L1과 L2 정규화의 기하학: 왜 L1은 가중치를 0으로 만드는가"
      caption="파란 타원은 원래 손실의 등고선이고 가운데 점이 정규화 없는 해 ŵ다. 정규화는 '가중치 크기 ≤ 일정 값'이라는 영역 안에서 손실이 가장 작은 점을 찾는 것과 같아서, 등고선이 영역에 처음 닿는 점이 답이 된다. 원(L2)은 매끄러워 대개 축이 아닌 곳에서 닿지만, 마름모(L1)는 꼭짓점이 튀어나와 축 위에서 먼저 닿기 쉽다. 축 위라는 것은 한 가중치가 정확히 0이라는 뜻이다."
      viewBox="0 0 720 300"
      minWidth={560}
    >
      {panels.map((p) => {
        const ox = p.x0 + 120;
        const oy = 222;
        const X = (v: number) => ox + v * k;
        const Y = (v: number) => oy - v * k;
        const qStar = Q(p.sol);
        const levels = [qStar * 0.12, qStar * 0.45, qStar];
        return (
          <g key={p.title}>
            <text x={p.x0 + 167} y={20} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <line x1={X(-1.6)} y1={oy} x2={X(3.3)} y2={oy} stroke={inkMuted} />
            <line x1={ox} y1={Y(-1.4)} x2={ox} y2={Y(3.6)} stroke={inkMuted} />
            <text x={X(3.3)} y={oy + 16} textAnchor="end" fontSize={11} fill={inkSecondary}>
              w₁
            </text>
            <text x={ox + 8} y={Y(3.4)} fontSize={11} fill={inkSecondary}>
              w₂
            </text>
            {p.title.startsWith("L2") ? (
              <circle cx={ox} cy={oy} r={k} fill={p.color} fillOpacity={0.16} stroke={p.color} strokeWidth={1.8} />
            ) : (
              <polygon points={`${X(1)},${oy} ${ox},${Y(1)} ${X(-1)},${oy} ${ox},${Y(-1)}`} fill={p.color} fillOpacity={0.16} stroke={p.color} strokeWidth={1.8} />
            )}
            {levels.map((lv, i) => (
              <ellipse
                key={i}
                cx={X(c[0])}
                cy={Y(c[1])}
                rx={Math.sqrt(lv / a1) * k}
                ry={Math.sqrt(lv / a2) * k}
                transform={`rotate(${(-phi * 180) / Math.PI} ${X(c[0])} ${Y(c[1])})`}
                fill="none"
                stroke={colors.blue}
                strokeWidth={i === 2 ? 1.8 : 1}
                strokeOpacity={i === 2 ? 1 : 0.5}
                strokeDasharray={i === 2 ? undefined : "4 3"}
              />
            ))}
            <circle cx={X(c[0])} cy={Y(c[1])} r={4} fill={colors.blue} />
            <text x={X(c[0]) + 7} y={Y(c[1]) - 6} fontSize={11} fontWeight={700} fill={colors.blue}>
              ŵ (정규화 없음)
            </text>
            <circle cx={X(p.sol[0])} cy={Y(p.sol[1])} r={6} fill={colors.red} stroke="var(--surface-card)" strokeWidth={1.6} />
            <text x={X(p.sol[0]) + 9} y={Y(p.sol[1]) + 16} fontSize={11} fontWeight={700} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              첫 접점
            </text>
            <text x={p.x0 + 167} y={286} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
              {p.note}
            </text>
          </g>
        );
      })}
      <line x1={360} y1={14} x2={360} y2={290} stroke="var(--border-hairline)" />
    </DiagramFrame>
  );
}

export function LeakageScaler() {
  const P = "lks";
  return (
    <DiagramFrame
      title="데이터 누수: 스케일러를 어디서 fit하느냐"
      caption="위: 전체 데이터로 평균·표준편차를 구한 뒤 나누면 테스트셋의 정보(빨강)가 훈련 과정에 섞여, 운영 환경에서는 재현되지 않는 부풀려진 점수가 나온다. 아래: 먼저 나누고 훈련 부분으로만 fit한 뒤, 그 통계로 테스트를 transform만 한다. 교차검증에서는 fold마다 이 일을 반복해야 하므로 make_pipeline(StandardScaler(), 모델)으로 묶어 cross_val_score에 넘긴다."
      viewBox="0 0 720 262"
      minWidth={560}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, red: colors.red, green: colors.green }} />
      <text x={14} y={24} fontSize={12.5} fontWeight={700} fill={colors.red}>
        ✗ 누수가 생기는 순서
      </text>
      <Tag x={14} y={36} w={150} h={50} lines={["전체 데이터", "훈련 + 테스트"]} color={inkMuted} tint={0.08} size={12} />
      <Arr x1={166} y1={61} x2={194} y2={61} color={colors.red} marker={`${P}-red`} />
      <Tag x={198} y={36} w={170} h={50} lines={["scaler.fit(전체)", "평균·표준편차에 테스트가 섞임"]} color={colors.red} tint={0.12} size={11.5} />
      <Arr x1={370} y1={61} x2={398} y2={61} color={colors.red} marker={`${P}-red`} />
      <Tag x={402} y={36} w={120} h={50} lines={["그다음 분할", "학습 → 평가"]} color={inkMuted} tint={0.08} size={12} />
      <Arr x1={524} y1={61} x2={552} y2={61} color={colors.red} marker={`${P}-red`} />
      <Tag x={556} y={36} w={150} h={50} lines={["부풀려진 점수", "운영에서 재현 안 됨"]} color={colors.red} tint={0.18} size={12} />

      <line x1={14} y1={106} x2={706} y2={106} stroke="var(--border-hairline)" />
      <text x={14} y={128} fontSize={12.5} fontWeight={700} fill={colors.green}>
        ✓ 올바른 순서
      </text>
      <Tag x={14} y={150} w={110} h={86} lines={["먼저 분할", "훈련 / 테스트"]} color={inkMuted} tint={0.08} size={12} />
      <Arr x1={126} y1={170} x2={168} y2={164} color={colors.green} marker={`${P}-green`} />
      <Arr x1={126} y1={216} x2={168} y2={222} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={172} y={142} w={170} h={44} lines={["훈련: scaler.fit", "훈련의 평균·표준편차만 기억"]} color={colors.green} tint={0.14} size={11.5} />
      <Tag x={172} y={200} w={170} h={44} lines={["테스트: transform만", "훈련 통계로 변환"]} color={inkMuted} tint={0.08} size={11.5} />
      <Arr x1={258} y1={188} x2={258} y2={198} color={colors.green} marker={`${P}-green`} />
      <Arr x1={344} y1={164} x2={386} y2={164} color={colors.green} marker={`${P}-green`} />
      <Arr x1={344} y1={222} x2={386} y2={222} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={390} y={142} w={140} h={44} lines={["model.fit", "훈련으로 학습"]} color={colors.violet} tint={0.1} size={12} />
      <Tag x={390} y={200} w={140} h={44} lines={["model.score", "테스트로 한 번 평가"]} color={colors.violet} tint={0.1} size={12} />
      <Arr x1={532} y1={222} x2={552} y2={222} color={colors.green} marker={`${P}-green`} />
      <Tag x={556} y={196} w={150} h={52} lines={["정직한 점수", "새 데이터 성능의 추정"]} color={colors.green} tint={0.18} size={12} />
      <text x={460} y={134} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        교차검증: fold마다 반복 → make_pipeline
      </text>
    </DiagramFrame>
  );
}

export function SpamWaffle() {
  // 본문 예제: 메일 100통 — TP 20, FN 10 (실제 스팸 30), FP 5, TN 65 (실제 정상 70).
  const cs = 22;
  const gap = 3;
  const left = { x: 40, y: 56, cols: 5 };
  const right = { x: 220, y: 56, cols: 10 };
  const cell = (x: number, y: number, kind: "TP" | "FN" | "FP" | "TN", key: string) => {
    const style = {
      TP: { fill: colors.blue, op: 0.9, stroke: colors.blue },
      FN: { fill: colors.blue, op: 0.12, stroke: colors.blue },
      FP: { fill: colors.orange, op: 0.9, stroke: colors.orange },
      TN: { fill: inkMuted, op: 0.12, stroke: "var(--border-strong)" },
    }[kind];
    return <rect key={key} x={x} y={y} width={cs} height={cs} rx={4} fill={style.fill} fillOpacity={style.op} stroke={style.stroke} strokeWidth={1} />;
  };
  const spam = Array.from({ length: 30 }, (_, i) => {
    const r = Math.floor(i / left.cols);
    const c = i % left.cols;
    return cell(left.x + c * (cs + gap), left.y + r * (cs + gap), i < 20 ? "TP" : "FN", `s${i}`);
  });
  const ham = Array.from({ length: 70 }, (_, i) => {
    const r = Math.floor(i / right.cols);
    const c = i % right.cols;
    return cell(right.x + c * (cs + gap), right.y + r * (cs + gap), i < 5 ? "FP" : "TN", `h${i}`);
  });
  const legend = [
    { k: "TP" as const, t: "TP 20: 스팸을 스팸으로" },
    { k: "FN" as const, t: "FN 10: 놓친 스팸" },
    { k: "FP" as const, t: "FP 5: 억울한 정상 메일" },
    { k: "TN" as const, t: "TN 65: 정상을 정상으로" },
  ];
  return (
    <DiagramFrame
      title="메일 100통으로 보는 Precision과 Recall"
      caption="왼쪽 30칸이 실제 스팸, 오른쪽 70칸이 실제 정상 메일이다. 보라 점선 안이 모델이 '스팸'이라고 판정한 25통이다. Precision은 점선 안에서 진짜 스팸(진한 파랑)의 비율 20/25이고, Recall은 실제 스팸 30통 가운데 점선 안에 들어온 비율 20/30이다. 정확도 85%만 보면 연한 파랑 10통(놓친 스팸)이 보이지 않는다."
      viewBox="0 0 720 270"
      minWidth={560}
    >
      <text x={left.x + (5 * (cs + gap)) / 2} y={44} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.blue}>
        실제 스팸 30통
      </text>
      <text x={right.x + (10 * (cs + gap)) / 2} y={44} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={inkSecondary}>
        실제 정상 70통
      </text>
      {spam}
      {ham}
      <rect x={left.x - 4} y={left.y - 4} width={5 * (cs + gap) + 5} height={4 * (cs + gap) + 5} rx={6} fill="none" stroke={colors.violet} strokeWidth={2.2} strokeDasharray="6 4" />
      <rect x={right.x - 4} y={right.y - 4} width={5 * (cs + gap) + 5} height={cs + gap + 5} rx={6} fill="none" stroke={colors.violet} strokeWidth={2.2} strokeDasharray="6 4" />
      <text x={40} y={16} fontSize={11.5} fontWeight={700} fill={colors.violet}>
        {"보라 점선 = 모델이 '스팸'이라 판정한 25통"}
      </text>
      {legend.map((l, i) => (
        <g key={l.k}>
          {cell(500, 50 + i * 26, l.k, `lg${i}`)}
          <text x={530} y={66 + i * 26} fontSize={11} fill={ink}>
            {l.t}
          </text>
        </g>
      ))}
      <text x={500} y={176} fontSize={12} fontWeight={700} fill={ink}>
        Precision = 20 / (20 + 5) = 80%
      </text>
      <text x={500} y={194} fontSize={10.5} fill={inkSecondary}>
        스팸이라 판정한 것 중 진짜 스팸
      </text>
      <text x={500} y={218} fontSize={12} fontWeight={700} fill={ink}>
        Recall = 20 / (20 + 10) ≈ 66.7%
      </text>
      <text x={500} y={236} fontSize={10.5} fill={inkSecondary}>
        실제 스팸 중 잡아낸 것
      </text>
      <text x={500} y={258} fontSize={11} fontWeight={700} fill={inkSecondary}>
        Accuracy = (20 + 65) / 100 = 85%
      </text>
    </DiagramFrame>
  );
}

export function RocFiveSamples() {
  // 본문 예제: P1 0.9, N1 0.8, P2 0.6, N2 0.5, N3 0.2.
  const A = { left: 66, top: 28, width: 210, height: 210 };
  const sx = linear(0, 1, A.left, A.left + A.width);
  const sy = linear(0, 1, A.top + A.height, A.top);
  const steps: [number, number][] = [
    [0, 0],
    [0, 0.5],
    [1 / 3, 0.5],
    [1 / 3, 1],
    [2 / 3, 1],
    [1, 1],
  ];
  const labels = [
    { i: 1, t: "t ≥ 0.85" },
    { i: 2, t: "t ≥ 0.70" },
    { i: 3, t: "t ≥ 0.55" },
    { i: 4, t: "t ≥ 0.30" },
  ];
  const area = `M${sx(0)},${sy(0)} ${steps.map(([x, y]) => `L${sx(x)},${sy(y)}`).join(" ")} L${sx(1)},${sy(0)} Z`;
  const pos = [
    { n: "P1", s: 0.9 },
    { n: "P2", s: 0.6 },
  ];
  const neg = [
    { n: "N1", s: 0.8 },
    { n: "N2", s: 0.5 },
    { n: "N3", s: 0.2 },
  ];
  const gx = 470;
  const gy = 86;
  const cw = 70;
  const ch = 50;
  return (
    <DiagramFrame
      title="샘플 5개로 그린 ROC 곡선과 AUC = 5/6"
      caption="왼쪽: 임계값 t를 높은 점수부터 낮추며 (FPR, TPR) 점을 이으면 계단 모양 ROC 곡선이 되고, 색칠한 넓이가 AUC ≈ 0.833이다. 오른쪽: 양성 하나와 음성 하나로 만들 수 있는 6쌍 가운데 양성 점수가 더 높은 쌍(✓)이 5개다. 5/6 ≈ 0.833으로 넓이와 정확히 같다. 이것이 AUC의 확률적 해석이다."
      viewBox="0 0 720 286"
      minWidth={560}
    >
      <Axes {...A} sx={sx} sy={sy} xTicks={[0, 1 / 3, 2 / 3, 1]} yTicks={[0, 0.5, 1]} fmtX={(v) => (v === 0 ? "0" : v === 1 ? "1" : v < 0.5 ? "1/3" : "2/3")} xLabel="FPR" yLabel="TPR" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="4 4" />
      <path d={area} fill={colors.violet} fillOpacity={0.16} />
      <path d={linePath(steps.map(([x, y]) => [sx(x), sy(y)]))} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      {steps.map(([x, y], i) => (
        <circle key={i} cx={sx(x)} cy={sy(y)} r={4} fill={colors.violet} />
      ))}
      {labels.map((l) => (
        <text key={l.t} x={sx(steps[l.i][0]) + 6} y={sy(steps[l.i][1]) + (l.i === 1 || l.i === 3 ? 14 : -6)} fontSize={10} fill={inkSecondary}>
          {l.t}
        </text>
      ))}
      <text x={sx(0.62)} y={sy(0.3)} textAnchor="middle" fontSize={13} fontWeight={700} fill={colors.violet}>
        AUC ≈ 0.833
      </text>

      <text x={gx + (3 * cw) / 2} y={30} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
        양성 점수 &gt; 음성 점수인가?
      </text>
      {neg.map((n, j) => (
        <text key={n.n} x={gx + j * cw + cw / 2} y={gy - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.blue}>
          {`${n.n} (${n.s})`}
        </text>
      ))}
      {pos.map((p, i) => (
        <g key={p.n}>
          <text x={gx - 10} y={gy + i * ch + ch / 2 + 4} textAnchor="end" fontSize={11} fontWeight={700} fill={colors.orange}>
            {`${p.n} (${p.s})`}
          </text>
          {neg.map((n, j) => {
            const win = p.s > n.s;
            return (
              <g key={n.n}>
                <rect x={gx + j * cw} y={gy + i * ch} width={cw - 4} height={ch - 4} rx={6} fill={win ? colors.green : colors.red} fillOpacity={0.16} stroke={win ? colors.green : colors.red} />
                <text x={gx + j * cw + (cw - 4) / 2} y={gy + i * ch + ch / 2 + 4} textAnchor="middle" fontSize={16} fontWeight={700} fill={win ? colors.green : colors.red}>
                  {win ? "✓" : "✗"}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      <text x={gx + (3 * cw) / 2} y={gy + 2 * ch + 30} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        ✓ 5개 / 전체 6쌍 = 0.833
      </text>
      <text x={gx + (3 * cw) / 2} y={gy + 2 * ch + 50} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        P2(0.6)는 N1(0.8)에만 진다
      </text>
    </DiagramFrame>
  );
}

export function R2Squares() {
  // 본문 예제: y = [3, 5, 7, 9], ŷ = [2.5, 5.5, 6, 10], 평균 6. 오차 제곱을 실제 정사각형 넓이로 그린다.
  const y = [3, 5, 7, 9];
  const yh = [2.5, 5.5, 6, 10];
  const u = 15.5;
  const panels = [
    { x0: 30, title: "우리 모델: 오차 제곱의 합 = 2.5", pred: yh, color: colors.blue },
    { x0: 388, title: "베이스라인(항상 평균 6): 합 = 20", pred: [6, 6, 6, 6], color: colors.orange },
  ];
  const xs = [1, 4.6, 8.2, 11.8];
  const base = 232;
  return (
    <DiagramFrame
      title="R²를 넓이로 보기: 모델의 오차 넓이 ÷ 베이스라인의 오차 넓이"
      caption="점은 실제값 y, 가로 막대는 예측값이다. 각 정사각형의 넓이가 그 샘플의 오차 제곱이다. 모델의 정사각형 넓이 합(2.5)은 '항상 평균만 예측하는' 베이스라인의 넓이 합(20)의 12.5%이므로 R² = 1 − 2.5/20 = 0.875다. 모델의 넓이가 베이스라인보다 크면 R²는 음수가 된다."
      viewBox="0 0 720 286"
      minWidth={560}
    >
      {panels.map((p) => {
        const X = (v: number) => p.x0 + v * u;
        const Y = (v: number) => base - v * u;
        return (
          <g key={p.title}>
            <text x={p.x0 + 140} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={p.color}>
              {p.title}
            </text>
            <line x1={p.x0} y1={base} x2={p.x0 + 280} y2={base} stroke={inkMuted} />
            {[0, 2, 4, 6, 8, 10, 12].map((t) => (
              <g key={t}>
                <line x1={p.x0} y1={Y(t)} x2={p.x0 + 280} y2={Y(t)} stroke="var(--border-hairline)" />
                <text x={p.x0 - 6} y={Y(t) + 3.5} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
                  {t}
                </text>
              </g>
            ))}
            {p.title.startsWith("베이스라인") && <line x1={p.x0} y1={Y(6)} x2={p.x0 + 280} y2={Y(6)} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="6 4" />}
            {y.map((v, i) => {
              const r = Math.abs(v - p.pred[i]);
              const topV = Math.max(v, p.pred[i]);
              return (
                <g key={i}>
                  <rect x={X(xs[i])} y={Y(topV)} width={r * u} height={r * u} fill={p.color} fillOpacity={0.22} stroke={p.color} />
                  <line x1={X(xs[i]) - 9} y1={Y(p.pred[i])} x2={X(xs[i]) + 9} y2={Y(p.pred[i])} stroke={p.color} strokeWidth={3} />
                  <circle cx={X(xs[i])} cy={Y(v)} r={4.5} fill={ink} />
                  <text x={X(xs[i]) + (r * u) / 2} y={Y(topV) + (r * u) / 2 + 4} textAnchor="middle" fontSize={r >= 1 ? 11 : 9} fontWeight={700} fill={p.color}>
                    {r * r >= 1 ? String(r * r) : ""}
                  </text>
                  {r * r < 1 && (
                    <text x={X(xs[i]) + r * u + 3} y={Y(topV) + 2} fontSize={9.5} fontWeight={700} fill={p.color}>
                      {String(r * r)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <text x={360} y={262} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
        R² = 1 − (모델 넓이 2.5) / (베이스라인 넓이 20) = 1 − 0.125 = 0.875
      </text>
      <line x1={360} y1={14} x2={360} y2={240} stroke="var(--border-hairline)" />
    </DiagramFrame>
  );
}
