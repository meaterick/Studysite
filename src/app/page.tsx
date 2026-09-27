import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import HomeCta from "@/components/HomeCta";
import ProgressRing from "@/components/ProgressRing";
import NeuralScene from "@/components/home/NeuralScene";
import TypeLine from "@/components/home/TypeLine";
import CountUp from "@/components/home/CountUp";
import Journey, { type JourneyScene } from "@/components/journey/Journey";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";

// 메인 화면: 처음부터 끝까지 하나로 이어지는 "8주 여정".
// 시작 → 숫자로 보는 스터디 → 학습 방법 → 8주 로드맵 → 1~8주차 → 수료 목표 순서의 장면을
// Journey가 3D 공간의 한 경로 위에 놓고, 스크롤로 카메라가 그 경로를 따라 전진한다.

// 부(phase)별 대표 색(배경 입자에도 쓰므로 16진수로 둔다)
const PHASE_TINT: Record<string, string> = {
  "1부": "#4c9bff",
  "2부": "#2fd6a0",
  "3부": "#a399ff",
  "4부": "#ff8a5b",
};
const PHASES = [
  { key: "1부", name: "기초", weeks: [1, 2] },
  { key: "2부", name: "딥러닝", weeks: [3, 4] },
  { key: "3부", name: "현대 AI", weeks: [5, 6] },
  { key: "4부", name: "활용·책임", weeks: [7, 8] },
];

const STEPS = [
  { name: "이해", desc: "단계별로 개념 설명과 그림을 보며 원리를 이해합니다.", where: "단계 학습", tint: "#4c9bff" },
  { name: "직접 구현", desc: "핵심 부분을 라이브러리 없이 직접 구현하고, 브라우저에서 바로 실행합니다.", where: "단계 실습", tint: "#2fd6a0" },
  { name: "설명", desc: "단계마다 확인 문제를 풀고, 주차를 마칠 때 백지에 다시 정리하며 자신의 말로 설명합니다.", where: "확인 문제 · 백지공부", tint: "#a399ff" },
  { name: "활용", desc: "과제에서 배운 내용을 실제 문제에 적용해 제출하면, 운영자가 채점하고 피드백을 남깁니다.", where: "과제 · 운영자 채점", tint: "#ff8a5b" },
];

const OUTCOMES = [
  "AI, 머신러닝, 딥러닝, LLM의 작동 원리를 백지에 그려 가며 설명할 수 있습니다.",
  "선형 회귀, MLP, CNN, Self-Attention을 라이브러리 없이 직접 구현할 수 있습니다.",
  "LLM이 사전학습, SFT, 정렬을 거쳐 만들어지는 과정과 사실이 아닌 내용을 생성하는 이유(환각)를 설명할 수 있습니다.",
  "프롬프트, RAG, 에이전트로 실제 문제를 해결하고, 평가 데이터셋을 구성해 성능을 측정할 수 있습니다.",
];

function politeObjective(text: string): string {
  return text.replace(/한다\.$/, "합니다.").replace(/는다\.$/, "습니다.");
}

function Kicker({ index, children, tint = "#7cc4ff" }: { index: string; children: ReactNode; tint?: string }) {
  return (
    <p className="font-mono text-xs font-bold tracking-[0.25em] sm:text-sm" style={{ color: tint }}>
      {index} <span className="text-ink-muted">/</span> {children}
    </p>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : { sections: {}, worksheets: {} };
  const statusOf = (slug: string) => {
    const week = WEEKS.find((w) => w.slug === slug)!;
    return weekStatus(week, record, user ? findUserSubmission(user.id, slug) : undefined);
  };

  const totalStages = WEEKS.reduce((n, w) => n + getWeekOutline(w).sections.length, 0);
  const codeCells = WEEKS.reduce((n, w) => n + (w.conceptsMd.match(/^```python\s*$/gm)?.length ?? 0), 0);
  const typeLines = WEEKS.map((w) => `study(week=${w.number})  # ${w.title}`);
  const phaseOf = (n: number) => PHASES.find((p) => p.weeks.includes(n))!;

  const scenes: JourneyScene[] = [];

  // ── 장면 1: 시작 ─────────────────────────────────────────────
  scenes.push({
    id: "start",
    label: "시작",
    group: "시작",
    tint: "#4c9bff",
    content: (
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-ink-secondary">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#5ff0bd]" />
            Aegis 동아리 AI 스터디
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[1.05] sm:text-7xl">
            <span className="text-gradient">AI 기초부터</span>
            <br />
            <span className="text-white">활용까지</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg font-bold leading-relaxed text-ink-secondary sm:text-xl">
            수학 기초부터 LLM 에이전트까지, 8주 동안 직접 코드를 작성하며 배웁니다.
          </p>
          <p className="glass mt-5 max-w-xl overflow-hidden rounded-lg px-4 py-2.5 text-xs text-[#dbe7ff] sm:text-sm" aria-label="주차별 학습 주제">
            <TypeLine lines={typeLines} />
          </p>
          <div className="mt-6">
            <Suspense fallback={<div className="h-14 w-full rounded-xl bg-[var(--surface-card-2)] sm:max-w-md" />}>
              <HomeCta />
            </Suspense>
          </div>
          <p className="journey-hint mt-6 text-xs font-bold text-ink-muted">
            <span aria-hidden="true">↓</span> 스크롤하면 8주 여정이 시작됩니다
          </p>
        </div>
        <div className="relative hidden h-[440px] lg:block">
          <NeuralScene scene={0} />
          <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-ink-muted">
            끌어서 회전해 보십시오
          </p>
        </div>
      </div>
    ),
  });

  // ── 장면 2: 숫자로 보는 스터디 ───────────────────────────────
  const stats = [
    { value: WEEKS.length, unit: "주", label: "기초부터 활용까지 이어지는 커리큘럼" },
    { value: totalStages, unit: "단계", label: "학습 → 실습 → 확인 문제로 나뉜 단계" },
    { value: codeCells, unit: "개", label: "설치 없이 브라우저에서 실행하는 코드" },
    { value: WEEKS.length, unit: "개", label: "사이트 안에서 작성·실행·제출하는 과제" },
  ];
  scenes.push({
    id: "numbers",
    label: "숫자로 보는 스터디",
    group: "개요",
    tint: "#5ff0bd",
    content: (
      <div>
        <Kicker index="01" tint="#5ff0bd">
          OVERVIEW
        </Kicker>
        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">숫자로 보는 스터디</h2>
        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass flex flex-col-reverse rounded-2xl p-4 sm:p-6">
              <dt className="mt-2 text-xs text-ink-secondary sm:text-sm">{s.label}</dt>
              <dd className="text-4xl font-black text-white sm:text-6xl">
                <CountUp value={s.value} scene={1} />
                <span className="ml-1 text-base font-bold text-ink-secondary sm:text-xl">{s.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  });

  // ── 장면 3: 학습 방법 ────────────────────────────────────────
  scenes.push({
    id: "cycle",
    label: "학습 방법",
    group: "학습 방법",
    tint: "#a399ff",
    content: (
      <div>
        <Kicker index="02" tint="#c0b8ff">
          HOW
        </Kicker>
        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">학습 방법</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink-secondary sm:text-base">
          매주 <strong className="text-white">이해, 구현, 설명, 활용</strong> 순서로 진행합니다. 각 주차는 여러 단계로 나뉘며, 단계마다 학습 → 실습 → 확인 문제를 마쳐야 다음 단계가 열립니다.
        </p>
        <ol className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.name} className="glass relative rounded-2xl p-4" style={{ borderColor: `${step.tint}66` }}>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-black text-[#060912]"
                style={{ background: step.tint }}
              >
                {i + 1}
              </span>
              <p className="mt-2 text-lg font-black sm:text-xl" style={{ color: step.tint }}>
                {step.name}
              </p>
              <p className="mt-1 text-xs text-ink-secondary sm:text-sm">{step.desc}</p>
              <p className="mt-2 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-ink-secondary">{step.where}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-ink-muted sm:text-sm">
          <span aria-hidden="true">↻ </span>모든 단계를 마치면 그 주의 백지공부와 과제가 열리며, 한 주를 마치면 다음 주제에서 같은 과정을 반복합니다.
        </p>
      </div>
    ),
  });

  // ── 장면 4: 8주 로드맵 ───────────────────────────────────────
  scenes.push({
    id: "roadmap",
    label: "8주 로드맵",
    group: "로드맵",
    tint: "#ff8a5b",
    content: (
      <div>
        <Kicker index="03" tint="#ffb088">
          ROADMAP
        </Kicker>
        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">8주 로드맵</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink-secondary sm:text-base">
          8주 과정은 네 부분으로 구성됩니다. 뒤로 갈수록 난도가 높아지고, 스스로 해결해야 하는 부분도 늘어납니다. 이어지는 장면에서 한 주씩 살펴봅니다.
        </p>
        <ol className="mt-6 grid gap-3 lg:grid-cols-4">
          {PHASES.map((p) => (
            <li key={p.key} className="glass rounded-2xl border-l-4 p-4" style={{ borderLeftColor: PHASE_TINT[p.key] }}>
              <p className="font-mono text-xs font-bold" style={{ color: PHASE_TINT[p.key] }}>
                {p.key}
              </p>
              <p className="text-lg font-black text-white">{p.name}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-ink-secondary sm:text-sm">
                {p.weeks.map((n) => {
                  const w = WEEKS.find((x) => x.number === n)!;
                  return (
                    <li key={n}>
                      <span className="font-bold text-white">{n}주차</span> · {w.title}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    ),
  });

  // ── 장면 5~12: 1~8주차 ───────────────────────────────────────
  WEEKS.forEach((w, idx) => {
    const st = statusOf(w.slug);
    const phase = phaseOf(w.number);
    const tint = PHASE_TINT[phase.key];
    scenes.push({
      id: idx === 0 ? "weeks" : `week-${w.number}`,
      label: `${w.number}주차 · ${w.title}`,
      group: "주차별 자료",
      tint,
      content: (
        <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <div>
            <Kicker index={`04.${w.number}`} tint={tint}>
              {phase.key} · {phase.name}
            </Kicker>
            <p aria-hidden="true" className="journey-week-number mt-1 font-black leading-none" style={{ WebkitTextStrokeColor: tint }}>
              W{w.number}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-4xl">
              {w.number}주차 · {w.title}
            </h2>
            <p className="mt-2 text-xs text-ink-secondary sm:text-sm">{w.subtitle}</p>
          </div>
          <div className="glass rounded-2xl p-4 sm:p-6" style={{ borderColor: `${tint}55` }}>
            <div className="flex items-center gap-4">
              <ProgressRing ratio={st.ratio} size={56} />
              <div className="text-xs text-ink-secondary sm:text-sm">
                <p className="font-bold text-white">
                  {st.sectionsTotal}단계 중 {st.sectionsDone}단계 완료
                </p>
                <p>
                  난이도 {"★".repeat(w.difficulty)}
                  {"☆".repeat(5 - w.difficulty)}
                </p>
              </div>
            </div>
            {w.objectives[0] && (
              <div className="mt-4 rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold" style={{ color: tint }}>
                  이번 주 목표
                </p>
                <p className="mt-0.5 text-sm text-white sm:text-base">{politeObjective(w.objectives[0])}</p>
                {w.objectives.length > 1 && <p className="mt-1 text-xs text-ink-muted">목표 {w.objectives.length - 1}개 더</p>}
              </div>
            )}
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="주요 키워드">
              {w.keywords.slice(0, 10).map((k) => (
                <li key={k} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary">
                  {k}
                </li>
              ))}
              {w.keywords.length > 10 && <li className="px-1 text-[11px] text-ink-muted">외 {w.keywords.length - 10}개</li>}
            </ul>
            <Link
              href={`/weeks/${w.slug}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[#060912] transition hover:opacity-90"
              style={{ background: tint }}
            >
              {w.number}주차 학습하기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ),
    });
  });

  // ── 장면 13: 수료 목표 ───────────────────────────────────────
  scenes.push({
    id: "outcomes",
    label: "수료 목표",
    group: "수료",
    tint: "#5ff0bd",
    content: (
      <div>
        <Kicker index="05" tint="#5ff0bd">
          OUTCOMES
        </Kicker>
        <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">8주 뒤에 할 수 있는 것</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {OUTCOMES.map((g, i) => (
            <li key={i} className="glass flex gap-3 rounded-2xl p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4c9bff] to-[#a399ff] font-mono text-xs font-bold text-white">
                0{i + 1}
              </span>
              <p className="text-xs text-ink-secondary sm:text-sm">{g}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Suspense fallback={<div className="h-14 w-full rounded-xl bg-[var(--surface-card-2)] sm:max-w-md" />}>
            <HomeCta />
          </Suspense>
          <Link href="/weeks" className="text-sm font-bold text-[#7cc4ff] hover:underline">
            주차별 자료 전체 보기 →
          </Link>
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
          ※ 이 커리큘럼은 Stanford CS229·CS231n·CS224n·CS336, MIT 6.S191, Berkeley CS188, CMU 10-601의 강의 구성을 참고해 설계했습니다.
        </p>
      </div>
    ),
  });

  return (
    <div className="hero-dark">
      <Journey scenes={scenes} />
    </div>
  );
}
