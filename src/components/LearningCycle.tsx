import { colors } from "@/components/diagrams/DiagramFrame";
import TiltCard from "@/components/home/TiltCard";

// 이 스터디의 설계 원칙인 "이해 → 직접 구현 → 설명 → 활용" 순환을 한눈에 보여준다.
// 단계마다 사이트의 어느 부분(학습 자료/실습/백지공부·퀴즈/과제)에서 그 단계를
// 하게 되는지도 함께 적어, 커리큘럼이 어떻게 굴러가는지 바로 파악할 수 있게 한다.
const STEPS = [
  {
    name: "이해",
    desc: "단계별로 개념 설명과 그림을 보며 원리를 이해합니다.",
    where: "단계 학습",
    color: colors.blue,
  },
  {
    name: "직접 구현",
    desc: "핵심 부분을 라이브러리 없이 직접 구현하고, 브라우저에서 바로 실행합니다.",
    where: "단계 실습",
    color: colors.aqua,
  },
  {
    name: "설명",
    desc: "단계마다 확인 문제를 풀고, 주차를 마칠 때 백지에 다시 정리하며 자신의 말로 설명할 수 있는지 점검합니다.",
    where: "확인 문제 · 백지공부",
    color: colors.violet,
  },
  {
    name: "활용",
    desc: "과제에서 배운 내용을 실제 문제에 적용해 제출하면, 운영자가 채점하고 피드백을 남깁니다.",
    where: "과제 · 운영자 채점",
    color: colors.orange,
  },
];

export default function LearningCycle() {
  return (
    <div>
      <ol className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {STEPS.map((step, i) => (
          <li key={step.name} className="contents">
            <TiltCard glow={step.color}>
              <div className="flex h-full gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 lg:flex-col lg:gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: step.color }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-lg font-black"
                    style={{ color: step.color }}
                  >
                    {step.name}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {step.desc}
                  </p>
                  <p className="mt-2 inline-block rounded-full bg-[var(--surface-card-2)] px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                    {step.where}
                  </p>
                </div>
              </div>
            </TiltCard>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="flex items-center justify-center text-lg font-bold text-ink-muted"
              >
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--surface-card-2)] px-4 py-3 text-sm text-ink-secondary">
        <span aria-hidden className="text-lg">
          ↻
        </span>
        <span>
          모든 단계를 마친 뒤 그 주의 백지공부와 과제로 마무리하며, 한 주를 마치면
          다음 주제에서 같은 과정을 반복합니다.
        </span>
      </p>
    </div>
  );
}
