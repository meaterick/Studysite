import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 화면마다 하나만 두는 "지금 할 일" 카드. 깊은 남색 바탕에 큰 제목과 버튼 하나만 두어,
 * 화면을 열자마자 무엇을 하면 되는지가 가장 먼저 눈에 들어오게 한다.
 * 나머지 정보(진행률·목록)는 이 카드 아래에 조용한 모양으로 둔다.
 */
export default function NextStep({
  eyebrow = "지금 할 일",
  title,
  detail,
  href,
  cta = "시작하기",
  meta,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  detail?: ReactNode;
  href: string;
  cta?: string;
  /** 버튼 옆의 작은 정보(예: 예상 시간) */
  meta?: ReactNode;
  /** 카드 아래쪽의 보조 영역(예: 이번 주 흐름) */
  children?: ReactNode;
}) {
  return (
    <section aria-label={eyebrow} className="spotlight">
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#8ab8ff]">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#8ab8ff] opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8ab8ff]" />
            </span>
            {eyebrow}
          </p>
          <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-2xl">{title}</h2>
          {detail && <p className="spotlight-muted mt-2 text-sm leading-relaxed">{detail}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Link href={href} className="btn btn-light btn-lg w-full sm:w-auto">
            {cta}
            <span aria-hidden="true">→</span>
          </Link>
          {meta && <p className="spotlight-muted text-center text-xs sm:text-right">{meta}</p>}
        </div>
      </div>
      {children && <div className="relative border-t border-[rgba(138,184,255,0.16)] px-6 py-5 sm:px-8">{children}</div>}
    </section>
  );
}
