import "server-only";
import fs from "node:fs";

// Private, server-selected files only. Revalidate freshness at the caller on every read.
// Atomic replacement changes inode; nanosecond timestamps also catch in-place updates.
const holder = globalThis as unknown as { __aegisSecuritySnapshots?: Map<string, { signature: string; value: unknown }> };
export function readSecuritySnapshot<T>(file: string, validate: (value: unknown) => value is T): T | null {
  try {
    const stat = fs.statSync(file, { bigint: true });
    if (!stat.isFile() || stat.size > BigInt(128 * 1024)) return null;
    const signature = `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
    const cache = holder.__aegisSecuritySnapshots ??= new Map();
    const old = cache.get(file);
    if (old?.signature === signature) return old.value as T | null;
    let value: T | null = null;
    try { const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8")); if (validate(parsed)) value = parsed; } catch {}
    if (cache.size >= 4 && !cache.has(file)) cache.delete(cache.keys().next().value!);
    cache.set(file, { signature, value });
    return value;
  } catch { return null; }
}
