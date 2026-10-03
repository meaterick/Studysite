import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { CodingExercise, LabQuizItem, SectionCheck, WeekMeta, WeekSection } from "@/content/types";
import { getWeekLab } from "@/content/labs";
import { sectionLabel } from "@/content/tiers";
import { Inline } from "@/components/MarkdownBlocks";
import ReviewPill from "@/components/ReviewPill";
import Icon from "@/components/Icon";
import {
  readLabState,
  readSectionState,
  readWorksheetState,
  type CheckState,
  type LabExerciseState,
  type LabQuizState,
  type LearningRecord,
  type QuizReviewStatus,
} from "@/lib/learningStore";
import { ASSIGNMENT_STATUS_LABEL, type WeekStatus } from "@/lib/study";
import { latestGrade, latestVersion, type Submission } from "@/lib/submissionStore";
import { QUIZ_KIND_LABEL } from "@/lib/labView";
import { formatDateTime } from "@/lib/datetime";

// 운영자 화면: 스터디원 한 명이 한 주차에 남긴 기록 전부(단계 진행·확인 문제 오답·서술형·백지공부·코딩 실습·추가 퀴즈·과제).
// 코딩 실습에서 쓴 코드는 학습자 브라우저(IndexedDB)에만 있어 여기서는 채점 결과만 보여 준다.

type DescriptiveLabItem = Extract<LabQuizItem, { kind: "descriptive" }>;
type DrillItem = Exclude<LabQuizItem, { kind: "descriptive" }>;

const choiceLetter = (i: number) => String.fromCharCode(65 + i);
type Tone = "good" | "warn" | "bad";
const TONE_COLOR: Record<Tone, string> = { good: "var(--status-good)", warn: "var(--status-serious)", bad: "var(--status-critical)" };
const pillColor = (tone: Tone) => ({ "--pill": TONE_COLOR[tone] }) as CSSProperties;

export default function MemberWeekRecord({
  memberId,
  week,
  status,
  learning,
  submission,
  draftSavedAt,
}: {
  memberId: string;
  week: WeekMeta;
  status: WeekStatus;
  learning: LearningRecord;
  submission?: Submission;
  /** 작성 중인 과제 초안이 있으면 마지막 자동 저장 시각(시각이 없는 옛 초안은 빈 문자열) */
  draftSavedAt?: string;
}) {
  const sections = status.sections.map((r) => r.section);
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const labContent = getWeekLab(week.slug);
  const lab = readLabState(learning, week.slug);
  const worksheet = readWorksheetState(learning, week.slug);
  const descriptive = descriptiveAnswers(week, sections, learning);
  const wrongChecks = sections.flatMap((section) => {
    const state = readSectionState(learning, week.slug, section.id);
    return section.meta.checks.flatMap((check) => {
      const s = state.checks[check.id];
      return s && s.wrong.length > 0 ? [{ section, check, state: s }] : [];
    });
  });
  const exercises = [
    ...(labContent?.exercises ?? []).map((ex) => ({ ex, challenge: false })),
    ...(labContent?.assignment.challenges ?? []).map((ex) => ({ ex, challenge: true })),
  ];
  const exercisesPassed = exercises.filter(({ ex }) => lab.exercises[ex.id]?.passedAt).length;
  const drills = (labContent?.quiz ?? []).filter((q): q is DrillItem => q.kind !== "descriptive");
  const triedDrills = drills.filter((q) => lab.quiz[q.id]);
  const weakDescriptive = descriptive.filter((d) => d.review === "incorrect").length;
  const worksheetState = worksheet.submittedAt ? "제출" : worksheet.savedAt ? "임시 저장" : "없음";

  const parts = [
    { id: "sections", label: "단계 진행", count: `${status.tiers.core.done}/${status.tiers.core.total}` },
    { id: "checks", label: "확인 문제 오답", count: String(wrongChecks.length) },
    { id: "descriptive", label: "서술형", count: String(descriptive.length) },
    { id: "worksheet", label: "백지공부", count: worksheetState },
    ...(labContent
      ? [
          { id: "lab", label: "코딩 실습", count: `${exercisesPassed}/${exercises.length}` },
          { id: "drill", label: "추가 퀴즈", count: `${triedDrills.length}/${drills.length}` },
        ]
      : []),
    { id: "assignment", label: "과제", count: submission ? ASSIGNMENT_STATUS_LABEL[status.assignment.status] : draftSavedAt !== undefined ? "작성 중" : "미제출" },
  ];

  return (
    <div>
      <nav aria-label="기록 구분" className="sticky top-16 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-[var(--border-hairline)] bg-page/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        {parts.map((p) => (
          <a key={p.id} href={`#rec-${p.id}`} className="chip">
            {p.label}
            <span className="tabular-nums text-ink-muted">{p.count}</span>
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-14">
        <Part id="sections" title="단계 진행">
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>단계</th>
                  <th>상태</th>
                  <th>완료</th>
                  <th>확인 문제 (오답 시도)</th>
                  <th>서술형 자기평가</th>
                </tr>
              </thead>
              <tbody>
                {status.sections.map(({ section, access, progress }) => {
                  const state = readSectionState(learning, week.slug, section.id);
                  const wrongTries = Object.values(state.checks).reduce((sum, c) => sum + c.wrong.length, 0);
                  const weak = section.meta.quizIds.filter((q) => state.answers[q]?.review === "incorrect").length;
                  return (
                    <tr key={section.id} className="text-ink-secondary">
                      <td className="min-w-[14rem]">
                        {sectionLabel(section)}. {section.title}
                      </td>
                      <td className={`whitespace-nowrap ${access === "completed" ? "text-[var(--status-good)]" : ""}`}>
                        {access === "completed" ? "완료" : access === "current" ? "진행 중" : state.startedAt ? "시작함" : "—"}
                      </td>
                      <td className="whitespace-nowrap tabular-nums text-ink-muted">{state.completedAt ? formatDateTime(state.completedAt) : "—"}</td>
                      <td className="whitespace-nowrap tabular-nums">
                        {progress.checksDone}/{progress.checksTotal}
                        {wrongTries > 0 && <span className="text-[var(--status-critical)]"> ({wrongTries})</span>}
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        {progress.quizDone}/{progress.quizTotal}
                        {weak > 0 && <span className="text-[var(--status-critical)]"> · 보완 필요 {weak}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Part>

        <Part id="checks" title="확인 문제 오답" note="한 번이라도 틀린 객관식 확인 문제와 고른 오답">
          {wrongChecks.length === 0 ? (
            <Empty>틀린 확인 문제가 없습니다.</Empty>
          ) : (
            <ul className="rows border-y border-[var(--border-hairline)]">
              {wrongChecks.map(({ section, check, state }) => (
                <WrongCheck key={check.id} section={section} check={check} state={state} />
              ))}
            </ul>
          )}
        </Part>

        <Part
          id="descriptive"
          title="서술형 답안"
          note={weakDescriptive > 0 ? `보완 필요 ${weakDescriptive}` : undefined}
          action={
            <Link href={`/operator/answers?week=${week.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition hover:text-ink">
              다른 스터디원의 답과 비교
              <Icon name="arrowRight" size={12} />
            </Link>
          }
        >
          {descriptive.length === 0 ? (
            <Empty>쓴 서술형 답안이 없습니다.</Empty>
          ) : (
            <ul className="space-y-2">
              {descriptive.map((d) => (
                <li key={d.id} className="rounded-xl border border-[var(--border-hairline)] px-4 py-3">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                    <span>
                      {sectionLabel(d.section)} · {d.lab ? "실습 서술형" : "서술형"}
                    </span>
                    <ReviewPill review={d.review} />
                    {d.points && (
                      <span className="tabular-nums">
                        핵심 요소 {d.points.checked}/{d.points.total}
                      </span>
                    )}
                    {d.at && <span className="ml-auto tabular-nums">{formatDateTime(d.at)}</span>}
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-ink">
                    <Inline text={d.question} />
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">{d.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Part>

        <Part
          id="worksheet"
          title="백지공부"
          note={
            worksheet.submittedAt
              ? `제출 ${formatDateTime(worksheet.submittedAt)}`
              : worksheet.savedAt
                ? `임시 저장 ${formatDateTime(worksheet.savedAt)} · 아직 제출하지 않음`
                : undefined
          }
        >
          {!worksheet.savedAt && !worksheet.submittedAt ? (
            <Empty>아직 백지공부를 쓰지 않았습니다.</Empty>
          ) : (
            <dl className="space-y-2">
              {week.worksheet.map((field, i) => {
                const mark = worksheet.marks[String(i)];
                const review: QuizReviewStatus | undefined = mark === "weak" ? "incorrect" : mark === "ok" ? "correct" : undefined;
                return (
                  <div key={field.label} className="rounded-xl border border-[var(--border-hairline)] px-4 py-3">
                    <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-ink">
                      {field.label}
                      {worksheet.submittedAt && <ReviewPill review={review} />}
                    </dt>
                    <dd className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">{worksheet.answers[String(i)]?.trim() || "—"}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </Part>

        {labContent && (
          <Part id="lab" title="코딩 실습" note="채점 결과는 학습자 브라우저에서 실행한 결과입니다. 작성한 코드는 서버에 저장되지 않습니다.">
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>문제</th>
                    <th>결과</th>
                    <th>채점</th>
                    <th>힌트</th>
                    <th>정답 코드</th>
                    <th>마지막 채점</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map(({ ex, challenge }) => (
                    <ExerciseRow key={ex.id} ex={ex} challenge={challenge} section={ex.sectionId ? sectionById.get(ex.sectionId) : undefined} state={lab.exercises[ex.id]} />
                  ))}
                </tbody>
              </table>
            </div>
          </Part>
        )}

        {labContent && (
          <Part id="drill" title="추가 퀴즈" note={`객관식·출력 예측 ${drills.length}문항 중 ${triedDrills.length}문항을 풀었습니다`}>
            {triedDrills.length === 0 ? (
              <Empty>아직 푼 문항이 없습니다.</Empty>
            ) : (
              <ul className="rows border-y border-[var(--border-hairline)]">
                {triedDrills.map((item) => (
                  <DrillRow key={item.id} item={item} section={sectionById.get(item.sectionId)} state={lab.quiz[item.id]} />
                ))}
              </ul>
            )}
          </Part>
        )}

        <Part id="assignment" title="과제" note={week.assignment.title}>
          <div className="space-y-2">
            {submission ? (
              <SubmissionSummary submission={submission} label={ASSIGNMENT_STATUS_LABEL[status.assignment.status]} />
            ) : (
              <Empty>아직 제출하지 않았습니다.</Empty>
            )}
            {draftSavedAt !== undefined && (
              <Link
                href={`/operator/members/${memberId}/assignment/${week.slug}`}
                className="surface surface-link flex items-center gap-3 px-4 py-3.5 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-ink">작업 공간 초안</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {draftSavedAt ? `마지막 자동 저장 ${formatDateTime(draftSavedAt)}` : "자동 저장된 초안"}
                    {submission ? " · 제출 뒤에 고친 내용이 있을 수 있습니다" : " · 아직 제출 전"}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-ink">초안 보기</span>
                <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
              </Link>
            )}
          </div>
        </Part>
      </div>
    </div>
  );
}

function Part({ id, title, note, action, children }: { id: string; title: string; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={`rec-${id}`} aria-labelledby={`rec-${id}-heading`} className="scroll-mt-32">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`rec-${id}-heading`} className="text-[15px] font-semibold text-ink">
          {title}
          {note && <span className="ml-2 text-xs font-normal text-ink-muted">{note}</span>}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-5 text-center text-xs text-ink-muted">{children}</p>;
}

function WrongCheck({ section, check, state }: { section: WeekSection; check: SectionCheck; state: CheckState }) {
  return (
    <li className="py-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
        <span>
          {sectionLabel(section)}. {section.title}
        </span>
        <span className="tabular-nums">· 제출 {state.attempts}회</span>
        <span className="pill" style={pillColor(state.correct ? "good" : "bad")}>
          {state.correct ? "이후 정답" : "아직 못 맞힘"}
        </span>
      </p>
      <div className="mt-1 text-[13px] font-medium text-ink">
        <Inline text={check.question} />
      </div>
      <ul className="mt-1.5 space-y-0.5 text-xs">
        {state.wrong.map((i) => (
          <li key={i} className="text-[var(--status-critical)]">
            고른 오답 {choiceLetter(i)}. <Inline text={check.choices[i] ?? ""} />
          </li>
        ))}
        <li className="text-[var(--status-good)]">
          정답 {choiceLetter(check.answer)}. <Inline text={check.choices[check.answer]} />
        </li>
      </ul>
    </li>
  );
}

function ExerciseRow({
  ex,
  challenge,
  section,
  state,
}: {
  ex: CodingExercise;
  challenge: boolean;
  section?: WeekSection;
  state?: LabExerciseState;
}) {
  const tried = !!state && state.attempts > 0;
  return (
    <tr className={tried || state?.passedAt ? "text-ink-secondary" : "text-ink-muted"}>
      <td className="min-w-[14rem]">
        <span className="text-ink">{ex.title}</span>
        <span className="block text-[11px] text-ink-muted">{challenge ? "과제 심화 문제" : section ? `${sectionLabel(section)}. ${section.title}` : ""}</span>
      </td>
      <td className="whitespace-nowrap">
        {state?.passedAt ? (
          <span className="text-[var(--status-good)]">통과</span>
        ) : tried ? (
          <span className="tabular-nums">
            {state.bestPassed}/{state.total} 항목
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap tabular-nums">{state?.attempts ? `${state.attempts}회` : "—"}</td>
      <td className="whitespace-nowrap tabular-nums">{state?.hintsUsed ? `${state.hintsUsed}/${ex.hints.length}` : "—"}</td>
      <td className="whitespace-nowrap">{state?.solutionViewedAt ? "봄" : "—"}</td>
      <td className="whitespace-nowrap tabular-nums text-ink-muted">{state?.lastGradedAt ? formatDateTime(state.lastGradedAt) : "—"}</td>
    </tr>
  );
}

function DrillRow({ item, section, state }: { item: DrillItem; section?: WeekSection; state?: LabQuizState }) {
  if (!state) return null;
  const wrong = state.wrong ?? [];
  let result: { label: string; tone: Tone };
  if (item.kind === "choice") {
    result = state.correct
      ? wrong.length === 0
        ? { label: "한 번에 정답", tone: "good" }
        : { label: `오답 ${wrong.length}회 뒤 정답`, tone: "warn" }
      : { label: `오답 ${wrong.length}회 · 아직 못 맞힘`, tone: "bad" };
  } else {
    result = state.correct
      ? state.attempts <= 1
        ? { label: "한 번에 정답", tone: "good" }
        : { label: `${state.attempts}번째에 정답`, tone: "warn" }
      : state.revealed
        ? { label: "정답 공개", tone: "bad" }
        : { label: `${state.attempts}회 시도 · 아직 못 맞힘`, tone: "bad" };
  }
  return (
    <li className="py-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
        <span>
          {QUIZ_KIND_LABEL[item.kind]}
          {section && ` · ${sectionLabel(section)}. ${section.title}`}
        </span>
        <span className="pill" style={pillColor(result.tone)}>
          {result.label}
        </span>
      </p>
      <div className="mt-1 text-[13px] font-medium text-ink">
        <Inline text={item.kind === "predict" ? (item.question ?? "다음 코드를 실행하면 무엇이 출력됩니까?") : item.question} />
      </div>
      {item.kind === "choice" ? (
        <ul className="mt-1.5 space-y-0.5 text-xs">
          {wrong.map((i) => (
            <li key={i} className="text-[var(--status-critical)]">
              고른 오답 {choiceLetter(i)}. <Inline text={item.choices[i] ?? ""} />
            </li>
          ))}
          <li className="text-[var(--status-good)]">
            정답 {choiceLetter(item.answer)}. <Inline text={item.choices[item.answer]} />
          </li>
        </ul>
      ) : (
        <>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-xs leading-relaxed text-ink">{item.code}</pre>
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <p className="text-ink-muted">마지막으로 낸 답</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-ink">{state.lastAnswer ?? "—"}</pre>
            </div>
            <div>
              <p className="text-ink-muted">정답 출력</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2 font-mono text-ink">{item.expected}</pre>
            </div>
          </div>
        </>
      )}
    </li>
  );
}

function SubmissionSummary({ submission, label }: { submission: Submission; label: string }) {
  const latest = latestVersion(submission);
  const grade = latestGrade(submission);
  return (
    <Link href={`/operator/submissions/${submission.id}`} className="surface surface-link flex items-center gap-3 px-4 py-3.5 text-[13px]">
      <span className="min-w-0 flex-1">
        <span className="font-medium text-ink">
          제출본 v{latest.version} · {label}
          {grade?.decision === "graded" && grade.score !== null && ` · ${grade.score}/${grade.maxScore}점`}
        </span>
        <span className="mt-0.5 block text-xs tabular-nums text-ink-muted">
          {formatDateTime(latest.submittedAt)} 제출 · 제출 {submission.versions.length}회
        </span>
      </span>
      <span className="shrink-0 font-medium text-ink">{submission.status === "submitted" ? "채점하기" : "제출본 보기"}</span>
      <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
    </Link>
  );
}

interface DescriptiveAnswer {
  id: string;
  section: WeekSection;
  lab: boolean;
  question: string;
  text: string;
  at?: string;
  review?: QuizReviewStatus;
  points?: { checked: number; total: number };
}

/** 한 주차에서 이 스터디원이 쓴 서술형 답(단계 서술형 + 실습 서술형), 단계 순서대로 */
function descriptiveAnswers(week: WeekMeta, sections: WeekSection[], learning: LearningRecord): DescriptiveAnswer[] {
  const lab = readLabState(learning, week.slug);
  const labItems = (getWeekLab(week.slug)?.quiz ?? []).filter((q): q is DescriptiveLabItem => q.kind === "descriptive");
  const questionText = new Map(week.quiz.map((q) => [q.id, q.question]));
  return sections.flatMap((section) => {
    const state = readSectionState(learning, week.slug, section.id);
    const fromSection = section.meta.quizIds.flatMap((id): DescriptiveAnswer[] => {
      const a = state.answers[id];
      return a?.text ? [{ id, section, lab: false, question: questionText.get(id) ?? id, text: a.text, at: a.answeredAt, review: a.review }] : [];
    });
    const fromLab = labItems
      .filter((q) => q.sectionId === section.id)
      .flatMap((q): DescriptiveAnswer[] => {
        const s = lab.quiz[q.id];
        if (!s?.text) return [];
        const points = s.review ? { checked: s.checkedPoints?.length ?? 0, total: q.keyPoints.length } : undefined;
        return [{ id: q.id, section, lab: true, question: q.question, text: s.text, at: s.answeredAt, review: s.review, points }];
      });
    return [...fromSection, ...fromLab];
  });
}
