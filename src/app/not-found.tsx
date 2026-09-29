import Link from "next/link";

export const metadata = { title: "페이지를 찾을 수 없습니다" };

/** 존재하지 않는 주소(404). 기본 영문 화면 대신 사이트 디자인에 맞춘 안내와 갈 곳을 보여 준다. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm font-bold tracking-widest text-[var(--series-blue)]">404</p>
      <h1 className="mt-3 text-2xl font-black text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-ink-secondary">주소가 바뀌었거나 없는 페이지입니다. 아래에서 이어서 둘러보십시오.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
          메인으로
        </Link>
        <Link
          href="/weeks"
          className="rounded-lg border border-[var(--border-hairline)] px-5 py-2.5 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]"
        >
          주차별 자료
        </Link>
      </div>
    </div>
  );
}
