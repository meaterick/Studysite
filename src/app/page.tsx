import Link from "next/link";
import { Suspense } from "react";
import { WEEKS } from "@/content/weeks";
import { syllabus } from "@/content/syllabus";
import WeekCard from "@/components/WeekCard";
import HomeCta from "@/components/HomeCta";
import HomeRoadmap from "@/components/HomeRoadmap";

const SECTIONS = [
  { id: "roadmap", label: "8주 로드맵" },
  { id: "weeks", label: "주차별 학습자료" },
  { id: "outcomes", label: "수료 후 할 수 있는 것" },
];

const OUTCOMES = [
  "AI/ML/DL/LLM의 수학적·구조적 원리를 백지에 그려가며 설명할 수 있다.",
  "선형회귀·MLP·CNN·Self-Attention을 라이브러리 없이 직접 구현할 수 있다.",
  "LLM이 어떻게 학습되고(사전학습→SFT→정렬) 왜 환각을 일으키는지 설명할 수 있다.",
  "프롬프트·RAG·에이전트로 실제 문제를 해결하고, 평가셋으로 성능을 측정할 수 있다.",
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

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="mb-12">
        <p className="mb-2 text-sm font-bold text-ink-muted">Aegis 동아리 · 8주 AI 스터디</p>
        <h1 className="text-4xl font-black leading-tight text-[var(--series-blue)] sm:text-6xl">
          AI 기초부터 활용까지
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-ink sm:text-xl">
          수학부터 LLM 에이전트까지, 8주 동안 직접 만들며 배우는 스터디입니다.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-14 w-full rounded-xl bg-[var(--surface-card-2)] sm:max-w-md" />}>
            <HomeCta />
          </Suspense>
        </div>

        <nav aria-label="이 페이지의 내용" className="mt-10">
          <p className="mb-2 text-xs font-bold text-ink-muted">이 페이지에서 볼 수 있는 내용</p>
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
        <SectionHeading id="roadmap" title="8주 로드맵" />
        <p className="-mt-3 mb-5 text-sm text-ink-secondary">
          4단계로 나눠, 단계가 올라갈수록 난이도와 스스로 해보는 비중이 함께 높아집니다.
        </p>
        <HomeRoadmap />
      </section>

      <section className="mb-14">
        <SectionHeading id="weeks" title="주차별 학습자료">
          <Link href="/weeks" className="shrink-0 text-sm font-bold text-[var(--series-blue)]">
            전체 보기 →
          </Link>
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WEEKS.slice(0, 4).map((w) => (
            <WeekCard key={w.slug} week={w} />
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
        ※ {syllabus.designNote}
      </p>
    </div>
  );
}
