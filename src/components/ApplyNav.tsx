import Link from "next/link";
import type { ApplyKey, ApplySummary } from "@/lib/applyView";

/**
 * 적용과 복습의 하위 메뉴. 여섯 활동을 권장 순서대로 늘어놓고,
 * 평가 활동(백지공부·과제)은 "평가" 표시로, 나머지는 추가 활동으로 구분한다. 둘 다 주차 진행률에는 들어가지 않는다.
 */
export default function ApplyNav({ slug, summary, active }: { slug: string; summary: ApplySummary; active: ApplyKey | "hub" }) {
  return (
    <div className="-mx-4 mb-8 sm:mx-0 print:hidden">
      <nav
        aria-label="적용과 복습 활동"
        className="flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0"
      >
        <NavLink href={`/weeks/${slug}/apply`} active={active === "hub"}>
          <span aria-hidden="true">◎</span> 한눈에 보기
        </NavLink>
        <span aria-hidden="true" className="mx-0.5 my-1.5 w-px shrink-0 bg-[var(--border-hairline)]" />
        {summary.items.map((item, i) => (
          <NavLink key={item.key} href={item.href} active={active === item.key} graded={item.graded}>
            <span className={`text-[11px] font-black ${item.graded ? "text-[var(--series-blue)]" : "text-ink-muted"}`} aria-hidden="true">
              {i + 1}
            </span>
            {item.locked && <span aria-hidden="true">🔒</span>}
            {item.label}
            {item.graded ? (
              <span className="rounded bg-[var(--series-blue)] px-1 py-px text-[10px] font-black leading-tight text-white">평가</span>
            ) : (
              <span className="sr-only">(추가 활동)</span>
            )}
            {item.complete ? (
              <span className="text-[var(--status-good)]" aria-label="완료">
                ✓
              </span>
            ) : item.key === "notes" ? (
              item.weak > 0 && <span className="text-[11px] font-bold text-[var(--status-critical)]">{item.weak}</span>
            ) : (
              item.total > 1 && <span className="text-[11px] font-bold text-ink-muted">{item.state}</span>
            )}
            {item.locked && <span className="sr-only">(잠김)</span>}
          </NavLink>
        ))}
      </nav>
      <p className="mt-2 px-4 text-xs text-ink-muted sm:px-0">
        <span className="font-bold text-[var(--series-blue)]">평가</span> 표시는 제출하면 스터디 평가에 반영되는 활동이고, 점선 테두리는{" "}
        <span className="font-bold text-ink-secondary">추가 활동</span>으로 실력을 다지고 싶을 때 골라서 하면 됩니다. 주차 진행률은 학습 자료의 핵심 단계로만 계산합니다.
      </p>
    </div>
  );
}

function NavLink({ href, active, graded = false, children }: { href: string; active: boolean; graded?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold transition ${
        active
          ? "bg-[var(--series-blue)] text-white [&_*]:!text-white [&_.rounded]:!bg-white/25"
          : graded
            ? "border border-[color-mix(in_srgb,var(--series-blue)_45%,transparent)] bg-card text-ink hover:border-[var(--series-blue)]"
            : "border border-dashed border-[var(--border-strong)] text-ink-secondary hover:border-[var(--series-blue)] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
