import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box } from "./primitives";
import { Axes, Markers, Arr, ArrPath, Lines, Tag, linear, linePath, seeded, gaussian, mono } from "./chart";

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
            <g key={i}>
              <circle cx={sx(a)} cy={sy(b)} r={3.2} fill={y ? color : "var(--surface-card)"} fillOpacity={y ? 0.8 : 1} stroke={color} strokeWidth={1.2} />
              {wrong && <circle cx={sx(a)} cy={sy(b)} r={6} fill="none" stroke={colors.red} strokeWidth={1.4} />}
            </g>
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
          <g key={`s${i}`}>
            <circle cx={right.sx(a)} cy={right.sy(b)} r={3} fill={colors.violet} fillOpacity={yNew ? 0.75 : 0.12} stroke={colors.violet} strokeWidth={1} />
            {flipped && <circle cx={right.sx(a)} cy={right.sy(b)} r={6} fill="none" stroke={colors.red} strokeWidth={1.3} />}
          </g>
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
