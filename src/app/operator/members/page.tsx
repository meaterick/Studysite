import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { deleteUser, listUsers } from "@/lib/userStore";
import { listLearningRecords } from "@/lib/learningStore";
import { listSubmissions, type Submission } from "@/lib/submissionStore";
import { weekStatus } from "@/lib/study";
import { WEEKS } from "@/content/weeks";
import { formatDateTime, formatDate } from "@/lib/datetime";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

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
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="스터디원 관리" description={`가입 ${members.length}명 · 관리자 ${adminCount}명`} />

      {error === "lastadmin" && (
        <p role="alert" className="callout callout-danger mb-6 text-[var(--status-critical)]">
          마지막 관리자 계정은 강등하거나 삭제할 수 없습니다.
        </p>
      )}
      {error === "self" && (
        <p role="alert" className="callout callout-danger mb-6 text-[var(--status-critical)]">
          본인 계정은 이 화면에서 삭제할 수 없습니다. 탈퇴는 내 계정 페이지를 이용해 주십시오.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
        <table className="data-table">
          <thead>
            <tr>
              {["이름", "역할", "가입일", "핵심 단계", "과제", "마지막 기록", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
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
  const completed = statuses.reduce((sum, st) => sum + st.tiers.core.done, 0);
  const totalItems = statuses.reduce((sum, st) => sum + st.tiers.core.total, 0);
  const pending = submissions.filter((s) => s.status === "submitted").length;
  const graded = submissions.filter((s) => s.status === "graded").length;

  return (
    <tr>
      <td>
        <span className="font-medium text-ink">
          {member.name} {member.id === adminId && <span className="text-xs font-normal text-ink-muted">(나)</span>}
        </span>
        <span className="block text-xs text-ink-muted">{member.email}</span>
      </td>
      <td className="whitespace-nowrap text-ink-secondary">{ROLE_LABEL[member.role]}</td>
      <td className="whitespace-nowrap tabular-nums text-ink-secondary">{formatDate(member.createdAt)}</td>
      <td className="whitespace-nowrap tabular-nums text-ink-secondary">
        {completed} / {totalItems}
      </td>
      <td className="whitespace-nowrap text-ink-secondary">
        제출 {submissions.length} · 채점 {graded}
        {pending > 0 && <span className="ml-1 text-[var(--accent)]">· 대기 {pending}</span>}
      </td>
      <td className="whitespace-nowrap text-xs tabular-nums text-ink-muted">{learning?.updatedAt ? formatDateTime(learning.updatedAt) : "기록 없음"}</td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <Link href={`/operator/members/${member.id}`} className="btn btn-secondary btn-sm">
            상세
          </Link>
          <form action={removeMember}>
            <input type="hidden" name="id" value={member.id} />
            <ConfirmSubmitButton
              message={`${member.name}님의 계정과 학습 기록·과제를 모두 삭제합니다. 되돌릴 수 없습니다. 계속하시겠습니까?`}
              className="btn btn-ghost btn-sm text-[var(--status-critical)] hover:text-[var(--status-critical)]"
            >
              삭제
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}
