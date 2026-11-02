import Link from "next/link";
import { securitySummary } from "@/lib/securityEvents";
import { requireAdmin } from "@/lib/dal";
import { countSubmissionsByStatus } from "@/lib/submissionStore";
import { adminUnreadTotal } from "@/lib/chatView";
import { countUsersByRole } from "@/lib/userStore";
import { checkStatMap, COURSE_ASSIGNMENT_KEYS, moduleActivity } from "@/lib/operatorStats";
import { cohortWeek, dueDateEnd, getSettings } from "@/lib/settingsStore";
import { SCHEDULE } from "@/content/curriculum/schedule";
import { getModule, moduleOfAssignment } from "@/content/course";
import { formatDate } from "@/lib/datetime";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";

export const metadata = { title: "운영자 대시보드" };

// 운영자 화면 사이 이동은 위의 운영자 메뉴가 맡는다. 대시보드는 지금 할 일, 이번 주 일정, 모듈별 학습 현황을 보여 준다.
export default async function OperatorHome() {
  await requireAdmin("/operator");
  const security = securitySummary();
  const byStatus = countSubmissionsByStatus(COURSE_ASSIGNMENT_KEYS);
  const pending = byStatus.submitted;
  const totalSubmissions = byStatus.submitted + byStatus.graded + byStatus.revision;
  const questions = adminUnreadTotal().conversations;
  const members = countUsersByRole().member;
  const lowChecks = [...checkStatMap().values()].filter((s) => s.low).length;
  const activity = moduleActivity().filter((a) => a.coreTotal > 0 || a.module.assignment);
  const settings = getSettings();
  const week = cohortWeek();
  const thisWeek = week ? SCHEDULE.find((w) => w.week === week) : undefined;

  const stats = [
    { label: "채점 대기", value: pending, href: "/operator/submissions?status=submitted", hot: pending > 0 },
    { label: "새 메시지", value: questions, href: "/operator/chat", hot: questions > 0 },
    { label: "전체 제출", value: totalSubmissions, href: "/operator/submissions", hot: false },
    { label: "스터디원", value: members, href: "/operator/members", hot: false },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="운영자 대시보드"
        actions={
          <form action="/logout" method="post">
            <button className="btn btn-ghost btn-sm">로그아웃</button>
          </form>
        }
      />
      <Link href="/operator/security" className={`callout mt-6 block ${security.high > 0 ? "callout-warn" : "callout-good"}`}>
        보안 센터 · 최근 24시간 높은 위험 신호 {security.high}건 · 요청 한도 초과 {security.limited}건 → 확인하기
      </Link>
      {pending > 0 ? (
        <NextStep
          title={`채점을 기다리는 과제 ${pending}건`}
          detail={questions > 0 ? `답변을 기다리는 채팅 ${questions}건` : "오래 기다린 제출물부터 채점합니다"}
          href="/operator/submissions?status=submitted"
          cta="채점하기"
        />
      ) : questions > 0 ? (
        <NextStep title={`답변을 기다리는 채팅 ${questions}건`} href="/operator/chat" cta="답변하기" />
      ) : null}

      <dl className="mt-12 grid grid-cols-2 border-y border-[var(--border-hairline)] lg:grid-cols-4">
        {stats.map((st, i) => (
          <Link
            key={st.label}
            href={st.href}
            className={`group py-6 pr-4 transition ${i % 2 === 1 ? "border-l border-[var(--border-hairline)] pl-5" : ""} ${i >= 2 ? "border-t border-[var(--border-hairline)] lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-5" : ""}`}
          >
            <dt className="text-xs text-ink-muted transition group-hover:text-ink">{st.label}</dt>
            <dd className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] tabular-nums ${st.hot ? "text-[var(--accent)]" : "text-ink"}`}>{st.value}</dd>
          </Link>
        ))}
      </dl>

      <section aria-labelledby="week-heading" className="mt-14">
        <h2 id="week-heading" className="section-title mb-3">
          이번 주 일정
        </h2>
        {!settings.cohortStart ? (
          <p className="text-sm leading-relaxed text-ink-muted">
            기수 시작일을 정하면 기본 일정표(16주)에 따라 이번 주 학습 범위와 제출물을 보여 줍니다.{" "}
            <Link href="/operator/settings" className="font-medium text-ink underline underline-offset-4">
              운영 설정
            </Link>
          </p>
        ) : !thisWeek ? (
          <p className="text-sm text-ink-muted">
            {week === 0 ? `기수 시작 전입니다(시작일 ${formatDate(`${settings.cohortStart}T00:00:00+09:00`)}).` : "기본 일정표의 16주가 끝났습니다."}
          </p>
        ) : (
          <div className="border-y border-[var(--border-hairline)] py-4 text-sm">
            <p className="font-medium text-ink">{thisWeek.week}주 차</p>
            <p className="mt-1.5 text-ink-secondary">
              학습: {thisWeek.modules.map((slug) => getModule(slug)).filter(Boolean).map((m) => `${m!.code} ${m!.title}`).join(", ")}
            </p>
            {thisWeek.due.length > 0 && (
              <p className="mt-1 text-ink-secondary">
                제출:{" "}
                {thisWeek.due
                  .map((key) => {
                    const m = moduleOfAssignment(key);
                    if (!m?.assignment) return key;
                    const due = settings.dueDates[key];
                    return `${m.code} ${m.assignment.title}${due ? ` (마감 ${formatDate(dueDateEnd(due).toISOString())})` : " (마감일 미정)"}`;
                  })
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="activity-heading" className="mt-14">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="activity-heading" className="section-title">
            모듈별 학습 현황
          </h2>
          <Link href="/operator/content" className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
            {lowChecks > 0 ? `첫 시도 정답률이 낮은 확인 문제 ${lowChecks}개 →` : "콘텐츠 통계 →"}
          </Link>
        </div>
        <p className="mb-4 text-xs text-ink-muted">스터디원 {members}명 기준 · 시작: 핵심 레슨을 하나 이상 완료 · 완료: 핵심 레슨을 모두 완료</p>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
          <table className="data-table">
            <thead>
              <tr>
                {["모듈", "핵심 레슨", "시작", "완료", "과제 제출", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map(({ module, coreTotal, started, finished, submissions }) => {
                const total = submissions.submitted + submissions.graded + submissions.revision;
                return (
                  <tr key={module.slug}>
                    <td className="min-w-[14rem]">
                      <span className="mr-2 font-mono text-xs text-ink-muted">{module.code}</span>
                      <span className="text-ink">{module.title}</span>
                    </td>
                    <td className="tabular-nums text-ink-secondary">{coreTotal || "—"}</td>
                    <td className="tabular-nums text-ink-secondary">{coreTotal ? started : "—"}</td>
                    <td className="tabular-nums text-ink-secondary">{coreTotal ? finished : "—"}</td>
                    <td className="whitespace-nowrap tabular-nums text-ink-secondary">
                      {module.assignment ? (
                        <Link href={`/operator/submissions?assignment=${module.assignment.key}`} className="underline-offset-2 hover:text-ink hover:underline">
                          {total}건{submissions.submitted > 0 && <span className="text-[var(--accent)]"> · 대기 {submissions.submitted}</span>}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right">
                      <Link href={`/operator/content/${module.slug}`} className="btn btn-ghost btn-sm">
                        문항 통계
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
