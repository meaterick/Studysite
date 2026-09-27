import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { deleteUser, listUsers } from "@/lib/userStore";
import { listLearningRecords } from "@/lib/learningStore";
import { listSubmissions, type Submission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";
import { WEEKS } from "@/content/weeks";
import { formatDateTime, formatDate } from "@/lib/datetime";

export const metadata = { title: "스터디원 관리" };

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "스터디원" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin("/operator/members");
  const { error } = await searchParams;
  const members = listUsers();
  const adminCount = members.filter((m) => m.role === "admin").length;
  const learning = listLearningRecords();
  const submissions = listSubmissions();

  async function removeMember(formData: FormData) {
    "use server";
    const actingAdmin = await requireAdmin("/operator/members");
    const id = String(formData.get("id") ?? "");
    if (id === actingAdmin.id) {
      redirect("/operator/members?error=self");
    }
    const target = listUsers().find((u) => u.id === id);
    if (target?.role === "admin" && listUsers().filter((u) => u.role === "admin").length <= 1) {
      redirect("/operator/members?error=lastadmin");
    }
    await deleteUser(id);
    redirect("/operator/members");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용</p>
      <h1 className="mb-2 text-3xl font-black text-ink">스터디원 관리</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        총 {members.length}명 가입 · 관리자 {adminCount}명. 단계 진도·과제 현황을 확인하고 계정 삭제만 할 수 있습니다.
      </p>

      {error === "lastadmin" && (
        <p className="mb-4 rounded-lg border-l-4 px-4 py-2 text-sm font-medium text-[var(--status-critical)]" style={{ borderColor: "var(--status-critical)", background: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
          마지막 관리자 계정은 강등하거나 삭제할 수 없습니다.
        </p>
      )}
      {error === "self" && (
        <p className="mb-4 rounded-lg border-l-4 px-4 py-2 text-sm font-medium text-[var(--status-critical)]" style={{ borderColor: "var(--status-critical)", background: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
          본인 계정은 이 화면에서 삭제할 수 없습니다. 탈퇴는 &lsquo;내 계정&rsquo; 페이지를 이용해 주십시오.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-card-2)]">
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">이름</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">이메일</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">역할</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">가입일</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">단계 진도</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">과제</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">마지막 기록</th>
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                adminId={admin.id}
                learning={learning[m.id]}
                submissions={submissions.filter((s) => s.userId === m.id)}
                removeMember={removeMember}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  adminId,
  learning,
  submissions,
  removeMember,
}: {
  member: ReturnType<typeof listUsers>[number];
  adminId: string;
  learning: ReturnType<typeof listLearningRecords>[string] | undefined;
  submissions: Submission[];
  removeMember: (formData: FormData) => Promise<void>;
}) {
  const record = learning ?? { sections: {}, worksheets: {} };
  const statuses = WEEKS.map((w) => weekStatus(w, record, submissions.find((s) => s.weekSlug === w.slug)));
  const completed = statuses.reduce((sum, st) => sum + st.sectionsDone, 0);
  const totalItems = statuses.reduce((sum, st) => sum + st.sectionsTotal, 0);
  const pending = submissions.filter((s) => s.status === "submitted").length;
  const graded = submissions.filter((s) => s.status === "graded").length;

  return (
    <tr className="odd:bg-transparent even:bg-[var(--surface-card-2)]/40">
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top font-medium text-ink">
        {member.name} {member.id === adminId && <span className="text-xs text-ink-muted">(나)</span>}
      </td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{member.email}</td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{ROLE_LABEL[member.role]}</td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{formatDate(member.createdAt)}</td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{completed} / {totalItems}</td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">
        제출 {submissions.length} · 채점 {graded}
        {pending > 0 && <span className="ml-1 font-bold text-[var(--series-orange)]">· 대기 {pending}</span>}
      </td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-xs text-ink-muted">{learning?.updatedAt ? formatDateTime(learning.updatedAt) : "기록 없음"}</td>
      <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top">
        <div className="flex flex-wrap gap-2">
          <Link href={`/operator/members/${member.id}`} className="rounded-md border border-[var(--border-hairline)] px-2 py-1 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">상세 보기</Link>
          <form action={removeMember}>
            <input type="hidden" name="id" value={member.id} />
            <button className="rounded-md border px-2 py-1 text-xs font-bold text-white" style={{ background: "var(--status-critical)", borderColor: "var(--status-critical)" }}>삭제</button>
          </form>
        </div>
      </td>
    </tr>
  );
}
