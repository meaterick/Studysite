import Link from "next/link";
import { redirect } from "next/navigation";
import { WEEKS } from "@/content/weeks";
import { Inline } from "@/components/MarkdownBlocks";
import Worksheet from "@/components/Worksheet";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { readSectionState, readWorksheetState } from "@/lib/learningStore";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import NextActivity from "@/components/NextActivity";
import { sectionLabel, splitTierPrefix, TIER_INFO } from "@/content/tiers";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekWorksheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/worksheet`);
  if (!status.finaleOpen && !isAdmin) redirect(`/weeks/${slug}?locked=finale`);
  const sheet = readWorksheetState(record, slug);

  // 제출 전에는 비교 자료를 내려보내지 않는다 — 보면서 쓰면 백지공부가 아니다.
  const review = sheet.submittedAt ? (
    <section aria-labelledby="ws-review" className="rounded-2xl bg-[var(--surface-card-2)] p-6 sm:p-8">
      <h3 id="ws-review" className="text-lg font-semibold tracking-[-0.02em] text-ink">
        내 답안과 비교하기
      </h3>
      <p className="mt-1 text-sm text-ink-muted">빠뜨린 내용이 있으면 해당 칸에 보완 필요를 표시하십시오.</p>
      <p className="mt-6 text-xs font-medium text-ink-muted">핵심 키워드</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {week.keywords.map((k) => (
          <span key={k} className="rounded-full border border-[var(--border-strong)] px-2.5 py-0.5 text-xs text-ink-secondary">
            {k}
          </span>
        ))}
      </div>
      <p className="mt-6 text-xs font-medium text-ink-muted">단계별 학습 목표</p>
      <ol className="mt-2 space-y-2 text-sm leading-relaxed">
        {status.sections.map(({ section }) => {
          const weakAnswers = section.meta.quizIds.filter((id) => readSectionState(record, slug, section.id).answers[id]?.review === "incorrect").length;
          return (
            <li key={section.id}>
              <Link href={`/weeks/${slug}/sections/${section.id}`} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
                {sectionLabel(section)} · {section.title}
              </Link>
              <span className="text-ink-secondary">
                {" "}
                — <Inline text={section.meta.goal} />
              </span>
              {weakAnswers > 0 && <span className="pill ml-2 [--pill:var(--status-critical)]">보완 필요 서술형 {weakAnswers}</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-xs font-medium text-ink-muted">이번 주 학습 목표</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
        {week.objectives.map((o) => {
          const { tier, text } = splitTierPrefix(o);
          return (
            <li key={o}>
              {tier && <span className="text-ink-muted">{TIER_INFO[tier].label} · </span>}
              <Inline text={text} />
            </li>
          );
        })}
      </ul>
    </section>
  ) : undefined;

  return (
    <WeekFrame week={week} status={status} record={record} apply="worksheet" compact>
      {!isAdmin && (
        <UnfinishedWarning
          context="백지공부는 핵심 단계를 모두 마친 뒤에 하는 것을 권장합니다."
          items={status.sections
            .filter((r) => r.section.tier === "core" && r.access !== "completed")
            .map((r) => ({ label: sectionLabel(r.section), title: r.section.title, href: `/weeks/${slug}/sections/${r.section.id}` }))}
        />
      )}
      <section id="worksheet" aria-labelledby="worksheet-heading" className="max-w-3xl scroll-mt-24">
        <h2 id="worksheet-heading" className="text-[1.75rem] font-bold tracking-[-0.035em] text-ink">
          백지공부
        </h2>
        <p className="mb-10 mt-2 text-[15px] text-ink-secondary">자료를 덮고 떠올려 적습니다. 제출하면 비교 자료가 열립니다.</p>
        <Worksheet
          slug={slug}
          fields={week.worksheet}
          saved={sheet.answers}
          savedAt={sheet.savedAt}
          submittedAt={sheet.submittedAt}
          marks={sheet.marks}
          review={review}
        />
        <div className="mt-16">
          <NextActivity slug={slug} href="assignment" label="과제" />
        </div>
      </section>
    </WeekFrame>
  );
}
