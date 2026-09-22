import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

export default async function SignupCta() {
  const user = await getCurrentUser();
  if (user) return null;
  return (
    <Link
      href="/login"
      className="rounded-lg border border-dashed border-[var(--series-blue)] px-5 py-3 text-sm font-bold text-[var(--series-blue)] transition hover:bg-[var(--surface-card-2)]"
    >
      Google로 시작하기
    </Link>
  );
}
