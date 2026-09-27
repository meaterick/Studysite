import Link from "next/link";
import { Suspense } from "react";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import WeekCard from "@/components/WeekCard";
import HomeCta from "@/components/HomeCta";
import HomeRoadmap from "@/components/HomeRoadmap";
import LearningCycle from "@/components/LearningCycle";
import NeuralScene from "@/components/home/NeuralScene";
import TiltCard from "@/components/home/TiltCard";
import TypeLine from "@/components/home/TypeLine";
import CountUp from "@/components/home/CountUp";
import Scroll3D from "@/components/home/Scroll3D";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";

const SECTIONS = [
  { id: "cycle", label: "학습 방법" },
  { id: "roadmap", label: "8주 로드맵" },
  { id: "weeks", label: "주차별 자료" },
  { id: "outcomes", label: "수료 목표" },
];

const OUTCOMES = [
  "AI, 머신러닝, 딥러닝, LLM의 작동 원리를 백지에 그려 가며 설명할 수 있습니다.",
  "선형 회귀, MLP, CNN, Self-Attention을 라이브러리 없이 직접 구현할 수 있습니다.",
  "LLM이 사전학습, SFT, 정렬을 거쳐 만들어지는 과정과 사실이 아닌 내용을 생성하는 이유(환각)를 설명할 수 있습니다.",
  "프롬프트, RAG, 에이전트로 실제 문제를 해결하고, 평가 데이터셋을 구성해 성능을 측정할 수 있습니다.",
];

// 첫 화면에 떠다니는 수식 조각(장식용)
const FLOATING = [
  { text: "θ ← θ − η∇L", className: "left-[4%] top-[14%]", delay: "0s" },
  { text: "softmax(QKᵀ/√d)", className: "right-[6%] top-[8%]", delay: "1.2s" },
  { text: "P(A|B)", className: "left-[10%] bottom-[16%]", delay: "2.1s" },
  { text: "C ≈ 6ND", className: "right-[10%] bottom-[10%]", delay: "0.6s" },
];

function SectionHeading({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <Scroll3D variant="parallax" depth={0.6}>
          <p className="section-index text-sm font-bold tracking-widest">
            {index}
          </p>
        </Scroll3D>
        <Scroll3D variant="flip">
          <h2
            id={id}
            className="scroll-mt-24 text-2xl font-black text-ink sm:text-3xl"
          >
            {title}
          </h2>
        </Scroll3D>
      </div>
      {children && (
        <Scroll3D variant="orbit" depth={0.6}>
          {children}
        </Scroll3D>
      )}
    </div>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <Scroll3D variant="barrel" depth={0.8} className="-mt-2 mb-6">
      <p className="text-sm text-ink-secondary">{children}</p>
    </Scroll3D>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const record = user
    ? getLearningRecord(user.id)
    : { sections: {}, worksheets: {} };
  const statusOf = (slug: string) => {
    const week = WEEKS.find((w) => w.slug === slug)!;
    return weekStatus(
      week,
      record,
      user ? findUserSubmission(user.id, slug) : undefined,
    );
  };

  const totalStages = WEEKS.reduce(
    (n, w) => n + getWeekOutline(w).sections.length,
    0,
  );
  const codeCells = WEEKS.reduce(
    (n, w) => n + (w.conceptsMd.match(/^```python\s*$/gm)?.length ?? 0),
    0,
  );
  const stats = [
    { value: WEEKS.length, unit: "주", label: "커리큘럼" },
    { value: totalStages, unit: "단계", label: "학습 → 실습 → 확인 문제" },
    { value: codeCells, unit: "개", label: "브라우저에서 실행하는 코드" },
    { value: WEEKS.length, unit: "개", label: "사이트 안에서 끝나는 과제" },
  ];
  const typeLines = WEEKS.map((w) => `study(week=${w.number})  # ${w.title}`);

  return (
    // 옆으로 회전하며 움직이는 요소가 가로 스크롤을 만들지 않도록 잘라 낸다.
    <div className="overflow-x-clip">
      {/* ── 첫 화면: 3D 신경망 ───────────────────────────── */}
      <section
        aria-labelledby="hero-title"
        className="hero-dark relative isolate overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%] overflow-hidden"
        >
          <Scroll3D variant="hero" depth={0.4} className="absolute inset-0">
            <div className="hero-grid absolute inset-0" />
          </Scroll3D>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-4">
          <div className="relative z-10">
            <Scroll3D variant="hero" depth={1.6}>
              <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-ink-secondary">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[#5ff0bd]" />
                Aegis 동아리 AI 스터디
              </p>
            </Scroll3D>
            <h1
              id="hero-title"
              className="mt-4 text-4xl font-black leading-[1.1] sm:text-6xl"
            >
              <Scroll3D as="span" variant="hero" depth={1.35} className="block">
                <span className="text-gradient">AI 기초부터</span>
              </Scroll3D>
              <Scroll3D as="span" variant="hero" depth={1.1} className="block">
                <span className="text-white">활용까지</span>
              </Scroll3D>
            </h1>
            <Scroll3D variant="hero" depth={0.95}>
              <p className="mt-4 max-w-xl text-lg font-bold leading-relaxed text-ink-secondary sm:text-xl">
                수학 기초부터 LLM 에이전트까지, 8주 동안 직접 코드를 작성하며
                배웁니다.
              </p>
            </Scroll3D>
            <Scroll3D variant="hero" depth={0.8}>
              <p
                className="glass mt-5 max-w-xl overflow-hidden rounded-lg px-4 py-2.5 text-xs text-[#dbe7ff] sm:text-sm"
                aria-label="주차별 학습 주제"
              >
                <TypeLine lines={typeLines} />
              </p>
            </Scroll3D>

            <Scroll3D variant="hero" depth={0.65} className="mt-7">
              <Suspense
                fallback={
                  <div className="h-14 w-full rounded-xl bg-[var(--surface-card-2)] sm:max-w-md" />
                }
              >
                <HomeCta />
              </Suspense>
            </Scroll3D>

            <nav aria-label="바로 가기" className="mt-8">
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map((s, i) => (
                  <Scroll3D
                    key={s.id}
                    as="span"
                    variant="hero"
                    depth={0.5 + i * 0.25}
                    className="inline-block"
                  >
                    <a
                      href={`#${s.id}`}
                      className="glass inline-block rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-secondary transition hover:border-[#7cc4ff] hover:text-white"
                    >
                      <span className="mr-1 font-mono text-xs text-[#7cc4ff]">
                        0{i + 1}
                      </span>
                      {s.label}
                    </a>
                  </Scroll3D>
                ))}
              </div>
            </nav>
          </div>

          <div className="relative -mx-4 h-[300px] sm:mx-0 sm:h-[420px] lg:h-[520px]">
            <NeuralScene />
            {FLOATING.map((f, i) => (
              <Scroll3D
                key={f.text}
                variant="hero"
                depth={0.6 + i * 0.35}
                className={`pointer-events-none absolute hidden sm:block ${f.className}`}
              >
                <span
                  aria-hidden="true"
                  style={{ animationDelay: f.delay }}
                  className="float-slow glass block rounded-md px-2.5 py-1 font-mono text-xs text-[#c9d4e6]"
                >
                  {f.text}
                </span>
              </Scroll3D>
            ))}
            <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-ink-muted">
              끌어서 회전해 보십시오
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--border-hairline)] bg-black/20">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Scroll3D
                key={s.label}
                variant="orbit"
                offset={(i - 1.5) * 0.08}
                depth={0.9}
                className="px-2 py-5 sm:px-4"
              >
                <dt className="text-xs font-medium text-ink-muted">
                  {s.label}
                </dt>
                <dd className="mt-1 text-3xl font-black text-white sm:text-4xl">
                  <CountUp value={s.value} />
                  <span className="ml-1 text-base font-bold text-ink-secondary">
                    {s.unit}
                  </span>
                </dd>
              </Scroll3D>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 본문 ─────────────────────────────────────────── */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <Scroll3D
            variant="parallax"
            depth={6}
            className="absolute -left-40 top-20"
          >
            <div className="h-96 w-96 rounded-full bg-[var(--series-blue)] opacity-[0.08] blur-3xl" />
          </Scroll3D>
          <Scroll3D
            variant="parallax"
            depth={-5}
            className="absolute -right-40 top-[40%]"
          >
            <div className="h-96 w-96 rounded-full bg-[var(--series-violet)] opacity-[0.08] blur-3xl" />
          </Scroll3D>
          <Scroll3D
            variant="parallax"
            depth={4}
            className="absolute bottom-0 left-1/3"
          >
            <div className="h-80 w-80 rounded-full bg-[var(--series-aqua)] opacity-[0.07] blur-3xl" />
          </Scroll3D>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <section className="mb-20">
            <SectionHeading id="cycle" index="01 / HOW" title="학습 방법" />
            <Lead>
              매주 <strong className="text-ink">이해, 구현, 설명, 활용</strong>{" "}
              순서로 진행합니다. 각 주차는 여러 단계로 나뉘며, 단계마다 학습 →
              실습 → 확인 문제를 마쳐야 다음 단계가 열립니다.
            </Lead>
            <LearningCycle />
          </section>

          <section className="mb-20">
            <SectionHeading
              id="roadmap"
              index="02 / ROADMAP"
              title="8주 로드맵"
            />
            <Lead>
              8주 과정은 네 부분으로 구성됩니다. 뒤로 갈수록 난도가 높아지고,
              스스로 해결해야 하는 부분도 늘어납니다.
            </Lead>
            <HomeRoadmap />
          </section>

          <section className="mb-20">
            <SectionHeading id="weeks" index="03 / WEEKS" title="주차별 자료">
              <Link
                href="/weeks"
                className="shrink-0 text-sm font-bold text-[var(--series-blue)] hover:underline"
              >
                전체 보기 →
              </Link>
            </SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WEEKS.map((w) => {
                const st = statusOf(w.slug);
                const col = (w.number - 1) % 4;
                return (
                  <Scroll3D
                    key={w.slug}
                    variant={
                      col === 0 ? "left" : col === 3 ? "right" : "barrel"
                    }
                    offset={(col - 1.5) * 0.07}
                    depth={1.1}
                  >
                    <TiltCard max={7} className="h-full">
                      <WeekCard
                        week={w}
                        ratio={st.ratio}
                        sectionsDone={st.sectionsDone}
                        sectionsTotal={st.sectionsTotal}
                        layered
                      />
                    </TiltCard>
                  </Scroll3D>
                );
              })}
            </div>
          </section>

          <section className="mb-14">
            <SectionHeading
              id="outcomes"
              index="04 / OUTCOMES"
              title="수료 후 할 수 있는 것"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {OUTCOMES.map((g, i) => (
                <Scroll3D
                  key={i}
                  variant={i % 2 === 0 ? "left" : "right"}
                  offset={(Math.floor(i / 2) - 0.5) * 0.08}
                >
                  <TiltCard
                    max={5}
                    glow="var(--series-violet)"
                    className="h-full"
                  >
                    <div className="flex h-full gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4">
                      <Scroll3D
                        variant="orbit"
                        depth={0.5}
                        className="shrink-0"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--series-blue)] to-[var(--series-violet)] font-mono text-xs font-bold text-white">
                          0{i + 1}
                        </span>
                      </Scroll3D>
                      <Scroll3D variant="parallax" depth={0.4}>
                        <p className="text-sm text-ink-secondary">{g}</p>
                      </Scroll3D>
                    </div>
                  </TiltCard>
                </Scroll3D>
              ))}
            </div>
          </section>

          <Scroll3D variant="zoom" depth={0.7}>
            <p className="border-t border-[var(--border-hairline)] pt-4 text-xs leading-relaxed text-ink-muted">
              ※ 이 커리큘럼은 Stanford CS229·CS231n·CS224n·CS336, MIT 6.S191,
              Berkeley CS188, CMU 10-601의 강의 구성을 참고해 설계했습니다.
            </p>
          </Scroll3D>
        </div>
      </div>
    </div>
  );
}
