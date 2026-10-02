import Link from "next/link";
import type { ApplyKey, ApplySummary } from "@/lib/applyView";

/**
 * 적용과 복습의 하위 메뉴. 여섯 활동을 권장 순서대로 늘어놓고,
 * 기본 흐름(백지공부 → 과제)을 앞에 두고, 나머지는 "선택" 표시로 구분한다.
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
          <NavLink key={item.key} href={item.href} active={active === item.key} onPath={item.onPath}>
            {item.onPath && (
              <span className="text-[11px] font-black text-[var(--series-blue)]" aria-hidden="true">
                {i + 1}
              </span>
            )}
            {item.locked && <span aria-hidden="true">🔒</span>}
            {item.label}
            {!item.onPath && (
              <span className="rounded border border-dashed border-[var(--border-strong)] px-1 py-px text-[10px] font-bold leading-tight text-ink-muted">선택</span>
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
    </div>
  );
}

function NavLink({ href, active, onPath = false, children }: { href: string; active: boolean; onPath?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold transition ${
        active
          ? "bg-[var(--series-blue)] text-white [&_*]:!text-white [&_.rounded]:!bg-white/25"
          : onPath
            ? "border border-[color-mix(in_srgb,var(--series-blue)_45%,transparent)] bg-card text-ink hover:border-[var(--series-blue)]"
            : "border border-dashed border-[var(--border-strong)] text-ink-secondary hover:border-[var(--series-blue)] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
