import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCEPTS, TRACKS, lessonsOfConcept, modulesOfTrack } from "@/content/course";
import type { TrackId } from "@/content/types";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { getCurrentUser } from "@/lib/dal";
import { emptyRecord, getLearningRecord } from "@/lib/learningStore";
import { isLessonComplete } from "@/lib/study";
import { gatedHref } from "@/lib/returnPath";
import { lessonHref, moduleHref } from "@/lib/routes";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/tracks/[track]">): Promise<Metadata> {
  const { track } = await params;
  const info = TRACKS.find((t) => t.id === track);
  return info ? { title: `트랙 ${info.code} · ${info.title}` } : {};
}

/** 트랙 개요: 이 트랙이 AI 시스템의 어디에 쓰이는지, 모듈과 레슨, 다루는 개념. 목록은 누구나 볼 수 있다. */
export default async function TrackPage({ params }: PageProps<"/tracks/[track]">) {
  const { track: id } = await params;
  const track = TRACKS.find((t) => t.id === id);
  if (!track) notFound();
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : emptyRecord();
  const modules = modulesOfTrack(track.id as TrackId);
  const concepts = CONCEPTS.filter((c) => c.track === track.id);
  const index = TRACKS.findIndex((t) => t.id === track.id);
  const prev = TRACKS[index - 1];
  const next = TRACKS[index + 1];
  const href = (path: string) => gatedHref(!!user, path);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader back={{ href: "/curriculum", label: "커리큘럼" }} eyebrow={`Track ${track.code}`} title={track.title} description={track.summary} />

      <section aria-labelledby="why-heading" className="mb-16 max-w-3xl">
        <h2 id="why-heading" className="section-title mb-3">
          이 트랙이 필요한 이유
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-body">{track.why}</p>
      </section>

      <section aria-labelledby="modules-heading" className="mb-16">
        <h2 id="modules-heading" className="section-title mb-4">
          모듈
        </h2>
        <ol className="space-y-8">
          {modules.map((m) => {
            const core = m.lessons.filter((l) => l.tier === "core");
            const optional = m.lessons.length - core.length;
            const done = core.filter((l) => isLessonComplete(record, l.id)).length;
            return (
              <li key={m.slug} className="border-t border-[var(--border-hairline)] pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <Link href={href(moduleHref(m.slug))} prefetch={user ? undefined : false} className="group min-w-0">
                    <span className="font-mono text-xs text-ink-muted">{m.code}</span>
                    <span className="ml-3 text-lg font-semibold tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">{m.title}</span>
                  </Link>
                  <span className="text-[13px] tabular-nums text-ink-muted">
                    {core.length > 0 ? `핵심 ${user ? `${done}/` : ""}${core.length}` : "선택 모듈"}
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
                      <Link href={href(lessonHref(m.slug, l.id))} prefetch={user ? undefined : false} className="min-w-0 truncate text-ink-secondary transition hover:text-ink">
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

      <nav aria-label="다른 트랙" className="grid grid-cols-2 gap-8 border-t border-[var(--border-hairline)] pt-8">
        {prev ? (
          <Link href={`/tracks/${prev.id}`} className="group min-w-0">
            <span className="kicker block">이전 트랙</span>
            <span className="mt-2 block truncate text-[15px] font-semibold text-ink-secondary transition group-hover:text-ink">
              {prev.code} · {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tracks/${next.id}`} className="group min-w-0 text-right">
            <span className="kicker block">다음 트랙</span>
            <span className="mt-2 block truncate text-[15px] font-semibold text-ink-secondary transition group-hover:text-ink">
              {next.code} · {next.title}
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}
