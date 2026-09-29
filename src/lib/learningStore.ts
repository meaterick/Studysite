import "server-only";
import fs from "fs";
import path from "path";

// 스터디원 한 명의 학습 기록(단계 진행·확인 문제·서술형 답·백지공부)을 서버의
// data/learning.json에 저장한다. 과제 제출물은 용량이 커서 submissionStore가 따로 관리한다.
// 로그인한 사용자만 학습 구역에 들어올 수 있으므로 서버 기록을 진도의 "원본"으로 쓰고,
// 덕분에 다른 기기에서 로그인해도 이어서 학습할 수 있다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const LEARNING_FILE = path.join(DATA_DIR, "learning.json");

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
  /** 예전 버전의 "실습 완료" 체크 기록. 실습 완료율 계산에만 쓴다. */
  practiceDone?: boolean;
  /** 학습자가 "실습을 마쳤습니다"로 표시한 시각. 완료 조건은 아니고 실습 완료율에만 쓴다. */
  practiceDoneAt?: string;
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
  updatedAt?: string;
}

type LearningFile = Record<string, Partial<LearningRecord>>;

function normalize(record: Partial<LearningRecord> | undefined): LearningRecord {
  return { ...record, sections: record?.sections ?? {}, worksheets: record?.worksheets ?? {} };
}

function readAll(): LearningFile {
  if (!fs.existsSync(LEARNING_FILE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(LEARNING_FILE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as LearningFile) : {};
  } catch {
    return {};
  }
}

function writeAll(next: LearningFile) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${LEARNING_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmp, LEARNING_FILE);
}

// 읽기-수정-쓰기 전체를 하나의 체인으로 직렬화한다. 읽기를 체인 밖에서 하면
// 두 사람이 동시에 저장할 때 먼저 쓴 사람의 기록이 덮어써져 사라진다.
let writeChain: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => T): Promise<T> {
  const run = writeChain.then(task);
  writeChain = run.catch(() => undefined);
  return run;
}

export function updateLearningRecord<T>(userId: string, mutate: (record: LearningRecord) => T): Promise<T> {
  return enqueue(() => {
    const all = readAll();
    const record = normalize(all[userId]);
    const result = mutate(record);
    record.updatedAt = new Date().toISOString();
    writeAll({ ...all, [userId]: record });
    return result;
  });
}

export function getLearningRecord(userId: string): LearningRecord {
  return normalize(readAll()[userId]);
}

export function listLearningRecords(): Record<string, LearningRecord> {
  return Object.fromEntries(Object.entries(readAll()).map(([id, record]) => [id, normalize(record)]));
}

export function deleteLearningRecord(userId: string): Promise<void> {
  return enqueue(() => {
    const all = readAll();
    if (!(userId in all)) return;
    const next = { ...all };
    delete next[userId];
    writeAll(next);
  });
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

export function readWorksheetState(record: LearningRecord, slug: string): WorksheetState {
  const saved = record.worksheets[slug];
  return { ...saved, answers: saved?.answers ?? {}, marks: saved?.marks ?? {} };
}
