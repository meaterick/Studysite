import "server-only";
import fs from "node:fs";
import { normalizeIp } from "./ipAddress";
import { cleanLogText, isProbePath, logPath } from "./securityPolicy";

const MAX_BYTES = 512 * 1024;
export interface EdgeEvent { at: string; ip: string; method: string; path: string; status: number; limited: boolean; probe: boolean }

/** Read only a bounded tail of a server-configured file, never a user-selected path. */
export function recentEdgeEvents(): { state: "disabled" | "ready" | "unavailable"; events: EdgeEvent[]; truncated: boolean } {
  const file = process.env.SECURITY_NGINX_LOG?.trim();
  if (!file) return { state: "disabled", events: [], truncated: false };
  let fd: number | undefined;
  try {
    fd = fs.openSync(file, "r");
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error("not a regular file");
    const start = Math.max(0, stat.size - MAX_BYTES);
    const buffer = Buffer.alloc(Math.min(stat.size, MAX_BYTES));
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, start);
    const lines = buffer.subarray(0, bytes).toString("utf8").split("\n");
    if (start > 0) lines.shift(); // Discard partial first and unfinished final lines.
    lines.pop();
    const events: EdgeEvent[] = [];
    for (const line of lines) {
      const event = parseEdgeLine(line);
      if (event) events.push(event);
    }
    return { state: "ready", events: events.slice(-100).reverse(), truncated: start > 0 || events.length > 100 };
  } catch {
    return { state: "unavailable", events: [], truncated: false };
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** Shared strict parser for display and the incremental detector. */
export function parseEdgeLine(line: string): EdgeEvent | null {
  try {
    const r = JSON.parse(line);
    const at = typeof r.at === "string" ? new Date(r.at) : new Date(NaN);
    const ip = normalizeIp(r.ip);
    if (!Number.isFinite(at.getTime()) || !ip || typeof r.path !== "string" || typeof r.method !== "string" ||
      !Number.isInteger(r.status) || r.status < 100 || r.status > 599) return null;
    return { at: at.toISOString(), ip, method: cleanLogText(r.method, 12), path: logPath(r.path), status: r.status,
      limited: r.status === 429, probe: isProbePath(r.path) };
  } catch { return null; }
}
