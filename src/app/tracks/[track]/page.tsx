import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCEPTS, TRACKS, lessonsOfConcept, modulesOfTrack } from "@/content/course";
import { LEARNING_FIELDS, learningField } from "@/content/fields";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { getCurrentUser } from "@/lib/dal";
import { emptyRecord, getLearningRecord } from "@/lib/learningStore";
import { isLessonComplete } from "@/lib/study";
import { gatedHref } from "@/lib/returnPath";
import { lessonHref, moduleHref, trackHref } from "@/lib/routes";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/tracks/[track]">): Promise<Metadata> {
  const { track } = await params;
  const info = TRACKS.find((t) => t.id === track);
  return info ? { title: learningField(info.id).title } : {};
}

/** 분야별 모듈과 레슨 목록. 목록은 누구나 볼 수 있다. */
export default async function TrackPage({ params }: PageProps<"/tracks/[track]">) {
  const { track: id } = await params;
  const track = TRACKS.find((t) => t.id === id);
  if (!track) notFound();
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : emptyRecord();
  const field = learningField(track.id);
  const modules = modulesOfTrack(track.id);
  const concepts = CONCEPTS.filter((c) => c.track === track.id);
  const href = (path: string) => gatedHref(!!user, path);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader back={{ href: "/curriculum", label: "커리큘럼" }} eyebrow="학습 분야" title={field.title} description={field.description} />

      {field.topics.length > 0 && (
        <ul aria-label="주요 주제" className="mb-8 flex flex-wrap gap-2">
          {field.topics.map((topic) => <li key={topic} className="pill">{topic}</li>)}
        </ul>
      )}

      <section aria-labelledby="modules-heading" className="mb-16">
        <h2 id="modules-heading" className="section-title mb-4">
          모듈
        </h2>
        <ol className="space-y-8">
          {modules.map((m) => {
            const optional = m.lessons.length - core.length;
            const done = m.lessons.filter((l) => isLessonComplete(record, l.id)).length;
            return (
              <li key={m.slug} className="border-t border-[var(--border-hairline)] pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <Link href={href(moduleHref(m.slug))} prefetch={user ? undefined : false} className="group min-w-0">
                    <span className="font-mono text-xs text-ink-muted">{m.code}</span>
                    <span className="ml-3 text-lg font-semibold tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">{m.title}</span>
                  </Link>
                  <span className="text-[13px] tabular-nums text-ink-muted">
                    {user ? `레슨 ${done}/${m.lessons.length} 완료` : `레슨 ${m.lessons.length}개`}
                    {optional > 0 && ` · 선택 ${optional}`}
                    {m.assignment && " · 과제"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink-muted">{m.summary}</p>
                <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm">
                      {isLessonComplete(record, l.id) ? (
                        <Icon name="check" size={13} className="shrink-0 text-[var(--status-good)]" />
                      ) : (
                        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.tier === "core" ? "bg-[var(--border-strong)]" : "border border-[var(--border-strong)]"}`} />
                      )}
                      <Link href={href(lessonHref(m.slug, l.id))} prefetch={user ? undefined : false} className="min-w-0 text-ink-secondary transition hover:text-ink">
                        {l.title}
                      </Link>
                      {l.tier !== "core" && <span className="shrink-0 text-xs text-ink-muted">선택</span>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      {concepts.length > 0 && (
        <section aria-labelledby="concepts-heading" className="mb-16">
          <h2 id="concepts-heading" className="section-title mb-4">
            다루는 개념
          </h2>
          <ol className="rows border-y border-[var(--border-hairline)]">
            {concepts.map((c) => {
              const lessons = lessonsOfConcept(c.id);
              return (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="w-9 shrink-0 font-mono text-xs text-ink-muted">#{c.order}</span>
                  <span className="min-w-0 flex-1 font-medium text-ink">{c.title}</span>
                  <span className="flex flex-wrap gap-x-3 text-[13px]">
                    {lessons.map((l) => (
                      <Link key={l.id} href={href(lessonHref(l.module, l.id))} prefetch={user ? undefined : false} className="text-ink-muted transition hover:text-ink">
                        {l.title}
                      </Link>
                    ))}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <nav aria-labelledby="other-fields" className="border-t border-[var(--border-hairline)] pt-8">
        <h2 id="other-fields" className="section-title mb-4">다른 학습 분야</h2>
        <ul className="flex flex-wrap gap-2">
          {LEARNING_FIELDS.filter((other) => other.id !== track.id).map((other) => (
            <li key={other.id}>
              <Link href={trackHref(other.id)} className="btn btn-secondary">{other.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
