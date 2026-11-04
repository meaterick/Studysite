import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getLearningRecord, learningActivityByWeek, learningUpdatedAt } from "@/lib/learningStore";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { ASSIGNMENT_STATUS_LABEL, weekStatus } from "@/lib/study";
import { WEEKS } from "@/content/weeks";
import type { Tier } from "@/content/tiers";
import { tierRecord } from "@/lib/achievement";
import ProgressRing from "@/components/ProgressRing";
import Icon from "@/components/Icon";
import { formatDateTime, formatDate } from "@/lib/datetime";
import MemberWeekRecord from "./MemberWeekRecord";

export const metadata = { title: "스터디원 학습 기록" };

// 스터디원 한 명의 학습 기록 전체. 위에는 주차별 요약, 아래에는 고른 주차의 기록을 모두 펼쳐 보여 준다
// (단계 진행·확인 문제 오답·서술형·백지공부·코딩 실습·추가 퀴즈·과제 제출본과 작성 중인 초안).
export default async function MemberLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin("/operator/members");
  const { id } = await params;
  const { week: weekParam } = await searchParams;
  const member = findUserById(id);
  if (!member) notFound();
  const learning = getLearningRecord(id);
  const submissions = listUserSubmissions(id);
  const activity = learningActivityByWeek(id);
  const lastActivity = learningUpdatedAt(id);
  const rows = WEEKS.map((week) => {
    const submission = submissions.find((s) => s.weekSlug === week.slug);
    return { week, submission, status: weekStatus(week, learning, submission) };
  });
  const sum = (tier: Tier, key: "done" | "total") => rows.reduce((acc, r) => acc + r.status.tiers[tier][key], 0);
  const advancedWeeks = rows.filter((r) => tierRecord(r.week, learning, r.status, "advanced").complete).length;

  // 주차를 고르지 않았으면 가장 최근에 학습한 주차를 펼친다.
  const recentWeek = [...activity].sort((a, b) => b[1].localeCompare(a[1]))[0]?.[0];
  const selected = rows.find((r) => r.week.slug === weekParam) ?? rows.find((r) => r.week.slug === recentWeek) ?? rows[0];
  const draft = readDraftSafe(id, selected.week.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/operator/members", label: "스터디원 관리" }}
        title={`${member.name}님의 학습 기록`}
        description={`${member.email} · 가입일 ${formatDate(member.createdAt)}`}
        actions={
          <Link href={`/operator/chat/${member.id}`} className="btn btn-secondary btn-sm">
            채팅
          </Link>
        }
      />

      <div className="mb-14 grid grid-cols-1 border-y border-[var(--border-hairline)] sm:grid-cols-2">
        <Stat label="핵심 단계(주차 완료 기준)" value={`${sum("core", "done")} / ${sum("core", "total")}`} />
        <Stat
          label="보충 · 심화 단계"
          value={`보충 ${sum("supplement", "done")}/${sum("supplement", "total")} · 심화 ${sum("advanced", "done")}/${sum("advanced", "total")}${advancedWeeks > 0 ? ` · 심화 달성 ${advancedWeeks}주` : ""}`}
        />
        <Stat label="과제 제출" value={`${submissions.length} / ${WEEKS.length}주차`} />
        <Stat label="마지막 학습 기록" value={lastActivity ? formatDateTime(lastActivity) : "아직 없음"} />
      </div>

      <h2 className="section-title mb-2">주차별 진행</h2>
      <ul className="rows border-y border-[var(--border-hairline)]">
        {rows.map(({ week, status }) => {
          const current = week.slug === selected.week.slug;
          const at = activity.get(week.slug);
          return (
            <li key={week.slug}>
              <Link
                href={`/operator/members/${member.id}?week=${week.slug}#week-record`}
                aria-current={current ? "true" : undefined}
                className={`group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 ${current ? "bg-[var(--surface-card-2)]" : ""}`}
              >
                <ProgressRing ratio={status.ratio} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-ink">
                    {week.number}주차 · {week.title}
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-ink-muted">
                    핵심 {status.tiers.core.done}/{status.tiers.core.total} · 보충 {status.tiers.supplement.done}/{status.tiers.supplement.total} · 심화{" "}
                    {status.tiers.advanced.done}/{status.tiers.advanced.total} · 백지공부 {status.worksheetSubmitted ? "제출" : "미제출"} · 과제{" "}
                    {ASSIGNMENT_STATUS_LABEL[status.assignment.status]}
                    {status.assignment.status === "graded" && ` ${status.assignment.score}/${status.assignment.maxScore}점`}
                  </span>
                </span>
                <span className="hidden shrink-0 text-xs tabular-nums text-ink-muted sm:block">{at ? formatDateTime(at) : "기록 없음"}</span>
                <Icon name={current ? "chevronDown" : "chevronRight"} size={16} className="shrink-0 text-ink-muted" />
              </Link>
            </li>
          );
        })}
      </ul>

      <section id="week-record" aria-labelledby="week-record-heading" className="mt-16 scroll-mt-20">
        <p className="eyebrow">{member.name}님의 기록</p>
        <h2 id="week-record-heading" className="mt-1 text-[1.5rem] font-bold tracking-[-0.03em] text-ink">
          {selected.week.number}주차 · {selected.week.title}
        </h2>
        <div className="mt-5">
          <MemberWeekRecord
            memberId={member.id}
            week={selected.week}
            status={selected.status}
            learning={learning}
            submission={selected.submission}
            draftSavedAt={draft ? (draft.updatedAt ?? "") : undefined}
          />
        </div>
      </section>
    </div>
  );
}

/** 초안 파일을 읽지 못해도(손상·권한) 화면은 그대로 보여 준다. */
function readDraftSafe(userId: string, slug: string) {
  try {
    return readDraft(userId, slug);
  } catch {
    return undefined;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[var(--border-hairline)] py-4 pr-4 sm:even:border-l sm:even:pl-5 [&:nth-child(n+2)]:border-t sm:[&:nth-child(2)]:border-t-0">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium tabular-nums text-ink">{value}</p>
    </div>
  );
}
