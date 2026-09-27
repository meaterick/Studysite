import "server-only";
import fs from "fs";
import path from "path";
import type { AssignmentDraft } from "./notebook";

// 과제 작업 공간의 자동 저장 초안. 코드 실행 결과(그림 포함)가 들어 있어 크기가 커질 수 있으므로
// 하나의 JSON에 모으지 않고 DATA_DIR/drafts/<사용자 id>/<주차 slug>.json 파일로 나눠 저장한다.

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const DRAFT_DIR = path.join(DATA_DIR, "drafts");
const SAFE = /^[A-Za-z0-9_-]{1,80}$/;

function draftPath(userId: string, slug: string): string {
  if (!SAFE.test(userId) || !SAFE.test(slug)) throw new Error("INVALID_DRAFT_KEY");
  return path.join(DRAFT_DIR, userId, `${slug}.json`);
}

export function readDraft(userId: string, slug: string): AssignmentDraft | undefined {
  const file = draftPath(userId, slug);
  if (!fs.existsSync(file)) return undefined;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && parsed.tasks ? (parsed as AssignmentDraft) : undefined;
  } catch {
    return undefined;
  }
}

// 같은 파일에 대한 동시 저장(자동 저장이 겹치는 경우)이 서로 덮어쓰며 깨지지 않도록 직렬화한다.
let writeChain: Promise<unknown> = Promise.resolve();

export function writeDraft(userId: string, slug: string, draft: AssignmentDraft): Promise<void> {
  const run = writeChain.then(() => {
    const file = draftPath(userId, slug);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(draft), "utf8");
    fs.renameSync(tmp, file);
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export function deleteUserDrafts(userId: string): void {
  if (!SAFE.test(userId)) return;
  fs.rmSync(path.join(DRAFT_DIR, userId), { recursive: true, force: true });
}
