import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import TierRings from "@/components/TierRings";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission, latestGrade } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";
import { memberFeedback } from "@/lib/feedback";
import { getSettings } from "@/lib/settingsStore";
import { tierRecord } from "@/lib/achievement";
import { sectionLabel, TIER_INFO, TIER_ORDER, type Tier } from "@/content/tiers";
import TierBadge from "@/components/TierBadge";

export const metadata: Metadata = { title: "내 학습 진도" };

// 첫 화면: 오늘 할 일과 학습 자료 진행(핵심·보충·심화)·새 피드백. 그 아래에 주차별 진행(학습 자료 3단계 + 적용과 복습)과 기록을 둔다.

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
  const todayMinutes = today.reduce((sum, t) => sum + (t.minutes ?? 0), 0);
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
  const tierTotals = Object.fromEntries(
    TIER_ORDER.map((t) => [
      t,
      {
        done: rows.reduce((sum, r) => sum + r.status.tiers[t].done, 0),
        total: rows.reduce((sum, r) => sum + r.status.tiers[t].total, 0),
      },
    ])
  ) as Record<Tier, { done: number; total: number }>;
  const weeksDone = rows.filter((r) => r.status.coreDone).length;
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">내 학습 진도</p>
      <h1 className="mb-6 text-3xl font-black text-ink">오늘은 이것부터</h1>

      {/* ── 첫 영역: 오늘 할 일 + 학습 진행률·피드백 ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="today-heading" className="rounded-2xl border border-[var(--series-blue)] bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="today-heading" className="text-lg font-black text-ink">
              오늘 할 일
            </h2>
            {todayMinutes > 0 && <p className="text-sm font-bold text-ink-secondary">예상 {hoursLabel(todayMinutes)}</p>}
          </div>
          {today.length === 0 ? (
            <p className="mt-3 text-sm text-ink-secondary">8주 과정을 모두 마쳤습니다.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {today.map((t, i) => (
                <li key={t.href + i}>
                  <Link
                    href={t.href}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] px-3 py-2.5 transition hover:border-[var(--series-blue)]"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black text-white"
                      style={{ background: t.tone ?? "var(--series-blue)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{t.label}</span>
                      <span className="block text-xs text-ink-muted">{t.detail}</span>
                    </span>
                    {t.minutes && <span className="shrink-0 text-xs font-bold text-ink-muted">{hoursLabel(t.minutes)}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-3">
            <p className="text-xs text-ink-muted">
              {focus.week.number}주차 남은 시간 {hoursLabel(weekRemaining)}
            </p>
            <Link
              href={next ? `/weeks/${focus.week.slug}/sections/${next.id}` : `/weeks/${focus.week.slug}`}
              className="rounded-lg bg-[var(--series-blue)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              이어서 학습 →
            </Link>
          </div>
        </section>

        <div className="grid content-start gap-4">
          <section aria-labelledby="learning-heading" className="rounded-2xl border border-[var(--border-hairline)] bg-card p-5">
            <h2 id="learning-heading" className="text-sm font-black text-ink-muted">
              학습 자료 진행
            </h2>
            <div className="mt-3 flex items-center gap-5">
              <TierRings counts={tierTotals} size={96} />
              <ul className="min-w-0 flex-1 space-y-1.5">
                {TIER_ORDER.map((t) => (
                  <li key={t} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 font-black" style={{ color: TIER_INFO[t].color }}>
                      <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: TIER_INFO[t].color }} />
                      {TIER_INFO[t].label}
                    </span>
                    <span className="tabular-nums text-ink">
                      <span className="font-black">{pct(tierTotals[t].done, tierTotals[t].total)}%</span>
                      <span className="ml-1.5 text-xs text-ink-muted">
                        {tierTotals[t].done}/{tierTotals[t].total}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 border-t border-[var(--border-hairline)] pt-2 text-xs text-ink-muted">
              학습을 마친 주차 {weeksDone}/{rows.length}
            </p>
          </section>
          <Link
            href="/feedback"
            className={`flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
              fb.newCount > 0 ? "border-[var(--series-orange)]" : "border-[var(--border-hairline)]"
            }`}
          >
            <span>
              <span className="block text-sm font-black text-ink-muted">새 운영자 피드백</span>
              <span className="block text-lg font-black text-ink">{fb.newCount > 0 ? `${fb.newCount}개` : "없음"}</span>
            </span>
            <span className="text-sm font-bold text-[var(--series-blue)]">피드백함 →</span>
          </Link>
        </div>
      </div>

      {/* ── 주차별 진행: 한 주 흐름 4단계 ───────────────────────── */}
      <div className="mt-12 mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-black text-ink">주차별 진행</h2>
        <p className="flex flex-wrap items-center gap-3 text-xs font-bold text-ink-muted">
          {TIER_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: TIER_INFO[t].color }} />
              {TIER_INFO[t].label}
            </span>
          ))}
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {rows.map(({ week, status, grade, advanced }) => {
          const isFocus = week.slug === focus.week.slug;
          const core = status.sections.filter((r) => r.section.tier === "core");
          const checks = core.reduce((a, r) => ({ done: a.done + r.progress.checksDone, total: a.total + r.progress.checksTotal }), { done: 0, total: 0 });
          const apply = [
            { label: status.worksheetSubmitted ? "백지공부 ✓" : "백지공부 미제출", done: status.worksheetSubmitted },
            {
              label:
                status.assignment.status === "graded"
                  ? `과제 ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
                  : `과제 ${ASSIGNMENT_STATUS_LABEL[status.assignment.status]}`,
              done: status.assignment.status !== "none" && status.assignment.status !== "revision",
            },
          ];
          return (
            <li key={week.slug}>
              <Link
                href={status.currentSection ? `/weeks/${week.slug}/sections/${status.currentSection.id}` : `/weeks/${week.slug}`}
                className={`flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
                  isFocus ? "border-[var(--series-blue)] shadow-sm" : "border-[var(--border-hairline)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <TierRings counts={status.tiers} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink-muted">
                      {week.number}주차
                      {isFocus && <span className="ml-2 rounded-full bg-[var(--series-blue)] px-2 py-0.5 text-[10px] font-black text-white">학습 중</span>}
                    </p>
                    <p className="truncate text-sm font-black text-ink">{week.title}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--series-blue)]">{!status.currentSection ? "보기 →" : status.tiers.core.done === 0 ? "시작 →" : "이어서 →"}</span>
                </div>
                <div className="space-y-1.5" aria-label="학습 자료">
                  {TIER_ORDER.map((t) => {
                    const rowsOfTier = status.sections.filter((r) => r.section.tier === t);
                    if (rowsOfTier.length === 0) return null;
                    const color = TIER_INFO[t].color;
                    return (
                      <div key={t} className="flex items-center gap-2">
                        <span className="w-7 shrink-0 text-[11px] font-black" style={{ color }}>
                          {TIER_INFO[t].label}
                        </span>
                        <span className="flex flex-1 gap-0.5" aria-hidden="true">
                          {rowsOfTier.map((r) => (
                            <span
                              key={r.section.id}
                              className="h-2 flex-1 rounded-sm"
                              style={{ background: r.progress.completed ? color : `color-mix(in srgb, ${color} 14%, transparent)` }}
                            />
                          ))}
                        </span>
                        <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-ink-muted">
                          {status.tiers[t].done}/{status.tiers[t].total}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border-hairline)] pt-2.5 text-[11px] font-bold">
                  <span className="rounded-md bg-[var(--surface-card-2)] px-1.5 py-0.5 text-ink-muted">
                    확인 문제 {checks.done}/{checks.total}
                  </span>
                  {apply.map((st) => (
                    <span
                      key={st.label}
                      className={`rounded-md px-1.5 py-0.5 ${
                        st.done ? "bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]" : "bg-[var(--surface-card-2)] text-ink-muted"
                      }`}
                    >
                      {st.label}
                    </span>
                  ))}
                  {grade?.decision === "revision" && <span className="text-[var(--status-serious)]">재제출 요청</span>}
                  {advanced.complete && <span style={{ color: TIER_INFO.advanced.color }}>✦ 심화 달성</span>}
                  {settings.dueDates[week.slug] && <span className="ml-auto font-medium text-ink-muted">마감 {settings.dueDates[week.slug].slice(5).replace("-", "/")}</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* ── 백지공부·과제·심화 기록 ──────────────────────────────── */}
      <h2 className="mt-12 mb-3 text-xl font-black text-ink">기록</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Rate label="백지공부 제출" percent={pct(worksheetsDone, rows.length)} detail={`${worksheetsDone}/${rows.length}주`} />
        <Rate label="과제 제출" percent={pct(submitted, rows.length)} detail={`${submitted}/${rows.length}주 · 채점 ${graded.length}${revisions ? ` · 재제출 ${revisions}` : ""}`} />
        <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
          <p className="text-xs font-bold text-ink-muted">채점된 과제 합계</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-ink">{graded.length ? `${scoreSum}/${scoreMax}점` : "-"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4" style={{ borderColor: advancedWeeks.length > 0 ? TIER_INFO.advanced.color : "var(--border-hairline)" }}>
          <p className="flex items-center gap-2 text-xs font-bold text-ink-muted">
            심화 달성 <TierBadge tier="advanced" compact />
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-ink">
            {advancedWeeks.length}
            <span className="text-sm font-bold text-ink-muted"> / {rows.length}주</span>
          </p>
          {advancedWeeks.length > 0 && <p className="mt-1 text-xs text-ink-muted">{advancedWeeks.map((r) => `${r.week.number}주차`).join(" · ")}</p>}
        </div>
      </div>
    </div>
  );
}

function Rate({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-ink">{percent}%</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-card-2)]" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--series-blue)]" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{detail}</p>
    </div>
  );
}
