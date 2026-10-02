import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/datetime";
import DeleteAccountButton from "@/components/account/DeleteAccountButton";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "내 계정" };

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "스터디원" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const rows = [
    { k: "이메일", v: user.email },
    { k: "역할", v: ROLE_LABEL[user.role] ?? user.role },
    { k: "가입일", v: formatDate(user.createdAt) },
    { k: "로그인 방식", v: "Google" },
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader eyebrow="Aegis AI 스터디" title="내 계정" />

      <section aria-label="계정 정보" className="surface mb-4 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-[var(--border-hairline)] p-5">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--series-blue)_16%,transparent)] text-lg font-black text-[var(--series-blue)]"
          >
            {user.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
          </div>
        </div>
        <dl className="divide-y divide-[var(--border-hairline)] text-sm">
          {rows.map((r) => (
            <div key={r.k} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <dt className="shrink-0 text-ink-muted">{r.k}</dt>
              <dd className="min-w-0 break-all text-right font-bold text-ink">{r.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form action="/logout" method="post" className="mb-12">
        <button className="btn btn-secondary w-full">로그아웃</button>
      </form>

      <section aria-labelledby="danger-heading" className="callout callout-danger px-5 py-4">
        <h2 id="danger-heading" className="mb-1 text-sm font-black text-ink">
          회원 탈퇴
        </h2>
        <p className="mb-4 text-xs text-ink-secondary">탈퇴하면 계정 정보와 학습 기록, 제출한 과제가 즉시 삭제되며 되돌릴 수 없습니다.</p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
