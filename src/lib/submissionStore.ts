import "server-only";
import fs from "fs";
import path from "path";
import type { AssignmentDraft } from "./notebook";
import { get } from "./db";
import { DATA_DIR } from "./dataDir";

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/** 개인 초안이 없을 때 이전 제출 방식의 최신 작업을 이어서 열 수 있게 한다. */
export function readLegacyAssignmentDraft(userId: string, assignmentKey: string): AssignmentDraft | undefined {
  const latest = get<{ id: string; notebook_file: string | null }>(
    `SELECT s.id, v.notebook_file
       FROM submissions s
       JOIN submission_versions v ON v.submission_id = s.id
      WHERE s.user_id = ? AND s.week_slug = ?
      ORDER BY v.version DESC LIMIT 1`,
    userId,
    assignmentKey,
  );
  if (!latest?.notebook_file || !/^notebook-v\d+\.json$/.test(latest.notebook_file)) return undefined;

  try {
    return JSON.parse(fs.readFileSync(path.join(UPLOAD_DIR, latest.id, latest.notebook_file), "utf8")) as AssignmentDraft;
  } catch {
    return undefined;
  }
}

/** 시스템 화면에 보관 중인 첨부 파일의 크기를 표시한다. */
export function totalUploadBytes(): number {
  return get<{ n: number }>("SELECT COALESCE(SUM(size), 0) AS n FROM submission_files")?.n ?? 0;
}

/** 계정 삭제 시 남아 있는 이전 제출 파일도 함께 삭제한다. */
export function removeSubmissionUploads(submissionIds: string[]): void {
  for (const id of submissionIds) fs.rmSync(path.join(UPLOAD_DIR, id), { recursive: true, force: true });
}
