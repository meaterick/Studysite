import DiagramFrame, { colors, ink, inkSecondary, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box } from "./primitives";

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
