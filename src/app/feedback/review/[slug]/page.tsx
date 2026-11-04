import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekLab } from "@/content/labs";
import { quizAnswers } from "@/content/quizAnswers";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { loadWeekPage } from "@/lib/weekPage";
import { readLabState, readSectionState, readWorksheetState } from "@/lib/learningStore";
import { quizItemWeak } from "@/lib/labView";
import { sectionLabel } from "@/content/tiers";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return week ? { title: `${week.number}주차 복습 노트` } : {};
}

type Source = "check" | "descriptive" | "drill";

const SOURCE_LABEL: Record<Source, string> = { check: "확인 문제", descriptive: "서술형", drill: "추가 퀴즈" };

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
 * 복습 노트(피드백함 > 복습): 단계 확인 문제, 서술형, 추가 퀴즈, 백지공부에서 틀렸거나 '보완 필요'로 표시한 것을 한곳에 모은다.
 * 기본은 "다시 볼 문항만" 보여 주고, 전체 기록으로 바꿔 볼 수 있다. 아직 풀지 않은 문항의 정답은 내려보내지 않는다.
 */
export default async function WeekReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;
  const { week, record, status } = await loadWeekPage(slug, `/feedback/review/${slug}`);
  const answers = quizAnswers.find((a) => a.week === week.number)?.answers ?? {};
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
  const lab = getWeekLab(slug);
  const labState = readLabState(record, slug);
  const sheet = readWorksheetState(record, slug);
  const base = `/weeks/${slug}`;

  const groups = status.sections.map(({ section, access }) => {
    const st = readSectionState(record, slug, section.id);
    const notes: Note[] = [];
    section.meta.checks.forEach((check) => {
      const s = st.checks[check.id];
      notes.push({
        id: check.id,
        source: "check",
        question: <Inline text={check.question} />,
        attempted: !!s && s.attempts > 0,
        weak: !!s && s.wrong.length > 0,
        href: `${base}/sections/${section.id}#check`,
        body: s?.correct ? (
          <>
            <p>
              <span className="font-semibold text-[var(--status-good)]">정답</span> <Inline text={check.choices[check.answer]} />
              {s.wrong.length > 0 && <span className="ml-2 text-xs text-[var(--status-critical)]">({s.attempts}번째 시도에서 정답)</span>}
            </p>
            <p className="text-ink-muted">
              <Inline text={check.explanation} />
            </p>
          </>
        ) : s ? (
          <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다.</p>
        ) : undefined,
      });
    });
    section.meta.quizIds.forEach((id) => {
      const a = st.answers[id];
      notes.push({
        id,
        source: "descriptive",
        question: <Inline text={questionText.get(id) ?? ""} />,
        attempted: !!a,
        weak: a?.review === "incorrect",
        href: `${base}/descriptive#sec-${section.id}`,
        body: a ? (
          <>
            <p className="whitespace-pre-wrap">
              <span className="font-semibold">내 답안</span> {a.text}
            </p>
            <p>
              <span className="font-semibold text-[var(--status-good)]">모범답안</span> <Inline text={answers[id] ?? ""} />
            </p>
          </>
        ) : undefined,
      });
    });
    for (const item of (lab?.quiz ?? []).filter((q) => q.sectionId === section.id)) {
      const s = labState.quiz[item.id];
      const weak = quizItemWeak(item, s);
      if (item.kind === "descriptive") {
        notes.push({
          id: item.id,
          source: "descriptive",
          question: <Inline text={item.question} />,
          attempted: !!s?.text,
          weak,
          href: `${base}/descriptive#sec-${section.id}`,
          body: s?.text ? (
            <>
              <p className="whitespace-pre-wrap">
                <span className="font-semibold">내 답안</span> {s.text}
              </p>
              <div>
                <p className="font-semibold text-[var(--status-good)]">모범답안</p>
                <BlocksRenderer blocks={parseMarkdown(item.modelAnswer)} />
              </div>
            </>
          ) : undefined,
        });
      } else if (item.kind === "choice") {
        const reveal = !!s && (!!s.correct || (s.wrong?.length ?? 0) >= 2);
        notes.push({
          id: item.id,
          source: "drill",
          question: <Inline text={item.question} />,
          attempted: !!s && s.attempts > 0,
          weak,
          href: `${base}/drill`,
          body: s ? (
            <>
              {s.correct ? (
                <p>
                  <span className="font-semibold text-[var(--status-good)]">정답</span> <Inline text={item.choices[item.answer]} />
                </p>
              ) : (
                <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다.</p>
              )}
              {reveal && (
                <p className="text-ink-muted">
                  <Inline text={item.explanation} />
                </p>
              )}
            </>
          ) : undefined,
        });
      } else {
        const revealed = !!s && (!!s.correct || !!s.revealed);
        notes.push({
          id: item.id,
          source: "drill",
          question: (
            <>
              <Inline text={item.question ?? "다음 코드의 출력을 예측하십시오."} />
              <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--code-bg)] px-4 py-3 font-mono text-xs text-ink-secondary">{item.code}</pre>
            </>
          ),
          attempted: !!s && s.attempts > 0,
          weak,
          href: `${base}/drill`,
          body: s ? (
            <>
              {s.lastAnswer && !s.correct && (
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold">내 답</span> {s.lastAnswer}
                </p>
              )}
              {revealed ? (
                <>
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-[var(--status-good)]">출력</span> <code className="font-mono">{item.expected}</code>
                  </p>
                  <p className="text-ink-muted">
                    <Inline text={item.explanation} />
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다.</p>
              )}
            </>
          ) : undefined,
        });
      }
    }
    return { section, access, notes };
  });

  const sheetWeak = week.worksheet.map((f, i) => ({ field: f, i, answer: sheet.answers[String(i)] })).filter((f) => sheet.marks?.[String(f.i)] === "weak");
  const allNotes = groups.flatMap((g) => g.notes);
  const weakBySource = (src: Source) => allNotes.filter((n) => n.source === src && n.weak).length;
  const totalWeak = allNotes.filter((n) => n.weak).length + sheetWeak.length;
  const mode: "weak" | "all" = view === "all" || (view !== "weak" && totalWeak === 0) ? "all" : "weak";
  const visible = (n: Note) => (mode === "weak" ? n.weak : true);

  const counts = [
    { label: "확인 문제", n: weakBySource("check") },
    { label: "서술형", n: weakBySource("descriptive") },
    { label: "추가 퀴즈", n: weakBySource("drill") },
    { label: "백지공부", n: sheetWeak.length },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/feedback#review", label: "피드백함" }}
        eyebrow={`${week.number}주차 · ${week.title}`}
        title="복습 노트"
        actions={
          <div role="group" aria-label="보기 방식" className="inline-flex rounded-full border border-[var(--border-hairline)] p-1 text-[13px] font-medium">
            {(
              [
                { key: "weak", label: `다시 볼 문항 ${totalWeak}`, href: `/feedback/review/${slug}?view=weak` },
                { key: "all", label: "전체 기록", href: `/feedback/review/${slug}?view=all` },
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
        }
      />

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
              <h2 id="sheet-weak" className="section-title">
                백지공부 · 보완 필요
              </h2>
              <Link href={`${base}/worksheet`} className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
                비교 자료 다시 보기
              </Link>
            </div>
            <ul className="rows border-y border-[var(--border-hairline)]">
              {sheetWeak.map(({ field, i, answer }) => (
                <li key={i} className="py-4 text-sm">
                  <p className="font-medium text-ink">{field.label}</p>
                  {answer && <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-ink-secondary">{answer}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {groups.map(({ section, access, notes }) => {
          const shown = notes.filter(visible);
          if (shown.length === 0) return null;
          const weak = notes.filter((n) => n.weak).length;
          return (
            <details key={section.id} open={mode === "weak" || weak > 0} className="group">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 border-b border-[var(--border-hairline)] pb-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-[-0.02em] text-ink">
                    {sectionLabel(section)}. {section.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {access === "locked" ? "잠김" : access === "completed" ? "단계 완료" : "단계 미완료"}
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
  );
}
