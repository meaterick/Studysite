import type { Metadata } from "next";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import Markdown from "@/components/MarkdownBlocks";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import LearningCycle from "@/components/LearningCycle";

export const metadata: Metadata = { title: "커리큘럼" };

export default async function CurriculumPage() {
  await requireUser("/curriculum");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">8주 커리큘럼</p>
      <h1 className="mb-3 text-3xl font-black text-ink">{syllabus.title}</h1>
      <p className="mb-8 text-sm italic text-ink-secondary">{syllabus.designNote}</p>

      <section className="not-prose mb-10">
        <h2 className="mb-1 text-xl font-black text-ink">매주 도는 학습 순환</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          각 주차는 아래 네 단계를 차례로 거치도록 구성되어 있습니다. 주차 페이지의 탭도 이 순서를 따릅니다.
        </p>
        <LearningCycle />
      </section>

      <Markdown source={syllabus.goalsMd} />

      <h2 className="mb-4 mt-8 text-xl font-black text-ink">3. 주차별 개요</h2>
      <div className="not-prose mb-10 overflow-x-auto rounded-lg border border-[var(--border-hairline)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-card-2)]">
              {["주", "주제", "핵심 개념", "난이도", ""].map((h) => (
                <th key={h} className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">
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
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-ink-secondary">
                  {w.keywords.join(" · ")}
                </td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2">{"★".repeat(w.difficulty)}</td>
                <td className="w-[72px] border-b border-[var(--border-hairline)] px-3 py-2">
                  <Link href={`/weeks/${w.slug}`} className="inline-flex whitespace-nowrap font-bold text-[var(--series-blue)]">
                    보기 <span aria-hidden="true">→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Markdown source={syllabus.rhythmMd} />
      <Markdown source={syllabus.evaluationMd} />
      <Markdown source={syllabus.resourcesMd} />
    </div>
  );
}
