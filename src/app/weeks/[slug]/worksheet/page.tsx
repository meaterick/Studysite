import Link from "next/link";
import { redirect } from "next/navigation";
import { WEEKS } from "@/content/weeks";
import { Inline } from "@/components/MarkdownBlocks";
import Worksheet from "@/components/Worksheet";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { readSectionState, readWorksheetState } from "@/lib/learningStore";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekWorksheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}/worksheet`);
  if (!status.allSectionsDone && !isAdmin) redirect(`/weeks/${slug}?locked=finale`);
  const sheet = readWorksheetState(record, slug);

  // 제출 전에는 비교 자료를 내려보내지 않는다 — 보면서 쓰면 백지공부가 아니다.
  const review = sheet.submittedAt ? (
    <section aria-labelledby="ws-review" className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <h3 id="ws-review" className="text-base font-black text-ink">내 답과 비교해보기</h3>
      <p className="mt-1 text-sm text-ink-muted">
        빠뜨린 키워드, 설명하지 못한 섹션 목표가 있다면 그 칸에 &lsquo;부족했어요&rsquo;를 표시하고 해당 섹션을 다시 읽어보세요.
      </p>
      <p className="mt-4 text-xs font-bold text-ink-muted">이번 주 핵심 키워드</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {week.keywords.map((k) => (
          <span key={k} className="rounded-full bg-[var(--surface-card-2)] px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
            {k}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs font-bold text-ink-muted">섹션별 핵심 (다시 보기)</p>
      <ol className="mt-2 space-y-1.5 text-sm">
        {status.sections.map(({ section }) => {
          const weakAnswers = section.meta.quizIds.filter(
            (id) => readSectionState(record, slug, section.id).answers[id]?.review === "incorrect"
          ).length;
          return (
            <li key={section.id}>
              <Link href={`/weeks/${slug}/sections/${section.id}`} className="font-bold text-[var(--series-blue)] hover:underline">
                {section.number}. {section.title}
              </Link>
              <span className="text-ink-secondary"> — <Inline text={section.meta.goal} /></span>
              {weakAnswers > 0 && (
                <span className="ml-1 text-xs font-bold text-[var(--status-critical)]">서술형 부족 {weakAnswers}개</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs font-bold text-ink-muted">이번 주 학습 목표</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
        {week.objectives.map((o) => (
          <li key={o}>
            <Inline text={o} />
          </li>
        ))}
      </ul>
    </section>
  ) : undefined;

  return (
    <WeekFrame week={week} status={status}>
      <section id="worksheet" className="scroll-mt-24">
        <h2 className="mb-1 text-xl font-black text-ink">백지공부</h2>
        <p className="mb-4 text-sm text-ink-muted">
          읽기만 한 내용은 금방 잊히지만, 스스로 꺼내 쓴 내용은 오래 남습니다(인출 연습). 제출하면 비교 자료가 열립니다. 다음 단계는{" "}
          <Link href={`/weeks/${slug}/assignment`} className="font-bold text-[var(--series-blue)] hover:underline">
            과제
          </Link>
          입니다.
        </p>
        <Worksheet
          slug={slug}
          fields={week.worksheet}
          saved={sheet.answers}
          savedAt={sheet.savedAt}
          submittedAt={sheet.submittedAt}
          marks={sheet.marks}
          review={review}
        />
      </section>
    </WeekFrame>
  );
}
