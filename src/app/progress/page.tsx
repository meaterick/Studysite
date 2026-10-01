import type { Metadata } from "next";
import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import ProgressRing from "@/components/ProgressRing";
import { requireUser } from "@/lib/dal";
import { getLearningRecord, readSectionState } from "@/lib/learningStore";
import { findUserSubmission, latestGrade } from "@/lib/submissionStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";
import { memberFeedback } from "@/lib/feedback";
import { dueDateEnd, getSettings } from "@/lib/settingsStore";
import { formatDate } from "@/lib/datetime";
import { tierRecord } from "@/lib/achievement";
import { sectionLabel, TIER_INFO } from "@/content/tiers";
import TierBadge from "@/components/TierBadge";

export const metadata: Metadata = { title: "내 학습 진도" };

// 다시 접속한 학습자에게 먼저 필요한 것은 통계보다 "지금 무엇을 할지"다. 그래서 첫 영역에 오늘 할 일·예상 시간·
// 가까운 마감·새 피드백·복습·이어서 학습을 두고, 진행률(학습·실습·과제·피드백 확인을 따로)과 주차별 기록은 그 아래에 둔다.

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

/** 한국 날짜 기준 D-day(오늘 마감이면 0, 지났으면 음수) */
function daysLeft(date: string, now: Date): number {
  const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const todayKst = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - todayKst) / 86_400_000);
}

export default async function ProgressPage() {
  const user = await requireUser("/progress");
  const record = getLearningRecord(user.id);
  const settings = getSettings();
  const now = new Date();
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
      detail: "운영자가 재제출을 요청했습니다. 피드백을 확인하고 보완해 주십시오.",
      href: `/weeks/${r.week.slug}/assignment`,
      minutes: 60,
      tone: "var(--status-serious)",
    });
  }
  const next = focus.status.currentSection;
  if (next) {
    todos.push({
      label: `${focus.week.number}주차 ${sectionLabel(next)}단계 · ${next.title}`,
      detail: "이어서 학습할 핵심 단계입니다.",
      href: `/weeks/${focus.week.slug}/sections/${next.id}`,
      minutes: next.minutes,
    });
  }
  if (focus.status.coreDone && !focus.status.worksheetSubmitted) {
    todos.push({ label: `${focus.week.number}주차 백지공부`, detail: "자료를 덮고 배운 내용을 떠올려 적어 봅니다.", href: `/weeks/${focus.week.slug}/worksheet`, minutes: WORKSHEET_MINUTES });
  }
  if (focus.status.assignment.status === "none" && (focus.status.coreDone || todos.length < 2)) {
    todos.push({ label: `${focus.week.number}주차 과제 · ${focus.week.assignment.title}`, detail: "작업 공간에서 작성하고 제출합니다.", href: `/weeks/${focus.week.slug}/assignment`, minutes: ASSIGNMENT_MINUTES });
  }
  const today = todos.slice(0, 3);
  const todayMinutes = today.reduce((sum, t) => sum + (t.minutes ?? 0), 0);
  const weekRemaining =
    focus.status.sections.filter((s) => s.section.tier === "core" && s.access !== "completed").reduce((sum, s) => sum + s.section.minutes, 0) +
    (focus.status.worksheetSubmitted ? 0 : WORKSHEET_MINUTES) +
    (focus.status.assignment.status === "none" || focus.status.assignment.status === "revision" ? ASSIGNMENT_MINUTES : 0);

  // ── 가장 가까운 마감: 아직 제출하지 않았거나 재제출을 요청받은 과제 중 마감일이 정해진 것
  const deadlines = rows
    .filter((r) => settings.dueDates[r.week.slug] && (r.status.assignment.status === "none" || r.status.assignment.status === "revision"))
    .map((r) => ({ row: r, date: settings.dueDates[r.week.slug], days: daysLeft(settings.dueDates[r.week.slug], now) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const nearest = deadlines.find((d) => d.days >= 0) ?? deadlines[deadlines.length - 1];
  const overdue = deadlines.filter((d) => d.days < 0);

  // ── 진행률(따로 계산)
  const sectionsDone = rows.reduce((sum, r) => sum + r.status.tiers.core.done, 0);
  const sectionsTotal = rows.reduce((sum, r) => sum + r.status.tiers.core.total, 0);
  const supplementDone = rows.reduce((sum, r) => sum + r.status.tiers.supplement.done, 0);
  const supplementTotal = rows.reduce((sum, r) => sum + r.status.tiers.supplement.total, 0);
  const advancedEarned = rows.reduce((sum, r) => sum + r.advanced.earned, 0);
  const advancedTotal = rows.reduce((sum, r) => sum + r.advanced.total, 0);
  const advancedWeeks = rows.filter((r) => r.advanced.complete);
  const worksheetsDone = rows.filter((r) => r.status.worksheetSubmitted).length;
  const submitted = rows.filter((r) => r.status.assignment.status !== "none").length;
  const graded = rows.filter((r) => r.status.assignment.status === "graded");
  const revisions = rows.filter((r) => r.status.assignment.status === "revision").length;
  const scoreSum = graded.reduce((sum, r) => sum + (r.status.assignment.score ?? 0), 0);
  const scoreMax = graded.reduce((sum, r) => sum + r.status.assignment.maxScore, 0);
  const overall = rows.reduce((sum, r) => sum + r.status.ratio, 0) / rows.length;
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="mb-1 text-sm font-bold text-[var(--series-blue)]">내 학습 진도</p>
      <h1 className="mb-6 text-3xl font-black text-ink">오늘은 이것부터</h1>

      {/* ── 첫 영역: 다음 행동 ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="today-heading" className="rounded-xl border border-[var(--series-blue)] bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="today-heading" className="text-lg font-black text-ink">
              오늘 할 일
            </h2>
            {todayMinutes > 0 && <p className="text-sm font-bold text-ink-secondary">예상 {hoursLabel(todayMinutes)}</p>}
          </div>
          {today.length === 0 ? (
            <p className="mt-3 text-sm text-ink-secondary">8주 과정을 모두 마쳤습니다. 복습 노트와 피드백함으로 부족한 부분을 채워 보십시오.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {today.map((t, i) => (
                <li key={t.href + i}>
                  <Link
                    href={t.href}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border-hairline)] px-3 py-2.5 transition hover:border-[var(--series-blue)]"
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
              {focus.week.number}주차에 남은 학습 {hoursLabel(weekRemaining)} (핵심 단계·백지공부·과제 포함)
            </p>
            <Link
              href={next ? `/weeks/${focus.week.slug}/sections/${next.id}` : `/weeks/${focus.week.slug}`}
              className="rounded-lg bg-[var(--series-blue)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              이어서 학습 →
            </Link>
          </div>
        </section>

        <div className="grid gap-4">
          <section aria-labelledby="due-heading" className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
            <h2 id="due-heading" className="text-sm font-black text-ink-muted">
              가장 가까운 마감
            </h2>
            {nearest ? (
              <Link href={`/weeks/${nearest.row.week.slug}/assignment`} className="mt-1 block hover:underline">
                <span className="text-lg font-black text-ink">{nearest.row.week.number}주차 과제</span>{" "}
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: nearest.days < 0 ? "var(--status-critical)" : nearest.days <= 2 ? "var(--series-orange)" : "var(--series-blue)" }}
                >
                  {nearest.days < 0 ? `${-nearest.days}일 지남` : nearest.days === 0 ? "오늘 마감" : `D-${nearest.days}`}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{formatDate(dueDateEnd(nearest.date).toISOString())} 23:59까지</span>
              </Link>
            ) : (
              <p className="mt-1 text-sm text-ink-secondary">{focus.week.dueNote}</p>
            )}
            {overdue.length > 1 && <p className="mt-1 text-xs font-bold text-[var(--status-critical)]">마감이 지난 과제가 {overdue.length}개 있습니다.</p>}
          </section>

          <Link
            href="/feedback"
            className={`block rounded-xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
              fb.newCount > 0 ? "border-[var(--series-orange)]" : "border-[var(--border-hairline)]"
            }`}
          >
            <h2 className="text-sm font-black text-ink-muted">새 운영자 피드백</h2>
            <p className="mt-1 text-lg font-black text-ink">
              {fb.newCount > 0 ? `${fb.newCount}개 확인하지 않음` : "새 피드백 없음"}
            </p>
            <p className="text-xs text-ink-muted">채점 결과 · 재제출 요청 · 채팅 → 피드백함</p>
          </Link>

          <section aria-labelledby="review-heading" className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
            <h2 id="review-heading" className="text-sm font-black text-ink-muted">
              복습이 필요한 개념
            </h2>
            {fb.review.length === 0 ? (
              <p className="mt-1 text-sm text-ink-secondary">아직 없습니다.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {fb.review.slice(0, 3).map((r) => (
                  <li key={`${r.weekSlug}:${r.sectionId}`}>
                    <Link href={r.href} className="text-ink-secondary hover:text-[var(--series-blue)]">
                      <strong className="text-ink">
                        {r.weekNumber}주 {r.sectionLabel}
                      </strong>{" "}
                      {r.sectionTitle}
                    </Link>
                  </li>
                ))}
                {fb.review.length > 3 && (
                  <li>
                    <Link href="/feedback" className="text-xs font-bold text-[var(--series-blue)]">
                      외 {fb.review.length - 3}개 더 보기 →
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* ── 진행률: 학습 / 백지공부 / 과제 / 피드백 확인을 따로 ─────── */}
      <h2 className="mt-12 mb-3 text-xl font-black text-ink">진행 현황</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Rate label="핵심 학습 진행률" percent={pct(sectionsDone, sectionsTotal)} detail={`핵심 단계 ${sectionsDone}/${sectionsTotal}`} />
        <Rate label="백지공부" percent={pct(worksheetsDone, rows.length)} detail={`제출 ${worksheetsDone}/${rows.length}주`} />
        <Rate
          label="과제"
          percent={pct(submitted, rows.length)}
          detail={`제출 ${submitted}/${rows.length} · 채점 ${graded.length}${revisions ? ` · 재제출 ${revisions}` : ""}`}
        />
        <Rate
          label="피드백 확인"
          percent={fb.gradesTotal + (fb.chatUnread > 0 ? 1 : 0) === 0 ? 100 : pct(fb.gradesSeen, fb.gradesTotal + (fb.chatUnread > 0 ? 1 : 0))}
          detail={fb.gradesTotal === 0 && fb.chatUnread === 0 ? "받은 피드백 없음" : `확인 ${fb.gradesSeen}/${fb.gradesTotal}${fb.chatUnread ? ` · 안 읽은 채팅 ${fb.chatUnread}` : ""}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-card p-4">
        <ProgressRing ratio={overall} size={52} />
        <div>
          <p className="text-lg font-black text-ink">전체 {Math.round(overall * 100)}%</p>
          <p className="text-xs text-ink-muted">핵심 학습 자료·백지공부·과제 제출을 반영한 진행률(보충·심화는 아래에 따로 기록)</p>
        </div>
        <p className="ml-auto text-sm text-ink-secondary">
          채점된 과제 합계 <strong className="text-ink">{graded.length ? `${scoreSum}/${scoreMax}점` : "아직 없음"}</strong>
        </p>
      </div>

      {/* ── 보충·심화: 주차 완료와 별개의 선택 기록 ───────────── */}
      <h2 className="mt-10 mb-1 text-xl font-black text-ink">보충 · 심화 기록</h2>
      <p className="mb-3 text-sm text-ink-muted">
        주차 완료와 별개로 쌓이는 선택 과정입니다. 한 주의 심화 단계·심화 실습·과제 심화 문제를 모두 마치면 그 주에 <strong>✦ 심화 달성</strong>이 표시됩니다.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Rate label="보충 단계" percent={pct(supplementDone, supplementTotal)} detail={`보충 단계 ${supplementDone}/${supplementTotal}`} />
        <Rate label="심화 기록" percent={pct(advancedEarned, advancedTotal)} detail={`심화 단계·실습·심화 문제 ${advancedEarned}/${advancedTotal}`} />
        <div className="rounded-xl border bg-card p-4" style={{ borderColor: advancedWeeks.length > 0 ? TIER_INFO.advanced.color : "var(--border-hairline)" }}>
          <p className="flex items-center gap-2 text-xs font-bold text-ink-muted">
            심화 달성 <TierBadge tier="advanced" compact />
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-ink">
            {advancedWeeks.length}
            <span className="text-sm font-bold text-ink-muted"> / {rows.length}주</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            {advancedWeeks.length > 0 ? advancedWeeks.map((r) => `${r.week.number}주차`).join(" · ") : "아직 없습니다. 핵심 과정을 마친 주차부터 도전해 보십시오."}
          </p>
        </div>
      </div>

      <h2 className="mt-10 mb-3 text-xl font-black text-ink">주차별 기록</h2>
      <div className="space-y-3">
        {rows.map(({ week, status, grade, supplement, advanced }) => (
          <Link
            key={week.slug}
            href={status.currentSection ? `/weeks/${week.slug}/sections/${status.currentSection.id}` : `/weeks/${week.slug}`}
            className="flex items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]"
          >
            <ProgressRing ratio={status.ratio} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {week.number}주차 · {week.title}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                <span className={status.coreDone ? "text-[var(--status-good)]" : ""}>
                  {status.coreDone ? "✓" : "○"} 핵심 {status.tiers.core.done}/{status.tiers.core.total}
                </span>
                <span className={status.worksheetSubmitted ? "text-[var(--status-good)]" : ""}>
                  {status.worksheetSubmitted ? "✓" : "○"} 백지공부
                </span>
                <span className={status.assignment.status !== "none" ? "text-[var(--status-good)]" : ""}>
                  {status.assignment.status !== "none" ? "✓" : "○"} 과제 {ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
                  {status.assignment.status === "graded" && ` ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`}
                </span>
                {settings.dueDates[week.slug] && <span>마감 {settings.dueDates[week.slug].slice(5).replace("-", "/")}</span>}
                {supplement.sections.total > 0 && (
                  <span className={supplement.complete ? "text-[var(--status-good)]" : ""}>
                    보충 {supplement.sections.done}/{supplement.sections.total}
                  </span>
                )}
                {advanced.total > 0 && (
                  <span style={advanced.complete ? { color: TIER_INFO.advanced.color, fontWeight: 700 } : undefined}>
                    {advanced.complete ? "✦ 심화 달성" : `심화 ${advanced.earned}/${advanced.total}`}
                  </span>
                )}
              </div>
              {grade?.decision === "revision" && (
                <p className="mt-1 text-xs font-bold text-[var(--status-serious)]">운영자가 재제출을 요청했습니다.</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-bold text-[var(--series-blue)]">{status.currentSection ? "이어서 →" : "보기 →"}</span>
          </Link>
        ))}
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
