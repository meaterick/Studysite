import Link from "next/link";
import { Suspense } from "react";
import { WEEKS } from "@/content/weeks";
import WeekCard from "@/components/WeekCard";
import HomeCta from "@/components/HomeCta";
import HomeRoadmap from "@/components/HomeRoadmap";
import LearningCycle from "@/components/LearningCycle";
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

function SectionHeading({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <h2 id={id} className="scroll-mt-24 text-2xl font-black text-ink">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : { sections: {}, worksheets: {} };
  const statusOf = (slug: string) => {
    const week = WEEKS.find((w) => w.slug === slug)!;
    return weekStatus(week, record, user ? findUserSubmission(user.id, slug) : undefined);
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="mb-12">
        <p className="mb-2 text-sm font-bold text-ink-muted">Aegis 동아리 AI 스터디</p>
        <h1 className="text-4xl font-black leading-tight text-[var(--series-blue)] sm:text-6xl">
          AI 기초부터 활용까지
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-ink sm:text-xl">
          수학 기초부터 LLM 에이전트까지, 8주 동안 직접 코드를 작성하며 배웁니다.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-14 w-full rounded-xl bg-[var(--surface-card-2)] sm:max-w-md" />}>
            <HomeCta />
          </Suspense>
        </div>

        <nav aria-label="바로 가기" className="mt-10">
          <p className="mb-2 text-xs font-bold text-ink-muted">바로 가기</p>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-[var(--border-hairline)] bg-card px-4 py-2 text-sm font-medium text-ink-secondary transition hover:border-[var(--series-blue)] hover:text-[var(--series-blue)]"
              >
                {s.label} ↓
              </a>
            ))}
          </div>
        </nav>
      </section>

      <section className="mb-14">
        <SectionHeading id="cycle" title="학습 방법" />
        <p className="-mt-3 mb-5 text-sm text-ink-secondary">
          매주 <strong className="text-ink">이해, 구현, 설명, 활용</strong> 순서로 진행합니다. 각 주차는 여러 단계로 나뉘며, 단계마다 학습 → 실습 → 확인 문제를 마쳐야 다음 단계가 열립니다.
        </p>
        <LearningCycle />
      </section>

      <section className="mb-14">
        <SectionHeading id="roadmap" title="8주 로드맵" />
        <p className="-mt-3 mb-5 text-sm text-ink-secondary">
          8주 과정은 네 부분으로 구성됩니다. 뒤로 갈수록 난도가 높아지고, 스스로 해결해야 하는 부분도 늘어납니다.
        </p>
        <HomeRoadmap />
      </section>

      <section className="mb-14">
        <SectionHeading id="weeks" title="주차별 자료">
          <Link href="/weeks" className="shrink-0 text-sm font-bold text-[var(--series-blue)]">
            전체 보기 →
          </Link>
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WEEKS.slice(0, 4).map((w) => (
            <WeekCard
              key={w.slug}
              week={w}
              ratio={statusOf(w.slug).ratio}
              sectionsDone={statusOf(w.slug).sectionsDone}
              sectionsTotal={statusOf(w.slug).sectionsTotal}
            />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionHeading id="outcomes" title="수료 후 할 수 있는 것" />
        <div className="grid gap-3 sm:grid-cols-2">
          {OUTCOMES.map((g, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--series-blue)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-ink-secondary">{g}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="border-t border-[var(--border-hairline)] pt-4 text-xs leading-relaxed text-ink-muted">
        ※ 이 커리큘럼은 Stanford CS229·CS231n·CS224n·CS336, MIT 6.S191, Berkeley CS188, CMU 10-601의 강의 구성을 참고해 설계했습니다.
      </p>
    </div>
  );
}
