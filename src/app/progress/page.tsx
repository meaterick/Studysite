import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission, latestGrade } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";
import { memberFeedback } from "@/lib/feedback";
import { getSettings } from "@/lib/settingsStore";
import { tierRecord } from "@/lib/achievement";
import { sectionLabel } from "@/content/tiers";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = { title: "내 학습 진도" };

// 첫 화면: 지금 할 일 하나를 크게, 그 아래 핵심 숫자 네 개와 주차별 진행표를 조용하게 둔다.

const WORKSHEET_MINUTES = 30;
const ASSIGNMENT_MINUTES = 150;

interface Todo {
  label: string;
  detail: string;
  href: string;
  minutes?: number;
  tone?: string;
}

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `약 ${minutes}분`;
  const h = Math.round((minutes / 60) * 2) / 2;
  return `약 ${h}시간`;
}

export default async function ProgressPage() {
  const user = await requireUser("/progress");
  const record = getLearningRecord(user.id);
  const settings = getSettings();
  const rows = WEEKS.map((week) => {
    const submission = findUserSubmission(user.id, week.slug);
    const status = weekStatus(week, record, submission, settings.progressionMode);
    return {
      week,
      status,
      grade: submission ? latestGrade(submission) : undefined,
      supplement: tierRecord(week, record, status, "supplement"),
      advanced: tierRecord(week, record, status, "advanced"),
    };
  });
  const fb = memberFeedback(user.id, record);

  // ── 지금 집중할 주차: 핵심 단계·백지공부·과제 중 하나라도 남은 첫 주차(보충·심화는 선택이라 기준에 넣지 않는다)
  const focus =
    rows.find((r) => !r.status.coreDone || !r.status.worksheetSubmitted || r.status.assignment.status === "none") ?? rows[rows.length - 1];

  // ── 오늘 할 일(최대 3개): 재제출 요청 → 다음 단계 → 백지공부 → 과제
  const todos: Todo[] = [];
  for (const r of rows.filter((x) => x.status.assignment.status === "revision")) {
    todos.push({
      label: `${r.week.number}주차 과제 다시 제출`,
      detail: "재제출 요청",
      href: `/weeks/${r.week.slug}/assignment`,
      minutes: 60,
      tone: "var(--status-serious)",
    });
  }
  const next = focus.status.currentSection;
  if (next) {
    todos.push({
      label: `${focus.week.number}주차 ${sectionLabel(next)}단계 · ${next.title}`,
      detail: "학습 자료",
      href: `/weeks/${focus.week.slug}/sections/${next.id}`,
      minutes: next.minutes,
    });
  }
  if (focus.status.coreDone && !focus.status.worksheetSubmitted) {
    todos.push({ label: `${focus.week.number}주차 백지공부`, detail: "적용과 복습", href: `/weeks/${focus.week.slug}/worksheet`, minutes: WORKSHEET_MINUTES });
  }
  if (focus.status.assignment.status === "none" && (focus.status.coreDone || todos.length < 2)) {
    todos.push({ label: `${focus.week.number}주차 과제 · ${focus.week.assignment.title}`, detail: "적용과 복습", href: `/weeks/${focus.week.slug}/assignment`, minutes: ASSIGNMENT_MINUTES });
  }
  const today = todos.slice(0, 3);
  const weekRemaining =
    focus.status.sections.filter((s) => s.section.tier === "core" && s.access !== "completed").reduce((sum, s) => sum + s.section.minutes, 0) +
    (focus.status.worksheetSubmitted ? 0 : WORKSHEET_MINUTES) +
    (focus.status.assignment.status === "none" || focus.status.assignment.status === "revision" ? ASSIGNMENT_MINUTES : 0);

  // ── 기록
  const advancedWeeks = rows.filter((r) => r.advanced.complete);
  const worksheetsDone = rows.filter((r) => r.status.worksheetSubmitted).length;
  const submitted = rows.filter((r) => r.status.assignment.status !== "none").length;
  const graded = rows.filter((r) => r.status.assignment.status === "graded");
  const revisions = rows.filter((r) => r.status.assignment.status === "revision").length;
  const scoreSum = graded.reduce((sum, r) => sum + (r.status.assignment.score ?? 0), 0);
  const scoreMax = graded.reduce((sum, r) => sum + r.status.assignment.maxScore, 0);
  const weeksDone = rows.filter((r) => r.status.coreDone).length;
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

  const coreTotal = rows.reduce((sum, r) => ({ done: sum.done + r.status.tiers.core.done, total: sum.total + r.status.tiers.core.total }), { done: 0, total: 0 });
  const stats = [
    { label: "핵심 단계", value: `${pct(coreTotal.done, coreTotal.total)}%`, sub: `마친 주차 ${weeksDone}/${rows.length}` },
    { label: "백지공부", value: `${worksheetsDone}/${rows.length}`, sub: "제출한 주" },
    { label: "과제", value: `${submitted}/${rows.length}`, sub: graded.length ? `채점 ${graded.length} · ${scoreSum}/${scoreMax}점${revisions ? ` · 재제출 ${revisions}` : ""}` : "제출한 주" },
    { label: "심화 달성", value: `${advancedWeeks.length}주`, sub: advancedWeeks.length ? advancedWeeks.map((r) => `${r.week.number}주차`).join(" · ") : "아직 없음" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title={`${user.name}님, 오늘은 이것부터`} />

      {today.length === 0 ? (
        <NextStep eyebrow="과정 완료" title="8주 과정을 모두 마쳤습니다" href="/feedback#review" cta="복습 노트 보기" />
      ) : (
        <NextStep
          title={today[0].label}
          detail={`${today[0].detail} · ${focus.week.number}주차 남은 시간 ${hoursLabel(weekRemaining)}`}
          href={today[0].href}
          cta={today[0].tone ? "다시 제출하기" : "이어서 학습"}
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

      {/* ── 주차별 진행 ─────────────────────────────────────────── */}
      <section aria-labelledby="weeks-heading" className="mt-16">
        <h2 id="weeks-heading" className="section-title mb-3">
          주차별 진행
        </h2>
        <ol className="rows border-y border-[var(--border-hairline)]">
          {rows.map(({ week, status, grade, advanced }) => {
            const isFocus = week.slug === focus.week.slug;
            const { done, total } = status.tiers.core;
            const assignment =
              status.assignment.status === "graded"
                ? `${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
                : ASSIGNMENT_STATUS_LABEL[status.assignment.status];
            const due = settings.dueDates[week.slug];
            return (
              <li key={week.slug}>
                <Link
                  href={status.currentSection ? `/weeks/${week.slug}/sections/${status.currentSection.id}` : `/weeks/${week.slug}`}
                  className="group row-hover -mx-3 grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_7.5rem_5rem_7rem_1rem]"
                >
                  <span aria-hidden="true" className={`text-xl font-light tabular-nums tracking-[-0.04em] ${isFocus ? "text-ink" : "text-ink-muted"}`}>
                    {String(week.number).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="sr-only">{week.number}주차 </span>
                      <span className="truncate text-[15px] font-medium text-ink">{week.title}</span>
                      {isFocus && <span className="pill shrink-0 [--pill:var(--accent)]">학습 중</span>}
                      {advanced.complete && <span className="pill shrink-0 [--pill:var(--tier-advanced)]">심화 달성</span>}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-ink-muted">
                      보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
                      {due && ` · 마감 ${due.slice(5).replace("-", "/")}`}
                    </span>
                  </span>
                  <span className="col-start-2 flex items-center gap-2.5 md:col-start-auto">
                    <span className="meter block w-16 md:w-14" aria-hidden="true">
                      <span style={{ width: `${Math.round(status.ratio * 100)}%`, background: status.coreDone ? "var(--status-good)" : undefined }} />
                    </span>
                    <span className="text-xs tabular-nums text-ink-muted">
                      핵심 {done}/{total}
                    </span>
                  </span>
                  <span className={`hidden text-xs md:block ${status.worksheetSubmitted ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
                    백지공부 {status.worksheetSubmitted ? "✓" : "–"}
                  </span>
                  <span
                    className={`hidden truncate text-xs md:block ${
                      grade?.decision === "revision" ? "text-[var(--status-serious)]" : status.assignment.status === "graded" ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    과제 {assignment}
                  </span>
                  <Icon name="chevronRight" size={16} className="col-start-3 row-start-1 justify-self-end text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink md:col-start-auto md:row-start-auto" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
