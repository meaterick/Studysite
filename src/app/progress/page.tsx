import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS, MODULES, getModule, lessonsOfConcept, modulesOfTrack } from "@/content/course";
import { LEARNING_FIELDS } from "@/content/fields";
import { SCHEDULE } from "@/content/curriculum/schedule";
import { requireUser } from "@/lib/dal";
import { getLearningRecord, learningActivityByItem } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, isLessonComplete, moduleStatus } from "@/lib/study";
import { memberFeedback } from "@/lib/feedback";
import { cohortWeek, getSettings, isBeforeDue } from "@/lib/settingsStore";
import { tierRecord } from "@/lib/achievement";
import { assignmentHref, lessonHref, moduleHref, recallHref, trackHref } from "@/lib/routes";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = { title: "내 학습 진도" };

// 진도 화면: 최근 학습한 모듈과 분야별 진행 상태를 표시한다.

const RECALL_MINUTES = 20;
const ASSIGNMENT_MINUTES = 150;

interface Todo {
  label: string;
  detail: string;
  href: string;
  minutes?: number;
  revision?: boolean;
}

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `약 ${minutes}분`;
  return `약 ${Math.round((minutes / 60) * 2) / 2}시간`;
}

export default async function ProgressPage() {
  const user = await requireUser("/progress");
  const record = getLearningRecord(user.id);
  const settings = getSettings();
  const activity = learningActivityByItem(user.id);
  const rows = MODULES.map((module) => {
    const submission = module.assignment ? findUserSubmission(user.id, module.assignment.key) : undefined;
    const status = moduleStatus(module, record, submission, settings.progressionMode);
    const recent = module.lessons.reduce((latest, lesson) => {
      const at = activity.lessons.get(lesson.id) ?? "";
      return at > latest ? at : latest;
    }, activity.recalls.get(module.slug) ?? "");
    return { module, status, recent, advanced: tierRecord(status, record, "advanced") };
  });
  const fb = memberFeedback(user.id, record);

  const focus = rows.filter((row) => row.recent).sort((a, b) => b.recent.localeCompare(a.recent))[0];

  const todos: Todo[] = [];
  for (const r of rows.filter((x) => x.status.assignment?.status === "revision")) {
    todos.push({ label: `${r.module.code} ${r.module.assignment!.title} 다시 제출`, detail: "재제출 요청", href: assignmentHref(r.module.slug), minutes: 60, revision: true });
  }
  if (focus) {
    const { module, status } = focus;
    const open = status.lessons.filter((row) => row.access !== "locked" && !row.progress.completed);
    const recentlyOpened = open.filter((row) => activity.lessons.has(row.lesson.id)).sort(
      (a, b) => activity.lessons.get(b.lesson.id)!.localeCompare(activity.lessons.get(a.lesson.id)!),
    )[0];
    const next = recentlyOpened?.lesson ?? status.currentLesson;
    if (next) {
      todos.push({ label: next.title, detail: module.title, href: lessonHref(module.slug, next.id), minutes: next.minutes });
    }
    if (status.coreDone && module.recall.length > 0 && !status.recallSubmitted) {
      todos.push({ label: `${module.code} 백지 복습`, detail: module.title, href: recallHref(module.slug), minutes: RECALL_MINUTES });
    }
    if (status.coreDone && status.assignment?.status === "none") {
      todos.push({ label: `${module.code} ${module.assignment!.title}`, detail: "과제", href: assignmentHref(module.slug), minutes: ASSIGNMENT_MINUTES });
    }
    if (!next && open.length > 0 && !todos.some((todo) => todo.href === recallHref(module.slug) || todo.href === assignmentHref(module.slug))) {
      todos.push({ label: module.title, detail: "최근 학습한 모듈", href: moduleHref(module.slug) });
    }
  }
  const today = todos.slice(0, 3);

  // 이번 주 일정(기수 시작일이 설정된 경우)
  const week = cohortWeek();
  const thisWeek = week ? SCHEDULE.find((w) => w.week === week) : undefined;
  const upcomingDue = rows
    .filter((r) => r.module.assignment && settings.dueDates[r.module.assignment.key] && r.status.assignment?.status !== "graded")
    .map((r) => ({ module: r.module, date: settings.dueDates[r.module.assignment!.key] }))
    .filter((d) => isBeforeDue(d.date))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // 숫자
  const lessonsDone = rows.reduce((sum, row) => sum + row.status.lessons.filter((lesson) => lesson.progress.completed).length, 0);
  const modulesDone = rows.filter((r) => r.status.tiers.core.total > 0 && r.status.coreDone).length;
  const withAssignment = rows.filter((r) => r.module.assignment);
  const submitted = withAssignment.filter((r) => r.status.assignment!.status !== "none").length;
  const graded = withAssignment.filter((r) => r.status.assignment!.status === "graded");
  const scoreSum = graded.reduce((sum, r) => sum + (r.status.assignment!.score ?? 0), 0);
  const scoreMax = graded.reduce((sum, r) => sum + r.status.assignment!.maxScore, 0);
  const conceptsDone = CONCEPTS.filter((c) => lessonsOfConcept(c.id).every((l) => isLessonComplete(record, l.id))).length;
  const stats = [
    { label: "완료한 레슨", value: `${lessonsDone}개`, sub: "모든 분야의 핵심·선택 레슨" },
    { label: "개념", value: `${conceptsDone}/${CONCEPTS.length}`, sub: "모든 레슨을 마친 개념" },
    { label: "모듈", value: `${modulesDone}/${rows.filter((r) => r.status.tiers.core.total > 0).length}`, sub: "핵심 레슨을 마친 모듈" },
    { label: "과제", value: `${submitted}/${withAssignment.length}`, sub: graded.length ? `채점 ${graded.length} · ${scoreSum}/${scoreMax}점` : "제출한 과제" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title={`${user.name}님의 학습 진도`} description="최근 학습을 이어가거나 분야별 완료 기록을 확인하세요." />

      {today.length === 0 ? (
        <NextStep eyebrow="학습 분야 선택" title={focus ? "다음에 배울 분야를 골라 보세요" : "관심 있는 분야에서 첫 학습을 시작하세요"} href="/curriculum" cta="분야 둘러보기" />
      ) : (
        <NextStep
          eyebrow={today[0].revision ? "과제 피드백" : "최근 학습 분야"}
          title={today[0].label}
          detail={today[0].detail}
          href={today[0].href}
          cta={today[0].revision ? "다시 제출하기" : "이어서 학습"}
          meta={today[0].minutes ? `예상 ${hoursLabel(today[0].minutes)}` : undefined}
        />
      )}

      {today.length > 1 && (
        <section aria-labelledby="later-heading" className="mt-10">
          <h2 id="later-heading" className="mb-2 text-[13px] font-medium text-ink-muted">
            그다음
          </h2>
          <ol className="rows border-y border-[var(--border-hairline)]">
            {today.slice(1).map((t, i) => (
              <li key={t.href + i}>
                <Link href={t.href} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">{t.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{t.detail}</span>
                  </span>
                  {t.minutes && <span className="shrink-0 text-xs text-ink-muted">{hoursLabel(t.minutes)}</span>}
                  <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {fb.newCount > 0 && (
        <Link href="/feedback" className="group callout mt-6 flex items-center justify-between gap-3 text-ink">
          <span>
            새 운영자 피드백 <strong className="font-semibold">{fb.newCount}개</strong>
          </span>
          <Icon name="arrowRight" size={15} className="transition group-hover:translate-x-0.5" />
        </Link>
      )}

      <dl className="mt-16 grid grid-cols-2 border-y border-[var(--border-hairline)] lg:grid-cols-4">
        {stats.map((st, i) => (
          <div
            key={st.label}
            className={`py-6 pr-4 ${i % 2 === 1 ? "border-l border-[var(--border-hairline)] pl-5" : ""} ${i >= 2 ? "border-t border-[var(--border-hairline)] lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-5" : ""}`}
          >
            <dt className="text-xs text-ink-muted">{st.label}</dt>
            <dd className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-ink">{st.value}</dd>
            <dd className="mt-2 truncate text-xs text-ink-muted">{st.sub}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="modules-heading" className="mt-16">
        <h2 id="modules-heading" className="section-title mb-3">
          분야별 진행
        </h2>
        {LEARNING_FIELDS.map((track) => (
          <div key={track.id} className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              <Link href={trackHref(track.id)} className="inline-flex items-center gap-2 hover:underline">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: track.color }} />
                {track.title}
              </Link>
            </h3>
            <ol className="rows border-y border-[var(--border-hairline)]">
              {modulesOfTrack(track.id).map((m) => {
                const row = rows.find((r) => r.module.slug === m.slug)!;
                const { status, advanced } = row;
                const total = status.lessons.length;
                const done = status.lessons.filter((lesson) => lesson.progress.completed).length;
                const isFocus = m.slug === focus?.module.slug;
                const assignment = status.assignment
                  ? status.assignment.status === "graded"
                    ? `${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
                    : ASSIGNMENT_STATUS_LABEL[status.assignment.status]
                  : "";
                return (
                  <li key={m.slug}>
                    <Link href={moduleHref(m.slug)} className="group row-hover -mx-3 grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl px-3 py-3.5 md:grid-cols-[2.5rem_minmax(0,1fr)_7.5rem_9rem_1rem]">
                      <span className={`font-mono text-xs ${isFocus ? "text-ink" : "text-ink-muted"}`}>{m.code}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-medium text-ink">{m.title}</span>
                          {isFocus && <span className="pill shrink-0 [--pill:var(--accent)]">최근 학습</span>}
                          {advanced.complete && <span className="pill shrink-0 [--pill:var(--tier-advanced)]">심화 달성</span>}
                        </span>
                        {(status.tiers.supplement.total > 0 || status.tiers.advanced.total > 0) && (
                          <span className="mt-0.5 block text-xs tabular-nums text-ink-muted">
                            보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
                          </span>
                        )}
                      </span>
                      <span className="col-start-2 flex items-center gap-2.5 md:col-start-auto">
                        <span className="meter block w-14" aria-hidden="true">
                          <span style={{ width: `${Math.round(total > 0 ? (done / total) * 100 : 0)}%`, background: total > 0 && done === total ? "var(--status-good)" : undefined }} />
                        </span>
                        <span className="text-xs tabular-nums text-ink-muted">
                          {done}/{total}
                        </span>
                      </span>
                      <span className="hidden truncate text-xs text-ink-muted md:block">
                        {m.recall.length > 0 && `백지 복습 ${status.recallSubmitted ? "✓" : "–"}`}
                        {assignment && ` · 과제 ${assignment}`}
                      </span>
                      <Icon name="chevronRight" size={16} className="col-start-3 row-start-1 justify-self-end text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink md:col-start-auto md:row-start-auto" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>

      {(thisWeek || upcomingDue) && (
        <section aria-labelledby="week-heading" className="mt-16 rounded-2xl border border-[var(--border-hairline)] p-5 sm:p-6">
          <h2 id="week-heading" className="text-[13px] font-medium text-ink-muted">
            {thisWeek ? `이번 주 (${thisWeek.week}주차) 학습 범위` : "다가오는 마감"}
          </h2>
          {thisWeek && (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px]">
              {thisWeek.modules.map((s) => {
                const m = getModule(s);
                return m ? (
                  <li key={s}>
                    <Link href={moduleHref(s)} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
                      {m.code} {m.title}
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          )}
          {thisWeek?.milestone && (
            <p className="mt-3 text-sm text-ink-secondary">
              캡스톤 준비: {thisWeek.milestone} ·{" "}
              <Link href={lessonHref("capstone-project", "capstone-design")} className="underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
                단계별 할 일 보기
              </Link>
            </p>
          )}
          {upcomingDue && (
            <p className="mt-3 text-sm text-ink-secondary">
              가장 가까운 마감: {upcomingDue.module.code} {upcomingDue.module.assignment!.title} · {upcomingDue.date.slice(5).replace("-", "/")} 23:59
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="concepts-heading" className="mt-16">
        <h2 id="concepts-heading" className="section-title mb-2">
          개념별 완료
        </h2>
        <p className="mb-4 text-sm text-ink-muted">개념을 다루는 핵심 레슨을 모두 마치면 채워집니다.</p>
        <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-[repeat(16,minmax(0,1fr))]" aria-label="80개 개념">
          {CONCEPTS.map((c) => {
            const lessons = lessonsOfConcept(c.id);
            const n = lessons.filter((l) => isLessonComplete(record, l.id)).length;
            const state = n === lessons.length ? "done" : n > 0 ? "partial" : "todo";
            const first = lessons.find((l) => !isLessonComplete(record, l.id)) ?? lessons[0];
            return (
              <li key={c.id}>
                <Link
                  href={first ? lessonHref(first.module, first.id) : "/curriculum"}
                  title={`#${c.order} ${c.title} (${n}/${lessons.length})`}
                  className={`grid aspect-square place-items-center rounded-md text-[10px] tabular-nums transition hover:ring-1 hover:ring-[var(--border-strong)] ${
                    state === "done"
                      ? "bg-[color-mix(in_srgb,var(--status-good)_22%,transparent)] text-[var(--status-good)]"
                      : state === "partial"
                        ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]"
                        : "bg-[var(--surface-card-2)] text-ink-muted"
                  }`}
                >
                  {c.order}
                  <span className="sr-only">
                    {c.title} {state === "done" ? "완료" : state === "partial" ? "진행 중" : "시작 전"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
