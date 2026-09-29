import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubmissions, latestGrade, latestVersion, type SubmissionStatus } from "@/lib/submissionStore";
import { listUsers } from "@/lib/userStore";
import { WEEKS } from "@/content/weeks";
import { listConversations, unreadCount } from "@/lib/chatStore";
import { formatDateTime } from "@/lib/datetime";

export const metadata = { title: "과제 채점" };

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  submitted: "채점 대기",
  graded: "채점 완료",
  revision: "재제출 요청",
};

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  submitted: "var(--series-blue)",
  graded: "var(--status-good)",
  revision: "var(--status-serious)",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; status?: string }>;
}) {
  await requireAdmin("/operator/submissions");
  const { week, status } = await searchParams;
  const users = new Map(listUsers().map((u) => [u.id, u]));
  const all = listSubmissions();
  const filtered = all.filter(
    (s) => (!week || s.weekSlug === week) && (!status || s.status === status)
  );
  // 채점 대기 → 재제출 요청 → 채점 완료 순, 같은 상태에서는 오래 기다린 것부터
  const order: Record<SubmissionStatus, number> = { submitted: 0, revision: 1, graded: 2 };
  filtered.sort((a, b) => order[a.status] - order[b.status] || a.updatedAt.localeCompare(b.updatedAt));
  const pendingCount = all.filter((s) => s.status === "submitted").length;
  const unansweredThreads = listConversations().filter((c) => unreadCount(c, "admin") > 0);

  const filterHref = (next: { week?: string; status?: string }) => {
    const params = new URLSearchParams();
    const w = "week" in next ? next.week : week;
    const st = "status" in next ? next.status : status;
    if (w) params.set("week", w);
    if (st) params.set("status", st);
    const qs = params.toString();
    return `/operator/submissions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/operator" className="text-sm font-bold text-[var(--series-orange)] hover:underline">← 운영자 대시보드</Link>
      <h1 className="mt-5 text-3xl font-black text-ink">과제 채점</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        전체 제출 {all.length}건 · 채점 대기 <strong className="text-ink">{pendingCount}</strong>건 · 답변을 기다리는 질문{" "}
        <strong className="text-ink">{unansweredThreads.length}</strong>건. 채점 대기 중인 제출물이 위에, 오래 기다린 순서로 표시됩니다.
      </p>

      {unansweredThreads.length > 0 && (
        <section aria-labelledby="questions-heading" className="mt-6 rounded-xl border border-[var(--series-orange)] bg-card p-4">
          <h2 id="questions-heading" className="text-sm font-black text-ink">답변을 기다리는 질문</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {unansweredThreads.map((t) => {
              const u = users.get(t.userId);
              const last = t.messages[t.messages.length - 1];
              return (
                <li key={t.userId} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="min-w-0">
                    <strong className="text-ink">{u?.name ?? "(탈퇴한 사용자)"}</strong>
                    <span className="text-ink-muted"> · {formatDateTime(t.updatedAt)}</span>
                    <span className="block truncate text-ink-secondary">{last?.text.slice(0, 120)}</span>
                  </span>
                  <Link
                    href={`/operator/chat/${t.userId}`}
                    className="shrink-0 rounded-md bg-[var(--series-orange)] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                  >
                    답변하기
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
        <FilterChip href={filterHref({ week: undefined })} active={!week} label="전체 주차" />
        {WEEKS.map((w) => (
          <FilterChip key={w.slug} href={filterHref({ week: w.slug })} active={week === w.slug} label={`${w.number}주차`} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <FilterChip href={filterHref({ status: undefined })} active={!status} label="전체 상태" />
        {(Object.keys(STATUS_LABEL) as SubmissionStatus[]).map((s) => (
          <FilterChip key={s} href={filterHref({ status: s })} active={status === s} label={STATUS_LABEL[s]} />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-card-2)] text-left">
              {["상태", "주차", "스터디원", "최근 제출", "버전", "점수", ""].map((h) => (
                <th key={h} className="border-b border-[var(--border-hairline)] px-3 py-2 font-bold text-ink">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-ink-muted">조건에 맞는 제출물이 없습니다.</td>
              </tr>
            )}
            {filtered.map((s) => {
              const w = WEEKS.find((x) => x.slug === s.weekSlug);
              const user = users.get(s.userId);
              const grade = latestGrade(s);
              const latest = latestVersion(s);
              return (
                <tr key={s.id} className="even:bg-[var(--surface-card-2)]/40">
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2">
                    <span className="text-xs font-bold" style={{ color: STATUS_COLOR[s.status] }}>{STATUS_LABEL[s.status]}</span>
                  </td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-ink-secondary">{w?.number ?? "?"}주차</td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2">
                    <span className="font-medium text-ink">{user?.name ?? "(탈퇴한 사용자)"}</span>
                    <span className="block text-xs text-ink-muted">{user?.email}</span>
                  </td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-xs text-ink-muted">{formatDateTime(latest.submittedAt)}</td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-ink-secondary">v{latest.version}</td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-ink-secondary">
                    {grade?.decision === "graded" ? `${grade.score}/${grade.maxScore}` : "-"}
                  </td>
                  <td className="border-b border-[var(--border-hairline)] px-3 py-2 text-right">
                    <Link
                      href={`/operator/submissions/${s.id}`}
                      className="rounded-md bg-[var(--series-orange)] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                    >
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
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-[var(--series-orange)] bg-[var(--series-orange)] text-white"
          : "border-[var(--border-hairline)] text-ink-secondary hover:border-[var(--series-orange)]"
      }`}
    >
      {label}
    </Link>
  );
}
