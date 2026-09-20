import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

// 로그인 여부는 요청마다 쿠키를 읽어야 알 수 있는(=정적으로 미리 만들어둘 수
// 없는) 유일한 부분이다. 이 조각만 따로 떼어 Suspense로 감싸두면, 나머지
// 페이지 전체(주차별 자료 같은 무거운 콘텐츠)는 빌드 시점에 정적 HTML로
// 미리 만들어두고 이 작은 조각만 요청마다 스트리밍할 수 있다.
export default async function HeaderAuthSection() {
  const user = await getCurrentUser();

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
      {user ? (
        <Link
          href="/account"
          className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
        >
          {user.name}님
        </Link>
      ) : (
        <>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-ink-secondary transition hover:bg-[var(--surface-card-2)] hover:text-ink"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--series-blue)" }}
          >
            회원가입
          </Link>
        </>
      )}
    </>
  );
}
