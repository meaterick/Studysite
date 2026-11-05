import { notFound, redirect } from "next/navigation";
import { MODULES, itemId } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import Workspace from "@/components/assignment/Workspace";
import { loadModulePage } from "@/lib/modulePage";
import { findUserSubmission, latestVersion, readNotebook } from "@/lib/submissionStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { mergeDraft } from "@/lib/notebook";
import { courseDocFiles, workspaceTasks } from "@/lib/assignmentView";
import UnfinishedWarning from "@/components/UnfinishedWarning";
import CodingExercise from "@/components/lab/CodingExercise";
import { autoTestViews, exerciseView } from "@/lib/labView";
import { lessonLabel } from "@/content/tiers";
import Icon from "@/components/Icon";
import { assignmentHref, lessonHref, moduleHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.filter((m) => m.assignment).map((m) => ({ module: m.slug }));
}

const KIND_LABEL = { module: "모듈 과제", track: "트랙 프로젝트", capstone: "캡스톤" } as const;

export default async function AssignmentPage({ params }: PageProps<"/modules/[module]/assignment">) {
  const { module: slug } = await params;
  const { user, module, record, status, isAdmin } = await loadModulePage(slug, assignmentHref(slug));
  const spec = module.assignment;
  if (!spec) notFound();
  if (!status.finaleOpen && !isAdmin) redirect(`${moduleHref(slug)}?locked=finale`);
  const key = spec.key;
  const savedDraft = readDraft(user.id, key);
  const previous = savedDraft ? undefined : findUserSubmission(user.id, key);
  const latest = previous ? latestVersion(previous) : undefined;
  const draft = mergeDraft(spec, savedDraft ?? (previous && latest ? readNotebook(previous, latest) : undefined));
  const courseDocs = courseDocFiles(spec);
  const challengesPassed = spec.challenges.filter((c) => record.exercises[itemId(key, c.key)]?.passedAt).length;

  return (
    <ModuleFrame status={status} compact>
      {!isAdmin && (
        <UnfinishedWarning
          context="과제는 핵심 레슨을 모두 마친 뒤에 하는 것을 권장합니다."
          items={status.lessons
            .filter((r) => r.lesson.tier === "core" && r.access !== "completed")
            .map((r) => ({ label: lessonLabel(r.lesson), title: r.lesson.title, href: lessonHref(slug, r.lesson.id) }))}
        />
      )}
      <div className="space-y-16">
        <header aria-labelledby="overview-heading">
          <p className="text-[13px] text-ink-muted">
            {module.code} {KIND_LABEL[spec.kind]} · 자기 점검
          </p>
          <h2 id="overview-heading" className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.035em] text-ink sm:text-[2rem]">
            {spec.title}
          </h2>
          <p className="mt-3 text-sm text-ink-secondary">작업을 마친 뒤 자동 테스트와 자기 점검 기준으로 직접 확인하세요.</p>
        </header>

        <section aria-label="과제 설명" className="max-w-3xl">
          <BlocksRenderer blocks={parseMarkdown(spec.summary)} />
          {spec.requirements.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-3 text-base font-semibold tracking-[-0.02em] text-ink">요구사항</h3>
              <ol className="rows border-y border-[var(--border-hairline)]">
                {spec.requirements.map((r, i) => (
                  <li key={i} className="flex gap-4 py-3 text-[15px] leading-relaxed text-ink-body">
                    <span aria-hidden="true" className="w-5 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <Inline text={r} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <details className="group mt-6">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
              작업 방법
              <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
            </summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
              <li>코드는 브라우저에서 실행되며 설치가 필요하지 않습니다.</li>
              <li>셀끼리 변수를 공유하므로 위에서부터 차례로 실행합니다. 실행: Shift+Enter</li>
              <li>작성 내용은 서버에 자동 저장됩니다. 즉시 저장: Ctrl+S</li>
              <li>답안은 마크다운(표·목록·수식 $…$)으로 작성하고 미리보기로 확인합니다.</li>
              <li>matplotlib 그래프는 실행 결과에 그림으로 작업 공간에 저장됩니다.</li>
            </ul>
          </details>
        </section>

        <section aria-labelledby="workspace-heading">
          <h2 id="workspace-heading" className="mb-5 text-xl font-bold tracking-[-0.03em] text-ink">
            작업 공간
          </h2>
          <Workspace
            assignmentKey={key}
            spec={{ tasks: spec.tasks }}
            tasks={workspaceTasks(spec)}
            initialDraft={draft}
            savedAt={savedDraft?.updatedAt}
            courseDocs={courseDocs}
            selfCheck={
              <fieldset className="mt-6 space-y-3">
                <legend className="text-base font-semibold text-ink">자기 점검 기준</legend>
                {spec.rubric.map((criterion) => (
                  <div key={criterion.id} className="flex items-start gap-3 text-sm">
                    <input type="checkbox" id={`criterion-${criterion.id}`} className="mt-1" />
                    <div>
                      <label htmlFor={`criterion-${criterion.id}`} className="font-medium text-ink">{criterion.label}</label>
                      <p className="mt-1 text-ink-secondary"><Inline text={criterion.guide} /></p>
                    </div>
                  </div>
                ))}
              </fieldset>
            }
            autoTests={autoTestViews(spec)}
          />
        </section>

        {spec.challenges.length > 0 && (
          <section id="challenges" aria-labelledby="challenges-heading" className="scroll-mt-24">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="challenges-heading" className="text-xl font-bold tracking-[-0.03em] text-ink">
                  심화 문제
                </h2>
                <p className="mt-1 text-sm text-ink-muted">선택 · 실행한 결과를 자동으로 확인합니다.</p>
              </div>
              <p className="text-[13px] tabular-nums text-ink-muted">
                통과 {challengesPassed}/{spec.challenges.length}
              </p>
            </div>
            <div className="space-y-5">
              {spec.challenges.map((ex, i) => (
                <CodingExercise key={ex.key} view={exerciseView(itemId(key, ex.key), ex, record, `심화 문제 ${i + 1}`)} />
              ))}
            </div>
          </section>
        )}


      </div>
    </ModuleFrame>
  );
}
