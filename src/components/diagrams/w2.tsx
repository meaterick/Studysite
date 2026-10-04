import DiagramFrame, { colors, ink, inkSecondary, inkMuted, gridline, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Label } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, pow10Label, linePath, sample, seeded, gaussian, mono, solveLinear, starPath, normCdf } from "./chart";

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

/** 클래스 0은 파란 원, 클래스 1은 주황 사각형 */
const classMark = (x: number, y: number, c: number, r = 5.5) =>
  c === 0 ? (
    <circle cx={x} cy={y} r={r} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1} />
  ) : (
    <rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={1} />
  );

export function KnnVote() {
  // 본문 예제: 클래스 0 A(1,1)·B(2,1)·C(1,2), 클래스 1 D(5,5)·E(6,5)·F(5,6), 새 샘플 X(2,2), K = 3.
  const G = { left: 46, top: 26, width: 210, height: 210 };
  const sx = linear(0, 7, G.left, G.left + G.width);
  const sy = linear(0, 7, G.top + G.height, G.top);
  const X = [2, 2];
  const pts = [
    { n: "A", p: [1, 1], c: 0, dx: -9, dy: 4, a: "end" as const },
    { n: "B", p: [2, 1], c: 0, dx: 9, dy: 4, a: "start" as const },
    { n: "C", p: [1, 2], c: 0, dx: -9, dy: 4, a: "end" as const },
    { n: "D", p: [5, 5], c: 1, dx: -9, dy: 4, a: "end" as const },
    { n: "E", p: [6, 5], c: 1, dx: 9, dy: 4, a: "start" as const },
    { n: "F", p: [5, 6], c: 1, dx: -9, dy: 4, a: "end" as const },
  ].map((q) => ({ ...q, d: Math.hypot(q.p[0] - X[0], q.p[1] - X[1]) }));
  const ranked = [...pts].sort((a, b) => a.d - b.d || a.n.localeCompare(b.n));
  const r3 = ranked[2].d;
  const bx = linear(0, 5, 432, 622);
  return (
    <DiagramFrame
      title="KNN(K = 3): 가장 가까운 세 이웃의 다수결"
      caption="본문 예제의 여섯 점과 새 샘플 X(2, 2)다. X에서 각 점까지 유클리드 거리를 재어 가까운 순으로 줄 세우면 B(1.000), C(1.000), A(1.414)가 앞의 세 자리를 차지한다(점선 원 안). 셋 모두 클래스 0이므로 다수결로 X는 클래스 0이 된다. 학습 단계에서 하는 일은 훈련 데이터를 저장하는 것뿐이고, 계산은 예측할 때 일어난다."
      viewBox="0 0 720 262"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 1, 2, 3, 4, 5, 6, 7]} yTicks={[0, 1, 2, 3, 4, 5, 6, 7]} />
      <circle cx={sx(X[0])} cy={sy(X[1])} r={sx(r3) - sx(0)} fill={colors.violet} fillOpacity={0.07} stroke={colors.violet} strokeWidth={1.4} strokeDasharray="5 3" />
      {ranked.map((q, i) => (
        <line key={q.n} x1={sx(X[0])} y1={sy(X[1])} x2={sx(q.p[0])} y2={sy(q.p[1])} stroke={i < 3 ? colors.violet : inkMuted} strokeWidth={i < 3 ? 1.6 : 1} strokeDasharray={i < 3 ? undefined : "3 3"} opacity={i < 3 ? 0.9 : 0.6} />
      ))}
      {pts.map((q) => (
        <g key={q.n}>
          {classMark(sx(q.p[0]), sy(q.p[1]), q.c)}
          <text x={sx(q.p[0]) + q.dx} y={sy(q.p[1]) + q.dy} textAnchor={q.a} fontSize={11} fontWeight={800} fill={q.c === 0 ? colors.blue : colors.orange}>
            {q.n}
          </text>
        </g>
      ))}
      <path d={starPath(sx(X[0]), sy(X[1]), 8)} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1} />
      <text x={sx(X[0]) + 10} y={sy(X[1]) - 9} fontSize={11} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        X (2, 2)
      </text>
      <text x={310} y={26} fontSize={12} fontWeight={800} fill={ink}>
        X까지의 거리 순위
      </text>
      <rect x={302} y={36} width={404} height={84} rx={8} fill={colors.violet} fillOpacity={0.07} stroke={colors.violet} strokeOpacity={0.5} />
      {ranked.map((q, i) => {
        const y = 56 + i * 27 + (i >= 3 ? 8 : 0);
        return (
          <g key={q.n}>
            <text x={312} y={y + 4} fontSize={11} fontWeight={700} fill={inkSecondary}>
              {i + 1}
            </text>
            <text x={330} y={y + 4} fontSize={11} fontWeight={800} fill={ink}>
              {`${q.n} (${q.p[0]}, ${q.p[1]})`}
            </text>
            {classMark(406, y, q.c, 5)}
            <rect x={bx(0)} y={y - 6} width={bx(q.d) - bx(0)} height={12} rx={3} fill={i < 3 ? colors.violet : inkMuted} fillOpacity={i < 3 ? 0.55 : 0.35} />
            <text x={bx(q.d) + 6} y={y + 4} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
              {q.d.toFixed(3)}
            </text>
          </g>
        );
      })}
      <text x={504} y={248} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet}>
        K = 3: B, C, A 모두 클래스 0 → X는 클래스 0
      </text>
    </DiagramFrame>
  );
}

export function KnnKEffect() {
  // 겹치는 두 클래스(시드 고정, 클래스 0이 32개·클래스 1이 28개)에 K = 1, 9, 60을 적용한 결정 영역. 새 데이터 정확도는 같은 분포에서 뽑은 600개로 잰다.
  const rand = seeded(17);
  const make = (n0: number, n1: number) => {
    const out: { x: number; y: number; c: number }[] = [];
    for (let i = 0; i < n0; i++) out.push({ x: -0.8 + gaussian(rand), y: gaussian(rand), c: 0 });
    for (let i = 0; i < n1; i++) out.push({ x: 0.8 + gaussian(rand), y: 0.2 + gaussian(rand), c: 1 });
    return out;
  };
  const train = make(32, 28);
  const test = make(320, 280);
  const predict = (x: number, y: number, k: number) => {
    const near = train
      .map((p) => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, c: p.c }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    return near.reduce((s, q) => s + q.c, 0) * 2 > k ? 1 : 0;
  };
  const acc = (set: { x: number; y: number; c: number }[], k: number) => set.filter((p) => predict(p.x, p.y, k) === p.c).length / set.length;
  const pw = 214;
  const ph = 150;
  const cell = 7;
  const panels = [
    { k: 1, t: "K = 1", sub: "이웃 하나의 잡음까지 따라간다", c: colors.red },
    { k: 9, t: "K = 9", sub: "경계가 적당히 매끈하다", c: colors.green },
    { k: 60, t: "K = 60 (전체)", sub: "모든 곳이 다수 클래스 0", c: colors.red },
  ];
  return (
    <DiagramFrame
      title="K가 정하는 복잡도: 작으면 과적합, 크면 과소적합"
      caption={`겹치는 두 클래스(파란 원 32개, 주황 사각형 28개)에 KNN을 적용해 평면의 각 위치를 어느 클래스로 예측하는지 칠했다. K = 1은 훈련 점마다 섬을 만들어 훈련 정확도가 100%지만 같은 분포에서 새로 뽑은 데이터에서는 떨어진다(분산이 큰 모델). K = 60은 모든 이웃을 세므로 어디서나 다수 클래스 0을 답한다(편향이 큰 모델). 그 사이의 K가 새 데이터에서 가장 잘 맞는다. K는 교차검증으로 고르는 하이퍼파라미터다.`}
      viewBox="0 0 720 236"
      minWidth={600}
    >
      {panels.map((pn, j) => {
        const x0 = 14 + j * (pw + 22);
        const y0 = 34;
        const sx = linear(-3.5, 3.5, x0, x0 + pw);
        const sy = linear(-2.45, 2.45, y0 + ph, y0);
        const cells = [];
        for (let gx = x0; gx < x0 + pw; gx += cell) {
          for (let gy = y0; gy < y0 + ph; gy += cell) {
            const c = predict(-3.5 + ((gx + cell / 2 - x0) / pw) * 7, 2.45 - ((gy + cell / 2 - y0) / ph) * 4.9, pn.k);
            cells.push(<rect key={`${gx}-${gy}`} x={gx} y={gy} width={Math.min(cell, x0 + pw - gx)} height={Math.min(cell, y0 + ph - gy)} fill={c === 0 ? colors.blue : colors.orange} fillOpacity={0.16} />);
          }
        }
        return (
          <g key={pn.k}>
            <text x={x0 + pw / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
              {pn.t}
            </text>
            <text x={x0 + pw / 2} y={29} textAnchor="middle" fontSize={10} fill={inkSecondary}>
              {pn.sub}
            </text>
            <clipPath id={`kke-c${j}`}>
              <rect x={x0} y={y0} width={pw} height={ph} />
            </clipPath>
            <g clipPath={`url(#kke-c${j})`}>
              {cells}
              {train.map((p, i) => (
                <g key={i}>{classMark(sx(p.x), sy(p.y), p.c, 3.6)}</g>
              ))}
            </g>
            <rect x={x0} y={y0} width={pw} height={ph} fill="none" stroke="var(--border-strong)" />
            <text x={x0 + pw / 2} y={y0 + ph + 18} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
              {`훈련 ${Math.round(acc(train, pn.k) * 100)}%`}
              <tspan dx={8} fontWeight={800} fill={pn.c}>{`새 데이터 ${Math.round(acc(test, pn.k) * 100)}%`}</tspan>
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function KnnScaling() {
  // 본문 예제: A = (30세, 3000만), B = (31, 3500), C = (58, 3050). 정규화는 나이 범위 40, 연봉 범위 6000.
  const P = "kns";
  const A = [30, 3000];
  const B = [31, 3500];
  const C = [58, 3050];
  type Lab = { dx: number; dy: number; anchor: "start" | "middle" | "end" };
  const panel = (ox: number, s: number, f: (v: number[]) => number[], o: { title: string; sub: string; xl: string; yl: string; dAB: string; dAC: string; nearIsB: boolean; bl: Lab; cl: Lab; tx: number }) => {
    const oy = 226;
    const pt = (v: number[]) => {
      const a = f(A);
      const q = f(v);
      return { x: ox + (q[0] - a[0]) * s, y: oy - (q[1] - a[1]) * s };
    };
    const a = pt(A);
    const b = pt(B);
    const c = pt(C);
    const near = o.nearIsB ? b : c;
    return (
      <g>
        <text x={ox + 100} y={20} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
          {o.title}
        </text>
        <text x={ox + 100} y={36} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {o.sub}
        </text>
        <Arr x1={ox - 30} y1={oy + 22} x2={ox + 240} y2={oy + 22} color={inkMuted} marker={`${P}-ink`} width={1} />
        <text x={ox + 240} y={oy + 36} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
          {o.xl}
        </text>
        <Arr x1={ox - 30} y1={oy + 22} x2={ox - 30} y2={62} color={inkMuted} marker={`${P}-ink`} width={1} />
        <text x={ox - 30} y={54} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {o.yl}
        </text>
        <circle cx={a.x} cy={a.y} r={Math.hypot(near.x - a.x, near.y - a.y)} fill={colors.green} fillOpacity={0.08} stroke={colors.green} strokeWidth={1.3} strokeDasharray="4 3" />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.blue} strokeWidth={1.6} />
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={colors.orange} strokeWidth={1.6} />
        <circle cx={a.x} cy={a.y} r={5} fill={ink} />
        <circle cx={b.x} cy={b.y} r={5} fill={colors.blue} />
        <circle cx={c.x} cy={c.y} r={5} fill={colors.orange} />
        <text x={a.x + 8} y={a.y + 17} fontSize={10.5} fontWeight={800} fill={ink} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
          A (30세, 3000만)
        </text>
        <text x={b.x + o.bl.dx} y={b.y + o.bl.dy} textAnchor={o.bl.anchor} fontSize={10.5} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
          B (31세, 3500만)
        </text>
        <text x={c.x + o.cl.dx} y={c.y + o.cl.dy} textAnchor={o.cl.anchor} fontSize={10.5} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
          C (58세, 3050만)
        </text>
        <Lines x={o.tx} y={112} lines={[`d(A, B) ≈ ${o.dAB}`, `d(A, C) ≈ ${o.dAC}`]} size={11} anchor="start" color={ink} weight={700} />
        <text x={o.tx} y={152} fontSize={10.5} fontWeight={800} fill={o.nearIsB ? colors.green : colors.red}>
          {o.nearIsB ? "가장 가까운 이웃: B ✓" : "가장 가까운 이웃: C ✗"}
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="거리는 단위를 탄다: 정규화 전후로 '가장 가까운 이웃'이 바뀐다"
      caption="두 그림 모두 KNN이 실제로 계산하는 거리 그대로, 가로와 세로를 같은 비율로 그렸다(A를 기준점에 두었다). 왼쪽은 원래 단위다. 연봉 1만 원 차이와 나이 1살 차이가 똑같이 취급되므로 연봉이 500만 원 다른 B는 멀리 위로 떨어져 있고, 28살이나 많은 C는 A 바로 옆에 붙는다. 오른쪽은 나이를 범위 40으로, 연봉을 범위 6000으로 나눈 Min-Max 정규화 뒤다. 이제 나이 차이가 제 몫을 해서 B가 가장 가까운 이웃이 된다. 거리를 쓰는 KNN·K-Means·SVM 앞에는 항상 스케일링을 둔다."
      viewBox="0 0 720 276"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      {panel(100, 0.3, (v) => v, { title: "원래 단위", sub: "연봉 차이가 거리를 독차지한다", xl: "나이 차이 (세)", yl: "연봉 차이 (만 원)", dAB: "500", dAC: "57", nearIsB: false, bl: { dx: 10, dy: 4, anchor: "start" }, cl: { dx: 10, dy: -6, anchor: "start" }, tx: 200 })}
      <line x1={372} y1={14} x2={372} y2={262} stroke="var(--border-hairline)" />
      {panel(460, 230, (v) => [v[0] / 40, v[1] / 6000], { title: "Min-Max 정규화 후", sub: "나이 차이도 거리에 반영된다", xl: "나이 차이 (÷ 40)", yl: "연봉 차이 (÷ 6000)", dAB: "0.087", dAC: "0.700", nearIsB: true, bl: { dx: 8, dy: -8, anchor: "start" }, cl: { dx: 0, dy: -11, anchor: "middle" }, tx: 540 })}
    </DiagramFrame>
  );
}

export function NbEvidence() {
  // 본문 스팸 예제: 사전 0.3 / 0.7, P(무료|·) = 0.6 / 0.05, P(당첨|·) = 0.4 / 0.02 → 0.072 / 0.0007 → 99.0%.
  const steps = [
    { t: "① 사전 확률", sub: "메일 100통 중 스팸 30통", s: 0.3, h: 0.7, score: "0.3 : 0.7" },
    { t: "② × '무료'", sub: "P(무료|스팸) 0.6 · P(무료|정상) 0.05", s: 0.3 * 0.6, h: 0.7 * 0.05, score: "0.18 : 0.035" },
    { t: "③ × '당첨'", sub: "P(당첨|스팸) 0.4 · P(당첨|정상) 0.02", s: 0.3 * 0.6 * 0.4, h: 0.7 * 0.05 * 0.02, score: "0.072 : 0.0007" },
  ];
  const bx = linear(0, 1, 236, 566);
  return (
    <DiagramFrame
      title="나이브 베이즈: 단어 하나하나가 증거로 곱해진다"
      caption="막대는 각 단계에서 스팸과 정상의 점수를 합이 1이 되도록 정규화한 비율이다. 사전 확률(30%)에서 출발해, '무료'의 가능도를 곱하면 스팸이 정상보다 12배(0.6 / 0.05) 그럴듯해져 83.7%가 되고, '당첨'(20배)까지 곱하면 99.0%가 된다. 특징들이 클래스 안에서 서로 독립이라는 가정 덕분에 단어마다 따로 곱하기만 하면 된다. 하나라도 0인 확률이 끼면 곱 전체가 0이 되므로 라플라스 스무딩으로 0을 피한다."
      viewBox="0 0 720 214"
      minWidth={580}
    >
      <text x={bx(0.5)} y={18} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        정규화한 비율 (스팸 + 정상 = 1)
      </text>
      <text x={644} y={18} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        곱한 점수 (스팸 : 정상)
      </text>
      {steps.map((st, i) => {
        const y = 34 + i * 58;
        const ps = st.s / (st.s + st.h);
        return (
          <g key={i}>
            <text x={14} y={y + 15} fontSize={12} fontWeight={800} fill={ink}>
              {st.t}
            </text>
            <text x={14} y={y + 31} fontSize={9.5} fill={inkSecondary}>
              {st.sub}
            </text>
            <rect x={bx(0)} y={y} width={bx(ps) - bx(0)} height={36} fill={colors.orange} fillOpacity={0.75} />
            <rect x={bx(ps)} y={y} width={bx(1) - bx(ps)} height={36} fill={colors.blue} fillOpacity={0.35} />
            <text x={bx(0) + 8} y={y + 23} fontSize={12} fontWeight={800} fill={ink}>
              {`스팸 ${(ps * 100).toFixed(1)}%`}
            </text>
            {1 - ps > 0.12 ? (
              <text x={bx(1) - 8} y={y + 23} textAnchor="end" fontSize={12} fontWeight={800} fill={ink}>
                {`정상 ${((1 - ps) * 100).toFixed(1)}%`}
              </text>
            ) : (
              <text x={bx(1) - 6} y={y + 52} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.blue}>
                {`정상 ${((1 - ps) * 100).toFixed(1)}% ↑`}
              </text>
            )}
            <text x={644} y={y + 23} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={ink} fontFamily={mono}>
              {st.score}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function KernelLift() {
  // 1차원에서 안쪽(파랑)·바깥쪽(주황)으로 섞인 점을 φ(x) = (x, x²)로 들어 올리면 수평선 하나로 갈린다.
  const P = "kel";
  const inner = [-0.9, -0.5, -0.2, 0.3, 0.6, 1.0];
  const outer = [-2.6, -2.1, -1.6, 1.5, 2.0, 2.5];
  const lx = linear(-3, 3, 30, 300);
  const G = { left: 420, top: 26, width: 270, height: 190 };
  const rx = linear(-3, 3, G.left, G.left + G.width);
  const ry = linear(0, 7.2, G.top + G.height, G.top);
  const cut = 1.6;
  return (
    <DiagramFrame
      title="커널의 아이디어: 차원을 올리면 직선으로 갈라진다"
      caption="왼쪽: 1차원 위에서 파란 점은 가운데에, 주황 점은 양쪽 바깥에 있다. 문턱(점선)을 어디에 하나 그어도 두 클래스를 가를 수 없다. 오른쪽: 각 점 x를 (x, x²)로 옮기면 바깥 점은 위로 높이 올라가고 안쪽 점은 아래에 남아, 수평선 x² = 1.6 하나로 깔끔하게 갈린다. 이 직선을 원래 1차원으로 되돌리면 |x| < 1.26이라는 구간 경계가 된다. RBF 같은 커널은 이런 고차원 사상을 직접 계산하지 않고 점들 사이의 내적만으로 같은 효과를 낸다(커널 트릭)."
      viewBox="0 0 720 250"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={165} y={40} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        1차원: 문턱 하나로는 못 가른다
      </text>
      <line x1={lx(-3)} x2={lx(3)} y1={140} y2={140} stroke={inkMuted} strokeWidth={1.2} />
      {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
        <g key={t}>
          <line x1={lx(t)} x2={lx(t)} y1={140} y2={145} stroke={inkMuted} />
          <text x={lx(t)} y={160} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {String(t).replace("-", "−")}
          </text>
        </g>
      ))}
      <line x1={lx(1.25)} x2={lx(1.25)} y1={98} y2={182} stroke={colors.red} strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={lx(1.25)} y={196} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.red}>
        ✗ 어디에 그어도 한쪽이 섞인다
      </text>
      {inner.map((x) => (
        <g key={`i${x}`}>{classMark(lx(x), 140, 0, 5.5)}</g>
      ))}
      {outer.map((x) => (
        <g key={`o${x}`}>{classMark(lx(x), 140, 1, 5)}</g>
      ))}
      <Arr x1={316} y1={140} x2={392} y2={140} color={inkSecondary} marker={`${P}-ink`} width={2} />
      <text x={354} y={130} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink} fontFamily={mono}>
        φ(x) = (x, x²)
      </text>
      <Axes {...G} sx={rx} sy={ry} xTicks={[-3, -2, -1, 0, 1, 2, 3]} yTicks={[0, 2, 4, 6]} fmtX={(v) => String(v).replace("-", "−")} xLabel="x" />
      <text x={G.left + 6} y={G.top + 4} fontSize={11} fontWeight={700} fill={inkSecondary}>
        x²
      </text>
      <path d={linePath(sample((x) => x * x, -2.68, 2.68, 120).map(([x, y]) => [rx(x), ry(y)] as [number, number]))} fill="none" stroke={inkMuted} strokeWidth={1.2} strokeDasharray="2 3" />
      <line x1={G.left} x2={G.left + G.width} y1={ry(cut)} y2={ry(cut)} stroke={colors.green} strokeWidth={2} />
      <text x={G.left + 6} y={ry(cut) - 6} fontSize={10.5} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        직선 x² = 1.6 하나로 갈린다
      </text>
      {inner.map((x) => (
        <g key={`ri${x}`}>{classMark(rx(x), ry(x * x), 0, 5.5)}</g>
      ))}
      {outer.map((x) => (
        <g key={`ro${x}`}>{classMark(rx(x), ry(x * x), 1, 5)}</g>
      ))}
    </DiagramFrame>
  );
}

export function KmeansIterations() {
  // 세 덩어리(시드 고정)에 K = 3, 나쁜 초기 중심 (0.5, 1)·(1.5, 0.5)·(1, 2.5)에서 Lloyd 반복: 할당 → 평균으로 갱신 → 할당이 그대로면 멈춤.
  const rand = seeded(3);
  const pts: number[][] = [];
  for (const [cx, cy] of [
    [2, 2],
    [6, 2.5],
    [4, 6],
  ]) {
    for (let i = 0; i < 15; i++) pts.push([cx + 0.75 * gaussian(rand), cy + 0.75 * gaussian(rand)]);
  }
  const assign = (C: number[][]) => pts.map((p) => C.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2).reduce((bi, d, i, arr) => (d < arr[bi] ? i : bi), 0));
  const hist: number[][][] = [
    [
      [0.5, 1],
      [1.5, 0.5],
      [1, 2.5],
    ],
  ];
  let prev: number[] | null = null;
  for (let it = 0; it < 20; it++) {
    const C = hist[hist.length - 1];
    const a = assign(C);
    if (prev && a.every((v, i) => v === prev![i])) break;
    prev = a;
    hist.push(
      C.map((c, k) => {
        const m = pts.filter((_, i) => a[i] === k);
        return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c;
      }),
    );
  }
  const updates = hist.length - 1;
  const shown = [0, 1, 2, updates];
  const cols = [colors.blue, colors.orange, colors.green];
  const pw = 160;
  return (
    <DiagramFrame
      title="K-Means: 할당과 갱신을 바뀌지 않을 때까지 반복"
      caption={`점의 색은 그 시점의 중심(×) 중 가장 가까운 것에 배정된 결과(할당)이고, 옅은 원과 점선은 중심이 지나온 자리다. 일부러 왼쪽 아래에 몰아 둔 나쁜 초기 중심에서 출발해도, 할당 → 각 군집의 평균으로 중심 갱신을 되풀이하면 중심이 세 덩어리의 가운데로 옮겨 간다. 이 데이터에서는 ${updates}번 갱신한 뒤 할당이 더 이상 바뀌지 않아 멈췄다. 초기 중심에 따라 결과가 달라질 수 있어 실무에서는 k-means++로 여러 번 시작해 가장 좋은 결과를 고른다.`}
      viewBox="0 0 720 214"
      minWidth={600}
    >
      {shown.map((h, j) => {
        const x0 = 16 + j * (pw + 16);
        const y0 = 30;
        const sx = linear(0, 7.5, x0, x0 + pw);
        const sy = linear(0, 7.5, y0 + pw, y0);
        const C = hist[h];
        const a = assign(C);
        return (
          <g key={j}>
            <text x={x0 + pw / 2} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
              {h === 0 ? "초기 중심 + 첫 할당" : h === updates ? `수렴 (${updates}번 갱신)` : `${h}번 갱신 후`}
            </text>
            <rect x={x0} y={y0} width={pw} height={pw} fill="none" stroke="var(--border-strong)" />
            {pts.map((p, i) => (
              <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={3.4} fill={cols[a[i]]} fillOpacity={0.8} />
            ))}
            {C.map((_, k) => {
              const trail = hist.slice(0, h + 1).map((hc) => hc[k]);
              return (
                <g key={k}>
                  {trail.length > 1 && <path d={linePath(trail.map((c) => [sx(c[0]), sy(c[1])] as [number, number]))} fill="none" stroke={cols[k]} strokeWidth={1.4} strokeDasharray="3 2" />}
                  {trail.slice(0, -1).map((c, t) => (
                    <circle key={t} cx={sx(c[0])} cy={sy(c[1])} r={3.2} fill="var(--surface-card)" stroke={cols[k]} strokeWidth={1.2} />
                  ))}
                </g>
              );
            })}
            {C.map((c, k) => (
              <g key={`x${k}`}>
                <path d={`M${sx(c[0]) - 6},${sy(c[1]) - 6} L${sx(c[0]) + 6},${sy(c[1]) + 6} M${sx(c[0]) - 6},${sy(c[1]) + 6} L${sx(c[0]) + 6},${sy(c[1]) - 6}`} stroke="var(--surface-card)" strokeWidth={5} />
                <path d={`M${sx(c[0]) - 6},${sy(c[1]) - 6} L${sx(c[0]) + 6},${sy(c[1]) + 6} M${sx(c[0]) - 6},${sy(c[1]) + 6} L${sx(c[0]) + 6},${sy(c[1]) - 6}`} stroke={cols[k]} strokeWidth={2.6} />
              </g>
            ))}
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function PcaProjection() {
  // 상관된 2차원 점 40개(시드 고정): 공분산 행렬의 고유벡터가 PC1·PC2, 점을 PC1 위로 수직 투영하면 1차원 좌표가 된다.
  const P = "pcp";
  const rand = seeded(9);
  const pts: number[][] = [];
  for (let i = 0; i < 40; i++) {
    const x = gaussian(rand);
    pts.push([x, 0.8 * x + 0.45 * gaussian(rand)]);
  }
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  const a = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0) / n;
  const c = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0) / n;
  const b = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / n;
  const l1 = (a + c) / 2 + Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l2 = (a + c) / 2 - Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const vlen = Math.hypot(b, l1 - a);
  const v1 = [b / vlen, (l1 - a) / vlen];
  const v2 = [-v1[1], v1[0]];
  const ratio = l1 / (l1 + l2);
  const G = { left: 30, top: 14, width: 236, height: 236 };
  const sx = linear(-3.2, 3.2, G.left, G.left + G.width);
  const sy = linear(-3.2, 3.2, G.top + G.height, G.top);
  const proj = pts.map((p) => (p[0] - mx) * v1[0] + (p[1] - my) * v1[1]);
  const tMax = Math.max(...proj.map((t) => Math.abs(t))) * 1.05;
  const tx = linear(-tMax, tMax, 330, 690);
  return (
    <DiagramFrame
      title="PCA: 가장 넓게 퍼진 방향으로 투영해 차원을 줄인다"
      caption={`파란 점은 서로 상관된 두 특징이다. 공분산 행렬의 가장 큰 고윳값에 대응하는 고유벡터가 PC1(보라 직선)으로, 데이터가 가장 넓게 퍼진 방향이다. PC2는 그에 수직이다. 각 점을 PC1 위로 수직으로 내리면(회색 선) 2차원 점이 PC1 좌표 하나로 줄어든다(오른쪽 위). 회색 선의 길이, 즉 PC2 방향의 흩어짐이 버려지는 정보다. 이 데이터에서는 PC1 하나가 전체 분산의 ${(ratio * 100).toFixed(0)}%를 설명한다.`}
      viewBox="0 0 720 262"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ violet: colors.violet, aqua: colors.aqua }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[-3, -2, -1, 0, 1, 2, 3]} yTicks={[-3, -2, -1, 0, 1, 2, 3]} fmtX={() => ""} fmtY={() => ""} />
      <clipPath id={`${P}-clip`}>
        <rect {...{ x: G.left, y: G.top, width: G.width, height: G.height }} />
      </clipPath>
      <g clipPath={`url(#${P}-clip)`}>
        <line x1={sx(mx - 5 * v1[0])} y1={sy(my - 5 * v1[1])} x2={sx(mx + 5 * v1[0])} y2={sy(my + 5 * v1[1])} stroke={colors.violet} strokeWidth={2} />
        {pts.map((p, i) => (
          <line key={i} x1={sx(p[0])} y1={sy(p[1])} x2={sx(mx + proj[i] * v1[0])} y2={sy(my + proj[i] * v1[1])} stroke={inkMuted} strokeWidth={0.9} />
        ))}
        {pts.map((p, i) => (
          <circle key={`f${i}`} cx={sx(mx + proj[i] * v1[0])} cy={sy(my + proj[i] * v1[1])} r={2.2} fill={colors.violet} />
        ))}
        {pts.map((p, i) => (
          <circle key={`p${i}`} cx={sx(p[0])} cy={sy(p[1])} r={3.6} fill={colors.blue} fillOpacity={0.85} />
        ))}
      </g>
      <Arr x1={sx(mx)} y1={sy(my)} x2={sx(mx + 2 * Math.sqrt(l1) * v1[0])} y2={sy(my + 2 * Math.sqrt(l1) * v1[1])} color={colors.violet} marker={`${P}-violet`} width={3} />
      <Arr x1={sx(mx)} y1={sy(my)} x2={sx(mx + 2 * Math.sqrt(l2) * v2[0])} y2={sy(my + 2 * Math.sqrt(l2) * v2[1])} color={colors.aqua} marker={`${P}-aqua`} width={3} />
      <text x={sx(mx + 2 * Math.sqrt(l1) * v1[0]) + 6} y={sy(my + 2 * Math.sqrt(l1) * v1[1]) + 14} fontSize={11.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        PC1
      </text>
      <text x={sx(mx + 2 * Math.sqrt(l2) * v2[0]) - 6} y={sy(my + 2 * Math.sqrt(l2) * v2[1]) - 4} textAnchor="end" fontSize={11.5} fontWeight={800} fill={colors.aqua} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        PC2
      </text>
      <text x={330} y={34} fontSize={12} fontWeight={800} fill={ink}>
        PC1 좌표만 남긴 1차원 표현
      </text>
      <line x1={330} x2={690} y1={70} y2={70} stroke={colors.violet} strokeWidth={1.6} />
      {proj.map((t, i) => (
        <circle key={i} cx={tx(t)} cy={70} r={3.4} fill={colors.violet} fillOpacity={0.6} />
      ))}
      <text x={330} y={128} fontSize={12} fontWeight={800} fill={ink}>
        분산이 나뉘는 비율 (고윳값)
      </text>
      <rect x={330} y={140} width={360 * ratio} height={28} fill={colors.violet} fillOpacity={0.7} />
      <rect x={330 + 360 * ratio} y={140} width={360 * (1 - ratio)} height={28} fill={colors.aqua} fillOpacity={0.6} />
      <text x={340} y={159} fontSize={11.5} fontWeight={800} fill={ink}>
        {`PC1 ${(ratio * 100).toFixed(0)}%`}
      </text>
      <text x={690} y={186} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.aqua}>
        {`PC2 ${((1 - ratio) * 100).toFixed(0)}% ↑`}
      </text>
      <Lines x={330} y={214} lines={["PC1 하나만 남겨도(2차원 → 1차원)", "분산 대부분이 보존된다"]} size={11} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

export function PcaCumulative() {
  // 본문 코드(유방암 데이터 30특징, 표준화 후 PCA)의 explained_variance_ratio_ 앞 15개. 표준화 없이는 PC1 = 0.982.
  const ratio = [0.4427, 0.1897, 0.0939, 0.066, 0.055, 0.0402, 0.0225, 0.0159, 0.0139, 0.0117, 0.0098, 0.0087, 0.008, 0.0052, 0.0031];
  const cum = ratio.reduce<number[]>((acc, r) => [...acc, (acc[acc.length - 1] ?? 0) + r], []);
  const G = { left: 50, top: 16, width: 400, height: 180 };
  const sx = linear(0.4, 15.6, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const bw = 18;
  const k95 = cum.findIndex((c) => c >= 0.95) + 1;
  return (
    <DiagramFrame
      title="주성분 개수는 누적 설명 비율로 고른다 (유방암 데이터, 특징 30개)"
      caption="본문 코드의 결과다. 막대는 표준화한 뒤 각 주성분이 설명하는 분산의 비율, 선은 앞에서부터 더한 누적 비율이다. PC1이 44%, PC2까지 63%를 설명하고, 처음 10개가 95% 선을 넘는다. 30차원을 10차원으로 줄여도 분산의 95%가 남는다는 뜻이다. 오른쪽: 표준화하지 않으면 값이 큰 몇 개 특징(면적 등)의 분산이 압도해 PC1 하나가 98%를 설명하는 것처럼 보인다. 단위 때문에 생긴 착시이므로 PCA 앞에는 표준화를 둔다."
      viewBox="0 0 720 236"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 5, 10, 15]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="주성분 번호" />
      {ratio.map((r, i) => (
        <rect key={i} x={sx(i + 1) - bw / 2} y={sy(r)} width={bw} height={sy(0) - sy(r)} fill={colors.blue} fillOpacity={i < k95 ? 0.7 : 0.3} />
      ))}
      <line x1={G.left} x2={G.left + G.width} y1={sy(0.95)} y2={sy(0.95)} stroke={colors.red} strokeWidth={1.2} strokeDasharray="5 3" />
      <text x={G.left + G.width - 4} y={sy(0.95) + 14} textAnchor="end" fontSize={10.5} fontWeight={700} fill={colors.red}>
        95%
      </text>
      <path d={linePath(cum.map((c, i) => [sx(i + 1), sy(c)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.2} />
      {cum.map((c, i) => (
        <circle key={i} cx={sx(i + 1)} cy={sy(c)} r={i + 1 === k95 ? 5 : 3} fill={colors.violet} stroke={i + 1 === k95 ? "var(--surface-card)" : "none"} strokeWidth={1.5} />
      ))}
      <text x={sx(k95)} y={sy(cum[k95 - 1]) - 12} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`${k95}개 → ${(cum[k95 - 1] * 100).toFixed(1)}%`}
      </text>
      <text x={sx(1) + 14} y={sy(ratio[0]) + 4} fontSize={10.5} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        PC1 44.3%
      </text>
      <text x={sx(3)} y={sy(cum[2]) - 10} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        누적
      </text>
      <text x={586} y={34} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        PC1이 설명하는 비율
      </text>
      {[
        { t: "표준화 없이", v: 0.982, c: colors.red },
        { t: "표준화 후", v: 0.4427, c: colors.blue },
      ].map((r, i) => {
        const y = 54 + i * 62;
        return (
          <g key={r.t}>
            <text x={486} y={y + 12} fontSize={11} fontWeight={700} fill={ink}>
              {r.t}
            </text>
            <rect x={486} y={y + 20} width={200} height={20} rx={3} fill="var(--border-hairline)" />
            <rect x={486} y={y + 20} width={200 * r.v} height={20} rx={3} fill={r.c} fillOpacity={0.7} />
            <text x={486 + 200 * r.v - 6} y={y + 34} textAnchor="end" fontSize={11} fontWeight={800} fill={ink}>
              {`${(r.v * 100).toFixed(1)}%`}
            </text>
          </g>
        );
      })}
      <Lines x={486} y={196} lines={["단위가 큰 특징 하나가", "첫 주성분을 독차지한다"]} size={10.5} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

export function ColumnTransformerFlow() {
  // 본문 코드의 df(나이·소득·도시)를 ColumnTransformer에 넣은 실제 출력(scikit-learn 1.9로 확인).
  const P = "ctf";
  const raw = [
    ["25", "210", "서울"],
    ["47", "NaN", "부산"],
    ["33", "260", "서울"],
    ["52", "400", "대구"],
    ["41", "NaN", "부산"],
  ];
  const out = [
    ["−1.51", "−1.06", "0", "0", "1"],
    ["0.77", "−0.28", "0", "1", "0"],
    ["−0.68", "−0.28", "0", "0", "1"],
    ["1.28", "1.91", "1", "0", "0"],
    ["0.14", "−0.28", "0", "1", "0"],
  ];
  const rh = 22;
  const top = 44;
  const lx = [14, 60, 110];
  const lw = [46, 50, 48];
  const ox = 404;
  const ow = 60;
  const heads = ["나이", "소득", "대구", "부산", "서울"];
  return (
    <DiagramFrame
      title="ColumnTransformer: 열 종류마다 다른 전처리를 하나로 묶는다"
      caption="본문 코드를 실제로 실행한 결과다. 숫자 열(나이·소득)은 결측을 중앙값 260으로 채운 뒤(노란 칸) 평균 0, 표준편차 1로 표준화하고, 범주 열(도시)은 원-핫 열 3개로 펼친다. 결과는 숫자 2열 + 도시 3열의 5열 표다. 이 전처리 전체를 make_pipeline으로 모델 앞에 붙이면 fit 한 번에 훈련 데이터의 중앙값·평균·표준편차·범주 목록을 배우므로, 교차검증의 fold마다 검증 데이터가 새어 들어가지 않는다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, blue: colors.blue, orange: colors.orange }} />
      <text x={86} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        원본 df
      </text>
      {["나이", "소득", "도시"].map((h, j) => (
        <text key={h} x={lx[j] + lw[j] / 2} y={top - 6} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={j < 2 ? colors.blue : colors.orange}>
          {h}
        </text>
      ))}
      {raw.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}-${j}`}>
            <rect x={lx[j]} y={top + i * rh} width={lw[j]} height={rh} fill={v === "NaN" ? colors.red : j < 2 ? colors.blue : colors.orange} fillOpacity={v === "NaN" ? 0.18 : 0.07} stroke="var(--border-strong)" strokeWidth={0.8} />
            <text x={lx[j] + lw[j] / 2} y={top + i * rh + 15} textAnchor="middle" fontSize={10.5} fontWeight={v === "NaN" ? 800 : 400} fill={v === "NaN" ? colors.red : ink} fontFamily={j < 2 ? mono : undefined}>
              {v}
            </text>
          </g>
        )),
      )}
      <Arr x1={162} y1={70} x2={178} y2={70} color={colors.blue} marker={`${P}-blue`} width={1.6} />
      <Arr x1={162} y1={128} x2={178} y2={150} color={colors.orange} marker={`${P}-orange`} width={1.6} />
      <Tag x={182} y={36} w={206} h={68} lines={["num: 나이, 소득", "SimpleImputer(strategy='median')", "→ StandardScaler()"]} color={colors.blue} size={11} />
      <Tag x={182} y={122} w={206} h={60} lines={["cat: 도시", "OneHotEncoder(", "handle_unknown='ignore')"]} color={colors.orange} size={11} />
      <Arr x1={390} y1={70} x2={400} y2={70} color={colors.blue} marker={`${P}-blue`} width={1.6} />
      <Arr x1={390} y1={150} x2={400} y2={132} color={colors.orange} marker={`${P}-orange`} width={1.6} />
      <text x={ox + (5 * ow) / 2} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        fit_transform 결과 (5열)
      </text>
      {heads.map((h, j) => (
        <text key={h} x={ox + j * ow + ow / 2} y={top - 6} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={j < 2 ? colors.blue : colors.orange}>
          {h}
        </text>
      ))}
      {out.map((row, i) =>
        row.map((v, j) => {
          const imputed = j === 1 && raw[i][1] === "NaN";
          return (
            <g key={`o${i}-${j}`}>
              <rect x={ox + j * ow} y={top + i * rh} width={ow} height={rh} fill={imputed ? colors.yellow : j < 2 ? colors.blue : colors.orange} fillOpacity={imputed ? 0.35 : j >= 2 && v === "1" ? 0.3 : 0.07} stroke="var(--border-strong)" strokeWidth={0.8} />
              <text x={ox + j * ow + ow / 2} y={top + i * rh + 15} textAnchor="middle" fontSize={10.5} fontWeight={j >= 2 && v === "1" ? 800 : 400} fill={ink} fontFamily={mono}>
                {v}
              </text>
            </g>
          );
        }),
      )}
      <text x={ox + ow} y={top + 5 * rh + 16} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        표준화(평균 0, 표준편차 1)
      </text>
      <text x={ox + 3.5 * ow} y={top + 5 * rh + 16} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        도시_대구 · 도시_부산 · 도시_서울
      </text>
      <rect x={14} y={204} width={692} height={40} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={360} y={222} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
        model = make_pipeline(pre, LogisticRegression())
      </text>
      <text x={360} y={237} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        전처리 + 모델이 하나의 추정기: fit 한 번에 훈련 데이터의 중앙값·평균·범주 목록까지 배운다
      </text>
    </DiagramFrame>
  );
}

export function GridVsRandom() {
  // Bergstra & Bengio(2012)의 그림을 다시 그렸다: 같은 9번의 시도에서 격자는 중요한 축의 값을 3개만, 무작위는 9개를 시험한다.
  const f = (x: number) => 0.2 + 0.78 * Math.exp(-(((x - 0.72) / 0.09) ** 2));
  const g = (y: number) => 0.5 + 0.04 * Math.sin(6 * y);
  const grid = [1 / 6, 1 / 2, 5 / 6].flatMap((x) => [1 / 6, 1 / 2, 5 / 6].map((y) => [x, y]));
  const rnd = [
    [0.08, 0.62],
    [0.27, 0.15],
    [0.35, 0.81],
    [0.49, 0.44],
    [0.58, 0.93],
    [0.69, 0.29],
    [0.76, 0.55],
    [0.88, 0.07],
    [0.95, 0.71],
  ];
  const panel = (x0: number, pts: number[][], title: string, col: string) => {
    const S = 168;
    const y0 = 76;
    const sx = linear(0, 1, x0, x0 + S);
    const sy = linear(0, 1, y0 + S, y0);
    const fy = linear(0, 1, y0 - 8, y0 - 56);
    const gx = linear(0.3, 0.7, x0 - 8, x0 - 40);
    const best = pts.reduce((bi, p, i) => (f(p[0]) > f(pts[bi][0]) ? i : bi), 0);
    return (
      <g>
        <text x={x0 + S / 2} y={14} textAnchor="middle" fontSize={12} fontWeight={800} fill={col}>
          {title}
        </text>
        <path d={linePath(sample(f, 0, 1, 160).map(([x, y]) => [sx(x), fy(y)] as [number, number]))} fill="none" stroke={inkMuted} strokeWidth={1.6} />
        <path d={linePath(sample(g, 0, 1, 60).map(([y, v]) => [gx(v), sy(y)] as [number, number]))} fill="none" stroke={inkMuted} strokeWidth={1.6} />
        <rect x={x0} y={y0} width={S} height={S} fill="none" stroke="var(--border-strong)" />
        <text x={x0 - 6} y={fy(0.2) + 4} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
          검증 점수
        </text>
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={sx(p[0])} x2={sx(p[0])} y1={sy(p[1])} y2={fy(f(p[0]))} stroke={col} strokeWidth={0.8} strokeDasharray="2 3" opacity={0.6} />
            <circle cx={sx(p[0])} cy={fy(f(p[0]))} r={i === best ? 5 : 3.5} fill={col} stroke={i === best ? "var(--surface-card)" : "none"} strokeWidth={1.5} />
            <circle cx={sx(p[0])} cy={sy(p[1])} r={5} fill={col} fillOpacity={0.85} />
          </g>
        ))}
        <text x={x0 + S / 2} y={y0 + S + 16} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
          중요한 하이퍼파라미터 →
        </text>
        <text transform={`translate(${x0 - 48}, ${y0 + S / 2}) rotate(-90)`} textAnchor="middle" fontSize={10} fontWeight={700} fill={inkSecondary}>
          덜 중요한 하이퍼파라미터 →
        </text>
        <text x={x0 + S / 2} y={y0 + S + 34} textAnchor="middle" fontSize={11} fontWeight={800} fill={col}>
          {`중요한 축의 값 ${new Set(pts.map((p) => p[0].toFixed(3))).size}개 · 찾은 최고 점수 ${f(pts[best][0]).toFixed(2)}`}
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="같은 9번이라면: 격자 탐색 vs 무작위 탐색"
      caption="네모 안의 점은 시험한 하이퍼파라미터 조합이고, 위쪽 곡선은 중요한 하이퍼파라미터에 따른 검증 점수, 왼쪽 곡선은 덜 중요한 하이퍼파라미터의 영향(거의 평평)이다. 격자 탐색(왼쪽)은 3 × 3 = 9번을 시도해도 중요한 축에서는 같은 값 3개를 세 번씩 반복해 시험할 뿐이라 점수가 높은 좁은 구간을 놓친다. 무작위 탐색(오른쪽)은 같은 9번으로 중요한 축의 서로 다른 값 9개를 시험한다. 중요한 하이퍼파라미터가 한두 개뿐인 경우가 많아 같은 예산이면 무작위 탐색이 유리한 경우가 많다(Bergstra & Bengio, 2012의 그림을 다시 그림)."
      viewBox="0 0 720 300"
      minWidth={600}
    >
      {panel(110, grid, "격자 탐색 (GridSearchCV)", colors.blue)}
      {panel(460, rnd, "무작위 탐색 (RandomizedSearchCV)", colors.green)}
    </DiagramFrame>
  );
}

export function CvSplitters() {
  // 환자 A~D가 샘플 3개씩(총 12개). 무작위 KFold의 한 fold, GroupKFold(4), 그리고 본문 코드의 TimeSeriesSplit(n_splits=3).
  const cw = 24;
  const gap = 2;
  const pat = ["A", "A", "A", "B", "B", "B", "C", "C", "C", "D", "D", "D"];
  const cellFill = (role: "tr" | "va" | "no") => (role === "tr" ? colors.blue : role === "va" ? colors.orange : inkMuted);
  const row = (x0: number, y: number, roles: ("tr" | "va" | "no")[], labels: string[], key: string) => (
    <g key={key}>
      {roles.map((r, i) => (
        <g key={i}>
          <rect x={x0 + i * (cw + gap)} y={y} width={cw} height={20} rx={3} fill={cellFill(r)} fillOpacity={r === "no" ? 0.08 : r === "va" ? 0.55 : 0.28} stroke={cellFill(r)} strokeWidth={1} strokeDasharray={r === "no" ? "2 2" : undefined} />
          <text x={x0 + i * (cw + gap) + cw / 2} y={y + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={r === "no" ? inkMuted : ink}>
            {labels[i]}
          </text>
        </g>
      ))}
    </g>
  );
  const kf: ("tr" | "va")[] = pat.map((_, i) => ([1, 5, 7].includes(i) ? "va" : "tr"));
  return (
    <DiagramFrame
      title="나누는 단위가 누수를 막는다: KFold · GroupKFold · TimeSeriesSplit"
      caption="파랑은 훈련, 주황은 검증, 점선은 쓰지 않는 샘플이다. 위 왼쪽: 환자 A~D의 샘플을 무작위로 나누면, 검증에 들어간 A·B·C 샘플의 같은 환자 기록이 훈련에도 남아 모델이 환자를 외워서 맞힌다. 위 오른쪽: GroupKFold는 환자 단위로 fold를 만들어 검증 환자를 훈련에서 완전히 뺀다. 아래: 본문 코드의 TimeSeriesSplit(n_splits=3)은 훈련 구간을 [0~2] → [0~5] → [0~8]로 늘려 가며 항상 바로 뒤의 3개로 검증한다. 미래 데이터는 훈련에 쓰지 않는다."
      viewBox="0 0 720 284"
      minWidth={620}
    >
      <text x={20} y={18} fontSize={11.5} fontWeight={800} fill={colors.red}>
        무작위 KFold의 한 fold ✗
      </text>
      {row(20, 30, kf, pat, "kf")}
      {[1, 5, 7].map((i) => (
        <text key={i} x={20 + i * (cw + gap) + cw / 2} y={64} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.red}>
          ↑
        </text>
      ))}
      <Lines x={20} y={84} lines={["검증의 A·B·C와 같은 환자의 다른 샘플이", "훈련에 있다 → 환자를 외워서 맞힌다"]} size={10.5} anchor="start" color={colors.red} weight={700} />
      <text x={20} y={136} fontSize={10} fill={inkSecondary}>
        같은 글자 = 같은 환자
      </text>
      <text x={384} y={18} fontSize={11.5} fontWeight={800} fill={colors.green}>
        GroupKFold(n_splits=4) ✓
      </text>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <text x={378} y={44 + k * 26} textAnchor="end" fontSize={10} fill={inkSecondary}>
            {`fold ${k + 1}`}
          </text>
          {row(
            384,
            30 + k * 26,
            pat.map((p) => (p === "ABCD"[k] ? "va" : "tr")),
            pat,
            `g${k}`,
          )}
        </g>
      ))}
      <line x1={14} x2={706} y1={150} y2={150} stroke="var(--border-hairline)" />
      <text x={20} y={172} fontSize={11.5} fontWeight={800} fill={colors.green}>
        TimeSeriesSplit(n_splits=3) ✓
      </text>
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <text x={110} y={198 + k * 26} textAnchor="end" fontSize={10} fill={inkSecondary}>
            {`분할 ${k + 1}`}
          </text>
          {row(
            116,
            184 + k * 26,
            pat.map((_, i) => (i < 3 * (k + 1) ? "tr" : i < 3 * (k + 2) ? "va" : "no")),
            pat.map((_, i) => String(i)),
            `t${k}`,
          )}
        </g>
      ))}
      <Arr x1={116} y1={268} x2={116 + 12 * (cw + gap) - gap} y2={268} color={inkMuted} marker="cvs-ink" width={1.2} />
      <Markers prefix="cvs" colors={{ ink: inkMuted }} />
      <text x={116 + 6 * (cw + gap)} y={281} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        시간 →
      </text>
      <Tag x={470} y={190} w={236} h={64} lines={["과거로 학습하고 미래로 검증:", "운영 환경과 같은 조건", "(무작위로 섞으면 내일로 어제를 맞힌다)"]} color={colors.green} size={10.5} weight={600} />
    </DiagramFrame>
  );
}

export function PrVsRoc() {
  // 이항 정규 모델: 음성 점수 ~ N(0, 1), 양성 점수 ~ N(1.6, 1). 같은 분류기를 양성 비율 50%·10%·1%에 적용.
  const d = 1.6;
  const ts = Array.from({ length: 401 }, (_, i) => 7 - i * 0.03);
  const roc = ts.map((t) => [normCdf(-t), normCdf(d - t)]);
  const auc = normCdf(d / Math.SQRT2);
  const pis = [
    { pi: 0.5, c: colors.blue, t: "양성 50%" },
    { pi: 0.1, c: colors.orange, t: "양성 10%" },
    { pi: 0.01, c: colors.red, t: "양성 1%" },
  ].map((o) => {
    const pr = roc.map(([fpr, tpr]) => [tpr, (o.pi * tpr) / (o.pi * tpr + (1 - o.pi) * fpr)]);
    let ap = 0;
    for (let i = 1; i < pr.length; i++) ap += (pr[i][0] - pr[i - 1][0]) * pr[i][1];
    return { ...o, pr, ap };
  });
  const S = 186;
  const L = { left: 52, top: 22, width: S, height: S };
  const R = { left: 330, top: 22, width: S, height: S };
  const lx = linear(0, 1, L.left, L.left + S);
  const ly = linear(0, 1, L.top + S, L.top);
  const rx = linear(0, 1, R.left, R.left + S);
  const ry = linear(0, 1, R.top + S, R.top);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <DiagramFrame
      title="같은 분류기, 다른 양성 비율: ROC는 그대로, PR은 달라진다"
      caption={`점수 분포가 같은 하나의 분류기(음성 ~ N(0, 1), 양성 ~ N(1.6, 1))를 양성 비율만 바꿔 평가했다. ROC 곡선은 TPR과 FPR만 쓰므로 세 경우가 완전히 같은 곡선이고 AUC도 ${auc.toFixed(2)}로 같다. PR 곡선은 Precision에 양성 비율이 들어가므로 양성이 드물수록 아래로 내려앉는다. 무작위 분류기의 기준선(점선)도 양성 비율과 같다. 양성 1%에서 AP ${pis[2].ap.toFixed(2)}는 낮아 보이지만 기준선 0.01의 약 ${Math.round(pis[2].ap / 0.01)}배다. 양성이 드문 문제에서는 ROC-AUC만 보지 말고 PR 곡선과 AP를 함께 본다.`}
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="FPR (위양성률)" yLabel="TPR (Recall)" />
      <line x1={lx(0)} y1={ly(0)} x2={lx(1)} y2={ly(1)} stroke={inkMuted} strokeDasharray="4 3" />
      <path d={linePath(roc.map(([x, y]) => [lx(x), ly(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <text x={lx(0.5)} y={ly(0.5) + 34} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`세 경우 모두 AUC ${auc.toFixed(2)}`}
      </text>
      <text x={L.left + S / 2} y={12} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        ROC 곡선
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="Recall" yLabel="Precision" />
      <text x={R.left + S / 2} y={12} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        PR 곡선
      </text>
      {pis.map((o) => (
        <g key={o.pi}>
          <line x1={rx(0)} x2={rx(1)} y1={ry(o.pi)} y2={ry(o.pi)} stroke={o.c} strokeWidth={1} strokeDasharray="4 3" />
          <path d={linePath(o.pr.filter(([r]) => r > 0.002).map(([r, p]) => [rx(r), ry(p)] as [number, number]))} fill="none" stroke={o.c} strokeWidth={2.2} />
        </g>
      ))}
      {pis.map((o, i) => (
        <g key={`l${o.pi}`}>
          <line x1={548} x2={572} y1={60 + i * 44} y2={60 + i * 44} stroke={o.c} strokeWidth={2.4} />
          <text x={580} y={58 + i * 44} fontSize={11.5} fontWeight={800} fill={o.c}>
            {o.t}
          </text>
          <text x={580} y={74 + i * 44} fontSize={10.5} fill={inkSecondary}>
            {`AP ${o.ap.toFixed(2)} · 기준선 ${pct(o.pi)}`}
          </text>
        </g>
      ))}
      <line x1={548} x2={572} y1={196} y2={196} stroke={inkMuted} strokeDasharray="4 3" />
      <text x={580} y={200} fontSize={10.5} fill={inkSecondary}>
        점선 = 무작위 분류기
      </text>
    </DiagramFrame>
  );
}

export function CostThreshold() {
  // 본문 코드: p ~ Beta(1, 8)이고 보정된 확률(실제로 확률 p로 양성), C_FP = 1, C_FN = 10, n = 100,000.
  // 기대 비용 곡선은 해석적으로: E[FP] = n·(8/9)(1−t)^9, E[FN] = n·(1/9 − (1−t)^8 + (8/9)(1−t)^9). 점은 본문 코드의 실제 출력.
  const n = 100000;
  const fp = (t: number) => n * (8 / 9) * (1 - t) ** 9;
  const fn = (t: number) => n * (1 / 9 - (1 - t) ** 8 + (8 / 9) * (1 - t) ** 9);
  const cost = (t: number) => fp(t) + 10 * fn(t);
  const runs = [
    { t: 0.5, c: 107696 },
    { t: 0.3, c: 91232 },
    { t: 0.2, c: 73236 },
    { t: 1 / 11, c: 58972 },
    { t: 0.05, c: 64105 },
  ];
  const G = { left: 64, top: 16, width: 420, height: 180 };
  const sx = linear(0, 0.55, G.left, G.left + G.width);
  const sy = linear(0, 120000, G.top + G.height, G.top);
  const curve = (h: (t: number) => number) => linePath(sample(h, 0.005, 0.55, 200).map(([x, y]) => [sx(x), sy(y)] as [number, number]));
  return (
    <DiagramFrame
      title="비용으로 임계값 고르기: 놓치는 비용이 10배면 t* = 1/11"
      caption="본문 코드의 상황(보정된 확률, 오경보 비용 1, 놓친 양성 비용 10, 샘플 10만 개)에서 임계값에 따른 총비용이다. 곡선은 기댓값, 점은 본문 코드의 실제 출력이다. 임계값을 낮추면 양성으로 처리하는 샘플이 늘어 오경보 비용(파랑)이 커지고, 높이면 놓친 양성의 비용(주황)이 커진다. 총비용(보라)은 t* = C_FP / (C_FP + C_FN) = 1/11 ≈ 0.091에서 가장 작고, 흔히 쓰는 0.5는 이 상황에서 가장 비싼 선택이다. 이 계산은 모델의 확률이 실제 빈도와 맞을 때(보정되어 있을 때)만 성립한다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} yTicks={[0, 40000, 80000, 120000]} fmtY={(v) => (v === 0 ? "0" : `${v / 10000}만`)} xLabel="임계값 t (이 이상이면 양성으로 처리)" />
      <path d={curve((t) => fp(t))} fill="none" stroke={colors.blue} strokeWidth={1.6} strokeDasharray="5 3" />
      <path d={curve((t) => 10 * fn(t))} fill="none" stroke={colors.orange} strokeWidth={1.6} strokeDasharray="5 3" />
      <path d={curve(cost)} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <line x1={sx(1 / 11)} x2={sx(1 / 11)} y1={G.top} y2={G.top + G.height} stroke={colors.green} strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={sx(1 / 11) + 6} y={G.top + 12} fontSize={10.5} fontWeight={800} fill={colors.green}>
        t* = 1/11 ≈ 0.091
      </text>
      {runs.map((r) => (
        <circle key={r.t} cx={sx(r.t)} cy={sy(r.c)} r={4.5} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
      ))}
      <text x={sx(1 / 11) + 8} y={sy(58972) + 18} fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        최소
      </text>
      <text x={506} y={168} fontSize={10.5} fontWeight={800} fill={ink}>
        본문 코드의 출력
      </text>
      {[...runs]
        .sort((p, q) => p.t - q.t)
        .map((r, i) => (
          <g key={`row${r.t}`}>
            <text x={506} y={186 + i * 14} fontSize={10} fill={r.t === 1 / 11 ? colors.green : inkSecondary} fontWeight={r.t === 1 / 11 ? 800 : 400} fontFamily={mono}>
              {`t = ${r.t.toFixed(3)}`}
            </text>
            <text x={680} y={186 + i * 14} textAnchor="end" fontSize={10} fill={r.t === 1 / 11 ? colors.green : ink} fontWeight={r.t === 1 / 11 ? 800 : 400} fontFamily={mono}>
              {r.c.toLocaleString("en-US")}
            </text>
          </g>
        ))}
      <Lines x={506} y={40} lines={["총비용 = FP × 1 + FN × 10"]} size={11} anchor="start" color={colors.violet} weight={800} />
      <line x1={506} x2={530} y1={70} y2={70} stroke={colors.blue} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={536} y={74} fontSize={10.5} fill={inkSecondary}>
        오경보(FP) 비용
      </text>
      <line x1={506} x2={530} y1={92} y2={92} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="5 3" />
      <text x={536} y={96} fontSize={10.5} fill={inkSecondary}>
        놓친 양성(FN) 비용 × 10
      </text>
      <Lines x={506} y={118} lines={["양성으로 처리할 조건: (1 − p)·C_FP < p·C_FN", "⇔ p > C_FP / (C_FP + C_FN)"]} size={10} anchor="start" color={ink} weight={600} gap={1.5} />
    </DiagramFrame>
  );
}

export function ReliabilityDiagram() {
  // class_weight="balanced"는 (잘 맞는 로지스틱 모델에서) 로짓을 ln((1−π)/π)만큼 올린다. 양성 비율 π = 8% → 예측 0.5가 실제 8%.
  const P = "rld";
  const shift = Math.log(0.92 / 0.08);
  const logit = (p: number) => Math.log(p / (1 - p));
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  const G = { left: 56, top: 16, width: 200, height: 200 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="신뢰도 그림: 예측 확률이 실제 빈도와 맞는가"
      caption="가로축은 모델이 준 예측 확률, 세로축은 그 확률을 받은 샘플들 중 실제 양성의 비율이다. 점이 대각선에 붙어 있을수록 잘 보정된 것이다(0.2~0.4라고 예측한 샘플 중 약 28%가 양성). 빨간 곡선은 양성이 8%인 데이터에서 class_weight='balanced'로 학습한 로지스틱 회귀의 전형적인 모습이다. 가중치가 로짓을 ln(0.92 / 0.08) ≈ 2.44만큼 끌어올려, 0.5라고 예측한 샘플이 실제로는 8%만 양성이다. 순위(AUC)는 그대로지만 확률을 비용 계산에 쓰면 틀린다. 이런 모델은 CalibratedClassifierCV로 다시 맞추거나 가중치 없이 학습하고 임계값을 옮긴다."
      viewBox="0 0 720 252"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ green: colors.green }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]} yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]} xLabel="예측 확률" yLabel="실제 양성 비율" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={colors.blue} strokeWidth={2} />
      <text x={sx(0.62)} y={sy(0.74)} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        완벽한 보정
      </text>
      <line x1={sx(0.2)} x2={sx(0.4)} y1={sy(0.28)} y2={sy(0.28)} stroke={colors.blue} strokeWidth={5} strokeOpacity={0.35} strokeLinecap="round" />
      <circle cx={sx(0.3)} cy={sy(0.28)} r={4.5} fill={colors.blue} />
      <line x1={sx(0.17)} y1={sy(0.465)} x2={sx(0.28)} y2={sy(0.31)} stroke={colors.blue} strokeWidth={0.9} />
      <text x={sx(0.03)} y={sy(0.5)} fontSize={9.5} fontWeight={700} fill={colors.blue}>
        0.2~0.4 → 28%
      </text>
      <path d={linePath(sample((p) => sig(logit(p) - shift), 0.005, 0.995, 160).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={2.4} />
      <circle cx={sx(0.5)} cy={sy(0.08)} r={4.5} fill={colors.red} stroke="var(--surface-card)" strokeWidth={1.5} />
      <line x1={sx(0.5)} x2={sx(0.5)} y1={sy(0.5)} y2={sy(0.08) - 6} stroke={colors.red} strokeDasharray="3 3" />
      <text x={sx(0.5) + 8} y={sy(0.08) - 6} fontSize={10.5} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        예측 0.5 → 실제 8%
      </text>
      <ArrPath d={`M${sx(0.82)},${sy(0.36)} C${sx(0.8)},${sy(0.55)} ${sx(0.78)},${sy(0.66)} ${sx(0.76)},${sy(0.72)}`} color={colors.green} marker={`${P}-green`} width={1.6} />
      <text x={sx(0.84)} y={sy(0.3)} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        보정
      </text>
      <Lines x={300} y={40} lines={["대각선과 일치: 예측한 만큼 실제로 일어난다", "대각선보다 아래: 확률을 부풀렸다 (과대평가)", "대각선보다 위: 확률을 낮춰 말했다 (과소평가)"]} size={11} anchor="start" color={ink} weight={600} gap={1.7} />
      <rect x={300} y={118} width={404} height={100} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={314} y={140} fontSize={11.5} fontWeight={800} fill={ink}>
        하나의 숫자로: 브라이어 점수
      </text>
      <text x={314} y={162} fontSize={11.5} fontWeight={700} fill={ink} fontFamily={mono}>
        (1/n) Σ (pᵢ − yᵢ)²
      </text>
      <Lines x={314} y={186} lines={["확률 예측의 평균제곱오차, 작을수록 좋다.", "항상 0.5만 말하는 모델이 0.25다."]} size={10.5} anchor="start" color={inkSecondary} />
    </DiagramFrame>
  );
}

const DD_P = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 48, 50, 52, 55, 60, 65, 70, 80, 90, 100, 120, 140, 160, 200, 250, 300, 400, 500, 600, 800];
const DD_MN = [0.856, 0.7438, 0.6892, 0.6609, 0.5806, 0.5209, 0.4592, 0.433, 0.4123, 0.3857, 0.3781, 0.3842, 0.4116, 0.4401, 0.4746, 0.5271, 0.5893, 0.6817, 0.8205, 1.0767, 1.5779, 2.0702, 2.9035, 4.5245, 16.5116, 4.5992, 2.9307, 1.9599, 1.5083, 1.0927, 0.8344, 0.6957, 0.6135, 0.5214, 0.422, 0.3473, 0.3161, 0.258, 0.2288, 0.2084, 0.1806, 0.1628, 0.1514, 0.1388, 0.1292, 0.1237, 0.1179, 0.1138, 0.1116, 0.1088];
const DD_RIDGE = [0.8536, 0.7451, 0.6726, 0.6477, 0.5704, 0.5148, 0.4328, 0.4098, 0.3777, 0.3495, 0.3305, 0.3356, 0.3415, 0.3321, 0.3359, 0.3512, 0.35, 0.3487, 0.3506, 0.3469, 0.3407, 0.3379, 0.3401, 0.3344, 0.3306, 0.3322, 0.3282, 0.3307, 0.3329, 0.3241, 0.3106, 0.3041, 0.2971, 0.2869, 0.2695, 0.2567, 0.2461, 0.223, 0.2056, 0.1903, 0.1716, 0.1585, 0.149, 0.1378, 0.1288, 0.1233, 0.1177, 0.1138, 0.1116, 0.1088];
const DD_SMIN = [1.2839, 1.0672, 0.9495, 0.8716, 0.8118, 0.7567, 0.6737, 0.5992, 0.5453, 0.495, 0.4427, 0.4016, 0.3538, 0.3165, 0.2801, 0.2425, 0.2085, 0.1737, 0.1408, 0.1074, 0.0754, 0.0593, 0.0417, 0.0302, 0.0135, 0.0289, 0.0465, 0.0595, 0.072, 0.0988, 0.1238, 0.1457, 0.1751, 0.2053, 0.2569, 0.3146, 0.3699, 0.4651, 0.5505, 0.6367, 0.7867, 0.9363, 1.0663, 1.3046, 1.5704, 1.82, 2.2485, 2.6245, 2.9551, 3.5572];
const SEP_POS = "2.41,1.04 0.417,1.431 2.46,1.384 -0.702,0.663 2.152,1.723 0.255,1.54 2.607,1.206 0.395,0.976 1.274,1.442 2.409,0.855";
const SEP_NEG = "-1.692,-1.212 -1.757,-0.869 -1.844,-1.225 -2.935,-1.149 -2.445,-0.54 -1.466,-1.136 -1.511,-1.61 -1.992,-1.161 -0.779,-1.123 -2.79,-1.275";
const SEP_TRACE = [[1, 1.011, 35.61], [2, 1.207, 38.06], [3, 1.345, 39.89], [6, 1.623, 43.83], [10, 1.863, 47.49], [18, 2.180, 52.58], [32, 2.545, 58.41], [56, 2.968, 64.49], [100, 3.494, 70.44], [178, 4.102, 75.25], [316, 4.772, 78.68], [562, 5.491, 80.99], [1000, 6.242, 82.50], [1778, 7.018, 83.52], [3162, 7.815, 84.24], [5623, 8.631, 84.75], [10000, 9.464, 85.14], [17783, 10.312, 85.43], [31623, 11.173, 85.66], [56234, 12.044, 85.85], [100000, 12.924, 86.01], [177828, 13.810, 86.14], [316228, 14.701, 86.25], [562341, 15.596, 86.34], [1000000, 16.494, 86.43]];

export function NoisePriorLoss() {
  // 분산이 1로 같은 두 분포: 가우시안 N(0, 1), 라플라스 b = 1/√2(분산 2b² = 1). −log 밀도에서 상수를 빼면 ε²/2와 √2·|ε|.
  const b = Math.SQRT1_2;
  const gpdf = (e: number) => Math.exp((-e * e) / 2) / Math.sqrt(2 * Math.PI);
  const lpdf = (e: number) => Math.exp(-Math.abs(e) / b) / (2 * b);
  const A = { left: 52, top: 30, width: 250, height: 74 };
  const B = { left: 52, top: 148, width: 250, height: 74 };
  const sx = linear(-4, 4, A.left, A.left + A.width);
  const ay = linear(0, 0.75, A.top + A.height, A.top);
  const by = linear(0, 8, B.top + B.height, B.top);
  const curve = (f: (e: number) => number, sy: (v: number) => number, a = -4, z = 4) =>
    linePath(sample(f, a, z, 200).map(([x, y]) => [sx(x), sy(y)] as [number, number]));
  const x0 = 372;
  const cw = [128, 104, 104];
  const cx = [x0, x0 + cw[0] + 2, x0 + cw[0] + cw[1] + 4];
  const rows = [
    { t: ["잡음 ε의 분포로 가정", "→ 최대가능도(MLE)"], g: ["MSE", "제곱 오차"], l: ["MAE", "절댓값 오차"] },
    { t: ["가중치 w의 사전분포로", "→ 최대사후확률(MAP)"], g: ["L2 벌점", "Ridge"], l: ["L1 벌점", "Lasso"] },
  ];
  return (
    <DiagramFrame
      title="가우시안은 제곱, 라플라스는 절댓값: 분포의 −log가 곧 손실이다"
      caption="왼쪽 위: 분산이 같은(1) 두 분포다. 라플라스는 0에서 더 뾰족하고 꼬리가 더 두꺼워 큰 값이 상대적으로 자주 나온다. 왼쪽 아래: 각 밀도에 −log를 취하고 상수를 뺀 것이다. 가우시안은 ε²/2(제곱), 라플라스는 √2·|ε|(절댓값)가 된다. 오른쪽: 이 짝이 두 번 쓰인다. 잔차 ε의 분포로 가정하면 최대가능도가 MSE·MAE 최소화가 되고, 가중치 w의 사전분포로 가정하면 MAP의 벌점 항이 L2·L1 정규화가 된다. 큰 오차를 제곱으로 벌하는 MSE가 이상치에 민감한 것도, 0에서 뾰족한 라플라스 사전이 가중치를 정확히 0으로 만드는 것도 모두 분포의 모양에서 나온다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      <text x={A.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        확률밀도 p(ε): 같은 분산, 다른 모양
      </text>
      <Axes {...A} sx={sx} sy={ay} xTicks={[-4, -2, 0, 2, 4]} yTicks={[0, 0.25, 0.5, 0.75]} fmtY={(v) => (v === 0 ? "0" : String(v))} />
      <path d={`${curve(gpdf, ay)} L${sx(4)},${ay(0)} L${sx(-4)},${ay(0)} Z`} fill={colors.blue} fillOpacity={0.1} />
      <path d={curve(gpdf, ay)} fill="none" stroke={colors.blue} strokeWidth={2.2} />
      <path d={curve(lpdf, ay)} fill="none" stroke={colors.orange} strokeWidth={2.2} />
      <line x1={sx(1.55)} x2={sx(2.05)} y1={ay(0.66)} y2={ay(0.66)} stroke={colors.blue} strokeWidth={2.2} />
      <text x={sx(2.15)} y={ay(0.66) + 3.5} fontSize={10} fontWeight={700} fill={colors.blue}>
        가우시안 N(0, 1)
      </text>
      <line x1={sx(1.55)} x2={sx(2.05)} y1={ay(0.48)} y2={ay(0.48)} stroke={colors.orange} strokeWidth={2.2} />
      <text x={sx(2.15)} y={ay(0.48) + 3.5} fontSize={10} fontWeight={700} fill={colors.orange}>
        라플라스(분산 1)
      </text>
      <text x={sx(-2.4)} y={ay(0.16)} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.orange}>
        꼬리가 두껍다
      </text>
      <text x={B.left} y={136} fontSize={11.5} fontWeight={800} fill={ink}>
        −log p(ε) (상수 제외) = 손실
      </text>
      <Axes {...B} sx={sx} sy={by} xTicks={[-4, -2, 0, 2, 4]} yTicks={[0, 4, 8]} xLabel="ε (잔차 또는 가중치)" />
      <path d={curve((e) => (e * e) / 2, by, -4, 4)} fill="none" stroke={colors.blue} strokeWidth={2.2} />
      <path d={curve((e) => Math.SQRT2 * Math.abs(e), by)} fill="none" stroke={colors.orange} strokeWidth={2.2} />
      <text x={sx(4) + 4} y={by(7.6)} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        ε²/2
      </text>
      <text x={sx(4) + 4} y={by(5.4)} fontSize={10.5} fontWeight={800} fill={colors.orange}>
        √2·|ε|
      </text>
      <text x={cx[1] + cw[1] / 2} y={42} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.blue}>
        가우시안
      </text>
      <text x={cx[2] + cw[2] / 2} y={42} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={colors.orange}>
        라플라스
      </text>
      {rows.map((r, i) => {
        const y = 54 + i * 70;
        return (
          <g key={i}>
            <rect x={cx[0]} y={y} width={cw[0]} height={62} rx={6} fill={card2Bg} stroke="var(--border-strong)" />
            <Lines x={cx[0] + 10} y={y + 27} lines={r.t} size={10.5} anchor="start" color={ink} weight={700} gap={1.5} />
            <Tag x={cx[1]} y={y} w={cw[1]} h={62} lines={r.g} color={colors.blue} size={13} weight={800} />
            <Tag x={cx[2]} y={y} w={cw[2]} h={62} lines={r.l} color={colors.orange} size={13} weight={800} />
          </g>
        );
      })}
      <Lines x={x0} y={214} lines={["가우시안 잡음 + 가우시안 사전 → Ridge의 λ = σ²/τ²", "라플라스 사전은 0에서 뾰족해 가중치를 정확히 0으로"]} size={10} anchor="start" color={inkSecondary} gap={1.55} />
    </DiagramFrame>
  );
}

export function MeanMedianLoss() {
  // 본문 코드: y = [1, 2, 3, 10]. MSE(c)의 최소는 평균 4(값 12.5), MAE(c)의 최소는 2~3 구간 전체(값 2.5, 중앙값 2.5 포함).
  const ys = [1, 2, 3, 10];
  const mse = (c: number) => ys.reduce((s, v) => s + (v - c) ** 2, 0) / ys.length;
  const mae = (c: number) => ys.reduce((s, v) => s + Math.abs(v - c), 0) / ys.length;
  const L = { left: 52, top: 30, width: 270, height: 150 };
  const R = { left: 420, top: 30, width: 270, height: 150 };
  const lx = linear(0, 11, L.left, L.left + L.width);
  const ly = linear(0, 40, L.top + L.height, L.top);
  const rx = linear(0, 11, R.left, R.left + R.width);
  const ry = linear(0, 8, R.top + R.height, R.top);
  const rug = (sx: (v: number) => number, base: number) =>
    ys.map((v) => <circle key={v} cx={sx(v)} cy={base} r={4.5} fill={v === 10 ? colors.red : ink} stroke="var(--surface-card)" strokeWidth={1.5} />);
  return (
    <DiagramFrame
      title="상수 하나로 예측할 때: MSE는 평균, MAE는 중앙값을 고른다"
      caption="본문 코드의 데이터 y = [1, 2, 3, 10](점, 빨강이 튀는 값 10)에 상수 c 하나로 예측할 때 손실을 c에 따라 그렸다. 왼쪽: MSE는 매끈한 포물선이고 최소는 평균 4다. 10과의 거리를 제곱으로 벌하므로 튀는 값 하나가 답을 2 근처에서 4까지 끌고 간다. 오른쪽: MAE는 꺾인 직선들로 이루어지고 2~3 구간 전체에서 최소(2.5)다. 중앙값 2.5가 이 구간에 들어 있다. 10이 100으로 바뀌어도 MAE의 최소 구간은 그대로다. 가우시안 가정(MSE)은 큰 잔차를 매우 드문 일로 보고 설명하려 애쓰고, 라플라스 가정(MAE)은 큰 잔차를 어느 정도 예상해 덜 휘둘린다."
      viewBox="0 0 720 240"
      minWidth={600}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        MSE(c) = 평균 (y − c)²
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 10, 20, 30, 40]} xLabel="상수 예측 c" />
      <path d={linePath(sample(mse, 0, 9.24, 160).map(([x, y]) => [lx(x), ly(y)] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <line x1={lx(4)} x2={lx(4)} y1={ly(12.5)} y2={ly(0)} stroke={colors.blue} strokeDasharray="4 3" />
      <circle cx={lx(4)} cy={ly(12.5)} r={4.5} fill={colors.blue} />
      <text x={lx(4) + 8} y={ly(12.5) + 16} fontSize={10.5} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        최소: c = 4 (평균)
      </text>
      {rug(lx, ly(0))}
      <text x={lx(10)} y={ly(0) - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.red}>
        튀는 값
      </text>
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        MAE(c) = 평균 |y − c|
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 2, 4, 6, 8]} xLabel="상수 예측 c" />
      <path d={linePath(sample(mae, 0, 11, 220).map(([x, y]) => [rx(x), ry(y)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      <line x1={rx(2)} x2={rx(3)} y1={ry(2.5)} y2={ry(2.5)} stroke={colors.orange} strokeWidth={7} strokeOpacity={0.4} strokeLinecap="round" />
      <line x1={rx(2.5)} x2={rx(2.5)} y1={ry(2.5)} y2={ry(0)} stroke={colors.orange} strokeDasharray="4 3" />
      <text x={rx(3.4)} y={ry(2.5) + 18} fontSize={10.5} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        최소: 2 ≤ c ≤ 3 (중앙값 2.5 포함)
      </text>
      {rug(rx, ry(0))}
      <text x={rx(10)} y={ry(0) - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.red}>
        튀는 값
      </text>
    </DiagramFrame>
  );
}

const RIDGE_OLS =
  "-1.48,3.33 2.39,-0.37 0.93,0.97 2.75,-0.61 0.56,1.50 1.68,0.20 1.31,0.61 3.11,-1.04 2.33,-0.34 0.27,1.76 -0.06,1.98 3.12,-1.17 -1.39,3.40 2.85,-0.72 3.23,-1.05 " +
  "-3.78,5.79 3.38,-1.53 -0.51,2.56 0.04,1.83 1.01,0.85 3.34,-1.37 3.20,-1.33 2.05,-0.07 2.90,-0.75 3.36,-1.29 -0.96,2.80 -0.51,2.48 -1.13,2.97 1.39,0.77 -0.20,2.32 " +
  "-1.56,3.58 -0.58,2.62 -1.45,3.45 3.90,-2.00 2.98,-1.01 3.16,-1.10 1.43,0.54 0.91,1.19 0.55,1.26 2.53,-0.55 -2.87,4.81 1.76,0.31 2.32,-0.40 1.65,0.23 -1.61,3.64 " +
  "2.07,0.10 -2.03,3.97 0.21,1.91 0.01,1.94 0.62,1.35 2.84,-0.89 0.96,0.99 -1.40,3.40 -0.34,2.46 2.27,-0.38 0.87,1.25 1.79,0.14 0.96,1.06 -0.53,2.66 0.95,0.98";
const RIDGE_R =
  "0.826,1.002 1.045,0.947 0.936,0.939 1.115,0.994 1.003,1.039 0.951,0.899 0.958,0.934 1.098,0.949 1.029,0.934 0.971,1.026 0.913,0.988 1.039,0.884 0.907,1.083 1.115,0.987 1.153,0.999 " +
  "0.824,1.173 1.002,0.825 0.955,1.068 0.891,0.957 0.920,0.916 1.059,0.889 1.004,0.840 1.015,0.939 1.127,0.995 1.105,0.938 0.844,0.982 0.920,1.030 0.833,0.983 1.074,1.053 1.001,1.093 " +
  "0.905,1.092 0.948,1.066 0.896,1.075 1.043,0.830 1.043,0.899 1.094,0.941 0.986,0.956 1.032,1.043 0.881,0.909 1.032,0.921 0.822,1.102 1.048,0.996 0.993,0.895 0.952,0.901 0.909,1.101 " +
  "1.106,1.037 0.850,1.070 1.017,1.080 0.927,0.999 0.958,0.986 1.030,0.896 0.963,0.965 0.899,1.074 0.995,1.098 0.978,0.883 1.040,1.055 0.983,0.925 0.997,1.002 0.996,1.114 0.952,0.955";

export function RidgeCollinear() {
  // x2 = x1 + 0.05·잡음(상관 거의 1)인 특징 두 개, y = x1 + x2 + 0.5·잡음, n = 30. 같은 입력에 잡음만 새로 뽑아 60번 학습한 계수(numpy).
  // XᵀX의 고유값 77.53, 0.0377(κ ≈ 2059). λ = 1을 더하면 78.53, 1.0377(κ ≈ 75.7).
  const pts = (s: string) => s.split(" ").map((p) => p.split(",").map(Number));
  const S = 23;
  const G = { left: 48, top: 16, width: 8 * S, height: 8.2 * S };
  const sx = linear(-4, 4, G.left, G.left + G.width);
  const sy = linear(-2.2, 6, G.top + G.height, G.top);
  const E = { left: 400, top: 30, width: 290, height: 160 };
  const ey = log10Scale(0.01, 300, E.top + E.height, E.top);
  const groups = [
    { t: "OLS (λ = 0)", vals: [77.53, 0.0377], k: "κ ≈ 2059", c: colors.blue, x: 450 },
    { t: "Ridge (λ = 1)", vals: [78.53, 1.0377], k: "κ ≈ 76", c: colors.orange, x: 610 },
  ];
  return (
    <DiagramFrame
      title="다중공선성: OLS 계수는 크게 흔들리고, Ridge는 고유값을 들어 올려 안정시킨다"
      caption="거의 같은 특징 두 개(x₂ = x₁ + 작은 잡음)로 y = x₁ + x₂ + 잡음을 학습하되, 같은 입력에 잡음만 새로 뽑아 60번 반복했다. 왼쪽: OLS 계수(파랑)는 합 w₁ + w₂ ≈ 2만 정해지고 나머지 방향으로는 −4에서 4까지 흔들린다. 같은 정보를 두 특징이 어떻게 나눠 가질지 데이터가 거의 알려 주지 않기 때문이다. Ridge(λ = 1, 주황)는 참값 (1, 1) 근처에 촘촘히 모인다. 오른쪽: 원인은 XᵀX의 고유값이다. 작은 고유값 0.04는 그 방향(w₁ − w₂ 방향)으로 데이터가 거의 퍼져 있지 않다는 뜻이라, 역행렬을 곱하면 그 방향의 잡음이 1/0.04 ≈ 27배로 커진다. λI를 더하면 모든 고유값이 λ만큼 올라가 조건수가 약 2059에서 76으로 줄어든다."
      viewBox="0 0 720 258"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[-4, -2, 0, 2, 4]} yTicks={[-2, 0, 2, 4, 6]} xLabel="w₁" yLabel="w₂" />
      <line x1={sx(-4)} y1={sy(6)} x2={sx(4)} y2={sy(-2)} stroke={inkMuted} strokeDasharray="5 4" />
      <g opacity={0.75}>
        {pts(RIDGE_OLS).map(([a, b2], i) => (
          <circle key={i} cx={sx(a)} cy={sy(b2)} r={3.2} fill={colors.blue} />
        ))}
      </g>
      <g opacity={0.8}>
        {pts(RIDGE_R).map(([a, b2], i) => (
          <circle key={i} cx={sx(a)} cy={sy(b2)} r={2.4} fill={colors.orange} />
        ))}
      </g>
      <path d={starPath(sx(1), sy(1), 6)} fill={ink} stroke="var(--surface-card)" strokeWidth={1} />
      <Lines x={sx(-3.8)} y={sy(1.3)} lines={["OLS 60번:", "w₁ + w₂ ≈ 2 선을 따라", "크게 흔들린다"]} size={10} anchor="start" color={colors.blue} weight={700} gap={1.4} />
      <line x1={sx(1.25)} y1={sy(1.25)} x2={sx(1.9)} y2={sy(3.9)} stroke={colors.orange} strokeWidth={1} />
      <Lines x={sx(1.6)} y={sy(4.9)} lines={["Ridge 60번:", "참값 ★(1, 1) 근처"]} size={10} anchor="start" color={colors.orange} weight={700} gap={1.4} />
      <line x1={330} y1={14} x2={330} y2={240} stroke="var(--border-hairline)" />
      <text x={E.left + E.width / 2} y={18} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        XᵀX의 고유값 (로그 눈금)
      </text>
      <Axes {...E} sx={linear(0, 1, E.left, E.left + E.width)} sy={ey} yTicks={[0.01, 0.1, 1, 10, 100]} fmtY={pow10Label} />
      {groups.map((g) => (
        <g key={g.t}>
          {g.vals.map((v, j) => {
            const x = g.x - 34 + j * 40;
            return (
              <g key={j}>
                <rect x={x} y={ey(v)} width={28} height={ey(0.01) - ey(v)} rx={3} fill={g.c} fillOpacity={j === 0 ? 0.35 : 0.75} />
                <text x={x + 14} y={ey(v) - 5} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
                  {v >= 10 ? v.toFixed(1) : v.toFixed(v < 0.1 ? 3 : 2)}
                </text>
              </g>
            );
          })}
          <text x={g.x} y={E.top + E.height + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill={g.c}>
            {g.t}
          </text>
          <text x={g.x} y={E.top + E.height + 32} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
            {g.k}
          </text>
        </g>
      ))}
      <text x={530} y={ey(0.2)} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.green}>
        + λ
      </text>
      <line x1={496} y1={ey(0.0377)} x2={576} y2={ey(1.0377)} stroke={colors.green} strokeWidth={1.4} strokeDasharray="4 3" />
    </DiagramFrame>
  );
}

export function SeparableLogistic() {
  // 선형분리 가능한 2차원 데이터 20개(numpy 시드 37), 절편 없는 로지스틱 회귀, 규제 없음, 경사하강법 학습률 1.
  // SEP_TRACE: [스텝 t, ‖w‖, w의 각도(도)]. 하드 마진 SVM(절편 없음)의 방향 87.77°, 마진 0.635, 서포트 벡터 2개.
  const pts = (s: string) => s.split(" ").map((p) => p.split(",").map(Number));
  const S = 38;
  const G = { left: 30, top: 30, width: 6.2 * S, height: 4 * S };
  const sx = (x: number) => G.left + (x + 3.2) * S;
  const sy = (y: number) => G.top + (2 - y) * S;
  const svmDeg = 87.77;
  const margin = 0.635;
  const seg = (deg: number, off = 0) => {
    const r = (deg * Math.PI) / 180;
    const [c, s] = [Math.cos(r), Math.sin(r)];
    return { x1: sx(off * c + 6 * s), y1: sy(off * s - 6 * c), x2: sx(off * c - 6 * s), y2: sy(off * s + 6 * c) };
  };
  const at = (t: number) => SEP_TRACE.find((r) => r[0] === t) as number[];
  const bounds = [
    { t: 10, label: "t = 10", c: colors.yellow },
    { t: 100, label: "t = 100", c: colors.orange },
    { t: 10000, label: "t = 10⁴", c: colors.violet },
  ];
  const T1 = { left: 372, top: 24, width: 320, height: 76 };
  const T2 = { left: 372, top: 142, width: 320, height: 76 };
  const tx = log10Scale(1, 1e6, T1.left, T1.left + T1.width);
  const ny = linear(0, 18, T1.top + T1.height, T1.top);
  const dy = linear(30, 90, T2.top + T2.height, T2.top);
  const tTicks = [1, 10, 100, 1e3, 1e4, 1e5, 1e6];
  return (
    <DiagramFrame
      title="선형분리 데이터의 로지스틱 회귀: ‖w‖는 끝없이 커지고, 방향은 SVM으로 간다"
      caption="선형분리 가능한 2차원 데이터 20개(원 = 양성, 네모 = 음성)에 절편 없는 로지스틱 회귀를 규제 없이 경사하강법(학습률 1)으로 학습한 실제 기록이다. 왼쪽: 결정 경계가 스텝마다 돌아가 최대 마진 SVM의 경계(초록 점선, 옆의 옅은 점선은 마진, 동그라미 친 두 점은 서포트 벡터) 쪽으로 다가간다. 오른쪽 위: 모든 점을 이미 맞힌 뒤에도 손실을 더 줄이려고 ‖w‖가 log t에 비례해 끝없이 커지고, 예측 확률은 0과 1로 치닫는다. 오른쪽 아래: w의 방향은 SVM 방향(87.8°)으로 수렴하지만 속도가 1/log t 정도로 매우 느려 100만 스텝에도 86.4°다. L2 규제를 넣으면 ‖w‖가 유한한 곳에서 멈춘다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <defs>
        <clipPath id="sepl-clip">
          <rect x={G.left} y={G.top} width={G.width} height={G.height} />
        </clipPath>
      </defs>
      <text x={G.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        결정 경계가 돌아간다
      </text>
      <rect x={G.left} y={G.top} width={G.width} height={G.height} fill="none" stroke={inkMuted} strokeOpacity={0.6} />
      <g clipPath="url(#sepl-clip)">
        <line x1={sx(-3.2)} x2={sx(3)} y1={sy(0)} y2={sy(0)} stroke={gridline} />
        <line x1={sx(0)} x2={sx(0)} y1={sy(2)} y2={sy(-2)} stroke={gridline} />
        <line {...seg(svmDeg, margin)} stroke={colors.green} strokeOpacity={0.45} strokeDasharray="3 3" />
        <line {...seg(svmDeg, -margin)} stroke={colors.green} strokeOpacity={0.45} strokeDasharray="3 3" />
        {bounds.map((b) => (
          <line key={b.t} {...seg(at(b.t)[2])} stroke={b.c} strokeWidth={1.8} />
        ))}
        <line {...seg(svmDeg)} stroke={colors.green} strokeWidth={2} strokeDasharray="6 3" />
      </g>
      {pts(SEP_POS).map(([x, y], i) => (
        <circle key={`p${i}`} cx={sx(x)} cy={sy(y)} r={4.2} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={1.2} />
      ))}
      {pts(SEP_NEG).map(([x, y], i) => (
        <rect key={`n${i}`} x={sx(x) - 4} y={sy(y) - 4} width={8} height={8} fill={colors.red} stroke="var(--surface-card)" strokeWidth={1.2} />
      ))}
      {[
        [-0.702, 0.663],
        [-2.445, -0.54],
      ].map(([x, y]) => (
        <circle key={x} cx={sx(x)} cy={sy(y)} r={8.5} fill="none" stroke={colors.green} strokeWidth={1.6} />
      ))}
      <text x={sx(-1.95)} y={sy(1.72)} fontSize={10} fontWeight={800} fill={colors.yellow} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        t = 10
      </text>
      <text x={sx(-3.1)} y={sy(1.32)} fontSize={10} fontWeight={800} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        t = 100
      </text>
      <text x={sx(-3.1)} y={sy(0.42)} fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        t = 10⁴
      </text>
      <text x={sx(2.95)} y={sy(-0.42)} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        SVM 경계
      </text>
      <Axes {...T1} sx={tx} sy={ny} xTicks={tTicks} yTicks={[0, 6, 12, 18]} fmtX={() => ""} />
      <text x={T1.left} y={T1.top - 8} fontSize={11} fontWeight={800} fill={ink}>
        ‖w‖: log t에 비례해 끝없이 커진다
      </text>
      <path d={linePath(SEP_TRACE.map((r) => [tx(r[0]), ny(r[1])] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <text x={tx(1e6) - 4} y={ny(SEP_TRACE[SEP_TRACE.length - 1][1]) + 16} textAnchor="end" fontSize={10} fontWeight={700} fill={colors.blue}>
        16.5
      </text>
      <Axes {...T2} sx={tx} sy={dy} xTicks={tTicks} yTicks={[30, 60, 90]} fmtX={pow10Label} fmtY={(v) => `${v}°`} xLabel="경사하강법 스텝 t (로그 눈금)" />
      <text x={T2.left} y={T2.top - 8} fontSize={11} fontWeight={800} fill={ink}>
        w의 방향(각도): SVM 방향으로 아주 느리게 수렴
      </text>
      <line x1={T2.left} x2={T2.left + T2.width} y1={dy(svmDeg)} y2={dy(svmDeg)} stroke={colors.green} strokeWidth={1.4} strokeDasharray="6 3" />
      <text x={tx(1.5)} y={dy(svmDeg) + 13} fontSize={10} fontWeight={800} fill={colors.green}>
        SVM 87.8°
      </text>
      <path d={linePath(SEP_TRACE.map((r) => [tx(r[0]), dy(r[2])] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <text x={tx(1e6) - 4} y={dy(86.43) + 14} textAnchor="end" fontSize={10} fontWeight={700} fill={colors.violet}>
        86.4°
      </text>
    </DiagramFrame>
  );
}

export function EnsembleCorrelation() {
  // Var(평균) = ρσ² + (1 − ρ)σ²/B, σ² = 1. 본문 시뮬레이션: B = 50, ρ = 0.5 → 0.51.
  const G = { left: 56, top: 22, width: 380, height: 186 };
  const sx = linear(1, 60, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const P = "ens";
  const rhos = [
    { r: 0.8, c: colors.red },
    { r: 0.5, c: colors.violet },
    { r: 0.2, c: colors.blue },
    { r: 0, c: colors.green },
  ];
  const v = (r: number, B: number) => r + (1 - r) / B;
  return (
    <DiagramFrame
      title="평균 내기의 한계: 상관 ρ가 분산의 바닥을 정한다"
      caption="분산이 1이고 서로의 상관이 ρ인 예측 B개를 평균했을 때의 분산 ρ + (1 − ρ)/B다. 모델을 많이 모을수록 둘째 항은 0으로 가지만 첫째 항 ρ는 그대로 남아, 곡선은 점선(바닥 ρ)에 붙는다. 상관이 0이면 50개 평균의 분산이 0.02까지 내려가지만, 상관이 0.5면 0.51에서 멈춘다(본문 시뮬레이션). 배깅만 하면 트리들이 같은 강한 특징으로 비슷하게 갈라져 ρ가 크다. 랜덤 포레스트는 분할마다 특징 일부만 후보로 줘서 개별 트리를 조금 약하게 만드는 대신 ρ를 낮춰 바닥 자체를 끌어내린다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ green: colors.green }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 10, 20, 30, 40, 50, 60]} yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]} xLabel="평균한 모델 수 B" yLabel="평균 예측의 분산" />
      {rhos.map((o) => (
        <g key={o.r}>
          {o.r > 0 && <line x1={sx(1)} x2={sx(60)} y1={sy(o.r)} y2={sy(o.r)} stroke={o.c} strokeDasharray="4 3" strokeOpacity={0.7} />}
          <path d={linePath(sample((B) => v(o.r, B), 1, 60, 240).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={o.c} strokeWidth={2.4} />
          <text x={sx(60) + 6} y={sy(v(o.r, 60)) + 4} fontSize={10.5} fontWeight={800} fill={o.c}>
            {`ρ = ${o.r}`}
          </text>
        </g>
      ))}
      <circle cx={sx(50)} cy={sy(0.51)} r={5} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
      <text x={sx(50)} y={sy(0.51) - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        B = 50 → 0.51
      </text>
      <Arr x1={sx(50)} y1={sy(0.51) + 8} x2={sx(50)} y2={sy(0.216) - 8} color={colors.green} marker={`${P}-green`} width={1.8} />
      <circle cx={sx(50)} cy={sy(0.216)} r={4} fill={colors.blue} />
      <text x={sx(50) - 8} y={sy(0.36)} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        특징 무작위 선택으로 ρ↓
      </text>
      <text x={sx(50)} y={sy(0.216) + 16} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.blue} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        0.22
      </text>
      <rect x={500} y={30} width={206} height={170} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={514} y={54} fontSize={11.5} fontWeight={800} fill={ink}>
        분산 = ρσ² + (1 − ρ)σ²/B
      </text>
      <Lines x={514} y={80} lines={["ρσ²: 모델을 아무리 모아도", "줄지 않는 바닥"]} size={10.5} anchor="start" color={colors.violet} weight={700} gap={1.4} />
      <Lines x={514} y={122} lines={["(1 − ρ)σ²/B: 모을수록", "0으로 사라지는 부분"]} size={10.5} anchor="start" color={inkSecondary} weight={700} gap={1.4} />
      <Lines x={514} y={164} lines={["→ 바닥을 낮추려면 B가 아니라", "ρ를 낮춰야 한다"]} size={10.5} anchor="start" color={colors.green} weight={800} gap={1.4} />
    </DiagramFrame>
  );
}

export function DoubleDescent() {
  // 잠재 요인 3개 z에서 나온 잡음 섞인 특징 x_j = w_jᵀz + u_j, y = θᵀz + ε(σ = 0.3), n = 40. 앞에서부터 특징 p개를 쓴다.
  // 200회 반복 시뮬레이션의 중앙값(numpy): 최소 노름 최소제곱(pinv), Ridge(λ = 4), X/√n의 가장 작은 (0이 아닌) 특이값.
  const G = { left: 60, top: 26, width: 340, height: 180 };
  const sx = log10Scale(1, 800, G.left, G.left + G.width);
  const sy = log10Scale(0.06, 40, G.top + G.height, G.top);
  const H = { left: 478, top: 26, width: 220, height: 180 };
  const hx = log10Scale(1, 800, H.left, H.left + H.width);
  const hy = log10Scale(0.01, 3, H.top + H.height, H.top);
  const xt = [1, 4, 10, 40, 100, 400];
  const path = (ys: number[], fx: (v: number) => number, fy: (v: number) => number) => linePath(DD_P.map((p, i) => [fx(p), fy(ys[i])] as [number, number]));
  return (
    <DiagramFrame
      title="이중 하강: 파라미터가 샘플보다 많아지면 테스트 오차가 다시 내려간다"
      caption="잠재 요인 3개에서 나온 잡음 섞인 특징을 앞에서부터 p개 쓰는 선형회귀를 샘플 n = 40개로 학습한 시뮬레이션이다(200회 반복의 중앙값, 두 축 모두 로그 눈금). 빨강은 최소 노름 최소제곱이다(p > n이면 훈련 데이터를 정확히 지나는 해 중 노름이 가장 작은 해). p가 작을 때는 고전적인 U자를 그리다가(p = 16에서 0.38), 보간 문턱 p = n = 40에서 16.5로 폭발하고, p > n에서 다시 내려가 p = 800에서는 0.11로 p < n의 어떤 모델보다도 낮다. 오른쪽: 정점의 원인은 X의 가장 작은 특이값이 p = n 근처에서 0에 가까워지는 것이다. 유사역행렬은 그 역수를 곱하므로 잡음이 거대하게 증폭된다. 파란 점선처럼 적당한 Ridge 규제(λ = 4)를 넣으면 정점이 사라진다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={xt} yTicks={[0.1, 0.3, 1, 3, 10, 30]} xLabel="특징(파라미터) 수 p" yLabel="테스트 오차" />
      <rect x={sx(1)} y={G.top} width={sx(40) - sx(1)} height={G.height} fill={colors.blue} fillOpacity={0.04} />
      <line x1={sx(40)} x2={sx(40)} y1={G.top} y2={G.top + G.height} stroke={ink} strokeDasharray="4 3" />
      <text x={sx(40)} y={G.top - 6} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
        p = n = 40
      </text>
      <line x1={G.left} x2={G.left + G.width} y1={sy(0.09)} y2={sy(0.09)} stroke={inkMuted} strokeDasharray="2 3" />
      <text x={sx(1.1)} y={sy(0.09) - 5} fontSize={9.5} fill={inkSecondary}>
        잡음 바닥 σ² = 0.09
      </text>
      <path d={path(DD_RIDGE, sx, sy)} fill="none" stroke={colors.blue} strokeWidth={2} strokeDasharray="6 3" />
      <path d={path(DD_MN, sx, sy)} fill="none" stroke={colors.red} strokeWidth={2.4} />
      <circle cx={sx(16)} cy={sy(0.3781)} r={4} fill={colors.red} />
      <text x={sx(16)} y={sy(0.3781) + 16} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        U자의 바닥 0.38
      </text>
      <circle cx={sx(800)} cy={sy(0.1088)} r={4} fill={colors.red} />
      <text x={sx(800) - 4} y={sy(0.1088) - 9} textAnchor="end" fontSize={9.5} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        0.11
      </text>
      <text x={sx(40) + 6} y={sy(16.5) + 4} fontSize={9.5} fontWeight={800} fill={colors.red}>
        16.5
      </text>
      <text x={sx(1.15)} y={sy(22)} fontSize={10} fontWeight={800} fill={colors.blue}>
        p &lt; n: 고전적 U자
      </text>
      <text x={sx(700)} y={sy(22)} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.red}>
        p &gt; n: 다시 하강
      </text>
      <line x1={sx(1.3)} x2={sx(2.2)} y1={sy(6)} y2={sy(6)} stroke={colors.red} strokeWidth={2.4} />
      <text x={sx(2.4)} y={sy(6) + 3.5} fontSize={9.5} fontWeight={700} fill={colors.red}>
        최소 노름 해
      </text>
      <line x1={sx(1.3)} x2={sx(2.2)} y1={sy(3.2)} y2={sy(3.2)} stroke={colors.blue} strokeWidth={2} strokeDasharray="6 3" />
      <text x={sx(2.4)} y={sy(3.2) + 3.5} fontSize={9.5} fontWeight={700} fill={colors.blue}>
        Ridge (λ = 4)
      </text>
      <Axes {...H} sx={hx} sy={hy} xTicks={[1, 10, 40, 400]} yTicks={[0.01, 0.1, 1]} fmtY={(v) => String(v)} xLabel="p" />
      <text x={H.left} y={H.top - 8} fontSize={11} fontWeight={800} fill={ink}>
        X의 가장 작은 특이값
      </text>
      <line x1={hx(40)} x2={hx(40)} y1={H.top} y2={H.top + H.height} stroke={ink} strokeDasharray="4 3" />
      <path d={path(DD_SMIN, hx, hy)} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <Lines x={hx(50) + 2} y={hy(0.032)} lines={["p = n에서 거의 0", "→ 잡음 증폭"]} size={9.5} anchor="start" color={colors.violet} weight={800} gap={1.35} />
    </DiagramFrame>
  );
}

export function FoldOverlap() {
  // 5-Fold에서 fold k는 블록 k로 검증하고 나머지 4블록으로 훈련한다. 어느 두 fold든 훈련 블록 3개가 같다(75%).
  const bw = 50;
  const bh = 24;
  const x0 = 78;
  const y0 = 44;
  const bx = (j: number) => x0 + j * (bw + 2);
  const by = (k: number) => y0 + k * 32;
  const scores = [0.95, 0.97, 0.96, 0.99, 0.98];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const ss = scores.reduce((a, b) => a + (b - mean) ** 2, 0);
  const sd0 = Math.sqrt(ss / 5);
  const sd1 = Math.sqrt(ss / 4);
  const dx = linear(0.94, 1.0, 498, 690);
  return (
    <DiagramFrame
      title="fold 점수는 독립 표본이 아니다: 훈련 데이터가 75%씩 겹친다"
      caption="5-Fold 교차검증에서 각 fold는 블록 하나(주황)로 검증하고 나머지 넷(파랑)으로 훈련한다. fold 1과 fold 2의 훈련 데이터를 비교하면 블록 3·4·5가 같아 4블록 중 3블록(75%)이 겹친다. 어느 두 fold를 골라도 마찬가지라, 다섯 점수는 서로 상관된 값이고 독립 표본처럼 다룰 수 없다. 그래서 '0.97 ± 0.01'의 ±는 점수의 흩어짐을 요약한 것일 뿐 신뢰구간이 아니다. 오른쪽: 같은 점수 5개라도 N으로 나누는 np.std(ddof=0)와 N − 1로 나누는 pandas의 .std()(ddof=1)는 √(5/4) ≈ 1.12배, 약 12% 다르다. 리포트에는 무엇을 계산했는지 밝힌다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <text x={x0} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        5-Fold: 블록 5개를 돌아가며 검증
      </text>
      <rect x={bx(2) - 4} y={by(0) - 4} width={3 * (bw + 2) + 6} height={32 + bh + 8} rx={6} fill={colors.green} fillOpacity={0.08} stroke={colors.green} strokeWidth={1.6} />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <text x={x0 - 8} y={by(k) + 16} textAnchor="end" fontSize={10.5} fontWeight={700} fill={k < 2 ? ink : inkSecondary}>
            {`fold ${k + 1}`}
          </text>
          {[0, 1, 2, 3, 4].map((j) => (
            <rect key={j} x={bx(j)} y={by(k)} width={bw} height={bh} rx={3} fill={j === k ? colors.orange : colors.blue} fillOpacity={j === k ? 0.75 : k < 2 ? 0.45 : 0.22} />
          ))}
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((j) => (
        <text key={j} x={bx(j) + bw / 2} y={by(4) + bh + 15} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {`블록 ${j + 1}`}
        </text>
      ))}
      <Lines x={bx(5) + 8} y={by(0) + 12} lines={["fold 1과 2의", "훈련 데이터:", "4블록 중 3블록", "같다 (75%)"]} size={10.5} anchor="start" color={colors.green} weight={800} gap={1.35} />
      <rect x={bx(5) + 8} y={by(3) + 2} width={12} height={10} fill={colors.blue} fillOpacity={0.45} />
      <text x={bx(5) + 24} y={by(3) + 11} fontSize={10} fill={inkSecondary}>
        훈련
      </text>
      <rect x={bx(5) + 8} y={by(3) + 20} width={12} height={10} fill={colors.orange} fillOpacity={0.75} />
      <text x={bx(5) + 24} y={by(3) + 29} fontSize={10} fill={inkSecondary}>
        검증
      </text>
      <line x1={470} y1={14} x2={470} y2={222} stroke="var(--border-hairline)" />
      <text x={490} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        같은 점수 5개, 다른 표준편차
      </text>
      <line x1={dx(0.94)} x2={dx(1.0)} y1={66} y2={66} stroke={inkMuted} />
      {[0.94, 0.96, 0.98, 1.0].map((t) => (
        <text key={t} x={dx(t)} y={82} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t.toFixed(2)}
        </text>
      ))}
      {scores.map((s) => (
        <circle key={s} cx={dx(s)} cy={58} r={5} fill={colors.violet} />
      ))}
      <line x1={dx(mean)} x2={dx(mean)} y1={44} y2={70} stroke={ink} strokeWidth={1.4} />
      <text x={dx(mean)} y={40} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={ink}>
        {`평균 ${mean.toFixed(2)}`}
      </text>
      <text x={490} y={112} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
        np.std(scores)
      </text>
      <text x={700} y={112} textAnchor="end" fontSize={11} fontWeight={800} fill={colors.blue} fontFamily={mono}>
        {sd0.toFixed(4)}
      </text>
      <text x={490} y={128} fontSize={9.5} fill={inkSecondary}>
        ddof=0: N으로 나눈다
      </text>
      <text x={490} y={154} fontSize={10.5} fontWeight={700} fill={ink} fontFamily={mono}>
        pd.Series(scores).std()
      </text>
      <text x={700} y={154} textAnchor="end" fontSize={11} fontWeight={800} fill={colors.orange} fontFamily={mono}>
        {sd1.toFixed(4)}
      </text>
      <text x={490} y={170} fontSize={9.5} fill={inkSecondary}>
        ddof=1: N − 1로 나눈다
      </text>
      <Lines x={490} y={198} lines={["비율 √(5/4) ≈ 1.12 → 약 12% 차이", "어느 쪽도 평균의 신뢰구간은 아니다"]} size={10} anchor="start" color={ink} weight={700} gap={1.5} />
    </DiagramFrame>
  );
}

export function WinnersCurse() {
  // 순수한 잡음 데이터(특징 5개, 레이블 무작위, n = 100)에 KNN의 k 후보 7개로 GridSearchCV(5-fold)를 400번 반복한 실제 결과(sklearn).
  // 구간 0.30~0.74(폭 0.02)의 도수. 중첩 교차검증은 100번 반복.
  const edges = Array.from({ length: 22 }, (_, i) => 0.3 + i * 0.02);
  const single = [0, 0, 1, 6, 12, 15, 21, 35, 55, 53, 57, 45, 43, 22, 17, 10, 5, 1, 2, 0, 0, 0];
  const best = [0, 0, 0, 0, 0, 1, 2, 10, 20, 32, 44, 62, 67, 68, 35, 28, 20, 8, 2, 1, 0, 0];
  const G = { left: 52, top: 26, width: 360, height: 170 };
  const sx = linear(0.34, 0.72, G.left, G.left + G.width);
  const sy = linear(0, 70, G.top + G.height, G.top);
  const rows = [
    { t: "k = 7을 미리 고정", m: 0.506, s: 0.057, c: inkSecondary },
    { t: "best_score_ (7개 중 최고)", m: 0.554, s: 0.048, c: colors.red },
    { t: "중첩 교차검증", m: 0.496, s: 0.056, c: colors.green },
  ];
  const mx = linear(0.4, 0.66, 600, 700);
  return (
    <DiagramFrame
      title="승자의 저주: 가장 좋은 점수를 고르면 그 점수는 부풀려진다"
      caption="참 정확도가 0.5일 수밖에 없는 순수한 잡음 데이터(레이블 무작위, 샘플 100개)에서 KNN의 k 후보 7개를 5-fold GridSearchCV로 고르는 실험을 400번 반복한 실제 결과다. 회색: 미리 정해 둔 k = 7 하나의 교차검증 점수는 0.5 근처에 고르게 흩어진다(평균 0.506). 빨강: 7개 중 가장 좋은 점수인 best_score_는 오른쪽으로 밀려 평균 0.554, 중앙값 0.56이다. 잡음뿐인데도 '56% 맞히는 모델'로 보고될 수 있다. 오른쪽: 고르는 과정까지 바깥 fold로 평가하는 중첩 교차검증은 평균 0.496으로 참값을 되찾는다(100번 반복). 후보가 많을수록, 데이터가 적을수록 부풀림이 커진다."
      viewBox="0 0 720 256"
      minWidth={620}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0.4, 0.5, 0.6, 0.7]} yTicks={[0, 20, 40, 60]} xLabel="교차검증 정확도" yLabel="횟수 (400번 중)" />
      {edges.map((e, i) =>
        e >= 0.34 && e < 0.72 ? (
          <g key={e}>
            <rect x={sx(e) + 1} y={sy(single[i])} width={sx(e + 0.02) - sx(e) - 2} height={sy(0) - sy(single[i])} fill={inkMuted} fillOpacity={0.45} />
            <rect x={sx(e) + 1} y={sy(best[i])} width={sx(e + 0.02) - sx(e) - 2} height={sy(0) - sy(best[i])} fill={colors.red} fillOpacity={0.22} stroke={colors.red} strokeWidth={1.2} />
          </g>
        ) : null,
      )}
      <line x1={sx(0.5)} x2={sx(0.5)} y1={G.top} y2={G.top + G.height} stroke={ink} strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={sx(0.5)} y={G.top - 7} textAnchor="end" fontSize={10} fontWeight={800} fill={ink}>
        참 정확도 0.5
      </text>
      <line x1={sx(0.554)} x2={sx(0.554)} y1={G.top - 4} y2={G.top + G.height} stroke={colors.red} strokeWidth={1.6} />
      <text x={sx(0.554) + 4} y={G.top - 7} fontSize={10} fontWeight={800} fill={colors.red}>
        best_score_ 평균 0.554
      </text>
      <rect x={sx(0.352)} y={G.top + 6} width={12} height={10} fill={inkMuted} fillOpacity={0.45} />
      <text x={sx(0.352) + 16} y={G.top + 15} fontSize={10} fill={inkSecondary}>
        미리 정한 k = 7
      </text>
      <rect x={sx(0.352)} y={G.top + 24} width={12} height={10} fill={colors.red} fillOpacity={0.22} stroke={colors.red} />
      <text x={sx(0.352) + 16} y={G.top + 33} fontSize={10} fill={inkSecondary}>
        7개 중 최고 점수
      </text>
      <line x1={440} y1={14} x2={440} y2={236} stroke="var(--border-hairline)" />
      <text x={456} y={24} fontSize={11.5} fontWeight={800} fill={ink}>
        평균 ± 표준편차
      </text>
      <line x1={mx(0.5)} x2={mx(0.5)} y1={40} y2={196} stroke={ink} strokeDasharray="4 3" />
      {rows.map((r, i) => {
        const y = 66 + i * 52;
        return (
          <g key={r.t}>
            <Lines x={456} y={y} lines={[r.t, r.m.toFixed(3)]} size={10.5} anchor="start" color={r.c} weight={800} gap={1.4} />
            <line x1={mx(r.m - r.s)} x2={mx(r.m + r.s)} y1={y + 2} y2={y + 2} stroke={r.c} strokeWidth={2} />
            <circle cx={mx(r.m)} cy={y + 2} r={5} fill={r.c} />
          </g>
        );
      })}
      {[0.4, 0.5, 0.6].map((t) => (
        <text key={t} x={mx(t)} y={214} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t.toFixed(1)}
        </text>
      ))}
    </DiagramFrame>
  );
}

export function NestedCv() {
  // 중첩 교차검증의 구조: 바깥 5-fold × 안쪽 4-fold. 바깥 fold 1을 펼쳐 보인다.
  const P = "ncv";
  const ow = 62;
  const ox = (j: number) => 40 + j * (ow + 2);
  const iw = 60;
  const ix = (j: number) => ox(1) + j * (iw + 2);
  const iy = (k: number) => 104 + k * 24;
  const chosen = ["C = 1", "C = 1", "C = 10", "C = 1", "C = 0.1"];
  return (
    <DiagramFrame
      title="중첩 교차검증: 고르는 과정까지 바깥 fold로 평가한다"
      caption="바깥 교차검증(여기서는 5-fold)의 각 fold마다 바깥 테스트 블록(빨강)을 떼어 두고, 나머지 바깥 훈련 데이터 안에서만 안쪽 교차검증(4-fold)으로 하이퍼파라미터 후보를 비교해 하나를 고른다. 고른 설정으로 바깥 훈련 데이터 전체에 다시 학습한 뒤, 한 번도 고르는 데 쓰이지 않은 바깥 테스트 블록으로 평가한다. 이것을 바깥 fold 5개에 반복해 얻은 점수의 평균이 '이 튜닝 절차로 만든 모델'의 성능 추정이다. fold마다 고른 설정이 달라도 괜찮다. 평가 대상이 특정 설정이 아니라 고르는 절차이기 때문이다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={40} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        바깥 fold 1을 펼쳐 보면
      </text>
      {[0, 1, 2, 3, 4].map((j) => (
        <rect key={j} x={ox(j)} y={34} width={ow} height={24} rx={3} fill={j === 0 ? colors.red : colors.blue} fillOpacity={j === 0 ? 0.7 : 0.4} />
      ))}
      <text x={ox(0) + ow / 2} y={50} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
        바깥 테스트
      </text>
      <text x={(ox(1) + ox(4) + ow) / 2} y={50} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
        바깥 훈련 (이 안에서만 고른다)
      </text>
      <path d={`M${ox(1)},64 L${ox(1)},70 L${ox(4) + ow},70 L${ox(4) + ow},64`} fill="none" stroke={inkSecondary} />
      <Arr x1={(ox(1) + ox(4) + ow) / 2} y1={70} x2={(ox(1) + ox(4) + ow) / 2} y2={92} color={inkSecondary} marker={`${P}-ink`} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <text x={ix(0) - 8} y={iy(k) + 13} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
            {`안쪽 ${k + 1}`}
          </text>
          {[0, 1, 2, 3].map((j) => (
            <rect key={j} x={ix(j)} y={iy(k)} width={iw} height={18} rx={2} fill={j === k ? colors.orange : colors.blue} fillOpacity={j === k ? 0.7 : 0.25} />
          ))}
        </g>
      ))}
      <text x={ix(0)} y={iy(4) + 10} fontSize={10} fontWeight={700} fill={inkSecondary}>
        후보 7개 각각을 안쪽 4-fold로 채점
      </text>
      <Tag x={364} y={96} w={146} h={40} lines={["① 안쪽 CV 점수가", "가장 좋은 설정 선택"]} color={colors.orange} size={10.5} />
      <Tag x={364} y={146} w={146} h={40} lines={["② 그 설정으로 바깥", "훈련 전체에 재학습"]} color={colors.blue} size={10.5} />
      <Tag x={364} y={196} w={146} h={40} lines={["③ 바깥 테스트로 한 번", "평가 → 점수₁"]} color={colors.red} size={10.5} />
      <Arr x1={437} y1={136} x2={437} y2={144} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={437} y1={186} x2={437} y2={194} color={inkSecondary} marker={`${P}-ink`} />
      <line x1={520} y1={14} x2={520} y2={248} stroke="var(--border-hairline)" />
      <text x={536} y={22} fontSize={11.5} fontWeight={800} fill={ink}>
        바깥 fold 5개 반복
      </text>
      {chosen.map((c, k) => (
        <g key={k}>
          {[0, 1, 2, 3, 4].map((j) => (
            <rect key={j} x={536 + j * 18} y={36 + k * 26} width={16} height={18} rx={2} fill={j === k ? colors.red : colors.blue} fillOpacity={j === k ? 0.7 : 0.3} />
          ))}
          <text x={632} y={49 + k * 26} fontSize={10} fontWeight={700} fill={ink}>
            {c}
          </text>
          <text x={704} y={49 + k * 26} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.red}>
            {`점수${"₁₂₃₄₅"[k]}`}
          </text>
        </g>
      ))}
      <Lines x={536} y={182} lines={["평균(점수₁…점수₅)", "= 이 튜닝 절차의 성능", "고른 설정은 달라도 된다"]} size={10.5} anchor="start" color={ink} weight={700} gap={1.45} />
      <text x={40} y={246} fontSize={10} fill={inkSecondary} fontFamily={mono}>
        cross_val_score(GridSearchCV(…), X, y, cv=outer)
      </text>
    </DiagramFrame>
  );
}

export function PairedT() {
  // 유방암 데이터(sklearn load_breast_cancer), 5-fold × 3회 반복의 같은 분할 15개에서 로지스틱 회귀(표준화) vs 랜덤 포레스트(트리 200개).
  // 차이 평균 0.0105, 표준편차 0.0163. 보통 t = 2.50(p = 0.026), Nadeau–Bengio 보정 t = 1.15(p = 0.27), 자유도 14.
  const A = [0.9561, 0.9737, 0.9825, 1.0, 0.9823, 0.9386, 0.9912, 0.9561, 0.9825, 0.9912, 0.9737, 0.9912, 0.9649, 0.9737, 0.9735];
  const Bs = [0.9386, 0.9649, 0.9825, 0.9561, 0.9912, 0.9561, 0.9737, 0.9649, 0.9561, 0.9646, 0.9561, 0.9737, 0.9649, 0.9737, 0.9558];
  const d = A.map((a, i) => a - Bs[i]);
  const G1 = { left: 50, top: 30, width: 220, height: 160 };
  const x1 = linear(0.5, 15.5, G1.left, G1.left + G1.width);
  const y1 = linear(0.93, 1.0, G1.top + G1.height, G1.top);
  const G2 = { left: 318, top: 30, width: 200, height: 160 };
  const x2 = linear(-0.03, 0.05, G2.left, G2.left + G2.width);
  const G3 = { left: 572, top: 30, width: 130, height: 160 };
  const x3 = linear(1, 50, G3.left, G3.left + G3.width);
  const y3 = linear(0, 1, G3.top + G3.height, G3.top);
  const stack = new Map<number, number>();
  const dots = d.map((v) => {
    const key = Math.round(v * 400) / 400;
    const n = stack.get(key) ?? 0;
    stack.set(key, n + 1);
    return { x: x2(key), y: G2.top + 66 - n * 9 };
  });
  const cis = [
    { t: "보통 t: p = 0.026", lo: 0.0015, hi: 0.0196, c: colors.red, y: G2.top + 104 },
    { t: "보정 t: p = 0.27", lo: -0.0092, hi: 0.0303, c: colors.green, y: G2.top + 140 },
  ];
  return (
    <DiagramFrame
      title="두 모델 비교: 같은 분할의 짝지은 차이와 보정된 t 검정"
      caption="유방암 데이터(sklearn)에서 로지스틱 회귀와 랜덤 포레스트를 같은 분할 15개(5-fold × 3회 반복)로 평가한 실제 결과다. 왼쪽: 분할마다 두 점수가 함께 오르내리므로 분할의 난이도를 상쇄하도록 분할별 차이 d를 본다. 가운데: 차이의 평균은 0.0105다. 평범한 t 검정으로 구간을 만들면 0을 포함하지 않아 p = 0.026으로 '유의'해 보이지만, 훈련 데이터의 겹침을 반영한 Nadeau–Bengio 보정을 하면 구간이 0을 포함하고 p = 0.27이다. 오른쪽: 표준오차를 표본표준편차 s의 몇 배로 잡는지다. 보통 t는 1/√J라 반복을 늘릴수록 0으로 줄지만, 보정 t는 √(1/J + 0.25)라 0.5 밑으로 내려가지 않는다. 반복을 많이 해서 유의하게 만드는 착시를 막는 장치다."
      viewBox="0 0 720 256"
      minWidth={640}
    >
      <text x={G1.left} y={18} fontSize={11} fontWeight={800} fill={ink}>
        분할 15개의 정확도
      </text>
      <Axes {...G1} sx={x1} sy={y1} yTicks={[0.94, 0.96, 0.98, 1]} fmtY={(v) => v.toFixed(2)} xLabel="분할 (5-fold × 3회)" />
      {[5.5, 10.5].map((s) => (
        <line key={s} x1={x1(s)} x2={x1(s)} y1={G1.top} y2={G1.top + G1.height} stroke={inkMuted} strokeDasharray="3 3" />
      ))}
      {A.map((a, i) => (
        <g key={i}>
          <line x1={x1(i + 1)} x2={x1(i + 1)} y1={y1(a)} y2={y1(Bs[i])} stroke={inkMuted} strokeWidth={1.2} />
          <rect x={x1(i + 1) - 3.5} y={y1(Bs[i]) - 3.5} width={7} height={7} fill={colors.orange} />
          <circle cx={x1(i + 1)} cy={y1(a)} r={3.8} fill={colors.blue} />
        </g>
      ))}
      <circle cx={G1.left + 8} cy={G1.top + G1.height + 40} r={3.8} fill={colors.blue} />
      <text x={G1.left + 16} y={G1.top + G1.height + 44} fontSize={10} fontWeight={700} fill={colors.blue}>
        로지스틱 0.975
      </text>
      <rect x={G1.left + 116} y={G1.top + G1.height + 36.5} width={7} height={7} fill={colors.orange} />
      <text x={G1.left + 128} y={G1.top + G1.height + 44} fontSize={10} fontWeight={700} fill={colors.orange}>
        랜덤 포레스트 0.965
      </text>
      <text x={G2.left} y={18} fontSize={11} fontWeight={800} fill={ink}>
        차이 d = 로지스틱 − RF
      </text>
      <line x1={G2.left} x2={G2.left + G2.width} y1={G2.top + G2.height} y2={G2.top + G2.height} stroke={inkMuted} strokeWidth={1.2} />
      {[-0.02, 0, 0.02, 0.04].map((t) => (
        <text key={t} x={x2(t)} y={G2.top + G2.height + 15} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
          {t === 0 ? "0" : t.toFixed(2).replace("-", "−")}
        </text>
      ))}
      <line x1={x2(0)} x2={x2(0)} y1={G2.top} y2={G2.top + G2.height} stroke={ink} strokeDasharray="4 3" />
      {dots.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.violet} fillOpacity={0.8} />
      ))}
      <text x={x2(0.0105)} y={G2.top + 84} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.violet}>
        평균 0.0105
      </text>
      {cis.map((c) => (
        <g key={c.t}>
          <line x1={x2(c.lo)} x2={x2(c.hi)} y1={c.y} y2={c.y} stroke={c.c} strokeWidth={3} />
          <line x1={x2(c.lo)} x2={x2(c.lo)} y1={c.y - 6} y2={c.y + 6} stroke={c.c} strokeWidth={2} />
          <line x1={x2(c.hi)} x2={x2(c.hi)} y1={c.y - 6} y2={c.y + 6} stroke={c.c} strokeWidth={2} />
          <circle cx={x2(0.0105)} cy={c.y} r={4} fill={c.c} />
          <text x={x2(-0.029)} y={c.y - 9} fontSize={10} fontWeight={800} fill={c.c}>
            {c.t}
          </text>
        </g>
      ))}
      <text x={G2.left + G2.width / 2} y={G2.top + G2.height + 32} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
        95% 구간: 0을 포함하는가?
      </text>
      <text x={G3.left - 6} y={18} fontSize={11} fontWeight={800} fill={ink}>
        표준오차 ÷ s
      </text>
      <Axes {...G3} sx={x3} sy={y3} xTicks={[1, 15, 30, 50]} yTicks={[0, 0.5, 1]} xLabel="평가 횟수 J" />
      <line x1={G3.left} x2={G3.left + G3.width} y1={y3(0.5)} y2={y3(0.5)} stroke={colors.green} strokeDasharray="4 3" />
      <path d={linePath(sample((J) => 1 / Math.sqrt(J), 1, 50, 120).map(([x, y]) => [x3(x), y3(y)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={2.2} />
      <path d={linePath(sample((J) => Math.sqrt(1 / J + 0.25), 1, 50, 120).map(([x, y]) => [x3(x), y3(y)] as [number, number]))} fill="none" stroke={colors.green} strokeWidth={2.2} />
      <circle cx={x3(15)} cy={y3(1 / Math.sqrt(15))} r={3.5} fill={colors.red} />
      <circle cx={x3(15)} cy={y3(Math.sqrt(1 / 15 + 0.25))} r={3.5} fill={colors.green} />
      <text x={x3(50)} y={y3(0.5) - 18} textAnchor="end" fontSize={9.5} fontWeight={800} fill={colors.green}>
        보정: 바닥 0.5
      </text>
      <text x={x3(50)} y={y3(1 / Math.sqrt(50)) - 7} textAnchor="end" fontSize={9.5} fontWeight={800} fill={colors.red}>
        보통: 1/√J → 0
      </text>
    </DiagramFrame>
  );
}

export function McnemarTest() {
  // 본문 예제: 테스트셋 200개, A만 맞힘 b = 8, B만 맞힘 c = 2 → χ² = (|8 − 2| − 1)²/10 = 2.5, p ≈ 0.11. b = 40, c = 10이면 χ² ≈ 16.8.
  const cell = 92;
  const tx0 = 96;
  const ty0 = 48;
  const chi = (x: number) => Math.exp(-x / 2) / Math.sqrt(2 * Math.PI * x);
  const G = { left: 452, top: 30, width: 248, height: 150 };
  const sx = linear(0, 18, G.left, G.left + G.width);
  const sy = linear(0, 0.8, G.top + G.height, G.top);
  const tail = sample(chi, 3.84, 18, 80).map(([x, y]) => [sx(x), sy(y)] as [number, number]);
  return (
    <DiagramFrame
      title="McNemar 검정: 결론을 가르는 것은 엇갈린 샘플의 수다"
      caption="본문 예제다. 테스트셋 200개에서 두 모델이 같은 결과를 낸 190개(둘 다 맞히거나 둘 다 틀림, 회색)는 우열에 대한 정보가 없어 비교에서 빠지고, A만 맞힌 b = 8개와 B만 맞힌 c = 2개만 쓴다. 통계량 χ² = (|b − c| − 1)²/(b + c) = 2.5는 자유도 1인 카이제곱 분포에서 5% 기준값 3.84(빨간 영역의 시작)보다 작아 p ≈ 0.11이다. 엇갈린 샘플이 10개뿐이라 증거가 부족하다. 같은 4 : 1 비율이라도 b = 40, c = 10이면 χ² ≈ 16.8로 분명히 유의하다."
      viewBox="0 0 720 260"
      minWidth={600}
    >
      <text x={tx0 + cell} y={22} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        모델 B
      </text>
      <text x={tx0 + cell / 2} y={40} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        맞힘
      </text>
      <text x={tx0 + cell * 1.5} y={40} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        틀림
      </text>
      <text transform={`translate(${tx0 - 46}, ${ty0 + cell}) rotate(-90)`} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
        모델 A
      </text>
      <text x={tx0 - 8} y={ty0 + cell / 2 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        맞힘
      </text>
      <text x={tx0 - 8} y={ty0 + cell * 1.5 + 4} textAnchor="end" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        틀림
      </text>
      <rect x={tx0} y={ty0} width={cell} height={cell} fill={inkMuted} fillOpacity={0.14} stroke="var(--border-strong)" />
      <rect x={tx0 + cell} y={ty0 + cell} width={cell} height={cell} fill={inkMuted} fillOpacity={0.14} stroke="var(--border-strong)" />
      <rect x={tx0 + cell} y={ty0} width={cell} height={cell} fill={colors.blue} fillOpacity={0.18} stroke={colors.blue} strokeWidth={2} />
      <rect x={tx0} y={ty0 + cell} width={cell} height={cell} fill={colors.orange} fillOpacity={0.18} stroke={colors.orange} strokeWidth={2} />
      <Lines x={tx0 + cell / 2} y={ty0 + cell / 2 - 2} lines={["둘 다 맞힘", "비교에 안 씀"]} size={10} color={inkSecondary} gap={1.5} />
      <Lines x={tx0 + cell * 1.5} y={ty0 + cell * 1.5 - 2} lines={["둘 다 틀림", "비교에 안 씀"]} size={10} color={inkSecondary} gap={1.5} />
      <text x={tx0 + cell} y={ty0 + 2 * cell + 18} textAnchor="middle" fontSize={10} fontWeight={700} fill={inkSecondary}>
        회색 두 칸의 합 = 190개
      </text>
      <Lines x={tx0 + cell * 1.5} y={ty0 + cell / 2 - 2} lines={["b = 8", "A만 맞힘"]} size={13} color={colors.blue} weight={800} gap={1.3} />
      <Lines x={tx0 + cell / 2} y={ty0 + cell * 1.5 - 2} lines={["c = 2", "B만 맞힘"]} size={13} color={colors.orange} weight={800} gap={1.3} />
      <Lines x={300} y={96} lines={["χ² = (|b − c| − 1)² / (b + c)", "= (|8 − 2| − 1)² / 10", "= 2.5"]} size={11} anchor="start" color={ink} weight={700} gap={1.6} />
      <text x={300} y={168} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        p ≈ 0.11: 증거 부족
      </text>
      <text x={G.left} y={18} fontSize={11} fontWeight={800} fill={ink}>
        자유도 1인 카이제곱 분포
      </text>
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 3.84, 10, 16.8]} yTicks={[]} fmtX={(v) => (v === 0 ? "0" : String(v))} xLabel="χ²" />
      <path d={`M${sx(3.84)},${sy(0)} ${linePath(tail).replace("M", "L")} L${sx(18)},${sy(0)} Z`} fill={colors.red} fillOpacity={0.18} />
      <path d={linePath(sample(chi, 0.2, 18, 200).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={ink} strokeWidth={2} />
      <line x1={sx(3.84)} x2={sx(3.84)} y1={G.top + 30} y2={sy(0)} stroke={colors.red} strokeDasharray="4 3" />
      <text x={sx(3.84) + 4} y={G.top + 40} fontSize={9.5} fontWeight={800} fill={colors.red}>
        5% 기준 3.84
      </text>
      <line x1={sx(2.5)} x2={sx(2.5)} y1={sy(chi(2.5)) - 30} y2={sy(0)} stroke={colors.blue} strokeWidth={2} />
      <text x={sx(2.5) - 4} y={sy(chi(2.5)) - 34} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.blue}>
        2.5
      </text>
      <line x1={sx(16.8)} x2={sx(16.8)} y1={sy(0.25)} y2={sy(0)} stroke={colors.violet} strokeWidth={2} />
      <Lines x={sx(16.8)} y={sy(0.25) - 18} lines={["b = 40, c = 10", "p < 0.001"]} size={9.5} anchor="middle" color={colors.violet} weight={800} gap={1.3} />
    </DiagramFrame>
  );
}
