import type { Metadata } from "next";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import Markdown from "@/components/MarkdownBlocks";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { gatedHref } from "@/lib/returnPath";
import LearningCycle from "@/components/LearningCycle";
import DifficultyBadge from "@/components/DifficultyBadge";

export const metadata: Metadata = { title: "커리큘럼" };

export default async function CurriculumPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">8주 커리큘럼</p>
      <h1 className="mb-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{syllabus.title}</h1>
      <p className="mb-8 text-sm text-ink-secondary">{syllabus.designNote}</p>

      <section className="not-prose mb-10">
        <h2 className="mb-1 text-xl font-black text-ink">주간 학습 순환</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          매주 아래 네 과정을 차례로 거칩니다. 주차 페이지의 탭도 이 순서로 구성되어 있습니다.
        </p>
        <LearningCycle />
      </section>

      <Markdown source={syllabus.goalsMd} />

      <h2 className="mb-4 mt-8 text-xl font-black text-ink">3. 주차별 개요</h2>
      <div className="not-prose mb-10 overflow-x-auto rounded-lg border border-[var(--border-hairline)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-card-2)]">
              {["주차", "주제", "핵심 개념", "난이도", ""].map((h) => (
                <th
                  key={h}
                  className={`border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink ${h === "핵심 개념" ? "hidden sm:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKS.map((w) => (
              <tr key={w.slug} className="even:bg-[var(--surface-card-2)]/40">
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 font-bold">{w.number}</td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2">{w.title}</td>
                <td className="hidden border-b border-[var(--border-hairline)] px-3 py-2 text-ink-secondary sm:table-cell">
                  {w.keywords.join(" · ")}
                </td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2">
                  <DifficultyBadge level={w.difficulty} compact />
                </td>
                <td className="w-[72px] border-b border-[var(--border-hairline)] px-3 py-2">
                  <Link
                    href={gatedHref(!!user, `/weeks/${w.slug}`)}
                    prefetch={user ? undefined : false}
                    title={user ? undefined : "로그인 후 볼 수 있습니다"}
                    className="inline-flex whitespace-nowrap font-bold text-[var(--series-blue)]"
                  >
                    보기 <span aria-hidden="true">→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="-mt-7 mb-10 text-xs text-ink-muted">
        난이도: <strong>쉬움</strong> 고등학교 수학과 Python 기초로 따라갈 수 있음 · <strong>보통</strong> 수식 유도와 구현을 직접 따라가야 함 ·{" "}
        <strong>어려움</strong> 추상적인 개념과 스스로 실험·조사할 부분이 많음
      </p>

      <Markdown source={syllabus.rhythmMd} />
      <Markdown source={syllabus.evaluationMd} />
      <Markdown source={syllabus.resourcesMd} />
    </div>
  );
}
