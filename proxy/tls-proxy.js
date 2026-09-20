"use strict";

// Minimal, dependency-free TLS-terminating reverse proxy — replaces nginx.
//
// Port 80:  serves ACME HTTP-01 challenge files certbot drops into
//           certs/webroot/ (for issuing/renewing the Let's Encrypt cert),
//           and redirects everything else to https://.
// Port 443: terminates TLS using the cert certbot manages at
//           /etc/letsencrypt/live/<DOMAIN>/, then proxies every request to
//           the Next.js app (PM2's "aegis-ai-study", plain HTTP on
//           127.0.0.1:<UPSTREAM_PORT>).
//
// If no certificate exists yet (very first deploy, before certbot has run),
// only port 80 comes up — 443 starts on the next PM2 restart once
// deploy.yml has obtained the certificate. This file is intentionally
// dependency-free (only Node core modules) so it needs no node_modules on
// the server at all.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const DOMAIN = process.env.DOMAIN || "meaterickedu.kro.kr";
const UPSTREAM_PORT = process.env.UPSTREAM_PORT || "3000";
const WEBROOT_DIR = process.env.WEBROOT_DIR || path.join(__dirname, "..", "certs", "webroot");
const CERT_DIR = process.env.CERT_DIR || `/etc/letsencrypt/live/${DOMAIN}`;
const CERT_PATH = path.join(CERT_DIR, "fullchain.pem");
const KEY_PATH = path.join(CERT_DIR, "privkey.pem");
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // re-check cert file every hour

function proxyToApp(req, res) {
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: UPSTREAM_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        "x-forwarded-proto": "https",
        "x-forwarded-host": req.headers.host || DOMAIN,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", (err) => {
    console.error("[proxy] upstream error:", err.message);
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Bad gateway — the app process may be restarting.");
  });
  req.pipe(proxyReq);
}

function startHttpServer() {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/.well-known/acme-challenge/")) {
      const token = req.url.split("/").pop().split("?")[0];
      const filePath = path.join(WEBROOT_DIR, ".well-known", "acme-challenge", token);
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(data);
      });
      return;
    }
    const host = (req.headers.host || DOMAIN).split(":")[0];
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  });
  server.listen(80, () => console.log(`[proxy] HTTP listening on :80 (ACME challenges + https redirect)`));
  server.on("error", (err) => console.error("[proxy] port 80 failed to bind:", err.message));
}

function hasCertificate() {
  return fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);
}

function loadTlsOptions() {
  return { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) };
}

function startHttpsServer() {
  if (!hasCertificate()) {
    console.warn(
      `[proxy] no certificate at ${CERT_DIR} yet — serving HTTP only until the deploy workflow runs certbot.`
    );
    return;
  }

  const server = https.createServer(loadTlsOptions(), proxyToApp);
  server.listen(443, () => console.log(`[proxy] HTTPS listening on :443 for ${DOMAIN} -> 127.0.0.1:${UPSTREAM_PORT}`));
  server.on("error", (err) => console.error("[proxy] port 443 failed to bind:", err.message));

  // Belt-and-suspenders: if certbot's renewal deploy-hook (pm2 restart)
  // somehow doesn't fire, pick up a renewed cert without a restart.
  let lastMtime = fs.statSync(KEY_PATH).mtimeMs;
  setInterval(() => {
    try {
      const mtime = fs.statSync(KEY_PATH).mtimeMs;
      if (mtime !== lastMtime) {
        lastMtime = mtime;
        server.setSecureContext(loadTlsOptions());
        console.log("[proxy] certificate file changed on disk — reloaded TLS context.");
      }
    } catch (err) {
      console.error("[proxy] certificate reload check failed:", err.message);
    }
  }, CHECK_INTERVAL_MS);
}

fs.mkdirSync(path.join(WEBROOT_DIR, ".well-known", "acme-challenge"), { recursive: true });
startHttpServer();
startHttpsServer();
