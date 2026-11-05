import Link from "next/link";
import type { ReactNode } from "react";
import CountUp from "@/components/home/CountUp";
import Journey, { type JourneyScene } from "@/components/journey/Journey";
import { MODULES, modulesOfTrack } from "@/content/course";
import { LEARNING_FIELDS, learningField } from "@/content/fields";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { isLessonComplete } from "@/lib/study";
import { trackHref } from "@/lib/routes";

const fieldGroups = [
  { key: "Part 1", name: "프로그래밍과 수학", ids: ["programming", "math"] },
  { key: "Part 2", name: "데이터와 모델링", ids: ["data", "ml"] },
  { key: "Part 3", name: "신경망과 언어 모델", ids: ["dl", "genai"] },
  { key: "Part 4", name: "프로젝트와 확장", ids: ["capstone", "extension"] },
] as const;

function BrowseFields() {
  return (
    <a
      href="#fields"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/85"
    >
      학습 분야 둘러보기
    </a>
  );
}

// 위쪽 네 단계가 필수 흐름이고, 각 영역에서 고를 수 있는 선택 과정을 그 아래에 붙인다.
const FLOW = [
  {
    area: "학습 자료",
    when: "핵심 레슨부터",
    steps: [
      { name: "개념 학습", desc: "글과 그림, 직접 실행하는 코드로 원리를 익힙니다." },
      { name: "확인 문제", desc: "레슨마다 문제를 풀며 이해했는지 짚어 봅니다." },
    ],
    extras: [
      { name: "보충", desc: "실무 도구와 다른 방법으로 폭을 넓힙니다." },
      { name: "심화", desc: "수식 유도와 최신 기법까지 다룹니다." },
    ],
  },
  {
    area: "적용과 복습",
    when: "핵심 레슨를 마친 뒤",
    steps: [
      { name: "백지공부", desc: "자료를 덮고 떠올려 적으며 스스로 점검합니다." },
      { name: "과제", desc: "실제 문제에 적용하고 운영자의 채점을 받습니다." },
    ],
    extras: [
      { name: "서술형", desc: "직접 설명해 보고 스스로 평가합니다." },
      { name: "추가 퀴즈", desc: "객관식과 코드 출력 예측 문제를 풉니다." },
      { name: "코딩 실습", desc: "빈칸 코드를 채우면 바로 채점됩니다." },
    ],
  },
];

const OUTCOMES = [
  "Python으로 파일을 읽고 반복 작업을 자동화합니다.",
  "수학과 통계로 데이터를 해석하고 NumPy와 pandas로 정리합니다.",
  "머신러닝 모델과 신경망을 학습시키고 결과를 평가합니다.",
  "언어 모델로 검색·도구를 활용하는 시스템을 만들거나 관심 주제로 프로젝트를 진행합니다."
];

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--j-3)]">{children}</p>;
}

export default async function Home() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : undefined;
  const lessonCount = MODULES.reduce((sum, module) => sum + module.lessons.length, 0);
  const assignmentCount = MODULES.filter((module) => module.assignment).length;

  const scenes: JourneyScene[] = [
    // ── 01 소개 ───────────────────────────────────────────────
    {
      id: "start",
      label: "소개",
      content: (
        <div className="mx-auto max-w-4xl text-center">
          <Label>Aegis Study · Learning Library</Label>
          <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-7xl">
            관심 있는 분야부터
            <br />
            <span className="j-gradient">직접 실습하며 배워요</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--j-2)] sm:text-lg">
            Python, 데이터 처리, 머신러닝, 딥러닝 등 원하는 분야를 선택하고 직접 코드를 작성하며 배웁니다.
          </p>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-[13px] text-[var(--j-1)] sm:text-sm">
            {[
              "무료 · 누구나 이용 가능",
              "분야별 모듈과 레슨",
              "확인 문제와 코딩 실습",
              "설치 없이 브라우저에서 실습",
            ].map((t) => (
              <li key={t} className="rounded-full border border-[var(--j-line)] bg-white/5 px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 max-w-sm">
            <BrowseFields />
          </div>
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-4 border-t border-[var(--j-line)] pt-6">
            {[
              { v: LEARNING_FIELDS.length, u: "", l: "학습 분야" },
              { v: MODULES.length, u: "", l: "모듈" },
              { v: lessonCount, u: "", l: "레슨" },
              { v: assignmentCount, u: "", l: "과제" },
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
          <dl className="mt-6 grid border-t border-[var(--j-line)] sm:mt-10 sm:grid-cols-2">
            {[
              {
                q: "누구를 위한 과정인가요?",
                a: "Python을 처음 배우는 분부터 데이터 분석이나 모델링을 더 깊게 공부하고 싶은 분까지, 필요한 분야를 골라 학습할 수 있습니다.",
              },
              {
                q: "무엇을 알고 시작해야 하나요?",
                a: "Python이 처음이면 프로그래밍 분야부터 시작하세요. 다른 분야를 선택했다면 모듈과 레슨에 표시된 선수 지식을 먼저 확인하세요.",
              },
              {
                q: "얼마나 걸리나요?",
                a: "레슨마다 예상 학습 시간이 표시됩니다. 여러 분야를 순서대로 공부하고 싶다면 커리큘럼의 기본 일정을 참고하세요.",
              },
              {
                q: "비용이 드나요? 누가 이용할 수 있나요?",
                a: "무료이며, 동아리원이 아니어도 누구나 이용할 수 있습니다. 코드는 브라우저에서 바로 실행되므로 따로 설치할 것이 없습니다.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-[var(--j-line)] py-3 sm:py-5 sm:pr-10">
                <dt className="text-base font-semibold text-white sm:text-lg">{item.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-pretty text-[var(--j-2)] sm:text-[15px]">{item.a}</dd>
              </div>
            ))}
          </dl>
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
            한 모듈은 네 단계로
            <br />
            <span className="j-gradient">진행됩니다.</span>
          </h2>
          <div className="mt-6 grid gap-y-5 sm:mt-11 sm:gap-y-8 lg:grid-cols-2">
            {FLOW.map((part, p) => {
              const first = FLOW.slice(0, p).reduce((sum, f) => sum + f.steps.length, 0) + 1;
              return (
                <section key={part.area} aria-label={part.area} className="flex flex-col">
                  <p className="flex items-baseline gap-2.5 text-[13px]">
                    <span className="font-semibold text-white">{part.area}</span>
                    <span className="text-[var(--j-3)]">{part.when}</span>
                  </p>
                  <ol start={first} className="mt-2.5 grid grid-cols-2 sm:mt-4">
                    {part.steps.map((step, s) => {
                      const lastInArea = s === part.steps.length - 1;
                      const lastOverall = lastInArea && p === FLOW.length - 1;
                      return (
                        <li key={step.name}>
                          <div aria-hidden="true" className="flex items-center">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border sm:h-7 sm:w-7 border-[color-mix(in_srgb,var(--journey-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--journey-accent)_10%,transparent)] font-mono text-[11px] text-[var(--journey-accent)]">
                              {String(first + s).padStart(2, "0")}
                            </span>
                            {/* 영역의 마지막 단계에서 나가는 선은 두 영역이 나란히 놓이는 넓은 화면에서만 다음 영역으로 이어진다. */}
                            {!lastOverall && <span className={`h-px flex-1 bg-[var(--j-line-strong)] ${lastInArea ? "hidden lg:block" : ""}`} />}
                          </div>
                          <div className="pr-4 sm:pr-6">
                            <p className="mt-2 text-base font-semibold text-white sm:mt-3 sm:text-lg">{step.name}</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-[var(--j-2)] sm:text-sm">{step.desc}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <div
                    className={`mt-3 flex-1 rounded-2xl border border-dashed border-[var(--j-line-strong)] bg-white/[0.02] px-3.5 py-2.5 sm:mt-5 sm:px-5 sm:py-3.5 ${p === 0 ? "lg:mr-6" : ""}`}
                  >
                    <p className="text-[11px] font-medium tracking-[0.06em] text-[var(--j-3)]">선택 과정</p>
                    <dl className="mt-1.5 space-y-1 text-[13px] leading-relaxed sm:mt-2 sm:text-sm">
                      {part.extras.map((x) => (
                        <div key={x.name} className="flex gap-2 sm:gap-3">
                          <dt className="w-14 shrink-0 font-semibold text-white sm:w-[4.25rem]">{x.name}</dt>
                          <dd className="text-[var(--j-2)]">{x.desc}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ),
    },

    // ── 04 학습 분야 ──────────────────────────────
    {
      id: "fields",
      label: "학습 분야",
      content: (
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Label>04 — Fields</Label>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-white sm:text-5xl">학습 분야</h2>
            </div>
            <Link href="/curriculum" className="text-sm text-[var(--j-2)] underline-offset-4 transition hover:text-white hover:underline">
              전체 분야 보기 →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-x-10 border-t border-[var(--j-line)] sm:mt-10 md:grid-cols-2">
            {fieldGroups.map((phase) => (
              <section key={phase.key} aria-label={`${phase.key} ${phase.name}`} className="border-b border-[var(--j-line)] py-3 sm:py-4">
                <p className="mb-1 flex items-baseline gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--j-3)]">
                  <span className="font-mono">{phase.key}</span>
                  <span className="normal-case tracking-normal">{phase.name}</span>
                </p>
                <ul>
                  {phase.ids.map((id) => {
                    const track = learningField(id);
                    const modules = modulesOfTrack(id);
                    const lessons = modules.flatMap((module) => module.lessons);
                    const done = record ? lessons.filter((lesson) => isLessonComplete(record, lesson.id)).length : 0;
                    const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
                    return (
                      <li key={id}>
                        <Link href={trackHref(id)} className="journey-week group flex items-center gap-3 py-2 sm:gap-4 sm:py-2.5">
                          <span className="w-6 shrink-0 font-mono text-xs text-[var(--j-3)] group-hover:text-[var(--journey-accent)] sm:w-7">
                            {track.code.padStart(2, "0")}
                          </span>
                          {/* 좁은 화면에서는 오른쪽 표시를 빼고 제목을 잘라내지 않고 줄바꿈한다(진행률은 제목 아래 선으로 보인다). */}
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium leading-snug text-[var(--j-1)] transition group-hover:text-white sm:truncate sm:text-base">
                              {track.title}
                            </span>
                            <span className="mt-1 block h-px w-full bg-[var(--j-line)]">
                              <span className="block h-px bg-[var(--journey-accent)] transition-all" style={{ width: `${pct}%` }} />
                            </span>
                          </span>
                          <span className="hidden w-16 shrink-0 text-right text-xs tabular-nums text-[var(--j-3)] sm:block">
                            {record && lessons.length > 0 ? `${pct}%` : `모듈 ${modules.length}개`}
                          </span>
                          <span aria-hidden="true" className="hidden text-[var(--j-4)] transition group-hover:translate-x-0.5 group-hover:text-white sm:inline">
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
        </div>
      ),
    },

    // ── 05 학습 목표 ───────────────────────────────────────────────
    {
      id: "outcomes",
      label: "학습 목표",
      content: (
        <div className="mx-auto max-w-5xl">
          <Label>05 — Outcomes</Label>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            분야별 실습으로
            <br />
            <span className="j-gradient">해 볼 수 있는 것</span>
          </h2>
          <ol className="mt-7 grid border-t border-[var(--j-line)] sm:mt-9 sm:grid-cols-2">
            {OUTCOMES.map((g, i) => (
              <li key={i} className="flex gap-4 border-b border-[var(--j-line)] py-3 sm:pr-8">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-[var(--journey-accent)]">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-[var(--j-2)] sm:text-[15px]">{g}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 grid items-center gap-4 sm:mt-10 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-6">
            <BrowseFields />
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
