import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AssignmentDraft } from "./notebook";

// 주차별 과제 제출물과 운영자 채점 결과를 data/submissions.json에, 첨부 파일과 제출 시점의
// 작업 공간 스냅숏(notebook-v<N>.json)은 data/uploads/<제출 id>/ 아래에 저장한다.
// (사용자, 주차)마다 제출 기록은 하나이고, 다시 제출하면 버전이 쌓인다. 운영자는 이전
// 버전과 이전 채점까지 모두 볼 수 있다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const SUBMISSION_LIMITS = {
  textMax: 20_000,
  linksMax: 5,
  filesMax: 3,
  fileBytesMax: 5 * 1024 * 1024,
  totalBytesMax: 9 * 1024 * 1024,
  extensions: [".pdf", ".ipynb", ".py", ".md", ".txt", ".zip", ".png", ".jpg", ".jpeg", ".csv", ".json"],
} as const;

export type SubmissionStatus = "submitted" | "graded" | "revision";

export interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface SubmissionVersion {
  version: number;
  submittedAt: string;
  /** 제출 메모(선택) */
  text: string;
  links: string[];
  files: SubmissionFile[];
  /** 작업 공간 스냅숏 파일 이름 (uploads/<제출 id>/ 아래) */
  notebookFile?: string;
}

export interface SubmissionGrade {
  /** 채점한 제출 버전 */
  version: number;
  decision: "graded" | "revision";
  score: number | null;
  maxScore: number;
  /** 채점 기준 id → 점수 */
  criteria?: Record<string, number>;
  /** 과제(task) id → 운영자 코멘트 */
  taskComments?: Record<string, string>;
  feedback: string;
  gradedAt: string;
  gradedBy: string;
}

export interface Submission {
  id: string;
  userId: string;
  weekSlug: string;
  status: SubmissionStatus;
  versions: SubmissionVersion[];
  grades: SubmissionGrade[];
  createdAt: string;
  updatedAt: string;
}

function readAll(): Submission[] {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(next: Submission[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SUBMISSIONS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmp, SUBMISSIONS_FILE);
}

let writeChain: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => T): Promise<T> {
  const run = writeChain.then(task);
  writeChain = run.catch(() => undefined);
  return run;
}

export function listSubmissions(): Submission[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findSubmission(id: string): Submission | undefined {
  return readAll().find((s) => s.id === id);
}

export function findUserSubmission(userId: string, weekSlug: string): Submission | undefined {
  return readAll().find((s) => s.userId === userId && s.weekSlug === weekSlug);
}

export function listUserSubmissions(userId: string): Submission[] {
  return readAll().filter((s) => s.userId === userId);
}

export function latestVersion(submission: Submission): SubmissionVersion {
  return submission.versions[submission.versions.length - 1];
}

export function latestGrade(submission: Submission): SubmissionGrade | undefined {
  return submission.grades[submission.grades.length - 1];
}

/** 파일 이름에서 경로 구분자·제어문자를 없애 저장·다운로드 헤더에 안전한 이름을 만든다. */
function safeFileName(name: string): string {
  const base = path.basename(name).replace(/[\u0000-\u001f\\/:*?"<>|]+/g, "_").trim();
  return (base || "file").slice(0, 120);
}

export function fileExtension(name: string): string {
  return path.extname(name).toLowerCase();
}

export interface IncomingFile {
  name: string;
  type: string;
  bytes: Buffer;
}

export async function saveSubmission(input: {
  userId: string;
  weekSlug: string;
  text: string;
  links: string[];
  files: IncomingFile[];
  notebook?: AssignmentDraft;
}): Promise<Submission> {
  return enqueue(() => {
    const all = readAll();
    const now = new Date().toISOString();
    let submission = all.find((s) => s.userId === input.userId && s.weekSlug === input.weekSlug);
    if (!submission) {
      submission = {
        id: crypto.randomUUID(),
        userId: input.userId,
        weekSlug: input.weekSlug,
        status: "submitted",
        versions: [],
        grades: [],
        createdAt: now,
        updatedAt: now,
      };
      all.push(submission);
    }

    const dir = path.join(UPLOAD_DIR, submission.id);
    const files: SubmissionFile[] = input.files.map((file) => {
      const id = crypto.randomUUID();
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, id), file.bytes);
      return { id, name: safeFileName(file.name), size: file.bytes.length, type: file.type || "application/octet-stream" };
    });

    const version = submission.versions.length + 1;
    let notebookFile: string | undefined;
    if (input.notebook) {
      notebookFile = `notebook-v${version}.json`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, notebookFile), JSON.stringify(input.notebook), "utf8");
    }
    submission.versions.push({
      version,
      submittedAt: now,
      text: input.text,
      links: input.links,
      files,
      notebookFile,
    });
    submission.status = "submitted";
    submission.updatedAt = now;
    writeAll(all);
    return submission;
  });
}

export async function gradeSubmission(
  id: string,
  grade: Omit<SubmissionGrade, "version" | "gradedAt">
): Promise<Submission | undefined> {
  return enqueue(() => {
    const all = readAll();
    const submission = all.find((s) => s.id === id);
    if (!submission) return undefined;
    const now = new Date().toISOString();
    submission.grades.push({ ...grade, version: latestVersion(submission).version, gradedAt: now });
    submission.status = grade.decision === "graded" ? "graded" : "revision";
    submission.updatedAt = now;
    writeAll(all);
    return submission;
  });
}

/** 제출 버전에 저장된 작업 공간 스냅숏을 읽는다. */
export function readNotebook(submission: Submission, version: SubmissionVersion): AssignmentDraft | undefined {
  if (!version.notebookFile || !/^notebook-v\d+\.json$/.test(version.notebookFile)) return undefined;
  const file = path.join(UPLOAD_DIR, submission.id, version.notebookFile);
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as AssignmentDraft;
  } catch {
    return undefined;
  }
}

export function readSubmissionFile(submission: Submission, fileId: string): { file: SubmissionFile; bytes: Buffer } | null {
  const file = submission.versions.flatMap((v) => v.files).find((f) => f.id === fileId);
  if (!file || !/^[0-9a-f-]{36}$/.test(file.id)) return null;
  const filePath = path.join(UPLOAD_DIR, submission.id, file.id);
  if (!fs.existsSync(filePath)) return null;
  return { file, bytes: fs.readFileSync(filePath) };
}

export async function deleteUserSubmissions(userId: string): Promise<void> {
  await enqueue(() => {
    const all = readAll();
    const mine = all.filter((s) => s.userId === userId);
    if (mine.length === 0) return;
    for (const s of mine) fs.rmSync(path.join(UPLOAD_DIR, s.id), { recursive: true, force: true });
    writeAll(all.filter((s) => s.userId !== userId));
  });
}
