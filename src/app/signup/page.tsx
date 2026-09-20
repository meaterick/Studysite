import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { createUser, findUserByEmail } from "@/lib/userStore";
import { isValidEmail, isValidName, isValidPassword } from "@/lib/validate";

export const metadata = { title: "회원가입" };

const ERRORS: Record<string, string> = {
  name: "이름을 1~40자로 입력해 주세요.",
  email: "올바른 이메일 형식이 아닙니다.",
  password: "비밀번호는 8자 이상이어야 합니다.",
  mismatch: "비밀번호가 서로 일치하지 않습니다.",
  taken: "이미 가입된 이메일입니다. 로그인해 주세요.",
  unknown: "가입 중 문제가 발생했습니다. 다시 시도해 주세요.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; email?: string; from?: string }>;
}) {
  const { error, name, email, from } = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
    const from = String(formData.get("from") ?? "");
    const back = (code: string) =>
      `/signup?error=${code}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}${
        from ? `&from=${encodeURIComponent(from)}` : ""
      }`;

    if (!isValidName(name)) redirect(back("name"));
    if (!isValidEmail(email)) redirect(back("email"));
    if (!isValidPassword(password)) redirect(back("password"));
    if (password !== passwordConfirm) redirect(back("mismatch"));
    if (findUserByEmail(email)) redirect(back("taken"));

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await createUser({ name, email, passwordHash });
      await createSession(user.id, user.role);
    } catch {
      redirect(back("unknown"));
    }
    redirect(from || "/account");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">Aegis AI 스터디</p>
      <h1 className="mb-2 text-2xl font-black text-ink">회원가입</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        스터디원으로 가입하면 커리큘럼과 주차별 자료를 함께 볼 수 있어요. 가장 먼저 가입하는 계정이
        자동으로 관리자 권한을 받습니다.
      </p>
      <form action={signup} className="space-y-4">
        <input type="hidden" name="from" value={from ?? ""} />
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">이름</label>
          <input
            type="text"
            name="name"
            required
            autoFocus
            defaultValue={name}
            placeholder="홍길동"
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">이메일</label>
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">비밀번호 (8자 이상)</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-muted">비밀번호 확인</label>
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={8}
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-[var(--status-critical)]">
            {ERRORS[error] ?? ERRORS.unknown}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          가입하기
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-secondary">
        이미 계정이 있나요?{" "}
        <Link href={`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`} className="font-bold text-[var(--series-blue)]">
          로그인
        </Link>
      </p>
    </div>
  );
}
