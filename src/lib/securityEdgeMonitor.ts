import "server-only";
import fs from "node:fs";
import { getMeta, setMeta, tx } from "./db";
import { parseEdgeLine } from "./securityEdgeLog";
import { observeSecuritySignal } from "./securityDetection";

const KEY = "security_edge_cursor";
const READ_BYTES = 256 * 1024;
interface Cursor { file: string; inode: string; offset: number; checkedAt: string; processed: number }
interface Health { file: string; checkedAt: string; failed: boolean; backlogBytes: number }
const holder = globalThis as unknown as { __aegisEdgeHealth?: Health };
export function edgeMonitorStatus(): Cursor | null {
  try {
    const v = JSON.parse(getMeta(KEY) ?? "null");
    return v && typeof v.file === "string" && typeof v.inode === "string" && Number.isSafeInteger(v.offset) && v.offset >= 0
      && typeof v.checkedAt === "string" && Number.isSafeInteger(v.processed) && v.processed >= 0 ? v : null;
  } catch { return null; }
}
export function edgeMonitorHealth(): { state: "ready" | "disabled" | "unavailable" | "stale"; checkedAt: string; backlogBytes: number } {
  const file = process.env.SECURITY_NGINX_LOG?.trim(), h = holder.__aegisEdgeHealth;
  const state = !file ? "disabled" : !h || h.file !== file || h.failed ? "unavailable"
    : Date.now() - Date.parse(h.checkedAt) > 45_000 ? "stale" : "ready";
  return { state, checkedAt: h && h.file === file ? h.checkedAt : "", backlogBytes: h && h.file === file ? h.backlogBytes : 0 };
}
/** Read and parse before the write lock, then compare the shared cursor inside it. */
export function pollSecurityEdgeLog(): number {
  const file = process.env.SECURITY_NGINX_LOG?.trim();
  if (!file) return 0;
  let fd: number | undefined;
  try {
    fd = fs.openSync(file, "r");
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error("not a regular file");
    const inode = String(stat.dev) + ":" + stat.ino, old = edgeMonitorStatus();
    const offset = !old || old.file !== file ? stat.size : old.inode !== inode || stat.size < old.offset ? 0 : old.offset;
    const buffer = Buffer.alloc(Math.min(READ_BYTES, Math.max(0, stat.size - offset)));
    const read = buffer.length ? fs.readSync(fd, buffer, 0, buffer.length, offset) : 0;
    const end = buffer.subarray(0, read).lastIndexOf(10);
    const consumed = end >= 0 ? end + 1 : read === READ_BYTES ? read : 0;
    const now = Date.now();
    const events = end < 0 ? [] : buffer.subarray(0, end).toString("utf8").split("\n").flatMap((line) => {
      const e = parseEdgeLine(line);
      return e && now - Date.parse(e.at) <= 300_000 && Date.parse(e.at) <= now + 60_000 ? [e] : [];
    });
    holder.__aegisEdgeHealth = { file, checkedAt: new Date().toISOString(), failed: false, backlogBytes: Math.max(0, stat.size - offset - consumed) };
    // Initialize/rotate once. Unchanged files and unfinished short lines need no DB writer.
    if (old?.file === file && old.inode === inode && old.offset === offset && consumed === 0) return 0;
    return tx(() => {
      const current = edgeMonitorStatus();
      if (JSON.stringify(current) !== JSON.stringify(old)) return 0;
      for (const e of events) {
        // App probes are counted by Proxy. These signals never auto-ban.
        if (e.status === 404 && !e.probe) observeSecuritySignal("not_found", { ip: e.ip, path: e.path, method: e.method, status: e.status });
        if (e.status === 429) observeSecuritySignal("edge_rate", { ip: e.ip, path: e.path, method: e.method, status: e.status });
      }
      setMeta(KEY, JSON.stringify({ file, inode, offset: offset + consumed, checkedAt: new Date().toISOString(), processed: (old?.processed ?? 0) + events.length } satisfies Cursor));
      return events.length;
    });
  } catch (error) {
    holder.__aegisEdgeHealth = { file, checkedAt: new Date().toISOString(), failed: true, backlogBytes: 0 };
    throw error;
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}
export function startSecurityEdgeMonitor(): void {
  if (!process.env.SECURITY_NGINX_LOG) return;
  const poll = () => {
    try { pollSecurityEdgeLog(); } catch { /* Health exposes failures without raw log output. */ }
    const timer = setTimeout(poll, edgeMonitorHealth().backlogBytes >= READ_BYTES ? 1000 : 10_000);
    timer.unref();
  };
  poll();
}
