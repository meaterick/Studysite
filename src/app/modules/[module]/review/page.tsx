import Link from "next/link";
import type { ReactNode } from "react";
import { MODULES } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import { lessonLabel } from "@/content/tiers";
import { BlocksRenderer, Inline, RichText } from "@/components/MarkdownBlocks";
import ModuleFrame from "@/components/module/ModuleFrame";
import Icon from "@/components/Icon";
import { loadModulePage } from "@/lib/modulePage";
import { readLessonState, readRecallState } from "@/lib/learningStore";
import { lessonHref, recallHref, reviewHref } from "@/lib/routes";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

type Source = "check" | "descriptive" | "predict";
const SOURCE_LABEL: Record<Source, string> = { check: "확인 문제", descriptive: "서술형", predict: "출력 예측" };

interface Note {
  id: string;
  source: Source;
  question: ReactNode;
  /** 풀었거나 작성한 문항인가 */
  attempted: boolean;
  weak: boolean;
  /** 내 답·정답·해설(공개 조건을 만족한 것만) */
  body?: ReactNode;
  /** 다시 풀 곳 */
  href: string;
}

/**
 * 복습 노트: 이 모듈의 확인 문제·서술형·출력 예측·백지 복습에서 틀렸거나 보완 필요로 표시한 것을 한곳에 모은다.
 * 기본은 "다시 볼 문항"만 보여 주고, 전체 기록으로 바꿔 볼 수 있다. 아직 풀지 않은 문항의 정답은 내려보내지 않는다.
 */
export default async function ModuleReviewPage({ params, searchParams }: PageProps<"/modules/[module]/review">) {
  const { module: slug } = await params;
  const { view } = (await searchParams) as { view?: string };
  const { module, record, status } = await loadModulePage(slug, reviewHref(slug));
  const sheet = readRecallState(record, slug);

  const groups = status.lessons.map(({ lesson, access }) => {
    const st = readLessonState(record, lesson.id);
    const href = lessonHref(slug, lesson.id);
    const notes: Note[] = [];
    for (const check of lesson.checks) {
      const s = st.checks[check.key];
      notes.push({
        id: `c:${check.key}`,
        source: "check",
        question: <RichText text={check.question} />,
        attempted: !!s && s.attempts > 0,
        weak: !!s && s.wrong.length > 0,
        href: `${href}#check`,
        body: s?.correct ? (
          <>
            <p>
              <span className="font-semibold text-[var(--status-good)]">정답</span> <Inline text={check.choices[check.answer]} />
              {s.wrong.length > 0 && <span className="ml-2 text-xs text-[var(--status-critical)]">({s.attempts}번째 시도에서 정답)</span>}
            </p>
            <p className="text-ink-muted">
              <RichText text={check.explanation} />
            </p>
          </>
        ) : s ? (
          <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다.</p>
        ) : undefined,
      });
    }
    for (const d of lesson.descriptive ?? []) {
      const a = st.answers[d.key];
      notes.push({
        id: `d:${d.key}`,
        source: "descriptive",
        question: <RichText text={d.question} />,
        attempted: !!a,
        weak: a?.review === "incorrect",
        href: `${href}#descriptive`,
        body: a ? (
          <>
            <p className="whitespace-pre-wrap">
              <span className="font-semibold">내 답안</span> {a.text}
            </p>
            <div>
              <p className="font-semibold text-[var(--status-good)]">모범답안</p>
              <BlocksRenderer blocks={parseMarkdown(d.answer)} />
            </div>
          </>
        ) : undefined,
      });
    }
    for (const p of lesson.predicts ?? []) {
      const s = st.predicts[p.key];
      const revealed = !!s && (!!s.correct || !!s.revealed);
      notes.push({
        id: `p:${p.key}`,
        source: "predict",
        question: (
          <>
            <Inline text={p.question ?? "다음 코드의 출력을 예측하십시오."} />
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--code-bg)] px-4 py-3 font-mono text-xs text-ink-secondary">{p.code}</pre>
          </>
        ),
        attempted: !!s && s.attempts > 0,
        weak: (!!s?.revealed && !s?.correct) || (!!s?.correct && (s?.attempts ?? 0) > 1),
        href: `${href}#predict`,
        body: s ? (
          revealed ? (
            <>
              <p className="whitespace-pre-wrap">
                <span className="font-semibold text-[var(--status-good)]">출력</span> <code className="font-mono">{p.expected}</code>
              </p>
              <p className="text-ink-muted">
                <RichText text={p.explanation} />
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다.</p>
          )
        ) : undefined,
      });
    }
    return { lesson, access, notes };
  });

  const sheetWeak = module.recall.map((f, i) => ({ field: f, i, answer: sheet.answers[String(i)] })).filter((f) => sheet.marks[String(f.i)] === "weak");
  const allNotes = groups.flatMap((g) => g.notes);
  const weakBySource = (src: Source) => allNotes.filter((n) => n.source === src && n.weak).length;
  const totalWeak = allNotes.filter((n) => n.weak).length + sheetWeak.length;
  const mode: "weak" | "all" = view === "all" || (view !== "weak" && totalWeak === 0) ? "all" : "weak";
  const visible = (n: Note) => (mode === "weak" ? n.weak : n.attempted || n.source === "check");

  const counts = [
    { label: "확인 문제", n: weakBySource("check") },
    { label: "서술형", n: weakBySource("descriptive") },
    { label: "출력 예측", n: weakBySource("predict") },
    { label: "백지 복습", n: sheetWeak.length },
  ];

  return (
    <ModuleFrame status={status} compact>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[1.75rem] font-bold tracking-[-0.035em] text-ink">복습 노트</h2>
            <p className="mt-2 text-[15px] text-ink-secondary">틀렸거나 보완 필요로 표시한 문항을 모았습니다.</p>
          </div>
          <div role="group" aria-label="보기 방식" className="inline-flex rounded-full border border-[var(--border-hairline)] p-1 text-[13px] font-medium">
            {(
              [
                { key: "weak", label: `다시 볼 문항 ${totalWeak}`, href: `${reviewHref(slug)}?view=weak` },
                { key: "all", label: "전체 기록", href: `${reviewHref(slug)}?view=all` },
              ] as const
            ).map((t) => (
              <Link
                key={t.key}
                href={t.href}
                aria-current={mode === t.key ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 transition ${mode === t.key ? "bg-[var(--inverse-bg)] text-[var(--inverse-fg)]" : "text-ink-muted hover:text-ink"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <dl className="mb-14 grid grid-cols-4 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
          {counts.map((c) => (
            <div key={c.label} className="py-4 pl-4 first:pl-0">
              <dt className="text-xs text-ink-muted">{c.label}</dt>
              <dd className={`mt-1.5 text-xl font-semibold tabular-nums tracking-[-0.03em] ${c.n > 0 ? "text-[var(--status-critical)]" : "text-ink-muted"}`}>{c.n}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-14">
          {mode === "weak" && totalWeak === 0 && <p className="border-y border-[var(--border-hairline)] py-10 text-center text-sm text-ink-muted">다시 볼 문항이 없습니다.</p>}

          {sheetWeak.length > 0 && (
            <section aria-labelledby="sheet-weak">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 id="sheet-weak" className="section-title">
                  백지 복습 · 보완 필요
                </h3>
                <Link href={recallHref(slug)} className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
                  비교 자료 다시 보기
                </Link>
              </div>
              <ul className="rows border-y border-[var(--border-hairline)]">
                {sheetWeak.map(({ field, i, answer }) => (
                  <li key={i} className="py-4 text-sm">
                    <p className="font-medium text-ink">{field.prompt}</p>
                    {answer && <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-ink-secondary">{answer}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {groups.map(({ lesson, access, notes }) => {
            const shown = notes.filter(visible);
            if (shown.length === 0) return null;
            const weak = notes.filter((n) => n.weak).length;
            return (
              <details key={lesson.id} open={mode === "weak" || weak > 0} className="group">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 border-b border-[var(--border-hairline)] pb-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-[-0.02em] text-ink">
                      {lessonLabel(lesson)}. {lesson.title}
                    </span>
                    <span className="mt-1 block text-xs text-ink-muted">
                      {access === "locked" ? "잠김" : access === "completed" ? "레슨 완료" : "레슨 미완료"}
                      {weak > 0 && <span className="text-[var(--status-critical)]"> · 다시 볼 문항 {weak}</span>}
                    </span>
                  </span>
                  <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                </summary>
                <ul className="rows">
                  {shown.map((n) => (
                    <li key={n.id} className="py-5 text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-ink-muted">{SOURCE_LABEL[n.source]}</span>
                        {n.weak && <span className="pill [--pill:var(--status-critical)]">다시 볼 문항</span>}
                      </div>
                      <div className="mt-2 text-[15px] font-medium leading-relaxed text-ink">{n.question}</div>
                      {n.body ? <div className="mt-3 space-y-2 leading-relaxed text-ink-secondary">{n.body}</div> : <p className="mt-1.5 text-xs text-ink-muted">아직 풀지 않았습니다.</p>}
                      {access !== "locked" && (
                        <Link href={n.href} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink">
                          {n.attempted ? "다시 풀기" : "풀러 가기"}
                          <Icon name="arrowRight" size={13} />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </div>
    </ModuleFrame>
  );
}
