import type { Metadata } from "next";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import Markdown from "@/components/MarkdownBlocks";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { gatedHref } from "@/lib/returnPath";
import LearningCycle from "@/components/LearningCycle";
import DifficultyBadge from "@/components/DifficultyBadge";
import ProgressRing from "@/components/ProgressRing";
import { getLearningRecord } from "@/lib/learningStore";
import { weekStatus } from "@/lib/study";

export const metadata: Metadata = { title: "커리큘럼" };

const TOC = [
  { id: "flow", label: "한 주 흐름" },
  { id: "weeks", label: "주차별 개요" },
  { id: "goals", label: "목표" },
  { id: "rhythm", label: "주간 리듬" },
  { id: "evaluation", label: "평가" },
  { id: "prep", label: "준비물" },
  { id: "resources", label: "참고자료" },
];

export default async function CurriculumPage() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : undefined;
  const ratioOf = (slug: string) => {
    const week = WEEKS.find((w) => w.slug === slug)!;
    return record ? weekStatus(week, record).ratio : 0;
  };
  const phases = [...new Set(WEEKS.map((w) => w.phase))];
  const prepIndex = syllabus.resourcesMd.indexOf("## 사전 준비물");
  const resourcesMd = prepIndex >= 0 ? syllabus.resourcesMd.slice(0, prepIndex) : syllabus.resourcesMd;
  const prepMd = prepIndex >= 0 ? syllabus.resourcesMd.slice(prepIndex) : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* ── 머리말 ─────────────────────────────────────────── */}
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">8주 커리큘럼</p>
      <h1 className="mb-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{syllabus.title}</h1>
      <p className="max-w-3xl text-sm text-ink-secondary">{syllabus.designNote}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "기간", v: "8주" },
          { k: "구성", v: `${phases.length}부 · ${WEEKS.length}주차` },
          { k: "한 주", v: "학습 자료 → 적용과 복습" },
          { k: "수료", v: "70점 이상 + 캡스톤" },
        ].map((f) => (
          <div key={f.k} className="rounded-xl border border-[var(--border-hairline)] bg-card px-4 py-3">
            <dt className="text-xs font-bold text-ink-muted">{f.k}</dt>
            <dd className="mt-0.5 text-sm font-black text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>

      {/* ── 바로 가기 ──────────────────────────────────────── */}
      <nav
        aria-label="커리큘럼 목차"
        className="sticky top-[57px] z-30 -mx-4 mt-8 border-b border-[var(--border-hairline)] bg-page/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-3"
      >
        <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {TOC.map((t) => (
            <li key={t.id} className="shrink-0">
              <a
                href={`#${t.id}`}
                className="block rounded-full px-3 py-1.5 text-xs font-bold text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-[var(--series-blue)]"
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── 한 주 흐름 ─────────────────────────────────────── */}
      <section id="flow" aria-labelledby="flow-heading" className="mt-10 scroll-mt-32">
        <h2 id="flow-heading" className="mb-4 text-xl font-black text-ink">
          한 주 흐름
        </h2>
        <LearningCycle />
      </section>

      {/* ── 주차별 개요 ────────────────────────────────────── */}
      <section id="weeks" aria-labelledby="weeks-heading" className="mt-12 scroll-mt-32">
        <h2 id="weeks-heading" className="mb-4 text-xl font-black text-ink">
          주차별 개요
        </h2>
        <div className="space-y-6">
          {phases.map((phase) => (
            <div key={phase}>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-muted">{phase}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {WEEKS.filter((w) => w.phase === phase).map((w) => (
                  <li key={w.slug}>
                    <Link
                      href={gatedHref(!!user, `/weeks/${w.slug}`)}
                      prefetch={user ? undefined : false}
                      className="group flex h-full gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)] hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
                          {w.number}주차 <DifficultyBadge level={w.difficulty} compact />
                        </p>
                        <p className="mt-1 font-black leading-snug text-ink group-hover:text-[var(--series-blue)]">{w.title}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{w.keywords.join(" · ")}</p>
                      </div>
                      {user ? (
                        <ProgressRing ratio={ratioOf(w.slug)} size={44} />
                      ) : (
                        <span className="shrink-0 self-center text-sm font-bold text-[var(--series-blue)]">→</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 목표 · 구조 · 리듬 · 평가 · 준비물 ──────────────────── */}
      <div className="mt-12 [&_h2]:scroll-mt-32">
        <Markdown source={syllabus.goalsMd} />
        <Markdown source={syllabus.rhythmMd} />
        <Markdown source={syllabus.evaluationMd} />
        {prepMd && <Markdown source={prepMd} />}
      </div>

      {/* ── 참고자료(펼쳐 보기) ─────────────────────────────── */}
      <details id="resources" className="group mt-10 scroll-mt-32 rounded-xl border border-[var(--border-hairline)] bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="text-lg font-black text-ink">핵심 참고자료</span>
          <span aria-hidden="true" className="text-xs text-ink-muted transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-[var(--border-hairline)] p-4 sm:p-5 [&_h2:first-child]:hidden">
          <Markdown source={resourcesMd} />
        </div>
      </details>
    </div>
  );
}
