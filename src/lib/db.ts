import "server-only";
import fs from "fs";
import path from "path";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { DATA_DIR } from "./dataDir";

// 서버 데이터 저장소(SQLite, DATA_DIR/aegis.db).
//
// - 앱 프로세스 안에서 동작해 별도 DB 서버가 필요 없다(서버 RAM 1GB). Node 내장 모듈(node:sqlite)이라
//   빌드 러너와 서버의 Node 버전·CPU가 달라도 네이티브 모듈처럼 깨지지 않는다.
// - WAL 모드: 읽기는 쓰기를 기다리지 않는다. 무중단 배포 중 잠깐 두 프로세스가 같은 파일을 써도
//   쓰기는 파일 잠금으로 한 번에 하나씩 처리된다(busy_timeout 동안 기다린다).
// - 마이그레이션은 버전 순서대로 한 번씩 적용한다. 배포 직후 몇 초는 이전 버전 앱도 같은 DB를 쓰므로
//   마이그레이션은 "더하기"(테이블·열·인덱스 추가)만 한다. 열 삭제·이름 변경은 두 번의 배포로 나눈다.

export const DB_FILE = path.join(DATA_DIR, "aegis.db");

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial",
    sql: `
      CREATE TABLE meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) WITHOUT ROWID;

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        google_subject TEXT UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
        created_at TEXT NOT NULL
      );

      -- 학습 기록: 단계·백지공부·코딩 실습·퀴즈 항목 하나가 한 행이다. 항목 안의 세부 필드는 JSON(data)이라
      -- 필드가 늘어도 스키마를 바꿀 필요가 없고, 저장할 때는 바뀐 항목의 행만 고쳐 쓴다.
      -- kind: section | worksheet | lab_exercise | lab_quiz | meta(그 밖의 기록 전체 필드)
      CREATE TABLE learning_items (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        week_slug TEXT NOT NULL DEFAULT '',
        item_id TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL,
        -- 단계(section)의 완료 시각. 운영자 화면이 모든 기록을 읽지 않고 완료 수를 셀 수 있게 따로 둔다.
        completed_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, kind, week_slug, item_id)
      ) WITHOUT ROWID;
      CREATE INDEX learning_items_completed ON learning_items (kind, completed_at) WHERE completed_at IS NOT NULL;

      CREATE TABLE submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_slug TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('submitted', 'graded', 'revision')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (user_id, week_slug)
      );
      CREATE INDEX submissions_updated ON submissions (updated_at);

      CREATE TABLE submission_versions (
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        submitted_at TEXT NOT NULL,
        text TEXT NOT NULL,
        links TEXT NOT NULL,
        notebook_file TEXT,
        PRIMARY KEY (submission_id, version)
      ) WITHOUT ROWID;

      CREATE TABLE submission_files (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        seq INTEGER NOT NULL,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (submission_id, version) REFERENCES submission_versions (submission_id, version) ON DELETE CASCADE
      );
      CREATE INDEX submission_files_version ON submission_files (submission_id, version);

      CREATE TABLE submission_grades (
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        version INTEGER NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('graded', 'revision')),
        score REAL,
        max_score REAL NOT NULL,
        criteria TEXT,
        task_comments TEXT,
        feedback TEXT NOT NULL,
        graded_at TEXT NOT NULL,
        graded_by TEXT NOT NULL,
        PRIMARY KEY (submission_id, seq)
      ) WITHOUT ROWID;

      CREATE TABLE conversations (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        member_read_at TEXT,
        admin_read_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES conversations(user_id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        topic TEXT
      );
      CREATE INDEX chat_messages_conversation ON chat_messages (user_id, created_at);

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) WITHOUT ROWID;

      -- 운영자 시스템 화면에 보여 줄 최근 서버 오류(오래된 것은 지운다)
      CREATE TABLE server_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        method TEXT,
        path TEXT,
        route TEXT,
        kind TEXT,
        message TEXT NOT NULL,
        digest TEXT
      );
    `,
  },
  {
    version: 2,
    name: "security-events",
    sql: `
      CREATE TABLE security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bucket TEXT NOT NULL,
        first_at TEXT NOT NULL,
        last_at TEXT NOT NULL,
        kind TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'high')),
        ip TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        method TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 0,
        count INTEGER NOT NULL DEFAULT 1,
        UNIQUE (bucket, kind, ip, user_id, method, path, status)
      );
      CREATE INDEX security_events_time ON security_events (last_at DESC, id DESC);
      CREATE TRIGGER security_events_cap AFTER INSERT ON security_events BEGIN
        DELETE FROM security_events WHERE id IN (
          SELECT id FROM security_events ORDER BY id DESC LIMIT -1 OFFSET 10000
        );
      END;
    `,
  },
  {
    version: 3,
    name: "ip-rules-and-intrusion-detection",
    sql: `
      ALTER TABLE security_events ADD COLUMN detail TEXT NOT NULL DEFAULT '';
      CREATE TABLE security_ip_rules (
        ip TEXT PRIMARY KEY,
        mode TEXT NOT NULL CHECK (mode IN ('allow', 'deny')),
        source TEXT NOT NULL CHECK (source IN ('manual', 'auto')),
        reason TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT
      ) WITHOUT ROWID;
      CREATE TABLE security_detection_windows (
        ip TEXT NOT NULL,
        family TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        last_at INTEGER NOT NULL,
        count INTEGER NOT NULL,
        paths TEXT NOT NULL,
        alerted INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, family)
      ) WITHOUT ROWID;
      CREATE INDEX security_detection_time ON security_detection_windows (last_at);
      CREATE TRIGGER security_detection_cap AFTER INSERT ON security_detection_windows BEGIN
        DELETE FROM security_detection_windows WHERE (ip, family) IN (
          SELECT ip, family FROM security_detection_windows ORDER BY last_at DESC, ip, family LIMIT -1 OFFSET 5000
        );
      END;
    `,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

interface DbState {
  conn: DatabaseSync;
  statements: Map<string, StatementSync>;
  txDepth: number;
}

// 개발 서버의 모듈 다시 불러오기에도 연결이 하나만 유지되도록 globalThis에 둔다.
const holder = globalThis as unknown as { __aegisDb?: DbState };

function open(): DbState {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const existed = fs.existsSync(DB_FILE);
  // 잠금 대기 시간은 가장 먼저 정한다. 두 프로세스(무중단 배포 중 겹친 이전 버전)가 동시에 열 때 WAL 전환 등이
  // 곧바로 "database is locked"로 실패하지 않고 기다리게 한다.
  const conn = new DatabaseSync(DB_FILE, { timeout: 5000 });
  conn.exec("PRAGMA busy_timeout = 5000");
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA synchronous = NORMAL");
  conn.exec("PRAGMA foreign_keys = ON");
  migrate(conn, existed);
  // 프로세스가 끝날 때 WAL을 본 파일에 합쳐 둔다(다음 시작과 백업이 가벼워진다).
  process.once("exit", () => {
    try {
      conn.close();
    } catch {
      // 이미 닫혔으면 무시
    }
  });
  return { conn, statements: new Map(), txDepth: 0 };
}

function migrate(conn: DatabaseSync, existed: boolean) {
  conn.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)");
  const applied = new Set(
    (conn.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map((r) => r.version)
  );
  const pending = MIGRATIONS.filter((m) => !applied.has(m.version));
  if (pending.length === 0) return;
  // 이미 쓰던 DB의 구조를 바꾸기 전에는 그대로 되돌릴 수 있도록 스냅숏을 남긴다.
  if (existed && applied.size > 0) {
    const dir = path.join(DATA_DIR, "backups");
    fs.mkdirSync(dir, { recursive: true });
    snapshotTo(conn, path.join(dir, `aegis-${fileStamp()}-pre-migration-v${pending[0].version}.db`));
  }
  for (const m of pending) {
    conn.exec("BEGIN IMMEDIATE");
    try {
      // 다른 프로세스가 먼저 적용했을 수 있다(무중단 배포 중 겹치는 경우).
      const done = conn.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(m.version);
      if (!done) {
        conn.exec(m.sql);
        conn.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(m.version, m.name, new Date().toISOString());
      }
      conn.exec("COMMIT");
    } catch (err) {
      try {
        conn.exec("ROLLBACK");
      } catch {}
      throw err;
    }
  }
}

function state(): DbState {
  return (holder.__aegisDb ??= open());
}

/** 연결을 연다(이미 열려 있으면 그대로). 서버 시작 시 마이그레이션을 미리 끝내 두려고 부른다. */
export function ensureDb(): void {
  state();
}

function statement(sql: string): StatementSync {
  const s = state();
  let st = s.statements.get(sql);
  if (!st) {
    st = s.conn.prepare(sql);
    s.statements.set(sql, st);
  }
  return st;
}

export type Param = SQLInputValue | boolean | undefined;

function bind(params: Param[]): SQLInputValue[] {
  return params.map((p) => (p === undefined ? null : typeof p === "boolean" ? (p ? 1 : 0) : p));
}

export function all<T>(sql: string, ...params: Param[]): T[] {
  return statement(sql).all(...bind(params)) as T[];
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  return statement(sql).get(...bind(params)) as T | undefined;
}

export function run(sql: string, ...params: Param[]): { changes: number } {
  const r = statement(sql).run(...bind(params));
  return { changes: Number(r.changes) };
}

export function exec(sql: string): void {
  state().conn.exec(sql);
}

/**
 * fn 전체를 하나의 트랜잭션으로 실행한다(쓰기 잠금을 먼저 잡는 BEGIN IMMEDIATE).
 * 함수 안의 DB 호출은 모두 동기라 같은 프로세스의 다른 요청이 끼어들 수 없고,
 * 다른 프로세스와는 파일 잠금으로 순서가 정해진다. 안에서 다시 부르면 바깥 트랜잭션에 합쳐진다.
 */
export function tx<T>(fn: () => T): T {
  const s = state();
  if (s.txDepth > 0) return fn();
  s.conn.exec("BEGIN IMMEDIATE");
  s.txDepth++;
  try {
    const result = fn();
    if (result && typeof (result as { then?: unknown }).then === "function") {
      throw new Error("tx() callback must be synchronous");
    }
    s.conn.exec("COMMIT");
    return result;
  } catch (err) {
    // 디스크 가득 참 같은 오류에서는 SQLite가 이미 되돌렸을 수 있다. 원래 오류를 가리지 않는다.
    try {
      s.conn.exec("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    s.txDepth--;
  }
}

function snapshotTo(conn: DatabaseSync, file: string) {
  // VACUUM INTO: 쓰기를 막지 않고 그 순간의 일관된 사본을 빈 공간 없이 만든다.
  conn.prepare("VACUUM INTO ?").run(file);
}

/** 지금 상태의 일관된 DB 사본을 file에 만든다(file이 없어야 한다). */
export function snapshot(file: string): void {
  snapshotTo(state().conn, file);
}

export function getMeta(key: string): string | undefined {
  return get<{ value: string }>("SELECT value FROM meta WHERE key = ?", key)?.value;
}

export function setMeta(key: string, value: string): void {
  run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", key, value);
}

/** 파일 이름에 쓰는 시각(UTC): 20260102T030405Z */
export function fileStamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

const COUNTED_TABLES = ["users", "learning_items", "submissions", "submission_versions", "chat_messages", "server_errors"] as const;

/** 운영자 시스템 화면용 테이블별 행 수 */
export function tableCounts(): Record<(typeof COUNTED_TABLES)[number], number> {
  return Object.fromEntries(COUNTED_TABLES.map((t) => [t, get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`)?.n ?? 0])) as Record<
    (typeof COUNTED_TABLES)[number],
    number
  >;
}
