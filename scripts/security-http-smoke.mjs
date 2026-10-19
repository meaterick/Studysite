// End-to-end checks against an isolated production server and database. No production requests or accounts.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-defense-http-"));
const edgeFile = path.join(dir, "edge.log");
fs.writeFileSync(edgeFile, "");
fs.writeFileSync(path.join(dir, "host-security.json"), JSON.stringify({ version: 1, checkedAt: new Date().toISOString(),
  os: { NAME: "Ubuntu", VERSION_ID: "24.04" }, kernel: "6.8-test", packages: { "openssh-server": "installed test-version" },
  listeners: [{ protocol: "tcp", port: 53, scope: "all", process: "named" }, { protocol: "tcp", port: 3001, scope: "loopback", process: "node" }],
  tcpChecked: true, udpChecked: true, sshChecked: true, ssh: { passwordauthentication: "no" }, runnerIsRoot: false, runnerPasswordlessSudoAll: true }));
const telemetryFile = path.join(dir, "telemetry.json");
const sshBucket = Math.floor(Date.now() / 300_000) * 300_000;
fs.writeFileSync(telemetryFile, JSON.stringify({ version: 1, checkedAt: new Date().toISOString(), sshChecked: true, sshTruncated: false,
  sshEvents: Array.from({ length: 10 }, (_, i) => ({ id: i.toString(16).padStart(32, "0"), at: new Date(sshBucket + i).toISOString(), ip: "203.0.113.88", outcome: "failed", method: "password", root: false })),
  firewalls: [{ family: "ipv4", checked: true, policy: "ACCEPT", publicTcpPorts: [22, 80, 443, 3000], truncated: false,
    blockedIps: [{ ip: "89.176.0.185", position: 9, coverage: "unreachable", earlierAllowedPorts: [22, 80, 443] }] }] }));
const env = { ...process.env, SECURITY_HOST_TELEMETRY: telemetryFile, GOOGLE_CLIENT_ID: "offline-test-client", GOOGLE_CLIENT_SECRET: "offline-test-client-secret", NODE_ENV: "production", DATA_DIR: dir, TRUST_PROXY: "1", SESSION_SECRET: "http-smoke-test-secret-with-more-than-32-characters", PUBLIC_ORIGIN: "https://study.example", ADMIN_EMAILS: "owner@example.com", SECURITY_NGINX_LOG: edgeFile, SECURITY_IP_ENFORCEMENT: "1" };
const seeded = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", `
(async()=>{
 const {findOrCreateGoogleUser}=require('./src/lib/userStore.ts');const {encryptSession}=require('./src/lib/session.ts');
 const admin=await findOrCreateGoogleUser({email:'owner@example.com',subject:'smoke-owner',name:'Owner'});
 const member=await findOrCreateGoogleUser({email:'member@example.com',subject:'smoke-member',name:'Member'});
 const {createGoogleOAuthState,verifyGoogleOAuthState}=require('./src/lib/googleOAuth.ts');
 const {claimOAuthNonce}=require('./src/lib/securityRequestGuard.ts');
 const replay=await createGoogleOAuthState('/account'); const verified=await verifyGoogleOAuthState(replay); claimOAuthNonce(verified.nonce);
 console.log(JSON.stringify({replay,admin:await encryptSession({uid:admin.id,role:admin.role}),member:await encryptSession({uid:member.id,role:member.role})}));
})();`], { env, encoding: "utf8" });
assert.equal(seeded.status, 0, seeded.stderr);
const cookies = JSON.parse(seeded.stdout.trim());
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const child = spawn(process.execPath, [".next/standalone/server.js"], { env: { ...env, HOSTNAME: "127.0.0.1", PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
child.stdout.on("data", (d) => { output = (output + d).slice(-8000); });
child.stderr.on("data", (d) => { output = (output + d).slice(-8000); });
const base = `http://127.0.0.1:${port}`;
const ownerIp = "203.0.113.200";
const request = (pathname, { cookie, ip = ownerIp, ...init } = {}) => fetch(base + pathname, {
  redirect: "manual", ...init, headers: { "x-real-ip": ip, ...(cookie ? { cookie: `aegis_session=${cookie}` } : {}), ...init.headers },
});
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
function hiddenActionForm(html, policy = false, caseForm = false) {
  for (const match of html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)) {
    const body = match[1];
    if (caseForm ? !body.includes('name="operation" value="case"') : policy ? !body.includes('name="operation" value="policy"') : !body.includes('name="reason"')) continue;
    const data = new FormData();
    for (const input of body.matchAll(/<input\b([^>]+)>/g)) {
      const a = Object.fromEntries([...input[1].matchAll(/([\w:$-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
      if (a.type === "hidden" && a.name) data.append(a.name, a.value ?? "");
    }
    assert.ok([...data.keys()].some((k) => k.startsWith("$ACTION_")), "server-rendered action metadata");
    return data;
  }
  throw new Error("Management form not rendered");
}
async function manage(values, cookie = cookies.admin) {
  const html = await (await request("/operator/security?view=blocked", { cookie: cookies.admin })).text();
  const data = hiddenActionForm(html, values.operation === "policy");
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return request("/operator/security?view=blocked", { cookie, method: "POST", headers: { origin: env.PUBLIC_ORIGIN, "x-forwarded-host": "study.example" }, body: data });
}

try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch {}
    if (child.exitCode !== null) throw new Error("Server stopped before readiness");
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(ready, true);
  const initial = await request("/operator/security", { cookie: cookies.admin });
  assert.equal(initial.status, 200);
  const html = await initial.text();
  const csp = initial.headers.get("content-security-policy") || "";
  const scriptsPolicy = csp.split(";").find((p) => p.trim().startsWith("script-src")) || "";
  assert.equal(scriptsPolicy.includes("unsafe-inline"), false, "inline scripts require a nonce");
  const nonce = scriptsPolicy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce);
  for (const script of html.matchAll(/<script\b([^>]*)>/g)) assert.ok(script[1].includes(`nonce="${nonce}"`), "framework and theme scripts carry the request nonce");
  const fresh = await request("/operator/security", { cookie: cookies.admin, headers: { "x-nonce": "attacker", "content-security-policy": "script-src 'unsafe-inline'" } });
  assert.notEqual(fresh.headers.get("content-security-policy"), csp, "unique nonce per request");
  assert.equal(fresh.headers.get("content-security-policy").includes("nonce-attacker"), false);
  assert.ok(html.includes("현재 차단된 IP"));
  for (const view of ["blocked", "events", "edge", "host", "alerts", "ssh"]) {
    const response = await request(`/operator/security?view=${view}`, { cookie: cookies.admin });
    assert.equal(response.status, 200, view);
    const body = await response.text();
    if (view === "host") { assert.ok(body.includes("서버 전체 권한으로 확대 가능")); assert.ok(body.includes("named")); assert.ok(body.includes("도달하지 못함")); }
    if (view === "ssh") assert.ok(body.includes("203.0.113.88"));
    assert.equal((await request(`/operator/security?view=${view}`, { cookie: cookies.member })).status, 307, `member cannot access ${view}`);
  }
  const blockedHtml = await (await request("/operator/security?view=blocked", { cookie: cookies.admin })).text();
  assert.ok(blockedHtml.includes("자동 차단 사용") || blockedHtml.includes("새 자동 차단 중지"));
  assert.ok(blockedHtml.replace(/<!--[\s\S]*?-->/g, "").includes("현재 IP " + ownerIp));
  assert.equal((await request("/operator/security")).status, 307);
  assert.equal((await request("/operator/security", { cookie: cookies.member })).status, 307);

  const target = "203.0.113.81";
  const values = { operation: "deny", ip: target, minutes: "60", reason: "HTTP smoke manual ban" };
  const saved = await manage(values);
  assert.equal(saved.status, 200);
  assert.ok((await saved.text()).includes("HTTP smoke manual ban"));
  assert.equal((await request("/", { ip: target })).status, 403);
  assert.equal((await request("/_next/static/fixture.js", { ip: target })).status, 403);
  assert.equal((await request("/operator/security", { ip: target, cookie: cookies.admin })).status, 200);
  const rulePage = await (await request(`/operator/security?view=blocked&ip=${target}`, { cookie: cookies.admin })).text();
  assert.ok(rulePage.includes("차단 해제"));
  assert.ok(rulePage.includes("거절한 요청 · 24시간"));
  assert.ok(rulePage.includes("HTTP smoke manual ban"));
  await manage({ ...values, operation: "allow", reason: "HTTP smoke allow" });
  assert.equal((await request("/", { ip: target })).status, 200);
  await manage({ ...values, operation: "deny", ip: ownerIp });
  assert.equal((await request("/", { ip: ownerIp })).status, 200, "own IP cannot be banned");
  await manage({ ...values, ip: "203.0.113.82" }, cookies.member);
  assert.equal((await request("/", { ip: "203.0.113.82" })).status, 200, "member action replay cannot ban");
  await manage({ operation: "policy", enabled: "0" });
  const probes = ["/.env", "/.git/config", "/wp-login.php"];
  for (let i = 0; i < 12; i++) await request(probes[i % 3], { ip: "203.0.113.83" });
  assert.equal((await request("/", { ip: "203.0.113.83" })).status, 200, "monitor-only policy");
  await manage({ operation: "policy", enabled: "1" });
  const scanner = "203.0.113.84";
  for (let i = 0; i < 10; i++) assert.equal((await request(probes[i % 3], { ip: scanner })).status, 404);
  assert.equal((await request("/", { ip: scanner })).status, 403);
  const alertUrl = `/operator/security?view=alerts&ip=${scanner}`;
  const caseHtml = await (await request(alertUrl, { cookie: cookies.admin })).text();
  assert.ok(caseHtml.includes("탐지·대응"));
  const review = hiddenActionForm(caseHtml, false, true);
  review.set("status", "resolved"); review.set("note", "HTTP smoke case review");
  const reviewed = await request(alertUrl, { cookie: cookies.admin, method: "POST", headers: { origin: env.PUBLIC_ORIGIN, "x-forwarded-host": "study.example" }, body: review });
  assert.equal(reviewed.status, 200);
  const reviewedHtml = await (await request(`/operator/security?view=alerts&status=resolved&ip=${scanner}`, { cookie: cookies.admin })).text();
  assert.ok(reviewedHtml.includes("HTTP smoke case review"));
  const forged = hiddenActionForm(reviewedHtml, false, true);
  forged.set("status", "dismissed"); forged.set("note", "member-forged-review");
  await request(alertUrl, { cookie: cookies.member, method: "POST", headers: { origin: env.PUBLIC_ORIGIN, "x-forwarded-host": "study.example" }, body: forged });
  const unchanged = await (await request(`/operator/security?view=alerts&status=resolved&ip=${scanner}`, { cookie: cookies.admin })).text();
  assert.equal(unchanged.includes("member-forged-review"), false);
  assert.ok(unchanged.includes("HTTP smoke case review"));
  await manage({ operation: "remove", ip: scanner });
  assert.equal((await request("/", { ip: scanner })).status, 200);

  const historyHtml = await (await request(`/operator/security?view=blocked&ip=${scanner}`, { cookie: cookies.admin })).text();
  assert.ok(historyHtml.includes("차단·허용 변경 이력"));
  assert.ok(historyHtml.includes("해제"));
  const changesHtml = await (await request("/operator/security?view=events&group=changes", { cookie: cookies.admin })).text();
  assert.ok(changesHtml.includes("HTTP smoke manual ban"));
  const alertsHtml = await (await request("/operator/security?view=events&group=detections", { cookie: cookies.admin })).text();
  assert.equal(alertsHtml.includes("HTTP smoke manual ban"), false, "detection view excludes management changes");

  fs.appendFileSync(edgeFile, Array.from({ length: 20 }, (_, i) => JSON.stringify({ at: new Date().toISOString(), ip: "203.0.113.85", method: "GET", path: `/unknown/${i}?code=not-stored`, status: 404 }) + "\n").join(""));
  let detected = false;
  for (let i = 0; i < 15; i++) {
    const page = await (await request("/operator/security?kind=scan_detected&ip=203.0.113.85", { cookie: cookies.admin })).text();
    assert.equal(page.includes("not-stored"), false);
    if (page.includes("서로 다른 주소의 404 응답 20회")) { detected = true; break; }
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.equal(detected, true, "background nginx collector emits scan alert");
  assert.equal((await request("/", { ip: "203.0.113.85" })).status, 200, "ordinary 404 alerts never auto-ban");
  for (const target of ["/%252eenv", "/.ssh/id_rsa", "/database.sqlite3"]) assert.equal((await request(target, { ip: "203.0.113.90" })).status, 404);
  assert.equal((await request("/", { ip: "203.0.113.90", method: "DELETE" })).status, 405);
  for (let i = 0; i < 30; i++) assert.equal((await request("/api/auth/google", { ip: "203.0.113.91" })).status, 307);
  const limitedAuth = await request("/api/auth/google", { ip: "203.0.113.91" });
  assert.equal(limitedAuth.status, 429); assert.ok(Number(limitedAuth.headers.get("retry-after")) > 0);
  const replayed = await request(`/api/auth/google/callback?state=${encodeURIComponent(cookies.replay)}&code=never-exchanged`, { ip: "203.0.113.92", headers: { cookie: `aegis_google_oauth_state=${cookies.replay}` } });
  assert.equal(replayed.status, 307);
  const replayLogs = await (await request("/operator/security?view=events&kind=oauth_replayed&ip=203.0.113.92", { cookie: cookies.admin })).text();
  assert.ok(replayLogs.includes("로그인 응답 재사용 거절")); assert.equal(replayLogs.includes("never-exchanged"), false);
  console.log("Production HTTP smoke passed: monitoring views and source health, case review and member replay denial, auth quota, OAuth replay rejection, encoded probe/method rejection; native admin forms, member replay rejection, self protection, manual/allow rules and policy toggle, automatic ban/release, asset denial, admin recovery, background nginx detection.");
} catch (err) {
  console.error(output);
  throw err;
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.exitCode !== null ? resolve() : child.once("exit", resolve));
}
