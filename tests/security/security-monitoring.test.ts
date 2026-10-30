import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("security monitoring and request protection", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-monitoring-"));
  Object.assign(process.env, { DATA_DIR: dir, SESSION_SECRET: "monitoring-test-secret-with-more-than-32-characters", PUBLIC_ORIGIN: "https://study.example", NODE_ENV: "production", TRUST_PROXY: "1", ADMIN_EMAILS: "owner@example.com" });
  const { get, all, run } = await import("../../src/lib/db");
  const { inspectRequestPath } = await import("../../src/lib/securityPolicy");
  const { consumeAuthRequest, claimOAuthNonce } = await import("../../src/lib/securityRequestGuard");
  const { querySecurityCases, raiseSecurityCase } = await import("../../src/lib/securityCases");
  const { applySecurityChange } = await import("../../src/lib/securityManagement");
  const { hostTelemetry, pollHostTelemetry } = await import("../../src/lib/hostTelemetry");
  const { findOrCreateGoogleUser } = await import("../../src/lib/userStore");
  const { proxy } = await import("../../src/proxy");
  const { NextRequest } = await import("next/server");
  const owner = await findOrCreateGoogleUser({ email: "owner@example.com", name: "Owner", subject: "owner" });
  const member = await findOrCreateGoogleUser({ email: "member@example.com", name: "Member", subject: "member" });
  const form = (values: Record<string, string>) => { const f = new FormData(); Object.entries(values).forEach(([k, v]) => f.set(k, v)); return f; };

  await t.test("encoded sensitive files and traversal are rejected without treating query/student content as a path", async () => {
    for (const target of ["/%252eenv", "/%25252eenv", "/safe/%252e%252e%252fsecret", "/.ssh/id_rsa", "/database.sqlite3", "/.aws/credentials", "/cgi-bin/sh", "/safe/%00file", "/safe/..%5csecret"]) assert.ok(inspectRequestPath(target), target);
    for (const target of ["/weeks/week1", "/api/submissions/a/notebooks/1", "/images/week1/pic.png", "/search?q=../../.env", "/.well-known/acme-challenge/abc"]) assert.equal(inspectRequestPath(target), null, target);
    const response = await proxy(new NextRequest("https://study.example/%252eenv?code=not-stored", { headers: { "x-real-ip": "203.0.113.10" } }));
    assert.equal(response.status, 404);
    assert.equal(JSON.stringify(all("SELECT path, detail FROM security_events")).includes("not-stored"), false);
    const denied = await proxy(new NextRequest("https://study.example/", { method: "DELETE", headers: { "x-real-ip": "203.0.113.10" } }));
    assert.equal(denied.status, 405);
  });

  await t.test("login quotas persist in SQLite, expire and isolate routes/IPs; nonce claims are one-use", () => {
    for (let i = 0; i < 30; i++) assert.equal(consumeAuthRequest("203.0.113.11", "start").allowed, true);
    assert.equal(consumeAuthRequest("203.0.113.11", "start").allowed, false);
    assert.ok(consumeAuthRequest("203.0.113.11", "start").retryAfter > 0);
    assert.equal(consumeAuthRequest("203.0.113.11", "callback").allowed, true);
    assert.equal(consumeAuthRequest("203.0.113.12", "start").allowed, true);
    run("UPDATE security_request_limits SET expires_at = 0");
    assert.equal(consumeAuthRequest("203.0.113.11", "start").allowed, true);
    const nonce = "a".repeat(43);
    assert.equal(claimOAuthNonce(nonce), true);
    assert.equal(claimOAuthNonce(nonce), false);
    assert.equal(JSON.stringify(all("SELECT * FROM security_oauth_used")).includes(nonce), false);
    run("UPDATE security_oauth_used SET expires_at = 0");
    assert.equal(claimOAuthNonce(nonce), true);
  });

  await t.test("case changes require DB admin and a resolution note; later windows reopen with an audit trail", () => {
    const input = { family: "csrf", ip: "203.0.113.15", source: "app", severity: "warning" as const, title: "Test alert", evidence: "safe evidence", count: 10, window: Date.now() - 600_000 };
    raiseSecurityCase(input);
    const incident = querySecurityCases("open", input.ip).cases[0];
    const data = { operation: "case", caseId: incident.id, status: "resolved", note: "Reviewed test evidence" };
    assert.throws(() => applySecurityChange(member.id, "203.0.113.200", form(data)), /FORBIDDEN/);
    assert.equal(applySecurityChange(owner.id, "203.0.113.200", form({ ...data, note: "" })).ok, false);
    assert.equal(applySecurityChange(owner.id, "203.0.113.200", form(data)).ok, true);
    raiseSecurityCase({ ...input, count: 20 });
    assert.equal(querySecurityCases("resolved", input.ip).total, 1, "same window does not reopen");
    raiseSecurityCase({ ...input, window: Date.now() });
    const reopened = querySecurityCases("open", input.ip).cases[0];
    assert.equal(reopened.reopened, 1);
    assert.equal(reopened.windows, 2);
    assert.equal(get<{ n: number }>("SELECT COUNT(*) AS n FROM security_case_history WHERE case_id = ?", incident.id)?.n, 1);
  });

  await t.test("host snapshots are validated, deduplicated across polls, and create SSH alerts without web bans", () => {
    const file = path.join(dir, "telemetry.json");
    process.env.SECURITY_HOST_TELEMETRY = file;
    assert.equal(hostTelemetry().state, "unavailable");
    const bucket = Math.floor(Date.now() / 300_000) * 300_000;
    const events = Array.from({ length: 10 }, (_, i) => ({ id: i.toString(16).padStart(32, "0"), at: new Date(bucket + i).toISOString(), ip: "203.0.113.20", outcome: "failed", method: "password", root: false }));
    events.push({ id: "f".repeat(32), at: new Date().toISOString(), ip: "203.0.113.21", outcome: "accepted", method: "publickey", root: true });
    const snapshot = { version: 1, checkedAt: new Date().toISOString(), sshChecked: true, sshTruncated: false, sshEvents: events, firewalls: [] };
    fs.writeFileSync(file, JSON.stringify(snapshot));
    assert.equal(hostTelemetry().state, "ready");
    assert.equal(pollHostTelemetry(), 11);
    assert.equal(pollHostTelemetry(), 0);
    fs.writeFileSync(file, JSON.stringify({ ...snapshot, checkedAt: new Date(Date.now() + 1000).toISOString() }));
    assert.equal(pollHostTelemetry(), 0, "new generation with duplicate events");
    assert.equal(querySecurityCases("open", "203.0.113.20").cases[0]?.family, "ssh_auth");
    assert.equal(querySecurityCases("open", "203.0.113.21").cases[0]?.family, "ssh_root");
    assert.equal(get("SELECT * FROM security_ip_rules WHERE ip = '203.0.113.20'"), undefined);
    fs.writeFileSync(file, JSON.stringify({ ...snapshot, checkedAt: "2020-01-01T00:00:00Z" }));
    assert.equal(hostTelemetry().state, "stale");
    assert.equal(pollHostTelemetry(), 0);
    fs.writeFileSync(file, JSON.stringify({ ...snapshot, sshEvents: [{ ...events[0], ip: "not-an-ip" }] }));
    assert.equal(hostTelemetry().state, "unavailable");
  });
});
