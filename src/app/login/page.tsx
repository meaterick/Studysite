import Link from "next/link";
import { safeReturnPath } from "@/lib/returnPath";

export const metadata = { title: "로그인" };

const OAUTH_ERRORS: Record<string, string> = {
  oauth_config: "Google 로그인 설정이 아직 완료되지 않았습니다. 운영자에게 문의해 주십시오.",
  oauth_cancelled: "Google 로그인이 취소되었습니다. 다시 시도해 주십시오.",
  oauth_failed: "Google 로그인 중 문제가 발생했습니다. 다시 시도해 주십시오.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;
  const returnPath = safeReturnPath(from ?? "");
  const googleHref = `/api/auth/google${returnPath !== "/account" ? `?from=${encodeURIComponent(returnPath)}` : ""}`;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">Aegis AI 스터디</p>
      <h1 className="mb-2 text-2xl font-black text-ink">로그인</h1>
      {from && returnPath !== "/account" && (
        <p className="mb-4 rounded-lg border-l-4 border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_8%,transparent)] px-4 py-3 text-sm text-ink">
          로그인한 스터디원만 볼 수 있는 페이지입니다. 로그인하면 보려던 페이지로 바로 이동합니다.
        </p>
      )}
      <p className="mb-8 text-sm text-ink-secondary">Google 계정으로 로그인하면 처음 방문할 때 스터디원 계정이 자동으로 생성됩니다.</p>
      <Link
        href={googleHref}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm font-bold text-ink transition hover:bg-[var(--surface-card-2)]"
      >
        <span className="text-lg leading-none" aria-hidden="true">G</span>
        Google로 계속하기
      </Link>
      {error && <p className="mt-4 text-sm font-medium text-[var(--status-critical)]">{OAUTH_ERRORS[error] ?? OAUTH_ERRORS.oauth_failed}</p>}
    </div>
  );
}
