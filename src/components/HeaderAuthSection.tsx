import Link from "next/link";
import NavLink from "./NavLink";
import { NAV_BADGE, NAV_STYLES, type NavVariant } from "./navStyles";
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
export default async function HeaderAuthSection({ variant = "bar" }: { variant?: NavVariant }) {
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
  const s = NAV_STYLES[variant];
  const link = (href: string, label: string, badge = 0, badgeLabel = "") => (
    <NavLink href={href} className={s.base} activeClassName={s.active} inactiveClassName={s.idle}>
      {label}
      {badge > 0 && (
        <span className={NAV_BADGE}>
          {badge}
          <span className="sr-only">{badgeLabel}</span>
        </span>
      )}
    </NavLink>
  );

  if (!user) {
    return (
      <Link href="/login" className={`btn btn-primary btn-sm ${variant === "bar" ? "ml-2" : "mt-1 w-full"}`}>
        로그인
      </Link>
    );
  }

  const initial = user.name.slice(0, 1);
  return (
    <>
      {user.role === "admin" && link("/operator", "운영자")}
      {link("/progress", "내 진도")}
      {user.role !== "admin" && link("/feedback", "피드백함", newGrades, "개의 새 피드백")}
      {link(user.role === "admin" ? "/operator/chat" : "/chat", "채팅", unread, "개의 새 메시지")}
      {variant === "bar" ? (
        <NavLink
          href="/account"
          className="ml-2 grid h-8 w-8 place-items-center rounded-full border text-[13px] font-semibold transition"
          activeClassName="border-[var(--text-primary)] bg-[var(--surface-card-2)] text-ink"
          inactiveClassName="border-[var(--border-strong)] text-ink-secondary hover:border-[var(--text-primary)] hover:text-ink"
        >
          <span aria-hidden="true">{initial}</span>
          <span className="sr-only">내 계정 ({user.name})</span>
        </NavLink>
      ) : (
        <NavLink href="/account" className={s.base} activeClassName={s.active} inactiveClassName={s.idle}>
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-[var(--border-strong)] text-[11px] font-semibold">
              {initial}
            </span>
            {user.name}
          </span>
          <span className="text-xs text-ink-muted">내 계정</span>
        </NavLink>
      )}
    </>
  );
}
