import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { syllabus } from "@/content/syllabus";
import WeekCard from "@/components/WeekCard";
import { PhaseRoadmap } from "@/components/diagrams/shared";
import { getCurrentUser } from "@/lib/dal";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="mb-16">
        <p className="mb-3 text-sm font-bold text-[var(--series-blue)]">Aegis 동아리 · AI 기초부터 활용까지</p>
        <h1 className="max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">
          수학부터 LLM 에이전트까지,
          <br />
          8주 만에 <span className="text-[var(--series-blue)]">직접 만들며</span> 배웁니다.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary sm:text-lg">
          {syllabus.designNote}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/curriculum"
            className="rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "var(--series-blue)" }}
          >
            전체 커리큘럼 보기
          </Link>
          <Link
            href="/weeks/week-1"
            className="rounded-lg border border-[var(--border-hairline)] px-5 py-3 text-sm font-bold text-ink transition hover:bg-[var(--surface-card-2)]"
          >
            Week 1부터 시작하기
          </Link>
          {!user && (
            <Link
              href="/signup"
              className="rounded-lg border border-dashed border-[var(--series-blue)] px-5 py-3 text-sm font-bold text-[var(--series-blue)] transition hover:bg-[var(--surface-card-2)]"
            >
              스터디원으로 가입하기
            </Link>
          )}
        </div>
      </section>

      <section className="mb-16">
        <PhaseRoadmap />
      </section>

      <section className="mb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-black text-ink">수료 시 할 수 있는 것</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "AI/ML/DL/LLM의 수학적·구조적 원리를 백지에 그려가며 설명할 수 있다.",
            "선형회귀·MLP·CNN·Self-Attention을 라이브러리 없이 직접 구현할 수 있다.",
            "LLM이 어떻게 학습되고(사전학습→SFT→정렬) 왜 환각을 일으키는지 설명할 수 있다.",
            "프롬프트·RAG·에이전트로 실제 문제를 해결하고, 평가셋으로 성능을 측정할 수 있다.",
          ].map((g, i) => (
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

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-black text-ink">주차별 학습자료</h2>
          <Link href="/weeks" className="text-sm font-bold text-[var(--series-blue)]">
            전체 보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WEEKS.slice(0, 4).map((w) => (
            <WeekCard key={w.slug} week={w} />
          ))}
        </div>
      </section>
    </div>
  );
}
