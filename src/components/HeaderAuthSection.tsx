import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { findConversation, unreadCount } from "@/lib/chatStore";
import { adminUnreadTotal } from "@/lib/chatView";

// 로그인 여부는 요청마다 쿠키를 읽어야 알 수 있는(=정적으로 미리 만들어둘 수
// 없는) 유일한 부분이다. 이 조각만 따로 떼어 Suspense로 감싸두면, 나머지
// 페이지 전체(주차별 자료 같은 무거운 콘텐츠)는 빌드 시점에 정적 HTML로
// 미리 만들어두고 이 작은 조각만 요청마다 스트리밍할 수 있다.
export default async function HeaderAuthSection() {
  const user = await getCurrentUser();
  const unread = !user ? 0 : user.role === "admin" ? adminUnreadTotal().conversations : unreadCount(findConversation(user.id), "member");

  return (
    <>
      {user?.role === "admin" && (
        <Link
          href="/operator"
          className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-[var(--series-orange)] transition hover:bg-[var(--surface-card-2)]"
        >
          운영자
        </Link>
      )}
      {user && (
        <Link
          href={user.role === "admin" ? "/operator/chat" : "/chat"}
          className="relative whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
        >
          채팅
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-[var(--series-orange)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
              <span className="sr-only">개의 새 메시지</span>
            </span>
          )}
        </Link>
      )}
      {user ? (
        <Link
          href="/account"
          className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
        >
          {user.name}님
        </Link>
      ) : (
        <Link
          href="/login"
          className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--series-blue)" }}
        >
          로그인
        </Link>
      )}
    </>
  );
}
