import type { Metadata } from "next";
import { WEEKS } from "@/content/weeks";
import WeekCard from "@/components/WeekCard";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "주차별 자료" };

export default async function WeeksIndexPage() {
  await requireUser("/weeks");
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
              <WeekCard key={w.slug} week={w} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
