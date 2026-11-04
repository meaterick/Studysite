import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { WEEKS } from "@/content/weeks";
import { getLearningRecord } from "@/lib/learningStore";
import { findUserSubmission } from "@/lib/submissionStore";
import { continueHref, weekStatus } from "@/lib/study";

/** 지난 학습을 이어 갈 곳: 핵심 단계·백지공부·과제 중 남은 것이 있는 첫 주차. 핵심이 남았으면 그 단계로, 아니면 주차 개요로 */
function resumeHref(userId: string): string {
  const record = getLearningRecord(userId);
  for (const week of WEEKS) {
    const status = weekStatus(week, record, findUserSubmission(userId, week.slug));
    if (!status.coreDone) return continueHref(week.slug, status);
    if (!status.worksheetSubmitted || status.assignment.status === "none") return `/weeks/${week.slug}`;
  }
  return "/progress";
}

// 학습자료는 로그인해야 볼 수 있으므로, 로그인 여부에 따라 "지금 할 수 있는 일"
// 하나를 가장 크게 보여준다. 로그인 전에는 커리큘럼/Week 1 버튼을 눌러도 결국
// 로그인 페이지로 가게 되니, 처음부터 로그인 버튼 하나만 안내한다.
export default async function HomeCta({ tone = "default" }: { tone?: "default" | "minimal" } = {}) {
  const user = await getCurrentUser();

  if (tone === "minimal") {
    // 메인 화면용: 흰색 알약 버튼 하나와 테두리 버튼 하나만 둔다.
    const primary = "flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/85";
    const secondary = "flex w-full items-center justify-center rounded-full border border-[var(--j-line-strong)] px-6 py-3 text-sm font-medium text-[var(--j-1)] transition hover:border-[var(--journey-accent)] hover:text-white";
    if (!user) {
      return (
        <div className="flex flex-col gap-3">
          <Link href="/login?from=%2Fweeks%2Fweek-1" className={primary}>
            Google 계정으로 시작하기
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2.5">
        <Link href={resumeHref(user.id)} className={primary}>
          {user.name}님, 지난 학습 이어하기
        </Link>
        <Link href="/curriculum" className={secondary}>
          커리큘럼 보기
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2 sm:max-w-md">
        <Link
          href="/login?from=%2Fweeks%2Fweek-1"
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          Google 계정으로 시작하기
        </Link>
        <p className="text-center text-xs text-ink-muted sm:text-left">
          로그인하면 주차별 학습 자료와 실습, 확인 문제를 이용할 수 있습니다. 처음 로그인할 때 계정이 자동으로 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:max-w-md">
      <p className="text-sm font-medium text-ink-secondary">{user.name}님, 환영합니다.</p>
      <Link
        href={resumeHref(user.id)}
        className="flex w-full items-center justify-center rounded-xl px-5 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90"
        style={{ background: "var(--series-blue)" }}
      >
        지난 학습 이어하기
      </Link>
      <Link
        href="/curriculum"
        className="flex w-full items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-card px-5 py-3 text-sm font-bold text-ink transition hover:bg-[var(--surface-card-2)]"
      >
        커리큘럼 보기
      </Link>
    </div>
  );
}
