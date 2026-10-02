import { colors } from "@/components/diagrams/DiagramFrame";
import TiltCard from "@/components/home/TiltCard";

// 한 주의 기본 흐름(핵심 단계 학습 → 확인 문제 → 백지공부 → 과제)과 각 단계를 하는 화면을 보여 준다.
const STEPS = [
  { name: "핵심 단계 학습", desc: "단계별 설명과 그림, 실행 가능한 예제로 개념을 익힙니다.", where: "학습 자료", color: colors.blue },
  { name: "확인 문제", desc: "단계마다 객관식 문제를 풀고 해설을 확인합니다.", where: "학습 자료", color: colors.aqua },
  { name: "백지공부", desc: "자료를 덮고 그 주의 핵심 개념을 설명하는 문제에 답합니다.", where: "적용과 복습", color: colors.violet },
  { name: "과제", desc: "배운 내용을 실제 문제에 적용해 제출하고 채점과 피드백을 받습니다.", where: "적용과 복습", color: colors.orange },
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
      <p className="mt-3 rounded-lg bg-[var(--surface-card-2)] px-4 py-3 text-sm text-ink-secondary">
        <span className="font-bold text-ink">선택 과정</span> · 보충·심화 단계, 서술형, 코딩 실습, 추가 퀴즈, 복습 노트
      </p>
    </div>
  );
}
