import Link from "next/link";
import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { databaseSize, schemaVersion, tableCounts } from "@/lib/db";
import { diskUsage } from "@/lib/diskGuard";
import { totalUploadBytes } from "@/lib/submissionStore";
import { countServerErrorsLastDay, recentServerErrors } from "@/lib/serverErrors";
import { formatDateTime } from "@/lib/datetime";

export const metadata = { title: "시스템" };

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

export default async function OperatorSystemPage() {
  await requireAdmin("/operator/system");
  const counts = tableCounts();
  const size = databaseSize();
  const disk = diskUsage();
  const uploads = totalUploadBytes();
  const errors = recentServerErrors(20);
  const errors24h = countServerErrorsLastDay();
  const mem = process.memoryUsage();
  const lowDisk = disk ? disk.free < 2 * 1024 ** 3 : false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="시스템" description="데이터 저장소와 서버 상태를 확인합니다." actions={<Link href="/operator/security" className="btn btn-secondary btn-sm">보안 기록</Link>} />

      {(lowDisk || errors24h > 0) && (
        <div className="callout callout-warn mb-8 space-y-1">
          {lowDisk && <p>서버 저장 공간이 2GB 아래로 남았습니다. 오래된 첨부 파일을 정리하거나 디스크를 늘려 주십시오.</p>}
          {errors24h > 0 && <p>최근 24시간 동안 서버 오류가 {errors24h}건 있었습니다.</p>}
        </div>
      )}

      <Section title="데이터">
        <Facts
          items={[
            { label: "계정", value: counts.users.toLocaleString() },
            { label: "학습 기록 항목", value: counts.learning_items.toLocaleString() },
            { label: "채팅 메시지", value: counts.chat_messages.toLocaleString() },
            { label: "DB 크기", value: bytes(size.db + size.wal) },
            { label: "보관 중인 첨부 파일", value: bytes(uploads) },
            { label: "디스크 남은 공간", value: disk ? `${bytes(disk.free)} / ${bytes(disk.total)}` : "확인 불가", warn: lowDisk },
            { label: "스키마 버전", value: `v${schemaVersion()}` },
          ]}
        />
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
