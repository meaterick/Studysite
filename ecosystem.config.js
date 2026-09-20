// PM2 process definition for the Aegis AI 스터디 site.
//
// The OCI box only has 1GB RAM, so it never runs `npm install`/`next build`
// itself — the GitHub Actions workflow builds a "standalone" Next.js bundle
// (next.config.ts: output: "standalone") on a GitHub-hosted runner and ships
// it here as `.next/standalone/`. This file just tells PM2 to run that
// bundle's `server.js` directly with `node`.
//
// Secrets (OPERATOR_PASSCODE, PORT, ...) live in `.env.production.local` at
// the repo root — NOT inside .next/standalone, which gets wiped and
// replaced on every deploy. We read that file ourselves and pass the values
// to PM2 as real process env vars, because the standalone server does not
// reliably auto-load .env files the way `next start` does.
//
// Usage on the server: pm2 start ecosystem.config.js --env production
//                       pm2 startOrReload ecosystem.config.js --env production
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
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        ...runtimeEnv,
      },
    },
  ],
};
