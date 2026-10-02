import type { Metadata } from "next";
import Link from "next/link";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import { TIER_INFO, TIER_ORDER, type Tier } from "@/content/tiers";
import { getCurrentUser } from "@/lib/dal";
import { loginHref } from "@/lib/returnPath";
import { phaseInfo } from "@/lib/phases";
import { Inline } from "@/components/MarkdownBlocks";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "커리큘럼" };

// 커리큘럼은 처음 온 사람이 과정 전체의 구조(목표·4부 구성·한 주 흐름·단계 구분)를 한눈에 보는 곳이다.

const FLOW = [
  { title: "핵심 단계 학습", place: "학습 자료" },
  { title: "확인 문제", place: "학습 자료" },
  { title: "백지공부", place: "적용과 복습" },
  { title: "과제", place: "적용과 복습" },
];

const TIER_DESC: Record<Tier, string> = {
  core: "그 주의 기본 개념",
  supplement: "실무 도구와 다른 방법으로 넓히는 내용",
  advanced: "수식 유도, 최신 기법, 연구 수준의 내용",
};

/** 목표 마크다운에서 번호 목록만 뽑는다. */
function goalItems(md: string): string[] {
  return md
    .split("\n")
    .map((line) => line.match(/^\d+\.\s+(.*)$/)?.[1])
    .filter((x): x is string => !!x);
}

function Section({ id, title, children, ruled = true }: { id: string; title: string; children: React.ReactNode; ruled?: boolean }) {
  return (
    <section aria-labelledby={id} className={ruled ? "border-t border-[var(--border-hairline)] pt-10" : ""}>
      <h2 id={id} className="section-title mb-8 scroll-mt-24">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CurriculumPage() {
  const user = await getCurrentUser();
  const phases = [...new Set(WEEKS.map((w) => w.phase))];
  const goals = goalItems(syllabus.goalsMd);
  const weekHref = (slug: string) => (user ? `/weeks/${slug}` : loginHref(`/weeks/${slug}`));

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        eyebrow="Aegis AI 스터디 · 8주 커리큘럼"
        title="AI 기초부터 활용까지"
        actions={
          user ? (
            <Link href="/weeks" className="btn btn-primary">
              주차별 자료
            </Link>
          ) : (
            <Link href={loginHref("/weeks")} className="btn btn-primary">
              로그인하고 시작하기
            </Link>
          )
        }
      />

      <dl className="mb-16 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
        {[
          { k: "기간", v: "8주" },
          { k: "구성", v: `${phases.length}부 · ${WEEKS.length}주차` },
          { k: "단계", v: "핵심 · 보충 · 심화" },
        ].map((f) => (
          <div key={f.k} className="px-4 py-5 first:pl-0 sm:px-6">
            <dt className="text-xs text-ink-muted">{f.k}</dt>
            <dd className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-ink sm:text-lg">{f.v}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-16">
        <Section id="goals" title="수료하면 할 수 있는 것" ruled={false}>
          <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {goals.map((g, i) => (
              <li key={i} className="flex gap-4">
                <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] leading-relaxed text-ink-body">
                  <Inline text={g} />
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="phases" title="로드맵">
          <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase) => {
              const info = phaseInfo(phase);
              const weeks = WEEKS.filter((w) => w.phase === phase);
              return (
                <li key={phase} className="flex flex-col">
                  <span aria-hidden="true" className="mb-5 h-[2px] w-full rounded-full" style={{ background: info.color }} />
                  <p className="kicker">Part {String(info.index).padStart(2, "0")}</p>
                  <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-ink">{info.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{info.focus}</p>
                  <ul className="mt-5 space-y-3">
                    {weeks.map((w) => (
                      <li key={w.slug}>
                        <Link href={weekHref(w.slug)} prefetch={user ? undefined : false} className="group flex gap-3 text-sm">
                          <span className="w-5 shrink-0 font-mono text-xs leading-5 text-ink-muted">{String(w.number).padStart(2, "0")}</span>
                          <span className="text-ink-secondary transition group-hover:text-ink">{w.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </Section>

        <Section id="flow" title="한 주의 흐름">
          <ol className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {FLOW.map((f, i) => (
              <li key={f.title} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] text-xs font-semibold text-ink">{i + 1}</span>
                  {i < FLOW.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-[var(--border-hairline)] sm:block" />}
                </div>
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{f.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{f.place}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="tiers" title="단계 구분">
          <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-3">
            {TIER_ORDER.map((tier) => {
              const info = TIER_INFO[tier];
              return (
                <li key={tier}>
                  <p className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: info.color }} />
                    <span className="text-[15px] font-semibold text-ink">{info.label}</span>
                    <span className="text-xs text-ink-muted">{info.audience}</span>
                    {!info.required && <span className="ml-auto text-xs text-ink-muted">선택</span>}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">{TIER_DESC[tier]}</p>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <p className="mt-20 max-w-3xl text-xs leading-relaxed text-ink-muted">{syllabus.designNote}</p>
    </div>
  );
}
