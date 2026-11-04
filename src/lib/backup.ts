import "server-only";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import { DATA_DIR } from "./dataDir";
import { DB_FILE, fileStamp, get, getMeta, run, setMeta, snapshot, tx } from "./db";
import { hasDiskSpaceFor } from "./diskGuard";

// DB 백업. 매일 새벽(한국 시간 4시 무렵) 일관된 스냅숏(VACUUM INTO)을 gzip으로 압축해 DATA_DIR/backups에 둔다.
// - 보관: 최근 7일은 모두, 그 이전 5주는 주마다 하나, 수동·업그레이드 전 백업은 종류별 최근 5개.
//   어떤 백업도 6주(MAX_AGE)를 넘기지 않는다 — 탈퇴한 사용자의 기록이 백업에 남는 기간의 상한이다(개인정보처리방침).
// - BACKUP_MIRROR_DIR을 지정하면(다른 디스크·네트워크 드라이브 등) 같은 파일을 그곳에도 복사한다.
//   같은 서버 디스크의 백업은 실수·잘못된 배포를 되돌리는 용도이고, 디스크 고장까지 대비하려면 서버 밖에 사본이 있어야 한다.
// - 운영자는 시스템 화면에서 백업을 내려받을 수 있다(서버 밖 보관의 가장 간단한 방법).
// 첨부 파일(uploads/)은 크기가 커서 이 백업에 넣지 않는다.

export const BACKUP_DIR = path.join(DATA_DIR, "backups");
const LEGACY_ARCHIVE_DIR = path.join(DATA_DIR, "legacy-json");
const DAY = 86_400_000;
const MAX_AGE = 42 * DAY;
const MIRROR_DIR = process.env.BACKUP_MIRROR_DIR ? path.resolve(process.env.BACKUP_MIRROR_DIR) : undefined;

export type BackupReason = "daily" | "manual" | "pre-migration";

export interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
  reason: BackupReason | "unknown";
}

const NAME_RE = /^aegis-(\d{8}T\d{6}Z)-([a-z-]+?)(?:-v\d+)?\.db(\.gz)?$/;

export function isBackupName(name: string): boolean {
  return NAME_RE.test(name) && !name.includes("/") && !name.includes("\\");
}

function parseStamp(stamp: string): string {
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z`;
}

function listIn(dir: string): BackupFile[] {
  if (!fs.existsSync(dir)) return [];
  const out: BackupFile[] = [];
  for (const name of fs.readdirSync(dir)) {
    const m = NAME_RE.exec(name);
    if (!m) continue;
    const reason = (["daily", "manual", "pre-migration"] as const).find((r) => r === m[2]) ?? "unknown";
    out.push({ name, size: fs.statSync(path.join(dir, name)).size, createdAt: parseStamp(m[1]), reason });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listBackups(): BackupFile[] {
  return listIn(BACKUP_DIR);
}

/** 내려받기용으로 백업 파일을 연다. 이름은 정해진 형식만 받아 백업 폴더 밖의 파일은 열 수 없다. */
export function openBackup(name: string): { size: number; stream: fs.ReadStream } | null {
  if (!isBackupName(name)) return null;
  const file = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(file)) return null;
  return { size: fs.statSync(file).size, stream: fs.createReadStream(file) };
}

/** 보관 규칙에 맞지 않는 오래된 백업을 지운다. */
function rotate(dir: string) {
  const now = Date.now();
  const keep = new Set<string>();
  const weeksSeen = new Set<string>();
  const perReason = new Map<string, number>();
  for (const b of listIn(dir)) {
    const age = now - Date.parse(b.createdAt);
    if (b.reason === "daily") {
      const week = String(Math.floor(Date.parse(b.createdAt) / (7 * DAY)));
      if (age <= 7 * DAY) keep.add(b.name);
      else if (age <= MAX_AGE && !weeksSeen.has(week)) keep.add(b.name);
      weeksSeen.add(week);
    } else {
      const n = perReason.get(b.reason) ?? 0;
      if (n < 5 && age <= MAX_AGE) keep.add(b.name);
      perReason.set(b.reason, n + 1);
    }
  }
  for (const b of listIn(dir)) if (!keep.has(b.name)) fs.rmSync(path.join(dir, b.name), { force: true });
  // 중간에 끊긴 작업이 남긴 임시 파일 정리
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".tmp-") && now - fs.statSync(path.join(dir, name)).mtimeMs > DAY) fs.rmSync(path.join(dir, name), { force: true });
  }
}

/** 예전 JSON 저장소에서 옮기고 보관해 둔 원본(legacy-json/<시각>/)도 백업과 같은 기간이 지나면 지운다. */
function pruneLegacyArchives() {
  if (!fs.existsSync(LEGACY_ARCHIVE_DIR)) return;
  for (const name of fs.readdirSync(LEGACY_ARCHIVE_DIR)) {
    if (!/^\d{8}T\d{6}Z$/.test(name)) continue;
    if (Date.now() - Date.parse(parseStamp(name)) > MAX_AGE) fs.rmSync(path.join(LEGACY_ARCHIVE_DIR, name), { recursive: true, force: true });
  }
}

/**
 * 지금 DB의 백업을 만든다. 스냅숏은 짧게 동기로 만들고, 압축은 비동기로 해 그동안에도 요청을 처리한다.
 * 다른 프로세스(무중단 배포 중 겹친 이전 버전)가 같은 시각에 백업 중이면 건너뛴다.
 */
export async function createBackup(reason: BackupReason): Promise<BackupFile | null> {
  const claimed = tx(() => {
    const running = getMeta("backup_running_since");
    if (running && Date.now() - Date.parse(running) < 30 * 60_000) return false;
    setMeta("backup_running_since", new Date().toISOString());
    return true;
  });
  if (!claimed) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = fileStamp();
  const tmp = path.join(BACKUP_DIR, `.tmp-${process.pid}-${stamp}.db`);
  const name = `aegis-${stamp}-${reason}.db.gz`;
  const target = path.join(BACKUP_DIR, name);
  try {
    const dbSize = fs.statSync(DB_FILE).size;
    if (!hasDiskSpaceFor(dbSize * 2)) throw new Error("not enough disk space for a backup");
    snapshot(tmp);
    await pipeline(fs.createReadStream(tmp), createGzip({ level: 6 }), fs.createWriteStream(`${target}.partial`));
    fs.renameSync(`${target}.partial`, target);
    if (MIRROR_DIR) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      fs.copyFileSync(target, path.join(MIRROR_DIR, name));
      rotate(MIRROR_DIR);
    }
    rotate(BACKUP_DIR);
    pruneLegacyArchives();
    setMeta("backup_last", JSON.stringify({ at: new Date().toISOString(), name, reason, size: fs.statSync(target).size }));
    setMeta("backup_last_error", "");
    return listBackups().find((b) => b.name === name) ?? null;
  } catch (err) {
    setMeta("backup_last_error", JSON.stringify({ at: new Date().toISOString(), message: (err as Error).message }));
    console.error("[backup] failed", err);
    fs.rmSync(`${target}.partial`, { force: true });
    return null;
  } finally {
    fs.rmSync(tmp, { force: true });
    run("DELETE FROM meta WHERE key = 'backup_running_since'");
  }
}

export interface BackupStatus {
  last?: { at: string; name: string; reason: string; size: number };
  lastError?: { at: string; message: string };
  mirrorDir?: string;
  /** 36시간 넘게 성공한 백업이 없다 */
  stale: boolean;
}

export function backupStatus(): BackupStatus {
  const parse = <T,>(raw: string | undefined): T | undefined => {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  };
  const last = parse<BackupStatus["last"]>(getMeta("backup_last"));
  return {
    last,
    lastError: parse(getMeta("backup_last_error")),
    mirrorDir: MIRROR_DIR,
    stale: !last || Date.now() - Date.parse(last.at) > 36 * 3_600_000,
  };
}

/** 마지막 정기 백업 시각 */
function lastDailyAt(): number {
  const latest = listBackups().find((b) => b.reason === "daily");
  return latest ? Date.parse(latest.createdAt) : 0;
}

/**
 * 10분마다 확인해, 한국 시간 4~5시이고 20시간 안에 정기 백업이 없으면 백업한다.
 * 서버가 그 시간에 꺼져 있었더라도 36시간 넘게 정기 백업이 없으면 바로 만든다.
 */
export function startBackupSchedule(): void {
  const tick = () => {
    const kstHour = (new Date().getUTCHours() + 9) % 24;
    const since = Date.now() - lastDailyAt();
    if ((kstHour === 4 && since > 20 * 3_600_000) || since > 36 * 3_600_000) void createBackup("daily");
  };
  const timer = setInterval(tick, 10 * 60_000);
  timer.unref();
  // 처음 켜질 때도 한 번 확인한다(오래 꺼져 있었으면 바로 백업).
  setTimeout(tick, 60_000).unref();
}

/** DB 파일(+WAL) 크기 */
export function databaseSize(): { db: number; wal: number } {
  const size = (f: string) => (fs.existsSync(f) ? fs.statSync(f).size : 0);
  return { db: size(DB_FILE), wal: size(`${DB_FILE}-wal`) };
}

export function schemaVersion(): number {
  return get<{ v: number }>("SELECT MAX(version) AS v FROM schema_migrations")?.v ?? 0;
}
