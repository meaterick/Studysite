import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { deleteUser, listUsers, setUserRole } from "@/lib/userStore";

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

  async function toggleRole(formData: FormData) {
    "use server";
    await requireAdmin("/operator/members");
    const id = String(formData.get("id") ?? "");
    const nextRole = String(formData.get("nextRole") ?? "member") as "admin" | "member";
    const target = listUsers().find((u) => u.id === id);
    if (!target) return;
    if (target.role === "admin" && nextRole === "member" && listUsers().filter((u) => u.role === "admin").length <= 1) {
      redirect("/operator/members?error=lastadmin");
    }
    await setUserRole(id, nextRole);
    redirect("/operator/members");
  }

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
        총 {members.length}명 가입 · 관리자 {adminCount}명. 관리자 권한 부여/회수와 계정 삭제를 여기서
        처리할 수 있습니다.
      </p>

      {error === "lastadmin" && (
        <p className="mb-4 rounded-lg border-l-4 px-4 py-2 text-sm font-medium text-[var(--status-critical)]" style={{ borderColor: "var(--status-critical)", background: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
          마지막 관리자 계정은 강등하거나 삭제할 수 없습니다.
        </p>
      )}
      {error === "self" && (
        <p className="mb-4 rounded-lg border-l-4 px-4 py-2 text-sm font-medium text-[var(--status-critical)]" style={{ borderColor: "var(--status-critical)", background: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
          본인 계정은 이 화면에서 삭제할 수 없습니다. 탈퇴는 &lsquo;내 계정&rsquo; 페이지를 이용하세요.
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
              <th className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="odd:bg-transparent even:bg-[var(--surface-card-2)]/40">
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top font-medium text-ink">
                  {m.name} {m.id === admin.id && <span className="text-xs text-ink-muted">(나)</span>}
                </td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{m.email}</td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">{ROLE_LABEL[m.role]}</td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top text-ink-secondary">
                  {new Date(m.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="border-b border-[var(--border-hairline)] px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleRole}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="nextRole" value={m.role === "admin" ? "member" : "admin"} />
                      <button className="rounded-md border border-[var(--border-hairline)] px-2 py-1 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
                        {m.role === "admin" ? "스터디원으로 변경" : "관리자로 지정"}
                      </button>
                    </form>
                    <form action={removeMember}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="rounded-md border px-2 py-1 text-xs font-bold text-white" style={{ background: "var(--status-critical)", borderColor: "var(--status-critical)" }}>
                        삭제
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
