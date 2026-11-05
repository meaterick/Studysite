import Link from "next/link";
import Form from "next/form";
import { requireAdmin } from "@/lib/dal";
import { listUsers } from "@/lib/userStore";
import { descriptiveCountsByLesson, readLessonAnswers, readModuleRecalls, type ReviewStatus } from "@/lib/learningStore";
import { formatDateTime } from "@/lib/datetime";
import { MODULES, getModule } from "@/content/course";
import { parseMarkdown } from "@/content/markdown";
import type { Descriptive, Lesson } from "@/content/types";
import { lessonLabel, TIER_INFO } from "@/content/tiers";
import { BlocksRenderer, Inline, RichText } from "@/components/MarkdownBlocks";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ReviewPill from "@/components/ReviewPill";
import MembersTabs from "../MembersTabs";

export const metadata = { title: "서술형 응답 · 스터디원 관리" };

// 스터디원이 쓴 서술형 답안과 백지 복습을 문항별로 모아, 같은 문항에 대한 답을 나란히 비교한다.
// 스터디원 관리의 한 화면이다. 스터디원 한 명의 기록 전체는 스터디원 학습 기록 화면에서 본다.

type Filter = "all" | "weak" | "unreviewed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체 답안" },
  { key: "weak", label: "보완 필요" },
  { key: "unreviewed", label: "자기 평가 전" },
];

interface Answer {
  userId: string;
  text: string;
  at?: string;
  /** 스터디원의 자기평가(백지 복습은 ok → correct, weak → incorrect) */
  review?: ReviewStatus;
  /** 서술형: 스스로 체크한 핵심 요소 수 */
  points?: { checked: number; total: number };
}

export default async function OperatorAnswersPage({ searchParams }: PageProps<"/operator/members/answers">) {
  await requireAdmin("/operator/members/answers");
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const counts = descriptiveCountsByLesson();
  const members = listUsers().filter((u) => u.role === "member");
  const memberIds = new Set(members.map((m) => m.id));
  const names = new Map(members.map((m) => [m.id, m.name]));
  const joinOrder = new Map(members.map((m, i) => [m.id, i]));
  const moduleCount = (slug: string) => getModule(slug)!.lessons.reduce((n, l) => n + (counts.get(l.id)?.total ?? 0), 0);

  // 모듈을 고르지 않았으면 답이 있는 가장 뒤쪽 모듈(스터디가 진행 중인 모듈)을 보여 준다.
  const withDescriptive = MODULES.filter((m) => m.lessons.some((l) => (l.descriptive?.length ?? 0) > 0) || m.recall.length > 0);
  const mod = getModule(one(params.module) ?? "") ?? [...withDescriptive].reverse().find((m) => moduleCount(m.slug) > 0) ?? withDescriptive[0];
  const member = members.find((m) => m.id === one(params.member));
  const filter: Filter = FILTERS.find((f) => f.key === one(params.filter))?.key ?? "all";

  // 문항마다 같은 순서(가입 순)로 놓아 스터디원끼리 비교하기 쉽게 한다. 운영자 계정의 답은 뺀다.
  const collect = (list: Answer[]) =>
    list
      .filter((a) => memberIds.has(a.userId) && (!member || a.userId === member.id))
      .sort((a, b) => (joinOrder.get(a.userId) ?? 0) - (joinOrder.get(b.userId) ?? 0));
  const matches = (a: Answer) => filter === "all" || (filter === "weak" ? a.review === "incorrect" : !a.review);

  const groups: { lesson: Lesson; questions: { item: Descriptive; answers: Answer[] }[] }[] = mod.lessons
    .filter((l) => (l.descriptive?.length ?? 0) > 0)
    .map((lesson) => {
      const records = readLessonAnswers(lesson.id);
      return {
        lesson,
        questions: lesson.descriptive!.map((item) => ({
          item,
          answers: collect(
            [...records].flatMap(([userId, byKey]) => {
              const a = byKey[item.key];
              if (!a?.text) return [];
              const points = a.review ? { checked: a.checkedPoints?.length ?? 0, total: item.keyPoints.length } : undefined;
              return [{ userId, text: a.text, at: a.answeredAt, review: a.review, points }];
            })
          ),
        })),
      };
    });

  // 백지 복습: 제출한 것만 보여 준다(임시 저장은 스터디원이 아직 쓰는 중인 글이다).
  const recalls = readModuleRecalls(mod.slug);
  const recall = mod.recall.map((field, i) => ({
    prompt: field.prompt,
    answers: collect(
      [...recalls].flatMap(([userId, sheet]) => {
        const text = sheet.answers?.[String(i)];
        if (!sheet.submittedAt || !text?.trim()) return [];
        const mark = sheet.marks?.[String(i)];
        const review: ReviewStatus | undefined = mark === "weak" ? "incorrect" : mark === "ok" ? "correct" : undefined;
        return [{ userId, text, at: sheet.submittedAt, review }];
      })
    ),
  }));

  const everyAnswer = [...groups.flatMap((g) => g.questions.flatMap((q) => q.answers)), ...recall.flatMap((f) => f.answers)];
  const summary = {
    total: everyAnswer.length,
    weak: everyAnswer.filter((a) => a.review === "incorrect").length,
    unreviewed: everyAnswer.filter((a) => !a.review).length,
    writers: new Set(everyAnswer.map((a) => a.userId)).size,
  };
  const shownGroups = groups
    .map((g) => ({ ...g, questions: g.questions.map((q) => ({ ...q, answers: q.answers.filter(matches) })).filter((q) => q.answers.length > 0) }))
    .filter((g) => g.questions.length > 0);
  const shownRecall = recall.map((f) => ({ ...f, answers: f.answers.filter(matches) })).filter((f) => f.answers.length > 0);
  const questionCount = groups.reduce((n, g) => n + g.questions.length, 0);
  const shownCount = shownGroups.reduce((n, g) => n + g.questions.length, 0);

  const href = (next: { module?: string; member?: string; filter?: Filter }) => {
    const qs = new URLSearchParams();
    qs.set("module", next.module ?? mod.slug);
    const m = "member" in next ? next.member : member?.id;
    if (m) qs.set("member", m);
    const f = next.filter ?? filter;
    if (f !== "all") qs.set("filter", f);
    return `/operator/members/answers?${qs}`;
  };
  const recordHref = (userId: string) => `/operator/members/${userId}?module=${mod.slug}#module-record`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="스터디원 관리"
        description="스터디원이 작성한 서술형 답안과 백지 복습을 문항별로 모아 봅니다. 자기 평가 결과를 함께 보여 주므로 보완이 필요한 개념을 확인할 수 있습니다."
      />
      <MembersTabs current="answers" />

      <nav aria-label="모듈" className="flex flex-wrap gap-1">
        {withDescriptive.map((m) => (
          <Link key={m.slug} href={href({ module: m.slug })} aria-current={m.slug === mod.slug ? "true" : undefined} className="chip">
            {m.code}
            <span className="tabular-nums opacity-70">{moduleCount(m.slug)}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav aria-label="자기 평가" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link key={f.key} href={href({ filter: f.key })} aria-current={f.key === filter ? "true" : undefined} className="chip">
              {f.label}
            </Link>
          ))}
        </nav>
        <Form action="/operator/members/answers" className="flex items-center gap-2">
          <input type="hidden" name="module" value={mod.slug} />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <label htmlFor="answers-member" className="text-[13px] text-ink-muted">
            스터디원
          </label>
          <select id="answers-member" name="member" defaultValue={member?.id ?? ""} className="h-8 rounded-full border border-[var(--border-strong)] bg-card pl-3 pr-8 text-[13px] text-ink">
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
        <SummaryStat label="자기 평가 전" value={summary.unreviewed} />
        <SummaryStat label="답한 스터디원" value={`${summary.writers}명`} />
      </dl>

      <h2 className="mt-12 text-lg font-bold tracking-[-0.03em] text-ink">
        {mod.code} · {mod.title}
      </h2>
      <p className="mt-1 text-[13px] text-ink-muted">
        {member && (
          <>
            <Link href={recordHref(member.id)} className="font-medium text-ink underline-offset-2 hover:underline">
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

      {shownGroups.length === 0 && shownRecall.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-10 text-center text-sm text-ink-muted">
          {summary.total === 0 ? "이 모듈에는 아직 서술형 답안이 없습니다." : "조건에 맞는 답안이 없습니다."}
        </p>
      )}

      <div className="mt-8 space-y-12">
        {shownGroups.map(({ lesson, questions }) => (
          <section key={lesson.id} aria-labelledby={`answers-${lesson.id}`}>
            <h3 id={`answers-${lesson.id}`} className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-3 text-[15px] font-semibold text-ink">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIER_INFO[lesson.tier].color }} />
              {lessonLabel(lesson)} · {lesson.title}
            </h3>
            <div className="mt-5 space-y-5">
              {questions.map(({ item, answers }) => (
                <article key={item.key} className="surface p-5 sm:p-6">
                  <p className="text-xs font-medium text-ink-muted">서술형</p>
                  <div className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink">
                    <RichText text={item.question} />
                  </div>
                  <details className="group mt-3">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-ink-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
                      모범 답안 · 핵심 요소
                      <Icon name="chevronDown" size={14} className="transition group-open:rotate-180" />
                    </summary>
                    <div className="callout callout-good mt-2 text-ink-body">
                      <BlocksRenderer blocks={parseMarkdown(item.answer)} />
                      {item.keyPoints.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-medium text-[var(--status-good)]">핵심 요소</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5">
                            {item.keyPoints.map((p, i) => (
                              <li key={i}>
                                <Inline text={p} />
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </details>
                  <AnswerList answers={answers} names={names} recordHref={recordHref} />
                </article>
              ))}
            </div>
          </section>
        ))}

        {shownRecall.length > 0 && (
          <section aria-labelledby="answers-recall">
            <h3 id="answers-recall" className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-3 text-[15px] font-semibold text-ink">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-muted)]" />
              백지 복습
              <span className="text-xs font-normal text-ink-muted">제출한 것만</span>
            </h3>
            <div className="mt-5 space-y-5">
              {shownRecall.map((f, i) => (
                <article key={i} className="surface p-5 sm:p-6">
                  <p className="text-xs font-medium text-ink-muted">백지 복습</p>
                  <div className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink">
                    <Inline text={f.prompt} />
                  </div>
                  <AnswerList answers={f.answers} names={names} recordHref={recordHref} />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AnswerList({ answers, names, recordHref }: { answers: Answer[]; names: Map<string, string>; recordHref: (userId: string) => string }) {
  return (
    <ul className="rows mt-5 border-t border-[var(--border-hairline)]">
      {answers.map((a) => (
        <li key={a.userId} className="py-4 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={recordHref(a.userId)} className="text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
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
