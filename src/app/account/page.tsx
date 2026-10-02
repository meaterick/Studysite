import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/datetime";
import DeleteAccountButton from "@/components/account/DeleteAccountButton";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "내 계정" };

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "스터디원" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const rows = [
    { k: "역할", v: ROLE_LABEL[user.role] ?? user.role },
    { k: "가입일", v: formatDate(user.createdAt) },
    { k: "로그인", v: "Google" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="내 계정" />

      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] text-xl font-semibold text-ink">
          {user.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-[-0.02em] text-ink">{user.name}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
      </div>

      <dl className="rows mt-8 border-y border-[var(--border-hairline)] text-sm">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-6 py-3.5">
            <dt className="shrink-0 text-ink-muted">{r.k}</dt>
            <dd className="min-w-0 break-all text-right text-ink">{r.v}</dd>
          </div>
        ))}
      </dl>

      <form action="/logout" method="post" className="mt-6">
        <button className="btn btn-secondary w-full">로그아웃</button>
      </form>

      <section aria-labelledby="danger-heading" className="mt-20 border-t border-[var(--border-hairline)] pt-8">
        <h2 id="danger-heading" className="text-sm font-semibold text-ink">
          회원 탈퇴
        </h2>
        <p className="mb-5 mt-1 text-sm text-ink-muted">계정 정보와 학습 기록, 제출한 과제가 즉시 삭제되며 되돌릴 수 없습니다.</p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
