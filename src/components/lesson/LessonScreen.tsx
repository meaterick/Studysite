import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { conceptsOf, dependentsOf, directPrerequisitesOf, getModule, getModuleLesson, itemId } from "@/content/course";
import type { Lesson } from "@/content/types";
import { parseMarkdown } from "@/content/markdown";
import { TIER_INFO, TIER_ORDER, lessonLabel } from "@/content/tiers";
import { BlocksRenderer, Inline, RichText } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import LessonLayout from "@/components/lesson/LessonLayout";
import LessonFooter from "@/components/lesson/LessonFooter";
import CheckSequence from "@/components/lesson/CheckSequence";
import CheckQuestion from "@/components/lesson/CheckQuestion";
import DescriptiveItem from "@/components/lesson/DescriptiveItem";
import PredictItem from "@/components/lesson/PredictItem";
import CodingExercise from "@/components/lab/CodingExercise";
import TierBadge from "@/components/TierBadge";
import StepMarker from "@/components/StepMarker";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import Icon from "@/components/Icon";
import { ProgressCount, ProgressProvider, type ProgressStatus } from "@/components/progress/ProgressStore";
import { loadModulePage } from "@/lib/modulePage";
import { canOpenLesson, isLessonComplete, lessonProgress, unfinishedPrerequisites, type ModuleStatus } from "@/lib/study";
import { readLessonState, type LearningRecord } from "@/lib/learningStore";
import { exerciseView } from "@/lib/labView";
import { checkKey, descKey, predictKey } from "@/lib/progressIds";
import { LESSON_LIST_COOKIE } from "@/lib/lessonListCookie";
import { lessonHref, moduleHref, practiceHref, recallHref } from "@/lib/routes";

/** 준비 점검: 직접 선수 레슨에서 틀린 적 있는 확인 문제를 최대 두 개 다시 묻는다(인출 연습). */
function warmUpChecks(lesson: Lesson, record: LearningRecord) {
  const picks: { lesson: Lesson; key: string }[] = [];
  for (const pre of directPrerequisitesOf(lesson)) {
    const state = readLessonState(record, pre.id);
    for (const c of pre.checks) {
      if ((state.checks[c.key]?.wrong.length ?? 0) > 0 && picks.length < 2) picks.push({ lesson: pre, key: c.key });
    }
  }
  return picks;
}

export default async function LessonScreen({
  slug,
  lessonId,
  practice = false,
}: {
  slug: string;
  lessonId: string;
  practice?: boolean;
}) {
  const lessonPath = lessonHref(slug, lessonId);
  const practicePath = practiceHref(slug, lessonId);
  const { module, record, status, isAdmin } = await loadModulePage(slug, practice ? practicePath : lessonPath);
  const found = getModuleLesson(slug, lessonId);
  if (!found) notFound();
  const lesson = found.lesson;
  if (!canOpenLesson(status, lesson.id, isAdmin)) redirect(`${moduleHref(slug)}?locked=lesson`);

  const state = readLessonState(record, lesson.id);
  const progress = lessonProgress(lesson, state, record);
  const isCore = lesson.tier === "core";
  const concepts = conceptsOf(lesson);
  const dependents = practice ? [] : dependentsOf(lesson);
  const missing = isAdmin ? [] : unfinishedPrerequisites(record, lesson);
  const warmUp = practice ? warmUpChecks(lesson, record) : [];

  // 이전·다음: 모듈 안 순서. 완료 후 이동은 같은 갈래(핵심 / 선택) 안에서 이어진다.
  const prev = module.lessons[lesson.order - 2];
  const next = module.lessons[lesson.order];
  const after = module.lessons.slice(lesson.order);
  const continueTo = isCore ? after.find((l) => l.tier === "core") : after.find((l) => l.tier !== "core");
  const endHref = isCore && module.recall.length > 0 ? recallHref(slug) : moduleHref(slug);
  const endLabel = isCore && module.recall.length > 0 ? "백지 복습으로" : "모듈 개요로";
  const finishLabel = continueTo ? "레슨 완료 · 다음 레슨으로" : `레슨 완료 · ${endLabel}`;
  const nextHref = continueTo ? lessonHref(slug, continueTo.id) : endHref;
  const skipHref = status.mode === "warn" && !progress.completed ? nextHref : undefined;

  // 확인 문제·서술형·예측 문제를 풀면 화면을 다시 받지 않고 진행 저장소로 숫자·완료 버튼을 고친다.
  const checkIds = lesson.checks.map((c) => checkKey(lesson.id, c.key));
  const items: Record<string, ProgressStatus> = {};
  for (const c of lesson.checks) items[checkKey(lesson.id, c.key)] = { done: !!state.checks[c.key]?.correct, weak: false };
  for (const w of warmUp) items[checkKey(w.lesson.id, w.key)] = { done: !!readLessonState(record, w.lesson.id).checks[w.key]?.correct, weak: true };
  for (const d of lesson.descriptive ?? []) items[descKey(lesson.id, d.key)] = { done: !!state.answers[d.key]?.review, weak: state.answers[d.key]?.review === "incorrect" };
  for (const p of lesson.predicts ?? []) {
    const s = state.predicts[p.key];
    items[predictKey(lesson.id, p.key)] = { done: !!s?.correct || !!s?.revealed, weak: !!s?.revealed && !s?.correct };
  }
  const requirements = [{ label: "확인 문제", done: progress.checksDone, total: progress.checksTotal, ids: checkIds }];
  const listCollapsed = (await cookies()).get(LESSON_LIST_COOKIE)?.value === "1";

  return (
    <ModuleFrame status={status} compact lessonId={lesson.id}>
      <LessonLayout
        done={status.tiers.core.done}
        total={status.tiers.core.total}
        initialCollapsed={listCollapsed}
        list={<LessonList status={status} lessonId={lesson.id} isAdmin={isAdmin} practice={practice} />}
      >
        <ProgressProvider key={`${lesson.id}:${practice}`} items={items}>
          <article className="min-w-0 max-w-[46rem] transition-[max-width] duration-300 lg:group-data-[collapsed]/stage:max-w-[59rem]">
            {isAdmin && status.lessons.find((r) => r.lesson.id === lesson.id)?.access === "locked" && (
              <p className="callout mb-6 text-xs">운영자 미리보기: 스터디원에게는 아직 잠겨 있는 레슨입니다.</p>
            )}
            <UnfinishedWarning
              context="이 레슨의 선수 개념 중"
              items={missing.map((p) => ({ label: `${getModule(p.module)!.code}`, title: p.title, href: lessonHref(p.module, p.id) }))}
            />

            <header>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                <TierBadge tier={lesson.tier} />
                <span className="tabular-nums">
                  {lesson.number} / {status.tiers[lesson.tier].total}
                </span>
                <span aria-hidden="true">·</span>
                <span>약 {lesson.minutes}분</span>
                {concepts.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{concepts.map((c) => `#${c!.order} ${c!.title}`).join(", ")}</span>
                  </>
                )}
                {!isCore && <span className="pill">선택</span>}
                {progress.credited && <span className="pill [--pill:var(--status-good)]">진단 평가로 인정</span>}
              </p>
              <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.25] tracking-[-0.035em] text-ink sm:text-[2.125rem]">{lesson.title}</h2>
              {lesson.goal && (
                <p className="mt-4 text-[17px] leading-relaxed text-ink-secondary">
                  <Inline text={lesson.goal} />
                </p>
              )}
              <nav aria-label="레슨 보기" className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={lessonPath} aria-current={practice ? undefined : "page"} className={`btn ${practice ? "btn-secondary" : "btn-primary"}`}>
                  본문
                </Link>
                <Link href={practicePath} aria-current={practice ? "page" : undefined} className={`btn ${practice ? "btn-primary" : "btn-secondary"}`}>
                  실습
                </Link>
              </nav>
              {practice && (
                <nav aria-label="실습 바로가기" className="mt-3 flex flex-wrap items-center gap-2">
                  {(lesson.exercises?.length ?? 0) > 0 && <a href="#practice" className="btn btn-secondary">코딩 실습</a>}
                  {(lesson.predicts?.length ?? 0) > 0 && <a href="#predict" className="btn btn-secondary">출력 예측</a>}
                  <a href="#check" className="btn btn-secondary">
                    확인 문제 <ProgressCount ids={checkIds} />/{progress.checksTotal}
                  </a>
                  {(lesson.descriptive?.length ?? 0) > 0 && <a href="#descriptive" className="btn btn-secondary">서술형</a>}
                  {module.recall.length > 0 && (
                    <Link href={recallHref(slug)} className="btn btn-secondary">
                      모듈 백지 복습{!status.finaleOpen && !isAdmin && " · 잠김"}
                    </Link>
                  )}
                </nav>
              )}
            </header>

            {practice ? (
              <>
                {warmUp.length > 0 && (
                  <section aria-labelledby="warmup-heading" className="mt-10">
                    <h3 id="warmup-heading" className="text-base font-semibold tracking-[-0.02em] text-ink">
                      준비 점검
                    </h3>
                    <p className="mb-4 mt-1 text-sm text-ink-muted">이 레슨의 선수 레슨에서 이전에 오답을 제출한 문제입니다. 다시 풀어 보고 시작하십시오.</p>
                    <div className="space-y-4">
                      {warmUp.map((w, i) => {
                        const check = w.lesson.checks.find((c) => c.key === w.key)!;
                        const s = readLessonState(record, w.lesson.id).checks[w.key] ?? null;
                        const reveal = !!s && (s.correct || s.wrong.length >= 2);
                        return (
                          <div key={`${w.lesson.id}/${w.key}`}>
                            <p className="mb-2 text-xs text-ink-muted">
                              <Link href={lessonHref(w.lesson.module, w.lesson.id)} className="hover:text-ink">
                                {w.lesson.title}
                              </Link>
                            </p>
                            <CheckQuestion
                              lessonId={w.lesson.id}
                              itemKey={w.key}
                              index={i}
                              question={<RichText text={check.question} />}
                              choices={check.choices.map((c, j) => <Inline key={j} text={c} />)}
                              state={s}
                              explanation={reveal ? <RichText text={check.explanation} /> : undefined}
                              correctIndex={s?.correct ? check.answer : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {(lesson.exercises?.length ?? 0) > 0 && (
                  <section id="practice" aria-labelledby="practice-heading" className="mt-16 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
                    <h3 id="practice-heading" className="mb-2 scroll-mt-24 text-xl font-bold tracking-[-0.03em] text-ink">
                      코딩 실습
                    </h3>
                    <p className="mb-6 text-sm text-ink-muted">TODO를 채우고 채점합니다. 코드는 브라우저에서만 실행되며, 레슨 완료 조건에 포함되지 않는 권장 활동입니다.</p>
                    <div className="space-y-6">
                      {lesson.exercises!.map((ex, i) => (
                        <CodingExercise key={ex.key} view={exerciseView(itemId(lesson.id, ex.key), ex, record, `실습 ${i + 1}`)} />
                      ))}
                    </div>
                  </section>
                )}

                {(lesson.predicts?.length ?? 0) > 0 && (
                  <section id="predict" aria-labelledby="predict-heading" className="mt-16 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
                    <h3 id="predict-heading" className="mb-2 text-xl font-bold tracking-[-0.03em] text-ink">
                      출력 예측
                    </h3>
                    <p className="mb-6 text-sm text-ink-muted">코드를 실행하기 전에 출력을 예측해 적습니다. 공백 차이는 무시합니다.</p>
                    <div className="space-y-6">
                      {lesson.predicts!.map((p, i) => {
                        const s = state.predicts[p.key];
                        const revealed = !!s?.correct || !!s?.revealed;
                        return (
                          <PredictItem
                            key={p.key}
                            lessonId={lesson.id}
                            itemKey={p.key}
                            label={`예측 ${i + 1}`}
                            question={<Inline text={p.question ?? "출력 결과를 예측해 적으십시오."} />}
                            code={p.code}
                            state={s ? { correct: !!s.correct, attempts: s.attempts, lastAnswer: s.lastAnswer, revealed: !!s.revealed } : null}
                            expected={revealed ? p.expected : undefined}
                            explanation={revealed ? <RichText text={p.explanation} /> : undefined}
                            weak={!!s?.revealed && !s?.correct}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                <section id="check" aria-labelledby="check-heading" className="mt-16 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
                  <h3 id="check-heading" className="mb-6 text-xl font-bold tracking-[-0.03em] text-ink">
                    확인 문제
                  </h3>
                  <CheckSequence
                    lessonId={lesson.id}
                    completed={progress.completed}
                    items={lesson.checks.map((check) => {
                      const s = state.checks[check.key] ?? null;
                      const reveal = !!s && (s.correct || s.wrong.length >= 2);
                      return {
                        itemKey: check.key,
                        question: <RichText text={check.question} />,
                        choices: check.choices.map((c, j) => <Inline key={j} text={c} />),
                        state: s,
                        explanation: reveal ? <RichText text={check.explanation} /> : undefined,
                        correctIndex: s?.correct ? check.answer : undefined,
                      };
                    })}
                  />
                </section>

                {(lesson.descriptive?.length ?? 0) > 0 && (
                  <section id="descriptive" aria-labelledby="desc-heading" className="mt-16 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
                    <h3 id="desc-heading" className="mb-2 text-xl font-bold tracking-[-0.03em] text-ink">
                      서술형
                    </h3>
                    <p className="mb-6 text-sm text-ink-muted">직접 설명을 쓰고 저장하면 모범 답안과 핵심 요소가 열립니다. 비교한 뒤 스스로 평가합니다(선택).</p>
                    <div className="space-y-6">
                      {lesson.descriptive!.map((d, i) => {
                        const a = state.answers[d.key];
                        return (
                          <DescriptiveItem
                            key={d.key}
                            lessonId={lesson.id}
                            itemKey={d.key}
                            label={`서술형 ${i + 1}`}
                            question={<RichText text={d.question} />}
                            savedText={a?.text}
                            review={a?.review}
                            checkedPoints={a?.checkedPoints}
                            modelAnswer={a ? <BlocksRenderer blocks={parseMarkdown(d.answer)} /> : undefined}
                            keyPoints={a ? d.keyPoints.map((p, j) => <Inline key={j} text={p} />) : undefined}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                <LessonFooter
                  lessonId={lesson.id}
                  requirements={requirements}
                  ready={progress.ready}
                  completed={progress.completed}
                  finishLabel={finishLabel}
                  nextHref={progress.completed ? nextHref : undefined}
                  nextLabel={continueTo ? "다음 레슨으로" : endLabel}
                  skipHref={skipHref}
                  skipLabel={continueTo ? "미완료로 두고 다음 레슨으로" : `미완료로 두고 ${endLabel}`}
                />
              </>
            ) : (
              <>
                {(lesson.why || dependents.length > 0) && (
                  <aside aria-labelledby="why-heading" className="mt-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-5 py-4">
                    <h3 id="why-heading" className="text-[13px] font-semibold text-ink">
                      개념 활용
                    </h3>
                    {lesson.why && (
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-body">
                        <Inline text={lesson.why} />
                      </p>
                    )}
                    {dependents.length > 0 && <LessonLinks lessons={dependents.slice(0, 4)} record={record} />}
                  </aside>
                )}
                <section id="learn" aria-label="학습" className="mt-10 scroll-mt-24 border-t border-[var(--border-hairline)] pt-10">
                  <BlocksRenderer blocks={lesson.learn} docKey={`lesson:${lesson.id}`} interactiveCode />
                </section>

                <section aria-label="레슨 실습" className="mt-14 rounded-2xl border border-[var(--border-hairline)] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-ink">이 레슨 실습하기</h3>
                  <p className="mt-2 text-sm text-ink-secondary">확인 문제를 풀고 레슨을 완료하십시오. 코딩 실습과 출력 예측도 실습 페이지에서 수행할 수 있습니다.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(lesson.exercises?.length ?? 0) > 0 && <Link id="practice" href={`${practicePath}#practice`} className="btn btn-secondary scroll-mt-24">코딩 실습</Link>}
                    {(lesson.predicts?.length ?? 0) > 0 && <Link id="predict" href={`${practicePath}#predict`} className="btn btn-secondary scroll-mt-24">출력 예측</Link>}
                    <Link id="check" href={`${practicePath}#check`} className="btn btn-primary scroll-mt-24">확인 문제</Link>
                    {(lesson.descriptive?.length ?? 0) > 0 && <Link id="descriptive" href={`${practicePath}#descriptive`} className="btn btn-secondary scroll-mt-24">서술형</Link>}
                  </div>
                </section>
                {dependents.length > 0 && (
                  <section aria-labelledby="next-use-heading" className="mt-14">
                    <h3 id="next-use-heading" className="mb-1 text-[13px] font-medium text-ink-muted">
                      관련 후속 레슨
                    </h3>
                    <p className="mb-2 text-sm text-ink-muted">이 레슨의 내용을 선수 개념으로 사용하는 후속 레슨입니다.</p>
                    <LessonLinks lessons={dependents} record={record} />
                  </section>
                )}

                {lesson.references && lesson.references.length > 0 && (
                  <section aria-labelledby="refs-heading" className="mt-14">
                    <h3 id="refs-heading" className="mb-3 text-[13px] font-medium text-ink-muted">
                      참고 자료
                    </h3>
                    <ul className="rows border-y border-[var(--border-hairline)]">
                      {lesson.references.map((ref) => (
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

                <nav aria-label="레슨 이동" className="mt-16 grid grid-cols-2 gap-6 border-t border-[var(--border-hairline)] pt-8">
                  {prev ? (
                    <Link href={lessonHref(slug, prev.id)} className="group min-w-0">
                      <span className="kicker block">이전 레슨</span>
                      <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">{prev.title}</span>
                    </Link>
                  ) : (
                    <Link href={moduleHref(slug)} className="group min-w-0">
                      <span className="kicker block">모듈</span>
                      <span className="mt-2 block text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">모듈 개요</span>
                    </Link>
                  )}
                  {next && (progress.completed || isAdmin || status.mode === "warn") ? (
                    <Link href={lessonHref(slug, next.id)} className="group min-w-0 text-right">
                      <span className="kicker block">다음 레슨</span>
                      <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">{next.title}</span>
                      {!progress.completed && !isAdmin && <span className="mt-1 block text-xs text-ink-muted">이 레슨은 미완료로 남습니다</span>}
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              </>
            )}
          </article>
        </ProgressProvider>
      </LessonLayout>
    </ModuleFrame>
  );
}

/** 레슨 링크 목록(완료 여부 표시) */
function LessonLinks({ lessons, record }: { lessons: Lesson[]; record: LearningRecord }) {
  return (
    <ul className="mt-2 space-y-1">
      {lessons.map((l) => {
        const m = getModule(l.module)!;
        const done = isLessonComplete(record, l.id);
        return (
          <li key={l.id}>
            <Link href={lessonHref(l.module, l.id)} className="group inline-flex items-center gap-2 text-sm text-ink-secondary transition hover:text-ink">
              {done ? <Icon name="check" size={13} className="text-[var(--status-good)]" /> : <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />}
              <span className="tabular-nums text-ink-muted">{m.code}</span>
              <span className="group-hover:underline group-hover:underline-offset-4">{l.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LessonList({ status, lessonId, isAdmin, practice }: { status: ModuleStatus; lessonId: string; isAdmin: boolean; practice: boolean }) {
  const slug = status.module.slug;
  return (
    <ol className="mt-4 max-h-[62vh] space-y-0.5 overflow-y-auto pr-1">
      {TIER_ORDER.flatMap((tier) => {
        const rows = status.lessons.filter((r) => r.lesson.tier === tier);
        if (rows.length === 0) return [];
        const info = TIER_INFO[tier];
        return [
          <li key={`h-${tier}`} className="flex items-center gap-2 px-2 pb-1.5 pt-4 text-xs text-ink-muted first:pt-0">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: info.color }} />
            {info.course}
            {!info.required && <span>· 선택</span>}
          </li>,
          ...rows.map(({ lesson: l, access }) => {
            const active = l.id === lessonId;
            const label = (
              <>
                <StepMarker size={20} state={access === "completed" ? "done" : access === "locked" ? "locked" : active ? "current" : "todo"} label={l.number} />
                <span className="min-w-0 leading-snug">{l.title}</span>
                <span className="sr-only">{access === "completed" ? " (완료)" : access === "locked" ? " (잠김)" : access === "upcoming" ? " (미완료)" : " (진행할 차례)"}</span>
              </>
            );
            return (
              <li key={l.id}>
                {access !== "locked" || isAdmin ? (
                  <Link
                    href={practice ? practiceHref(slug, l.id) : lessonHref(slug, l.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition ${active ? "bg-[var(--surface-card-2)] font-medium text-ink" : "text-ink-secondary hover:bg-[var(--surface-card-2)] hover:text-ink"}`}
                    title={lessonLabel(l)}
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="flex items-start gap-2.5 px-2 py-1.5 text-[13px] text-ink-muted">{label}</span>
                )}
              </li>
            );
          }),
        ];
      })}
    </ol>
  );
}
