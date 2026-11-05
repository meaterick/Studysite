import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODULES, getModule } from "@/content/course";
import { requireUser } from "@/lib/dal";
import { moduleHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/modules/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = getModule(slug);
  return mod ? { title: `${mod.code} ${mod.title}` } : {};
}

export default async function ModuleLayout({ children, params }: LayoutProps<"/modules/[module]">) {
  const { module: slug } = await params;
  await requireUser(moduleHref(slug));
  const mod = getModule(slug);
  if (!mod) notFound();
  // 이전·다음 모듈: 확장 모듈은 필수 경로와 따로 이어진다.
  const sequence = MODULES.filter((m) => (m.track === "extension") === (mod.track === "extension"));
  const index = sequence.findIndex((m) => m.slug === slug);
  const prev = sequence[index - 1];
  const next = sequence[index + 1];

  const navItem = (label: string, href: string, title: string, align: "left" | "right") => (
    <Link href={href} className={`group min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <span className="kicker block">{label}</span>
      <span className="mt-2 block truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary transition group-hover:text-ink">{title}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {children}
      <nav aria-label="다른 모듈" className="mt-24 grid grid-cols-2 gap-8 border-t border-[var(--border-hairline)] pt-8 print:hidden">
        {prev ? navItem("이전 모듈", moduleHref(prev.slug), `${prev.code} ${prev.title}`, "left") : <span />}
        {next ? navItem("다음 모듈", moduleHref(next.slug), `${next.code} ${next.title}`, "right") : navItem("전체 구성", "/curriculum", "커리큘럼", "right")}
      </nav>
    </div>
  );
}
