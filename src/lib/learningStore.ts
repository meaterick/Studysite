import "server-only";
import { all, get, run, tx } from "./db";

// 스터디원 한 명의 학습 기록(단계 진행·확인 문제·서술형 답·백지공부·코딩 실습·퀴즈)을 DB에 저장한다.
// 로그인한 사용자만 학습 구역에 들어올 수 있으므로 서버 기록을 진도의 "원본"으로 쓰고,
// 덕분에 다른 기기에서 로그인해도 이어서 학습할 수 있다.

export type QuizReviewStatus = "correct" | "incorrect";

export interface CheckState {
  correct: boolean;
  /** 제출 횟수(정답 포함) */
  attempts: number;
  /** 지금까지 고른 오답 선택지 번호 */
  wrong: number[];
}

export interface QuizAnswerState {
  text: string;
  answeredAt: string;
  review?: QuizReviewStatus;
}

export interface SectionState {
  checks: Record<string, CheckState>;
  answers: Record<string, QuizAnswerState>;
  startedAt?: string;
  completedAt?: string;
}

export type WorksheetMark = "ok" | "weak";

export interface WorksheetState {
  /** 필드 번호("0", "1", …) → 작성 내용 */
  answers: Record<string, string>;
  savedAt?: string;
  submittedAt?: string;
  /** 제출 후 참고 자료와 비교한 자기평가 */
  marks: Record<string, WorksheetMark>;
}

export interface LearningRecord {
  /** 주차 slug → 단계 id → 진행 상태 */
  sections: Record<string, Record<string, SectionState>>;
  /** 주차 slug → 백지공부 */
  worksheets: Record<string, WorksheetState>;
  /** (이전 버전) 수동 체크리스트·퀴즈 자기평가 — 읽기만 하고 더 이상 쓰지 않는다 */
  progress?: Record<string, Partial<Record<string, boolean>>>;
  quizReviews?: Record<string, Record<string, QuizReviewStatus>>;
  /** 피드백함을 마지막으로 확인한 시각. 이보다 새 채점·코멘트를 "새 피드백"으로 표시한다. */
  feedbackSeenAt?: string;
  /** 피드백함 밖(과제 화면)에서 확인한 채점 키("<제출 id>:<채점 시각>") */
  seenGrades?: string[];
  /** 주차 slug → 코딩 실습·퀴즈 기록 (src/content/labs). 단계 완료 조건과는 무관하다. */
  labs?: Record<string, LabWeekState>;
  updatedAt?: string;
}

/** 코딩 실습 하나의 기록. 채점은 브라우저에서 하므로 학습자가 보고한 결과다. */
export interface LabExerciseState {
  /** 채점 횟수 */
  attempts: number;
  /** 지금까지 가장 많이 통과한 채점 항목 수 / 전체 항목 수 */
  bestPassed: number;
  total: number;
  /** 열어 본 힌트 수 */
  hintsUsed: number;
  /** 처음으로 모든 항목을 통과한 시각 */
  passedAt?: string;
  solutionViewedAt?: string;
  lastGradedAt?: string;
}

export interface LabQuizState {
  attempts: number;
  correct?: boolean;
  /** 객관식: 고른 오답 번호 */
  wrong?: number[];
  /** 출력 예측: 마지막으로 낸 답 / 정답 공개 여부 */
  lastAnswer?: string;
  revealed?: boolean;
  /** 서술형: 답안과 자기평가, 스스로 확인한 핵심 요소 번호 */
  text?: string;
  answeredAt?: string;
  review?: QuizReviewStatus;
  checkedPoints?: number[];
}

export interface LabWeekState {
  exercises: Record<string, LabExerciseState>;
  quiz: Record<string, LabQuizState>;
}

// ─── 기록 ↔ 행 ───────────────────────────────────────────────────────────
// 학습 기록 하나를 항목별 행(learning_items)으로 나눠 저장한다. 화면 코드는 지금처럼 기록 전체를 객체로
// 읽고 고치며, 저장할 때는 고치기 전과 비교해 바뀐 항목의 행만 쓴다.

type ItemKind = "section" | "worksheet" | "lab_exercise" | "lab_quiz" | "meta";

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

/** 기록을 행으로 나눈다. sections·worksheets·labs 밖의 필드는 meta 행 하나에 모은다. */
function flattenLearningRecord(record: Partial<LearningRecord>): FlatItem[] {
  const items: FlatItem[] = [];
  const push = (kind: ItemKind, week: string, item: string, value: unknown, completedAt: string | null = null) =>
    items.push({ kind, week_slug: week, item_id: item, data: JSON.stringify(value), completedAt });
  for (const [slug, sections] of Object.entries(record.sections ?? {})) {
    for (const [id, state] of Object.entries(sections ?? {})) push("section", slug, id, state, state?.completedAt ?? null);
  }
  for (const [slug, sheet] of Object.entries(record.worksheets ?? {})) push("worksheet", slug, "", sheet);
  for (const [slug, lab] of Object.entries(record.labs ?? {})) {
    for (const [id, ex] of Object.entries(lab?.exercises ?? {})) push("lab_exercise", slug, id, ex);
    for (const [id, q] of Object.entries(lab?.quiz ?? {})) push("lab_quiz", slug, id, q);
  }
  const rest: Record<string, unknown> = { ...record };
  delete rest.sections;
  delete rest.worksheets;
  delete rest.labs;
  push("meta", "", "", rest);
  return items;
}

function assemble(rows: ItemRow[]): LearningRecord {
  const record: LearningRecord = { sections: {}, worksheets: {} };
  for (const row of rows) {
    const value = JSON.parse(row.data);
    switch (row.kind) {
      case "meta":
        Object.assign(record, value);
        break;
      case "section":
        (record.sections[row.week_slug] ??= {})[row.item_id] = value;
        break;
      case "worksheet":
        record.worksheets[row.week_slug] = value;
        break;
      case "lab_exercise":
        ((record.labs ??= {})[row.week_slug] ??= { exercises: {}, quiz: {} }).exercises[row.item_id] = value;
        break;
      case "lab_quiz":
        ((record.labs ??= {})[row.week_slug] ??= { exercises: {}, quiz: {} }).quiz[row.item_id] = value;
        break;
    }
  }
  return record;
}

const UPSERT_ITEM = `INSERT INTO learning_items (user_id, kind, week_slug, item_id, data, completed_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (user_id, kind, week_slug, item_id)
  DO UPDATE SET data = excluded.data, completed_at = excluded.completed_at, updated_at = excluded.updated_at`;

/** 기록 전체를 행으로 써 넣는다(prev에 없거나 내용이 다른 행만 쓰고, record에 없는 행은 지운다). */
function writeLearningItems(userId: string, record: Partial<LearningRecord>, updatedAt: string, prev: ItemRow[] = []): void {
  const before = new Map(prev.map((r) => [keyOf(r), r.data]));
  const next = flattenLearningRecord(record);
  const nextKeys = new Set<string>();
  for (const item of next) {
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

function readItems(userId: string): ItemRow[] {
  return all<ItemRow>("SELECT kind, week_slug, item_id, data FROM learning_items WHERE user_id = ?", userId);
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
        writeLearningItems(userId, record, record.updatedAt, prev);
        return result;
      })
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getLearningRecord(userId: string): LearningRecord {
  return assemble(readItems(userId));
}

/** 기록 전체를 주어진 내용으로 바꾼다(옛 JSON 가져오기용). */
export function replaceLearningRecord(userId: string, record: Partial<LearningRecord>, updatedAt: string): void {
  tx(() => writeLearningItems(userId, record, updatedAt, readItems(userId)));
}

/** 사용자의 학습 기록이 마지막으로 바뀐 시각(기록이 없으면 undefined) */
export function learningUpdatedAt(userId: string): string | undefined {
  return get<{ at: string | null }>("SELECT MAX(updated_at) AS at FROM learning_items WHERE user_id = ?", userId)?.at ?? undefined;
}

/** 사용자별로, 주어진 단계("주차 slug/단계 id") 가운데 완료한 단계 수 */
export function countCompletedSections(sectionKeys: string[]): Map<string, number> {
  const rows = all<{ user_id: string; n: number }>(
    `SELECT user_id, COUNT(*) AS n FROM learning_items
      WHERE kind = 'section' AND completed_at IS NOT NULL
        AND (week_slug || '/' || item_id) IN (SELECT value FROM json_each(?))
      GROUP BY user_id`,
    JSON.stringify(sectionKeys)
  );
  return new Map(rows.map((r) => [r.user_id, r.n]));
}

/** 사용자별 마지막 학습 기록 시각 */
export function lastLearningActivity(): Map<string, string> {
  const rows = all<{ user_id: string; at: string }>("SELECT user_id, MAX(updated_at) AS at FROM learning_items GROUP BY user_id");
  return new Map(rows.map((r) => [r.user_id, r.at]));
}

/** 한 사용자의 주차별 마지막 학습 기록 시각(주차 slug → 시각) */
export function learningActivityByWeek(userId: string): Map<string, string> {
  const rows = all<{ week_slug: string; at: string }>(
    "SELECT week_slug, MAX(updated_at) AS at FROM learning_items WHERE user_id = ? AND week_slug != '' GROUP BY week_slug",
    userId
  );
  return new Map(rows.map((r) => [r.week_slug, r.at]));
}

export interface AnswerCount {
  total: number;
  /** 스터디원이 보완 필요로 자기평가한 답(백지공부는 보완 필요로 표시한 칸) */
  weak: number;
}

/**
 * 서술형 답안 수를 주차별(week_slug) 또는 사용자별(user_id)로 센다: 단계 서술형·실습 서술형 답과
 * 제출한 백지공부의 칸. 운영자 화면이 모든 기록을 읽지 않고 숫자만 얻는 데 쓴다.
 */
export function countDescriptiveAnswers(by: "week_slug" | "user_id"): Map<string, AnswerCount> {
  const rows = all<{ k: string; n: number; weak: number }>(
    `SELECT k, SUM(n) AS n, SUM(weak) AS weak FROM (
        SELECT li.${by} AS k, COUNT(*) AS n, SUM(json_extract(a.value, '$.review') = 'incorrect') AS weak
          FROM learning_items li, json_each(li.data, '$.answers') a
          WHERE li.kind = 'section' AND json_extract(a.value, '$.text') != '' GROUP BY li.${by}
        UNION ALL
        SELECT ${by}, COUNT(*), SUM(json_extract(data, '$.review') = 'incorrect') FROM learning_items
          WHERE kind = 'lab_quiz' AND json_extract(data, '$.text') != '' GROUP BY ${by}
        UNION ALL
        SELECT li.${by}, COUNT(*), SUM(json_extract(li.data, '$.marks."' || a.key || '"') = 'weak')
          FROM learning_items li, json_each(li.data, '$.answers') a
          WHERE li.kind = 'worksheet' AND json_extract(li.data, '$.submittedAt') IS NOT NULL AND trim(a.value) != '' GROUP BY li.${by}
      ) GROUP BY k`
  );
  return new Map(rows.map((r) => [r.k, { total: r.n, weak: r.weak ?? 0 }]));
}

/** 한 주차에서 모든 사용자가 쓴 서술형 기록. 키는 모두 사용자 id다. */
export interface WeekAnswerRecords {
  /** 단계 id → 단계 상태(서술형 답은 answers) */
  sections: Map<string, Record<string, SectionState>>;
  /** 퀴즈 문항 id → 기록. 답을 저장한 문항(서술형)만 담는다. */
  labQuiz: Map<string, Record<string, LabQuizState>>;
  worksheets: Map<string, WorksheetState>;
}

/** 운영자 화면용: 한 주차의 서술형 답안이 들어 있는 행만 모든 사용자에 대해 읽는다. */
export function readWeekAnswerRecords(weekSlug: string): WeekAnswerRecords {
  const rows = all<{ user_id: string; kind: ItemKind; item_id: string; data: string }>(
    `SELECT user_id, kind, item_id, data FROM learning_items
      WHERE week_slug = ?
        AND (kind = 'worksheet'
          OR (kind = 'section' AND json_extract(data, '$.answers') IS NOT NULL AND json_extract(data, '$.answers') != '{}')
          OR (kind = 'lab_quiz' AND json_extract(data, '$.text') IS NOT NULL))`,
    weekSlug
  );
  const result: WeekAnswerRecords = { sections: new Map(), labQuiz: new Map(), worksheets: new Map() };
  for (const row of rows) {
    const value = JSON.parse(row.data);
    if (row.kind === "section") {
      const byUser = result.sections.get(row.user_id) ?? {};
      byUser[row.item_id] = value;
      result.sections.set(row.user_id, byUser);
    } else if (row.kind === "lab_quiz") {
      const byUser = result.labQuiz.get(row.user_id) ?? {};
      byUser[row.item_id] = value;
      result.labQuiz.set(row.user_id, byUser);
    } else if (row.kind === "worksheet") {
      result.worksheets.set(row.user_id, value);
    }
  }
  return result;
}

function emptySectionState(): SectionState {
  return { checks: {}, answers: {} };
}

/** 기록에서 단계 상태를 꺼내되, 없으면 만들어서 연결해 둔다(수정용). */
export function ensureSectionState(record: LearningRecord, slug: string, sectionId: string): SectionState {
  const week = (record.sections[slug] ??= {});
  const state = (week[sectionId] ??= emptySectionState());
  state.checks ??= {};
  state.answers ??= {};
  return state;
}

export function readSectionState(record: LearningRecord, slug: string, sectionId: string): SectionState {
  return { ...emptySectionState(), ...record.sections[slug]?.[sectionId] };
}

/** 코딩 실습·퀴즈 기록을 꺼내되, 없으면 만들어서 연결해 둔다(수정용). */
export function ensureLabState(record: LearningRecord, slug: string): LabWeekState {
  const labs = (record.labs ??= {});
  const state = (labs[slug] ??= { exercises: {}, quiz: {} });
  state.exercises ??= {};
  state.quiz ??= {};
  return state;
}

export function readLabState(record: LearningRecord, slug: string): LabWeekState {
  const saved = record.labs?.[slug];
  return { exercises: saved?.exercises ?? {}, quiz: saved?.quiz ?? {} };
}

export function readWorksheetState(record: LearningRecord, slug: string): WorksheetState {
  const saved = record.worksheets[slug];
  return { ...saved, answers: saved?.answers ?? {}, marks: saved?.marks ?? {} };
}
