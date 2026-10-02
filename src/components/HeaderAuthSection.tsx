import Link from "next/link";
import NavLink from "./NavLink";
import { NAV_ACTIVE, NAV_IDLE, NAV_LINK } from "./navStyles";
import { getCurrentUser } from "@/lib/dal";
import { findConversation, unreadCount } from "@/lib/chatStore";
import { adminUnreadTotal } from "@/lib/chatView";
import { getLearningRecord } from "@/lib/learningStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { isGradeUnseen } from "@/lib/feedback";

// 로그인 여부는 요청마다 쿠키를 읽어야 알 수 있는(=정적으로 미리 만들어둘 수
// 없는) 유일한 부분이다. 이 조각만 따로 떼어 Suspense로 감싸두면, 나머지
// 페이지 전체(주차별 자료 같은 무거운 콘텐츠)는 빌드 시점에 정적 HTML로
// 미리 만들어두고 이 작은 조각만 요청마다 스트리밍할 수 있다.
export default async function HeaderAuthSection() {
  const user = await getCurrentUser();
  const unread = !user ? 0 : user.role === "admin" ? adminUnreadTotal().conversations : unreadCount(findConversation(user.id), "member");
  // 피드백함 배지: 마지막으로 피드백함을 연 뒤에 나온 채점·재제출 요청 수(채팅은 채팅 배지로 따로 보인다).
  let newGrades = 0;
  if (user && user.role !== "admin") {
    const record = getLearningRecord(user.id);
    newGrades = listUserSubmissions(user.id)
      .flatMap((s) => s.grades.map((g) => ({ id: s.id, gradedAt: g.gradedAt })))
      .filter((g) => isGradeUnseen(record, g.id, g.gradedAt)).length;
  }

  return (
    <>
      {user?.role === "admin" && (
        <NavLink
          href="/operator"
          className={`${NAV_LINK} text-[var(--series-orange)] hover:bg-[var(--surface-card-2)]`}
          activeClassName="bg-[color-mix(in_srgb,var(--series-orange)_12%,transparent)] font-bold"
        >
          운영자
        </NavLink>
      )}
      {user && (
        <NavLink href="/progress" className={NAV_LINK} activeClassName={NAV_ACTIVE} inactiveClassName={NAV_IDLE}>
          내 진도
        </NavLink>
      )}
      {user && user.role !== "admin" && (
        <NavLink href="/feedback" className={NAV_LINK} activeClassName={NAV_ACTIVE} inactiveClassName={NAV_IDLE}>
          피드백함
          {newGrades > 0 && (
            <span className="ml-1 rounded-full bg-[var(--series-orange)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {newGrades}
              <span className="sr-only">개의 새 피드백</span>
            </span>
          )}
        </NavLink>
      )}
      {user && (
        <NavLink href={user.role === "admin" ? "/operator/chat" : "/chat"} className={NAV_LINK} activeClassName={NAV_ACTIVE} inactiveClassName={NAV_IDLE}>
          채팅
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-[var(--series-orange)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
              <span className="sr-only">개의 새 메시지</span>
            </span>
          )}
        </NavLink>
      )}
      {user ? (
        <NavLink href="/account" className={`${NAV_LINK} inline-flex items-center gap-2`} activeClassName={NAV_ACTIVE} inactiveClassName={NAV_IDLE}>
          <span
            aria-hidden="true"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--series-blue)_16%,transparent)] text-[11px] font-black text-[var(--series-blue)]"
          >
            {user.name.slice(0, 1)}
          </span>
          {user.name}님
        </NavLink>
      ) : (
        <Link
          href="/login"
          className="btn btn-primary btn-sm min-h-9 px-4 md:ml-1"
        >
          로그인
        </Link>
      )}
    </>
  );
}
