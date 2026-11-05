import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { deleteUser, listUsers } from "@/lib/userStore";
import { completedLessonsByUser, descriptiveCountsByUser, lastLearningActivity } from "@/lib/learningStore";
import { CORE_PATH, getModule } from "@/content/course";
import { nextCoreLesson } from "@/lib/operatorStats";
import { formatDateTime, formatDate } from "@/lib/datetime";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import MembersTabs from "./MembersTabs";

export const metadata = { title: "스터디원 관리" };

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "스터디원" };

type AnswerCount = { total: number; weak: number };

export default async function MembersPage({ searchParams }: PageProps<"/operator/members">) {
  const admin = await requireAdmin("/operator/members");
  const { error } = await searchParams;
  const members = listUsers();
  const adminCount = members.filter((m) => m.role === "admin").length;
  // 모든 학습 기록을 읽지 않고 DB에서 사용자별 숫자만 모아 온다.
  const completed = completedLessonsByUser();
  const lastActivity = lastLearningActivity();
  const answerCounts = descriptiveCountsByUser();

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
      <PageHeader title="스터디원 관리" description={`가입 ${members.length}명 · 관리자 ${adminCount}명. 이름을 누르면 해당 스터디원의 전체 학습 기록을 확인할 수 있습니다.`} />
      <MembersTabs current="list" />

      {error === "lastadmin" && (
        <p role="alert" className="callout callout-danger mb-6 text-[var(--status-critical)]">
          마지막 관리자 계정은 스터디원으로 변경하거나 삭제할 수 없습니다.
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
              {["이름", "역할", "가입일", "필수 경로", "지금 학습 중", "서술형 답", "마지막 기록", ""].map((h) => (
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
                done={completed.get(m.id)}
                lastActivity={lastActivity.get(m.id)}
                answers={answerCounts.get(m.id) ?? { total: 0, weak: 0 }}
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
  done,
  lastActivity,
  answers,
  removeMember,
}: {
  member: ReturnType<typeof listUsers>[number];
  adminId: string;
  done: Set<string> | undefined;
  lastActivity: string | undefined;
  answers: AnswerCount;
  removeMember: (formData: FormData) => Promise<void>;
}) {
  const coreDone = done ? CORE_PATH.filter((l) => done.has(l.id)).length : 0;
  const next = nextCoreLesson(done);
  const nextModule = next ? getModule(next.module) : undefined;

  return (
    <tr>
      <td>
        <Link href={`/operator/members/${member.id}`} className="font-medium text-ink underline-offset-2 hover:underline">
          {member.name}
        </Link>{" "}
        {member.id === adminId && <span className="text-xs font-normal text-ink-muted">(나)</span>}
        <span className="block text-xs text-ink-muted">{member.email}</span>
      </td>
      <td className="whitespace-nowrap text-ink-secondary">{ROLE_LABEL[member.role]}</td>
      <td className="whitespace-nowrap tabular-nums text-ink-secondary">{formatDate(member.createdAt)}</td>
      <td className="whitespace-nowrap tabular-nums text-ink-secondary">
        {coreDone} / {CORE_PATH.length}
      </td>
      <td className="min-w-[10rem] text-xs text-ink-secondary">
        {member.role === "admin" ? "—" : nextModule ? `${nextModule.code} ${next!.title}` : "필수 경로 완료"}
      </td>
      <td className="whitespace-nowrap tabular-nums text-ink-secondary">
        {answers.total > 0 ? (
          <Link href={`/operator/members/${member.id}`} className="underline-offset-2 hover:text-ink hover:underline">
            {answers.total}개
            {answers.weak > 0 && <span className="text-[var(--status-critical)]"> · 보완 필요 {answers.weak}</span>}
          </Link>
        ) : (
          <span className="text-ink-muted">없음</span>
        )}
      </td>
      <td className="whitespace-nowrap text-xs tabular-nums text-ink-muted">{lastActivity ? formatDateTime(lastActivity) : "기록 없음"}</td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <Link href={`/operator/members/${member.id}`} className="btn btn-secondary btn-sm">
            학습 기록
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
