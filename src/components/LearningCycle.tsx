import { colors } from "@/components/diagrams/DiagramFrame";

// 이 스터디의 설계 원칙인 "이해 → 직접 구현 → 설명 → 활용" 순환을 한눈에 보여준다.
// 단계마다 사이트의 어느 부분(학습 자료/실습/백지공부·퀴즈/과제)에서 그 단계를
// 하게 되는지도 함께 적어, 커리큘럼이 어떻게 굴러가는지 바로 파악할 수 있게 한다.
const STEPS = [
  {
    name: "이해",
    desc: "핵심 개념과 도식으로 원리를 먼저 이해합니다.",
    where: "학습 자료",
    color: colors.blue,
  },
  {
    name: "직접 구현",
    desc: "라이브러리에 기대지 않고 브라우저에서 코드를 직접 짜고 실행해 봅니다.",
    where: "코드 실습",
    color: colors.aqua,
  },
  {
    name: "설명",
    desc: "빈 종이에 다시 그려 보고 퀴즈에 답하며 내 말로 설명합니다.",
    where: "백지공부 · 퀴즈",
    color: colors.violet,
  },
  {
    name: "활용",
    desc: "배운 것을 실제 문제에 적용하는 과제로 마무리합니다.",
    where: "과제",
    color: colors.orange,
  },
];

export default function LearningCycle() {
  return (
    <div>
      <ol className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {STEPS.map((step, i) => (
          <li key={step.name} className="contents">
            <div className="flex gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 lg:flex-col lg:gap-2">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: step.color }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-black" style={{ color: step.color }}>
                  {step.name}
                </p>
                <p className="mt-0.5 text-sm text-ink-secondary">{step.desc}</p>
                <p className="mt-2 inline-block rounded-full bg-[var(--surface-card-2)] px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                  {step.where}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="flex items-center justify-center text-lg font-bold text-ink-muted">
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--surface-card-2)] px-4 py-3 text-sm text-ink-secondary">
        <span aria-hidden className="text-lg">↻</span>
        <span>
          매주 이 네 단계를 한 바퀴 돌고, 다음 주에는 한 단계 더 어려운 주제로 다시 순환합니다.
        </span>
      </p>
    </div>
  );
}
