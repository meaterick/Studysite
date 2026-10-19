import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated disk and database: never touch real users or deployment data.
test("security regression", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-security-"));
  process.env.DATA_DIR = dir;
  process.env.SESSION_SECRET = "a-secure-test-secret-with-over-32-characters";
  process.env.PUBLIC_ORIGIN = "https://study.example";
  Object.assign(process.env, { NODE_ENV: "production" });
  const { NextRequest } = await import("next/server");
  const { signingKey, configuredOrigin } = await import("../src/lib/securityConfig");
  const { encryptSession, decryptSession } = await import("../src/lib/session");
  const { SignJWT } = await import("jose");
  const { all, get, run, tx } = await import("../src/lib/db");
  const { findOrCreateGoogleUser } = await import("../src/lib/userStore");
  const { recordSecurityEvent, securityRequest, securityFilters, querySecurityEvents, pruneSecurityEvents } = await import("../src/lib/securityEvents");
  const { isProbePath, logPath } = await import("../src/lib/securityPolicy");
  const { recentEdgeEvents } = await import("../src/lib/securityEdgeLog");
  const { proxy } = await import("../src/proxy");
  const request = (url: string, cookie?: string, init: { method?: string; headers?: Record<string, string> } = {}) => new NextRequest(`https://study.example${url}`, {
    ...init, headers: { ...(cookie ? { cookie: `aegis_session=${cookie}` } : {}), ...init.headers },
  });

  await t.test("production rejects missing/default/short signing keys and unpinned origins", async () => {
    for (const secret of ["", "short", "aegis-dev-session-secret-change-me", "change-me-before-deploying-1234567890"]) {
      process.env.SESSION_SECRET = secret;
      assert.throws(signingKey);
    }
    process.env.SESSION_SECRET = "a-secure-test-secret-with-over-32-characters";
    for (const origin of ["", "https://user:pass@evil.example", "http://study.example", "https://study.example/path"]) {
      process.env.PUBLIC_ORIGIN = origin;
      assert.throws(configuredOrigin);
    }
    process.env.PUBLIC_ORIGIN = "https://study.example";
    const token = await encryptSession({ uid: "member", role: "member" });
    assert.equal((await decryptSession(token))?.uid, "member");
    assert.equal(await decryptSession(token + "tampered"), null);
    const invalid = await new SignJWT({ uid: "member", role: "root" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(signingKey());
    assert.equal(await decryptSession(invalid), null);
  });

  await t.test("fresh production database does not grant first visitor admin; allowlist does", async () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    const first = await findOrCreateGoogleUser({ email: "visitor@example.com", subject: "visitor", name: "Visitor" });
    assert.equal(first.role, "member");
    const owner = await findOrCreateGoogleUser({ email: "owner@example.com", subject: "owner", name: "Owner" });
    assert.equal(owner.role, "admin");
    assert.equal((await findOrCreateGoogleUser({ email: "changed@example.com", subject: "visitor", name: "Changed" })).id, first.id);
  });

  await t.test("only the explicitly trusted nginx IP header is used", () => {
    const req = request("/operator?token=secret", undefined, { headers: { "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.2.3.4" } });
    delete process.env.TRUST_PROXY;
    assert.equal(securityRequest(req).ip, "");
    process.env.TRUST_PROXY = "1";
    assert.equal(securityRequest(req).ip, "203.0.113.5");
    assert.equal(securityRequest(request("/", undefined, { headers: { "x-real-ip": "fake" } })).ip, "");
    assert.equal(securityRequest(req).path, "/operator");
  });

  await t.test("probes and cross-site mutations are denied, including forged forwarding headers", async () => {
    for (const probe of ["/.env", "/.env.local", "/.git/config", "/wp-login.php", "/%2eenv"]) assert.equal(isProbePath(probe), true);
    assert.equal(isProbePath("/weeks/week1"), false);
    assert.equal((await proxy(request("/.env?token=secret"))).status, 404);
    assert.equal((await proxy(request("/logout", undefined, { method: "POST", headers: { origin: "https://evil.example", "x-forwarded-host": "evil.example" } }))).status, 403);
    assert.equal((await proxy(request("/operator/security"))).status, 307);
    const member = get<{ id: string }>("SELECT id FROM users WHERE google_subject = 'visitor'")!;
    const cookie = await encryptSession({ uid: member.id, role: "member" });
    assert.equal((await proxy(request("/operator/security", cookie))).status, 307);
    assert.equal(logPath("/x?code=secret#fragment"), "/x");
  });

  await t.test("download authorization is checked against the database even for stale admin tokens", async () => {
    const member = get<{ id: string }>("SELECT id FROM users WHERE google_subject = 'visitor'")!;
    const cookie = await encryptSession({ uid: member.id, role: "admin" });
    const { GET: backup } = await import("../src/app/api/operator/backups/[name]/route");
    assert.equal((await backup(request("/api/operator/backups/missing.db", cookie), { params: Promise.resolve({ name: "missing.db" }) })).status, 404);
    const { saveSubmission } = await import("../src/lib/submissionStore");
    const sub = await saveSubmission({ userId: member.id, weekSlug: "week1", text: "", links: [], files: [{ name: "answer.txt", type: "text/plain", bytes: Buffer.from("private answer") }] });
    const owner = get<{ id: string }>("SELECT id FROM users WHERE google_subject = 'owner'")!;
    const second = await findOrCreateGoogleUser({ email: "other@example.com", subject: "other", name: "Other" });
    const otherCookie = await encryptSession({ uid: second.id, role: "member" });
    const { GET: download } = await import("../src/app/api/submissions/[id]/files/[fileId]/route");
    const params = { params: Promise.resolve({ id: sub.id, fileId: sub.versions[0].files[0].id }) };
    assert.equal((await download(request("/api/submissions/x/files/y"), params)).status, 401);
    assert.equal((await download(request("/api/submissions/x/files/y", otherCookie), params)).status, 404);
    const ownCookie = await encryptSession({ uid: member.id, role: "member" });
    const own = await download(request("/api/submissions/x/files/y", ownCookie), params);
    assert.equal(await own.text(), "private answer");
    assert.match(own.headers.get("cache-control")!, /no-store/);
    const adminCookie = await encryptSession({ uid: owner.id, role: "admin" });
    assert.equal((await download(request("/api/submissions/x/files/y", adminCookie), params)).status, 200);
    const { GET: stream } = await import("../src/app/api/chat/stream/route");
    assert.equal((await stream(request("/api/chat/stream?inbox=1", ownCookie))).status, 403);
  });

  await t.test("logs aggregate, exclude query secrets and safely filter untrusted search values", () => {
    recordSecurityEvent("probe", { ip: "203.0.113.8", path: "/.git/config?token=must-not-persist", status: 404 });
    recordSecurityEvent("probe", { ip: "203.0.113.8", path: "/.git/config?other=value", status: 404 });
    const filters = securityFilters({ ip: "203.0.113.8", kind: "probe", hours: "24" });
    const result = querySecurityEvents(filters);
    assert.equal(result.total, 1);
    assert.equal(result.events[0].count, 2);
    assert.equal(result.events[0].path, "/.git/config");
    assert.equal(JSON.stringify(all("SELECT * FROM security_events")).includes("must-not-persist"), false);
    assert.equal(querySecurityEvents(securityFilters({ ip: "' OR 1=1--" })).total, 0);
    assert.equal(securityFilters({ kind: "__proto__", page: "Infinity", hours: "NaN" }).kind, "");
    assert.equal(securityFilters({ kind: ["probe"], page: "-2" }).page, 1);
  });

  await t.test("retention, migration and storage cap work with existing schema data", () => {
    assert.equal(get<{ n: number }>("SELECT COUNT(*) AS n FROM schema_migrations")?.n, 2);
    tx(() => {
      const old = new Date(Date.now() - 31 * 86400_000).toISOString();
      run("INSERT INTO security_events (bucket, first_at, last_at, kind, severity) VALUES (?, ?, ?, 'probe', 'high')", old, old, old);
    });
    (globalThis as unknown as { __aegisSecurityPrunedAt: number }).__aegisSecurityPrunedAt = 0;
    pruneSecurityEvents();
    assert.equal(get("SELECT id FROM security_events WHERE last_at < ?", new Date(Date.now() - 30 * 86400_000).toISOString()), undefined);
    tx(() => {
      run(`WITH RECURSIVE nums(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM nums WHERE x<10005)
        INSERT INTO security_events (bucket, first_at, last_at, kind, severity, path)
        SELECT 'cap', ?, ?, 'probe', 'high', '/cap/' || x FROM nums`, new Date().toISOString(), new Date().toISOString());
    });
    assert.equal(get<{ n: number }>("SELECT COUNT(*) AS n FROM security_events")?.n, 10000);
    assert.equal(get("SELECT id FROM security_events WHERE bucket = 'cap' AND path = '/cap/1'"), undefined);
    assert.ok(get("SELECT id FROM security_events WHERE path = '/cap/10005'"));
    assert.equal(get<{ n: number }>("SELECT COUNT(*) AS n FROM users")?.n, 3);
  });

  await t.test("edge reader tolerates missing, malformed, large and rotated log files", () => {
    delete process.env.SECURITY_NGINX_LOG;
    assert.equal(recentEdgeEvents().state, "disabled");
    const file = path.join(dir, "edge.log");
    process.env.SECURITY_NGINX_LOG = file;
    assert.equal(recentEdgeEvents().state, "unavailable");
    const entry = JSON.stringify({ at: new Date().toISOString(), ip: "203.0.113.7", method: "GET", path: "/.env?token=redacted", status: 429 });
    fs.writeFileSync(file, "malformed\n" + entry + "\n{partial");
    assert.equal(recentEdgeEvents().events.length, 1);
    assert.equal(recentEdgeEvents().events[0].path, "/.env");
    fs.writeFileSync(file, (entry + "\n").repeat(5000));
    assert.equal(recentEdgeEvents().events.length, 100);
    assert.equal(recentEdgeEvents().truncated, true);
    fs.truncateSync(file, 0);
    assert.equal(recentEdgeEvents().events.length, 0);
  });
});
