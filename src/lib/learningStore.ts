import "server-only";
import { all, get, run, tx } from "./db";

// 스터디원 한 명의 학습 기록(레슨 진행·확인 문제·서술형·출력 예측·코딩 실습·백지 복습)을 DB에 저장한다.
// 로그인한 사용자만 학습 구역에 들어오므로 서버 기록이 진도의 원본이다. 다른 기기에서도 이어서 학습할 수 있다.
//
// 저장 단위(learning_items 한 행):
//   kind = 'lesson'   : week_slug = '',         item_id = 레슨 id         → 레슨 상태(확인 문제·서술형·예측·완료 시각)
//   kind = 'exercise' : week_slug = '',         item_id = 실습 전역 id   → 코딩 실습 채점 기록
//   kind = 'recall'   : week_slug = 모듈 slug,  item_id = ''              → 백지 복습
//   kind = 'meta'     : week_slug = '',         item_id = ''              → 피드백 확인 시각 등
// 레슨·실습 기록은 모듈과 무관하게 레슨 id로 저장하므로, 레슨을 다른 모듈로 옮겨도 진도가 그대로 남는다.
// 이전 8주 과정의 기록(kind = section·worksheet·lab_exercise·lab_quiz)은 읽지도 고치지도 지우지도 않는다.

export type ReviewStatus = "correct" | "incorrect";

export interface CheckState {
  correct: boolean;
  /** 제출 횟수(정답 포함) */
  attempts: number;
  /** 지금까지 고른 오답 선택지 번호 */
  wrong: number[];
}

export interface AnswerState {
  text: string;
  answeredAt: string;
  /** 모범답안과 비교한 자기평가 */
  review?: ReviewStatus;
  /** 스스로 확인한 핵심 요소 번호 */
  checkedPoints?: number[];
}

export interface PredictState {
  attempts: number;
  correct?: boolean;
  lastAnswer?: string;
  /** 정답을 공개했는가(두 번 틀렸거나 직접 공개) */
  revealed?: boolean;
}

export interface LessonState {
  /** 확인 문제 키 → 상태 */
  checks: Record<string, CheckState>;
  /** 서술형 키 → 답안 */
  answers: Record<string, AnswerState>;
  /** 출력 예측 키 → 상태 */
  predicts: Record<string, PredictState>;
  startedAt?: string;
  completedAt?: string;
  /** 진단 평가에서 확인 문제를 모두 맞혀 완료로 인정한 시각 */
  creditedAt?: string;
}

/** 코딩 실습 하나의 기록. 채점은 브라우저에서 하므로 학습자가 보고한 결과다. */
export interface ExerciseState {
  attempts: number;
  /** 지금까지 가장 많이 통과한 채점 항목 수 / 전체 항목 수 */
  bestPassed: number;
  total: number;
  hintsUsed: number;
  passedAt?: string;
  solutionViewedAt?: string;
  lastGradedAt?: string;
}

export type RecallMark = "ok" | "weak";

export interface RecallState {
  /** 문항 번호("0", "1", …) → 작성 내용 */
  answers: Record<string, string>;
  savedAt?: string;
  submittedAt?: string;
  /** 제출 후 학습 자료와 비교한 자기평가 */
  marks: Record<string, RecallMark>;
}

export interface LearningRecord {
  /** 레슨 id → 상태 */
  lessons: Record<string, LessonState>;
  /** 실습 전역 id → 기록 */
  exercises: Record<string, ExerciseState>;
  /** 모듈 slug → 백지 복습 */
  recalls: Record<string, RecallState>;
  /** 피드백함을 마지막으로 확인한 시각. 이보다 새 채점·코멘트를 "새 피드백"으로 표시한다. */
  feedbackSeenAt?: string;
  /** 피드백함 밖(과제 화면)에서 확인한 채점 키("<제출 id>:<채점 시각>") */
  seenGrades?: string[];
  updatedAt?: string;
  /** meta 행의 그 밖의 필드(이전 버전이 남긴 값). 그대로 보존한다. */
  metaExtra?: Record<string, unknown>;
}

// ─── 기록 ↔ 행 ───────────────────────────────────────────────────────────

const KINDS = ["lesson", "exercise", "recall", "meta"] as const;
type ItemKind = (typeof KINDS)[number];
const KIND_SQL = KINDS.map((k) => `'${k}'`).join(", ");

interface ItemRow {
  kind: ItemKind;
  week_slug: string;
  item_id: string;
  data: string;
}

interface FlatItem extends ItemRow {
  completedAt: string | null;
}

const keyOf = (r: Pick<ItemRow, "kind" | "week_slug" | "item_id">) => `${r.kind}\u0001${r.week_slug}\u0001${r.item_id}`;

export function emptyRecord(): LearningRecord {
  return { lessons: {}, exercises: {}, recalls: {} };
}

function flatten(record: LearningRecord): FlatItem[] {
  const items: FlatItem[] = [];
  const push = (kind: ItemKind, slug: string, id: string, value: unknown, completedAt: string | null = null) =>
    items.push({ kind, week_slug: slug, item_id: id, data: JSON.stringify(value), completedAt });
  // completed_at 열은 운영자 집계용이다. 진단 평가로 인정받은 레슨도 완료로 센다.
  for (const [id, state] of Object.entries(record.lessons)) push("lesson", "", id, state, state.completedAt ?? state.creditedAt ?? null);
  for (const [id, state] of Object.entries(record.exercises)) push("exercise", "", id, state, state.passedAt ?? null);
  for (const [slug, state] of Object.entries(record.recalls)) push("recall", slug, "", state, state.submittedAt ?? null);
  push("meta", "", "", { ...record.metaExtra, feedbackSeenAt: record.feedbackSeenAt, seenGrades: record.seenGrades });
  return items;
}

function assemble(rows: ItemRow[]): LearningRecord {
  const record = emptyRecord();
  for (const row of rows) {
    const value = JSON.parse(row.data);
    switch (row.kind) {
      case "lesson":
        record.lessons[row.item_id] = value;
        break;
      case "exercise":
        record.exercises[row.item_id] = value;
        break;
      case "recall":
        record.recalls[row.week_slug] = value;
        break;
      case "meta": {
        const { feedbackSeenAt, seenGrades, ...rest } = value ?? {};
        record.feedbackSeenAt = feedbackSeenAt;
        record.seenGrades = seenGrades;
        record.metaExtra = rest;
        break;
      }
    }
  }
  return record;
}

const UPSERT_ITEM = `INSERT INTO learning_items (user_id, kind, week_slug, item_id, data, completed_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (user_id, kind, week_slug, item_id)
  DO UPDATE SET data = excluded.data, completed_at = excluded.completed_at, updated_at = excluded.updated_at`;

function readItems(userId: string): ItemRow[] {
  return all<ItemRow>(`SELECT kind, week_slug, item_id, data FROM learning_items WHERE user_id = ? AND kind IN (${KIND_SQL})`, userId);
}

/** 바뀐 행만 쓰고, 기록에서 사라진 행(같은 kind 안에서)만 지운다. */
function writeItems(userId: string, record: LearningRecord, updatedAt: string, prev: ItemRow[]): void {
  const before = new Map(prev.map((r) => [keyOf(r), r.data]));
  const nextKeys = new Set<string>();
  for (const item of flatten(record)) {
    const key = keyOf(item);
    nextKeys.add(key);
    if (before.get(key) === item.data) continue;
    run(UPSERT_ITEM, userId, item.kind, item.week_slug, item.item_id, item.data, item.completedAt, updatedAt);
  }
  for (const row of prev) {
    if (!nextKeys.has(keyOf(row))) {
      run("DELETE FROM learning_items WHERE user_id = ? AND kind = ? AND week_slug = ? AND item_id = ?", userId, row.kind, row.week_slug, row.item_id);
    }
  }
}

export function getLearningRecord(userId: string): LearningRecord {
  return assemble(readItems(userId));
}

/** 기록을 읽고 고친 뒤 바뀐 부분만 저장한다. 읽기부터 쓰기까지 한 트랜잭션이라 동시 저장에도 안전하다. */
export function updateLearningRecord<T>(userId: string, mutate: (record: LearningRecord) => T): Promise<T> {
  try {
    return Promise.resolve(
      tx(() => {
        const prev = readItems(userId);
        const record = assemble(prev);
        const result = mutate(record);
        record.updatedAt = new Date().toISOString();
        writeItems(userId, record, record.updatedAt, prev);
        return result;
      })
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

// ─── 기록 안의 항목 꺼내기 ─────────────────────────────────────────────────

const emptyLessonState = (): LessonState => ({ checks: {}, answers: {}, predicts: {} });

/** 레슨 상태를 꺼내되, 없으면 만들어 연결해 둔다(수정용). */
export function ensureLessonState(record: LearningRecord, lessonId: string): LessonState {
  const state = (record.lessons[lessonId] ??= emptyLessonState());
  state.checks ??= {};
  state.answers ??= {};
  state.predicts ??= {};
  return state;
}

export function readLessonState(record: LearningRecord, lessonId: string): LessonState {
  return { ...emptyLessonState(), ...record.lessons[lessonId] };
}

export function readRecallState(record: LearningRecord, moduleSlug: string): RecallState {
  const saved = record.recalls[moduleSlug];
  return { ...saved, answers: saved?.answers ?? {}, marks: saved?.marks ?? {} };
}

// ─── 운영자 화면용 집계(모든 기록을 읽지 않고 필요한 숫자만 모은다) ─────────────────

/** 사용자별 마지막 학습 기록 시각(새 과정 기록 기준) */
export function lastLearningActivity(): Map<string, string> {
  const rows = all<{ user_id: string; at: string }>(
    `SELECT user_id, MAX(updated_at) AS at FROM learning_items WHERE kind IN ('lesson', 'exercise', 'recall') GROUP BY user_id`
  );
  return new Map(rows.map((r) => [r.user_id, r.at]));
}

/** 사용자의 학습 기록이 마지막으로 바뀐 시각 */
export function learningUpdatedAt(userId: string): string | undefined {
  return get<{ at: string | null }>(`SELECT MAX(updated_at) AS at FROM learning_items WHERE user_id = ? AND kind IN ('lesson', 'exercise', 'recall')`, userId)?.at ?? undefined;
}

/** 사용자별 완료한 레슨 id 목록 */
export function completedLessonsByUser(): Map<string, Set<string>> {
  const rows = all<{ user_id: string; item_id: string }>(`SELECT user_id, item_id FROM learning_items WHERE kind = 'lesson' AND completed_at IS NOT NULL`);
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = map.get(r.user_id) ?? new Set<string>();
    set.add(r.item_id);
    map.set(r.user_id, set);
  }
  return map;
}

export interface CheckStat {
  lessonId: string;
  key: string;
  /** 한 번 이상 답한 사람 수 */
  answered: number;
  /** 첫 시도에 맞힌 사람 수 */
  firstTry: number;
}

// 콘텐츠 통계는 스터디원의 기록만 센다(운영자가 검수하며 남긴 기록은 뺀다).
const MEMBERS_ONLY = "JOIN users u ON u.id = li.user_id AND u.role = 'member'";

/** 확인 문제별 응답 수와 첫 시도 정답 수(스터디원 기준) */
export function checkStats(): CheckStat[] {
  return all<{ lesson_id: string; k: string; answered: number; first_try: number }>(
    `SELECT li.item_id AS lesson_id, c.key AS k, COUNT(*) AS answered,
            SUM(json_extract(c.value, '$.correct') = 1 AND json_extract(c.value, '$.attempts') = 1) AS first_try
       FROM learning_items li ${MEMBERS_ONLY}, json_each(li.data, '$.checks') c
      WHERE li.kind = 'lesson'
      GROUP BY li.item_id, c.key`
  ).map((r) => ({ lessonId: r.lesson_id, key: r.k, answered: r.answered, firstTry: r.first_try ?? 0 }));
}

/** 레슨별 완료한 스터디원 수 */
export function lessonCompletionCounts(): Map<string, number> {
  const rows = all<{ item_id: string; n: number }>(
    `SELECT li.item_id, COUNT(*) AS n FROM learning_items li ${MEMBERS_ONLY} WHERE li.kind = 'lesson' AND li.completed_at IS NOT NULL GROUP BY li.item_id`
  );
  return new Map(rows.map((r) => [r.item_id, r.n]));
}

/** 한 레슨의 서술형 답안(사용자 id → 서술형 키 → 답안) */
export function readLessonAnswers(lessonId: string): Map<string, Record<string, AnswerState>> {
  const rows = all<{ user_id: string; data: string }>(
    `SELECT user_id, data FROM learning_items WHERE kind = 'lesson' AND item_id = ? AND json_extract(data, '$.answers') != '{}'`,
    lessonId
  );
  return new Map(rows.map((r) => [r.user_id, (JSON.parse(r.data) as LessonState).answers ?? {}]));
}

/** 서술형 답안 수(레슨별, 스터디원 기준): 전체·보완 필요로 자기평가한 수 */
export function descriptiveCountsByLesson(): Map<string, { total: number; weak: number }> {
  const rows = all<{ item_id: string; n: number; weak: number }>(
    `SELECT li.item_id, COUNT(*) AS n, SUM(json_extract(a.value, '$.review') = 'incorrect') AS weak
       FROM learning_items li ${MEMBERS_ONLY}, json_each(li.data, '$.answers') a
      WHERE li.kind = 'lesson' AND json_extract(a.value, '$.text') != ''
      GROUP BY li.item_id`
  );
  return new Map(rows.map((r) => [r.item_id, { total: r.n, weak: r.weak ?? 0 }]));
}

/** 한 모듈의 백지 복습(사용자 id → 상태) */
export function readModuleRecalls(moduleSlug: string): Map<string, RecallState> {
  const rows = all<{ user_id: string; data: string }>(`SELECT user_id, data FROM learning_items WHERE kind = 'recall' AND week_slug = ?`, moduleSlug);
  return new Map(rows.map((r) => [r.user_id, JSON.parse(r.data) as RecallState]));
}

/** 서술형 답안 수(사용자별): 전체·보완 필요로 자기평가한 수 */
export function descriptiveCountsByUser(): Map<string, { total: number; weak: number }> {
  const rows = all<{ user_id: string; n: number; weak: number }>(
    `SELECT li.user_id, COUNT(*) AS n, SUM(json_extract(a.value, '$.review') = 'incorrect') AS weak
       FROM learning_items li, json_each(li.data, '$.answers') a
      WHERE li.kind = 'lesson' AND json_extract(a.value, '$.text') != ''
      GROUP BY li.user_id`
  );
  return new Map(rows.map((r) => [r.user_id, { total: r.n, weak: r.weak ?? 0 }]));
}

/** 한 사용자의 항목별 마지막 기록 시각: 레슨 id·실습 전역 id·백지 복습 모듈 slug → 시각 */
export function learningActivityByItem(userId: string): { lessons: Map<string, string>; exercises: Map<string, string>; recalls: Map<string, string> } {
  const rows = all<{ kind: ItemKind; week_slug: string; item_id: string; updated_at: string }>(
    `SELECT kind, week_slug, item_id, updated_at FROM learning_items WHERE user_id = ? AND kind IN ('lesson', 'exercise', 'recall')`,
    userId
  );
  const out = { lessons: new Map<string, string>(), exercises: new Map<string, string>(), recalls: new Map<string, string>() };
  for (const r of rows) {
    if (r.kind === "lesson") out.lessons.set(r.item_id, r.updated_at);
    else if (r.kind === "exercise") out.exercises.set(r.item_id, r.updated_at);
    else out.recalls.set(r.week_slug, r.updated_at);
  }
  return out;
}
