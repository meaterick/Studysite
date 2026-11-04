import Link from "next/link";

export const metadata = { title: "페이지를 찾을 수 없습니다" };

/** 존재하지 않는 주소(404). 기본 영문 화면 대신 사이트 디자인에 맞춘 안내와 갈 곳을 보여 준다. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center sm:px-6">
      <p className="text-7xl font-extralight tabular-nums tracking-[-0.06em] text-ink-muted">404</p>
      <h1 className="page-title mt-6">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-[15px] text-ink-secondary">주소가 바뀌었거나 없는 페이지입니다.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          메인으로
        </Link>
        <Link
          href="/weeks"
          className="btn btn-secondary"
        >
          주차별 자료
        </Link>
      </div>
    </div>
  );
}
