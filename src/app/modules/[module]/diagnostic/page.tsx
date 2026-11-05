import Link from "next/link";
import { MODULES, conceptsOf } from "@/content/course";
import { lessonLabel } from "@/content/tiers";
import { Inline, RichText } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import DiagnosticLesson from "@/components/module/DiagnosticLesson";
import { ProgressProvider, type ProgressStatus } from "@/components/progress/ProgressStore";
import { loadModulePage } from "@/lib/modulePage";
import { readLessonState } from "@/lib/learningStore";
import { checkKey } from "@/lib/progressIds";
import { diagnosticHref, lessonHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.filter((m) => m.lessons.some((l) => l.tier === "core")).map((m) => ({ module: m.slug }));
}

/**
 * 진단 평가: 이미 아는 내용을 건너뛰기 위한 화면. 핵심 레슨마다 그 레슨의 확인 문제를 그대로 보여 주고,
 * 모두 맞힌 레슨은 본문을 읽지 않아도 완료로 인정한다. 틀린 문제는 복습 노트에 남으므로, 그 레슨은 직접 학습하면 된다.
 */
export default async function DiagnosticPage({ params }: PageProps<"/modules/[module]/diagnostic">) {
  const { module: slug } = await params;
  const { record, status } = await loadModulePage(slug, diagnosticHref(slug));
  const core = status.lessons.filter((r) => r.lesson.tier === "core");
  const items: Record<string, ProgressStatus> = {};
  for (const { lesson } of core) {
    const st = readLessonState(record, lesson.id);
    for (const c of lesson.checks) items[checkKey(lesson.id, c.key)] = { done: !!st.checks[c.key]?.correct, weak: false };
  }
  const remaining = core.filter((r) => !r.progress.completed).length;

  return (
    <ModuleFrame status={status} compact>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-[1.75rem] font-bold tracking-[-0.035em] text-ink">진단 평가</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">
          핵심 레슨의 확인 문제를 레슨별로 풉니다. 한 레슨의 확인 문제를 모두 맞히면 그 레슨을 완료로 인정하고, 틀린 문제가 있는 레슨은 직접 학습합니다. 남은 레슨 {remaining}개.
        </p>
        <ProgressProvider items={items}>
          <div className="mt-10 space-y-6">
            {core.map(({ lesson, progress }) => {
              const st = readLessonState(record, lesson.id);
              const concepts = conceptsOf(lesson);
              return (
                <DiagnosticLesson
                  key={lesson.id}
                  lessonId={lesson.id}
                  completed={progress.completed}
                  heading={
                    <>
                      <p className="text-xs text-ink-muted">
                        {lessonLabel(lesson)}
                        {concepts.length > 0 && ` · ${concepts.map((c) => `#${c!.order}`).join(" ")}`}
                      </p>
                      <Link href={lessonHref(slug, lesson.id)} className="mt-1 block text-lg font-bold tracking-[-0.03em] text-ink hover:underline hover:underline-offset-4">
                        {lesson.title}
                      </Link>
                    </>
                  }
                  items={lesson.checks.map((check) => {
                    const s = st.checks[check.key] ?? null;
                    const reveal = !!s && (s.correct || s.wrong.length >= 2);
                    return {
                      itemKey: check.key,
                      question: <RichText text={check.question} />,
                      choices: check.choices.map((c, j) => <Inline key={j} text={c} />),
                      state: s,
                      explanation: reveal ? <RichText text={check.explanation} /> : undefined,
                      correctIndex: s?.correct ? check.answer : undefined,
                    };
                  })}
                />
              );
            })}
          </div>
        </ProgressProvider>
      </div>
    </ModuleFrame>
  );
}
