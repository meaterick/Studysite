import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AssignmentDraft } from "./notebook";
import { all, get, run, tx, type Param } from "./db";
import { DATA_DIR } from "./dataDir";

// 주차별 과제 제출물과 운영자 채점 결과는 DB(submissions·submission_versions·submission_files·
// submission_grades)에, 첨부 파일과 제출 시점의 작업 공간 스냅숏(notebook-v<N>.json)은
// DATA_DIR/uploads/<제출 id>/ 아래에 저장한다. (사용자, 주차)마다 제출 기록은 하나이고, 다시 제출하면
// 버전이 쌓인다. 운영자는 이전 버전과 이전 채점까지 모두 볼 수 있다.

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const SUBMISSION_LIMITS = {
  textMax: 20_000,
  linksMax: 5,
  filesMax: 3,
  fileBytesMax: 5 * 1024 * 1024,
  totalBytesMax: 9 * 1024 * 1024,
  /** 한 과제(주차)에 쌓을 수 있는 제출 버전 수 */
  versionsMax: 30,
  /** 한 계정이 모든 과제에 첨부할 수 있는 파일 합계 */
  userBytesMax: 100 * 1024 * 1024,
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

// ─── 읽기 ────────────────────────────────────────────────────────────────

interface SubmissionRow {
  id: string;
  user_id: string;
  week_slug: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}
interface VersionRow {
  submission_id: string;
  version: number;
  submitted_at: string;
  text: string;
  links: string;
  notebook_file: string | null;
}
interface FileRow {
  id: string;
  submission_id: string;
  version: number;
  name: string;
  size: number;
  type: string;
}
interface GradeRow {
  submission_id: string;
  version: number;
  decision: "graded" | "revision";
  score: number | null;
  max_score: number;
  criteria: string | null;
  task_comments: string | null;
  feedback: string;
  graded_at: string;
  graded_by: string;
}

/** 조건에 맞는 제출을 버전·첨부·채점까지 붙여 읽는다(제출 수와 상관없이 쿼리 네 번). */
function loadSubmissions(where: string, ...params: Param[]): Submission[] {
  const subs = all<SubmissionRow>(`SELECT * FROM submissions WHERE ${where} ORDER BY updated_at DESC`, ...params);
  if (subs.length === 0) return [];
  const ids = JSON.stringify(subs.map((s) => s.id));
  const inIds = "submission_id IN (SELECT value FROM json_each(?))";
  const versions = all<VersionRow>(`SELECT * FROM submission_versions WHERE ${inIds} ORDER BY submission_id, version`, ids);
  const files = all<FileRow>(`SELECT id, submission_id, version, name, size, type FROM submission_files WHERE ${inIds} ORDER BY submission_id, version, seq`, ids);
  const grades = all<GradeRow>(`SELECT * FROM submission_grades WHERE ${inIds} ORDER BY submission_id, seq`, ids);

  const byId = new Map<string, Submission>(
    subs.map((s) => [
      s.id,
      { id: s.id, userId: s.user_id, weekSlug: s.week_slug, status: s.status, versions: [], grades: [], createdAt: s.created_at, updatedAt: s.updated_at },
    ])
  );
  const versionOf = new Map<string, SubmissionVersion>();
  for (const v of versions) {
    const version: SubmissionVersion = {
      version: v.version,
      submittedAt: v.submitted_at,
      text: v.text,
      links: JSON.parse(v.links),
      files: [],
      notebookFile: v.notebook_file ?? undefined,
    };
    byId.get(v.submission_id)?.versions.push(version);
    versionOf.set(`${v.submission_id}:${v.version}`, version);
  }
  for (const f of files) versionOf.get(`${f.submission_id}:${f.version}`)?.files.push({ id: f.id, name: f.name, size: f.size, type: f.type });
  for (const g of grades) {
    byId.get(g.submission_id)?.grades.push({
      version: g.version,
      decision: g.decision,
      score: g.score,
      maxScore: g.max_score,
      criteria: g.criteria ? JSON.parse(g.criteria) : undefined,
      taskComments: g.task_comments ? JSON.parse(g.task_comments) : undefined,
      feedback: g.feedback,
      gradedAt: g.graded_at,
      gradedBy: g.graded_by,
    });
  }
  return [...byId.values()];
}

export function findSubmission(id: string): Submission | undefined {
  return loadSubmissions("id = ?", id)[0];
}

export function findUserSubmission(userId: string, weekSlug: string): Submission | undefined {
  return loadSubmissions("user_id = ? AND week_slug = ?", userId, weekSlug)[0];
}

export function listUserSubmissions(userId: string): Submission[] {
  return loadSubmissions("user_id = ?", userId);
}

/** 목록 화면용 요약: 최신 버전과 최신 채점만 */
export interface SubmissionSummary {
  id: string;
  userId: string;
  weekSlug: string;
  status: SubmissionStatus;
  updatedAt: string;
  latestVersion: number;
  latestSubmittedAt: string;
  latestGrade?: { decision: "graded" | "revision"; score: number | null; maxScore: number };
}

export function listSubmissionSummaries(): SubmissionSummary[] {
  const rows = all<{
    id: string;
    user_id: string;
    week_slug: string;
    status: SubmissionStatus;
    updated_at: string;
    version: number;
    submitted_at: string;
    decision: "graded" | "revision" | null;
    score: number | null;
    max_score: number | null;
  }>(
    `SELECT s.id, s.user_id, s.week_slug, s.status, s.updated_at, v.version, v.submitted_at, g.decision, g.score, g.max_score
       FROM submissions s
       JOIN submission_versions v
         ON v.submission_id = s.id AND v.version = (SELECT MAX(version) FROM submission_versions WHERE submission_id = s.id)
       LEFT JOIN submission_grades g
         ON g.submission_id = s.id AND g.seq = (SELECT MAX(seq) FROM submission_grades WHERE submission_id = s.id)
      ORDER BY s.updated_at DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    weekSlug: r.week_slug,
    status: r.status,
    updatedAt: r.updated_at,
    latestVersion: r.version,
    latestSubmittedAt: r.submitted_at,
    latestGrade: r.decision ? { decision: r.decision, score: r.score, maxScore: r.max_score ?? 0 } : undefined,
  }));
}

/** 상태별 제출 수 */
export function countSubmissionsByStatus(): Record<SubmissionStatus, number> {
  const counts: Record<SubmissionStatus, number> = { submitted: 0, graded: 0, revision: 0 };
  for (const r of all<{ status: SubmissionStatus; n: number }>("SELECT status, COUNT(*) AS n FROM submissions GROUP BY status")) counts[r.status] = r.n;
  return counts;
}

/** 사용자별 상태별 제출 수 */
export function submissionCountsByUser(): Map<string, Record<SubmissionStatus, number>> {
  const map = new Map<string, Record<SubmissionStatus, number>>();
  for (const r of all<{ user_id: string; status: SubmissionStatus; n: number }>(
    "SELECT user_id, status, COUNT(*) AS n FROM submissions GROUP BY user_id, status"
  )) {
    const c = map.get(r.user_id) ?? { submitted: 0, graded: 0, revision: 0 };
    c[r.status] = r.n;
    map.set(r.user_id, c);
  }
  return map;
}

/** 저장된 첨부 파일 전체 크기(바이트) */
export function totalUploadBytes(): number {
  return get<{ n: number }>("SELECT COALESCE(SUM(size), 0) AS n FROM submission_files")?.n ?? 0;
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

// ─── 쓰기 ────────────────────────────────────────────────────────────────

function insertVersion(submissionId: string, v: SubmissionVersion): void {
  run(
    "INSERT INTO submission_versions (submission_id, version, submitted_at, text, links, notebook_file) VALUES (?, ?, ?, ?, ?, ?)",
    submissionId,
    v.version,
    v.submittedAt,
    v.text,
    JSON.stringify(v.links),
    v.notebookFile
  );
  v.files.forEach((f, i) =>
    run(
      "INSERT INTO submission_files (id, submission_id, version, seq, name, size, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      f.id,
      submissionId,
      v.version,
      i,
      f.name,
      f.size,
      f.type
    )
  );
}

function insertGrade(submissionId: string, seq: number, g: SubmissionGrade): void {
  run(
    `INSERT INTO submission_grades (submission_id, seq, version, decision, score, max_score, criteria, task_comments, feedback, graded_at, graded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    submissionId,
    seq,
    g.version,
    g.decision,
    g.score,
    g.maxScore,
    g.criteria ? JSON.stringify(g.criteria) : null,
    g.taskComments ? JSON.stringify(g.taskComments) : null,
    g.feedback,
    g.gradedAt,
    g.gradedBy
  );
}

/** 제출 하나를 버전·첨부·채점까지 통째로 써 넣는다(같은 id가 있으면 바꾼다). 옛 JSON 가져오기에 쓴다. */
export function replaceSubmission(s: Submission): void {
  tx(() => {
    run("DELETE FROM submissions WHERE id = ?", s.id);
    run(
      "INSERT INTO submissions (id, user_id, week_slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      s.id,
      s.userId,
      s.weekSlug,
      s.status,
      s.createdAt,
      s.updatedAt
    );
    for (const v of s.versions) insertVersion(s.id, v);
    s.grades.forEach((g, i) => insertGrade(s.id, i + 1, g));
  });
}

export async function saveSubmission(input: {
  userId: string;
  weekSlug: string;
  text: string;
  links: string[];
  files: IncomingFile[];
  notebook?: AssignmentDraft;
}): Promise<Submission> {
  // 파일 쓰기와 DB 기록을 한 트랜잭션 안에서 해, DB에 남지 못한 제출의 파일은 지운다.
  const written: string[] = [];
  try {
    const id = tx(() => {
      const now = new Date().toISOString();
      const existing = get<{ id: string }>("SELECT id FROM submissions WHERE user_id = ? AND week_slug = ?", input.userId, input.weekSlug);
      const id = existing?.id ?? crypto.randomUUID();
      if (!existing) {
        run(
          "INSERT INTO submissions (id, user_id, week_slug, status, created_at, updated_at) VALUES (?, ?, ?, 'submitted', ?, ?)",
          id,
          input.userId,
          input.weekSlug,
          now,
          now
        );
      }
      const version = (get<{ v: number }>("SELECT COALESCE(MAX(version), 0) AS v FROM submission_versions WHERE submission_id = ?", id)?.v ?? 0) + 1;

      const dir = path.join(UPLOAD_DIR, id);
      fs.mkdirSync(dir, { recursive: true });
      const files: SubmissionFile[] = input.files.map((file) => {
        const fileId = crypto.randomUUID();
        const target = path.join(dir, fileId);
        fs.writeFileSync(target, file.bytes);
        written.push(target);
        return { id: fileId, name: safeFileName(file.name), size: file.bytes.length, type: file.type || "application/octet-stream" };
      });
      let notebookFile: string | undefined;
      if (input.notebook) {
        notebookFile = `notebook-v${version}.json`;
        const target = path.join(dir, notebookFile);
        fs.writeFileSync(target, JSON.stringify(input.notebook), "utf8");
        written.push(target);
      }
      insertVersion(id, { version, submittedAt: now, text: input.text, links: input.links, files, notebookFile });
      run("UPDATE submissions SET status = 'submitted', updated_at = ? WHERE id = ?", now, id);
      return id;
    });
    return findSubmission(id)!;
  } catch (err) {
    for (const file of written) fs.rmSync(file, { force: true });
    throw err;
  }
}

export async function gradeSubmission(
  id: string,
  grade: Omit<SubmissionGrade, "version" | "gradedAt">
): Promise<Submission | undefined> {
  const found = tx(() => {
    if (!get("SELECT 1 FROM submissions WHERE id = ?", id)) return false;
    const now = new Date().toISOString();
    const version = get<{ v: number }>("SELECT MAX(version) AS v FROM submission_versions WHERE submission_id = ?", id)?.v ?? 1;
    const seq = (get<{ s: number }>("SELECT COALESCE(MAX(seq), 0) AS s FROM submission_grades WHERE submission_id = ?", id)?.s ?? 0) + 1;
    insertGrade(id, seq, { ...grade, version, gradedAt: now });
    run("UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?", grade.decision === "graded" ? "graded" : "revision", now, id);
    return true;
  });
  return found ? findSubmission(id) : undefined;
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

/** 제출들의 첨부 파일 폴더를 지운다(DB 행은 계정 삭제 때 함께 지워진다). */
export function removeSubmissionUploads(submissionIds: string[]): void {
  for (const id of submissionIds) fs.rmSync(path.join(UPLOAD_DIR, id), { recursive: true, force: true });
}
