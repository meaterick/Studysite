import { Fragment } from "react";
import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, log10Scale, linePath, sample, seeded, gaussian, mono } from "./chart";

export function NistFramework() {
  const cx = 280;
  const cy = 150;
  const r = 100;
  const steps = [
    { angle: -90, label: "GOVERN", sub: "조직 문화·책임" },
    { angle: 0, label: "MAP", sub: "맥락·위험 식별" },
    { angle: 90, label: "MEASURE", sub: "측정" },
    { angle: 180, label: "MANAGE", sub: "대응" },
  ];
  const pos = (a: number) => {
    const rad = (a * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  return (
    <DiagramFrame
      title="NIST AI 위험관리 프레임워크(RMF) 4단계"
      viewBox="0 0 560 300"
      caption="네 단계를 한 번만 도는 것이 아니라 지속적으로 순환한다. 새 위험이 발견되면 다시 MAP로 돌아간다."
    >
      <ArrowDefs />
      {steps.map((s, i) => {
        const p = pos(s.angle);
        return <Box key={i} x={p.x - 60} y={p.y - 28} w={120} h={56} label={s.label} sub={s.sub} fill={i === 0 ? colors.violet : card2Bg} labelColor={i === 0 ? "#fff" : ink} subColor={i === 0 ? "#eee" : inkSecondary} />;
      })}
      {steps.map((s, i) => {
        const a = pos(s.angle);
        const b = pos(steps[(i + 1) % steps.length].angle);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        return (
          <Arrow
            key={i}
            x1={a.x + ux * 64}
            y1={a.y + uy * 30}
            x2={b.x - ux * 64}
            y2={b.y - uy * 30}
            color={colors.orange}
          />
        );
      })}
    </DiagramFrame>
  );
}

export function CapstoneTimeline() {
  const stages = [
    { d: "D-7", label: "주제·계획서 제출" },
    { d: "D-5", label: "중간 체크 (15분)" },
    { d: "D-2", label: "코드·리포트 초안" },
    { d: "D-day", label: "발표 10분 + Q&A 5분" },
  ];
  const y = 70;
  return (
    <DiagramFrame title="캡스톤 일정" viewBox="0 0 640 160" caption="발표는 문제 3분 · 방법 3분 · 결과 3분 · 한계·교훈 1분 구성을 권장한다.">
      <ArrowDefs />
      <line x1={30} y1={y + 20} x2={610} y2={y + 20} stroke="var(--border-hairline)" strokeWidth={2} />
      {stages.map((s, i) => {
        const x = 30 + i * ((610 - 30) / (stages.length - 1));
        return (
          <g key={i}>
            <circle cx={x} cy={y + 20} r={7} fill={colors.blue} />
            <text x={x} y={y - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {s.d}
            </text>
            <text x={x} y={y + 46} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
              {s.label}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function FairnessGrid() {
  // 본문 숫자 예제: A(기저율 50%), B(기저율 20%)에 TPR 80%·FPR 20%를 똑같이 적용했을 때 100명씩의 판정.
  const groups = [
    { name: "A 집단 (우수 50명)", tp: 40, fn: 10, fp: 10, tn: 40, ox: 30 },
    { name: "B 집단 (우수 20명)", tp: 16, fn: 4, fp: 16, tn: 64, ox: 340 },
  ];
  const cell = 22;
  const kinds = [
    { key: "tp", label: "TP 합격·우수", color: colors.blue, opacity: 0.85 },
    { key: "fn", label: "FN 불합격·우수", color: colors.blue, opacity: 0.25 },
    { key: "fp", label: "FP 합격·비우수", color: colors.orange, opacity: 0.85 },
    { key: "tn", label: "TN 불합격·비우수", color: inkMuted, opacity: 0.18 },
  ] as const;
  return (
    <DiagramFrame
      title="같은 TPR·FPR, 다른 결과"
      caption="두 집단에 TPR 80%, FPR 20%를 똑같이 적용했다(균등화된 오즈 만족). 그런데 기저율이 달라 선택률은 A 50%, B 32%이고(인구통계 동등성 깨짐), 합격자 중 실제 우수 인재 비율(PPV)도 A 80%, B 50%로 다르다."
      viewBox="0 0 640 330"
      minWidth={520}
    >
      {groups.map((g) => {
        const seq = kinds.flatMap((k) => Array.from({ length: g[k.key] }, () => k));
        return (
          <g key={g.name}>
            <text x={g.ox + 5 * cell} y={22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={ink}>
              {g.name}
            </text>
            {seq.map((k, i) => (
              <rect
                key={i}
                x={g.ox + (i % 10) * cell}
                y={34 + Math.floor(i / 10) * cell}
                width={cell - 4}
                height={cell - 4}
                rx={9}
                fill={k.color}
                fillOpacity={k.opacity}
              />
            ))}
            <text x={g.ox + 5 * cell} y={34 + 10 * cell + 16} textAnchor="middle" fontSize={11} fill={inkSecondary}>
              선택률 {(g.tp + g.fp)}% · PPV {Math.round((100 * g.tp) / (g.tp + g.fp))}%
            </text>
          </g>
        );
      })}
      {kinds.map((k, i) => (
        <g key={k.key}>
          <rect x={40 + i * 150} y={296} width={14} height={14} rx={7} fill={k.color} fillOpacity={k.opacity} />
          <text x={60 + i * 150} y={308} fontSize={10.5} fill={ink}>
            {k.label}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function DeployStrategies() {
  // 카나리·블루-그린·섀도 배포에서 트래픽이 어디로 가고, 사용자가 무엇을 받는지.
  const rows = [
    { name: "카나리", y: 30, note: "5%만 새 버전 → 지표 확인 후 점차 늘림", oldW: 95, newW: 5, shadow: false },
    { name: "블루-그린", y: 120, note: "두 환경을 띄워 두고 한 번에 전환 (롤백 = 되돌리기)", oldW: 0, newW: 100, shadow: false },
    { name: "섀도", y: 210, note: "새 버전에도 복제해 보내지만 응답은 기록만", oldW: 100, newW: 100, shadow: true },
  ];
  const bx = 200;
  const bw = 360;
  return (
    <DiagramFrame
      title="점진적 배포 전략 세 가지"
      caption="파란 막대는 기존 버전(v1), 보라 막대는 새 버전(v2)이 받는 트래픽 비율이다. 섀도 배포의 점선 막대는 v2도 모든 요청을 받지만 그 응답은 사용자에게 가지 않는다는 뜻이다."
      viewBox="0 0 640 300"
      minWidth={500}
    >
      {rows.map((r) => (
        <g key={r.name}>
          <text x={30} y={r.y + 26} fontSize={13} fontWeight={700} fill={ink}>
            {r.name}
          </text>
          <text x={bx} y={r.y + 4} fontSize={10.5} fill={inkSecondary}>
            {r.note}
          </text>
          <text x={bx - 10} y={r.y + 26} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
            v1
          </text>
          <rect x={bx} y={r.y + 14} width={bw} height={16} rx={4} fill={card2Bg} stroke="var(--border-hairline)" />
          {r.oldW > 0 && <rect x={bx} y={r.y + 14} width={(bw * r.oldW) / 100} height={16} rx={4} fill={colors.blue} fillOpacity={r.name === "블루-그린" ? 0.25 : 0.8} />}
          <text x={bx + bw + 8} y={r.y + 26} fontSize={10.5} fill={ink}>
            {r.name === "블루-그린" ? "0% (대기)" : `${r.oldW}%`}
          </text>
          <text x={bx - 10} y={r.y + 50} textAnchor="end" fontSize={10.5} fill={inkSecondary}>
            v2
          </text>
          <rect x={bx} y={r.y + 38} width={bw} height={16} rx={4} fill={card2Bg} stroke="var(--border-hairline)" />
          <rect
            x={bx}
            y={r.y + 38}
            width={(bw * r.newW) / 100}
            height={16}
            rx={4}
            fill={colors.violet}
            fillOpacity={r.shadow ? 0.2 : 0.8}
            stroke={r.shadow ? colors.violet : "none"}
            strokeDasharray={r.shadow ? "5 4" : undefined}
          />
          <text x={bx + bw + 8} y={r.y + 50} fontSize={10.5} fill={ink}>
            {r.shadow ? "100% (기록만)" : `${r.newW}%`}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

// ───────────────────────── 8주차 핵심 과정: 추가 그림 ─────────────────────────

const chip8 = (x: number, y: number, text: string, color: string, w = 64, h = 24, tint = 0.14, size = 11, weight = 700) => (
  <g key={`${x}-${y}-${text}`}>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} fillOpacity={tint} stroke={color} strokeWidth={1.2} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={weight} fill={ink}>
      {text}
    </text>
  </g>
);

// 본문 FGSM 코드(rng = default_rng(0))에서 무작위 잡음이 성분별로 logit을 바꾼 양 w_i · δ_i. FGSM은 같은 크기로 모두 음의 방향이다.
const FGSM_RAND = [
  0.0063, 0.0066, 0.032, 0.0052, -0.0268, 0.0181, 0.0652, 0.0474, 0.0352, 0.0633, -0.0312, -0.0021, -0.1163, -0.0109, 0.0623, 0.0366, -0.0272, 0.0158, 0.0206, -0.0521,
  -0.0064, 0.0683, 0.0333, -0.0176, -0.0452, -0.0047, -0.0372, -0.0461, 0.0229, -0.011, -0.0505, -0.0105, 0.008, 0.027, 0.0107, 0.0178, 0.0327, 0.0065, 0.0392, -0.0747,
  0.063, -0.0757, -0.0673, 0.0391, 0.0132, -0.0157, 0.0729, -0.098, -0.0901, -0.0658, -0.0179, -0.0604, 0.0002, -0.0328, 0.0644, 0.0198, -0.0215, -0.0348, -0.0592, -0.0331,
  -0.0218, -0.0585, -0.087, 0.0248, -0.0164, -0.0129, -0.0792, -0.066, 0.0317, -0.1102, 0.0026, -0.0342, 0.0502, -0.0309, 0.0911, 0.066, 0.0331, 0.0468, -0.0025, 0.1001,
  0.0094, 0.0317, -0.0189, -0.0546, 0.0639, 0.0315, 0.0291, 0.0647, 0.0377, 0.0845, -0.0144, -0.0787, -0.0216, -0.0368, -0.0125, -0.0516, 0.0081, 0.0293, -0.0671, -0.0701,
];

export function FgsmVsRandom() {
  // 원본 logit 3.266(P 0.963). 성분마다 최대 0.05씩 바꾼 효과를 100개 성분에 걸쳐 차례로 더해 간다.
  const L0 = 3.266;
  const cum = (arr: number[]) => arr.reduce<number[]>((acc, v) => [...acc, acc[acc.length - 1] + v], [L0]);
  const rand = cum(FGSM_RAND);
  const fgsm = cum(FGSM_RAND.map((v) => -Math.abs(v)));
  const cross = fgsm.findIndex((v) => v < 0);
  const G = { left: 60, top: 22, width: 400, height: 184 };
  const sx = linear(0, 100, G.left, G.left + G.width);
  const sy = linear(-1.5, 4, G.top + G.height, G.top);
  const path = (v: number[]) => linePath(v.map((y, i) => [sx(i), sy(y)] as [number, number]));
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  return (
    <DiagramFrame
      title="FGSM과 무작위 잡음: 같은 크기의 변화, 전혀 다른 결과"
      caption={`본문 코드의 로지스틱 회귀(입력 100차원)에서 성분 하나당 최대 0.05씩 바꾼 효과를 성분 1번부터 100번까지 차례로 더해 가며 logit(판정 점수)을 그렸다. 무작위 잡음(회색)은 성분마다 방향이 제멋대로라 더하고 빼기가 상쇄되어 3.27에서 ${rand[100].toFixed(2)}로 거의 그대로다(P(양성) ${sig(rand[100]).toFixed(3)}). FGSM(빨강)은 100개 성분을 모두 손실이 커지는 방향으로 밀어 작은 변화가 한 방향으로 쌓이므로, ${cross}번째 성분쯤에서 판정 경계(logit 0)를 넘고 끝내 ${fgsm[100].toFixed(2).replace("-", "−")}이 된다(P ${sig(fgsm[100]).toFixed(3)}). 입력 차원이 클수록 같은 일이 더 작은 변화로 일어난다.`}
      viewBox="0 0 720 246"
      minWidth={560}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 25, 50, 75, 100]} yTicks={[-1, 0, 1, 2, 3, 4]} fmtY={(v) => String(v).replace("-", "−")} xLabel="몇 번째 성분까지 바꿨나" yLabel="logit (판정 점수)" />
      <line x1={G.left} x2={G.left + G.width} y1={sy(0)} y2={sy(0)} stroke={colors.red} strokeWidth={1.4} strokeDasharray="5 4" />
      <text x={G.left + 6} y={sy(0) + 14} fontSize={10} fontWeight={700} fill={colors.red}>
        판정 경계 (P = 0.5)
      </text>
      <path d={path(rand)} fill="none" stroke={inkSecondary} strokeWidth={2} />
      <path d={path(fgsm)} fill="none" stroke={colors.red} strokeWidth={2.6} />
      <circle cx={sx(cross)} cy={sy(fgsm[cross])} r={4} fill={colors.red} />
      <circle cx={sx(0)} cy={sy(L0)} r={4.5} fill={colors.blue} />
      <text x={sx(0) + 8} y={sy(L0) - 7} fontSize={10.5} fontWeight={700} fill={colors.blue}>
        {`원본 ${L0} (P ${sig(L0).toFixed(3)})`}
      </text>
      <Lines x={480} y={40} lines={["무작위 잡음 (회색)", `logit ${rand[100].toFixed(2)} → P(양성) ${sig(rand[100]).toFixed(3)}`]} size={11} anchor="start" color={inkSecondary} weight={700} />
      <Lines x={480} y={90} lines={["FGSM (빨강)", `logit ${fgsm[100].toFixed(2).replace("-", "−")} → P(양성) ${sig(fgsm[100]).toFixed(3)}`]} size={11} anchor="start" color={colors.red} weight={700} />
      <Lines x={480} y={142} lines={["두 경우 모두 성분 하나당", "변화는 최대 0.05로 같다.", "차이는 '방향을 맞췄느냐'뿐이다."]} size={10.5} anchor="start" />
    </DiagramFrame>
  );
}

export function SubgroupBoundary() {
  // 본문 코드: 다수 집단 규칙 x₁ + x₂ > 0, 소수 집단 규칙 x₁ − x₂ > 0, 평균 손실로 학습한 경계 w = (3.334, 2.619).
  // 점은 같은 규칙으로 뽑은 그림용 표본(다수 120, 소수 60)이고, 정확도 숫자는 본문 코드의 결과다.
  const w = [3.334, 2.619];
  const r = seeded(78);
  const maj = Array.from({ length: 120 }, () => [gaussian(r), gaussian(r)]);
  const min = Array.from({ length: 60 }, () => [gaussian(r), gaussian(r)]);
  const S = 168;
  const panel = (x0: number, pts: number[][], rule: (a: number, b: number) => boolean, color: string, title: string, acc: string, ruleLine: [number, number]) => {
    const sx = linear(-3, 3, x0, x0 + S);
    const sy = linear(-3, 3, 30 + S, 30);
    const line = (n: [number, number]) => {
      // n·x = 0인 직선을 상자 안에 그린다
      const t = 3.2;
      const dir = [-n[1], n[0]];
      const len = Math.hypot(dir[0], dir[1]);
      return { x1: sx((-dir[0] / len) * t), y1: sy((-dir[1] / len) * t), x2: sx((dir[0] / len) * t), y2: sy((dir[1] / len) * t) };
    };
    const lr = line(ruleLine);
    const lw = line([w[0], w[1]]);
    return (
      <g>
        <text x={x0 + S / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>
          {title}
        </text>
        <rect x={x0} y={30} width={S} height={S} fill={card2Bg} stroke="var(--border-hairline)" />
        <line {...lr} stroke={color} strokeWidth={2} strokeDasharray="6 4" />
        <line {...lw} stroke={ink} strokeWidth={2.2} />
        {pts.map(([a, b], i) => {
          const y = rule(a, b);
          const wrong = y !== w[0] * a + w[1] * b > 0;
          return (
            <Fragment key={i}>
              <circle cx={sx(a)} cy={sy(b)} r={3.2} fill={y ? color : "var(--surface-card)"} fillOpacity={y ? 0.8 : 1} stroke={color} strokeWidth={1.2} />
              {wrong && <circle cx={sx(a)} cy={sy(b)} r={6} fill="none" stroke={colors.red} strokeWidth={1.4} />}
            </Fragment>
          );
        })}
        <text x={x0 + S / 2} y={30 + S + 20} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
          {acc}
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="평균 손실은 다수 집단의 규칙을 따른다"
      caption="본문 코드의 실험이다. 다수 집단(900명)은 x₁ + x₂ > 0이면 양성, 소수 집단(100명)은 x₁ − x₂ > 0이면 양성으로, 정답 규칙(점선)이 서로 다르다. 전체의 평균 손실을 줄이도록 학습한 로지스틱 회귀의 경계(검은 실선)는 표본이 9배 많은 다수 집단의 규칙과 거의 겹친다. 그래서 소수 집단에서는 점선과 실선 사이 쐐기 영역의 점(빨간 테두리)을 모두 틀린다. 칠한 점은 양성, 빈 점은 음성이며, 점은 같은 규칙으로 뽑은 그림용 표본이고 정확도는 본문 코드의 결과다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      {panel(24, maj, (a, b) => a + b > 0, colors.blue, "다수 집단 (900명)", "정확도 96.2%", [1, 1])}
      {panel(224, min, (a, b) => a - b > 0, colors.orange, "소수 집단 (100명)", "정확도 61.0%", [1, -1])}
      <Lines x={420} y={44} lines={["전체 정확도 92.7%"]} size={14} anchor="start" color={ink} weight={800} />
      <Lines x={420} y={70} lines={["평균만 보면 훌륭한 모델이지만", "소수 집단은 동전 던지기(50%)를", "조금 넘는 수준이다."]} size={11} anchor="start" />
      <line x1={420} y1={128} x2={440} y2={128} stroke={ink} strokeWidth={2.2} />
      <text x={446} y={132} fontSize={10.5} fill={inkSecondary}>
        학습된 경계 (평균 손실 최소화)
      </text>
      <line x1={420} y1={148} x2={440} y2={148} stroke={colors.blue} strokeWidth={2} strokeDasharray="6 4" />
      <text x={446} y={152} fontSize={10.5} fill={inkSecondary}>
        다수 집단의 정답 규칙
      </text>
      <line x1={420} y1={168} x2={440} y2={168} stroke={colors.orange} strokeWidth={2} strokeDasharray="6 4" />
      <text x={446} y={172} fontSize={10.5} fill={inkSecondary}>
        소수 집단의 정답 규칙
      </text>
      <circle cx={430} cy={188} r={6} fill="none" stroke={colors.red} strokeWidth={1.4} />
      <text x={446} y={192} fontSize={10.5} fill={inkSecondary}>
        모델이 틀린 점
      </text>
      <text x={420} y={218} fontSize={10.5} fontWeight={700} fill={colors.red}>
        → 집단별 성능을 따로 보고해야 격차가 보인다
      </text>
    </DiagramFrame>
  );
}

export function GenderShades() {
  // Buolamwini & Gebru (2018) 표 4: PPB 데이터셋에서의 성별 분류 오류율(1 − TPR, %).
  const groups = [
    { k: "DF", name: "어두운 피부 여성", c: colors.red },
    { k: "DM", name: "어두운 피부 남성", c: colors.orange },
    { k: "LF", name: "밝은 피부 여성", c: colors.violet },
    { k: "LM", name: "밝은 피부 남성", c: colors.blue },
  ];
  const data = [
    { co: "Microsoft", v: [20.8, 6.0, 1.7, 0.0] },
    { co: "Face++", v: [34.5, 0.7, 9.8, 0.8] },
    { co: "IBM", v: [34.7, 12.0, 7.1, 0.3] },
  ];
  const base = 196;
  const sy = linear(0, 40, base, 24);
  const bw = 34;
  return (
    <DiagramFrame
      title="Gender Shades: 같은 시스템, 집단별로 다른 오류율"
      caption="Buolamwini와 Gebru(2018)가 상용 얼굴 성별 분류 시스템 세 개를 피부색과 성별의 교차 집단별로 평가한 결과(논문 표 4의 오류율)를 다시 그렸다. 세 시스템 모두 밝은 피부 남성에서는 오류율이 1% 미만이지만, 어두운 피부 여성에서는 21~35%까지 치솟는다. 전체 정확도 하나로는 보이지 않던 격차가 집단별로 나눠 보자 드러났다."
      viewBox="0 0 720 236"
      minWidth={560}
    >
      {[0, 10, 20, 30, 40].map((t) => (
        <g key={t}>
          <line x1={56} x2={520} y1={sy(t)} y2={sy(t)} stroke="var(--border-hairline)" />
          <text x={50} y={sy(t) + 3.5} textAnchor="end" fontSize={10} fill={inkSecondary}>
            {`${t}%`}
          </text>
        </g>
      ))}
      {data.map((d, j) => {
        const x0 = 76 + j * 152;
        return (
          <g key={d.co}>
            {d.v.map((v, i) => (
              <g key={i}>
                <rect x={x0 + i * bw} y={sy(v)} width={bw - 6} height={Math.max(1.5, base - sy(v))} rx={3} fill={groups[i].c} fillOpacity={0.8} />
                <text x={x0 + i * bw + (bw - 6) / 2} y={sy(v) - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink}>
                  {v.toFixed(1)}
                </text>
              </g>
            ))}
            <text x={x0 + 2 * bw - 3} y={base + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
              {d.co}
            </text>
          </g>
        );
      })}
      <line x1={56} x2={520} y1={base} y2={base} stroke={inkMuted} />
      {groups.map((g, i) => (
        <g key={g.k}>
          <rect x={548} y={52 + i * 26} width={14} height={14} rx={3} fill={g.c} fillOpacity={0.8} />
          <text x={568} y={63 + i * 26} fontSize={11} fill={ink}>
            {g.name}
          </text>
        </g>
      ))}
      <text x={548} y={30} fontSize={11.5} fontWeight={700} fill={ink}>
        성별 분류 오류율
      </text>
      <Lines x={548} y={176} lines={["최대 34.7% vs 0.0~0.8%", "(어두운 피부 여성 vs 밝은 피부 남성)"]} size={10} anchor="start" color={colors.red} weight={700} />
    </DiagramFrame>
  );
}

export function FairnessMetrics() {
  // 본문 예제의 첫 상황(TPR·FPR을 같게 맞춤): A는 TP 40, FN 10, FP 10, TN 40 / B는 TP 16, FN 4, FP 16, TN 64.
  const A = { tp: 40, fn: 10, fp: 10, tn: 40 };
  const B = { tp: 16, fn: 4, fp: 16, tn: 64 };
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const metrics = [
    {
      t: "① 인구통계 동등성",
      f: "선택률 = (TP + FP) / 전체",
      hi: ["tp", "fp"],
      den: ["tp", "fp", "fn", "tn"],
      a: pct((A.tp + A.fp) / 100),
      b: pct((B.tp + B.fp) / 100),
      ok: false,
      c: colors.violet,
    },
    {
      t: "② 균등화된 오즈",
      f: "TPR = TP/(TP+FN), FPR = FP/(FP+TN)",
      hi: ["tp", "fp"],
      den: [],
      a: `${pct(A.tp / (A.tp + A.fn))} · ${pct(A.fp / (A.fp + A.tn))}`,
      b: `${pct(B.tp / (B.tp + B.fn))} · ${pct(B.fp / (B.fp + B.tn))}`,
      ok: true,
      c: colors.green,
    },
    {
      t: "③ 예측 동등성 (PPV)",
      f: "PPV = TP / (TP + FP)",
      hi: ["tp"],
      den: ["tp", "fp"],
      a: pct(A.tp / (A.tp + A.fp)),
      b: pct(B.tp / (B.tp + B.fp)),
      ok: false,
      c: colors.orange,
    },
  ];
  const cell = (x: number, y: number, k: string, label: string, m: (typeof metrics)[number], rowBand?: boolean) => {
    const on = m.hi.includes(k);
    const den = m.den.includes(k) || rowBand;
    return (
      <g key={k}>
        <rect x={x} y={y} width={58} height={34} rx={4} fill={on ? m.c : inkMuted} fillOpacity={on ? 0.55 : den ? 0.2 : 0.07} stroke={den || on ? m.c : "var(--border-hairline)"} strokeWidth={den || on ? 1.4 : 1} />
        <text x={x + 29} y={y + 22} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
          {label}
        </text>
      </g>
    );
  };
  return (
    <DiagramFrame
      title="세 가지 공정성 기준은 혼동행렬의 다른 칸을 비교한다"
      caption="본문 예제의 첫 상황(두 집단의 TPR 80%·FPR 20%를 같게 맞춤)이다. 인구통계 동등성은 '추천' 열 전체를 전체 인원으로 나눈 선택률을, 균등화된 오즈는 실제 정답 행마다 추천받은 비율(TPR, FPR)을, 예측 동등성은 추천받은 사람 중 실제 우수 인재의 비율(PPV)을 비교한다. 기저율이 50%와 20%로 다르니, 균등화된 오즈를 맞추자 선택률(50% vs 32%)과 PPV(80% vs 50%)가 어긋났다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      {metrics.map((m, j) => {
        const x0 = 14 + j * 238;
        return (
          <g key={m.t}>
            <text x={x0 + 104} y={18} textAnchor="middle" fontSize={12} fontWeight={800} fill={m.c}>
              {m.t}
            </text>
            <text x={x0 + 104} y={36} textAnchor="middle" fontSize={9.6} fill={inkSecondary}>
              {m.f}
            </text>
            <text x={x0 + 104} y={56} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              추천 Ŷ=1 · 비추천 Ŷ=0
            </text>
            <text x={x0 + 36} y={86} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
              Y=1
            </text>
            <text x={x0 + 36} y={124} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
              Y=0
            </text>
            {cell(x0 + 44, 64, "tp", "TP", m, j === 1)}
            {cell(x0 + 106, 64, "fn", "FN", m, j === 1)}
            {cell(x0 + 44, 102, "fp", "FP", m, j === 1)}
            {cell(x0 + 106, 102, "tn", "TN", m, j === 1)}
            {j === 1 && (
              <>
                <text x={x0 + 172} y={85} fontSize={9.5} fontWeight={700} fill={m.c}>
                  ← TPR
                </text>
                <text x={x0 + 172} y={123} fontSize={9.5} fontWeight={700} fill={m.c}>
                  ← FPR
                </text>
              </>
            )}
            <rect x={x0} y={150} width={220} height={66} rx={8} fill={card2Bg} stroke="var(--border-hairline)" />
            <text x={x0 + 12} y={172} fontSize={11} fill={ink}>
              A 집단 (기저율 50%)
            </text>
            <text x={x0 + 208} y={172} textAnchor="end" fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
              {m.a}
            </text>
            <text x={x0 + 12} y={196} fontSize={11} fill={ink}>
              B 집단 (기저율 20%)
            </text>
            <text x={x0 + 208} y={196} textAnchor="end" fontSize={11.5} fontWeight={800} fill={ink} fontFamily={mono}>
              {m.b}
            </text>
            <text x={x0 + 110} y={240} textAnchor="middle" fontSize={12.5} fontWeight={800} fill={m.ok ? colors.green : colors.red}>
              {m.ok ? "✓ 같다" : "✗ 다르다"}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

export function ThresholdTradeoff() {
  // 본문 코드의 세 시나리오: B 집단의 임계값만 낮춰 간다. 선택률 격차 0.18 → 0.09 → 0.00, FPR 격차 0.00 → 0.10 → 0.20.
  const steps = [
    { name: "기존 임계값", sel: 0.18, fpr: 0.0, b: "B 선택률 32% · FPR 20%" },
    { name: "임계값 살짝 완화", sel: 0.09, fpr: 0.1, b: "B 선택률 41% · FPR 30%" },
    { name: "동등성 맞춤", sel: 0.0, fpr: 0.2, b: "B 선택률 50% · FPR 40%" },
  ];
  const G = { left: 60, top: 20, width: 380, height: 150 };
  const sx = (i: number) => G.left + 40 + i * 150;
  const sy = linear(0, 0.22, G.top + G.height, G.top);
  const line = (k: "sel" | "fpr") => linePath(steps.map((s, i) => [sx(i), sy(s[k])] as [number, number]));
  return (
    <DiagramFrame
      title="임계값을 움직이면 격차가 한쪽에서 다른 쪽으로 옮겨 간다"
      caption="본문 코드의 세 시나리오다. A 집단은 그대로 두고 B 집단의 임계값만 낮추면, 선택률 격차(보라)는 0.18 → 0.09 → 0.00으로 줄지만 FPR 격차(빨강)는 0.00 → 0.10 → 0.20으로 정확히 그만큼 벌어진다. 기저율이 다른 두 집단에서는 한 기준을 맞추는 만큼 다른 기준이 깨진다. 어느 쪽을 택할지는 지표가 아니라 사람이 근거와 함께 정해야 한다."
      viewBox="0 0 720 248"
      minWidth={560}
    >
      {[0, 0.1, 0.2].map((t) => (
        <g key={t}>
          <line x1={G.left} x2={G.left + G.width} y1={sy(t)} y2={sy(t)} stroke="var(--border-hairline)" />
          <text x={G.left - 8} y={sy(t) + 3.5} textAnchor="end" fontSize={10} fill={inkSecondary}>
            {t.toFixed(2)}
          </text>
        </g>
      ))}
      <path d={line("sel")} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <path d={line("fpr")} fill="none" stroke={colors.red} strokeWidth={2.6} />
      {steps.map((s, i) => (
        <g key={s.name}>
          <circle cx={sx(i)} cy={sy(s.sel)} r={5} fill={colors.violet} />
          <circle cx={sx(i)} cy={sy(s.fpr)} r={5} fill={colors.red} />
          <text x={sx(i) + (i === 1 ? 12 : 0)} y={sy(s.sel) + (i === 0 ? -10 : 18)} textAnchor={i === 1 ? "start" : "middle"} fontSize={10.5} fontWeight={700} fill={colors.violet}>
            {s.sel.toFixed(2)}
          </text>
          <text x={sx(i) + (i === 1 ? -12 : 0)} y={sy(s.fpr) + (i === 0 ? 18 : -10)} textAnchor={i === 1 ? "end" : "middle"} fontSize={10.5} fontWeight={700} fill={colors.red}>
            {s.fpr.toFixed(2)}
          </text>
          <text x={sx(i)} y={G.top + G.height + 36} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
            {s.name}
          </text>
          <text x={sx(i)} y={G.top + G.height + 52} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {s.b}
          </text>
        </g>
      ))}
      <text x={G.left - 44} y={G.top + 4} fontSize={10} fill={inkSecondary}>
        격차
      </text>
      <line x1={490} x2={514} y1={64} y2={64} stroke={colors.violet} strokeWidth={2.6} />
      <text x={520} y={68} fontSize={11} fontWeight={700} fill={colors.violet}>
        선택률 격차 (인구통계 동등성)
      </text>
      <line x1={490} x2={514} y1={90} y2={90} stroke={colors.red} strokeWidth={2.6} />
      <text x={520} y={94} fontSize={11} fontWeight={700} fill={colors.red}>
        FPR 격차 (균등화된 오즈)
      </text>
      <Lines x={490} y={130} lines={["두 격차의 합이 거의 그대로다:", "한쪽을 줄인 만큼 다른 쪽이 벌어진다"]} size={10.5} anchor="start" />
    </DiagramFrame>
  );
}

export function IntersectionalGap() {
  // 본문 예제: 네 교차 집단 각 50명, 합격 30 · 20 · 20 · 30. 성별·연령으로만 묶으면 모두 50%.
  const rows = ["남성", "여성"];
  const cols = ["청년", "고령"];
  const rate = [
    [0.6, 0.4],
    [0.4, 0.6],
  ];
  const cx = (j: number) => 190 + j * 120;
  const cy = (i: number) => 52 + i * 60;
  return (
    <DiagramFrame
      title="교차 집단에 숨는 격차"
      caption="네 교차 집단에 50명씩 지원했고 합격 인원이 30, 20, 20, 30명이다. 성별로만 묶으면 남녀 모두 50%, 연령으로만 묶어도 청년·고령 모두 50%로 완벽히 같다(회색 칸). 그러나 교차 집단의 선택률은 60%와 40%로 벌어져 있다. 한 속성씩만 점검하면 이 격차를 보지 못한다."
      viewBox="0 0 720 220"
      minWidth={520}
    >
      {cols.map((c, j) => (
        <text key={c} x={cx(j) + 54} y={36} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>
          {c}
        </text>
      ))}
      <text x={cx(2) + 54} y={36} textAnchor="middle" fontSize={11} fontWeight={700} fill={inkSecondary}>
        성별로만 묶으면
      </text>
      {rows.map((r, i) => (
        <g key={r}>
          <text x={170} y={cy(i) + 30} textAnchor="end" fontSize={12} fontWeight={700} fill={ink}>
            {r}
          </text>
          {cols.map((_, j) => (
            <g key={j}>
              <rect x={cx(j)} y={cy(i)} width={108} height={48} rx={6} fill={rate[i][j] > 0.5 ? colors.green : colors.red} fillOpacity={0.18} stroke={rate[i][j] > 0.5 ? colors.green : colors.red} />
              <text x={cx(j) + 54} y={cy(i) + 22} textAnchor="middle" fontSize={15} fontWeight={800} fill={ink}>
                {`${Math.round(rate[i][j] * 100)}%`}
              </text>
              <text x={cx(j) + 54} y={cy(i) + 38} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
                {`50명 중 ${Math.round(rate[i][j] * 50)}명`}
              </text>
            </g>
          ))}
          <rect x={cx(2)} y={cy(i)} width={108} height={48} rx={6} fill={inkMuted} fillOpacity={0.14} />
          <text x={cx(2) + 54} y={cy(i) + 29} textAnchor="middle" fontSize={14} fontWeight={800} fill={inkSecondary}>
            50%
          </text>
        </g>
      ))}
      <text x={130} y={cy(2) + 26} textAnchor="end" fontSize={11} fontWeight={700} fill={inkSecondary}>
        연령으로만 묶으면
      </text>
      {cols.map((_, j) => (
        <g key={`m${j}`}>
          <rect x={cx(j)} y={cy(2)} width={108} height={36} rx={6} fill={inkMuted} fillOpacity={0.14} />
          <text x={cx(j) + 54} y={cy(2) + 23} textAnchor="middle" fontSize={14} fontWeight={800} fill={inkSecondary}>
            50%
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function EuAiActPyramid() {
  // EU AI Act의 위험 등급(본문 표)과 본문 '등급 분류 연습'의 예시.
  const P = "eup";
  const tiers = [
    { name: "금지", duty: "사용 자체를 금지", ex: "온라인 행동을 점수화해 공공 서비스 이용 제한", c: colors.red },
    { name: "고위험", duty: "위험관리 · 데이터 품질 · 문서화 · 사람의 감독", ex: "입학 서류를 점수화해 합격 여부에 반영", c: colors.orange },
    { name: "제한적 위험", duty: "AI임을 알리는 투명성 의무", ex: "쇼핑몰 고객센터 챗봇", c: colors.violet },
    { name: "최소 위험", duty: "별도 의무 없음", ex: "메일함의 스팸 분류기", c: colors.green },
  ];
  const cx = 222;
  const top = 14;
  const h = 50;
  const halfW = (i: number) => 36 + i * 42;
  return (
    <DiagramFrame
      title="EU AI Act의 위험 등급: 피해가 클수록 의무가 무겁다"
      caption="위로 갈수록 사람의 생계·건강·자유에 미치는 영향이 커서 의무가 무거워지고, 맨 위는 아예 금지된다. 오른쪽은 본문의 등급 분류 연습이다. 같은 텍스트 분류 기술이라도 스팸을 거르면 최소 위험, 입학을 가르면 고위험이 된다. 등급은 모델이 아니라 용도에 붙는다. 적용 시기와 세부 지침은 개정되므로 인용할 때는 공식 문서를 확인해야 한다."
      viewBox="0 0 720 230"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      {tiers.map((t, i) => {
        const y = top + i * h;
        const w0 = halfW(i);
        const w1 = halfW(i + 1);
        return (
          <g key={t.name}>
            <path d={`M${cx - w0},${y} L${cx + w0},${y} L${cx + w1},${y + h - 4} L${cx - w1},${y + h - 4} Z`} fill={t.c} fillOpacity={0.22} stroke={t.c} strokeWidth={1.6} />
            <text x={cx} y={y + 20} textAnchor="middle" fontSize={12.5} fontWeight={800} fill={ink}>
              {t.name}
            </text>
            <text x={cx} y={y + 35} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
              {t.duty}
            </text>
            <Arr x1={cx + (w0 + w1) / 2 + 8} y1={y + h / 2 - 2} x2={436} y2={y + h / 2 - 2} color={inkMuted} marker={`${P}-ink`} dashed />
            <rect x={440} y={y + 6} width={266} height={h - 16} rx={6} fill={t.c} fillOpacity={0.08} stroke={t.c} />
            <text x={450} y={y + h / 2 + 2} fontSize={10.5} fill={ink}>
              {t.ex}
            </text>
          </g>
        );
      })}
      <text x={573} y={top + 4 * h + 12} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        같은 기술이라도 어디에 쓰이느냐로 등급이 갈린다
      </text>
    </DiagramFrame>
  );
}

export function ModelCardLabel() {
  // 본문 코드의 model_card 딕셔너리를 식품 영양성분표처럼 그렸다.
  const P = "mcl";
  const rows: { k: string; v: string[]; strong?: boolean }[] = [
    { k: "모델명", v: ["이력서 스크리닝 모델 (예시)"], strong: true },
    { k: "의도된 용도", v: ["채용 담당자의 1차 서류 검토를 돕는 참고 자료"] },
    { k: "비의도 용도", v: ["최종 합격/불합격 자동 결정", "성별·출신 학교 추정에 사용"] },
    { k: "학습 데이터", v: ["과거 10년치 채용 이력서 10,000건", "알려진 불균형: 합격자 다수가 남성"] },
    { k: "집단별 성능", v: ["A 집단: TPR 0.80 · FPR 0.20", "B 집단: TPR 0.80 · FPR 0.20"] },
    { k: "한계", v: ["과거 데이터의 편향을 그대로 학습할 위험", "새로운 직무 유형에는 일반화가 어려움"] },
  ];
  let y = 54;
  const placed = rows.map((r) => {
    const top = y;
    y += 12 + r.v.length * 15;
    return { ...r, top };
  });
  const mid = (k: string) => {
    const r = placed.find((row) => row.k === k)!;
    return r.top + 4 + (r.v.length * 15) / 2;
  };
  const analog = [
    { food: "원재료", model: "학습 데이터", ty: mid("학습 데이터") },
    { food: "영양 성분", model: "집단별 성능", ty: mid("집단별 성능") },
    { food: "알레르기 주의", model: "비의도 용도 · 한계", ty: mid("한계") },
  ];
  return (
    <DiagramFrame
      title="모델카드: 모델의 영양성분표"
      caption="본문 코드의 model_card 딕셔너리를 식품 포장의 영양성분표처럼 그렸다. 무엇으로 만들었는지(학습 데이터), 어떤 성분이 얼마나 들었는지(집단별 성능), 누가 피해야 하는지(비의도 용도와 한계)를 만든 사람이 스스로 밝힌다. 영양성분표가 식품을 건강하게 만들지 않듯 모델카드가 결함을 없애지는 않지만, 다음 사용자가 위험을 미리 알고 고를 수 있게 해 준다."
      viewBox="0 0 720 300"
      minWidth={580}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      <rect x={14} y={8} width={380} height={y + 6} rx={4} fill="var(--surface-card)" stroke={ink} strokeWidth={2} />
      <text x={26} y={36} fontSize={22} fontWeight={900} fill={ink}>
        모델카드
      </text>
      <text x={382} y={36} textAnchor="end" fontSize={10} fill={inkSecondary}>
        Model Card
      </text>
      <line x1={22} y1={44} x2={386} y2={44} stroke={ink} strokeWidth={6} />
      {placed.map((r, i) => (
        <g key={r.k}>
          {i > 0 && <line x1={22} y1={r.top - 4} x2={386} y2={r.top - 4} stroke={ink} strokeWidth={i === 4 ? 3 : 1} />}
          <text x={26} y={r.top + 12} fontSize={11.5} fontWeight={800} fill={ink}>
            {r.k}
          </text>
          {r.v.map((line, k) => (
            <text key={k} x={118} y={r.top + 12 + k * 15} fontSize={10.5} fontWeight={r.strong ? 700 : 400} fill={ink}>
              {line}
            </text>
          ))}
        </g>
      ))}
      <rect x={470} y={20} width={236} height={34} rx={6} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={588} y={42} textAnchor="middle" fontSize={12} fontWeight={800} fill={ink}>
        식품 영양성분표 ↔ 모델카드
      </text>
      {analog.map((a) => (
        <g key={a.food}>
          <Arr x1={466} y1={a.ty} x2={400} y2={a.ty} color={inkMuted} marker={`${P}-ink`} dashed />
          {chip8(470, a.ty - 13, a.food, colors.orange, 96, 26, 0.12, 11)}
          <text x={574} y={a.ty + 4} fontSize={11} fill={inkSecondary}>
            ↔
          </text>
          {chip8(590, a.ty - 13, a.model, colors.blue, 116, 26, 0.12, 10.5)}
        </g>
      ))}
    </DiagramFrame>
  );
}

export function ServingFlow() {
  // 학습은 미리 한 번, 서버는 시작할 때 모델을 한 번 올리고 요청마다 추론만 반복한다. 실행 환경은 Docker 이미지로 포장한다.
  const P = "srv";
  return (
    <DiagramFrame
      title="모델 서빙: 학습은 미리 한 번, 추론은 요청마다"
      caption="왼쪽: 학습은 서비스 전에 한 번 끝내고 결과(파라미터)를 파일로 저장한다. 가운데: FastAPI 서버는 시작할 때 그 파일을 메모리에 한 번만 올려 두고, /predict로 들어오는 요청마다 추론만 한다. 서버는 Docker 이미지 안에서 돈다. 이미지에는 운영체제 배포판·파이썬 버전·라이브러리·코드·모델이 통째로 들어 있어, 노트북이든 클라우드든 똑같이 실행된다. 오른쪽: 클라이언트는 JSON을 POST로 보내고 JSON으로 예측을 받는다."
      viewBox="0 0 720 250"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, blue: colors.blue, green: colors.green }} />
      <text x={100} y={20} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.orange}>
        학습 (오프라인, 한 번)
      </text>
      {chip8(30, 34, "학습 데이터", colors.orange, 140, 28, 0.12, 11)}
      <Arr x1={100} y1={64} x2={100} y2={80} color={inkSecondary} marker={`${P}-ink`} />
      {chip8(30, 84, "학습 · 평가", colors.orange, 140, 28, 0.12, 11)}
      <Arr x1={100} y1={114} x2={100} y2={130} color={inkSecondary} marker={`${P}-ink`} />
      {chip8(30, 134, "model.pkl (파라미터 θ)", colors.orange, 140, 30, 0.22, 11)}
      <Arr x1={172} y1={149} x2={246} y2={149} color={colors.orange} marker={`${P}-ink`} width={1.8} dashed />
      <text x={209} y={142} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        시작 시 한 번 로드
      </text>
      <rect x={250} y={30} width={230} height={202} rx={10} fill={colors.blue} fillOpacity={0.05} stroke={colors.blue} strokeWidth={1.6} strokeDasharray="6 4" />
      <text x={262} y={48} fontSize={11} fontWeight={800} fill={colors.blue}>
        Docker 컨테이너
      </text>
      {["python:3.11-slim (OS + 파이썬)", "requirements.txt (라이브러리)", "main.py (FastAPI 코드)"].map((t, i) => (
        <g key={t}>
          <rect x={262} y={58 + i * 26} width={206} height={22} rx={4} fill={card2Bg} stroke="var(--border-hairline)" />
          <text x={270} y={73 + i * 26} fontSize={10} fill={inkSecondary}>
            {t}
          </text>
        </g>
      ))}
      <rect x={262} y={140} width={206} height={80} rx={8} fill={colors.green} fillOpacity={0.12} stroke={colors.green} strokeWidth={1.4} />
      <text x={365} y={160} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        FastAPI 서버 (상시 실행)
      </text>
      <text x={365} y={178} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        메모리에 올린 모델 f_θ
      </text>
      <text x={365} y={196} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.green}>
        POST /predict → ŷ = f_θ(x)
      </text>
      <text x={365} y={212} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        요청마다 추론만 반복 (재학습 없음)
      </text>
      {[0, 1, 2].map((i) => {
        const y = 64 + i * 58;
        const sy0 = 150 + i * 22;
        return (
          <g key={i}>
            <Arr x1={602} y1={y + 8} x2={474} y2={sy0} color={colors.blue} marker={`${P}-blue`} width={1.4} />
            <Arr x1={472} y1={sy0 + 9} x2={600} y2={y + 26} color={colors.green} marker={`${P}-green`} width={1.4} />
            {chip8(604, y - 2, `클라이언트 ${i + 1}`, inkMuted, 102, 36, 0.08, 10.5, 600)}
          </g>
        );
      })}
      <text x={604} y={34} fontSize={9.5} fontWeight={700} fill={colors.blue}>
        요청: POST /predict
      </text>
      <text x={604} y={48} fontSize={9.5} fill={colors.blue}>
        {'{"features": [...]}'}
      </text>
      <text x={604} y={230} fontSize={9.5} fontWeight={700} fill={colors.green}>
        응답 (JSON)
      </text>
      <text x={604} y={244} fontSize={9.5} fill={colors.green}>
        {'{"prediction": [...]}'}
      </text>
    </DiagramFrame>
  );
}

export function MlPipelines() {
  // 본문의 세 파이프라인과 CI/CD 관문, 모니터링에서 재학습으로 돌아가는 고리.
  const P = "mlp";
  const lanes = [
    { name: "Data", steps: ["수집", "정제·검증", "특성 추출", "저장"], c: colors.aqua, y: 22 },
    { name: "Training", steps: ["데이터 로드", "학습", "평가", "레지스트리 등록"], c: colors.orange, y: 96 },
    { name: "Inference", steps: ["요청 수신", "전처리", "모델 호출", "후처리·응답"], c: colors.blue, y: 170 },
  ];
  const sx = (i: number) => 116 + i * 110;
  return (
    <DiagramFrame
      title="MLOps의 세 파이프라인과 배포 관문"
      caption="데이터 파이프라인이 일정한 품질의 데이터를 공급하면, 학습 파이프라인이 그 데이터로 모델을 만들어 평가한 뒤 레지스트리에 등록하고, 추론 파이프라인은 배포된 모델로 요청에 답한다. 셋은 따로 자동화된다. 등록과 배포 사이에는 CI/CD 관문이 있다. 코드 테스트뿐 아니라 데이터 검증(스키마·분포)과 모델 성능 회귀 테스트까지 통과해야 배포된다. 운영 중에는 모니터링이 드리프트를 감시하고, 원인을 확인한 뒤 필요하면 재학습으로 돌아간다."
      viewBox="0 0 720 240"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary, red: colors.red, violet: colors.violet }} />
      {lanes.map((l) => (
        <g key={l.name}>
          <rect x={10} y={l.y} width={520} height={54} rx={10} fill={l.c} fillOpacity={0.06} stroke={l.c} strokeWidth={1.2} />
          <text x={20} y={l.y + 32} fontSize={11.5} fontWeight={800} fill={l.c}>
            {l.name}
          </text>
          {l.steps.map((st, i) => (
            <g key={st}>
              {chip8(sx(i) - 44, l.y + 13, st, l.c, 88, 28, 0.14, 10.2)}
              {i < 3 && <Arr x1={sx(i) + 46} y1={l.y + 27} x2={sx(i + 1) - 48} y2={l.y + 27} color={inkSecondary} marker={`${P}-ink`} />}
            </g>
          ))}
        </g>
      ))}
      <Arr x1={sx(3)} y1={64} x2={sx(0) + 10} y2={108} color={inkSecondary} marker={`${P}-ink`} dashed />
      <rect x={556} y={86} width={150} height={74} rx={8} fill={colors.red} fillOpacity={0.08} stroke={colors.red} strokeWidth={1.4} />
      <Lines x={631} y={104} lines={["CI/CD 관문", "코드 테스트", "데이터 검증", "성능 회귀 테스트"]} size={10} color={ink} weight={600} />
      <Arr x1={sx(3) + 46} y1={123} x2={552} y2={123} color={colors.red} marker={`${P}-red`} />
      <ArrPath d="M600,162 C600,186 560,196 534,196" color={colors.red} marker={`${P}-red`} />
      <text x={566} y={186} fontSize={9.5} fontWeight={700} fill={colors.red}>
        배포
      </text>
      <Tag x={612} y={176} w={94} h={46} lines={["모니터링", "드리프트·성능"]} color={colors.violet} tint={0.1} size={10.5} />
      <Arr x1={534} y1={214} x2={608} y2={214} color={colors.violet} marker={`${P}-violet`} />
      <ArrPath d="M650,176 C650,168 690,166 700,150 C712,130 712,70 640,62 L540,62 C536,62 534,66 534,76 L534,110" color={colors.violet} marker={`${P}-violet`} dashed />
      <text x={600} y={56} fontSize={9.5} fontWeight={700} fill={colors.violet}>
        원인 확인 → 재학습
      </text>
    </DiagramFrame>
  );
}

export function DriftTypes() {
  // 데이터 드리프트: P(x)가 옮겨 가고 경계는 그대로. 개념 드리프트: 입력 분포는 그대로인데 정답 규칙 P(y|x)가 바뀐다.
  const r = seeded(21);
  const train = Array.from({ length: 70 }, () => [gaussian(r) * 0.8 - 0.9, gaussian(r) * 0.8]);
  const prod = Array.from({ length: 70 }, () => [gaussian(r) * 0.8 + 1.0, gaussian(r) * 0.8 + 0.3]);
  const same = Array.from({ length: 90 }, () => [gaussian(r) * 1.0, gaussian(r) * 1.0]);
  const S = 190;
  const R = 3.6;
  const sxy = (x0: number) => ({ sx: linear(-R, R, x0, x0 + S), sy: linear(-R, R, 34 + S, 34) });
  const left = sxy(30);
  const right = sxy(390);
  const oldRule = (a: number, b: number) => a + 0.4 * b > 0;
  const newRule = (a: number, b: number) => -0.3 * a + b > 0;
  const boundary = (s: { sx: (v: number) => number; sy: (v: number) => number }, n: [number, number]) => {
    const dir = [-n[1], n[0]];
    const len = Math.hypot(dir[0], dir[1]);
    const t = 6;
    return { x1: s.sx((-dir[0] / len) * t), y1: s.sy((-dir[1] / len) * t), x2: s.sx((dir[0] / len) * t), y2: s.sy((dir[1] / len) * t) };
  };
  return (
    <DiagramFrame
      title="두 가지 드리프트: 입력이 움직이는가, 정답 규칙이 바뀌는가"
      caption="왼쪽(데이터 드리프트): 운영 중 들어오는 입력(파랑)이 학습 때 입력(회색)과 다른 곳으로 옮겨 갔다. 정답을 가르는 규칙(실선)은 그대로라, 모델이 새 영역에서도 잘 맞히면 성능은 멀쩡할 수 있다. PSI 같은 입력 분포 지표로 감지한다. 오른쪽(개념 드리프트): 입력 분포는 그대로인데 정답 규칙이 점선에서 실선으로 바뀌었다. 두 선 사이의 점(빨간 테두리)은 정답이 뒤집혀 옛 모델이 틀린다. 입력만 봐서는 보이지 않으므로 늦게라도 정답 라벨을 모아 성능을 직접 추적해야 한다."
      viewBox="0 0 720 262"
      minWidth={600}
    >
      <defs>
        <clipPath id="dft-l">
          <rect x={left.sx(-R)} y={34} width={S} height={S} />
        </clipPath>
        <clipPath id="dft-r">
          <rect x={right.sx(-R)} y={34} width={S} height={S} />
        </clipPath>
      </defs>
      <rect x={left.sx(-R)} y={34} width={S} height={S} fill={card2Bg} stroke="var(--border-hairline)" />
      <rect x={right.sx(-R)} y={34} width={S} height={S} fill={card2Bg} stroke="var(--border-hairline)" />
      <text x={125} y={22} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.blue}>
        데이터 드리프트: P(x)가 변한다
      </text>
      <text x={485} y={22} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.red}>
        개념 드리프트: P(y | x)가 변한다
      </text>
      <g clipPath="url(#dft-l)">
      <line {...boundary(left, [1, 0.4])} stroke={ink} strokeWidth={2} />
      {train.map(([a, b], i) => (
        <circle key={`t${i}`} cx={left.sx(a)} cy={left.sy(b)} r={3} fill={inkMuted} fillOpacity={oldRule(a, b) ? 0.75 : 0.15} stroke={inkMuted} strokeWidth={1} />
      ))}
      {prod.map(([a, b], i) => (
        <circle key={`p${i}`} cx={left.sx(a)} cy={left.sy(b)} r={3} fill={colors.blue} fillOpacity={oldRule(a, b) ? 0.75 : 0.12} stroke={colors.blue} strokeWidth={1} />
      ))}
      </g>
      <text x={left.sx(-3.4)} y={34 + S - 8} fontSize={10} fontWeight={700} fill={inkSecondary}>
        학습 때
      </text>
      <text x={left.sx(1.6)} y={48} fontSize={10} fontWeight={700} fill={colors.blue}>
        운영 중
      </text>
      <g clipPath="url(#dft-r)">
      <line {...boundary(right, [1, 0.4])} stroke={ink} strokeWidth={1.6} strokeDasharray="6 4" />
      <line {...boundary(right, [-0.3, 1])} stroke={colors.red} strokeWidth={2.2} />
      {same.map(([a, b], i) => {
        const yNew = newRule(a, b);
        const flipped = yNew !== oldRule(a, b);
        return (
          <Fragment key={`s${i}`}>
            <circle cx={right.sx(a)} cy={right.sy(b)} r={3} fill={colors.violet} fillOpacity={yNew ? 0.75 : 0.12} stroke={colors.violet} strokeWidth={1} />
            {flipped && <circle cx={right.sx(a)} cy={right.sy(b)} r={6} fill="none" stroke={colors.red} strokeWidth={1.3} />}
          </Fragment>
        );
      })}
      </g>
      <text x={right.sx(-3.4)} y={48} fontSize={10} fontWeight={700} fill={inkSecondary} stroke={card2Bg} strokeWidth={3} paintOrder="stroke">
        점선: 옛 규칙
      </text>
      <text x={right.sx(-3.4)} y={34 + S - 8} fontSize={10} fontWeight={700} fill={colors.red} stroke={card2Bg} strokeWidth={3} paintOrder="stroke">
        실선: 새 규칙
      </text>
      <Lines x={250} y={110} lines={["경계는 그대로", "입력만 이동", "→ PSI로 감지"]} size={10.5} anchor="start" color={colors.blue} weight={700} />
      <Lines x={610} y={110} lines={["입력은 그대로", "정답이 뒤집힘", "→ 라벨로 성능", "   을 추적"]} size={10.5} anchor="start" color={colors.red} weight={700} />
    </DiagramFrame>
  );
}

export function PsiBins() {
  // 본문 코드: 학습 데이터 10분위(각 10%)에 대해 운영 데이터(평균 +5)의 구간 비율과 구간별 PSI 기여.
  const q = [0.0317, 0.0477, 0.0623, 0.082, 0.0777, 0.1003, 0.1093, 0.1183, 0.1443, 0.2263];
  const p = 0.1;
  const contrib = q.map((qi) => (p - qi) * Math.log(p / qi));
  const total = contrib.reduce((a, b) => a + b, 0);
  const base = 150;
  const sy = linear(0, 0.24, base, 24);
  const bw = 30;
  const scen = [
    { name: "변화 없음", v: 0.002 },
    { name: "평균 +3", v: 0.089 },
    { name: "평균 +5", v: 0.268 },
    { name: "평균 +8", v: 0.55 },
  ];
  const px = linear(0, 0.6, 470, 700);
  return (
    <DiagramFrame
      title="PSI: 구간마다 비율 차이를 재서 더한다"
      caption={`왼쪽: 본문 코드에서 학습 데이터를 10분위로 나눈 구간(구간마다 10%, 회색 점선)에 평균이 5만큼 오른 운영 데이터를 넣었더니 비율이 오른쪽 구간으로 쏠렸다(파랑). 각 구간의 (p − q)·ln(p/q)를 더한 PSI는 ${total.toFixed(3)}이고, 비율이 가장 크게 어긋난 양 끝 구간이 대부분을 차지한다. 오른쪽: 평균을 0, 3, 5, 8만큼 옮긴 네 경우의 PSI와 관행적 기준(0.1 관찰, 0.2 조사)이다. 이 기준은 경험칙이지 통계적 검정이 아니다.`}
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <text x={14} y={16} fontSize={11.5} fontWeight={700} fill={ink}>
        구간별 비율 (평균 +5)
      </text>
      <line x1={30} x2={30 + 10 * bw + 6} y1={sy(p)} y2={sy(p)} stroke={inkSecondary} strokeDasharray="4 3" />
      <text x={30 + 10 * bw + 10} y={sy(p) + 3} fontSize={9.5} fill={inkSecondary}>
        학습 10%
      </text>
      {q.map((v, i) => (
        <g key={i}>
          <rect x={34 + i * bw} y={sy(v)} width={bw - 8} height={base - sy(v)} rx={3} fill={colors.blue} fillOpacity={0.7} />
          <text x={34 + i * bw + (bw - 8) / 2} y={sy(v) - 4} textAnchor="middle" fontSize={8.5} fill={inkSecondary}>
            {Math.round(v * 100)}%
          </text>
          <text x={34 + i * bw + (bw - 8) / 2} y={base + 14} textAnchor="middle" fontSize={9} fill={inkSecondary}>
            {i + 1}
          </text>
          <rect x={34 + i * bw} y={base + 22} width={bw - 8} height={Math.max(1.5, contrib[i] * 400)} rx={2} fill={colors.orange} fillOpacity={0.8} />
          <text x={34 + i * bw + (bw - 8) / 2} y={base + 30 + Math.max(1.5, contrib[i] * 400) + 6} textAnchor="middle" fontSize={8.5} fill={colors.orange}>
            {contrib[i] >= 0.01 ? contrib[i].toFixed(2) : contrib[i].toFixed(3).replace(/^0/, "")}
          </text>
        </g>
      ))}
      <line x1={30} x2={30 + 10 * bw} y1={base} y2={base} stroke={inkMuted} />
      <text x={30 + 10 * bw + 10} y={base + 34} fontSize={10} fontWeight={700} fill={colors.orange}>
        구간별 기여
      </text>
      <text x={30 + 10 * bw + 10} y={base + 50} fontSize={11} fontWeight={800} fill={ink}>
        {`합 = ${total.toFixed(3)}`}
      </text>
      <text x={470} y={16} fontSize={11.5} fontWeight={700} fill={ink}>
        평균 이동에 따른 PSI
      </text>
      <rect x={px(0)} y={40} width={px(0.1) - px(0)} height={130} fill={colors.green} fillOpacity={0.1} />
      <rect x={px(0.1)} y={40} width={px(0.2) - px(0.1)} height={130} fill={colors.orange} fillOpacity={0.12} />
      <rect x={px(0.2)} y={40} width={px(0.6) - px(0.2)} height={130} fill={colors.red} fillOpacity={0.08} />
      <text x={(px(0) + px(0.1)) / 2} y={56} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.green}>
        안정
      </text>
      <text x={(px(0.1) + px(0.2)) / 2} y={56} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.orange}>
        관찰
      </text>
      <text x={(px(0.2) + px(0.6)) / 2} y={56} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.red}>
        조사
      </text>
      {scen.map((s, i) => (
        <g key={s.name}>
          <circle cx={px(s.v)} cy={78 + i * 24} r={5} fill={ink} />
          <text x={px(s.v) + (s.v > 0.4 ? -9 : 9)} y={82 + i * 24} textAnchor={s.v > 0.4 ? "end" : "start"} fontSize={10} fontWeight={700} fill={ink}>
            {`${s.name}: ${s.v.toFixed(3)}`}
          </text>
        </g>
      ))}
      {[0, 0.1, 0.2, 0.4, 0.6].map((t) => (
        <text key={t} x={px(t)} y={186} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
      <line x1={px(0)} x2={px(0.6)} y1={172} y2={172} stroke={inkMuted} />
    </DiagramFrame>
  );
}

export function AblationBars() {
  // 본문 절제 연구 표: 전체 91.2, A 제거 88.5, B 제거 90.9, C 제거 85.1, baseline 80.3.
  const full = 91.2;
  const rows = [
    { name: "전체 (A+B+C)", v: 91.2, c: colors.green },
    { name: "A 제거", v: 88.5, c: colors.blue },
    { name: "B 제거", v: 90.9, c: colors.blue },
    { name: "C 제거", v: 85.1, c: colors.blue },
    { name: "baseline", v: 80.3, c: inkMuted },
  ];
  const sx = linear(78, 92, 130, 430);
  return (
    <DiagramFrame
      title="절제 연구: 하나씩 빼 보면 무엇이 효과였는지 보인다"
      caption="본문 표를 막대로 그렸다. 빨간 부분이 전체 방법에서 그 구성요소를 뺐을 때 떨어진 폭이다. C를 빼면 6.1%p가 떨어져 가장 크게 기여하고, A는 2.7%p, B는 0.3%p다. 세 폭을 더한 9.1%p가 baseline 대비 전체 향상 10.9%p보다 작으므로, 구성요소들이 함께 있을 때 더 효과적인 상호작용이 있다. B의 0.3%p는 시드에 따른 변동(보통 0.1~1%p)보다 작을 수 있어, 여러 시드로 반복하기 전에는 효과가 있다고도 없다고도 단정할 수 없다."
      viewBox="0 0 720 230"
      minWidth={560}
    >
      {[78, 80, 82, 84, 86, 88, 90, 92].map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={18} y2={196} stroke="var(--border-hairline)" />
          <text x={sx(t)} y={212} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {`${t}%`}
          </text>
        </g>
      ))}
      <line x1={sx(full)} x2={sx(full)} y1={14} y2={196} stroke={colors.green} strokeWidth={1.4} strokeDasharray="4 3" />
      {rows.map((r, i) => {
        const y = 24 + i * 34;
        return (
          <g key={r.name}>
            <text x={122} y={y + 17} textAnchor="end" fontSize={11.5} fontWeight={700} fill={ink}>
              {r.name}
            </text>
            <rect x={sx(78)} y={y} width={sx(r.v) - sx(78)} height={24} rx={3} fill={r.c} fillOpacity={0.55} />
            {i > 0 && i < 4 && <rect x={sx(r.v)} y={y} width={sx(full) - sx(r.v)} height={24} fill={colors.red} fillOpacity={0.65} />}
            <text x={sx(Math.max(r.v, i > 0 && i < 4 ? full : r.v)) + 8} y={y + 17} fontSize={11} fontWeight={700} fill={i > 0 && i < 4 ? colors.red : ink}>
              {i === 0 ? `${r.v}%` : i === 4 ? `${r.v}%  (전체까지 +10.9%p)` : `${r.v}%  (−${(full - r.v).toFixed(1)}%p)`}
            </text>
          </g>
        );
      })}
      <Lines x={636} y={56} lines={["제거 효과의 합", "2.7 + 0.3 + 6.1 = 9.1%p"]} size={11} anchor="middle" color={ink} weight={700} />
      <Lines x={636} y={112} lines={["< 전체 향상 10.9%p", "→ 함께 있을 때 더 효과적", "(상호작용)"]} size={10.5} anchor="middle" color={colors.violet} weight={700} />
    </DiagramFrame>
  );
}

export function SeedPaired() {
  // 본문 코드: 두 방법을 시드 5개로 학습한 검증 정확도(%).
  const a = [88.1, 89.4, 87.6, 90.2, 88.7];
  const b = [89.0, 89.1, 88.9, 90.6, 89.5];
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const sd = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + (x - mean(v)) ** 2, 0) / (v.length - 1));
  const sy = linear(87, 91, 200, 24);
  const xa = 150;
  const xb = 330;
  return (
    <DiagramFrame
      title="시드 하나로 비교하면 승자가 바뀐다: 짝지어 보기"
      caption={`두 방법을 같은 시드 5개로 학습했다. 같은 시드끼리 선으로 이었다(초록: B가 이김, 빨강: A가 이김). 시드 0만 봤다면 B가, 시드 1만 봤다면 A가 이긴다. 평균은 B가 ${(mean(b) - mean(a)).toFixed(2)}%p 높지만 A의 표준편차(${sd(a).toFixed(2)})보다 작은 차이라, 평균과 표준편차만으로는 판단이 어렵다. 같은 시드끼리 짝지어 보면 B가 5번 중 4번 이겼다는 더 촘촘한 정보가 나온다.`}
      viewBox="0 0 720 232"
      minWidth={560}
    >
      {[87, 88, 89, 90, 91].map((t) => (
        <g key={t}>
          <line x1={100} x2={380} y1={sy(t)} y2={sy(t)} stroke="var(--border-hairline)" />
          <text x={92} y={sy(t) + 3.5} textAnchor="end" fontSize={10} fill={inkSecondary}>
            {`${t}%`}
          </text>
        </g>
      ))}
      {a.map((va, i) => {
        const win = b[i] > va;
        return (
          <g key={i}>
            <line x1={xa} y1={sy(va)} x2={xb} y2={sy(b[i])} stroke={win ? colors.green : colors.red} strokeWidth={1.8} opacity={0.85} />
            <circle cx={xa} cy={sy(va)} r={5} fill={colors.blue} />
            <circle cx={xb} cy={sy(b[i])} r={5} fill={colors.orange} />
            <text x={xa - 10} y={sy(va) + 4} textAnchor="end" fontSize={9.5} fill={inkSecondary}>
              {`시드 ${i}`}
            </text>
          </g>
        );
      })}
      {[
        { x: xa - 52, v: a, c: colors.blue, n: "방법 A" },
        { x: xb + 52, v: b, c: colors.orange, n: "방법 B" },
      ].map((m) => (
        <g key={m.n}>
          <line x1={m.x} x2={m.x} y1={sy(mean(m.v) - sd(m.v))} y2={sy(mean(m.v) + sd(m.v))} stroke={m.c} strokeWidth={2} />
          <line x1={m.x - 6} x2={m.x + 6} y1={sy(mean(m.v) - sd(m.v))} y2={sy(mean(m.v) - sd(m.v))} stroke={m.c} strokeWidth={2} />
          <line x1={m.x - 6} x2={m.x + 6} y1={sy(mean(m.v) + sd(m.v))} y2={sy(mean(m.v) + sd(m.v))} stroke={m.c} strokeWidth={2} />
          <rect x={m.x - 5} y={sy(mean(m.v)) - 5} width={10} height={10} fill={m.c} />
        </g>
      ))}
      <text x={xa} y={220} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.blue}>
        {`A ${mean(a).toFixed(2)} ± ${sd(a).toFixed(2)}`}
      </text>
      <text x={xb} y={220} textAnchor="middle" fontSize={12} fontWeight={800} fill={colors.orange}>
        {`B ${mean(b).toFixed(2)} ± ${sd(b).toFixed(2)}`}
      </text>
      <Lines x={430} y={50} lines={["시드 하나만 보면", "시드 0 → B 승, 시드 1 → A 승"]} size={11} anchor="start" color={ink} weight={700} />
      <Lines x={430} y={104} lines={["평균 차 0.62%p < A의 표준편차 1.03", "→ 평균±표준편차로는 애매하다"]} size={10.5} anchor="start" />
      <Lines x={430} y={150} lines={["같은 시드끼리 짝지으면", "차이 0.9, −0.3, 1.3, 0.4, 0.8", "→ B가 5번 중 4번 이김"]} size={10.5} anchor="start" color={colors.green} weight={700} />
    </DiagramFrame>
  );
}

export function PaperTimeline() {
  // 본문 핵심 논문 표를 계열별로 배치했다. 1958·1986은 압축 구간.
  const P = "ptl";
  const yr = (y: number) => (y < 2000 ? (y === 1958 ? 122 : 172) : linear(2011.5, 2023.5, 236, 700)(y));
  const lanes = [
    { name: "신경망 기초", y: 40, c: colors.blue },
    { name: "비전·생성", y: 96, c: colors.green },
    { name: "언어·시퀀스", y: 152, c: colors.violet },
    { name: "LLM 활용·정렬", y: 208, c: colors.orange },
  ];
  const papers = [
    { t: "퍼셉트론", y: 1958, lane: 0, up: true },
    { t: "역전파", y: 1986, lane: 0, up: false },
    { t: "AlexNet", y: 2012, lane: 1, up: true },
    { t: "ResNet", y: 2015, lane: 1, up: false },
    { t: "ViT", y: 2020, lane: 1, up: true },
    { t: "DDPM", y: 2020.55, lane: 1, up: false },
    { t: "CLIP", y: 2021.1, lane: 1, up: true },
    { t: "Word2Vec", y: 2013, lane: 2, up: false },
    { t: "Seq2Seq", y: 2014, lane: 2, up: true },
    { t: "어텐션", y: 2014.75, lane: 2, up: false },
    { t: "Transformer", y: 2017, lane: 2, up: true },
    { t: "BERT", y: 2018, lane: 2, up: false },
    { t: "GPT-1~3", y: 2019.2, lane: 2, up: true },
    { t: "RAG", y: 2020.3, lane: 3, up: false },
    { t: "LoRA", y: 2021.3, lane: 3, up: true },
    { t: "DPO", y: 2023, lane: 3, up: false },
  ];
  const pos = (i: number) => ({ x: yr(papers[i].y), y: lanes[papers[i].lane].y });
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [10, 12],
    [10, 4],
    [4, 6],
    [12, 13],
    [12, 14],
    [14, 15],
  ];
  return (
    <DiagramFrame
      title="8주를 관통하는 핵심 논문: 계열로 읽기"
      caption="본문 표의 논문을 발표 연도(가로)와 계열(세로)로 배치하고, 앞 연구 위에 선 관계를 선으로 이었다. 퍼셉트론과 역전파는 3주차, CNN 계열은 4주차, 단어 임베딩부터 Transformer까지는 5주차, BERT·GPT와 LoRA·DPO는 6주차, RAG와 CLIP은 7주차에서 다뤘다. 어텐션이 Transformer로, Transformer가 BERT·GPT와 ViT로, GPT 계열이 RAG·LoRA·DPO 같은 활용·정렬 기법으로 이어진다. 연도순보다 이런 계열을 따라 읽으면 흐름이 잘 보인다. 1958년과 1986년은 간격을 줄여 그렸다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      {lanes.map((l) => (
        <g key={l.name}>
          <line x1={14} x2={706} y1={l.y} y2={l.y} stroke={l.c} strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" />
          <text x={18} y={l.y + 4} fontSize={10} fontWeight={800} fill={l.c}>
            {l.name}
          </text>
        </g>
      ))}
      {links.map(([s, t]) => {
        const a = pos(s);
        const b = pos(t);
        return <ArrPath key={`${s}-${t}`} d={`M${a.x + 6},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x - 9},${b.y}`} color={inkMuted} marker={`${P}-ink`} width={1.2} />;
      })}
      {papers.map((p, i) => {
        const q = pos(i);
        const c = lanes[p.lane].c;
        return (
          <g key={p.t}>
            <circle cx={q.x} cy={q.y} r={6} fill={c} stroke="var(--surface-card)" strokeWidth={1.5} />
            <text x={q.x} y={q.y + (p.up ? -11 : 21)} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              {p.t}
            </text>
          </g>
        );
      })}
      <line x1={14} x2={706} y1={236} y2={236} stroke={inkMuted} />
      {[1958, 1986].map((y) => (
        <text key={y} x={yr(y)} y={250} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {y}
        </text>
      ))}
      <text x={204} y={250} textAnchor="middle" fontSize={11} fill={inkMuted}>
        ≈
      </text>
      {[2012, 2014, 2016, 2018, 2020, 2022].map((y) => (
        <text key={y} x={yr(y)} y={250} textAnchor="middle" fontSize={10} fill={inkSecondary}>
          {y}
        </text>
      ))}
    </DiagramFrame>
  );
}

export function LlmHostingChoices() {
  // 개념도: API는 종량제(원점에서 출발하는 직선), 자체 호스팅은 고정비 + 작은 변동비. 트래픽이 손익분기점을 넘으면 자체 호스팅이 싸진다.
  const P = "lhc";
  const G = { left: 44, top: 22, width: 280, height: 160 };
  const sx = linear(0, 10, G.left, G.left + G.width);
  const sy = linear(0, 10, G.top + G.height, G.top);
  const api = (x: number) => 0.9 * x;
  const local = (x: number) => 3.6 + 0.25 * x;
  const be = 3.6 / (0.9 - 0.25);
  return (
    <DiagramFrame
      title="LLM을 어디서 돌릴까: API와 자체 호스팅, 그리고 서빙 도구"
      caption="왼쪽은 개념도다. API는 쓴 만큼 내는 종량제라 비용이 트래픽에 비례하고(원점에서 출발), 자체 호스팅은 GPU 서버라는 고정비가 먼저 들지만 호출당 추가 비용이 작다. 트래픽이 두 선이 만나는 손익분기점을 넘으면 자체 호스팅이 싸진다. 여기에 데이터가 외부로 나가면 안 되는지, 지연시간에 얼마나 민감한지가 함께 판단 기준이 된다. 오른쪽: 자체 호스팅을 고르면 Hugging Face Transformers로 모델을 가져오고, 실제 트래픽 앞에는 vLLM(대규모 동시 서빙)이나 Ollama(개인·소규모 실험)를 세운다."
      viewBox="0 0 720 230"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[]} yTicks={[]} xLabel="월 트래픽 →" yLabel="월 비용" grid={false} />
      <rect x={sx(be)} y={G.top} width={sx(10) - sx(be)} height={G.height} fill={colors.green} fillOpacity={0.07} />
      <path d={linePath(sample(api, 0, 10, 20).map(([x, y]) => [sx(x), sy(Math.min(y, 10))] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <path d={linePath(sample(local, 0, 10, 20).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      <circle cx={sx(be)} cy={sy(api(be))} r={5} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={1.5} />
      <text x={sx(be) + 8} y={sy(api(be)) + 16} fontSize={10} fontWeight={800} fill={colors.orange}>
        손익분기점
      </text>
      <text x={sx(2.6)} y={sy(api(2.6)) + 20} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        API (종량제)
      </text>
      <text x={sx(7.6)} y={sy(local(7.6)) + 18} fontSize={10.5} fontWeight={800} fill={colors.violet}>
        자체 호스팅 (고정비 + α)
      </text>
      <text x={sx(1.6)} y={G.top + 14} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        API가 유리
      </text>
      <text x={sx(8.4)} y={G.top + 14} textAnchor="middle" fontSize={9.5} fill={colors.green} fontWeight={700}>
        자체 호스팅이 유리
      </text>
      <line x1={366} y1={14} x2={366} y2={220} stroke="var(--border-hairline)" />
      <Tag x={384} y={86} w={140} h={50} lines={["HF Transformers", "모델·토크나이저를 가져온다"]} color={colors.orange} size={11} />
      <Arr x1={526} y1={100} x2={556} y2={64} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={526} y1={122} x2={556} y2={158} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={560} y={30} w={146} h={56} lines={["vLLM", "대규모 동시 서빙", "PagedAttention으로 KV 캐시 관리"]} color={colors.blue} size={11} />
      <Tag x={560} y={132} w={146} h={50} lines={["Ollama", "개인·소규모 실험, 명령 몇 줄"]} color={colors.green} size={11} />
      <text x={545} y={206} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        모델을 어디서 가져올까 → 트래픽 앞에 어떻게 세울까
      </text>
    </DiagramFrame>
  );
}

export function TokenCostBreakdown() {
  // 본문 예제: 단가 입력 3달러·출력 15달러 / 100만 토큰. 기본(2,000 + 500) 0.0135달러, RAG(6,000 + 500) 0.0255달러. 하루 1만 회 × 30일.
  const rows = [
    { t: "기본 호출", nin: 2000, nout: 500 },
    { t: "RAG (검색 조각 추가)", nin: 6000, nout: 500 },
  ].map((r) => ({ ...r, cin: (r.nin * 3) / 1e6, cout: (r.nout * 15) / 1e6 }));
  const bx = linear(0, 0.034, 0, 420);
  return (
    <DiagramFrame
      title="호출 비용 = 입력 토큰 × 입력 단가 + 출력 토큰 × 출력 단가"
      caption="본문 예제의 단가(입력 100만 토큰당 3달러, 출력 15달러)다. 입력 2,000·출력 500토큰 호출은 0.006 + 0.0075 = 0.0135달러로, 하루 1만 번씩 30일이면 약 4,050달러다. RAG가 검색 조각을 붙여 입력이 6,000토큰이 되면 0.018 + 0.0075 = 0.0255달러, 한 달 약 7,650달러로 두 배 가까이 된다. 출력 단가가 입력의 5배여도, 입력이 긴 RAG에서는 비용의 70% 이상이 입력에서 나온다. 검색 결과를 얼마나 압축해 넣을지가 성능뿐 아니라 비용 문제인 이유다."
      viewBox="0 0 720 200"
      minWidth={600}
    >
      <text x={180} y={20} fontSize={10.5} fontWeight={800} fill={inkSecondary}>
        호출 1회 비용 (달러)
      </text>
      <text x={690} y={20} textAnchor="end" fontSize={10.5} fontWeight={800} fill={inkSecondary}>
        하루 1만 회 × 30일
      </text>
      {rows.map((r, i) => {
        const y = 34 + i * 70;
        const total = r.cin + r.cout;
        return (
          <g key={r.t}>
            <text x={14} y={y + 14} fontSize={11.5} fontWeight={800} fill={ink}>
              {r.t}
            </text>
            <text x={14} y={y + 30} fontSize={9.5} fill={inkSecondary}>
              {`입력 ${r.nin.toLocaleString("en-US")} · 출력 ${r.nout}토큰`}
            </text>
            <rect x={180} y={y} width={bx(r.cin)} height={30} fill={colors.blue} fillOpacity={0.6} />
            <rect x={180 + bx(r.cin)} y={y} width={bx(r.cout)} height={30} fill={colors.orange} fillOpacity={0.6} />
            <text x={180 + bx(r.cin) / 2} y={y + 19} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
              {`입력 ${r.cin.toFixed(4).replace(/0+$/, "")} (${Math.round((r.cin / total) * 100)}%)`}
            </text>
            <text x={180 + bx(r.cin) + bx(r.cout) / 2} y={y + 19} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
              {`출력 ${r.cout.toFixed(4)}`}
            </text>
            <text x={180 + bx(total) + 8} y={y + 19} fontSize={11} fontWeight={800} fill={ink}>
              {`= ${total.toFixed(4)}`}
            </text>
            <text x={690} y={y + 20} textAnchor="end" fontSize={13} fontWeight={800} fill={i === 0 ? colors.blue : colors.red}>
              {`약 ${Math.round(total * 300000).toLocaleString("en-US")}달러`}
            </text>
          </g>
        );
      })}
      <text x={14} y={186} fontSize={10} fill={inkSecondary}>
        단가: 입력 3달러 / 100만 토큰 (파랑), 출력 15달러 / 100만 토큰 (주황)
      </text>
    </DiagramFrame>
  );
}

export function TraceWaterfall() {
  // 예시: 에이전트 요청 하나의 트레이스. 각 줄이 한 구간(span)이고 가로 위치가 시간이다.
  const spans = [
    { t: "요청 전체", a: 0, b: 4.2, c: inkMuted, d: 0 },
    { t: "LLM 호출 ① 계획", a: 0.05, b: 1.1, c: colors.violet, d: 1, note: "입력 820 · 출력 95토큰" },
    { t: "도구: 문서 검색", a: 1.1, b: 1.6, c: colors.green, d: 1 },
    { t: "LLM 호출 ② 다음 행동", a: 1.6, b: 2.4, c: colors.violet, d: 1 },
    { t: "도구: DB 조회", a: 2.4, b: 2.65, c: colors.red, d: 1, note: "✗ 타임아웃" },
    { t: "도구: DB 조회 (재시도)", a: 2.65, b: 3.0, c: colors.green, d: 1 },
    { t: "LLM 호출 ③ 최종 답", a: 3.0, b: 4.2, c: colors.violet, d: 1, note: "출력 310토큰" },
  ];
  const sx = linear(0, 4.4, 200, 690);
  return (
    <DiagramFrame
      title="트레이스: 요청 하나가 거친 단계를 시간 순서로 다시 그린다"
      caption="예시다. 사용자 요청 하나가 내부적으로 LLM 호출 세 번과 도구 호출 세 번(그중 하나는 타임아웃 뒤 재시도)을 거쳤다. 각 막대가 한 구간이고 가로 위치가 시간이라, 어느 단계가 느렸는지, 어디서 실패하고 재시도했는지가 한눈에 보인다. 로그는 이 구간들의 원문 입력·출력을, 메트릭은 이런 요청 수천 개의 지연시간 분포·토큰 수·에러율 같은 집계를 맡는다. 에이전트처럼 여러 단계로 이어지는 시스템은 트레이스 없이는 '어느 단계에서 왜 실패했는가'를 재구성하기 어렵다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      {[0, 1, 2, 3, 4].map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={20} y2={204} stroke="var(--border-hairline)" />
          <text x={sx(t)} y={218} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
            {`${t}초`}
          </text>
        </g>
      ))}
      {spans.map((s, i) => {
        const y = 24 + i * 26;
        return (
          <g key={s.t}>
            <text x={14 + s.d * 12} y={y + 13} fontSize={10.5} fontWeight={i === 0 ? 800 : 600} fill={ink}>
              {s.t}
            </text>
            <rect x={sx(s.a)} y={y} width={sx(s.b) - sx(s.a)} height={18} rx={3} fill={s.c} fillOpacity={i === 0 ? 0.25 : 0.6} />
            {s.note && (
              <text x={s.b > 3.8 ? sx(s.b) - 6 : sx(s.b) + 6} y={y + 13} textAnchor={s.b > 3.8 ? "end" : "start"} fontSize={9.5} fontWeight={700} fill={s.c === colors.red ? colors.red : s.b > 3.8 ? ink : inkSecondary}>
                {s.note}
              </text>
            )}
          </g>
        );
      })}
      <text x={sx(4.2)} y={36} textAnchor="end" fontSize={10} fontWeight={800} fill={ink}>
        4.2초
      </text>
    </DiagramFrame>
  );
}

export function GuardrailLayers() {
  // 본문 output_guard: 전화번호 정규식 01[016789]-?\d{3,4}-?\d{4}. 표현을 바꾸면 통과한다.
  const P = "grl";
  return (
    <DiagramFrame
      title="가드레일: 모델의 입출력을 감시하는 별도의 층"
      caption="입력 가드는 프롬프트 인젝션 같은 악의적 지시를, 출력 가드는 개인정보·유해 콘텐츠를 걸러 낸다. 모델 자체를 안전하게 만드는 것이 아니라 모델 앞뒤에 감시 층을 덧대는 방식이다. 아래는 본문 코드의 출력 가드다. '010-1234-5678'은 정규식에 걸려 가려지지만, 같은 번호를 '공일공 일이삼사 오육칠팔'로 쓰면 그대로 통과한다. 가드레일은 확률적인 필터일 뿐이므로, 최소 권한·사람 승인처럼 행동 자체를 막는 장치와 함께 써야 한다."
      viewBox="0 0 720 222"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {chip8(14, 30, "사용자 입력", inkMuted, 86, 30, 0.16, 11)}
      <Arr x1={102} y1={45} x2={124} y2={45} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={128} y={20} w={140} h={50} lines={["입력 가드", "인젝션·악의적 지시 탐지"]} color={colors.orange} size={11} />
      <Arr x1={270} y1={45} x2={292} y2={45} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={296} y={20} w={110} h={50} lines={["LLM", "답을 생성"]} color={colors.violet} size={11} />
      <Arr x1={408} y1={45} x2={430} y2={45} color={inkSecondary} marker={`${P}-ink`} />
      <Tag x={434} y={20} w={150} h={50} lines={["출력 가드", "개인정보·유해 내용 검사"]} color={colors.orange} size={11} />
      <Arr x1={586} y1={45} x2={608} y2={45} color={inkSecondary} marker={`${P}-ink`} />
      {chip8(612, 30, "사용자에게", inkMuted, 94, 30, 0.16, 11)}
      <line x1={14} x2={706} y1={88} y2={88} stroke="var(--border-hairline)" />
      <text x={14} y={110} fontSize={11} fontWeight={800} fill={ink}>
        본문 코드의 출력 가드 (전화번호 정규식)
      </text>
      <rect x={14} y={120} width={300} height={30} rx={6} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={24} y={140} fontSize={10.5} fill={ink}>
        담당자 연락처는 010-1234-5678입니다.
      </text>
      <Arr x1={318} y1={135} x2={350} y2={135} color={colors.green} marker={`${P}-ink`} />
      <rect x={354} y={120} width={352} height={30} rx={6} fill={colors.green} fillOpacity={0.1} stroke={colors.green} />
      <text x={364} y={140} fontSize={10.5} fill={ink}>
        담당자 연락처는 [전화번호 가림]입니다. ✓
      </text>
      <rect x={14} y={162} width={300} height={30} rx={6} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={24} y={182} fontSize={10.5} fill={ink}>
        연락처는 공일공 일이삼사 오육칠팔입니다.
      </text>
      <Arr x1={318} y1={177} x2={350} y2={177} color={colors.red} marker={`${P}-ink`} />
      <rect x={354} y={162} width={352} height={30} rx={6} fill={colors.red} fillOpacity={0.1} stroke={colors.red} />
      <text x={364} y={182} fontSize={10.5} fill={ink}>
        연락처는 공일공 일이삼사 오육칠팔입니다. ✗ 통과
      </text>
      <text x={360} y={212} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.red}>
        표현을 바꾸면 뚫린다 → 최소 권한·사람 승인 같은 장치와 함께
      </text>
    </DiagramFrame>
  );
}

export function TokenBucket() {
  // 본문 코드: rate = 1(초당 1개 충전), capacity = 3. 요청 시각 [0, 0.1, 0.2, 0.3, 0.4, 1.5, 1.6] → 허용 [T, T, T, F, F, T, F].
  const times = [0, 0.1, 0.2, 0.3, 0.4, 1.5, 1.6];
  const rate = 1;
  const cap = 3;
  let tokens = cap;
  let last = 0;
  const events = times.map((t) => {
    tokens = Math.min(cap, tokens + (t - last) * rate);
    last = t;
    const ok = tokens >= 1;
    const before = tokens;
    if (ok) tokens -= 1;
    return { t, ok, before, after: tokens };
  });
  const pts: [number, number][] = [[0, cap]];
  events.forEach((e, i) => {
    const prevT = i === 0 ? 0 : events[i - 1].t;
    const prevAfter = i === 0 ? cap : events[i - 1].after;
    const full = prevT + (cap - prevAfter) / rate;
    if (i > 0 && full < e.t) pts.push([full, cap]);
    pts.push([e.t, e.before], [e.t, e.after]);
  });
  const end = 2.2;
  const lastE = events[events.length - 1];
  pts.push([Math.min(end, lastE.t + (cap - lastE.after) / rate), Math.min(cap, lastE.after + (end - lastE.t) * rate)]);
  if (lastE.t + (cap - lastE.after) / rate < end) pts.push([end, cap]);
  const G = { left: 60, top: 18, width: 470, height: 140 };
  const sx = linear(0, end, G.left, G.left + G.width);
  const sy = linear(0, 3.4, G.top + G.height, G.top);
  return (
    <DiagramFrame
      title="토큰 버킷: 평균 속도는 제한하고 순간적인 몰림은 받아 준다"
      caption="본문 코드의 토큰 버킷(초당 1개씩 차고, 최대 3개까지 쌓임)이다. 보라색 선이 버킷에 남은 토큰 수이고, 요청이 허용될 때마다 1개씩 줄어든다. 0~0.2초에 몰린 요청 세 개는 쌓여 있던 토큰으로 바로 허용되지만, 0.3초와 0.4초의 요청은 토큰이 1개가 안 되어 거부된다. 1.5초에는 토큰이 1.5개까지 다시 차서 허용되고, 바로 뒤 1.6초 요청은 0.6개뿐이라 거부된다. 순간적으로는 3개까지 받아 주되, 오래 보면 초당 1회로 묶인다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[0, 1, 2, 3]} fmtX={(v) => `${v}초`} yLabel="남은 토큰" />
      <line x1={G.left} x2={G.left + G.width} y1={sy(1)} y2={sy(1)} stroke={colors.orange} strokeDasharray="4 3" />
      <text x={G.left + G.width + 6} y={sy(1) + 4} fontSize={9.5} fontWeight={700} fill={colors.orange}>
        ← 요청 1개에 토큰 1개
      </text>
      <path d={linePath(pts.map(([t, v]) => [sx(t), sy(v)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.4} />
      {events.map((e) => (
        <g key={e.t}>
          <line x1={sx(e.t)} x2={sx(e.t)} y1={G.top + G.height + 20} y2={G.top + G.height + 26} stroke={e.ok ? colors.green : colors.red} strokeWidth={2} />
          <text x={sx(e.t)} y={G.top + G.height + 38} textAnchor="middle" fontSize={11} fontWeight={800} fill={e.ok ? colors.green : colors.red}>
            {e.ok ? "✓" : "✗"}
          </text>
        </g>
      ))}
      <text x={G.left} y={G.top + G.height + 54} fontSize={9.5} fill={inkSecondary}>
        요청 시각: 0, 0.1, 0.2, 0.3, 0.4, 1.5, 1.6초 (✓ 허용, ✗ 거부)
      </text>
      <Lines x={552} y={46} lines={["허용 ✓ 4건 · 거부 ✗ 3건", "", "rate = 초당 1개 충전", "capacity = 최대 3개"]} size={10.5} anchor="start" color={ink} weight={600} />
    </DiagramFrame>
  );
}

export function QuasiIdentifier() {
  // 본문 코드(가상 1,000명): (나이 50가지, 성별, 동네 30곳)으로 유일 71.7%, 나이를 10년 단위로 3.8%(k = 1). Sweeney(2000)의 미국 추정 87%.
  const bars = [
    { t: "(나이, 성별, 동네)", sub: "50 × 2 × 30 = 3,000가지 조합에 1,000명", v: 0.717, c: colors.red },
    { t: "나이를 10년 단위로", sub: "5 × 2 × 30 = 300가지 조합에 1,000명", v: 0.038, c: colors.orange },
  ];
  const bx = linear(0, 1, 0, 300);
  return (
    <DiagramFrame
      title="이름을 지워도 사람은 특정된다: 준식별자의 조합"
      caption="본문 코드의 가상 1,000명 데이터다. 나이(50가지)·성별·동네(30곳) 세 값의 조합은 3,000가지라 사람 수보다 많고, 그 결과 72%가 자기만의 조합을 가져 유일하게 특정된다. 나이를 10년 단위로 뭉뚱그리면 조합이 300가지로 줄어 유일한 사람이 4%로 떨어지지만, 아직 혼자인 사람이 있어 k = 1이다. Sweeney(2000)는 미국 인구의 약 87%가 우편번호·성별·생년월일만으로 유일하게 특정된다고 추정했다. 특징이 많을수록 한 사람의 조합은 더 독특해진다."
      viewBox="0 0 720 196"
      minWidth={580}
    >
      <text x={20} y={20} fontSize={11} fontWeight={800} fill={inkSecondary}>
        준식별자 조합이 유일한 사람의 비율
      </text>
      {bars.map((b, i) => {
        const y = 34 + i * 62;
        return (
          <g key={b.t}>
            <text x={20} y={y + 14} fontSize={11.5} fontWeight={800} fill={ink}>
              {b.t}
            </text>
            <text x={20} y={y + 30} fontSize={9.5} fill={inkSecondary}>
              {b.sub}
            </text>
            <rect x={250} y={y} width={bx(1)} height={26} rx={3} fill="var(--border-hairline)" />
            <rect x={250} y={y} width={Math.max(3, bx(b.v))} height={26} rx={3} fill={b.c} fillOpacity={0.65} />
            <text x={250 + Math.max(3, bx(b.v)) + 8} y={y + 18} fontSize={12} fontWeight={800} fill={ink}>
              {`${Math.round(b.v * 100)}%`}
            </text>
          </g>
        );
      })}
      <text x={250} y={178} fontSize={10} fill={inkSecondary}>
        뭉뚱그린 뒤에도 가장 작은 묶음 k = 1 → 아직 k-익명성이 아니다
      </text>
      <Tag x={570} y={40} w={136} h={70} lines={["실제 사례", "미국 인구의 약 87%", "우편번호·성별·생년월일"]} color={colors.violet} size={11} />
    </DiagramFrame>
  );
}

export function KAnonymityTable() {
  // 설명용 예시 기록 6개: 동네를 구로, 나이를 10년 단위로 뭉뚱그려 k = 3. 둘째 묶음은 병명이 모두 같아 동질성 공격에 노출된다.
  const raw = [
    ["23", "여", "역삼동", "감기"],
    ["27", "여", "대치동", "위염"],
    ["25", "여", "삼성동", "천식"],
    ["34", "남", "서초동", "당뇨"],
    ["38", "남", "반포동", "당뇨"],
    ["31", "남", "방배동", "당뇨"],
  ];
  const gen = [
    ["20대", "여", "강남구"],
    ["30대", "남", "서초구"],
  ];
  const cw = [40, 34, 62, 50];
  const heads = ["나이", "성별", "동네", "병명"];
  const rowH = 24;
  const table = (x0: number, rows: string[][], generalized: boolean) => (
    <g>
      {heads.map((h, j) => (
        <text key={h} x={x0 + cw.slice(0, j).reduce((a, b) => a + b, 0) + cw[j] / 2} y={44} textAnchor="middle" fontSize={10} fontWeight={800} fill={j === 3 ? colors.red : inkSecondary}>
          {h}
        </text>
      ))}
      {rows.map((r, i) => {
        const g = Math.floor(i / 3);
        const vals = generalized ? [...gen[g], r[3]] : r;
        return vals.map((v, j) => {
          const x = x0 + cw.slice(0, j).reduce((a, b) => a + b, 0);
          return (
            <g key={`${i}-${j}`}>
              <rect x={x} y={52 + i * rowH} width={cw[j]} height={rowH} fill={generalized && j < 3 ? (g === 0 ? colors.blue : colors.orange) : card2Bg} fillOpacity={generalized && j < 3 ? 0.14 : 1} stroke="var(--border-strong)" strokeWidth={0.7} />
              <text x={x + cw[j] / 2} y={52 + i * rowH + 16} textAnchor="middle" fontSize={10.5} fill={ink} fontWeight={j === 3 && generalized && g === 1 ? 800 : 400}>
                {v}
              </text>
            </g>
          );
        });
      })}
    </g>
  );
  const P = "kat";
  return (
    <DiagramFrame
      title="k-익명성(k = 3)과 동질성 공격"
      caption="설명용 예시다. 왼쪽 원본은 나이·성별·동네가 사람마다 달라, 이 셋을 아는 공격자는 그 사람의 병명을 바로 찾는다. 오른쪽은 나이를 10년 단위로, 동네를 구로 뭉뚱그려 같은 조합을 세 명씩 공유하게 만든 것이다(k = 3). 강남구 20대 여성은 감기·위염·천식 중 누구인지 알 수 없다. 그런데 서초구 30대 남성 세 명은 모두 당뇨라, 누구인지 몰라도 병명은 드러난다(동질성 공격). 그래서 묶음 안의 민감 정보가 충분히 다양하도록 요구하는 l-다양성이 나왔다."
      viewBox="0 0 720 230"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      <text x={113} y={22} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        원본 (이름만 지움)
      </text>
      {table(20, raw, false)}
      <Arr x1={216} y1={124} x2={252} y2={124} color={inkSecondary} marker={`${P}-ink`} width={1.8} />
      <text x={234} y={114} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        뭉뚱그리기
      </text>
      <text x={353} y={22} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        k = 3으로 일반화
      </text>
      {table(260, raw, true)}
      <rect x={258} y={124} width={190} height={74} rx={4} fill="none" stroke={colors.red} strokeWidth={2} />
      <Tag x={474} y={58} w={232} h={50} lines={["강남구 · 20대 · 여: 3명", "병명이 감기·위염·천식으로 다양 ✓"]} color={colors.blue} size={10.5} />
      <Tag x={474} y={134} w={232} h={56} lines={["서초구 · 30대 · 남: 3명", "모두 당뇨 → 누구든 병명이 드러남 ✗", "(동질성 공격)"]} color={colors.red} size={10.5} />
    </DiagramFrame>
  );
}

export function RandomizedResponse() {
  // 본문: 첫 동전 앞면이면 사실대로, 뒷면이면 두 번째 동전대로. P(예 | 사실 예) = 0.75, P(예 | 사실 아니오) = 0.25 → 비 3 = e^ε, ε = ln 3.
  const P = "rrs";
  return (
    <DiagramFrame
      title="무작위 응답: 개인은 부정할 수 있고, 집단은 추정할 수 있다"
      caption="응답자는 몰래 동전을 던져, 앞면이면 사실대로 답하고 뒷면이면 동전을 한 번 더 던져 앞면이면 '예', 뒷면이면 '아니오'라고 답한다. 사실이 '예'인 사람이 '예'라고 답할 확률은 1/2 + 1/4 = 0.75, 사실이 '아니오'인 사람은 1/4 = 0.25로, 어느 쪽이든 '예'가 나올 수 있어 개인은 언제든 부정할 수 있다. 두 확률의 비 3이 차등 프라이버시의 e^ε에 해당해 ε = ln 3 ≈ 1.1이다. 집단 비율은 π̂ = 2(P̂(예) − 1/4)로 되돌린다. 본문 예제처럼 1,000명 중 400명이 '예'면 0.3이다."
      viewBox="0 0 720 226"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {chip8(14, 92, "응답자", inkMuted, 70, 30, 0.16, 11)}
      <Arr x1={86} y1={100} x2={150} y2={56} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={86} y1={114} x2={150} y2={158} color={inkSecondary} marker={`${P}-ink`} />
      <text x={104} y={68} fontSize={9.5} fill={inkSecondary}>
        앞면 1/2
      </text>
      <text x={104} y={156} fontSize={9.5} fill={inkSecondary}>
        뒷면 1/2
      </text>
      {chip8(154, 40, "사실대로 답한다", colors.blue, 120, 30, 0.14, 11)}
      {chip8(154, 144, "동전을 한 번 더", colors.orange, 120, 30, 0.14, 11)}
      <Arr x1={276} y1={150} x2={318} y2={130} color={inkSecondary} marker={`${P}-ink`} />
      <Arr x1={276} y1={168} x2={318} y2={188} color={inkSecondary} marker={`${P}-ink`} />
      {chip8(322, 116, "'예' (1/4)", colors.orange, 84, 26, 0.14, 10.5)}
      {chip8(322, 178, "'아니오' (1/4)", colors.orange, 84, 26, 0.14, 10.5)}
      <line x1={426} y1={14} x2={426} y2={214} stroke="var(--border-hairline)" />
      <text x={566} y={24} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        &apos;예&apos;라고 답할 확률
      </text>
      {[
        { t: "사실이 '예'인 사람", v: 0.75, f: "1/2 + 1/4", c: colors.red },
        { t: "사실이 '아니오'인 사람", v: 0.25, f: "1/4", c: colors.blue },
      ].map((b, i) => (
        <g key={b.t}>
          <text x={442} y={50 + i * 46} fontSize={10.5} fontWeight={700} fill={ink}>
            {b.t}
          </text>
          <rect x={442} y={56 + i * 46} width={b.v * 220} height={16} rx={3} fill={b.c} fillOpacity={0.6} />
          <text x={442 + b.v * 220 + 6} y={68 + i * 46} fontSize={10.5} fontWeight={800} fill={ink}>
            {`${b.v} (${b.f})`}
          </text>
        </g>
      ))}
      <text x={566} y={156} textAnchor="middle" fontSize={11} fontWeight={800} fill={colors.violet}>
        0.75 / 0.25 = 3 = e^ε → ε = ln 3 ≈ 1.1
      </text>
      <text x={566} y={182} textAnchor="middle" fontSize={10.5} fill={ink}>
        1,000명 중 400명 &apos;예&apos; → π̂ = 2(0.4 − 0.25) = 0.3
      </text>
      <text x={566} y={202} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
        대가: 오차가 직접 물을 때(±0.022)의 두 배 넘게(±0.058)
      </text>
    </DiagramFrame>
  );
}

export function LaplaceNoise() {
  // 본문: 참 개수 12에 척도 1/ε 라플라스 잡음. 점은 본문 코드의 실제 공개값(시드 0). 두 ε의 높이 차가 커서 위아래로 나눠 그린다.
  const truth = 12;
  const cfg = [
    { eps: "1", b: 1, c: colors.blue, samples: [12.1, 14.4, 12.5, 13.5, 12.5], top: 22 },
    { eps: "0.1", b: 10, c: colors.red, samples: [-1.9, 30.3, 39.7, 24.1, 15.2], top: 112 },
  ];
  const sx = linear(-30, 54, 50, 560);
  const ph = 70;
  const lap = (b: number) => (x: number) => Math.exp(-Math.abs(x - truth) / b) / (2 * b);
  return (
    <DiagramFrame
      title="라플라스 메커니즘: ε가 작을수록 잡음이 커진다"
      caption="참 개수 12에 척도 1/ε인 라플라스 잡음을 더해 공개할 때 나올 수 있는 값의 분포다(두 그래프의 세로 눈금은 다르다). 개수 질의는 한 사람이 들어가거나 빠져도 답이 최대 1만 바뀌므로(민감도 1), 이렇게 공개하면 ε-차등 프라이버시가 된다. ε = 1이면 잡음이 ±1~2 정도라 본문 코드의 공개값(점)도 12.1~14.4에 모였지만, ε = 0.1이면 잡음의 평균 크기가 10이라 공개값이 −1.9부터 39.7까지 흩어졌다. 같은 잡음이 큰 집단의 개수에는 거의 티가 나지 않고, 작은 집단의 개수는 크게 흔든다."
      viewBox="0 0 720 236"
      minWidth={600}
    >
      {cfg.map((c) => {
        const sy = linear(0, 1 / (2 * c.b), c.top + ph, c.top + 6);
        return (
          <g key={c.eps}>
            <path d={`${linePath(sample(lap(c.b), -30, 54, 300).map(([x, y]) => [sx(x), sy(y)] as [number, number]))} L${sx(54)},${sy(0)} L${sx(-30)},${sy(0)} Z`} fill={c.c} fillOpacity={0.14} stroke={c.c} strokeWidth={2} />
            <line x1={sx(-30)} x2={sx(54)} y1={sy(0)} y2={sy(0)} stroke={inkMuted} />
            <line x1={sx(truth)} x2={sx(truth)} y1={c.top} y2={sy(0)} stroke={ink} strokeDasharray="4 3" />
            {c.samples.map((v, i) => (
              <circle key={i} cx={sx(v)} cy={sy(0) - 5} r={4.2} fill={c.c} stroke="var(--surface-card)" strokeWidth={1.2} />
            ))}
            <text x={574} y={c.top + 22} fontSize={11.5} fontWeight={800} fill={c.c}>
              {`ε = ${c.eps}`}
            </text>
            <text x={574} y={c.top + 40} fontSize={10} fill={inkSecondary}>
              {`잡음 척도 1/ε = ${c.b}`}
            </text>
            <text x={574} y={c.top + 58} fontSize={9.5} fill={ink}>
              {`공개값 ${c.samples.map((v) => String(v).replace("-", "−")).join(", ")}`}
            </text>
          </g>
        );
      })}
      {[-30, -20, -10, 0, 10, 20, 30, 40, 50].map((t) => (
        <text key={t} x={sx(t)} y={200} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {String(t).replace("-", "−")}
        </text>
      ))}
      <text x={sx(12)} y={16} textAnchor="middle" fontSize={10} fontWeight={800} fill={ink}>
        참 개수 12
      </text>
      <text x={sx(12)} y={222} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={inkSecondary}>
        공개되는 값
      </text>
    </DiagramFrame>
  );
}

export function MitigationStages() {
  // 본문: 개입 시점 셋. 전처리(재가중 등) · 학습 중(공정성 벌점·제약·적대적 완화) · 후처리(집단별 임계값). 보호 속성 제거만으로는 대리 변수 때문에 부족.
  const P = "mts";
  const stages = [
    { t: "전처리", sub: "데이터를 고친다", how: ["재가중 · 재표집", "라벨 수정", "부족한 집단 데이터 수집"], pro: "모델과 무관하게 적용", con: "데이터만으로 격차가 다 안 풀릴 수 있다", c: colors.blue, x: 14 },
    { t: "학습 중", sub: "손실을 바꾼다", how: ["교차 엔트로피 + λ·격차²", "제약 조건 최적화", "적대적 완화"], pro: "λ로 격차를 정밀 조절", con: "다시 학습해야 한다", c: colors.violet, x: 250 },
    { t: "후처리", sub: "판정을 고친다", how: ["집단별 임계값", "(TPR·FPR 동시는 무작위화)"], pro: "재학습 없이 어떤 기준이든", con: "판정 때 보호 속성 필요(법적 문제)", c: colors.orange, x: 486 },
  ];
  return (
    <DiagramFrame
      title="편향 완화의 세 시점: 데이터 · 학습 · 판정"
      caption="격차를 줄이는 개입은 세 시점에 할 수 있다. 학습 전에 데이터를 고치는 전처리(재가중, 재표집, 라벨 수정, 무엇보다 부족한 집단의 데이터를 더 모으기), 학습하면서 손실에 격차 벌점이나 제약을 거는 학습 중 처리, 학습이 끝난 점수에 집단별 임계값을 쓰는 후처리다. 어느 방법이든 얻는 것과 내주는 것이 있다. 보호 속성을 입력에서 빼기만 하는 것('모르는 척')은 동네·학교 같은 대리 변수가 남아 있으면 모델이 집단을 다시 알아내므로 완화가 되지 않는다."
      viewBox="0 0 720 248"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkSecondary }} />
      {stages.map((s, i) => (
        <g key={s.t}>
          <rect x={s.x} y={14} width={220} height={176} rx={10} fill={s.c} fillOpacity={0.06} stroke={s.c} />
          <text x={s.x + 110} y={36} textAnchor="middle" fontSize={13} fontWeight={800} fill={s.c}>
            {s.t}
          </text>
          <text x={s.x + 110} y={52} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {s.sub}
          </text>
          <Lines x={s.x + 14} y={76} lines={s.how.map((h) => `· ${h}`)} size={10.5} anchor="start" color={ink} weight={600} gap={1.5} />
          <text x={s.x + 14} y={150} fontSize={10} fontWeight={700} fill={colors.green}>
            {`+ ${s.pro}`}
          </text>
          <text x={s.x + 14} y={172} fontSize={10} fontWeight={700} fill={colors.red}>
            {`− ${s.con}`}
          </text>
          {i < 2 && <Arr x1={s.x + 222} y1={102} x2={s.x + 234} y2={102} color={inkSecondary} marker={`${P}-ink`} />}
        </g>
      ))}
      <rect x={14} y={202} width={692} height={36} rx={8} fill={colors.red} fillOpacity={0.06} stroke={colors.red} strokeDasharray="5 3" />
      <text x={360} y={225} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={ink}>
        &apos;모르는 척&apos;(보호 속성 빼기) ✗ → 동네·학교 같은 대리 변수로 집단을 다시 알아낸다. 격차 측정도 못 하게 된다
      </text>
    </DiagramFrame>
  );
}

export function Reweighing() {
  // 본문 예제: A 100명 중 합격 50, B 100명 중 합격 20. w(g, y) = P(G = g)P(Y = y) / P(G = g, Y = y).
  const cells = [
    { g: "A", y: 1, n: 50 },
    { g: "A", y: 0, n: 50 },
    { g: "B", y: 1, n: 20 },
    { g: "B", y: 0, n: 80 },
  ].map((c) => {
    const pg = 0.5;
    const py = c.y === 1 ? 0.35 : 0.65;
    return { ...c, w: (pg * py) / (c.n / 200) };
  });
  const rate = (g: string, weighted: boolean) => {
    const pos = cells.find((c) => c.g === g && c.y === 1)!;
    const neg = cells.find((c) => c.g === g && c.y === 0)!;
    const wp = weighted ? pos.w : 1;
    const wn = weighted ? neg.w : 1;
    return (pos.n * wp) / (pos.n * wp + neg.n * wn);
  };
  const by = linear(0, 0.6, 186, 40);
  return (
    <DiagramFrame
      title="재가중: 집단과 정답의 연관을 끊는 가중치"
      caption="본문 예제다. 과거 기록에서 A 집단은 100명 중 50명, B 집단은 100명 중 20명이 합격했다. 재가중은 칸마다 w = P(집단)·P(정답) / P(집단, 정답)을 준다. 집단과 정답이 독립이었다면 기대되는 인원보다 많이 나타난 칸(A 합격)은 1보다 작은 0.7을, 적게 나타난 칸(B 합격)은 1보다 큰 1.75를 받는다. 이 가중치로 세면 두 집단의 합격 비율이 모두 전체 비율 0.35로 같아지고, 이 가중치로 학습한 모델은 '집단'과 '합격'의 연관을 덜 배운다."
      viewBox="0 0 720 230"
      minWidth={600}
    >
      <text x={150} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        칸별 인원과 가중치
      </text>
      <text x={110} y={44} textAnchor="middle" fontSize={10} fontWeight={800} fill={colors.green}>
        합격 (y = 1)
      </text>
      <text x={220} y={44} textAnchor="middle" fontSize={10} fontWeight={800} fill={inkSecondary}>
        불합격 (y = 0)
      </text>
      {["A", "B"].map((g, i) => (
        <text key={g} x={40} y={86 + i * 64} textAnchor="end" fontSize={12} fontWeight={800} fill={g === "A" ? colors.blue : colors.orange}>
          {`집단 ${g}`}
        </text>
      ))}
      {cells.map((c) => {
        const x = c.y === 1 ? 56 : 166;
        const y = c.g === "A" ? 54 : 118;
        const up = c.w > 1;
        return (
          <g key={`${c.g}${c.y}`}>
            <rect x={x} y={y} width={108} height={58} rx={6} fill={up ? colors.green : colors.red} fillOpacity={0.1} stroke={up ? colors.green : colors.red} />
            <text x={x + 54} y={y + 22} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
              {`${c.n}명`}
            </text>
            <text x={x + 54} y={y + 44} textAnchor="middle" fontSize={12} fontWeight={800} fill={up ? colors.green : colors.red} fontFamily={mono}>
              {`w = ${Number(c.w.toFixed(4))}`}
            </text>
          </g>
        );
      })}
      <text x={150} y={200} textAnchor="middle" fontSize={10} fill={inkSecondary}>
        예: B 합격 = 0.5 × 0.35 / 0.1 = 1.75
      </text>
      <line x1={300} y1={14} x2={300} y2={216} stroke="var(--border-hairline)" />
      <text x={500} y={20} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={ink}>
        합격 비율
      </text>
      <line x1={330} x2={690} y1={by(0)} y2={by(0)} stroke={inkMuted} />
      <line x1={330} x2={690} y1={by(0.35)} y2={by(0.35)} stroke={colors.violet} strokeDasharray="4 3" />
      <text x={690} y={by(0.35) - 5} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.violet}>
        전체 0.35
      </text>
      {[
        { t: "원래 기록", w: false, x: 360 },
        { t: "가중치 적용", w: true, x: 540 },
      ].map((s) => (
        <g key={s.t}>
          {["A", "B"].map((g, k) => {
            const v = rate(g, s.w);
            const x = s.x + k * 62;
            return (
              <g key={g}>
                <rect x={x} y={by(v)} width={48} height={by(0) - by(v)} rx={3} fill={g === "A" ? colors.blue : colors.orange} fillOpacity={0.6} />
                <text x={x + 24} y={by(v) - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>
                  {v.toFixed(2)}
                </text>
                <text x={x + 24} y={by(0) + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={inkSecondary}>
                  {g}
                </text>
              </g>
            );
          })}
          <text x={s.x + 55} y={by(0) + 30} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>
            {s.t}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function GroupThresholds() {
  // 본문 시뮬레이션(시드 0, 집단당 500명)의 실제 점수 히스토그램(0.05 간격). B 집단은 같은 실력이어도 점수가 0.1쯤 낮다.
  const bins = 20;
  const data = {
    A: { pos: [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 8, 7, 21, 18, 23, 36, 28, 32, 25, 21], neg: [24, 18, 32, 36, 42, 37, 27, 18, 21, 9, 8, 3, 2, 0, 0, 0, 0, 0, 0, 0] },
    B: { pos: [0, 0, 0, 0, 0, 2, 1, 6, 9, 15, 18, 17, 27, 31, 35, 24, 24, 16, 16, 11], neg: [73, 33, 33, 23, 30, 27, 12, 7, 4, 1, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
  };
  const sx = linear(0, 1, 60, 470);
  const bw = (sx(1) - sx(0)) / bins;
  const panel = (g: "A" | "B", y0: number) => {
    const sy = linear(0, 75, y0 + 74, y0);
    return (
      <g>
        <text x={14} y={y0 + 14} fontSize={12} fontWeight={800} fill={g === "A" ? colors.blue : colors.orange}>
          {`집단 ${g}`}
        </text>
        {data[g].neg.map((v, i) => (
          <rect key={`n${i}`} x={sx(i / bins) + 0.5} y={sy(v)} width={bw - 1} height={sy(0) - sy(v)} fill={inkMuted} fillOpacity={0.45} />
        ))}
        {data[g].pos.map((v, i) => (
          <rect key={`p${i}`} x={sx(i / bins) + 0.5} y={sy(v)} width={bw - 1} height={sy(0) - sy(v)} fill={colors.green} fillOpacity={0.55} />
        ))}
        <line x1={sx(0)} x2={sx(1)} y1={sy(0)} y2={sy(0)} stroke={inkMuted} />
        <line x1={sx(0.5)} x2={sx(0.5)} y1={y0 - 4} y2={y0 + 78} stroke={colors.red} strokeWidth={1.8} strokeDasharray={g === "B" ? "5 3" : undefined} />
        {g === "B" && <line x1={sx(0.4)} x2={sx(0.4)} y1={y0 - 4} y2={y0 + 78} stroke={colors.violet} strokeWidth={2.2} />}
      </g>
    );
  };
  return (
    <DiagramFrame
      title="후처리: 집단별 임계값으로 TPR 격차를 줄인다"
      caption="본문 시뮬레이션의 실제 점수 분포다(초록 = 실제 우수 인재, 회색 = 그렇지 않은 사람). B 집단은 같은 실력이어도 모델 점수가 0.1쯤 낮게 나온다. 공통 임계값 0.5(빨강)에서는 A의 TPR이 0.98인데 B는 0.87로, 우수 인재인데도 B 집단이라 놓치는 비율이 더 높다. B에만 임계값을 0.4(보라)로 낮추면 TPR이 0.96으로 A에 가까워지고, 대가로 FPR이 0.02에서 0.04로 조금 오른다. 다시 학습하지 않고 숫자 하나로 격차를 줄였지만, 판정할 때 지원자의 집단을 알아야 한다."
      viewBox="0 0 720 238"
      minWidth={600}
    >
      {panel("A", 20)}
      {panel("B", 122)}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
        <text key={t} x={sx(t)} y={214} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {t}
        </text>
      ))}
      <text x={sx(0.5)} y={230} textAnchor="middle" fontSize={10} fontWeight={700} fill={inkSecondary}>
        모델 점수
      </text>
      <text x={sx(0.5) + 4} y={14} fontSize={9.5} fontWeight={700} fill={colors.red}>
        임계값 0.5
      </text>
      <text x={sx(0.4) - 4} y={118} textAnchor="end" fontSize={9.5} fontWeight={700} fill={colors.violet}>
        B만 0.4
      </text>
      <Lines x={492} y={40} lines={["공통 0.5", "A: TPR 0.98 · FPR 0.05", "B: TPR 0.87 · FPR 0.02"]} size={10.5} anchor="start" color={ink} weight={600} gap={1.5} />
      <Lines x={492} y={124} lines={["B만 0.4로", "A: TPR 0.98 · FPR 0.05", "B: TPR 0.96 · FPR 0.04"]} size={10.5} anchor="start" color={colors.violet} weight={700} gap={1.5} />
      <rect x={492} y={178} width={12} height={12} fill={colors.green} fillOpacity={0.55} />
      <text x={508} y={188} fontSize={10} fill={ink}>
        실제 우수 인재
      </text>
      <rect x={600} y={178} width={12} height={12} fill={inkMuted} fillOpacity={0.45} />
      <text x={616} y={188} fontSize={10} fill={ink}>
        그 밖
      </text>
    </DiagramFrame>
  );
}

export function ChouldechovaFpr() {
  // FPR = p/(1 − p) · (1 − PPV)/PPV · (1 − FNR). PPV 0.8, FNR 0.2로 맞추면 기저율 0.5 → 0.2, 0.2 → 0.05, 0.05 → 0.0105(본문 코드).
  const fpr = (p: number, ppv: number, fnr: number) => (p / (1 - p)) * ((1 - ppv) / ppv) * (1 - fnr);
  const G = { left: 60, top: 26, width: 380, height: 186 };
  const sx = linear(0, 0.6, G.left, G.left + G.width);
  const sy = linear(0, 0.4, G.top + G.height, G.top);
  const lines = [
    { ppv: 0.6, c: colors.red },
    { ppv: 0.8, c: colors.violet },
    { ppv: 0.95, c: colors.green },
  ];
  const pts = [0.5, 0.2, 0.05];
  return (
    <DiagramFrame
      title="Chouldechova 항등식: PPV와 FNR을 맞추면 FPR은 기저율이 정한다"
      caption="FPR = p/(1 − p) · (1 − PPV)/PPV · (1 − FNR)은 어떤 분류기, 어떤 집단에서나 성립하는 정의상의 등식이다. 두 집단에서 PPV와 FNR을 같게 맞추면 남는 변수는 기저율 p뿐이라, FPR이 곡선 위의 한 점으로 저절로 정해진다. 보라 곡선(PPV 0.8, FNR 0.2)의 점은 본문 코드의 세 집단이다. 기저율 0.5인 집단은 FPR 0.2, 0.2인 집단은 0.05, 0.05인 집단은 약 0.01이 된다. 기저율이 다른데 FPR까지 같게 만들 방법은 없고, 예외는 기저율이 같거나 PPV = 1(위양성 없음)이거나 FNR = 1(아무도 합격시키지 않음)일 때뿐이다. 정밀도를 높게 요구할수록(초록) 곡선이 낮아질 뿐 기울기는 사라지지 않는다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]} yTicks={[0, 0.1, 0.2, 0.3, 0.4]} xLabel="집단의 기저율 p" yLabel="정해지는 FPR" />
      {lines.map((l) => (
        <g key={l.ppv}>
          <path d={linePath(sample((p) => fpr(p, l.ppv, 0.2), 0.005, 0.6, 160).filter(([, y]) => y <= 0.4).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={l.c} strokeWidth={l.ppv === 0.8 ? 2.8 : 1.8} strokeDasharray={l.ppv === 0.8 ? undefined : "5 3"} />
        </g>
      ))}
      <text x={sx(0.36)} y={sy(0.37)} fontSize={10} fontWeight={800} fill={colors.red}>
        PPV 0.6
      </text>
      <text x={sx(0.52)} y={sy(0.3)} fontSize={10} fontWeight={800} fill={colors.violet}>
        PPV 0.8
      </text>
      <text x={sx(0.5)} y={sy(0.07)} fontSize={10} fontWeight={800} fill={colors.green}>
        PPV 0.95
      </text>
      {pts.map((p) => (
        <g key={p}>
          <line x1={sx(p)} x2={sx(p)} y1={sy(0)} y2={sy(fpr(p, 0.8, 0.2))} stroke={colors.violet} strokeDasharray="3 3" strokeOpacity={0.6} />
          <circle cx={sx(p)} cy={sy(fpr(p, 0.8, 0.2))} r={5} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
          {p === 0.5 && (
            <text x={sx(p) - 7} y={sy(fpr(p, 0.8, 0.2)) - 8} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
              p 0.5 → FPR 0.20
            </text>
          )}
        </g>
      ))}
      <rect x={470} y={36} width={236} height={170} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={484} y={58} fontSize={11.5} fontWeight={800} fill={ink}>
        PPV 0.8, FNR 0.2로 맞추면
      </text>
      {pts.map((p, i) => (
        <g key={p}>
          <text x={484} y={84 + i * 22} fontSize={10.5} fill={inkSecondary}>
            {`기저율 ${p}`}
          </text>
          <text x={692} y={84 + i * 22} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.violet} fontFamily={mono}>
            {`FPR ${fpr(p, 0.8, 0.2).toFixed(p === 0.05 ? 4 : 2)}`}
          </text>
        </g>
      ))}
      <Lines x={484} y={160} lines={["남는 변수는 기저율뿐: FPR ∝ p / (1 − p)"]} size={10.5} anchor="start" color={colors.violet} weight={800} />
      <text x={484} y={194} fontSize={9.5} fill={inkSecondary}>
        고를 수 있는 손잡이가 남지 않는다
      </text>
    </DiagramFrame>
  );
}

export function KleinbergBalance() {
  // 보정된 점수에서 z = p/(1 − p) · (1 − x). 기저율 0.5인 집단 A와 0.2인 집단 B의 직선은 (x, z) = (1, 0)에서만 만난다.
  const G = { left: 64, top: 26, width: 300, height: 190 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const groups = [
    { t: "집단 A (기저율 0.5)", p: 0.5, c: colors.blue },
    { t: "집단 B (기저율 0.2)", p: 0.2, c: colors.orange },
  ];
  return (
    <DiagramFrame
      title="Kleinberg의 불가능성: 보정과 균형은 완벽한 예측에서만 함께 성립한다"
      caption="점수가 보정되어 있으면(점수 0.7을 받은 사람의 70%가 실제 양성) 양성의 평균 점수 x와 음성의 평균 점수 z 사이에 z = p/(1 − p) · (1 − x)라는 관계가 생긴다. 집단마다 이 관계는 기울기가 기저율로 정해지는 직선이다. 균형(양성끼리, 음성끼리 두 집단의 평균 점수가 같음)은 두 집단이 같은 점 (x, z)를 가져야 한다는 뜻인데, 기저율이 다른 두 직선은 x = 1, z = 0, 즉 양성은 모두 1점, 음성은 모두 0점인 완벽한 예측에서만 만난다. 현실의 모델은 완벽하지 않으므로 기저율이 다른 집단에서는 보정과 균형 중 하나를 포기해야 한다."
      viewBox="0 0 720 256"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[0, 0.25, 0.5, 0.75, 1]} xLabel="x = 양성의 평균 점수" yLabel="z = 음성의 평균 점수" />
      {groups.map((g) => (
        <g key={g.p}>
          <path d={linePath([0, 1].map((x) => [sx(x), sy((g.p / (1 - g.p)) * (1 - x))] as [number, number]))} fill="none" stroke={g.c} strokeWidth={2.6} />
          <text x={sx(0.04)} y={sy((g.p / (1 - g.p)) * 0.96) - 8} fontSize={10.5} fontWeight={800} fill={g.c} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {`${g.t}: z = ${(g.p / (1 - g.p)).toFixed(2)}(1 − x)`}
          </text>
        </g>
      ))}
      <circle cx={sx(1)} cy={sy(0)} r={6} fill={colors.green} stroke="var(--surface-card)" strokeWidth={1.5} />
      <text x={sx(1) + 2} y={sy(0) - 12} textAnchor="end" fontSize={10.5} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        (1, 0)
      </text>
      <line x1={sx(0.7)} x2={sx(0.7)} y1={sy(0.3)} y2={sy(0.075)} stroke={ink} strokeWidth={1.4} />
      <circle cx={sx(0.7)} cy={sy(0.3)} r={4} fill={colors.blue} />
      <circle cx={sx(0.7)} cy={sy(0.075)} r={4} fill={colors.orange} />
      <Lines x={sx(0.68)} y={sy(0.215)} lines={["x가 같아도", "z는 다르다"]} size={10} anchor="end" color={ink} weight={800} gap={1.35} />
      <rect x={410} y={36} width={296} height={176} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={424} y={58} fontSize={11.5} fontWeight={800} fill={ink}>
        보정에서 나오는 등식
      </text>
      <Lines x={424} y={82} lines={["E[Y(1 − s)] = E[s(1 − s)] = E[s(1 − Y)]", "p(1 − x) = (1 − p)z"]} size={10.5} anchor="start" color={ink} weight={600} gap={1.6} />
      <Lines x={424} y={136} lines={["두 집단이 같은 (x, z)를 가지려면", "p/(1 − p)(1 − x)가 같아야 한다", "→ 기저율이 다르면 x = 1, z = 0뿐", "   (완벽한 예측, 초록 점)"]} size={10.5} anchor="start" color={colors.violet} weight={800} gap={1.5} />
    </DiagramFrame>
  );
}

export function RandomizedMixing() {
  // 본문 코드: 두 집단의 FPR f = 0.1, TPR 0.9(높은 집단)와 0.7. λ = (0.7 − 0.1)/(0.9 − 0.1) = 0.75로 섞으면 (0.1, 0.7). 시뮬레이션: TPR 0.70, FPR 0.10.
  const G = { left: 70, top: 22, width: 200, height: 200 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const P = "rmx";
  return (
    <DiagramFrame
      title="균등화된 오즈를 맞추는 무작위 혼합: 선분 위의 점은 모두 만들 수 있다"
      caption="ROC 평면에서 본 Hardt et al.(2016)의 후처리다. 두 판정 규칙을 확률로 섞으면 (FPR, TPR)도 같은 비율로 섞이므로 두 점을 잇는 선분 위의 어느 점이든 만들 수 있다. 점수와 무관하게 확률 f로 합격시키는 규칙은 대각선 위의 점 (f, f)다. 본문 코드처럼 두 집단의 FPR이 0.1로 같고 TPR이 0.9(파랑)와 0.7(주황)이라면, 파랑 집단이 확률 λ = (0.7 − 0.1)/(0.9 − 0.1) = 0.75로 자기 규칙을, 0.25로 무작위 합격을 쓰면 TPR이 정확히 0.7로 내려와 두 집단의 오즈가 같아진다(20만 명 시뮬레이션: TPR 0.70, FPR 0.10). 대가는 파랑 집단의 실제 우수 인재 중 20%p를 일부러 떨어뜨리는 것이고, 같은 점수의 두 사람이 동전 때문에 다른 판정을 받을 수 있다."
      viewBox="0 0 720 258"
      minWidth={600}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.1, 0.5, 1]} yTicks={[0, 0.1, 0.5, 0.7, 0.9, 1]} xLabel="FPR" yLabel="TPR" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="4 3" />
      <line x1={sx(0.1)} y1={sy(0.1)} x2={sx(0.1)} y2={sy(0.9)} stroke={colors.blue} strokeWidth={2.6} strokeOpacity={0.5} />
      <circle cx={sx(0.1)} cy={sy(0.9)} r={6} fill={colors.blue} />
      <circle cx={sx(0.1)} cy={sy(0.7)} r={6} fill={colors.orange} stroke="var(--surface-card)" strokeWidth={1.5} />
      <circle cx={sx(0.1)} cy={sy(0.1)} r={5} fill={inkMuted} />
      <text x={sx(0.1) + 10} y={sy(0.9) + 4} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        파랑 집단 규칙 (0.1, 0.9)
      </text>
      <text x={sx(0.1) + 10} y={sy(0.7) + 4} fontSize={10.5} fontWeight={800} fill={colors.orange}>
        주황 집단 (0.1, 0.7) = 섞은 결과
      </text>
      <text x={sx(0.1) + 10} y={sy(0.1) + 4} fontSize={10.5} fontWeight={800} fill={inkSecondary}>
        무작위 합격 (0.1, 0.1)
      </text>
      <Lines x={sx(0.1) + 10} y={sy(0.6)} lines={["λ = 0.75로 섞으면", "선분 위 TPR 0.7"]} size={10} anchor="start" color={colors.blue} weight={800} gap={1.35} />
      <rect x={420} y={34} width={286} height={180} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={434} y={56} fontSize={11.5} fontWeight={800} fill={ink}>
        확률 λ로 규칙, 1 − λ로 무작위 합격
      </text>
      <text x={434} y={84} fontSize={11} fontWeight={700} fill={ink} fontFamily={mono}>
        λ·t_hi + (1 − λ)·f = t_lo
      </text>
      <text x={434} y={106} fontSize={11} fontWeight={700} fill={ink} fontFamily={mono}>
        λ = (0.7 − 0.1) / (0.9 − 0.1) = 0.75
      </text>
      <Lines x={434} y={136} lines={["시뮬레이션(20만 명): TPR 0.70, FPR 0.10", "대가: 우수 인재의 20%p를 일부러 탈락", "같은 점수, 다른 판정(개인 공정성 논쟁)"]} size={10.5} anchor="start" color={inkSecondary} weight={600} gap={1.6} />
    </DiagramFrame>
  );
}

export function LaplaceRatio() {
  // 본문 코드: 한 사람만 다른 두 데이터셋(개수 12와 13), ε = 1, 민감도 1. 밀도 비는 o ≤ 12에서 e, o ≥ 13에서 e⁻¹, 사이에서 지수적으로 변한다.
  const eps = 1;
  const dens = (o: number, c: number) => (eps / 2) * Math.exp(-eps * Math.abs(o - c));
  const L = { left: 52, top: 30, width: 290, height: 170 };
  const lx = linear(6, 19, L.left, L.left + L.width);
  const ly = linear(0, 0.55, L.top + L.height, L.top);
  const R = { left: 440, top: 30, width: 260, height: 170 };
  const rx = linear(6, 19, R.left, R.left + R.width);
  const ry = log10Scale(0.25, 4, R.top + R.height, R.top);
  return (
    <DiagramFrame
      title="라플라스 메커니즘의 증명: 두 밀도의 비는 어디서나 e^ε 이하"
      caption="왼쪽: 한 사람만 다른 두 데이터셋의 개수 질의(참값 12와 13, 민감도 1)에 ε = 1인 라플라스 잡음을 더한 공개값의 밀도다. 두 분포가 크게 겹쳐, 공개값 하나를 보고 그 사람이 들어 있었는지 확신할 수 없다. 오른쪽: 같은 공개값 o에서 두 밀도의 비(세로축 로그 눈금)다. 12 이하에서는 정확히 e ≈ 2.718, 13 이상에서는 1/e이고 그 사이에서만 변한다. 삼각부등식 때문에 어떤 o에서도 비가 e^ε를 넘지 않는다는 것이 증명의 전부이고, 본문 코드가 잰 최댓값 2.7183도 이와 같다. 밀도의 비가 묶이면 어떤 결과 집합의 확률의 비도 묶이므로, 이후에 어떤 가공을 해도 보장이 약해지지 않는다."
      viewBox="0 0 720 248"
      minWidth={600}
    >
      <text x={L.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        공개값의 분포 (ε = 1)
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[6, 9, 12, 13, 16, 19]} yTicks={[0, 0.25, 0.5]} xLabel="공개값 o" />
      <path d={linePath(sample((o) => dens(o, 12), 6, 19, 260).map(([a, b]) => [lx(a), ly(b)] as [number, number]))} fill="none" stroke={colors.blue} strokeWidth={2.4} />
      <path d={linePath(sample((o) => dens(o, 13), 6, 19, 260).map(([a, b]) => [lx(a), ly(b)] as [number, number]))} fill="none" stroke={colors.orange} strokeWidth={2.4} />
      <text x={lx(11.6)} y={ly(0.52)} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.blue}>
        D: 참값 12
      </text>
      <text x={lx(13.4)} y={ly(0.52)} fontSize={10} fontWeight={800} fill={colors.orange}>
        D′: 참값 13
      </text>
      <text x={R.left} y={18} fontSize={11.5} fontWeight={800} fill={ink}>
        밀도의 비 p_D(o) / p_D′(o)
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[6, 9, 12, 13, 16, 19]} yTicks={[0.25, 0.5, 1, 2, 4]} fmtY={(v) => String(v)} xLabel="공개값 o" />
      <rect x={R.left} y={ry(Math.E)} width={R.width} height={ry(1 / Math.E) - ry(Math.E)} fill={colors.green} fillOpacity={0.08} />
      <line x1={R.left} x2={R.left + R.width} y1={ry(Math.E)} y2={ry(Math.E)} stroke={colors.green} strokeDasharray="5 3" />
      <line x1={R.left} x2={R.left + R.width} y1={ry(1 / Math.E)} y2={ry(1 / Math.E)} stroke={colors.green} strokeDasharray="5 3" />
      <path d={linePath(sample((o) => dens(o, 12) / dens(o, 13), 6, 19, 260).map(([a, b]) => [rx(a), ry(b)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <text x={R.left + R.width - 4} y={ry(Math.E) - 6} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.green}>
        e^ε ≈ 2.718 (상한)
      </text>
      <text x={R.left + R.width - 4} y={ry(1 / Math.E) + 14} textAnchor="end" fontSize={10} fontWeight={800} fill={colors.green}>
        e^−ε ≈ 0.368 (하한)
      </text>
    </DiagramFrame>
  );
}

export function MiaAdvantage() {
  // (ε, δ = 0)-DP에서 멤버십 추론의 가능 영역: TPR ≤ e^ε·FPR, 1 − FPR ≤ e^ε(1 − TPR). 이득 상한 (e^ε − 1)/(e^ε + 1). 본문 코드의 ε 값들.
  const L = { left: 56, top: 26, width: 190, height: 190 };
  const lx = linear(0, 1, L.left, L.left + L.width);
  const ly = linear(0, 1, L.top + L.height, L.top);
  const region = (e: number) => {
    const k = Math.exp(e);
    const xm = 1 / (k + 1);
    return `M${lx(0)},${ly(0)} L${lx(xm)},${ly(k * xm)} L${lx(1)},${ly(1)} L${lx(1 - k * xm)},${ly(1 - xm)} Z`;
  };
  const eps = [
    { e: 3, c: colors.red },
    { e: 1, c: colors.violet },
    { e: 0.1, c: colors.green },
  ];
  const R = { left: 380, top: 26, width: 320, height: 190 };
  const rx = linear(0, 8, R.left, R.left + R.width);
  const ry = linear(0, 1, R.top + R.height, R.top);
  const adv = (e: number) => (Math.exp(e) - 1) / (Math.exp(e) + 1);
  const pts = [0.1, 1, Math.log(3), 3, 8];
  return (
    <DiagramFrame
      title="ε이 공격자에게 뜻하는 것: 멤버십 추론 이득의 상한 (e^ε − 1)/(e^ε + 1)"
      caption="왼쪽: 학습이 ε-차등 프라이버시면 '이 기록이 학습에 쓰였는가'를 맞히는 어떤 공격이든 (FPR, TPR)이 두 부등식 TPR ≤ e^ε·FPR, 1 − FPR ≤ e^ε(1 − TPR)이 만드는 영역 안에 있어야 한다. ε = 0.1이면 대각선(무작위 추측)에 거의 붙은 가는 띠이고, ε = 3이면 거의 전체를 덮는다. 오른쪽: 이 영역에서 공격 이득 TPR − FPR의 최댓값이다. ε = 0.1이면 0.05로 동전 던지기 수준, ε = 1이면 0.46, 보충 과정의 무작위 응답에 해당하는 ε = ln 3에서 정확히 0.5, ε = 8이면 0.999로 사실상 아무것도 보장하지 않는다. 그래서 '차등 프라이버시로 학습했다'는 말과 함께 ε 값을 봐야 한다. 이것은 최악의 경우의 상한이고 실제 공격이 이만큼 성공한다는 뜻은 아니다."
      viewBox="0 0 720 256"
      minWidth={600}
    >
      <text x={L.left} y={16} fontSize={11.5} fontWeight={800} fill={ink}>
        공격이 가질 수 있는 (FPR, TPR)
      </text>
      <Axes {...L} sx={lx} sy={ly} xTicks={[0, 0.5, 1]} yTicks={[0, 0.5, 1]} xLabel="FPR" yLabel="TPR" />
      {eps.map((o) => (
        <path key={o.e} d={region(o.e)} fill={o.c} fillOpacity={0.14} stroke={o.c} strokeWidth={1.6} />
      ))}
      <line x1={lx(0)} y1={ly(0)} x2={lx(1)} y2={ly(1)} stroke={inkMuted} strokeDasharray="4 3" />
      <text x={lx(0.04)} y={ly(0.93)} fontSize={9.5} fontWeight={800} fill={colors.red}>
        ε = 3
      </text>
      <text x={lx(0.13)} y={ly(0.68)} fontSize={9.5} fontWeight={800} fill={colors.violet}>
        ε = 1
      </text>
      <text x={lx(0.62)} y={ly(0.45)} fontSize={9.5} fontWeight={800} fill={colors.green}>
        ε = 0.1
      </text>
      <line x1={318} y1={14} x2={318} y2={244} stroke="var(--border-hairline)" />
      <text x={R.left} y={16} fontSize={11.5} fontWeight={800} fill={ink}>
        이득 TPR − FPR의 최댓값
      </text>
      <Axes {...R} sx={rx} sy={ry} xTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8]} yTicks={[0, 0.25, 0.5, 0.75, 1]} xLabel="ε" />
      <path d={linePath(sample(adv, 0, 8, 200).map(([a, b]) => [rx(a), ry(b)] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      {pts.map((e) => (
        <g key={e}>
          <circle cx={rx(e)} cy={ry(adv(e))} r={4.5} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={1.5} />
          <text x={rx(e) + (e > 7 || e === Math.log(3) ? -7 : 7)} y={ry(adv(e)) + (e > 7 || e === 3 || e === 1 ? 16 : -7)} textAnchor={e > 7 || e === Math.log(3) ? "end" : "start"} fontSize={9.5} fontWeight={800} fill={colors.violet} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
            {`${e === Math.log(3) ? "ln 3" : e} → ${adv(e).toFixed(e === 8 ? 3 : 2)}`}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}

export function DpSgdStep() {
  // 본문 코드(시드 0): 표본 4개의 기울기 길이 0.67, 0.66, 1.76, 28.22 → C = 1로 자르면 0.67, 0.66, 1, 1.
  // 자르지 않은 평균 (−5.94, −3.05, 0.28)은 넷째 표본이 좌우하고, 자른 합에 σC = 1 잡음을 더해 4로 나눈 값은 (−0.56, −0.20, −0.15).
  const before = [0.666, 0.655, 1.759, 28.224];
  const after = [0.666, 0.655, 1, 1];
  const P = "dps";
  const by = log10Scale(0.3, 40, 206, 60);
  return (
    <DiagramFrame
      title="DP-SGD 한 걸음: 표본마다 자르고, 잡음을 더하고, 기록한다"
      caption="위: DP-SGD의 한 걸음이다. 표본마다 기울기를 따로 구해 길이가 C를 넘으면 C로 줄이므로, 한 사람이 기울기 합을 바꿀 수 있는 크기(민감도)가 C로 묶인다. 그 합에 표준편차 σC인 가우스 잡음을 더해 배치 크기로 나누고, 매 걸음이 쓴 프라이버시 예산을 회계해 전체 ε을 추적한다. 아래: 본문 코드의 숫자다(세로축 로그 눈금). 넷째 표본의 기울기는 길이 28.2로 다른 표본의 수십 배라, 자르지 않은 평균 (−5.94, −3.05, 0.28)은 사실상 이 한 사람이 정한다. C = 1로 자르면 1이 되어 다른 표본과 같은 무게만 갖는다. 대가는 잡음이다. 잡음의 크기는 대략 σC√d / B라 배치가 작고 파라미터가 많을수록 신호를 덮고, 드문 표본의 영향이 먼저 지워져 소수 집단의 정확도가 더 떨어질 수 있다."
      viewBox="0 0 720 262"
      minWidth={620}
    >
      <Markers prefix={P} colors={{ ink: inkMuted }} />
      {[
        { t: ["① 표본별 기울기", "g₁, …, g_B"], c: colors.blue },
        { t: ["② 자르기", "‖g‖ > C면 C로"], c: colors.orange },
        { t: ["③ 합 + 잡음", "N(0, σ²C²)"], c: colors.violet },
        { t: ["④ ÷ B 후 갱신", "평균 기울기"], c: colors.green },
        { t: ["⑤ 회계", "누적 ε, δ 추적"], c: colors.red },
      ].map((s, i) => (
        <g key={i}>
          <Tag x={14 + i * 142} y={14} w={122} h={38} lines={s.t} color={s.c} size={10} />
          {i < 4 && <Arr x1={138 + i * 142} y1={33} x2={154 + i * 142} y2={33} color={inkMuted} marker={`${P}-ink`} />}
        </g>
      ))}
      <text x={20} y={78} fontSize={11.5} fontWeight={800} fill={ink}>
        본문 코드: 표본 4개의 기울기 길이 (C = 1)
      </text>
      <line x1={60} x2={420} y1={by(1)} y2={by(1)} stroke={colors.orange} strokeDasharray="5 3" />
      <text x={424} y={by(1) + 4} fontSize={10} fontWeight={800} fill={colors.orange}>
        C = 1
      </text>
      {before.map((v, i) => (
        <g key={i}>
          <rect x={72 + i * 88} y={by(v)} width={30} height={by(0.3) - by(v)} rx={3} fill={colors.blue} fillOpacity={0.5} />
          <rect x={106 + i * 88} y={by(after[i])} width={30} height={by(0.3) - by(after[i])} rx={3} fill={colors.orange} fillOpacity={0.6} />
          <text x={87 + i * 88} y={by(v) - 5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.blue}>
            {v.toFixed(2)}
          </text>
          <text x={121 + i * 88} y={by(after[i]) - 5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.orange}>
            {after[i].toFixed(2)}
          </text>
          <text x={104 + i * 88} y={222} textAnchor="middle" fontSize={10} fill={inkSecondary}>
            {`표본 ${i + 1}`}
          </text>
        </g>
      ))}
      <line x1={60} x2={420} y1={by(0.3)} y2={by(0.3)} stroke={inkMuted} />
      <rect x={72} y={234} width={12} height={10} fill={colors.blue} fillOpacity={0.5} />
      <text x={88} y={243} fontSize={10} fill={inkSecondary}>
        자르기 전
      </text>
      <rect x={156} y={234} width={12} height={10} fill={colors.orange} fillOpacity={0.6} />
      <text x={172} y={243} fontSize={10} fill={inkSecondary}>
        자른 뒤
      </text>
      <rect x={462} y={70} width={244} height={156} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={476} y={92} fontSize={11} fontWeight={800} fill={ink}>
        평균 기울기 (3차원)
      </text>
      <text x={476} y={116} fontSize={10} fill={inkSecondary}>
        자르지 않은 평균
      </text>
      <text x={476} y={132} fontSize={10.5} fontWeight={800} fill={colors.blue} fontFamily={mono}>
        (−5.94, −3.05, 0.28)
      </text>
      <text x={476} y={156} fontSize={10} fill={inkSecondary}>
        자르고 잡음(σC = 1) 더해 ÷ 4
      </text>
      <text x={476} y={172} fontSize={10.5} fontWeight={800} fill={colors.violet} fontFamily={mono}>
        (−0.56, −0.20, −0.15)
      </text>
      <Lines x={476} y={198} lines={["넷째 표본 한 사람이 좌우하던 방향이", "더 이상 그 사람 것만이 아니다"]} size={9.5} anchor="start" color={ink} weight={700} gap={1.4} />
    </DiagramFrame>
  );
}

export function PsiJeffreys() {
  // 예시 분포 p(학습) = (0.1, 0.2, 0.4, 0.2, 0.1), q(운영) = (0.05, 0.15, 0.35, 0.3, 0.15). 구간마다 p ln(p/q)와 q ln(q/p), 그 합 (p − q) ln(p/q).
  const p = [0.1, 0.2, 0.4, 0.2, 0.1];
  const q = [0.05, 0.15, 0.35, 0.3, 0.15];
  const a = p.map((v, i) => v * Math.log(v / q[i]));
  const b = q.map((v, i) => v * Math.log(v / p[i]));
  const s = a.map((v, i) => v + b[i]);
  const sum = (x: number[]) => x.reduce((u, v) => u + v, 0);
  const G = { left: 60, top: 30, width: 400, height: 180 };
  const sy = linear(-0.1, 0.13, G.top + G.height, G.top);
  const gw = G.width / 5;
  const series = [
    { v: a, c: colors.blue, t: "p ln(p/q)" },
    { v: b, c: colors.orange, t: "q ln(q/p)" },
    { v: s, c: colors.violet, t: "PSI 항 (p − q) ln(p/q)" },
  ];
  return (
    <DiagramFrame
      title="PSI는 두 방향의 KL 발산을 더한 것(제프리스 발산)이다"
      caption="학습 때 분포 p와 운영 분포 q의 다섯 구간 예시다. 구간마다 세 막대를 그렸다. 파랑 p ln(p/q)를 모두 더하면 KL(p‖q), 주황 q ln(q/p)를 더하면 KL(q‖p)이고, 보라는 두 값을 더한 PSI의 구간별 항 (p − q) ln(p/q)다. KL의 구간별 항은 음수가 될 수 있지만(p < q인 구간의 파랑), PSI의 항은 p − q와 ln(p/q)의 부호가 항상 같아 구간마다 0 이상이다. 합계는 KL(p‖q) ≈ 0.059, KL(q‖p) ≈ 0.058, PSI ≈ 0.117로, PSI가 정확히 두 방향 KL의 합이다. 대칭이라 학습과 운영을 바꿔 넣어도 같은 값을 준다. 0.1과 0.2라는 경계는 이 발산에 대한 업계의 경험칙일 뿐 통계적 검정의 문턱이 아니다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Axes {...G} sx={linear(0, 1, G.left, G.left + G.width)} sy={sy} yTicks={[-0.1, -0.05, 0, 0.05, 0.1]} fmtY={(v) => (v === 0 ? "0" : v.toFixed(2).replace("-", "−"))} />
      <line x1={G.left} x2={G.left + G.width} y1={sy(0)} y2={sy(0)} stroke={ink} strokeWidth={1.2} />
      {p.map((pv, i) => (
        <g key={i}>
          {series.map((sr, k) => {
            const v = sr.v[i];
            const x = G.left + i * gw + 10 + k * 20;
            return <rect key={k} x={x} y={Math.min(sy(v), sy(0))} width={17} height={Math.max(0.8, Math.abs(sy(v) - sy(0)))} rx={2} fill={sr.c} fillOpacity={0.6} />;
          })}
          <text x={G.left + i * gw + gw / 2} y={G.top + G.height + 15} textAnchor="middle" fontSize={10} fontWeight={700} fill={ink}>
            {`구간 ${i + 1}`}
          </text>
          <text x={G.left + i * gw + gw / 2} y={G.top + G.height + 29} textAnchor="middle" fontSize={9} fill={inkSecondary}>
            {`p ${pv} · q ${q[i]}`}
          </text>
        </g>
      ))}
      <rect x={490} y={36} width={216} height={176} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      {series.map((sr, k) => (
        <g key={sr.t}>
          <rect x={504} y={52 + k * 24} width={12} height={12} fill={sr.c} fillOpacity={0.6} />
          <text x={522} y={62 + k * 24} fontSize={10.5} fontWeight={700} fill={ink}>
            {sr.t}
          </text>
        </g>
      ))}
      <Lines x={504} y={140} lines={[`KL(p‖q) = ${sum(a).toFixed(4)}`, `KL(q‖p) = ${sum(b).toFixed(4)}`, `PSI = ${sum(s).toFixed(4)} (합)`]} size={10.5} anchor="start" color={ink} weight={800} gap={1.55} />
    </DiagramFrame>
  );
}

export function PsiNullDistribution() {
  // 본문 코드(시드 0): 드리프트가 전혀 없는 균등분포에서 PSI를 500번(구간 10개, 학습 표본 1만). 운영 3,000명: 모두 0.02 미만(평균 0.0039).
  // 운영 100명: 평균 0.099(이론 0.091), 0.1 초과 39.8%, 0.3 이상 3번. 구간 폭 0.01의 도수.
  const h100 = [0, 5, 8, 16, 32, 51, 41, 51, 53, 44, 47, 26, 24, 24, 19, 18, 12, 5, 4, 6, 2, 2, 1, 1, 1, 1, 2, 1, 0, 0];
  const h3000 = [498, 2];
  const G = { left: 60, top: 30, width: 460, height: 180 };
  const sx = linear(0, 0.3, G.left, G.left + G.width);
  const sy = linear(0, 60, G.top + G.height, G.top);
  const bw = sx(0.01) - sx(0);
  return (
    <DiagramFrame
      title="바뀐 것이 없어도 PSI는 0이 아니다: 표본이 작으면 경보가 수시로 울린다"
      caption="본문 코드처럼 학습 분포와 운영 분포가 완전히 같은(드리프트가 없는) 상황에서 PSI를 500번 잰 분포다(구간 10개, 학습 표본 1만 개). 운영 표본이 3,000명이면 500번 모두 0.02 미만이라 평균 0.004로 경계와 멀다(왼쪽 끝의 가는 막대, 도수 498이라 잘라 그림). 운영 표본이 100명이면 표본 오차만으로 PSI가 넓게 퍼져 평균이 0.099(이론값 (B − 1)(1/n + 1/m) ≈ 0.091)가 되고, 40%가 '관찰 필요' 경계 0.1을 넘는다. 아무 일도 없는데 열 번 중 네 번 경보가 나는 셈이다. 경계값을 고정하기보다, 그 표본 크기에서 드리프트가 없을 때 PSI가 어떻게 분포하는지와 비교해야 한다."
      viewBox="0 0 720 256"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]} yTicks={[0, 20, 40, 60]} xLabel="드리프트가 없을 때 잰 PSI" yLabel="횟수 (500번 중)" />
      <rect x={sx(0.1)} y={G.top} width={sx(0.3) - sx(0.1)} height={G.height} fill={colors.red} fillOpacity={0.05} />
      {h100.map((v, i) => (
        <rect key={i} x={sx(i * 0.01) + 1} y={sy(v)} width={bw - 2} height={sy(0) - sy(v)} fill={colors.orange} fillOpacity={0.6} />
      ))}
      {h3000.map((v, i) => (
        <rect key={`k${i}`} x={sx(i * 0.01) + 1} y={sy(Math.min(v, 60))} width={bw - 2} height={sy(0) - sy(Math.min(v, 60))} fill={colors.blue} fillOpacity={0.75} />
      ))}
      <text x={sx(0.012)} y={sy(58)} fontSize={9.5} fontWeight={800} fill={colors.blue}>
        ↑ 498 (잘림)
      </text>
      {[0.1, 0.2].map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={G.top} y2={G.top + G.height} stroke={colors.red} strokeWidth={1.4} strokeDasharray="5 3" />
          <text x={sx(t) + 4} y={G.top + 12} fontSize={9.5} fontWeight={800} fill={colors.red}>
            {t === 0.1 ? "0.1 관찰" : "0.2 재학습 검토"}
          </text>
        </g>
      ))}
      <rect x={540} y={36} width={166} height={176} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <rect x={554} y={52} width={12} height={12} fill={colors.blue} fillOpacity={0.75} />
      <text x={572} y={62} fontSize={10.5} fontWeight={800} fill={colors.blue}>
        운영 3,000명
      </text>
      <Lines x={554} y={82} lines={["평균 0.0039", "0.1 초과 0%"]} size={10} anchor="start" color={ink} weight={600} gap={1.45} />
      <rect x={554} y={122} width={12} height={12} fill={colors.orange} fillOpacity={0.6} />
      <text x={572} y={132} fontSize={10.5} fontWeight={800} fill={colors.orange}>
        운영 100명
      </text>
      <Lines x={554} y={152} lines={["평균 0.099 (이론 0.091)", "0.1 초과 40%", "0.3 이상 3번(그림 밖)"]} size={10} anchor="start" color={ink} weight={600} gap={1.45} />
    </DiagramFrame>
  );
}

export function MultipleTesting() {
  // 특징 k개를 각각 유의수준 5%로 검사할 때 거짓 경보가 하나 이상 날 확률 1 − 0.95^k, 본페로니(0.05/k) 후 1 − (1 − 0.05/k)^k.
  const G = { left: 64, top: 26, width: 420, height: 186 };
  const sx = linear(1, 100, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const raw = (k: number) => 1 - 0.95 ** k;
  const bon = (k: number) => 1 - (1 - 0.05 / k) ** k;
  return (
    <DiagramFrame
      title="검사가 많으면 경보도 많다: 다중 비교와 본페로니 보정"
      caption="아무것도 바뀌지 않았는데 특징 k개를 각각 유의수준 5%로 검사하면, 거짓 경보가 하나 이상 날 확률은 1 − 0.95^k로 빠르게 커진다(빨강). 특징 14개면 이미 50%를 넘고, 본문의 50개면 92%다. 유의수준을 검사 수로 나누는 본페로니 보정(0.05/k)을 하면 이 확률이 k와 상관없이 약 5%로 묶인다(초록). 거짓 발견의 비율을 통제하는 벤자미니–호크버그 방법도 같은 목적이다. 거짓 경보가 잦으면 사람들이 경보를 무시하게 되어(경보 피로) 진짜 경보까지 묻히므로, 이것은 통계의 문제이자 운영의 문제다."
      viewBox="0 0 720 252"
      minWidth={600}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} yTicks={[0, 0.25, 0.5, 0.75, 1]} fmtY={(v) => `${Math.round(v * 100)}%`} xLabel="검사하는 특징 수 k" yLabel="거짓 경보 ≥ 1번" />
      <line x1={G.left} x2={G.left + G.width} y1={sy(0.05)} y2={sy(0.05)} stroke={colors.green} strokeDasharray="3 3" strokeOpacity={0.5} />
      <path d={linePath(sample(raw, 1, 100, 200).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={colors.red} strokeWidth={2.6} />
      <path d={linePath(sample(bon, 1, 100, 200).map(([a, b]) => [sx(a), sy(b)] as [number, number]))} fill="none" stroke={colors.green} strokeWidth={2.6} />
      <circle cx={sx(50)} cy={sy(raw(50))} r={5} fill={colors.red} />
      <text x={sx(50) + 8} y={sy(raw(50)) + 16} fontSize={10.5} fontWeight={800} fill={colors.red} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`k = 50: ${raw(50).toFixed(2)}`}
      </text>
      <circle cx={sx(50)} cy={sy(bon(50))} r={5} fill={colors.green} />
      <text x={sx(50) + 8} y={sy(bon(50)) - 8} fontSize={10.5} fontWeight={800} fill={colors.green} stroke="var(--surface-card)" strokeWidth={3} paintOrder="stroke">
        {`본페로니 후 ${bon(50).toFixed(3)}`}
      </text>
      <circle cx={sx(14)} cy={sy(raw(14))} r={4} fill={colors.red} />
      <text x={sx(14) + 8} y={sy(raw(14)) + 14} fontSize={9.5} fontWeight={700} fill={colors.red}>
        {`k = 14: ${(raw(14) * 100).toFixed(0)}%`}
      </text>
      <rect x={510} y={36} width={196} height={170} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={524} y={58} fontSize={11.5} fontWeight={800} fill={ink}>
        특징 50개, 각 5%
      </text>
      <Lines x={524} y={84} lines={["보정 없음: 1 − 0.95⁵⁰", `= ${raw(50).toFixed(2)}`, "본페로니: 0.05/50 = 0.001", `→ ${bon(50).toFixed(3)}`]} size={10.5} anchor="start" color={ink} weight={700} gap={1.6} />
      <text x={524} y={190} fontSize={9.5} fill={inkSecondary}>
        경보 피로 → 진짜 경보도 묻힌다
      </text>
    </DiagramFrame>
  );
}

export function BbseCorrection() {
  // BBSE(이진): 운영 예측 양성 비율 μ = TPR·q + FPR·(1 − q). 본문 코드: TPR 0.8, FPR 0.1, μ = 0.31 → q = 0.30.
  const tpr = 0.8;
  const fpr = 0.1;
  const mu = (q: number) => tpr * q + fpr * (1 - q);
  const G = { left: 64, top: 26, width: 260, height: 190 };
  const sx = linear(0, 1, G.left, G.left + G.width);
  const sy = linear(0, 1, G.top + G.height, G.top);
  const q0 = (0.31 - fpr) / (tpr - fpr);
  return (
    <DiagramFrame
      title="라벨 드리프트를 라벨 없이: 예측 양성 비율에서 실제 양성 비율로"
      caption="정답 비율 P(y)만 바뀌고 클래스 안의 모습 P(x | y)는 그대로라면, 운영에서 예측 양성 비율 μ와 실제 양성 비율 q 사이에 μ = TPR·q + FPR·(1 − q)라는 직선 관계가 생긴다(TPR, FPR은 검증 데이터에서 재 둔 값). 본문 코드의 분류기(TPR 0.8, FPR 0.1)라면 μ는 0.1~0.8 사이로 눌린다. 운영에서 예측 양성 비율 0.31을 세었다면 직선을 거꾸로 따라가 실제 양성 비율 (0.31 − 0.1)/(0.8 − 0.1) = 0.30을 얻는다. 예측 비율을 그대로 믿으면 위양성만큼 부풀려진 값을 읽게 된다. 7주차 심화의 채점관 보정(Rogan–Gladen)과 똑같은 식이다. P(x | y)까지 바뀌는 개념 드리프트가 함께 오면 이 추정도 틀린다."
      viewBox="0 0 720 256"
      minWidth={580}
    >
      <Axes {...G} sx={sx} sy={sy} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[0, 0.25, 0.5, 0.75, 1]} xLabel="실제 양성 비율 q" yLabel="예측 양성 비율 μ" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={inkMuted} strokeDasharray="4 3" />
      <path d={linePath([0, 1].map((q) => [sx(q), sy(mu(q))] as [number, number]))} fill="none" stroke={colors.violet} strokeWidth={2.6} />
      <line x1={G.left} x2={sx(q0)} y1={sy(0.31)} y2={sy(0.31)} stroke={colors.orange} strokeWidth={1.6} strokeDasharray="4 3" />
      <line x1={sx(q0)} x2={sx(q0)} y1={sy(0.31)} y2={sy(0)} stroke={colors.green} strokeWidth={1.6} strokeDasharray="4 3" />
      <circle cx={sx(q0)} cy={sy(0.31)} r={4.5} fill={colors.violet} />
      <text x={G.left + 6} y={sy(0.31) - 6} fontSize={10} fontWeight={800} fill={colors.orange}>
        운영 예측 양성 0.31
      </text>
      <text x={sx(q0) + 6} y={sy(0.06)} fontSize={10} fontWeight={800} fill={colors.green}>
        {`실제 ${q0.toFixed(2)}`}
      </text>
      <Lines x={sx(0.5)} y={sy(0.86)} lines={["μ = 0.8q + 0.1(1 − q)"]} size={10} anchor="start" color={colors.violet} weight={800} />
      <rect x={370} y={40} width={336} height={170} rx={8} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={386} y={64} fontSize={11.5} fontWeight={800} fill={ink}>
        같은 식, 다른 장면
      </text>
      <Lines x={386} y={90} lines={["드리프트(BBSE): 분류기의 예측 비율 → 실제 양성 비율", "채점관 보정(7주차): 채점관의 통과율 → 실제 정확도"]} size={10.5} anchor="start" color={ink} weight={600} gap={1.6} />
      <text x={386} y={138} fontSize={11} fontWeight={800} fill={colors.green} fontFamily={mono}>
        q = (μ − FPR) / (TPR − FPR)
      </text>
      <Lines x={386} y={166} lines={["클래스가 여럿이면 혼동 행렬 C로 μ = C·w를 풀어", "새 비율 q = w ⊙ p를 얻는다"]} size={10} anchor="start" color={inkSecondary} weight={600} gap={1.5} />
    </DiagramFrame>
  );
}
