import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import HomeCta from "@/components/HomeCta";
import CountUp from "@/components/home/CountUp";
import Journey, { type JourneyScene } from "@/components/journey/Journey";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";

// 메인 화면: 네 장면(소개 → 학습 방법 → 8주 커리큘럼 → 수료)이 하나의 3D 공간 안에서 이어진다.
// 색은 거의 흑백으로 두고 강조색 하나만 쓰며, 여백과 얇은 선, 글자 크기 차이로 위계를 만든다.

const PHASES = [
  { key: "Part 1", name: "기초", weeks: [1, 2] },
  { key: "Part 2", name: "딥러닝", weeks: [3, 4] },
  { key: "Part 3", name: "현대 AI", weeks: [5, 6] },
  { key: "Part 4", name: "활용과 책임", weeks: [7, 8] },
];

const STEPS = [
  { name: "이해", desc: "개념 설명과 그림으로 원리를 이해합니다.", where: "단계 학습" },
  { name: "구현", desc: "핵심을 라이브러리 없이 직접 구현하고 브라우저에서 실행합니다.", where: "단계 실습" },
  { name: "설명", desc: "확인 문제와 백지공부로 자신의 말로 설명할 수 있는지 점검합니다.", where: "확인 문제 · 백지공부" },
  { name: "활용", desc: "과제에서 실제 문제에 적용하고, 운영자의 채점과 피드백을 받습니다.", where: "과제 · 채점" },
];

const OUTCOMES = [
  "AI, 머신러닝, 딥러닝, LLM의 작동 원리를 백지에 그려 가며 설명할 수 있습니다.",
  "선형 회귀, MLP, CNN, Self-Attention을 라이브러리 없이 직접 구현할 수 있습니다.",
  "LLM이 사전학습, SFT, 정렬을 거쳐 만들어지는 과정과 환각이 생기는 이유를 설명할 수 있습니다.",
  "프롬프트, RAG, 에이전트로 문제를 해결하고, 평가 데이터셋으로 성능을 측정할 수 있습니다.",
];

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">{children}</p>;
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

  const scenes: JourneyScene[] = [
    // ── 01 소개 ───────────────────────────────────────────────
    {
      id: "start",
      label: "소개",
      content: (
        <div className="mx-auto max-w-4xl text-center">
          <Label>Aegis AI Study · 8 Weeks</Label>
          <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-7xl">
            AI 기초부터
            <br />
            <span className="text-white/55">활용까지</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            수학 기초부터 LLM 에이전트까지, 8주 동안 직접 코드를 작성하며 배웁니다.
          </p>
          <div className="mx-auto mt-10 max-w-sm">
            <Suspense fallback={<div className="h-14 w-full rounded-full bg-white/5" />}>
              <HomeCta tone="minimal" />
            </Suspense>
          </div>
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-4 border-t border-white/10 pt-6">
            {[
              { v: WEEKS.length, u: "주", l: "과정" },
              { v: totalStages, u: "", l: "학습 단계" },
              { v: codeCells, u: "", l: "실행 코드" },
              { v: WEEKS.length, u: "", l: "과제" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse gap-1">
                <dt className="text-[11px] text-white/40 sm:text-xs">{s.l}</dt>
                <dd className="text-xl font-semibold tabular-nums text-white sm:text-3xl">
                  <CountUp value={s.v} scene={0} />
                  {s.u}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },

    // ── 02 학습 방법 ──────────────────────────────────────────
    {
      id: "cycle",
      label: "학습 방법",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>01 — Method</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            한 주는 네 단계로
            <br />
            <span className="text-white/45">순환합니다.</span>
          </h2>
          <ol className="mt-8 grid grid-cols-2 border-t border-white/10 sm:mt-12 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.name} className="border-b border-white/10 py-4 pr-4 sm:py-5 sm:pr-6 lg:border-b-0 lg:border-r lg:py-6 lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
                <p className="font-mono text-xs text-[var(--journey-accent)]">0{i + 1}</p>
                <p className="mt-2 text-lg font-semibold text-white sm:mt-3 sm:text-xl">{step.name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55 sm:mt-2 sm:text-sm">{step.desc}</p>
                <p className="mt-3 hidden text-[11px] tracking-wider text-white/35 sm:mt-4 sm:block">{step.where}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-white/40">
            단계마다 학습 → 실습 → 확인 문제를 마치면 다음 단계가 열리고, 모든 단계를 마치면 백지공부와 과제가 열립니다.
          </p>
        </div>
      ),
    },

    // ── 03 8주 커리큘럼(한 화면) ──────────────────────────────
    {
      id: "weeks",
      label: "커리큘럼",
      content: (
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Label>02 — Curriculum</Label>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-white sm:text-5xl">8주 커리큘럼</h2>
            </div>
            <Link href="/curriculum" className="text-sm text-white/55 underline-offset-4 transition hover:text-white hover:underline">
              전체 커리큘럼 보기 →
            </Link>
          </div>
          <div className="mt-10 grid gap-x-10 border-t border-white/10 md:grid-cols-2">
            {PHASES.map((phase) => (
              <section key={phase.key} aria-label={`${phase.key} ${phase.name}`} className="border-b border-white/10 py-4">
                <p className="mb-1 flex items-baseline gap-3 text-[11px] uppercase tracking-[0.2em] text-white/35">
                  <span className="font-mono">{phase.key}</span>
                  <span className="normal-case tracking-normal">{phase.name}</span>
                </p>
                <ul>
                  {phase.weeks.map((n) => {
                    const w = WEEKS.find((x) => x.number === n)!;
                    const st = statusOf(w.slug);
                    const pct = Math.round(st.ratio * 100);
                    return (
                      <li key={w.slug}>
                        <Link href={`/weeks/${w.slug}`} className="journey-week group flex items-center gap-4 py-2.5">
                          <span className="w-7 shrink-0 font-mono text-xs text-white/35 group-hover:text-[var(--journey-accent)]">
                            {String(n).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-white/85 transition group-hover:text-white sm:text-base">
                              {w.title}
                            </span>
                            <span className="mt-1 block h-px w-full bg-white/10">
                              <span className="block h-px bg-[var(--journey-accent)] transition-all" style={{ width: `${pct}%` }} />
                            </span>
                          </span>
                          <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-white/40">
                            {pct > 0 ? `${pct}%` : "—"}
                          </span>
                          <span aria-hidden="true" className="text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white">
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-5 text-sm text-white/40">뒤로 갈수록 난도가 높아지고, 스스로 해결해야 하는 부분이 늘어납니다.</p>
        </div>
      ),
    },

    // ── 04 수료 ───────────────────────────────────────────────
    {
      id: "outcomes",
      label: "수료",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>03 — Outcomes</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            8주 뒤,
            <br />
            <span className="text-white/45">할 수 있게 되는 것.</span>
          </h2>
          <ol className="mt-10 grid border-t border-white/10 sm:grid-cols-2">
            {OUTCOMES.map((g, i) => (
              <li key={i} className="flex gap-4 border-b border-white/10 py-4 sm:pr-8">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-[var(--journey-accent)]">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-white/70 sm:text-[15px]">{g}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid items-center gap-6 sm:grid-cols-[minmax(0,22rem)_1fr]">
            <Suspense fallback={<div className="h-14 w-full rounded-full bg-white/5" />}>
              <HomeCta tone="minimal" />
            </Suspense>
            <p className="text-xs leading-relaxed text-white/35">
              Stanford CS229·CS231n·CS224n·CS336, MIT 6.S191, Berkeley CS188, CMU 10-601의 강의 구성을 참고해 설계했습니다.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="journey-theme">
      <Journey scenes={scenes} />
    </div>
  );
}
