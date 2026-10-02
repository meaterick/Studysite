import "server-only";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "./dataDir";
import { fileStamp, get, getMeta, run, setMeta, tx } from "./db";
import { learningUpdatedAt, replaceLearningRecord, type LearningRecord } from "./learningStore";
import { replaceSubmission, type Submission, type SubmissionGrade, type SubmissionVersion } from "./submissionStore";
import { replaceConversation, type ChatMessage, type Conversation } from "./chatStore";
import { writeSettingsRow, type SiteSettings } from "./settingsStore";
import type { UserRecord } from "./userStore";

// 예전 JSON 파일 저장소(users·learning·submissions·chats·threads·settings.json)를 DB로 옮긴다.
//
// 무중단 배포에서는 새 버전(DB)이 뜬 뒤에도 잠깐 이전 버전(JSON)이 요청을 받는다. 그래서
// 1. 서버 시작 시 JSON을 DB로 가져오고,
// 2. 몇 분 동안 JSON 파일이 바뀌는지 지켜보다 바뀌면 그 사이의 쓰기를 다시 가져온 뒤(더 새로운 쪽이 이긴다),
// 3. 이전 버전이 꺼졌을 시간이 지나면 JSON 파일을 legacy-json/ 폴더로 옮겨 둔다(지우지 않는다).
// 가져오기는 여러 번 해도 결과가 같다. 중간에 서버가 꺼져도 JSON 파일이 남아 있으면 다음 시작 때 다시 맞춘다.

const LEGACY_FILES = ["users.json", "learning.json", "submissions.json", "chats.json", "threads.json", "settings.json"] as const;
// 파일 이름이 변수라 Turbopack이 프로젝트 전체를 서버 번들에 넣으려 한다. 이 경로들은 실행 중의 데이터 파일이므로
// 아래 fs 호출에는 turbopackIgnore를 붙여 추적에서 뺀다.
const legacyPath = (name: string) => path.join(DATA_DIR, name);

export interface LegacyImportReport {
  at: string;
  users: number;
  learning: number;
  submissions: number;
  conversations: number;
  settings: boolean;
  /** 옮기지 않은 기록: 계정이 없거나(이미 탈퇴한 사용자의 남은 데이터) 내용이 빈 제출 */
  skipped: number;
  /** 이메일·Google 계정이 다른 계정과 겹쳐 옮기지 않은 계정 */
  conflicts: number;
}

export function hasLegacyFiles(): boolean {
  return LEGACY_FILES.some((name) => fs.existsSync(/*turbopackIgnore: true*/ legacyPath(name)));
}

function readJson<T>(name: string, fallback: T): T {
  const file = legacyPath(name);
  if (!fs.existsSync(/*turbopackIgnore: true*/ file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as T;
  } catch (err) {
    // 깨진 파일을 빈 것으로 여기면 데이터를 잃은 채 넘어가게 된다. 시작을 멈추고 운영자가 보게 한다.
    throw new Error(`legacy import: cannot parse ${name}: ${(err as Error).message}`);
  }
}

interface LegacyThread {
  userId: string;
  weekSlug: string;
  messages: Omit<ChatMessage, "topic">[];
  memberReadAt?: string;
  adminReadAt?: string;
  updatedAt: string;
}

/** 더 예전의 과제별 대화(threads.json)를 스터디원별 대화로 합친다. */
function conversationsFromThreads(threads: LegacyThread[]): Conversation[] {
  const byUser = new Map<string, Conversation>();
  const maxIso = (a?: string, b?: string) => (!a ? b : !b ? a : a > b ? a : b);
  for (const t of threads) {
    const conv = byUser.get(t.userId) ?? { userId: t.userId, messages: [], updatedAt: t.updatedAt };
    const week = /^week-?(\d+)$/.exec(t.weekSlug)?.[1];
    const topic = week ? `${week}주차 과제` : "과제";
    conv.messages.push(...t.messages.map((m) => ({ ...m, topic })));
    conv.memberReadAt = maxIso(conv.memberReadAt, t.memberReadAt);
    conv.adminReadAt = maxIso(conv.adminReadAt, t.adminReadAt);
    conv.updatedAt = maxIso(conv.updatedAt, t.updatedAt) ?? t.updatedAt;
    byUser.set(t.userId, conv);
  }
  for (const conv of byUser.values()) conv.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return [...byUser.values()];
}

// 오래된 기록에 빠져 있을 수 있는 필드를 채워, 한 건 때문에 전체 가져오기가 막히지 않게 한다.
const STATUSES = new Set(["submitted", "graded", "revision"]);

function normalizeSubmission(s: Submission): Submission {
  const versions: SubmissionVersion[] = (s.versions ?? []).map((v, i) => ({
    version: v.version ?? i + 1,
    submittedAt: v.submittedAt ?? s.updatedAt,
    text: v.text ?? "",
    links: Array.isArray(v.links) ? v.links : [],
    files: (v.files ?? []).map((f) => ({ id: f.id, name: f.name ?? "file", size: f.size ?? 0, type: f.type || "application/octet-stream" })),
    notebookFile: v.notebookFile,
  }));
  const grades: SubmissionGrade[] = (s.grades ?? []).map((g) => ({
    ...g,
    version: g.version ?? versions[versions.length - 1]?.version ?? 1,
    decision: g.decision === "revision" ? "revision" : "graded",
    score: typeof g.score === "number" ? g.score : null,
    maxScore: typeof g.maxScore === "number" ? g.maxScore : 0,
    feedback: g.feedback ?? "",
    gradedAt: g.gradedAt ?? s.updatedAt,
    gradedBy: g.gradedBy ?? "",
  }));
  return {
    ...s,
    status: STATUSES.has(s.status) ? s.status : "submitted",
    versions,
    grades,
    createdAt: s.createdAt ?? s.updatedAt,
  };
}

function normalizeConversation(c: Conversation): Conversation {
  return {
    ...c,
    messages: (c.messages ?? []).map((m) => ({
      ...m,
      authorId: m.authorId ?? "",
      authorName: m.authorName ?? "",
      role: m.role === "admin" ? "admin" : "member",
      text: m.text ?? "",
    })),
  };
}

function parseReport(raw: string | undefined): LegacyImportReport | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LegacyImportReport;
  } catch {
    return undefined;
  }
}

const userExists = (id: string) => !!get("SELECT 1 FROM users WHERE id = ?", id);

/** JSON 파일의 내용 중 DB에 없거나 DB보다 새로운 것을 옮긴다. 옮길 파일이 없으면 null. */
export function importLegacyJson(): LegacyImportReport | null {
  if (!hasLegacyFiles()) return null;
  const users = readJson<UserRecord[]>("users.json", []);
  const learning = readJson<Record<string, Partial<LearningRecord>>>("learning.json", {});
  const submissions = readJson<Submission[]>("submissions.json", []);
  const conversations = fs.existsSync(legacyPath("chats.json"))
    ? readJson<Conversation[]>("chats.json", [])
    : conversationsFromThreads(readJson<LegacyThread[]>("threads.json", []));
  const settings = readJson<Partial<SiteSettings> | null>("settings.json", null);

  const report: LegacyImportReport = { at: new Date().toISOString(), users: 0, learning: 0, submissions: 0, conversations: 0, settings: false, skipped: 0, conflicts: 0 };

  tx(() => {
    for (const u of Array.isArray(users) ? users : []) {
      const existing = get<{ google_subject: string | null }>("SELECT google_subject FROM users WHERE id = ?", u.id);
      try {
        if (!existing) {
          run(
            "INSERT INTO users (id, email, name, google_subject, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            u.id,
            String(u.email ?? "").trim().toLowerCase(),
            u.name || "사용자",
            u.googleSubject,
            u.role === "admin" ? "admin" : "member",
            u.createdAt || report.at
          );
          report.users++;
        } else if (!existing.google_subject && u.googleSubject) {
          run("UPDATE users SET google_subject = ? WHERE id = ?", u.googleSubject, u.id);
        }
      } catch {
        report.conflicts++;
      }
    }

    for (const [userId, record] of Object.entries(learning ?? {})) {
      if (!userExists(userId)) {
        report.skipped++;
        continue;
      }
      const dbAt = learningUpdatedAt(userId);
      const jsonAt = record?.updatedAt ?? "";
      if (dbAt && jsonAt <= dbAt) continue;
      replaceLearningRecord(userId, record ?? {}, jsonAt || report.at);
      report.learning++;
    }

    for (const raw of Array.isArray(submissions) ? submissions : []) {
      const s = normalizeSubmission(raw);
      if (!userExists(s.userId) || s.versions.length === 0) {
        report.skipped++;
        continue;
      }
      const db = get<{ updated_at: string }>("SELECT updated_at FROM submissions WHERE id = ?", s.id);
      if (db && s.updatedAt <= db.updated_at) continue;
      // 같은 (사용자, 주차)에 다른 id의 제출이 이미 있으면 더 새로운 쪽만 남긴다.
      const clash = get<{ id: string; updated_at: string }>(
        "SELECT id, updated_at FROM submissions WHERE user_id = ? AND week_slug = ? AND id != ?",
        s.userId,
        s.weekSlug,
        s.id
      );
      if (clash && clash.updated_at >= s.updatedAt) continue;
      if (clash) run("DELETE FROM submissions WHERE id = ?", clash.id);
      replaceSubmission(s);
      report.submissions++;
    }

    for (const raw of Array.isArray(conversations) ? conversations : []) {
      const conv = normalizeConversation(raw);
      if (!userExists(conv.userId)) {
        report.skipped++;
        continue;
      }
      const db = get<{ updated_at: string }>("SELECT updated_at FROM conversations WHERE user_id = ?", conv.userId);
      if (db && conv.updatedAt <= db.updated_at) continue;
      replaceConversation(conv);
      report.conversations++;
    }

    if (settings && typeof settings === "object") {
      const db = get<{ updated_at: string }>("SELECT updated_at FROM settings WHERE key = 'site'");
      const jsonAt = settings.updatedAt ?? "";
      if (!db || jsonAt > db.updated_at) {
        writeSettingsRow({
          progressionMode: settings.progressionMode === "lock" ? "lock" : "warn",
          dueDates: settings.dueDates ?? {},
          updatedAt: settings.updatedAt,
        });
        report.settings = true;
      }
    }

    // 따라잡기로 여러 번 옮기면 옮긴 수는 더해 두고(처음 옮긴 시각 유지), 건너뛴·충돌 수는 마지막 확인 결과로 둔다.
    const prev = parseReport(getMeta("legacy_import"));
    const total: LegacyImportReport = prev
      ? {
          ...report,
          at: prev.at,
          users: prev.users + report.users,
          learning: prev.learning + report.learning,
          submissions: prev.submissions + report.submissions,
          conversations: prev.conversations + report.conversations,
          settings: prev.settings || report.settings,
        }
      : report;
    setMeta("legacy_import", JSON.stringify(total));
  });
  return report;
}

/** JSON 파일들을 DATA_DIR/legacy-json/<시각>/ 으로 옮긴다(6주 뒤 백업을 정리할 때 함께 지운다, backup.ts). */
export function archiveLegacyJson(): string | null {
  const present = LEGACY_FILES.filter((name) => fs.existsSync(/*turbopackIgnore: true*/ legacyPath(name)));
  if (present.length === 0) return null;
  const dir = path.join(DATA_DIR, "legacy-json", fileStamp());
  fs.mkdirSync(dir, { recursive: true });
  for (const name of present) fs.renameSync(/*turbopackIgnore: true*/ legacyPath(name), path.join(dir, name));
  setMeta("legacy_archive", JSON.stringify({ at: new Date().toISOString(), dir, files: present }));
  return dir;
}

function legacyFingerprint(): string {
  return LEGACY_FILES.map((name) => {
    try {
      const st = fs.statSync(/*turbopackIgnore: true*/ legacyPath(name));
      return `${name}:${st.mtimeMs}:${st.size}`;
    } catch {
      return `${name}:-`;
    }
  }).join("|");
}

/**
 * 배포가 겹치는 동안 이전 버전이 JSON에 쓴 내용을 따라잡고, windowMs가 지나면 JSON 파일을 보관 폴더로 옮긴다.
 * (배포 스크립트는 새 버전이 응답하면 nginx를 넘기고 10초 뒤 이전 버전을 끈다. 응답 대기는 최대 60초.)
 */
export function startLegacyCatchUp(windowMs = 3 * 60_000, intervalMs = 5_000): void {
  const started = Date.now();
  let seen = legacyFingerprint();
  const timer = setInterval(() => {
    try {
      const now = legacyFingerprint();
      if (now !== seen) {
        const report = importLegacyJson();
        console.log("[legacy-import] caught up with JSON writes from the previous version", report);
        seen = now;
      }
      if (Date.now() - started >= windowMs) {
        clearInterval(timer);
        importLegacyJson();
        const dir = archiveLegacyJson();
        if (dir) console.log(`[legacy-import] archived legacy JSON files to ${dir}`);
      }
    } catch (err) {
      console.error("[legacy-import] catch-up failed", err);
    }
  }, intervalMs);
  timer.unref();
}
