import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

// 학습자료는 로그인해야 볼 수 있으므로, 로그인 여부에 따라 "지금 할 수 있는 일"
// 하나를 가장 크게 보여준다. 로그인 전에는 커리큘럼/Week 1 버튼을 눌러도 결국
// 로그인 페이지로 가게 되니, 처음부터 로그인 버튼 하나만 안내한다.
export default async function HomeCta() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-2 sm:max-w-md">
        <Link
          href="/login?from=%2Fweeks%2Fweek-1"
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          Google 계정으로 로그인하고 시작하기 →
        </Link>
        <p className="text-center text-xs text-ink-muted sm:text-left">
          로그인하면 8주치 학습자료·실습·퀴즈를 모두 볼 수 있어요. 처음이라면 계정이 자동으로 만들어집니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:max-w-md">
      <p className="text-sm font-medium text-ink-secondary">{user.name}님, 반가워요!</p>
      <Link
        href="/weeks/week-1"
        className="flex w-full items-center justify-center rounded-xl px-5 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90"
        style={{ background: "var(--series-blue)" }}
      >
        Week 1부터 학습 시작하기 →
      </Link>
      <Link
        href="/curriculum"
        className="flex w-full items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-card px-5 py-3 text-sm font-bold text-ink transition hover:bg-[var(--surface-card-2)]"
      >
        8주 전체 커리큘럼 먼저 살펴보기
      </Link>
    </div>
  );
}
