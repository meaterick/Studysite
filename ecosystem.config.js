// PM2 process definition for the Aegis AI 스터디 site — two processes, no nginx:
//
//   aegis-ai-study    the Next.js app itself, loopback-only on PORT (3000)
//   aegis-tls-proxy   proxy/tls-proxy.js — a small dependency-free Node
//                     script that terminates TLS on :443, redirects :80,
//                     serves ACME challenges for certbot, and forwards
//                     everything else to aegis-ai-study. See that file and
//                     .github/workflows/deploy.yml for how the cert itself
//                     is obtained/renewed (certbot, orchestrated by CI).
//
// The OCI box only has 1GB RAM, so it never runs `npm install`/`next build`
// itself — the GitHub Actions workflow builds a "standalone" Next.js bundle
// (next.config.ts: output: "standalone") on a GitHub-hosted runner and ships
// it here as `.next/standalone/`. This file just tells PM2 to run that
// bundle's `server.js` directly with `node`.
//
// Secrets (OPERATOR_PASSCODE, DOMAIN, ...) live in `.env.production.local`
// at the repo root — NOT inside .next/standalone, which gets wiped and
// replaced on every deploy. We read that file ourselves and pass the values
// to PM2 as real process env vars, because the standalone server does not
// reliably auto-load .env files the way `next start` does.
//
// Usage on the server: pm2 start ecosystem.config.js
//                       pm2 startOrReload ecosystem.config.js
const fs = require("fs");
const path = require("path");

function loadEnvFile(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const rawLine of fs.readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const runtimeEnv = loadEnvFile(path.join(__dirname, ".env.production.local"));
const PORT = runtimeEnv.PORT || "3000";
const DOMAIN = runtimeEnv.DOMAIN || "meaterickedu.kro.kr";

module.exports = {
  apps: [
    {
      name: "aegis-ai-study",
      cwd: path.join(__dirname, ".next/standalone"),
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      // Conservative ceiling — the whole box only has 1GB.
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT,
        // Loopback only — the public internet reaches this exclusively
        // through aegis-tls-proxy on :443, never directly.
        HOSTNAME: "127.0.0.1",
        ...runtimeEnv,
      },
    },
    {
      name: "aegis-tls-proxy",
      cwd: __dirname,
      script: "proxy/tls-proxy.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "100M",
      env: {
        NODE_ENV: "production",
        DOMAIN,
        UPSTREAM_PORT: PORT,
        WEBROOT_DIR: path.join(__dirname, "certs", "webroot"),
      },
    },
  ],
};
