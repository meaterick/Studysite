import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekLab } from "@/content/labs";
import { quizAnswers } from "@/content/quizAnswers";
import { parseMarkdown } from "@/content/markdown";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import TierBadge from "@/components/TierBadge";
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
 * 복습 노트: 단계 확인 문제, 서술형, 추가 퀴즈, 백지공부에서 틀렸거나 '보완 필요'로 표시한 것을 한곳에 모은다.
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
  const { week, record, status } = await loadWeekPage(slug, `/weeks/${slug}/quiz`);
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
              <span className="font-bold text-[var(--status-good)]">정답</span> <Inline text={check.choices[check.answer]} />
              {s.wrong.length > 0 && <span className="ml-2 text-xs text-[var(--status-critical)]">({s.attempts}번째 시도에서 정답)</span>}
            </p>
            <p className="text-ink-muted">
              <Inline text={check.explanation} />
            </p>
          </>
        ) : s ? (
          <p className="text-xs text-ink-muted">아직 정답을 맞히지 못했습니다. 단계로 돌아가 다시 풀어 보십시오.</p>
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
              <span className="font-bold">내 답안</span> {a.text}
            </p>
            <p>
              <span className="font-bold text-[var(--status-good)]">모범답안</span> <Inline text={answers[id] ?? ""} />
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
                <span className="font-bold">내 답안</span> {s.text}
              </p>
              <div>
                <p className="font-bold text-[var(--status-good)]">모범답안</p>
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
                  <span className="font-bold text-[var(--status-good)]">정답</span> <Inline text={item.choices[item.answer]} />
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
              <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--surface-card-2)] px-3 py-2 font-mono text-xs text-ink-secondary">{item.code}</pre>
            </>
          ),
          attempted: !!s && s.attempts > 0,
          weak,
          href: `${base}/drill`,
          body: s ? (
            <>
              {s.lastAnswer && !s.correct && (
                <p className="whitespace-pre-wrap">
                  <span className="font-bold">내 답</span> {s.lastAnswer}
                </p>
              )}
              {revealed ? (
                <>
                  <p className="whitespace-pre-wrap">
                    <span className="font-bold text-[var(--status-good)]">출력</span> <code className="font-mono">{item.expected}</code>
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

  return (
    <WeekFrame week={week} status={status} record={record} apply="notes">
      <div className="space-y-8">
        <section aria-labelledby="notes-intro">
          <h2 id="notes-intro" className="flex flex-wrap items-center gap-2 text-xl font-black text-ink">
            복습 노트 <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            한 번이라도 틀린 문제와 &lsquo;보완이 필요합니다&rsquo;로 표시한 답을 단계별로 모았습니다. 시험 전이나 다음 주로 넘어가기 전에 이 목록만 다시 보면 됩니다.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "확인 문제", n: weakBySource("check") },
              { label: "서술형", n: weakBySource("descriptive") },
              { label: "추가 퀴즈", n: weakBySource("drill") },
              { label: "백지공부", n: sheetWeak.length },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-[var(--border-hairline)] bg-card px-3 py-2.5">
                <dt className="text-xs font-bold text-ink-muted">{c.label}</dt>
                <dd className={`text-xl font-black ${c.n > 0 ? "text-[var(--status-critical)]" : "text-ink-muted"}`}>
                  {c.n}
                  <span className="ml-1 text-xs font-bold text-ink-muted">개</span>
                </dd>
              </div>
            ))}
          </dl>
          <div role="group" aria-label="보기 방식" className="mt-4 inline-flex rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card-2)] p-1 text-sm font-bold">
            {(
              [
                { key: "weak", label: `다시 볼 문항만 (${totalWeak})`, href: `${base}/quiz?view=weak` },
                { key: "all", label: "전체 기록", href: `${base}/quiz?view=all` },
              ] as const
            ).map((t) => (
              <Link
                key={t.key}
                href={t.href}
                aria-current={mode === t.key ? "page" : undefined}
                className={`rounded-md px-3 py-1 transition ${mode === t.key ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </section>

        {mode === "weak" && totalWeak === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-ink-muted">
            다시 볼 문항이 없습니다. 문제를 풀면서 틀리거나 &lsquo;보완 필요&rsquo;로 표시한 것이 여기에 모입니다.
          </p>
        )}

        {sheetWeak.length > 0 && (
          <section aria-labelledby="sheet-weak" className="rounded-xl border border-[var(--status-critical)]/40 bg-card p-4 sm:p-5">
            <h3 id="sheet-weak" className="font-black text-ink">
              백지공부에서 보완이 필요하다고 표시한 칸 <span className="text-sm text-[var(--status-critical)]">{sheetWeak.length}</span>
            </h3>
            <ul className="mt-3 space-y-3 text-sm">
              {sheetWeak.map(({ field, i, answer }) => (
                <li key={i} className="rounded-lg border border-[var(--border-hairline)] px-3 py-2.5">
                  <p className="font-medium text-ink">{field.label}</p>
                  {answer && <p className="mt-1 whitespace-pre-wrap text-ink-secondary">{answer}</p>}
                </li>
              ))}
            </ul>
            <Link href={`${base}/worksheet`} className="mt-3 inline-block text-sm font-bold text-[var(--series-blue)] hover:underline">
              백지공부에서 비교 자료 다시 보기 →
            </Link>
          </section>
        )}

        <div className="space-y-4">
          {groups.map(({ section, access, notes }) => {
            const shown = notes.filter(visible);
            if (shown.length === 0) return null;
            const weak = notes.filter((n) => n.weak).length;
            return (
              <details key={section.id} open={mode === "weak" || weak > 0} className="group rounded-xl border border-[var(--border-hairline)] bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 font-black text-ink">
                      {sectionLabel(section)}. {section.title}
                      {section.tier !== "core" && <TierBadge tier={section.tier} compact />}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-ink-muted">
                      {access === "locked" ? "잠김" : access === "completed" ? "단계 완료" : "단계 미완료"}
                      {weak > 0 && <span className="text-[var(--status-critical)]"> · 다시 볼 문항 {weak}</span>}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-ink-muted transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <ul className="space-y-3 border-t border-[var(--border-hairline)] p-4 sm:p-5">
                  {shown.map((n) => (
                    <li
                      key={n.id}
                      className={`rounded-lg border px-3 py-3 text-sm ${n.weak ? "border-[var(--status-critical)]/40" : "border-[var(--border-hairline)]"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="rounded bg-[var(--surface-card-2)] px-1.5 py-0.5 text-ink-secondary">{SOURCE_LABEL[n.source]}</span>
                        {n.weak && <span className="text-[var(--status-critical)]">다시 볼 문항</span>}
                      </div>
                      <div className="mt-1.5 font-medium text-ink">{n.question}</div>
                      {n.body ? (
                        <div className="mt-2 space-y-1.5 text-ink-secondary">{n.body}</div>
                      ) : (
                        <p className="mt-1 text-xs text-ink-muted">아직 풀지 않았습니다.</p>
                      )}
                      {access !== "locked" && (
                        <Link href={n.href} className="mt-2 inline-block text-xs font-bold text-[var(--series-blue)] hover:underline">
                          {n.attempted ? "다시 풀기" : "풀러 가기"} →
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
    </WeekFrame>
  );
}
