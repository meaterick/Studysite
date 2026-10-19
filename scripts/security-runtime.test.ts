import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";

test("security runtime cost and source correctness", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-runtime-"));
  const edge = path.join(dir, "edge.log"), file = path.join(dir, "host.json");
  Object.assign(process.env, { DATA_DIR: dir, NODE_ENV: "production", SESSION_SECRET: "runtime-test-secret-more-than-32-characters", PUBLIC_ORIGIN: "https://study.example", TRUST_PROXY: "1", SECURITY_NGINX_LOG: edge, SECURITY_HOST_TELEMETRY: file });
  fs.writeFileSync(edge, "");
  const snapshot = { version: 1, checkedAt: new Date().toISOString(), sshChecked: true, sshTruncated: false, sshEvents: [], firewalls: [] };
  fs.writeFileSync(file, JSON.stringify(snapshot));
  const { pollSecurityEdgeLog, edgeMonitorHealth } = await import("../src/lib/securityEdgeMonitor");
  const { pollHostTelemetry, hostTelemetry } = await import("../src/lib/hostTelemetry");
  const { all, get } = await import("../src/lib/db");
  const { recordSecurityEvent } = await import("../src/lib/securityEvents");
  pollSecurityEdgeLog(); pollHostTelemetry(); hostTelemetry();

  await t.test("unchanged sources acquire no writer lock, perform no writes and reuse validated snapshots", t => {
    const exec = t.mock.method(DatabaseSync.prototype, "exec");
    const reads = t.mock.method(fs, "readFileSync");
    const memory = new DatabaseSync(":memory:");
    const runs = t.mock.method(Object.getPrototypeOf(memory.prepare("SELECT 1")), "run");
    for (let i = 0; i < 20; i++) { pollSecurityEdgeLog(); pollHostTelemetry(); hostTelemetry(); }
    assert.equal(exec.mock.calls.filter(c => /^BEGIN IMMEDIATE/.test(String(c.arguments[0]))).length, 0);
    assert.equal(runs.mock.callCount(), 0);
    assert.equal(reads.mock.calls.filter(c => c.arguments[0] === file).length, 0);
    assert.equal(edgeMonitorHealth().state, "ready", "idle does not mean stale");
    memory.close();
  });
  await t.test("cached results still expire, atomic replacements are revalidated, source failure is explicit", t => {
    const now = Date.now();
    const clock = t.mock.method(Date, "now", () => now + 181_000);
    assert.equal(hostTelemetry().state, "stale");
    clock.mock.restore();
    const replacement = path.join(dir, "replacement");
    fs.writeFileSync(replacement, JSON.stringify({ ...snapshot, sshEvents: [{ ip: "invalid" }] }));
    fs.renameSync(replacement, file);
    assert.equal(hostTelemetry().state, "unavailable");
    fs.writeFileSync(file, JSON.stringify(snapshot));
    assert.equal(hostTelemetry().state, "ready");
    fs.renameSync(edge, edge + ".old");
    assert.throws(() => pollSecurityEdgeLog());
    assert.equal(edgeMonitorHealth().state, "unavailable");
    fs.writeFileSync(edge, ""); pollSecurityEdgeLog();
    assert.equal(edgeMonitorHealth().state, "ready");
  });
  await t.test("overlapping processes consume each new nginx line only once", async () => {
    fs.appendFileSync(edge, Array.from({ length: 40 }, (_, i) => JSON.stringify({ at: new Date().toISOString(), ip: "203.0.113.52", path: "/missing/" + i, method: "GET", status: 404 }) + "\n").join(""));
    const poll = () => new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", "const m=await import('./src/lib/securityEdgeMonitor.ts'); console.log(m.pollSecurityEdgeLog())"], { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
      let output = "", error = "";
      child.stdout.on("data", d => output += d); child.stderr.on("data", d => error += d);
      child.on("error", reject); child.on("close", code => code ? reject(new Error(error)) : resolve(Number(output.trim())));
    });
    assert.equal((await Promise.all([poll(), poll()])).reduce((a,b)=>a+b,0),40);
    assert.equal(get<{ count: number }>("SELECT count FROM security_detection_windows WHERE ip = ? AND family = 'not_found'", "203.0.113.52")?.count,40);
    assert.equal(pollSecurityEdgeLog(),0);
  });
  await t.test("repeated unsigned operator access alerts without automatic bans; lookup plans use bounded index searches", () => {
    for (let i=0;i<20;i++) recordSecurityEvent("auth_required", { ip:"203.0.113.53", path:"/operator/security", status:307 });
    assert.equal(get<{ family:string }>("SELECT family FROM security_cases WHERE ip = ?", "203.0.113.53")?.family,"access");
    assert.equal(get("SELECT * FROM security_ip_rules WHERE ip = ?", "203.0.113.53"),undefined);
    const plan=all<{detail:string}>("EXPLAIN QUERY PLAN SELECT * FROM security_events WHERE ip = ? AND last_at >= ? ORDER BY last_at DESC,id DESC LIMIT 50", "203.0.113.53", "2020");
    assert.ok(plan.some(p => p.detail.includes("SEARCH") && p.detail.includes("ip=?")));
    const history=all<{detail:string}>("EXPLAIN QUERY PLAN SELECT * FROM security_case_history WHERE case_id = ? ORDER BY id DESC LIMIT 10", "x");
    assert.ok(history.some(p=>p.detail.includes("SEARCH") && p.detail.includes("case_id=?")));
  });
});
