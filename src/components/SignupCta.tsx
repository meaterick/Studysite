import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

export default async function SignupCta() {
  const user = await getCurrentUser();
  if (user) return null;
  return (
    <Link
      href="/signup"
      className="rounded-lg border border-dashed border-[var(--series-blue)] px-5 py-3 text-sm font-bold text-[var(--series-blue)] transition hover:bg-[var(--surface-card-2)]"
    >
      스터디원으로 가입하기
    </Link>
  );
}
