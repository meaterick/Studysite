import "server-only";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const LEARNING_FILE = path.join(DATA_DIR, "learning.json");

const CHECKLIST_IDS = new Set(["learn", "practice", "quiz", "worksheet", "assignment"]);
const QUIZ_STATUSES = new Set(["correct", "incorrect"]);

export type QuizReviewStatus = "correct" | "incorrect";
export type LearningProgress = Record<string, Partial<Record<string, boolean>>>;
export type QuizReviews = Record<string, Record<string, QuizReviewStatus>>;

export interface LearningRecord {
  progress: LearningProgress;
  quizReviews: QuizReviews;
  updatedAt?: string;
}

type LearningStore = Record<string, LearningRecord>;

function readAll(): LearningStore {
  if (!fs.existsSync(LEARNING_FILE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(LEARNING_FILE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as LearningStore) : {};
  } catch {
    return {};
  }
}

let writeChain: Promise<void> = Promise.resolve();

function writeAll(next: LearningStore): Promise<void> {
  writeChain = writeChain.then(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${LEARNING_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
    fs.renameSync(tmp, LEARNING_FILE);
  });
  return writeChain;
}

export function getLearningRecord(userId: string): LearningRecord {
  return readAll()[userId] ?? { progress: {}, quizReviews: {} };
}

export function listLearningRecords(): LearningStore {
  return readAll();
}

export async function saveLearningProgress(userId: string, progress: LearningProgress) {
  const all = readAll();
  const previous = all[userId] ?? { progress: {}, quizReviews: {} };
  await writeAll({ ...all, [userId]: { ...previous, progress, updatedAt: new Date().toISOString() } });
}

export async function saveQuizReviews(userId: string, slug: string, reviews: Record<string, QuizReviewStatus>) {
  const all = readAll();
  const previous = all[userId] ?? { progress: {}, quizReviews: {} };
  await writeAll({
    ...all,
    [userId]: {
      ...previous,
      quizReviews: { ...previous.quizReviews, [slug]: reviews },
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function deleteLearningRecord(userId: string) {
  const all = readAll();
  if (!(userId in all)) return;
  const next = { ...all };
  delete next[userId];
  await writeAll(next);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isSafeKey(value: string) {
  return /^[a-z0-9-]{1,48}$/i.test(value);
}

/** Validate and minimize client-supplied completion flags before persisting them. */
export function normalizeProgress(value: unknown): LearningProgress | null {
  if (!isPlainRecord(value)) return null;
  const result: LearningProgress = {};
  const entries = Object.entries(value);
  if (entries.length > 12) return null;
  for (const [slug, flags] of entries) {
    if (!isSafeKey(slug) || !isPlainRecord(flags)) return null;
    const normalized: Partial<Record<string, boolean>> = {};
    for (const [id, done] of Object.entries(flags)) {
      if (!CHECKLIST_IDS.has(id) || typeof done !== "boolean") return null;
      normalized[id] = done;
    }
    result[slug] = normalized;
  }
  return result;
}

export function normalizeReviews(value: unknown): Record<string, QuizReviewStatus> | null {
  if (!isPlainRecord(value) || Object.keys(value).length > 64) return null;
  const result: Record<string, QuizReviewStatus> = {};
  for (const [questionId, status] of Object.entries(value)) {
    if (!isSafeKey(questionId) || typeof status !== "string" || !QUIZ_STATUSES.has(status)) return null;
    result[questionId] = status as QuizReviewStatus;
  }
  return result;
}
