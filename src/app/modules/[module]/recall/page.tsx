import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MODULES, conceptsOf } from "@/content/course";
import { lessonLabel } from "@/content/tiers";
import { Inline } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import RecallSheet from "@/components/module/RecallSheet";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import Icon from "@/components/Icon";
import { loadModulePage } from "@/lib/modulePage";
import { readLessonState, readRecallState } from "@/lib/learningStore";
import { assignmentHref, lessonHref, moduleHref, recallHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.filter((m) => m.recall.length > 0).map((m) => ({ module: m.slug }));
}

export default async function RecallPage({ params, searchParams }: PageProps<"/modules/[module]/recall">) {
  const { module: slug } = await params;
  const { finished } = (await searchParams) as { finished?: string };
  const { module, record, status, isAdmin } = await loadModulePage(slug, recallHref(slug));
  if (module.recall.length === 0) notFound();
  if (!status.finaleOpen && !isAdmin) redirect(`${moduleHref(slug)}?locked=finale`);
  const sheet = readRecallState(record, slug);
  const core = status.lessons.filter((r) => r.lesson.tier === "core");

  // 제출 전에는 비교 자료를 내려보내지 않는다. 자료를 보면서 쓰면 인출 연습이 되지 않는다.
  const review = sheet.submittedAt ? (
    <section aria-labelledby="recall-review" className="rounded-2xl bg-[var(--surface-card-2)] p-6 sm:p-8">
      <h3 id="recall-review" className="text-lg font-semibold tracking-[-0.02em] text-ink">
        내 답안과 비교하기
      </h3>
      <p className="mt-1 text-sm text-ink-muted">아래 레슨 목표와 비교해 빠뜨린 내용이 있으면 해당 문항에 보완 필요를 표시하십시오.</p>
      <p className="mt-6 text-xs font-medium text-ink-muted">핵심 레슨의 목표</p>
      <ol className="mt-2 space-y-2.5 text-sm leading-relaxed">
        {core.map(({ lesson }) => {
          const weakAnswers = (lesson.descriptive ?? []).filter((d) => readLessonState(record, lesson.id).answers[d.key]?.review === "incorrect").length;
          const concepts = conceptsOf(lesson);
          return (
            <li key={lesson.id}>
              <Link href={lessonHref(slug, lesson.id)} className="font-medium text-ink underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current">
                {lessonLabel(lesson)} · {lesson.title}
              </Link>
              {concepts.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">{concepts.map((c) => `#${c!.order}`).join(" ")}</span>}
              <span className="text-ink-secondary">
                {" "}
                — <Inline text={lesson.goal} />
              </span>
              {weakAnswers > 0 && <span className="pill ml-2 [--pill:var(--status-critical)]">보완 필요 서술형 {weakAnswers}</span>}
            </li>
          );
        })}
      </ol>
      {module.objectives.length > 0 && (
        <>
          <p className="mt-6 text-xs font-medium text-ink-muted">모듈 학습 목표</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
            {module.objectives.map((o) => (
              <li key={o}>
                <Inline text={o} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  ) : undefined;

  return (
    <ModuleFrame status={status} compact>
      {finished && (
        <p role="status" className="callout callout-good mb-8 flex items-center gap-2.5 font-medium text-ink">
          <Icon name="check" size={16} className="text-[var(--status-good)]" />
          핵심 레슨을 모두 마쳤습니다. 자료를 보지 않고 백지 복습을 작성하십시오.
        </p>
      )}
      {!isAdmin && (
        <UnfinishedWarning
          context="백지 복습은 핵심 레슨을 모두 마친 뒤에 하는 것을 권장합니다."
          items={core.filter((r) => r.access !== "completed").map((r) => ({ label: lessonLabel(r.lesson), title: r.lesson.title, href: lessonHref(slug, r.lesson.id) }))}
        />
      )}
      <section aria-labelledby="recall-heading" className="max-w-3xl">
        <h2 id="recall-heading" className="text-[1.75rem] font-bold tracking-[-0.035em] text-ink">
          백지 복습
        </h2>
        <p className="mb-10 mt-2 text-[15px] text-ink-secondary">학습 자료를 보지 않고 떠오르는 대로 적습니다. 제출하면 비교 자료가 열립니다.</p>
        <RecallSheet
          moduleSlug={slug}
          fields={module.recall.map((r) => ({ label: r.prompt, hint: r.hint }))}
          saved={sheet.answers}
          savedAt={sheet.savedAt}
          submittedAt={sheet.submittedAt}
          marks={sheet.marks}
          review={review}
        />
        {module.assignment && (
          <div className="mt-16">
            <Link href={assignmentHref(slug)} className="group row-hover -mx-3 flex items-center justify-between gap-4 rounded-xl border-y border-[var(--border-hairline)] px-3 py-4">
              <span>
                <span className="kicker block">다음 활동</span>
                <span className="mt-1 block text-[15px] font-semibold text-ink">{module.assignment.title}</span>
              </span>
              <Icon name="arrowRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </section>
    </ModuleFrame>
  );
}
