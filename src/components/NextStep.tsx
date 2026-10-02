import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";

/**
 * 화면마다 하나만 두는 "지금 할 일". 화이트 모드에서는 먹색 면, 블랙 모드에서는 한 단계 밝은 면에
 * 제목과 흰 버튼 하나만 두어, 화면을 열자마자 무엇을 하면 되는지가 가장 먼저 눈에 들어오게 한다.
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
  /** 버튼 아래의 작은 정보(예: 예상 시간) */
  meta?: ReactNode;
  /** 아래쪽 보조 영역(예: 이번 주 흐름) */
  children?: ReactNode;
}) {
  return (
    <section aria-label={eyebrow} className="spotlight">
      <div className="flex flex-col gap-7 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-medium text-[#a9c1ff]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#a9c1ff]" />
            {eyebrow}
          </p>
          <h2 className="mt-3 text-[1.375rem] font-semibold leading-snug tracking-[-0.03em] text-white sm:text-[1.75rem]">{title}</h2>
          {detail && <p className="spotlight-muted mt-2 text-sm leading-relaxed">{detail}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:items-end">
          <Link href={href} className="btn btn-light btn-lg group w-full sm:w-auto">
            {cta}
            <Icon name="arrowRight" className="transition group-hover:translate-x-0.5" />
          </Link>
          {meta && <p className="spotlight-muted text-center text-xs sm:text-right">{meta}</p>}
        </div>
      </div>
      {children && <div className="border-t border-white/10 px-6 py-5 sm:px-9">{children}</div>}
    </section>
  );
}
