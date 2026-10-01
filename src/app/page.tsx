import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import HomeCta from "@/components/HomeCta";
import CountUp from "@/components/home/CountUp";
import Journey, { type JourneyScene } from "@/components/journey/Journey";
import { getCurrentUser } from "@/lib/dal";
import { gatedHref } from "@/lib/returnPath";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";
import { difficultyInfo } from "@/lib/difficulty";

// 메인 화면: 다섯 장면(소개 → 대상 → 학습 방법 → 8주 커리큘럼 → 수료)이 하나의 3D 공간 안에서 이어진다.
// 첫 화면에는 과정을 고를 때 필요한 정보(비용·대상, 주당 시간, 선수 지식)를 요약해 둔다.
// 색은 거의 흑백으로 두고 강조색 하나만 쓰며, 여백과 얇은 선, 글자 크기 차이로 위계를 만든다.

const PHASES = [
  { key: "Part 1", name: "기초", weeks: [1, 2] },
  { key: "Part 2", name: "딥러닝", weeks: [3, 4] },
  { key: "Part 3", name: "현대 AI", weeks: [5, 6] },
  { key: "Part 4", name: "활용과 책임", weeks: [7, 8] },
];

const STEPS = [
  { name: "이해", desc: "개념 설명과 그림으로 원리를 이해합니다.", where: "학습 자료" },
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

// 과제·백지공부에 드는 시간(예상). 학습 자료 시간은 콘텐츠 분량으로 계산한다.
const ASSIGNMENT_HOURS = { min: 2, max: 3 };
const WORKSHEET_HOURS = 0.5;

const BUILDS = [
  "직접 만든 자동미분 엔진으로 학습시킨 MLP",
  "Self-Attention부터 쌓아 올린 나만의 미니 GPT 블록",
  "학습 자료에서 근거를 찾아 답하는 RAG 방식 QA 봇과 그 평가 리포트",
  "주제를 골라 끝까지 완성하는 캡스톤 프로젝트",
];

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--j-3)]">{children}</p>;
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
  // 주당 예상 시간 = 핵심 학습 자료(콘텐츠 분량으로 계산) + 백지공부 + 과제. 보충·심화는 선택이라 넣지 않는다.
  const studyHours = WEEKS.map((w) => getWeekOutline(w).sections.filter((s) => s.tier === "core").reduce((sum, s) => sum + s.minutes, 0) / 60);
  const weeklyMin = Math.floor(Math.min(...studyHours) + WORKSHEET_HOURS + ASSIGNMENT_HOURS.min);
  const weeklyMax = Math.ceil(Math.max(...studyHours) + WORKSHEET_HOURS + ASSIGNMENT_HOURS.max);
  const studyMin = Math.floor(Math.min(...studyHours));
  const studyMax = Math.ceil(Math.max(...studyHours));

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
            <span className="j-gradient">활용까지</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--j-2)] sm:text-lg">
            수학 기초부터 LLM 에이전트까지, 8주 동안 직접 코드를 작성하며 배웁니다.
          </p>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-[13px] text-[var(--j-1)] sm:text-sm">
            {[
              "무료 · 누구나 이용 가능",
              `주 ${weeklyMin}~${weeklyMax}시간`,
              "Python 기초 + 고등학교 수학",
              "설치 없이 브라우저에서 실습",
            ].map((t) => (
              <li key={t} className="rounded-full border border-[var(--j-line)] bg-white/5 px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 max-w-sm">
            <Suspense fallback={<div className="h-14 w-full rounded-full bg-white/5" />}>
              <HomeCta tone="minimal" />
            </Suspense>
          </div>
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-4 border-t border-[var(--j-line)] pt-6">
            {[
              { v: WEEKS.length, u: "주", l: "과정" },
              { v: totalStages, u: "", l: "학습 단계" },
              { v: codeCells, u: "", l: "실행 코드" },
              { v: WEEKS.length, u: "", l: "과제" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse gap-1">
                <dt className="text-[11px] text-[var(--j-3)] sm:text-xs">{s.l}</dt>
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

    // ── 02 이런 분께(선택에 필요한 정보) ─────────────────────
    {
      id: "fit",
      label: "대상",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>02 — Is it for me?</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            시작하기 전에
            <br />
            <span className="j-gradient">확인할 것.</span>
          </h2>
          <dl className="mt-8 grid border-t border-[var(--j-line)] sm:mt-10 sm:grid-cols-2">
            {[
              {
                q: "누구를 위한 과정인가요?",
                a: "AI를 '쓰는 것'을 넘어 원리부터 이해하고 싶은 대학생·입문 개발자. AI를 처음 공부하거나, 라이브러리만 써 봐서 속이 궁금한 사람에게 맞춥니다.",
              },
              {
                q: "무엇을 알고 시작해야 하나요?",
                a: "Python 기초 문법(변수·함수·리스트·반복문)과 고등학교 수준의 미분·확률. 부족한 수학은 1주차에서 벡터·확률·미분부터 다시 다룹니다.",
              },
              {
                q: "일주일에 얼마나 걸리나요?",
                a: `주 ${weeklyMin}~${weeklyMax}시간: 핵심 학습 자료 ${studyMin}~${studyMax}시간 + 백지공부 30분 + 과제 ${ASSIGNMENT_HOURS.min}~${ASSIGNMENT_HOURS.max}시간(예상). 보충·심화 단계는 선택이라 이 시간에 넣지 않았습니다.`,
              },
              {
                q: "비용이 드나요? 누가 이용할 수 있나요?",
                a: "무료이며 동아리원이 아니어도 누구나 Google 계정으로 가입해 이용할 수 있습니다. 코드는 브라우저에서 실행되어 설치할 것이 없습니다.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-[var(--j-line)] py-3 sm:py-4 sm:pr-8">
                <dt className="text-base font-semibold text-white sm:text-lg">{item.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[var(--j-2)] sm:text-[15px]">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <p className="text-base font-semibold text-white sm:text-lg">수료하면 무엇을 만들 수 있나요?</p>
            <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-sm text-[var(--j-2)] sm:grid-cols-2 sm:text-[15px]">
              {BUILDS.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden="true" className="text-[var(--journey-accent)]">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },

    // ── 03 학습 방법 ──────────────────────────────────────────
    {
      id: "cycle",
      label: "학습 방법",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>03 — Method</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            한 주는 네 단계로
            <br />
            <span className="j-gradient">순환합니다.</span>
          </h2>
          <ol className="mt-8 grid grid-cols-2 border-t border-[var(--j-line)] sm:mt-12 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.name} className="border-b border-[var(--j-line)] py-4 pr-4 sm:py-5 sm:pr-6 lg:border-b-0 lg:border-r lg:py-6 lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
                <p className="font-mono text-xs text-[var(--journey-accent)]">0{i + 1}</p>
                <p className="mt-2 text-lg font-semibold text-white sm:mt-3 sm:text-xl">{step.name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--j-2)] sm:mt-2 sm:text-sm">{step.desc}</p>
                <p className="mt-3 hidden text-[11px] tracking-wider text-[var(--j-3)] sm:mt-4 sm:block">{step.where}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-[var(--j-3)]">
            단계마다 학습 → 실습 → 확인 문제 순서로 진행합니다. 단계는 핵심(초심자)·보충(중급자)·심화(전문가)로 나뉘고, 핵심 단계만 마치면 백지공부와 과제로 한 주를 마무리할 수 있습니다. 보충은 폭을, 심화는 깊이를 더하는 선택 과정입니다.
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
              <Label>04 — Curriculum</Label>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-white sm:text-5xl">8주 커리큘럼</h2>
            </div>
            <Link href="/curriculum" className="text-sm text-[var(--j-2)] underline-offset-4 transition hover:text-white hover:underline">
              전체 커리큘럼 보기 →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-x-10 border-t border-[var(--j-line)] md:grid-cols-2">
            {PHASES.map((phase) => (
              <section key={phase.key} aria-label={`${phase.key} ${phase.name}`} className="border-b border-[var(--j-line)] py-4">
                <p className="mb-1 flex items-baseline gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--j-3)]">
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
                        <Link href={gatedHref(!!user, `/weeks/${w.slug}`)} prefetch={user ? undefined : false} className="journey-week group flex items-center gap-4 py-2.5">
                          <span className="w-7 shrink-0 font-mono text-xs text-[var(--j-3)] group-hover:text-[var(--journey-accent)]">
                            {String(n).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-[var(--j-1)] transition group-hover:text-white sm:text-base">
                              {w.title}
                            </span>
                            <span className="mt-1 block h-px w-full bg-[var(--j-line)]">
                              <span className="block h-px bg-[var(--journey-accent)] transition-all" style={{ width: `${pct}%` }} />
                            </span>
                          </span>
                          {/* 로그인한 사용자는 진행률, 방문자는 난이도를 보여 준다(방문자에게 "—"는 의미가 없다). */}
                          <span className="w-16 shrink-0 text-right text-xs tabular-nums text-[var(--j-3)]">
                            {user ? (pct > 0 ? `${pct}%` : "—") : difficultyInfo(w.difficulty).label}
                          </span>
                          <span aria-hidden="true" className="text-[var(--j-4)] transition group-hover:translate-x-0.5 group-hover:text-white">
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
          <p className="mt-5 text-sm text-[var(--j-3)]">뒤로 갈수록 난도가 높아지고, 스스로 해결해야 하는 부분이 늘어납니다.</p>
        </div>
      ),
    },

    // ── 04 수료 ───────────────────────────────────────────────
    {
      id: "outcomes",
      label: "수료",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>05 — Outcomes</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            8주 뒤,
            <br />
            <span className="j-gradient">할 수 있게 되는 것.</span>
          </h2>
          <ol className="mt-10 grid border-t border-[var(--j-line)] sm:grid-cols-2">
            {OUTCOMES.map((g, i) => (
              <li key={i} className="flex gap-4 border-b border-[var(--j-line)] py-4 sm:pr-8">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-[var(--journey-accent)]">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-[var(--j-2)] sm:text-[15px]">{g}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid items-center gap-6 sm:grid-cols-[minmax(0,22rem)_1fr]">
            <Suspense fallback={<div className="h-14 w-full rounded-full bg-white/5" />}>
              <HomeCta tone="minimal" />
            </Suspense>
            <p className="text-xs leading-relaxed text-[var(--j-3)]">
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
