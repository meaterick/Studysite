import Link from "next/link";
import { MODULES, conceptsOf } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { TIER_INFO } from "@/content/tiers";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import NextStep from "@/components/NextStep";
import StepMarker, { type StepState } from "@/components/StepMarker";
import Icon from "@/components/Icon";
import { loadModulePage } from "@/lib/modulePage";
import { tierRecord, type TierRecord } from "@/lib/achievement";
import { ASSIGNMENT_STATUS_LABEL, moduleContinueHref, type ModuleStatus } from "@/lib/study";
import { assignmentHref, diagnosticHref, lessonHref, moduleHref, recallHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

type Row = ModuleStatus["lessons"][number];

const ACCESS_STATE: Record<Row["access"], StepState> = { completed: "done", current: "current", upcoming: "todo", locked: "locked" };
const ACCESS_LABEL: Record<Row["access"], string> = { completed: "완료", current: "진행할 차례", upcoming: "미완료", locked: "잠김" };

function SectionHead({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {meta && <p className="text-[13px] tabular-nums text-ink-muted">{meta}</p>}
    </div>
  );
}

const hours = (min: number) => Math.round((min / 60) * 10) / 10;

export default async function ModuleOverviewPage({ params, searchParams }: PageProps<"/modules/[module]">) {
  const { module: slug } = await params;
  const { finished, locked } = (await searchParams) as { finished?: string; locked?: string };
  const { module, record, status, isAdmin } = await loadModulePage(slug, moduleHref(slug));
  const coreRows = status.lessons.filter((r) => r.lesson.tier === "core");
  const optionalTiers = (["supplement", "advanced"] as const).filter((t) => status.lessons.some((r) => r.lesson.tier === t));
  const records = Object.fromEntries(optionalTiers.map((t) => [t, tierRecord(status, record, t)])) as Record<"supplement" | "advanced", TierRecord>;
  const minutesOf = (rows: Row[]) => rows.reduce((sum, r) => sum + r.lesson.minutes, 0);

  const next = (() => {
    if (status.currentLesson) {
      const first = status.tiers.core.done === 0;
      return { title: status.currentLesson.title, cta: first ? "첫 레슨 시작하기" : "이어서 학습하기", detail: `핵심 레슨 ${status.tiers.core.total - status.tiers.core.done}개 남음`, href: lessonHref(slug, status.currentLesson.id) };
    }
    if (module.recall.length > 0 && !status.recallSubmitted) return { title: "백지 복습", cta: "작성하기", detail: "자료를 보지 않고 이 모듈의 핵심 내용을 적어 봅니다.", href: recallHref(slug) };
    if (status.assignment && status.assignment.status === "none") return { title: module.assignment!.title, cta: "과제 하기", detail: "핵심 레슨과 백지 복습을 마쳤습니다.", href: assignmentHref(slug) };
    return undefined;
  })();

  return (
    <ModuleFrame status={status}>
      <div className="space-y-16">
        {finished && status.coreDone && (
          <p role="status" className="callout callout-good flex items-center gap-2.5 font-medium text-ink">
            <Icon name="check" size={16} className="text-[var(--status-good)]" />
            이 모듈의 핵심 레슨을 모두 마쳤습니다.
          </p>
        )}
        {locked && <p className="callout callout-warn">{locked === "finale" ? "백지 복습과 과제는 핵심 레슨을 모두 마치면 열립니다." : "앞의 핵심 레슨을 먼저 마쳐 주십시오."}</p>}

        {next && <NextStep title={next.title} detail={next.detail} href={next.href} cta={next.cta} />}

        <section aria-labelledby="anchor-heading">
          <SectionHead id="anchor-heading" title="이 모듈에서 다룰 문제" />
          <div className="border-t border-[var(--border-hairline)] pt-6">
            <BlocksRenderer blocks={parseMarkdown(module.anchor)} docKey={`${slug}:anchor`} />
          </div>
        </section>

        {coreRows.length > 0 && (
          <section id="lessons" aria-labelledby="core-heading" className="scroll-mt-24">
            <SectionHead id="core-heading" title="핵심 레슨" meta={`${status.tiers.core.done}/${status.tiers.core.total} · 약 ${hours(minutesOf(coreRows))}시간`} />
            <ol className="rows border-t border-[var(--border-hairline)]">
              {coreRows.map((row) => (
                <LessonRow key={row.lesson.id} slug={slug} row={row} isAdmin={isAdmin} />
              ))}
            </ol>
            {status.tiers.core.done < status.tiers.core.total && (
              <p className="mt-4 text-[13px] text-ink-muted">
                이미 아는 내용이면{" "}
                <Link href={diagnosticHref(slug)} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
                  진단 평가
                </Link>
                에서 확인 문제를 한 번에 풀 수 있습니다. 확인 문제를 모두 맞힌 레슨은 완료로 인정합니다.
              </p>
            )}
          </section>
        )}

        {module.objectives.length > 0 && (
          <section aria-labelledby="goals-heading">
            <SectionHead id="goals-heading" title="학습 목표" />
            <ol className="grid gap-x-10 gap-y-5 border-t border-[var(--border-hairline)] pt-6 sm:grid-cols-2">
              {module.objectives.map((g, i) => (
                <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-ink-body">
                  <span aria-hidden="true" className="w-5 shrink-0 pt-1 font-mono text-xs text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <Inline text={g} />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(module.recall.length > 0 || module.assignment) && (
          <section aria-labelledby="finale-heading">
            <SectionHead id="finale-heading" title="복습과 과제" />
            <div className="rows border-y border-[var(--border-hairline)]">
              {module.recall.length > 0 && (
                <FinaleRow
                  href={recallHref(slug)}
                  title="백지 복습"
                  detail={`자료를 보지 않고 ${module.recall.length}개 문항에 답한 뒤 학습 자료와 비교합니다.`}
                  state={status.recallSubmitted ? "제출 완료" : "미작성"}
                  done={status.recallSubmitted}
                  locked={!status.finaleOpen && !isAdmin}
                />
              )}
              {module.assignment && status.assignment && (
                <FinaleRow
                  href={assignmentHref(slug)}
                  title={module.assignment.title}
                  detail={`${module.assignment.kind === "track" ? "분야 프로젝트" : module.assignment.kind === "capstone" ? "캡스톤" : "모듈 과제"} · 만점 ${module.assignment.maxScore}점`}
                  state={status.assignment.status === "graded" ? `채점 완료 · ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점` : ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
                  done={status.assignment.status === "graded"}
                  locked={!status.finaleOpen && !isAdmin}
                />
              )}
            </div>
          </section>
        )}

        {optionalTiers.length > 0 && (
          <section aria-labelledby="optional-heading" id="optional" className="scroll-mt-24">
            <SectionHead id="optional-heading" title={module.track === "extension" ? "레슨" : "선택 레슨"} />
            <div className="rows border-y border-[var(--border-hairline)]">
              {optionalTiers.map((tier) => {
                const rows = status.lessons.filter((r) => r.lesson.tier === tier);
                const count = status.tiers[tier];
                const rec = records[tier];
                return (
                  <details key={tier} className="group" open={module.track === "extension" || (count.done > 0 && count.done < count.total)}>
                    <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center gap-4 rounded-xl px-3 py-4 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center">
                        <span className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[tier].color }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[15px] font-medium text-ink">{TIER_INFO[tier].course}</span>
                        {rec.complete && tier === "advanced" && <span className="pill ml-2 [--pill:var(--tier-advanced)]">심화 달성</span>}
                        <span className="mt-0.5 block text-xs text-ink-muted">{TIER_INFO[tier].summary}</span>
                      </span>
                      <span className="text-[13px] tabular-nums text-ink-muted">
                        {count.done}/{count.total} · 약 {hours(minutesOf(rows))}시간
                      </span>
                      <Icon name="chevronDown" size={16} className="text-ink-muted transition group-open:rotate-180" />
                    </summary>
                    <div className="pb-4 pl-6 sm:pl-11">
                      <ol className="rows">
                        {rows.map((row) => (
                          <LessonRow key={row.lesson.id} slug={slug} row={row} isAdmin={isAdmin} />
                        ))}
                      </ol>
                      {rec.total > 0 && <RecordLine record={rec} />}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}

        {module.references && module.references.length > 0 && (
          <section aria-labelledby="refs-heading">
            <SectionHead id="refs-heading" title="함께 보면 좋은 자료" />
            <ul className="rows border-y border-[var(--border-hairline)]">
              {module.references.map((ref) => (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="group row-hover -mx-3 flex items-start gap-3 rounded-xl px-3 py-3.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-ink group-hover:underline group-hover:underline-offset-4">{ref.title}</span>
                      <span className="sr-only"> (새 창에서 열림)</span>
                      {ref.note && <span className="mt-0.5 block text-ink-muted">{ref.note}</span>}
                    </span>
                    <Icon name="arrowUpRight" size={16} className="mt-0.5 shrink-0 text-ink-muted transition group-hover:text-ink" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!next && status.coreDone && (
          <p className="text-sm text-ink-muted">
            이 모듈의 핵심 활동을 마쳤습니다. <Link href={moduleContinueHref(status)} className="font-medium text-ink underline underline-offset-4">모듈 개요</Link>에서 선택 레슨을 이어 볼 수 있습니다.
          </p>
        )}
      </div>
    </ModuleFrame>
  );
}

function LessonRow({ slug, row, isAdmin }: { slug: string; row: Row; isAdmin: boolean }) {
  const { lesson, access, progress } = row;
  const openable = access !== "locked" || isAdmin;
  const concepts = conceptsOf(lesson);
  const body = (
    <>
      <StepMarker state={ACCESS_STATE[access]} label={lesson.number} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-medium leading-snug ${access === "locked" ? "text-ink-muted" : "text-ink"}`}>{lesson.title}</span>
        <span className="mt-1 block text-xs tabular-nums text-ink-muted">
          <span className="sr-only">{ACCESS_LABEL[access]} · </span>
          {concepts.length > 0 && <span className="mr-2">{concepts.map((c) => `#${c!.order}`).join(" ")}</span>}
          {lesson.minutes}분 · 확인 문제 {progress.checksDone}/{progress.checksTotal}
          {progress.exercisesTotal > 0 && ` · 실습 ${progress.exercisesPassed}/${progress.exercisesTotal}`}
          {progress.credited && " · 진단 인정"}
        </span>
      </span>
      {access === "current" && <span className="hidden text-[13px] font-medium text-[var(--accent)] sm:inline">진행할 차례</span>}
    </>
  );
  return (
    <li>
      {openable ? (
        <Link href={lessonHref(slug, lesson.id)} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
          {body}
          <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </Link>
      ) : (
        <div className="flex items-center gap-4 py-4 opacity-70">{body}</div>
      )}
    </li>
  );
}

function FinaleRow({ href, title, detail, state, done, locked }: { href: string; title: string; detail: string; state: string; done: boolean; locked: boolean }) {
  const inner = (
    <>
      <StepMarker state={done ? "done" : locked ? "locked" : "todo"} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{title}</span>
        <span className="mt-1 block text-xs text-ink-muted">{locked ? "핵심 레슨을 모두 마치면 열립니다." : detail}</span>
      </span>
      <span className={`text-[13px] tabular-nums ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>{state}</span>
    </>
  );
  return locked ? (
    <div className="flex items-center gap-4 py-4 opacity-70">{inner}</div>
  ) : (
    <Link href={href} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-4">
      {inner}
      <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

/** 선택 레슨 펼침 안의 기록 요약(레슨·실습·과제 심화 문제) */
function RecordLine({ record }: { record: TierRecord }) {
  const rows = [
    { label: "레슨", c: record.lessons },
    { label: "코딩 실습", c: record.exercises },
    ...(record.tier === "advanced" ? [{ label: "과제 심화 문제", c: record.challenges }] : []),
  ].filter((r) => r.c.total > 0);
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-ink-muted">
      {rows.map((r) => (
        <li key={r.label}>
          {r.label}{" "}
          <span className={`tabular-nums ${r.c.done === r.c.total ? "text-[var(--status-good)]" : "text-ink-secondary"}`}>
            {r.c.done}/{r.c.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
