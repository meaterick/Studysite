import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Check, Exercise, Lesson, Predict } from "@/content/types";
import { itemId } from "@/content/course";
import { lessonLabel } from "@/content/tiers";
import { Inline, RichText } from "@/components/MarkdownBlocks";
import ReviewPill from "@/components/ReviewPill";
import Icon from "@/components/Icon";
import { readLessonState, readRecallState, type CheckState, type ExerciseState, type LearningRecord, type PredictState, type ReviewStatus } from "@/lib/learningStore";
import { ASSIGNMENT_STATUS_LABEL, type ModuleStatus } from "@/lib/study";
import { latestGrade, latestVersion, type Submission } from "@/lib/submissionStore";
import { formatDateTime } from "@/lib/datetime";

// 운영자 화면: 스터디원 한 명이 한 모듈에 남긴 기록 전부
// (레슨 진행·확인 문제 오답·서술형·출력 예측·코딩 실습·백지 복습·과제).
// 코딩 실습에서 쓴 코드는 학습자 브라우저(IndexedDB)에만 있어 여기서는 채점 결과만 보여 준다.

const choiceLetter = (i: number) => String.fromCharCode(65 + i);
type Tone = "good" | "warn" | "bad";
const TONE_COLOR: Record<Tone, string> = { good: "var(--status-good)", warn: "var(--status-serious)", bad: "var(--status-critical)" };
const pillColor = (tone: Tone) => ({ "--pill": TONE_COLOR[tone] }) as CSSProperties;

export default function MemberModuleRecord({
  memberId,
  status,
  learning,
  submission,
  draftSavedAt,
}: {
  memberId: string;
  status: ModuleStatus;
  learning: LearningRecord;
  submission?: Submission;
  /** 작성 중인 과제 초안이 있으면 마지막 자동 저장 시각(시각이 없는 초안은 빈 문자열) */
  draftSavedAt?: string;
}) {
  const { module } = status;
  const lessons = status.lessons.map((r) => r.lesson);
  const recall = readRecallState(learning, module.slug);

  const wrongChecks = lessons.flatMap((lesson) => {
    const state = readLessonState(learning, lesson.id);
    return lesson.checks.flatMap((check) => {
      const s = state.checks[check.key];
      return s && s.wrong.length > 0 ? [{ lesson, check, state: s }] : [];
    });
  });
  const answers = lessons.flatMap((lesson) => {
    const state = readLessonState(learning, lesson.id);
    return (lesson.descriptive ?? []).flatMap((d) => {
      const a = state.answers[d.key];
      return a?.text ? [{ lesson, item: d, answer: a }] : [];
    });
  });
  const predicts = lessons.flatMap((lesson) => {
    const state = readLessonState(learning, lesson.id);
    return (lesson.predicts ?? []).flatMap((p) => {
      const s = state.predicts[p.key];
      return s && (s.attempts > 0 || s.revealed) ? [{ lesson, item: p, state: s }] : [];
    });
  });
  const exercises = [
    ...lessons.flatMap((lesson) => (lesson.exercises ?? []).map((ex) => ({ id: itemId(lesson.id, ex.key), ex, owner: `${lessonLabel(lesson)} · ${lesson.title}` }))),
    ...(module.assignment?.challenges ?? []).map((ex) => ({ id: itemId(module.assignment!.key, ex.key), ex, owner: "과제 심화 문제" })),
  ];
  const exercisesPassed = exercises.filter(({ id }) => learning.exercises[id]?.passedAt).length;
  const predictsTotal = lessons.reduce((n, l) => n + (l.predicts?.length ?? 0), 0);
  const weakAnswers = answers.filter((a) => a.answer.review === "incorrect").length;
  const recallState = recall.submittedAt ? "제출" : recall.savedAt ? "임시 저장" : "없음";

  const parts = [
    { id: "lessons", label: "레슨 진행", count: `${status.tiers.core.done}/${status.tiers.core.total}` },
    { id: "checks", label: "확인 문제 오답", count: String(wrongChecks.length) },
    { id: "descriptive", label: "서술형", count: String(answers.length) },
    ...(predictsTotal > 0 ? [{ id: "predict", label: "출력 예측", count: `${predicts.length}/${predictsTotal}` }] : []),
    ...(exercises.length > 0 ? [{ id: "lab", label: "코딩 실습", count: `${exercisesPassed}/${exercises.length}` }] : []),
    ...(module.recall.length > 0 ? [{ id: "recall", label: "백지 복습", count: recallState }] : []),
    ...(module.assignment
      ? [{ id: "assignment", label: "과제", count: submission ? ASSIGNMENT_STATUS_LABEL[status.assignment!.status] : draftSavedAt !== undefined ? "작성 중" : "미제출" }]
      : []),
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
        <Part id="lessons" title="레슨 진행">
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>레슨</th>
                  <th>상태</th>
                  <th>완료</th>
                  <th>확인 문제 (오답 시도)</th>
                  <th>서술형 자기평가</th>
                  <th>코딩 실습</th>
                </tr>
              </thead>
              <tbody>
                {status.lessons.map(({ lesson, access, progress }) => {
                  const state = readLessonState(learning, lesson.id);
                  const wrongTries = Object.values(state.checks).reduce((sum, c) => sum + c.wrong.length, 0);
                  const weak = (lesson.descriptive ?? []).filter((d) => state.answers[d.key]?.review === "incorrect").length;
                  const doneAt = state.completedAt ?? state.creditedAt;
                  return (
                    <tr key={lesson.id} className="text-ink-secondary">
                      <td className="min-w-[14rem]">
                        {lessonLabel(lesson)} · {lesson.title}
                      </td>
                      <td className={`whitespace-nowrap ${progress.completed ? "text-[var(--status-good)]" : ""}`}>
                        {progress.credited ? "진단 평가로 인정" : progress.completed ? "완료" : access === "current" ? "진행 중" : state.startedAt ? "시작함" : "—"}
                      </td>
                      <td className="whitespace-nowrap tabular-nums text-ink-muted">{doneAt ? formatDateTime(doneAt) : "—"}</td>
                      <td className="whitespace-nowrap tabular-nums">
                        {progress.checksDone}/{progress.checksTotal}
                        {wrongTries > 0 && <span className="text-[var(--status-critical)]"> ({wrongTries})</span>}
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        {progress.answersTotal === 0 ? (
                          "—"
                        ) : (
                          <>
                            {progress.answersDone}/{progress.answersTotal}
                            {weak > 0 && <span className="text-[var(--status-critical)]"> · 보완 필요 {weak}</span>}
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap tabular-nums">{progress.exercisesTotal === 0 ? "—" : `${progress.exercisesPassed}/${progress.exercisesTotal}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Part>

        <Part id="checks" title="확인 문제 오답" note="한 번이라도 틀린 확인 문제와 고른 오답">
          {wrongChecks.length === 0 ? (
            <Empty>틀린 확인 문제가 없습니다.</Empty>
          ) : (
            <ul className="rows border-y border-[var(--border-hairline)]">
              {wrongChecks.map(({ lesson, check, state }) => (
                <WrongCheck key={`${lesson.id}/${check.key}`} lesson={lesson} check={check} state={state} />
              ))}
            </ul>
          )}
        </Part>

        <Part
          id="descriptive"
          title="서술형 답안"
          note={weakAnswers > 0 ? `보완 필요 ${weakAnswers}` : undefined}
          action={
            <Link href={`/operator/members/answers?module=${module.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition hover:text-ink">
              다른 스터디원의 답과 비교
              <Icon name="arrowRight" size={12} />
            </Link>
          }
        >
          {answers.length === 0 ? (
            <Empty>쓴 서술형 답안이 없습니다.</Empty>
          ) : (
            <ul className="space-y-2">
              {answers.map(({ lesson, item, answer }) => (
                <li key={`${lesson.id}/${item.key}`} className="rounded-xl border border-[var(--border-hairline)] px-4 py-3">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                    <span>
                      {lessonLabel(lesson)} · {lesson.title}
                    </span>
                    <ReviewPill review={answer.review} />
                    {answer.review && (
                      <span className="tabular-nums">
                        핵심 요소 {answer.checkedPoints?.length ?? 0}/{item.keyPoints.length}
                      </span>
                    )}
                    <span className="ml-auto tabular-nums">{formatDateTime(answer.answeredAt)}</span>
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-ink">
                    <RichText text={item.question} />
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">{answer.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Part>

        {predictsTotal > 0 && (
          <Part id="predict" title="출력 예측" note={`${predictsTotal}문항 중 ${predicts.length}문항을 풀었습니다`}>
            {predicts.length === 0 ? (
              <Empty>아직 푼 문항이 없습니다.</Empty>
            ) : (
              <ul className="rows border-y border-[var(--border-hairline)]">
                {predicts.map(({ lesson, item, state }) => (
                  <PredictRow key={`${lesson.id}/${item.key}`} lesson={lesson} item={item} state={state} />
                ))}
              </ul>
            )}
          </Part>
        )}

        {exercises.length > 0 && (
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
                  {exercises.map(({ id, ex, owner }) => (
                    <ExerciseRow key={id} ex={ex} owner={owner} state={learning.exercises[id]} />
                  ))}
                </tbody>
              </table>
            </div>
          </Part>
        )}

        {module.recall.length > 0 && (
          <Part
            id="recall"
            title="백지 복습"
            note={recall.submittedAt ? `제출 ${formatDateTime(recall.submittedAt)}` : recall.savedAt ? `임시 저장 ${formatDateTime(recall.savedAt)} · 아직 제출하지 않음` : undefined}
          >
            {!recall.savedAt && !recall.submittedAt ? (
              <Empty>아직 백지 복습을 쓰지 않았습니다.</Empty>
            ) : (
              <dl className="space-y-2">
                {module.recall.map((field, i) => {
                  const mark = recall.marks[String(i)];
                  const review: ReviewStatus | undefined = mark === "weak" ? "incorrect" : mark === "ok" ? "correct" : undefined;
                  return (
                    <div key={i} className="rounded-xl border border-[var(--border-hairline)] px-4 py-3">
                      <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-ink">
                        <Inline text={field.prompt} />
                        {recall.submittedAt && <ReviewPill review={review} />}
                      </dt>
                      <dd className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">{recall.answers[String(i)]?.trim() || "—"}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </Part>
        )}

        {module.assignment && (
          <Part id="assignment" title="과제" note={module.assignment.title}>
            <div className="space-y-2">
              {submission ? <SubmissionSummary submission={submission} label={ASSIGNMENT_STATUS_LABEL[status.assignment!.status]} /> : <Empty>아직 제출하지 않았습니다.</Empty>}
              {draftSavedAt !== undefined && (
                <Link href={`/operator/members/${memberId}/assignment/${module.assignment.key}`} className="surface surface-link flex items-center gap-3 px-4 py-3.5 text-[13px]">
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
        )}
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

function WrongCheck({ lesson, check, state }: { lesson: Lesson; check: Check; state: CheckState }) {
  return (
    <li className="py-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
        <span>
          {lessonLabel(lesson)} · {lesson.title}
        </span>
        <span className="tabular-nums">· 제출 {state.attempts}회</span>
        <span className="pill" style={pillColor(state.correct ? "good" : "bad")}>
          {state.correct ? "이후 정답" : "아직 못 맞힘"}
        </span>
      </p>
      <div className="mt-1 text-[13px] font-medium text-ink">
        <RichText text={check.question} />
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

function PredictRow({ lesson, item, state }: { lesson: Lesson; item: Predict; state: PredictState }) {
  const result: { label: string; tone: Tone } = state.correct
    ? state.attempts <= 1
      ? { label: "한 번에 정답", tone: "good" }
      : { label: `${state.attempts}번째에 정답`, tone: "warn" }
    : state.revealed
      ? { label: "정답 공개", tone: "bad" }
      : { label: `${state.attempts}회 시도 · 아직 못 맞힘`, tone: "bad" };
  return (
    <li className="py-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
        <span>
          {lessonLabel(lesson)} · {lesson.title}
        </span>
        <span className="pill" style={pillColor(result.tone)}>
          {result.label}
        </span>
      </p>
      {item.question && (
        <div className="mt-1 text-[13px] font-medium text-ink">
          <RichText text={item.question} />
        </div>
      )}
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
    </li>
  );
}

function ExerciseRow({ ex, owner, state }: { ex: Exercise; owner: string; state?: ExerciseState }) {
  const tried = !!state && state.attempts > 0;
  return (
    <tr className={tried || state?.passedAt ? "text-ink-secondary" : "text-ink-muted"}>
      <td className="min-w-[14rem]">
        <span className="text-ink">{ex.title}</span>
        <span className="block text-[11px] text-ink-muted">{owner}</span>
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
