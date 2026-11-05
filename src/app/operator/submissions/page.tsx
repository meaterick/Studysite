import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubmissionSummaries, type SubmissionStatus } from "@/lib/submissionStore";
import { listUsers } from "@/lib/userStore";
import { MODULES, moduleOfAssignment } from "@/content/course";
import { dueDateEnd, getSettings } from "@/lib/settingsStore";
import { listConversationSummaries } from "@/lib/chatStore";
import { formatDateTime } from "@/lib/datetime";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

export const metadata = { title: "과제 채점" };

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  submitted: "채점 대기",
  graded: "채점 완료",
  revision: "재제출 요청",
};

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  submitted: "var(--accent)",
  graded: "var(--status-good)",
  revision: "var(--status-serious)",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; status?: string }>;
}) {
  await requireAdmin("/operator/submissions");
  const { assignment, status } = await searchParams;
  const users = new Map(listUsers().map((u) => [u.id, u]));
  const { dueDates } = getSettings();
  // 새 과정의 과제 제출물만 다룬다(이전 8주 과정의 제출물은 DB에 남아 있지만 화면에 표시하지 않는다).
  const assignments = MODULES.flatMap((m) => (m.assignment ? [{ module: m, spec: m.assignment }] : []));
  const all = listSubmissionSummaries().filter((s) => !!moduleOfAssignment(s.assignmentKey));
  const filtered = all.filter((s) => (!assignment || s.assignmentKey === assignment) && (!status || s.status === status));
  // 채점 대기 → 재제출 요청 → 채점 완료 순, 같은 상태에서는 오래 기다린 것부터
  const order: Record<SubmissionStatus, number> = { submitted: 0, revision: 1, graded: 2 };
  filtered.sort((a, b) => order[a.status] - order[b.status] || a.updatedAt.localeCompare(b.updatedAt));
  const pendingCount = all.filter((s) => s.status === "submitted").length;
  const unansweredThreads = listConversationSummaries().filter((c) => c.unreadForAdmin > 0);

  const filterHref = (next: { assignment?: string; status?: string }) => {
    const params = new URLSearchParams();
    const a = "assignment" in next ? next.assignment : assignment;
    const st = "status" in next ? next.status : status;
    if (a) params.set("assignment", a);
    if (st) params.set("status", st);
    const qs = params.toString();
    return `/operator/submissions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="과제 채점"
        description={
          <span className="tabular-nums">
            전체 {all.length} · 채점 대기 <strong className="font-semibold text-ink">{pendingCount}</strong> · 답변 대기 질문{" "}
            <strong className="font-semibold text-ink">{unansweredThreads.length}</strong>
          </span>
        }
      />

      {unansweredThreads.length > 0 && (
        <section aria-labelledby="questions-heading" className="mb-12">
          <h2 id="questions-heading" className="mb-2 text-[13px] font-medium text-ink-muted">
            답변을 기다리는 질문
          </h2>
          <ul className="rows border-y border-[var(--border-hairline)]">
            {unansweredThreads.map((t) => {
              const u = users.get(t.userId);
              return (
                <li key={t.userId}>
                  <Link href={`/operator/chat/${t.userId}`} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-ink">{u?.name ?? "(탈퇴한 사용자)"}</span>
                      <span className="ml-2 text-xs tabular-nums text-ink-muted">{formatDateTime(t.updatedAt)}</span>
                      <span className="mt-0.5 block truncate text-ink-muted">{t.lastText?.slice(0, 120)}</span>
                    </span>
                    <span className="shrink-0 text-[13px] font-medium text-ink">답변하기</span>
                    <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-1">
        <FilterChip href={filterHref({ assignment: undefined })} active={!assignment} label="전체 과제" />
        {assignments.map(({ module, spec }) => (
          <FilterChip key={spec.key} href={filterHref({ assignment: spec.key })} active={assignment === spec.key} label={`${module.code} ${spec.title}`} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <FilterChip href={filterHref({ status: undefined })} active={!status} label="전체 상태" />
        {(Object.keys(STATUS_LABEL) as SubmissionStatus[]).map((s) => (
          <FilterChip key={s} href={filterHref({ status: s })} active={status === s} label={STATUS_LABEL[s]} />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
        <table className="data-table">
          <thead>
            <tr>
              {["상태", "과제", "스터디원", "최근 제출", "버전", "점수", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-muted">
                  조건에 맞는 제출물이 없습니다.
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const mod = moduleOfAssignment(s.assignmentKey)!;
              const user = users.get(s.userId);
              const grade = s.latestGrade;
              const due = dueDates[s.assignmentKey];
              const late = !!due && new Date(s.latestSubmittedAt) > dueDateEnd(due);
              return (
                <tr key={s.id}>
                  <td>
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-secondary">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="min-w-[12rem] text-ink-secondary">
                    <span className="font-mono text-xs text-ink-muted">{mod.code}</span> {mod.assignment?.title}
                  </td>
                  <td>
                    <span className="font-medium text-ink">{user?.name ?? "(탈퇴한 사용자)"}</span>
                    <span className="block text-xs text-ink-muted">{user?.email}</span>
                  </td>
                  <td className="whitespace-nowrap text-xs tabular-nums text-ink-muted">
                    {formatDateTime(s.latestSubmittedAt)}
                    {late && <span className="block text-[var(--status-serious)]">마감 후 제출</span>}
                  </td>
                  <td className="tabular-nums text-ink-secondary">v{s.latestVersion}</td>
                  <td className="tabular-nums text-ink-secondary">{grade?.decision === "graded" ? `${grade.score}/${grade.maxScore}` : "-"}</td>
                  <td className="text-right">
                    <Link href={`/operator/submissions/${s.id}`} className={`btn btn-sm ${s.status === "submitted" ? "btn-primary" : "btn-secondary"}`}>
                      {s.status === "submitted" ? "채점하기" : "보기"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className="chip">
      {label}
    </Link>
  );
}
