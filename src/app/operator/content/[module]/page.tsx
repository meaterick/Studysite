import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/dal";
import { MODULES, getModule, getConcept } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { lessonLabel, TIER_INFO } from "@/content/tiers";
import { descriptiveCountsByLesson, lessonCompletionCounts } from "@/lib/learningStore";
import { checkStatMap } from "@/lib/operatorStats";
import { assignmentHref, lessonHref, recallHref } from "@/lib/routes";
import { BlocksRenderer, Inline, RichText } from "@/components/MarkdownBlocks";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

export const metadata = { title: "모듈 정답·통계" };

const choiceLetter = (i: number) => String.fromCharCode(65 + i);
const percent = (x: number) => `${Math.round(x * 100)}%`;

/** 한 모듈의 정답·해설·모범답안과 문항별 통계(운영자 전용). 세션 준비와 문항 점검에 쓴다. */
export default async function OperatorModuleContentPage({ params }: PageProps<"/operator/content/[module]">) {
  await requireAdmin("/operator/content");
  const { module: slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();
  const stats = checkStatMap();
  const completions = lessonCompletionCounts();
  const answers = descriptiveCountsByLesson();
  const index = MODULES.indexOf(mod);
  const prev = MODULES[index - 1];
  const next = MODULES[index + 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/operator/content", label: "콘텐츠" }}
        eyebrow={`${mod.code} · 트랙 ${mod.trackInfo.code} ${mod.trackInfo.title}`}
        title={mod.title}
        description={mod.summary}
      />

      <nav aria-label="레슨" className="mb-12 flex flex-wrap gap-1">
        {mod.lessons.map((l) => {
          const low = l.checks.filter((c) => stats.get(`${l.id}/${c.key}`)?.low).length;
          return (
            <a key={l.id} href={`#lesson-${l.id}`} className="chip border border-[var(--border-hairline)]">
              {lessonLabel(l)}
              {low > 0 && <span className="tabular-nums text-[var(--status-critical)]">점검 {low}</span>}
            </a>
          );
        })}
        {mod.recall.length > 0 && (
          <a href="#recall" className="chip border border-[var(--border-hairline)]">
            백지 복습
          </a>
        )}
        {mod.assignment && (
          <a href="#assignment" className="chip border border-[var(--border-hairline)]">
            과제
          </a>
        )}
      </nav>

      <div className="space-y-16">
        {mod.lessons.map((lesson) => {
          const desc = answers.get(lesson.id);
          return (
            <section key={lesson.id} id={`lesson-${lesson.id}`} aria-labelledby={`lesson-${lesson.id}-heading`} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--border-hairline)] pb-3">
                <h2 id={`lesson-${lesson.id}-heading`} className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-ink">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIER_INFO[lesson.tier].color }} />
                  {lessonLabel(lesson)} · {lesson.title}
                </h2>
                <Link href={lessonHref(mod.slug, lesson.id)} className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition hover:text-ink">
                  레슨 열기
                  <Icon name="arrowRight" size={12} />
                </Link>
              </div>
              <p className="mt-2 text-xs tabular-nums text-ink-muted">
                {[
                  `예상 ${lesson.minutes}분`,
                  `완료 ${completions.get(lesson.id) ?? 0}명`,
                  (lesson.concepts ?? []).length > 0 && `개념 ${(lesson.concepts ?? []).map((c) => `#${getConcept(c)?.order ?? "?"}`).join(" ")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <Group title="확인 문제" count={lesson.checks.length}>
                <ol className="space-y-5">
                  {lesson.checks.map((check, i) => {
                    const s = stats.get(`${lesson.id}/${check.key}`);
                    return (
                      <li key={check.key} className="text-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="min-w-0 flex-1 font-medium text-ink">
                            <span className="mr-1.5 tabular-nums text-ink-muted">{i + 1}.</span>
                            <RichText text={check.question} />
                          </p>
                          <span className={`shrink-0 text-xs tabular-nums ${s?.low ? "font-medium text-[var(--status-critical)]" : "text-ink-muted"}`}>
                            {s ? `응답 ${s.answered}명 · 첫 시도 정답 ${percent(s.rate)}${s.low ? " · 점검" : ""}` : "응답 없음"}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-0.5 text-[13px]">
                          {check.choices.map((c, ci) => (
                            <li key={ci} className={ci === check.answer ? "font-medium text-[var(--status-good)]" : "text-ink-secondary"}>
                              {choiceLetter(ci)}. <Inline text={c} />
                              {ci === check.answer && " (정답)"}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                          <RichText text={check.explanation} />
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </Group>

              {(lesson.descriptive?.length ?? 0) > 0 && (
                <Group
                  title="서술형"
                  count={lesson.descriptive!.length}
                  note={desc ? `답안 ${desc.total}개 · 보완 필요 ${desc.weak}` : "답안 없음"}
                  action={
                    <Link href={`/operator/members/answers?module=${mod.slug}`} className="text-xs font-medium text-ink-muted transition hover:text-ink">
                      답안 모아 보기
                    </Link>
                  }
                >
                  <ol className="space-y-5">
                    {lesson.descriptive!.map((d, i) => (
                      <li key={d.key} className="text-sm">
                        <p className="font-medium text-ink">
                          <span className="mr-1.5 tabular-nums text-ink-muted">{i + 1}.</span>
                          <RichText text={d.question} />
                        </p>
                        <div className="callout callout-good mt-2 text-[13px] text-ink-body">
                          <BlocksRenderer blocks={parseMarkdown(d.answer)} />
                          {d.keyPoints.length > 0 && (
                            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
                              {d.keyPoints.map((p, pi) => (
                                <li key={pi}>
                                  <Inline text={p} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Group>
              )}

              {(lesson.predicts?.length ?? 0) > 0 && (
                <Group title="출력 예측" count={lesson.predicts!.length}>
                  <ol className="space-y-5">
                    {lesson.predicts!.map((p, i) => (
                      <li key={p.key} className="text-sm">
                        {p.question && (
                          <p className="font-medium text-ink">
                            <span className="mr-1.5 tabular-nums text-ink-muted">{i + 1}.</span>
                            <RichText text={p.question} />
                          </p>
                        )}
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-xs leading-relaxed text-ink">{p.code}</pre>
                        <p className="mt-2 text-xs text-ink-muted">정답 출력</p>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-xs text-[var(--status-good)]">{p.expected}</pre>
                        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                          <RichText text={p.explanation} />
                        </p>
                      </li>
                    ))}
                  </ol>
                </Group>
              )}

              {(lesson.exercises?.length ?? 0) > 0 && (
                <Group title="코딩 실습" count={lesson.exercises!.length}>
                  <ul className="space-y-3">
                    {lesson.exercises!.map((ex) => (
                      <li key={ex.key}>
                        <details className="group rounded-xl border border-[var(--border-hairline)] px-4 py-3">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                            <span>
                              {ex.title}
                              <span className="ml-2 text-xs font-normal text-ink-muted">
                                채점 {ex.tests.length}항목 · 힌트 {ex.hints.length}개
                              </span>
                            </span>
                            <Icon name="chevronDown" size={14} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                          </summary>
                          <p className="mt-3 text-xs font-medium text-ink-muted">정답 코드</p>
                          <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-xs leading-relaxed text-ink">{ex.solution}</pre>
                        </details>
                      </li>
                    ))}
                  </ul>
                </Group>
              )}
            </section>
          );
        })}

        {mod.recall.length > 0 && (
          <section id="recall" aria-labelledby="recall-heading" className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
              <h2 id="recall-heading" className="text-lg font-semibold tracking-[-0.02em] text-ink">
                백지 복습
              </h2>
              <Link href={recallHref(mod.slug)} className="text-xs font-medium text-ink-muted transition hover:text-ink">
                화면 열기
              </Link>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
              {mod.recall.map((r, i) => (
                <li key={i}>
                  <Inline text={r.prompt} />
                  {r.hint && (
                    <span className="block text-xs text-ink-muted">
                      <Inline text={r.hint} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {mod.assignment && (
          <section id="assignment" aria-labelledby="assignment-heading" className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
              <h2 id="assignment-heading" className="text-lg font-semibold tracking-[-0.02em] text-ink">
                과제 · {mod.assignment.title}
              </h2>
              <span className="flex gap-3 text-xs font-medium text-ink-muted">
                <Link href={`/operator/submissions?assignment=${mod.assignment.key}`} className="transition hover:text-ink">
                  제출물
                </Link>
                <Link href={assignmentHref(mod.slug)} className="transition hover:text-ink">
                  화면 열기
                </Link>
              </span>
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th>채점 기준</th>
                    <th>배점</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.assignment.rubric.map((c) => (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap font-medium text-ink">{c.label}</td>
                      <td className="tabular-nums text-ink-secondary">{c.points}</td>
                      <td className="min-w-[16rem] text-ink-secondary">
                        <Inline text={c.guide} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mod.assignment.gradingNotes && (
              <div className="mt-4 rounded-2xl bg-[var(--surface-card-2)] p-5 text-sm leading-relaxed text-ink-secondary">
                <p className="mb-2 text-xs font-medium text-ink-muted">채점 참고</p>
                <BlocksRenderer blocks={parseMarkdown(mod.assignment.gradingNotes)} />
              </div>
            )}
          </section>
        )}
      </div>

      <nav aria-label="다른 모듈" className="mt-16 grid grid-cols-2 gap-8 border-t border-[var(--border-hairline)] pt-8">
        {prev ? (
          <Link href={`/operator/content/${prev.slug}`} className="group min-w-0">
            <span className="kicker block">이전 모듈</span>
            <span className="mt-2 block truncate text-[15px] font-semibold text-ink-secondary transition group-hover:text-ink">
              {prev.code} · {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/operator/content/${next.slug}`} className="group min-w-0 text-right">
            <span className="kicker block">다음 모듈</span>
            <span className="mt-2 block truncate text-[15px] font-semibold text-ink-secondary transition group-hover:text-ink">
              {next.code} · {next.title}
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}

function Group({ title, count, note, action, children }: { title: string; count: number; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-semibold text-ink">
          {title}
          <span className="ml-2 text-xs font-normal tabular-nums text-ink-muted">
            {count}문항{note ? ` · ${note}` : ""}
          </span>
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
