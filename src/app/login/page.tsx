import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { clearAuthAttempts, consumeAuthAttempt } from "@/lib/authRateLimit";
import { safeReturnPath } from "@/lib/returnPath";
import { createSession } from "@/lib/session";
import { findUserByEmail } from "@/lib/userStore";

export const metadata = { title: "로그인" };

// Cost 10, matching account hashes. Comparing against this for unknown users
// prevents account-existence timing from bypassing the rate limiter.
const DUMMY_PASSWORD_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string; email?: string }>;
}) {
  const { error, from, email } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const from = safeReturnPath(String(formData.get("from") ?? ""));
    const back = () =>
      `/login?error=1&email=${encodeURIComponent(email)}${from ? `&from=${encodeURIComponent(from)}` : ""}`;

    if (!(await consumeAuthAttempt("login", email))) {
      redirect(`/login?error=rate&email=${encodeURIComponent(email)}`);
    }

    const user = findUserByEmail(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !ok) redirect(back());

    await clearAuthAttempts("login", email);
    await createSession(user.id, user.role);
    redirect(from || "/account");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">Aegis AI 스터디</p>
      <h1 className="mb-2 text-2xl font-black text-ink">로그인</h1>
      <p className="mb-8 text-sm text-ink-secondary">스터디원 계정으로 로그인하세요.</p>
      <form action={login} className="space-y-4">
        <input type="hidden" name="from" value={from ?? ""} />
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">이메일</label>
          <input
            type="email"
            name="email"
            required
            autoFocus
            defaultValue={email}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">비밀번호</label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-[var(--status-critical)]">
            {error === "rate" ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." : "이메일 또는 비밀번호가 올바르지 않습니다."}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          로그인
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-secondary">
        아직 계정이 없나요?{" "}
        <Link href={`/signup${from ? `?from=${encodeURIComponent(from)}` : ""}`} className="font-bold text-[var(--series-blue)]">
          회원가입
        </Link>
      </p>
    </div>
  );
}
