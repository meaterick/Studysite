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
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";

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
      <PageHeader
        eyebrow="내 학습 진도"
        title={`${user.name}님, 오늘은 이것부터`}
        description={`지금 집중할 주차 · ${focus.week.number}주차 ${focus.week.title}`}
        className="mb-6"
      />

      {/* ── 첫 영역: 지금 할 일 하나만 크게, 그다음 할 일·진행률·피드백은 조용하게 ─────────── */}
      {today.length === 0 ? (
        <NextStep eyebrow="과정 완료" title="8주 과정을 모두 마쳤습니다" detail="복습 노트로 헷갈렸던 문항을 다시 확인해 보십시오." href="/feedback#review" cta="복습 노트 보기" />
      ) : (
        <NextStep
          title={today[0].label}
          detail={`${today[0].detail} · ${focus.week.number}주차 남은 시간 ${hoursLabel(weekRemaining)}`}
          href={today[0].href}
          cta={today[0].tone ? "다시 제출하기" : "이어서 학습"}
          meta={today[0].minutes ? `예상 ${hoursLabel(today[0].minutes)}` : undefined}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="later-heading" className="surface p-5">
          <h2 id="later-heading" className="text-sm font-bold text-ink-muted">
            그다음 할 일
          </h2>
          {today.length <= 1 ? (
            <p className="mt-3 text-sm text-ink-muted">위의 할 일을 마치면 다음 할 일이 이곳에 나타납니다.</p>
          ) : (
            <ol className="mt-2 divide-y divide-[var(--border-hairline)]">
              {today.slice(1).map((t, i) => (
                <li key={t.href + i}>
                  <Link href={t.href} className="group flex items-center gap-3 py-3">
                    <span aria-hidden="true" className="w-5 shrink-0 font-mono text-xs font-bold text-ink-muted">
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-ink group-hover:text-[var(--series-blue)]">{t.label}</span>
                      <span className="block text-xs text-ink-muted">{t.detail}</span>
                    </span>
                    {t.minutes && <span className="shrink-0 text-xs text-ink-muted">{hoursLabel(t.minutes)}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="grid content-start gap-4">
          <section aria-labelledby="learning-heading" className="surface p-5">
            <h2 id="learning-heading" className="text-sm font-bold text-ink-muted">
              학습 자료 진행
            </h2>
            <div className="mt-3 flex items-center gap-5">
              <TierRings counts={tierTotals} size={80} />
              <ul className="min-w-0 flex-1 space-y-1.5">
                {TIER_ORDER.map((t) => (
                  <li key={t} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 font-bold text-ink-secondary">
                      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: TIER_INFO[t].color }} />
                      {TIER_INFO[t].label}
                    </span>
                    <span className="tabular-nums text-ink">
                      <span className="font-bold">{pct(tierTotals[t].done, tierTotals[t].total)}%</span>
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
          <Link href="/feedback" className={`surface surface-link flex items-center justify-between gap-3 p-4 ${fb.newCount > 0 ? "border-[var(--series-orange)]" : ""}`}>
            <span className="text-sm font-bold text-ink-muted">새 운영자 피드백</span>
            <span className={`text-sm font-bold ${fb.newCount > 0 ? "text-[var(--series-orange)]" : "text-ink-muted"}`}>
              {fb.newCount > 0 ? `${fb.newCount}개 확인 →` : "없음"}
            </span>
          </Link>
        </div>
      </div>

      {/* ── 주차별 진행: 한 주 흐름 4단계 ───────────────────────── */}
      <div className="mt-12 mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">주차별 진행</h2>
      </div>
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                className={`surface surface-link flex h-full flex-col gap-3 p-4 ${
                  isFocus ? "border-[var(--series-blue)] ring-1 ring-[color-mix(in_srgb,var(--series-blue)_35%,transparent)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-mono text-xs font-bold text-ink-muted">
                      WEEK {String(week.number).padStart(2, "0")}
                      {isFocus && <span className="pill font-sans [--pill:var(--series-blue)]">학습 중</span>}
                    </p>
                    <p className="mt-1 truncate font-extrabold tracking-[-0.01em] text-ink">{week.title}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${isFocus ? "text-[var(--series-blue)]" : "text-ink-muted"}`}>
                    {!status.currentSection ? "보기 →" : status.tiers.core.done === 0 ? "시작 →" : "이어서 →"}
                  </span>
                </div>
                <div aria-label="학습 자료">
                  <div className="flex items-baseline justify-between text-xs text-ink-muted">
                    <span>
                      핵심 <span className="font-bold tabular-nums text-ink">{status.tiers.core.done}/{status.tiers.core.total}</span>
                    </span>
                    <span className="tabular-nums">
                      보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화 {status.tiers.advanced.done}/{status.tiers.advanced.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--surface-card-2)]" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round(status.ratio * 100)}%`, background: status.coreDone ? "var(--status-good)" : "var(--series-blue)" }}
                    />
                  </div>
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
      <h2 className="section-title mt-12 mb-3">기록</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Rate label="백지공부 제출" percent={pct(worksheetsDone, rows.length)} detail={`${worksheetsDone}/${rows.length}주`} />
        <Rate label="과제 제출" percent={pct(submitted, rows.length)} detail={`${submitted}/${rows.length}주 · 채점 ${graded.length}${revisions ? ` · 재제출 ${revisions}` : ""}`} />
        <div className="surface p-4">
          <p className="text-xs font-bold text-ink-muted">채점된 과제 합계</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-ink">{graded.length ? `${scoreSum}/${scoreMax}점` : "-"}</p>
        </div>
        <div className="surface p-4" style={advancedWeeks.length > 0 ? { borderColor: TIER_INFO.advanced.color } : undefined}>
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
    <div className="surface p-4">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-ink">{percent}%</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-card-2)]" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--series-blue)]" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{detail}</p>
    </div>
  );
}
