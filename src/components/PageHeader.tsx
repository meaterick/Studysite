import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 메인 화면을 뺀 모든 페이지가 쓰는 머리글: (돌아가기) → 작은 분류 → 제목 → 설명, 오른쪽에 동작 버튼.
 * 페이지마다 제목 크기·여백·색이 조금씩 달랐던 것을 한 모양으로 맞춘다.
 * tone="operator": 운영자 화면은 주황 강조색으로 스터디원 화면과 구분한다.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
  tone = "default",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  tone?: "default" | "operator";
  className?: string;
}) {
  const accent = tone === "operator" ? "var(--series-orange)" : "var(--series-blue)";
  return (
    <header className={`mb-8 ${className}`}>
      {back && (
        <Link
          href={back.href}
          className="group mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-ink-muted transition hover:text-ink"
        >
          <span aria-hidden="true" className="transition group-hover:-translate-x-0.5">
            ←
          </span>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-2" style={{ color: accent }}>
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
              {eyebrow}
            </p>
          )}
          <h1 className="page-title">{title}</h1>
          {description && <div className="page-lead mt-2">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
