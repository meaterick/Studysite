import Link from "next/link";
import { safeReturnPath } from "@/lib/returnPath";

export const metadata = { title: "회원가입" };

const ERRORS: Record<string, string> = {
  oauth_config: "Google 로그인 설정이 아직 완료되지 않았습니다. 운영자에게 문의해 주세요.",
  oauth_cancelled: "Google 로그인이 취소되었습니다. 다시 시도해 주세요.",
  oauth_failed: "Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.",
};

export default async function SignupPage({
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
      <h1 className="mb-2 text-2xl font-black text-ink">회원가입</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        Google 계정으로 안전하게 가입하고 커리큘럼과 주차별 자료를 함께 보세요.
      </p>
      {error && <p className="mb-4 text-sm font-medium text-[var(--status-critical)]">{ERRORS[error] ?? ERRORS.oauth_failed}</p>}
      <Link
        href={googleHref}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm font-bold text-ink transition hover:bg-[var(--surface-card-2)]"
      >
        <span className="text-lg leading-none" aria-hidden="true">G</span>
        Google로 가입하기
      </Link>
      <p className="mt-3 text-center text-xs text-ink-muted">Google이 확인한 이름과 이메일만 사용합니다.</p>
      <p className="mt-6 text-center text-sm text-ink-secondary">
        이미 계정이 있나요?{" "}
        <Link href={`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`} className="font-bold text-[var(--series-blue)]">
          로그인
        </Link>
      </p>
    </div>
  );
}
