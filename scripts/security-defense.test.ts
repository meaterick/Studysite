import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("IP defense and detection", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-defense-"));
  Object.assign(process.env, { DATA_DIR: dir, SESSION_SECRET: "a-test-secret-with-more-than-32-characters", PUBLIC_ORIGIN: "https://study.example", NODE_ENV: "production", TRUST_PROXY: "1", ADMIN_EMAILS: "owner@example.com" });
  const { all, get, run, tx } = await import("../src/lib/db");
  const { normalizeIp, isBannableIp } = await import("../src/lib/ipAddress");
  const { activeIpRule, saveIpRule, removeIpRule, setAutoBanEnabled, MAX_IP_RULES, pruneIpDefense, listIpRules, ipRuleHistory } = await import("../src/lib/ipRules");
  const { applySecurityChange } = await import("../src/lib/securityManagement");
  const { recordSecurityEvent, securitySummary } = await import("../src/lib/securityEvents");
  const { observeSecuritySignal } = await import("../src/lib/securityDetection");
  const { pollSecurityEdgeLog } = await import("../src/lib/securityEdgeMonitor");
  const { findOrCreateGoogleUser } = await import("../src/lib/userStore");
  const { encryptSession } = await import("../src/lib/session");
  const { proxy } = await import("../src/proxy");
  const { NextRequest } = await import("next/server");
  const admin = await findOrCreateGoogleUser({ email: "owner@example.com", name: "Owner", subject: "owner" });
  const member = await findOrCreateGoogleUser({ email: "member@example.com", name: "Member", subject: "member" });
  const ownIp = "203.0.113.200";
  const form = (values: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(values)) f.set(k, v); return f; };
  const req = (ip: string, pathname = "/", cookie = "") => new NextRequest(`https://study.example${pathname}`, { headers: { "x-real-ip": ip, ...(cookie ? { cookie: `aegis_session=${cookie}` } : {}) } });
  const clear = () => { run("DELETE FROM security_ip_rules"); run("DELETE FROM security_detection_windows"); run("DELETE FROM security_events"); setAutoBanEnabled(true); delete process.env.SECURITY_IP_ENFORCEMENT; };

  await t.test("canonical addresses collapse IPv6 aliases and mapped IPv4; infrastructure cannot be banned", () => {
    assert.equal(normalizeIp("2001:0DB8:0000:0000:0000:0000:0000:0001"), "2001:db8::1");
    assert.equal(normalizeIp("::ffff:203.0.113.9"), "203.0.113.9");
    assert.equal(normalizeIp("0:0:0:0:0:ffff:cb00:7109"), "203.0.113.9");
    for (const bad of ["example.com", "1.2.3.4:80", "1.2.3.4/24", "1.2.3.4,2.3.4.5", "fe80::1%eth0", "999.1.1.1"]) assert.equal(normalizeIp(bad), "");
    for (const ip of ["0.0.0.0", "127.0.0.1", "::1", "10.0.0.1", "192.168.1.2", "172.16.0.1", "169.254.1.1", "100.64.0.1", "224.0.0.1", "fc00::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1"]) assert.equal(isBannableIp(ip), false, ip);
    assert.equal(isBannableIp("203.0.113.9"), true);
    assert.equal(isBannableIp("2001:db8::1"), true);
  });

  await t.test("only DB administrators can manage rules; self-ban, unknown IP, invalid duration and input fail", () => {
    const values = { operation: "deny", ip: "203.0.113.9", minutes: "60", reason: "Repeated scan" };
    assert.throws(() => applySecurityChange(member.id, ownIp, form({ ...values, role: "admin", actorId: admin.id })), /FORBIDDEN/);
    assert.equal(applySecurityChange(admin.id, "::ffff:203.0.113.9", form(values)).ok, false);
    assert.equal(applySecurityChange(admin.id, "", form(values)).ok, false);
    for (const override of [{ ip: "10.0.0.1" }, { ip: "1.2.3.0/24" }, { minutes: "-1" }, { minutes: "NaN" }, { reason: "" }]) assert.equal(applySecurityChange(admin.id, ownIp, form({ ...values, ...override })).ok, false);
    assert.equal(activeIpRule(values.ip), undefined);
    assert.equal(applySecurityChange(admin.id, ownIp, form(values)).ok, true);
    assert.equal(activeIpRule(values.ip)?.source, "manual");
    assert.equal(Object.getPrototypeOf(listIpRules()[0]), Object.prototype, "rules passed to Client Components must be plain objects");
    assert.match(get<{ detail: string }>("SELECT detail FROM security_events WHERE kind = 'ip_banned'")!.detail, /Repeated scan/);
  });

  await t.test("bans cover all routes/assets; stale admin JWT cannot bypass DB role; current admins can recover", async () => {
    const ip = "203.0.113.9";
    const staleAdmin = await encryptSession({ uid: member.id, role: "admin" });
    for (const p of ["/", "/login", "/operator/security", "/api/health", "/_next/static/a.js", "/vendor/editor.js", "/images/week1/a.png"]) {
      const r = await proxy(req(ip, p)); assert.equal(r.status, 403, p); assert.match(r.headers.get("cache-control")!, /no-store/); assert.ok(Number(r.headers.get("retry-after")) > 0);
    }
    assert.equal((await proxy(req("::ffff:203.0.113.9", "/", staleAdmin))).status, 403);
    const adminToken = await encryptSession({ uid: admin.id, role: "admin" });
    assert.equal((await proxy(req(ip, "/operator/security", adminToken))).status, 200);
    assert.equal((await proxy(req(ip, "/_next/static/a.js", adminToken))).status, 200);
    const expiry = activeIpRule(ip)!.expires_at;
    await proxy(req(ip));
    assert.equal(activeIpRule(ip)?.expires_at, expiry);
    assert.ok(securitySummary().blocked >= 8);
    process.env.TRUST_PROXY = "0";
    assert.equal((await proxy(req(ip))).status, 200);
    process.env.TRUST_PROXY = "1";
    process.env.SECURITY_IP_ENFORCEMENT = "0";
    assert.equal((await proxy(req(ip))).status, 200);
    delete process.env.SECURITY_IP_ENFORCEMENT;
  });

  await t.test("allowlist, removal and expired rules take effect immediately and reset stale counters", async () => {
    const ip = "203.0.113.9";
    assert.equal(applySecurityChange(admin.id, ownIp, form({ operation: "allow", ip, minutes: "60", reason: "Trusted shared NAT" })).ok, true);
    assert.equal((await proxy(req(ip))).status, 200);
    for (let i = 0; i < 12; i++) recordSecurityEvent("probe", { ip, path: ["/.env", "/.git/config", "/wp-login.php"][i % 3] });
    assert.equal(activeIpRule(ip)?.mode, "allow");
    assert.equal(applySecurityChange(admin.id, ownIp, form({ operation: "remove", ip })).ok, true);
    assert.equal(get("SELECT 1 FROM security_detection_windows WHERE ip = ?", ip), undefined);
    saveIpRule({ ip, mode: "deny", source: "manual", actorId: admin.id, reason: "Expired test", minutes: 15 });
    run("UPDATE security_ip_rules SET expires_at = ? WHERE ip = ?", new Date(Date.now() - 1000).toISOString(), ip);
    assert.equal(activeIpRule(ip), undefined);
    assert.equal((await proxy(req(ip))).status, 200);
    pruneIpDefense();
    assert.equal(get("SELECT 1 FROM security_ip_rules WHERE ip = ?", ip), undefined);
  });

  await t.test("rule history preserves replacements, removals and automatic expiry with independent pagination", () => {
    const history = ipRuleHistory("203.0.113.9", 1);
    assert.ok(history.entries.some((r) => r.action === "saved" && r.mode === "deny" && r.actor_id === admin.id));
    assert.ok(history.entries.some((r) => r.action === "saved" && r.mode === "allow"));
    assert.ok(history.entries.some((r) => r.action === "removed" && r.actor_id === admin.id));
    assert.equal(history.entries.filter((r) => r.action === "expired").length, 1);
    pruneIpDefense();
    assert.equal(ipRuleHistory("203.0.113.9", 1).entries.filter((r) => r.action === "expired").length, 1);
    assert.equal(ipRuleHistory("203.0.113.99", 1).total, 0);
    assert.equal(ipRuleHistory("203.0.113.9", 9999).page, 1);
    const { total } = ipRuleHistory("", 1);
    assert.ok(total >= history.total);
  });

  await t.test("an existing chat stream stops sending immediately when its IP is banned", async () => {
    clear();
    const ip = "203.0.113.71";
    const token = await encryptSession({ uid: member.id, role: "member" });
    const { GET } = await import("../src/app/api/chat/stream/route");
    const { postChatMessage } = await import("../src/lib/chatStore");
    const response = await GET(req(ip, "/api/chat/stream", token));
    const reader = response.body!.getReader();
    await reader.read(); await reader.read(); // retry instruction and initial snapshot
    saveIpRule({ ip, mode: "deny", source: "manual", actorId: admin.id, reason: "Stop open stream", minutes: 15 });
    await postChatMessage({ userId: member.id, author: { id: admin.id, name: admin.name, role: "admin" }, text: "Must not be delivered" });
    const next = await reader.read();
    assert.equal(next.done, true);
    assert.ok(get("SELECT 1 FROM security_events WHERE kind = 'ip_blocked' AND ip = ?", ip));
  });

  await t.test("sensitive path bursts trigger one alert and 15-minute automatic ban; admins are exempt", async () => {
    clear(); const ip = "203.0.113.30";
    const probes = ["/.env", "/.git/config", "/wp-login.php"];
    for (let i = 0; i < 9; i++) assert.equal((await proxy(req(ip, probes[i % 3]))).status, 404);
    assert.equal(activeIpRule(ip), undefined);
    assert.equal((await proxy(req(ip, probes[0]))).status, 404);
    const rule = activeIpRule(ip)!; assert.equal(rule.source, "auto");
    assert.ok(Date.parse(rule.expires_at!) - Date.now() <= 900000 && Date.parse(rule.expires_at!) - Date.now() > 890000);
    assert.equal((await proxy(req(ip, "/"))).status, 403);
    assert.equal(all("SELECT id FROM security_events WHERE kind = 'scan_detected' AND ip = ?", ip).length, 1);
    const token = await encryptSession({ uid: admin.id, role: "admin" });
    for (let i = 0; i < 35; i++) await proxy(req(ownIp, probes[i % 3], token));
    assert.equal(activeIpRule(ownIp), undefined);
    assert.equal(get("SELECT 1 FROM security_detection_windows WHERE ip = ?", ownIp), undefined);
  });

  await t.test("single-path probing, detection windows, monitoring-only policy and auth alerts follow thresholds", () => {
    clear(); const ip = "203.0.113.31";
    for (let i = 0; i < 29; i++) recordSecurityEvent("probe", { ip, path: "/.env" });
    assert.equal(activeIpRule(ip), undefined);
    recordSecurityEvent("probe", { ip, path: "/.env" }); assert.equal(activeIpRule(ip)?.source, "auto");
    removeIpRule(ip); setAutoBanEnabled(false);
    for (let i = 0; i < 31; i++) recordSecurityEvent("probe", { ip, path: "/.env" });
    assert.equal(activeIpRule(ip), undefined);
    assert.equal(get<{ n: number }>("SELECT SUM(count) AS n FROM security_events WHERE kind = 'scan_detected' AND ip = ?", ip)?.n, 2);
    run("UPDATE security_detection_windows SET started_at = ? WHERE ip = ?", Date.now() - 301000, ip);
    recordSecurityEvent("probe", { ip, path: "/.env" });
    assert.equal(get<{ count: number }>("SELECT count FROM security_detection_windows WHERE ip = ?", ip)?.count, 1);
    for (let i = 0; i < 25; i++) recordSecurityEvent("login_failure", { ip, path: "/api/auth/google/callback?code=never-store" });
    assert.equal(activeIpRule(ip), undefined);
    assert.equal(get<{ n: number }>("SELECT SUM(count) AS n FROM security_events WHERE kind = 'auth_attack_detected' AND ip = ?", ip)?.n, 1);
    assert.equal(JSON.stringify(all("SELECT * FROM security_events")).includes("never-store"), false);
  });

  await t.test("nginx 404/429 monitoring is incremental and rotation-safe; old records do not cause bans", () => {
    clear(); const file = path.join(dir, "nginx.log"), ip = "203.0.113.41";
    process.env.SECURITY_NGINX_LOG = file;
    const line = (n: number, status = 404, at = new Date().toISOString()) => JSON.stringify({ ip, at, path: `/unknown/${n}?code=never-store`, method: "GET", status }) + "\n";
    fs.writeFileSync(file, line(0)); assert.equal(pollSecurityEdgeLog(), 0);
    fs.appendFileSync(file, Array.from({ length: 20 }, (_, i) => line(i + 1)).join(""));
    assert.equal(pollSecurityEdgeLog(), 20); assert.equal(pollSecurityEdgeLog(), 0);
    assert.ok(get("SELECT 1 FROM security_events WHERE kind = 'scan_detected' AND ip = ?", ip));
    assert.equal(activeIpRule(ip), undefined);
    fs.appendFileSync(file, line(99).slice(0, -1)); assert.equal(pollSecurityEdgeLog(), 0);
    fs.appendFileSync(file, "\n"); assert.equal(pollSecurityEdgeLog(), 1);
    fs.renameSync(file, file + ".1"); fs.writeFileSync(file, line(100)); assert.equal(pollSecurityEdgeLog(), 1);
    fs.writeFileSync(file, line(1)); assert.equal(pollSecurityEdgeLog(), 1);
    fs.appendFileSync(file, Array.from({ length: 60 }, (_, i) => line(i, 429)).join("")); pollSecurityEdgeLog();
    assert.ok(get("SELECT 1 FROM security_events WHERE kind = 'traffic_detected' AND ip = ?", ip));
    assert.equal(activeIpRule(ip), undefined);
    fs.appendFileSync(file, line(1, 404, new Date(Date.now() - 600000).toISOString())); assert.equal(pollSecurityEdgeLog(), 0);
    assert.equal(JSON.stringify(all("SELECT * FROM security_detection_windows")).includes("never-store"), false);
  });

  await t.test("rules and detection survive another process; bounded stores never evict operator rules", () => {
    clear(); const ip = "203.0.113.50";
    saveIpRule({ ip, mode: "deny", source: "manual", reason: "Persisted rule", actorId: admin.id, minutes: 60 });
    recordSecurityEvent("probe", { ip: "203.0.113.51", path: "/.env" });
    const child = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", `const {activeIpRule}=require('./src/lib/ipRules.ts');const {get}=require('./src/lib/db.ts');if(!activeIpRule('${ip}')||get(\"SELECT count FROM security_detection_windows WHERE ip = '203.0.113.51'\").count!==1)process.exit(1)`], { cwd: process.cwd(), env: process.env, encoding: "utf8" });
    assert.equal(child.status, 0, child.stderr);
    tx(() => {
      for (let i = 1; i < MAX_IP_RULES; i++) saveIpRule({ ip: `198.18.${Math.floor(i / 256)}.${i % 256}`, mode: "allow", source: "manual", actorId: admin.id, reason: "Capacity test", minutes: 60 });
    });
    assert.throws(() => saveIpRule({ ip: "203.0.113.52", mode: "deny", source: "auto", actorId: "system", reason: "Scan", minutes: 15 }), /RULE_LIMIT/);
    for (let i = 0; i < 10; i++) observeSecuritySignal("probe", { ip: "203.0.113.52", path: ["/.env", "/.git/config", "/wp-login.php"][i % 3] });
    assert.ok(get("SELECT 1 FROM security_events WHERE kind = 'scan_detected' AND ip = '203.0.113.52'"));
    assert.equal(activeIpRule(ip)?.source, "manual");
    tx(() => {
      run(`WITH RECURSIVE nums(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM nums WHERE x<5005)
        INSERT INTO security_detection_windows (ip, family, started_at, last_at, count, paths)
        SELECT 'cap-' || x, 'probe', 1, 1, 1, '[]' FROM nums`);
    });
    assert.equal(get<{ n: number }>("SELECT COUNT(*) AS n FROM security_detection_windows")?.n, 5000);
  });
});
