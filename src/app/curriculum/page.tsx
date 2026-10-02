import type { Metadata } from "next";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import Markdown from "@/components/MarkdownBlocks";
import Link from "next/link";

export const metadata: Metadata = { title: "커리큘럼" };

// 커리큘럼은 과정 전체(목표·구조·참고자료)만 보여 준다. 주차별 내용은 주차별 자료에서 본다.
export default function CurriculumPage() {
  const phases = [...new Set(WEEKS.map((w) => w.phase))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* ── 머리말 ─────────────────────────────────────────── */}
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">8주 커리큘럼</p>
      <h1 className="mb-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{syllabus.title}</h1>
      <p className="max-w-3xl text-sm text-ink-secondary">{syllabus.designNote}</p>
      <div className="mt-6 flex flex-wrap items-stretch gap-3">
        <dl className="grid flex-1 grid-cols-2 gap-3">
          {[
            { k: "기간", v: "8주" },
            { k: "구성", v: `${phases.length}부 · ${WEEKS.length}주차` },
          ].map((f) => (
            <div key={f.k} className="rounded-xl border border-[var(--border-hairline)] bg-card px-4 py-3">
              <dt className="text-xs font-bold text-ink-muted">{f.k}</dt>
              <dd className="mt-0.5 text-sm font-black text-ink">{f.v}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/weeks"
          className="grid w-full place-items-center rounded-xl bg-[var(--series-blue)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 sm:w-auto"
        >
          주차별 자료 →
        </Link>
      </div>

      {/* ── 목표 · 구조 ────────────────────────────────────── */}
      <div className="mt-10">
        <Markdown source={syllabus.goalsMd} />
      </div>

      {/* ── 참고자료(펼쳐 보기) ─────────────────────────────── */}
      <details id="resources" className="group mt-10 scroll-mt-24 rounded-xl border border-[var(--border-hairline)] bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="text-lg font-black text-ink">핵심 참고자료</span>
          <span aria-hidden="true" className="text-xs text-ink-muted transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-[var(--border-hairline)] p-4 sm:p-5 [&_h2:first-child]:hidden">
          <Markdown source={syllabus.resourcesMd} />
        </div>
      </details>
    </div>
  );
}
