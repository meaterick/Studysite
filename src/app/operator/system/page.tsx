import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { getMeta, tableCounts } from "@/lib/db";
import { backupStatus, createBackup, databaseSize, listBackups, schemaVersion } from "@/lib/backup";
import { diskUsage } from "@/lib/diskGuard";
import { totalUploadBytes } from "@/lib/submissionStore";
import { countServerErrorsLastDay, recentServerErrors } from "@/lib/serverErrors";
import { formatDateTime } from "@/lib/datetime";
import type { LegacyImportReport } from "@/lib/legacyImport";

export const metadata = { title: "시스템" };

const REASON_LABEL: Record<string, string> = { daily: "정기", manual: "수동", "pre-migration": "업그레이드 전", unknown: "기타" };

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

function duration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function parseJson<T>(raw: string | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Facts({ items }: { items: { label: string; value: ReactNode; warn?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 border-y border-[var(--border-hairline)] sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.label} className={`py-4 pr-4 ${i % 2 === 1 ? "pl-4 sm:pl-0" : ""} ${i % 4 !== 0 ? "sm:border-l sm:border-[var(--border-hairline)] sm:pl-4" : ""}`}>
          <dt className="text-xs text-ink-muted">{it.label}</dt>
          <dd className={`mt-1.5 text-lg font-semibold tabular-nums tracking-[-0.02em] ${it.warn ? "text-[var(--status-critical)]" : "text-ink"}`}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function OperatorSystemPage({ searchParams }: { searchParams: Promise<{ backup?: string }> }) {
  await requireAdmin("/operator/system");
  const { backup } = await searchParams;

  async function backupNow() {
    "use server";
    await requireAdmin("/operator/system");
    const made = await createBackup("manual");
    redirect(`/operator/system?backup=${made ? "ok" : "failed"}`);
  }

  const counts = tableCounts();
  const size = databaseSize();
  const disk = diskUsage();
  const uploads = totalUploadBytes();
  const status = backupStatus();
  const backups = listBackups();
  const errors = recentServerErrors(20);
  const errors24h = countServerErrorsLastDay();
  const legacy = parseJson<LegacyImportReport>(getMeta("legacy_import"));
  const archived = parseJson<{ at: string; dir: string }>(getMeta("legacy_archive"));
  const mem = process.memoryUsage();
  const lowDisk = disk ? disk.free < 2 * 1024 ** 3 : false;
  const staleBackup = status.stale;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="시스템" description="데이터 저장소와 서버 상태, 백업을 확인합니다." />

      {backup === "ok" && <p className="callout callout-good mb-8">백업을 만들었습니다.</p>}
      {backup === "failed" && (
        <p role="alert" className="callout callout-danger mb-8">
          백업을 만들지 못했습니다. 아래의 마지막 오류를 확인해 주십시오. 다른 백업이 진행 중이면 잠시 뒤 다시 시도해 주십시오.
        </p>
      )}
      {(lowDisk || staleBackup || errors24h > 0) && (
        <div className="callout callout-warn mb-8 space-y-1">
          {lowDisk && <p>서버 저장 공간이 2GB 아래로 남았습니다. 오래된 첨부 파일이나 백업을 정리하거나 디스크를 늘려 주십시오.</p>}
          {staleBackup && <p>최근 36시간 안에 성공한 백업이 없습니다.</p>}
          {errors24h > 0 && <p>최근 24시간 동안 서버 오류가 {errors24h}건 있었습니다.</p>}
        </div>
      )}

      <Section title="데이터">
        <Facts
          items={[
            { label: "계정", value: counts.users.toLocaleString() },
            { label: "학습 기록 항목", value: counts.learning_items.toLocaleString() },
            { label: "과제 제출 (버전)", value: `${counts.submissions.toLocaleString()} (${counts.submission_versions.toLocaleString()})` },
            { label: "채팅 메시지", value: counts.chat_messages.toLocaleString() },
            { label: "DB 크기", value: bytes(size.db + size.wal) },
            { label: "첨부 파일", value: bytes(uploads) },
            { label: "디스크 남은 공간", value: disk ? `${bytes(disk.free)} / ${bytes(disk.total)}` : "확인 불가", warn: lowDisk },
            { label: "스키마 버전", value: `v${schemaVersion()}` },
          ]}
        />
        {legacy && (
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            예전 JSON 저장소에서 옮김: {formatDateTime(legacy.at)} · 계정 {legacy.users} · 학습 기록 {legacy.learning} · 제출 {legacy.submissions} · 대화{" "}
            {legacy.conversations}
            {legacy.skipped > 0 && ` · 옮기지 않음 ${legacy.skipped}`}
            {legacy.conflicts > 0 && ` · 계정 충돌 ${legacy.conflicts}`}
            {archived ? ` · 원본 보관: ${archived.dir.split(/[\\/]/).slice(-2).join("/")}` : " · 원본 보관 대기 중"}
          </p>
        )}
      </Section>

      <Section
        title="백업"
        actions={
          <form action={backupNow}>
            <button className="btn btn-secondary btn-sm">지금 백업</button>
          </form>
        }
      >
        <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
          매일 새벽 4시 무렵 DB 전체를 백업하고, 최근 7일치와 그 이전 5주의 주별 백업을 보관합니다. 서버 디스크가 고장 나도 데이터가 남도록
          가끔 최근 백업을 내려받아 서버 밖에 보관해 주십시오.
          {status.mirrorDir ? ` 백업은 ${status.mirrorDir}에도 복사됩니다.` : ""}
          {" "}첨부 파일은 이 백업에 들어가지 않습니다.
        </p>
        {status.lastError?.message && (
          <p role="alert" className="callout callout-danger mb-4 text-xs">
            마지막 백업 오류({formatDateTime(status.lastError.at)}): {status.lastError.message}
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
          <table className="data-table">
            <thead>
              <tr>
                <th>만든 시각</th>
                <th>종류</th>
                <th className="hidden sm:table-cell">크기</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-ink-muted">
                    아직 백업이 없습니다.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name}>
                    <td className="whitespace-nowrap tabular-nums text-ink">{formatDateTime(b.createdAt)}</td>
                    <td className="whitespace-nowrap text-ink-secondary">{REASON_LABEL[b.reason]}</td>
                    <td className="hidden whitespace-nowrap tabular-nums text-ink-secondary sm:table-cell">{bytes(b.size)}</td>
                    <td className="text-right">
                      <a href={`/api/operator/backups/${encodeURIComponent(b.name)}`} className="btn btn-ghost btn-sm" download>
                        내려받기
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="서버">
        <Facts
          items={[
            { label: "가동 시간", value: duration(process.uptime()) },
            { label: "메모리 (RSS)", value: bytes(mem.rss), warn: mem.rss > 350 * 1024 ** 2 },
            { label: "Node.js", value: process.version },
            { label: "24시간 오류", value: errors24h, warn: errors24h > 0 },
          ]}
        />
      </Section>

      <Section title="최근 서버 오류">
        {errors.length === 0 ? (
          <p className="text-sm text-ink-muted">기록된 오류가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
            <table className="data-table">
              <thead>
                <tr>
                  {["시각", "요청", "내용"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {errors.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-xs tabular-nums text-ink-muted">{formatDateTime(e.at)}</td>
                    <td className="whitespace-nowrap font-mono text-xs text-ink-secondary">
                      {e.method} {e.path}
                    </td>
                    <td className="min-w-[16rem] text-xs text-ink-body">
                      {e.message}
                      {e.digest && <span className="ml-2 font-mono text-ink-muted">#{e.digest}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
