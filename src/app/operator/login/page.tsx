import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OPERATOR_COOKIE, isCorrectPasscode } from "@/lib/auth";

export const metadata = { title: "운영자 로그인" };

export default async function OperatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const passcode = String(formData.get("passcode") ?? "");
    const target = String(formData.get("from") ?? "/operator");
    if (!isCorrectPasscode(passcode)) {
      redirect(`/operator/login?error=1&from=${encodeURIComponent(target)}`);
    }
    const store = await cookies();
    store.set(OPERATOR_COOKIE, passcode.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(target || "/operator");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-2xl font-black text-ink">운영자 전용 구역</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        운영 가이드·퀴즈 정답·품질 로그는 스터디원에게 공개하지 않습니다. 운영자 패스코드를 입력하세요.
      </p>
      <form action={login} className="space-y-4">
        <input type="hidden" name="from" value={from ?? "/operator"} />
        <input
          type="password"
          name="passcode"
          required
          autoFocus
          placeholder="패스코드"
          className="w-full rounded-lg border border-[var(--border-hairline)] bg-card px-4 py-3 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
        />
        {error && <p className="text-sm font-medium text-[var(--status-critical)]">패스코드가 올바르지 않습니다.</p>}
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          입장하기
        </button>
      </form>
    </div>
  );
}
