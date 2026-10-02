import Link from "next/link";
import Image from "next/image";
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
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 sm:py-20">
      <div className="surface p-6 sm:p-8">
        <Image src="/images/aegis-mark.svg" alt="" width={44} height={44} className="mb-5 h-11 w-11" />
        <p className="eyebrow mb-2">Aegis AI 스터디</p>
        <h1 className="page-title">로그인</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Google 계정으로 로그인하면 처음 방문할 때 스터디원 계정이 자동으로 생성됩니다.
        </p>
        {from && returnPath !== "/account" && (
          <p className="callout mt-5">로그인한 스터디원만 볼 수 있는 페이지입니다. 로그인하면 보려던 페이지로 바로 이동합니다.</p>
        )}
        {error && (
          <p role="alert" className="callout callout-danger mt-5 font-medium text-[var(--status-critical)]">
            {OAUTH_ERRORS[error] ?? OAUTH_ERRORS.oauth_failed}
          </p>
        )}
        <Link href={googleHref} prefetch={false} className="btn btn-secondary btn-lg mt-6 w-full text-ink">
          <GoogleMark />
          Google로 계속하기
        </Link>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
        로그인하면{" "}
        <Link href="/privacy" className="font-bold text-ink-secondary underline-offset-2 hover:underline">
          개인정보처리방침
        </Link>
        에 따라 이름과 이메일이 처리됩니다.
      </p>
    </div>
  );
}

/** Google 로그인 버튼에 쓰는 표준 "G" 표시 */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
