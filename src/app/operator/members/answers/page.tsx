import Link from "next/link";
import Form from "next/form";
import { requireAdmin } from "@/lib/dal";
import { listUsers } from "@/lib/userStore";
import { countDescriptiveAnswers, readWeekAnswerRecords, type QuizReviewStatus } from "@/lib/learningStore";
import { formatDateTime } from "@/lib/datetime";
import { WEEKS, getWeek } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { getWeekLab } from "@/content/labs";
import { quizAnswers } from "@/content/quizAnswers";
import { parseMarkdown } from "@/content/markdown";
import type { LabQuizItem, WeekSection } from "@/content/types";
import { sectionLabel, TIER_INFO } from "@/content/tiers";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ReviewPill from "@/components/ReviewPill";
import MembersTabs from "../MembersTabs";

export const metadata = { title: "서술형 응답 · 스터디원 관리" };

// 스터디원이 쓴 서술형 답(단계 서술형·실습 서술형·백지공부)을 문항별로 모아, 같은 문항에 대한 답을 나란히 비교한다.
// 스터디원 관리의 한 화면이다. 스터디원 한 명의 기록 전체는 스터디원 학습 기록 화면에서 본다.

type Filter = "all" | "weak" | "unreviewed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체 답안" },
  { key: "weak", label: "보완 필요" },
  { key: "unreviewed", label: "자기평가 전" },
];

interface Answer {
  userId: string;
  text: string;
  at?: string;
  /** 스터디원의 자기평가(백지공부는 ok → correct, weak → incorrect) */
  review?: QuizReviewStatus;
  /** 실습 서술형: 스스로 체크한 핵심 요소 수 */
  points?: { checked: number; total: number };
}

type DescriptiveLabItem = Extract<LabQuizItem, { kind: "descriptive" }>;

type Question = { id: string; answers: Answer[] } & ({ kind: "quiz"; question: string; model?: string } | { kind: "lab"; item: DescriptiveLabItem });

export default async function OperatorAnswersPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; member?: string; filter?: string }>;
}) {
  await requireAdmin("/operator/members/answers");
  const params = await searchParams;
  const counts = countDescriptiveAnswers("week_slug");
  const members = listUsers();
  const names = new Map(members.map((m) => [m.id, m.name]));
  const joinOrder = new Map(members.map((m, i) => [m.id, i]));

  // 주차를 고르지 않았으면 답이 있는 가장 최근 주차(스터디가 진행 중인 주차)를 보여 준다.
  const week = getWeek(params.week ?? "") ?? [...WEEKS].reverse().find((w) => (counts.get(w.slug)?.total ?? 0) > 0) ?? WEEKS[0];
  const member = members.find((m) => m.id === params.member);
  const filter: Filter = FILTERS.find((f) => f.key === params.filter)?.key ?? "all";

  const records = readWeekAnswerRecords(week.slug);
  // 문항마다 같은 순서(가입 순)로 놓아 스터디원끼리 비교하기 쉽게 한다.
  const collect = (list: Answer[]) =>
    list.filter((a) => !member || a.userId === member.id).sort((a, b) => (joinOrder.get(a.userId) ?? 0) - (joinOrder.get(b.userId) ?? 0));
  const matches = (a: Answer) => filter === "all" || (filter === "weak" ? a.review === "incorrect" : !a.review);

  const modelAnswers = quizAnswers.find((a) => a.week === week.number)?.answers ?? {};
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
  const labItems = (getWeekLab(week.slug)?.quiz ?? []).filter((q): q is DescriptiveLabItem => q.kind === "descriptive");

  const groups: { section: WeekSection; questions: Question[] }[] = getWeekOutline(week).sections.map((section) => ({
    section,
    questions: [
      ...section.meta.quizIds.map(
        (id): Question => ({
          id,
          kind: "quiz",
          question: questionText.get(id) ?? id,
          model: modelAnswers[id],
          answers: collect(
            [...records.sections].flatMap(([userId, byId]) => {
              const a = byId[section.id]?.answers?.[id];
              return a?.text ? [{ userId, text: a.text, at: a.answeredAt, review: a.review }] : [];
            })
          ),
        })
      ),
      ...labItems
        .filter((item) => item.sectionId === section.id)
        .map(
          (item): Question => ({
            id: item.id,
            kind: "lab",
            item,
            answers: collect(
              [...records.labQuiz].flatMap(([userId, byId]) => {
                const s = byId[item.id];
                if (!s?.text) return [];
                const points = s.review ? { checked: s.checkedPoints?.length ?? 0, total: item.keyPoints.length } : undefined;
                return [{ userId, text: s.text, at: s.answeredAt, review: s.review, points }];
              })
            ),
          })
        ),
    ],
  }));

  // 백지공부: 제출한 것만 보여 준다(임시 저장은 스터디원이 아직 쓰는 중인 글이다).
  const worksheet = week.worksheet.map((field, i) => ({
    label: field.label,
    answers: collect(
      [...records.worksheets].flatMap(([userId, sheet]) => {
        const text = sheet.answers?.[String(i)];
        if (!sheet.submittedAt || !text?.trim()) return [];
        const mark = sheet.marks?.[String(i)];
        const review: QuizReviewStatus | undefined = mark === "weak" ? "incorrect" : mark === "ok" ? "correct" : undefined;
        return [{ userId, text, at: sheet.submittedAt, review }];
      })
    ),
  }));

  const everyAnswer = [...groups.flatMap((g) => g.questions.flatMap((q) => q.answers)), ...worksheet.flatMap((f) => f.answers)];
  const summary = {
    total: everyAnswer.length,
    weak: everyAnswer.filter((a) => a.review === "incorrect").length,
    unreviewed: everyAnswer.filter((a) => !a.review).length,
    writers: new Set(everyAnswer.map((a) => a.userId)).size,
  };
  const shownGroups = groups
    .map((g) => ({ ...g, questions: g.questions.map((q) => ({ ...q, answers: q.answers.filter(matches) })).filter((q) => q.answers.length > 0) }))
    .filter((g) => g.questions.length > 0);
  const shownWorksheet = worksheet.map((f) => ({ ...f, answers: f.answers.filter(matches) })).filter((f) => f.answers.length > 0);
  const questionCount = groups.reduce((n, g) => n + g.questions.length, 0);
  const shownCount = shownGroups.reduce((n, g) => n + g.questions.length, 0);

  const href = (next: { week?: string; member?: string; filter?: Filter }) => {
    const qs = new URLSearchParams();
    qs.set("week", next.week ?? week.slug);
    const m = "member" in next ? next.member : member?.id;
    if (m) qs.set("member", m);
    const f = next.filter ?? filter;
    if (f !== "all") qs.set("filter", f);
    return `/operator/members/answers?${qs}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="스터디원 관리"
        description="스터디원이 쓴 서술형 답안과 백지공부를 문항별로 모아 봅니다. 자기평가 결과를 함께 보여 주므로 보완이 필요한 개념을 먼저 짚을 수 있습니다."
      />
      <MembersTabs current="answers" />

      <nav aria-label="주차" className="flex flex-wrap gap-1">
        {WEEKS.map((w) => (
          <Link key={w.slug} href={href({ week: w.slug })} aria-current={w.slug === week.slug ? "true" : undefined} className="chip">
            {w.number}주차
            <span className="tabular-nums opacity-70">{counts.get(w.slug)?.total ?? 0}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav aria-label="자기평가" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link key={f.key} href={href({ filter: f.key })} aria-current={f.key === filter ? "true" : undefined} className="chip">
              {f.label}
            </Link>
          ))}
        </nav>
        <Form action="/operator/members/answers" className="flex items-center gap-2">
          <input type="hidden" name="week" value={week.slug} />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <label htmlFor="answers-member" className="text-[13px] text-ink-muted">
            스터디원
          </label>
          <select
            id="answers-member"
            name="member"
            defaultValue={member?.id ?? ""}
            className="h-8 rounded-full border border-[var(--border-strong)] bg-card pl-3 pr-8 text-[13px] text-ink"
          >
            <option value="">전체</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">
            보기
          </button>
        </Form>
      </div>

      <dl className="mt-10 grid grid-cols-2 border-y border-[var(--border-hairline)] sm:grid-cols-4">
        <SummaryStat label={member ? `${member.name}님의 답안` : "답안"} value={summary.total} />
        <SummaryStat label="보완 필요" value={summary.weak} tone={summary.weak > 0 ? "var(--status-critical)" : undefined} />
        <SummaryStat label="자기평가 전" value={summary.unreviewed} />
        <SummaryStat label="답한 스터디원" value={`${summary.writers}명`} />
      </dl>

      <h2 className="mt-12 text-lg font-bold tracking-[-0.03em] text-ink">
        {week.number}주차 · {week.title}
      </h2>
      <p className="mt-1 text-[13px] text-ink-muted">
        {member && (
          <>
            <Link href={`/operator/members/${member.id}?week=${week.slug}#week-record`} className="font-medium text-ink underline-offset-2 hover:underline">
              {member.name}
            </Link>
            님의 답만 보는 중 ·{" "}
            <Link href={href({ member: undefined })} className="underline-offset-2 hover:text-ink hover:underline">
              전체 보기
            </Link>
            {" · "}
          </>
        )}
        서술형 {questionCount}문항 중 {shownCount}문항
        {shownCount < questionCount && " (답안이 없는 문항은 숨겼습니다)"}
      </p>

      {shownGroups.length === 0 && shownWorksheet.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-10 text-center text-sm text-ink-muted">
          {summary.total === 0 ? "이 주차에는 아직 서술형 답안이 없습니다." : "조건에 맞는 답안이 없습니다."}
        </p>
      )}

      <div className="mt-8 space-y-12">
        {shownGroups.map(({ section, questions }) => (
          <section key={section.id} aria-labelledby={`answers-${section.id}`}>
            <h3 id={`answers-${section.id}`} className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-3 text-[15px] font-semibold text-ink">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIER_INFO[section.tier].color }} />
              {sectionLabel(section)}. {section.title}
            </h3>
            <div className="mt-5 space-y-5">
              {questions.map((q) => (
                <article key={q.id} className="surface p-5 sm:p-6">
                  <p className="text-xs font-medium text-ink-muted">{q.kind === "lab" ? "실습 서술형" : "서술형"}</p>
                  <div className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink">
                    <Inline text={q.kind === "lab" ? q.item.question : q.question} />
                  </div>
                  <details className="group mt-3">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
                      모범답안{q.kind === "lab" && " · 핵심 요소"}
                      <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
                    </summary>
                    <div className="callout callout-good mt-2 text-ink-body">
                      {q.kind === "lab" ? (
                        <>
                          <BlocksRenderer blocks={parseMarkdown(q.item.modelAnswer)} />
                          <p className="mt-3 text-xs font-medium text-[var(--status-good)]">핵심 요소</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5">
                            {q.item.keyPoints.map((p, i) => (
                              <li key={i}>
                                <Inline text={p} />
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Inline text={q.model ?? "(모범답안 준비 중)"} />
                      )}
                    </div>
                  </details>
                  <AnswerList answers={q.answers} names={names} weekSlug={week.slug} />
                </article>
              ))}
            </div>
          </section>
        ))}

        {shownWorksheet.length > 0 && (
          <section aria-labelledby="answers-worksheet">
            <h3 id="answers-worksheet" className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-3 text-[15px] font-semibold text-ink">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-muted)]" />
              백지공부
              <span className="text-xs font-normal text-ink-muted">제출한 것만</span>
            </h3>
            <div className="mt-5 space-y-5">
              {shownWorksheet.map((f) => (
                <article key={f.label} className="surface p-5 sm:p-6">
                  <p className="text-xs font-medium text-ink-muted">백지공부</p>
                  <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink">{f.label}</p>
                  <AnswerList answers={f.answers} names={names} weekSlug={week.slug} />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AnswerList({ answers, names, weekSlug }: { answers: Answer[]; names: Map<string, string>; weekSlug: string }) {
  return (
    <ul className="rows mt-5 border-t border-[var(--border-hairline)]">
      {answers.map((a) => (
          <li key={a.userId} className="py-4 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/operator/members/${a.userId}?week=${weekSlug}#week-record`} className="text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
                {names.get(a.userId) ?? "(탈퇴한 사용자)"}
              </Link>
              <ReviewPill review={a.review} />
              {a.points && (
                <span className="text-xs tabular-nums text-ink-muted">
                  핵심 요소 {a.points.checked}/{a.points.total}
                </span>
              )}
              {a.at && <span className="ml-auto text-xs tabular-nums text-ink-muted">{formatDateTime(a.at)}</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{a.text}</p>
          </li>
      ))}
    </ul>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="border-[var(--border-hairline)] py-5 pr-4 even:border-l even:pl-5 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+2)]:border-l sm:[&:nth-child(n+2)]:pl-5 sm:[&:nth-child(n+3)]:border-t-0">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink" style={tone ? { color: tone } : undefined}>
        {value}
      </dd>
    </div>
  );
}
