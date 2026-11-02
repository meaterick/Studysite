import DiagramFrame, { colors, ink, inkSecondary, inkMuted } from "./DiagramFrame";
import { Axes, linear, seeded, gaussian } from "./chart";

const halo = { stroke: "var(--surface-card)", strokeWidth: 3.5, paintOrder: "stroke" as const };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** 모집단, 무작위 표본, 소득이 높을수록 응답하기 쉬운 설문의 응답자: 표본평균 비교 */
export function SamplingBias() {
  const rand = seeded(7);
  // 소득(백만 원): 로그정규분포. 모집단 1,200명.
  const population = Array.from({ length: 1200 }, () => Math.min(195, Math.exp(3.4 + 0.5 * gaussian(rand))));
  const pick = (k: number, weight: (x: number) => number) => {
    const out: number[] = [];
    while (out.length < k) {
      const x = population[Math.floor(rand() * population.length)];
      if (rand() < weight(x)) out.push(x);
    }
    return out;
  };
  const randomSample = pick(120, () => 1);
  const biasedSample = pick(120, (x) => Math.min(1, (x / 90) ** 2));
  const rows = [
    { label: "모집단 1,200명", data: population, color: inkMuted, r: 1.6 },
    { label: "무작위 표본 120명", data: randomSample, color: colors.blue, r: 2.4 },
    { label: "설문 응답자 120명", data: biasedSample, color: colors.orange, r: 2.4 },
  ];
  const left = 150;
  const right = 690;
  const sx = linear(0, 200, left, right);
  const popMean = mean(population);
  return (
    <DiagramFrame
      title="표본편향: 뽑는 방법이 치우치면 표본평균도 치우친다"
      caption="한 지역 주민 1,200명의 소득(회색)에서 무작위로 뽑은 120명(파랑)의 평균은 모집단 평균에 가깝다. 소득이 높을수록 응답할 확률이 높은 설문으로 모은 120명(주황)은 소득이 높은 쪽에 몰려 있어 평균이 크게 높다. 이 차이는 뽑는 방법에서 생기므로 응답자를 더 많이 모아도 줄지 않는다."
      viewBox="0 0 720 250"
      minWidth={560}
    >
      {rows.map((row, i) => {
        const y = 52 + i * 66;
        const m = mean(row.data);
        const jr = seeded(100 + i);
        return (
          <g key={row.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" fontSize={11.5} fontWeight={700} fill={i === 0 ? ink : row.color}>
              {row.label}
            </text>
            <line x1={left} x2={right} y1={y + 20} y2={y + 20} stroke="var(--border-hairline)" />
            {row.data.map((x, j) => (
              <circle key={j} cx={sx(x)} cy={y + (jr() - 0.5) * 26} r={row.r} fill={row.color} fillOpacity={i === 0 ? 0.35 : 0.7} />
            ))}
            <line x1={sx(m)} x2={sx(m)} y1={y - 18} y2={y + 20} stroke={i === 0 ? ink : row.color} strokeWidth={2.4} />
            <text x={sx(m) + 5} y={y - 10} fontSize={10.5} fontWeight={800} fill={i === 0 ? ink : row.color} {...halo}>
              {`평균 ${m.toFixed(1)}`}
            </text>
          </g>
        );
      })}
      <line x1={sx(popMean)} x2={sx(popMean)} y1={30} y2={206} stroke={ink} strokeDasharray="4 4" strokeOpacity={0.6} />
      {[0, 50, 100, 150, 200].map((t) => (
        <text key={t} x={sx(t)} y={226} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
      <text x={(left + right) / 2} y={243} textAnchor="middle" fontSize={11} fontWeight={600} fill={inkSecondary}>
        월 소득 (백만 원)
      </text>
    </DiagramFrame>
  );
}

/** 상자그림의 구성: 사분위수, 사분위범위, 수염, 이상치 */
export function BoxplotAnatomy() {
  const data = [52, 55, 58, 60, 61, 63, 64, 65, 67, 68, 70, 72, 75, 78, 98];
  const q = (p: number) => {
    const s = [...data].sort((a, b) => a - b);
    const pos = (s.length - 1) * p;
    const lo = Math.floor(pos);
    return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
  };
  const q1 = q(0.25);
  const med = q(0.5);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  const inside = data.filter((x) => x >= lowFence && x <= highFence);
  const wLo = Math.min(...inside);
  const wHi = Math.max(...inside);
  const sx = linear(40, 102, 60, 680);
  const dotY = 62;
  const boxTop = 112;
  const boxH = 44;
  const mid = boxTop + boxH / 2;
  return (
    <DiagramFrame
      title="상자그림: 사분위수와 사분위범위로 분포를 요약한다"
      caption={`점수 15개(위)를 상자그림(아래)으로 요약했다. 상자의 왼쪽 끝이 제1사분위수 Q1 = ${q1}, 가운데 선이 중앙값 ${med}, 오른쪽 끝이 제3사분위수 Q3 = ${q3}이고, 상자의 폭이 사분위범위 IQR = ${iqr}이다. Q1 − 1.5 × IQR과 Q3 + 1.5 × IQR(점선) 밖의 값은 이상치로 따로 표시하고(빨강 98), 수염은 그 안의 최솟값 ${wLo}과 최댓값 ${wHi}까지 그린다. 가운데 50%의 값이 상자 안에 든다.`}
      viewBox="0 0 720 240"
      minWidth={560}
    >
      {data.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={dotY} r={4} fill={x > highFence ? colors.red : colors.blue} fillOpacity={0.85} />
      ))}
      <text x={sx(98)} y={dotY - 14} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.red}>
        98
      </text>
      {[lowFence, highFence].map((f) => (
        <g key={f}>
          <line x1={sx(f)} x2={sx(f)} y1={30} y2={boxTop + boxH + 10} stroke={colors.red} strokeDasharray="4 4" strokeOpacity={0.7} />
          <text x={sx(f)} y={24} textAnchor="middle" fontSize={10} fill={colors.red}>
            {f === lowFence ? `Q1 − 1.5·IQR = ${f}` : `Q3 + 1.5·IQR = ${f}`}
          </text>
        </g>
      ))}
      <line x1={sx(wLo)} x2={sx(q1)} y1={mid} y2={mid} stroke={ink} strokeWidth={1.6} />
      <line x1={sx(q3)} x2={sx(wHi)} y1={mid} y2={mid} stroke={ink} strokeWidth={1.6} />
      <line x1={sx(wLo)} x2={sx(wLo)} y1={mid - 10} y2={mid + 10} stroke={ink} strokeWidth={1.6} />
      <line x1={sx(wHi)} x2={sx(wHi)} y1={mid - 10} y2={mid + 10} stroke={ink} strokeWidth={1.6} />
      <rect x={sx(q1)} y={boxTop} width={sx(q3) - sx(q1)} height={boxH} fill={colors.blue} fillOpacity={0.14} stroke={colors.blue} strokeWidth={1.8} />
      <line x1={sx(med)} x2={sx(med)} y1={boxTop} y2={boxTop + boxH} stroke={colors.blue} strokeWidth={3} />
      <circle cx={sx(98)} cy={mid} r={4.5} fill="none" stroke={colors.red} strokeWidth={2} />
      {[
        { x: q1, label: `Q1 = ${q1}` },
        { x: med, label: `중앙값 = ${med}` },
        { x: q3, label: `Q3 = ${q3}` },
      ].map((t, i) => (
        <text key={t.label} x={sx(t.x)} y={boxTop + boxH + 18 + (i === 1 ? 14 : 0)} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.blue}>
          {t.label}
        </text>
      ))}
      <text x={sx(wLo)} y={boxTop + boxH + 18} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        {`최솟값 ${wLo}`}
      </text>
      <text x={sx(wHi)} y={boxTop + boxH + 18} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        {`수염 끝 ${wHi}`}
      </text>
      <path d={`M${sx(q1)},${boxTop - 8} L${sx(q1)},${boxTop - 14} L${sx(q3)},${boxTop - 14} L${sx(q3)},${boxTop - 8}`} fill="none" stroke={colors.violet} strokeWidth={1.4} />
      <text x={(sx(q1) + sx(q3)) / 2} y={boxTop - 18} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={colors.violet}>
        {`IQR = Q3 − Q1 = ${iqr}`}
      </text>
      <line x1={sx(40)} x2={sx(102)} y1={214} y2={214} stroke={inkMuted} />
      {[40, 50, 60, 70, 80, 90, 100].map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={214} y2={218} stroke={inkMuted} />
          <text x={sx(t)} y={231} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
            {t}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

function pearson(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** 상관계수가 같은 크기라도 관계의 모양은 다르다: 선형·음의 선형·무관·곡선 관계 */
export function CorrelationGallery() {
  const rand = seeded(11);
  // x는 0을 중심으로 대칭이 되게 만든다(곡선 관계의 상관계수가 0이 되도록).
  const half = Array.from({ length: 30 }, () => Math.abs(gaussian(rand)) * 1.1 + 0.05);
  const xs = [...half, ...half.map((x) => -x)];
  // 무작위 값에서 x와의 직선 성분을 빼면 표본 상관계수가 정확히 0이 된다.
  const noLinear = (vs: number[]) => {
    const mx = mean(xs);
    const mv = mean(vs);
    const b = xs.reduce((a, x, i) => a + (x - mx) * (vs[i] - mv), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    return vs.map((v, i) => v - b * (xs[i] - mx));
  };
  const panels = [
    { title: "강한 양의 선형 관계", ys: xs.map((x) => 0.9 * x + 0.4 * gaussian(rand)), color: colors.blue },
    { title: "음의 선형 관계", ys: xs.map((x) => -0.7 * x + 0.7 * gaussian(rand)), color: colors.orange },
    { title: "관계 없음", ys: noLinear(xs.map(() => gaussian(rand))), color: colors.aqua },
    { title: "곡선 관계 y ≈ x²", ys: noLinear(xs.map((x) => x * x + 0.15 * gaussian(rand))), color: colors.violet },
  ];
  const xmax = Math.max(...xs.map(Math.abs)) * 1.05;
  const W = 150;
  const H = 130;
  return (
    <DiagramFrame
      title="상관계수는 직선 관계의 강도만 잰다"
      caption="네 그림 모두 점 60개다. 첫째와 둘째는 점들이 직선 주위에 모여 있어 상관계수의 절댓값이 크고, 기울기의 부호가 상관계수의 부호다. 셋째는 x와 y가 관계없어 r이 0에 가깝다. 넷째는 y가 x로 거의 정해지는 강한 관계인데도, 직선 관계가 아니라서 r이 0에 가깝다. 상관계수가 0이라는 것은 직선 관계가 없다는 뜻이지 관계가 없다는 뜻이 아니다."
      viewBox="0 0 720 220"
      minWidth={600}
    >
      {panels.map((p, i) => {
        const left = 22 + i * 176;
        const top = 40;
        const ymin = Math.min(...p.ys);
        const ymax = Math.max(...p.ys);
        const pad = (ymax - ymin) * 0.08;
        const sx = linear(-xmax, xmax, left, left + W);
        const sy = linear(ymin - pad, ymax + pad, top + H, top);
        const r = pearson(xs, p.ys);
        return (
          <g key={p.title}>
            <Axes left={left} top={top} width={W} height={H} sx={sx} sy={sy} grid={false} />
            {xs.map((x, j) => (
              <circle key={j} cx={sx(x)} cy={sy(p.ys[j])} r={2.6} fill={p.color} fillOpacity={0.75} />
            ))}
            <text x={left + W / 2} y={24} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
              {p.title}
            </text>
            <text x={left + W / 2} y={top + H + 22} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={p.color}>
              {`r = ${(Math.abs(r) < 0.005 ? 0 : r).toFixed(2).replace("-", "−")}`}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}
