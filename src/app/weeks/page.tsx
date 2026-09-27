import type { Metadata } from "next";
import { WEEKS } from "@/content/weeks";
import WeekCard from "@/components/WeekCard";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";

export const metadata: Metadata = { title: "주차별 자료" };

export default async function WeeksIndexPage() {
  const user = await requireUser("/weeks");
  const record = getLearningRecord(user.id);
  const statuses = new Map(WEEKS.map((w) => [w.slug, weekStatus(w, record, findUserSubmission(user.id, w.slug))]));
  const phases = Array.from(new Set(WEEKS.map((w) => w.phase)));
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">Week 1 – 8</p>
      <h1 className="mb-8 text-3xl font-black text-ink">주차별 학습자료</h1>
      {phases.map((phase) => (
        <section key={phase} className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">{phase}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEEKS.filter((w) => w.phase === phase).map((w) => (
              <WeekCard
                key={w.slug}
                week={w}
                ratio={statuses.get(w.slug)!.ratio}
                sectionsDone={statuses.get(w.slug)!.sectionsDone}
                sectionsTotal={statuses.get(w.slug)!.sectionsTotal}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
