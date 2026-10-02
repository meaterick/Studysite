import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";

/**
 * 메인 화면을 뺀 모든 페이지의 머리글: (돌아가기) → 작은 분류 → 제목 → 설명, 오른쪽에 동작 버튼.
 * 색은 쓰지 않고 크기와 굵기, 여백만으로 위계를 만든다.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  /** 예전 호출과의 호환용(색 구분은 더 이상 하지 않는다) */
  tone?: "default" | "operator";
  className?: string;
}) {
  return (
    <header className={`mb-10 ${className}`}>
      {back && (
        <Link href={back.href} className="group mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink">
          <Icon name="arrowLeft" size={15} className="transition group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {description && <div className="page-lead mt-3">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
