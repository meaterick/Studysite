import DiagramFrame, { colors, ink, inkSecondary, card2Bg } from "./DiagramFrame";
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
