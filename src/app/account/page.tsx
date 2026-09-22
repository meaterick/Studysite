import { requireUser } from "@/lib/dal";

export const metadata = { title: "내 계정" };

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "스터디원" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser("/account");
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">Aegis AI 스터디</p>
      <h1 className="mb-8 text-2xl font-black text-ink">내 계정</h1>

      <dl className="mb-10 space-y-3 rounded-xl border border-[var(--border-hairline)] bg-card p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">이름</dt>
          <dd className="font-bold text-ink">{user.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">이메일</dt>
          <dd className="font-bold text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">역할</dt>
          <dd className="font-bold text-ink">{ROLE_LABEL[user.role] ?? user.role}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">가입일</dt>
          <dd className="font-bold text-ink">{new Date(user.createdAt).toLocaleDateString("ko-KR")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">로그인 방식</dt>
          <dd className="font-bold text-ink">Google</dd>
        </div>
      </dl>

      <form action="/logout" method="post" className="mb-10">
        <button className="w-full rounded-lg border border-[var(--border-hairline)] px-4 py-3 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
          로그아웃
        </button>
      </form>

      <div className="rounded-xl border-l-4 px-5 py-4" style={{ borderColor: "var(--status-critical)", background: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
        <h2 className="mb-1 text-sm font-black text-ink">회원 탈퇴</h2>
        <p className="mb-4 text-xs text-ink-secondary">
          탈퇴하면 계정 정보가 즉시 삭제되며 되돌릴 수 없습니다. (개인 학습 진도·백지공부는 이
          브라우저에만 저장되어 있어 별도로 지워지지 않습니다.)
        </p>
        {error === "lastadmin" && (
          <p className="mb-3 text-xs font-medium text-[var(--status-critical)]">
            마지막 관리자 계정은 탈퇴할 수 없습니다. 다른 계정을 관리자로 지정한 뒤 다시 시도하세요.
          </p>
        )}
        <a
          href="/api/auth/google?intent=delete_account"
          className="block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--status-critical)" }}
        >
          Google로 본인 확인 후 탈퇴
        </a>
      </div>
    </div>
  );
}
