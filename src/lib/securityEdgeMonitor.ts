import "server-only";
import fs from "node:fs";
import { getMeta, setMeta, tx } from "./db";
import { parseEdgeLine } from "./securityEdgeLog";
import { observeSecuritySignal } from "./securityDetection";

const KEY = "security_edge_cursor";
const READ_BYTES = 256 * 1024;
interface Cursor { file: string; inode: string; offset: number; checkedAt: string; processed: number }
export function edgeMonitorStatus(): Cursor | null {
  try {
    const value = JSON.parse(getMeta(KEY) ?? "null");
    return value && typeof value.file === "string" && typeof value.inode === "string" &&
      Number.isSafeInteger(value.offset) && value.offset >= 0 && typeof value.checkedAt === "string" &&
      Number.isSafeInteger(value.processed) && value.processed >= 0 ? value : null;
  } catch { return null; }
}

/** One bounded batch; the transaction shares the cursor across overlapping deployment processes. */
export function pollSecurityEdgeLog(): number {
  const file = process.env.SECURITY_NGINX_LOG?.trim();
  if (!file) return 0;
  let fd: number | undefined;
  try {
    fd = fs.openSync(file, "r");
    const descriptor = fd;
    return tx(() => {
      const stat = fs.fstatSync(descriptor);
      if (!stat.isFile()) return 0;
      const inode = `${stat.dev}:${stat.ino}`;
      const old = edgeMonitorStatus();
      // Initial connection starts at EOF. Old requests must not trigger new alerts after deployment.
      const offset = !old || old.file !== file ? stat.size : old.inode !== inode || stat.size < old.offset ? 0 : old.offset;
      const buffer = Buffer.alloc(Math.min(READ_BYTES, Math.max(0, stat.size - offset)));
      const read = buffer.length ? fs.readSync(descriptor, buffer, 0, buffer.length, offset) : 0;
      const end = buffer.subarray(0, read).lastIndexOf(10);
      let consumed = end >= 0 ? end + 1 : 0;
      // A line larger than the bounded buffer is malformed; advance so the detector cannot stall forever.
      if (end < 0 && read === READ_BYTES) consumed = read;
      let processed = 0;
      if (end >= 0) {
        for (const line of buffer.subarray(0, end).toString("utf8").split("\n")) {
          const e = parseEdgeLine(line);
          if (!e || Date.now() - Date.parse(e.at) > 5 * 60_000 || Date.parse(e.at) > Date.now() + 60_000) continue;
          // Known probes are already counted by Proxy. Other 404/429 signals only alert, never auto-ban.
          if (e.status === 404 && !e.probe) observeSecuritySignal("not_found", { ip: e.ip, path: e.path, method: e.method, status: e.status });
          if (e.status === 429) observeSecuritySignal("edge_rate", { ip: e.ip, path: e.path, method: e.method, status: e.status });
          processed++;
        }
      }
      setMeta(KEY, JSON.stringify({ file, inode, offset: offset + consumed, checkedAt: new Date().toISOString(), processed: (old?.processed ?? 0) + processed } satisfies Cursor));
      return processed;
    });
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

export function startSecurityEdgeMonitor(): void {
  if (!process.env.SECURITY_NGINX_LOG) return;
  const poll = () => {
    try { pollSecurityEdgeLog(); } catch { /* Display the last successful check; a missing file never stops the app. */ }
  };
  poll();
  const timer = setInterval(poll, 10_000);
  timer.unref();
}
