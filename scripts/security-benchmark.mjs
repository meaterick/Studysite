// Reproducible, isolated resource measurements. No production data or requests.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { performance } from "node:perf_hooks";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-security-cost-"));
const edge = path.join(dir, "edge.log"), host = path.join(dir, "host.json");
Object.assign(process.env, { DATA_DIR: dir, NODE_ENV: "production", SESSION_SECRET: "isolated-security-cost-test-secret-32-characters", PUBLIC_ORIGIN: "https://study.example", SECURITY_NGINX_LOG: edge, SECURITY_HOST_TELEMETRY: host });
fs.writeFileSync(edge, "");
fs.writeFileSync(host, JSON.stringify({ version: 1, checkedAt: new Date().toISOString(), sshChecked: true, sshTruncated: false, sshEvents: [], firewalls: [] }));
const { pollSecurityEdgeLog } = await import("../src/lib/securityEdgeMonitor.ts");
const { pollHostTelemetry, hostTelemetry } = await import("../src/lib/hostTelemetry.ts");
const { run, all, tx, exec } = await import("../src/lib/db.ts");
pollSecurityEdgeLog(); pollHostTelemetry(); hostTelemetry();
const counters = { transactions: 0, writes: 0, snapshotReads: 0 };
const originalExec = DatabaseSync.prototype.exec, originalRead = fs.readFileSync;
const scratch = new DatabaseSync(":memory:");
const prototype = Object.getPrototypeOf(scratch.prepare("SELECT 1"));
const originalRun = prototype.run;
DatabaseSync.prototype.exec = function(sql) { if (/^BEGIN IMMEDIATE/.test(sql)) counters.transactions++; return originalExec.call(this, sql); };
prototype.run = function(...values) { counters.writes++; return originalRun.apply(this, values); };
fs.readFileSync = function(file, ...args) { if (file === host) counters.snapshotReads++; return originalRead.call(this, file, ...args); };
const started = performance.now();
for (let i = 0; i < 100; i++) { pollSecurityEdgeLog(); pollHostTelemetry(); hostTelemetry(); }
const idle = { pollsPerSource: 100, ...counters, milliseconds: +(performance.now() - started).toFixed(2) };
DatabaseSync.prototype.exec = originalExec; prototype.run = originalRun; fs.readFileSync = originalRead; scratch.close();

const now = new Date().toISOString();
tx(() => {
  for (let i = 0; i < 10000; i++) run("INSERT INTO security_events (bucket,first_at,last_at,kind,severity,ip,user_id,method,path,status) VALUES (?,?,?,?,?,?,?,?,?,?)", now, now, now, "probe", "high", `203.0.${Math.floor(i / 250)}.${i % 250 + 1}`, "", "GET", `/${i}`, 404);
});
const query = "SELECT * FROM security_events WHERE last_at >= ? AND ip = ? ORDER BY last_at DESC, id DESC LIMIT 50";
const params = [new Date(Date.now() - 86400_000).toISOString(), "203.0.1.1"];
const before = performance.now();
for (let i = 0; i < 100; i++) all(query, ...params);
const filteredQuery = { rowsStored: 10000, repetitions: 100, milliseconds: +(performance.now() - before).toFixed(2), plan: all("EXPLAIN QUERY PLAN " + query, ...params).map((p) => p.detail) };
exec("PRAGMA wal_checkpoint(TRUNCATE)");
console.log(JSON.stringify({ node: process.version, idle, filteredQuery }, null, 2));
