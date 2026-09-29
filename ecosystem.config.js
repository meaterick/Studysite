// PM2 process definition for the Aegis AI 스터디 Next.js app.
//
// nginx (installed on the box, see .github/workflows/deploy.yml) is what
// actually terminates TLS on :443 and reverse-proxies to this app on
// 127.0.0.1:PORT — there is no custom proxy process here.
//
// The OCI box only has 1GB RAM, so it never runs `npm install`/`next build`
// itself — the GitHub Actions workflow builds a "standalone" Next.js bundle
// (next.config.ts: output: "standalone") on a GitHub-hosted runner and ships
// it here as `.next/standalone/`. This file just tells PM2 to run that
// bundle's `server.js` directly with `node`.
//
// Secrets (SESSION_SECRET, ADMIN_EMAILS, DATA_DIR, ...) live in `.env.production.local` next to
// this file — NOT inside .next/standalone, which gets wiped and replaced on
// every deploy. We read that file ourselves and pass the values to PM2 as
// real process env vars, because the standalone server does not reliably
// auto-load .env files the way `next start` does.
//
// Usage on the server: pm2 start ecosystem.config.js
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

// 무중단 배포(scripts/deploy/deploy.sh)는 새 버전을 다른 포트에 띄워 확인한 뒤 nginx를 넘기고 옛 버전을
// 끈다. 그래서 앱 이름·포트·번들 위치를 이 파일을 실행할 때의 환경 변수로 받는다:
//   APP_NAME=aegis-ai-study-3001 APP_PORT=3001 APP_DIR=<release 폴더> pm2 start ecosystem.config.js
// 환경 변수 없이 실행하면 예전처럼 3000번 포트, DEPLOY_DIR/.next/standalone을 쓴다.
const APP_NAME = process.env.APP_NAME || "aegis-ai-study";
const PORT = process.env.APP_PORT || runtimeEnv.PORT || "3000";
const APP_DIR = process.env.APP_DIR || path.join(__dirname, ".next/standalone");
const LOG_DIR = path.join(__dirname, "logs");

module.exports = {
  apps: [
    {
      name: APP_NAME,
      cwd: APP_DIR,
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      // Conservative ceiling — the whole box only has 1GB.
      max_memory_restart: "400M",
      // 옛 버전을 끌 때 처리 중인 요청을 마칠 시간을 준다.
      kill_timeout: 8000,
      // 로그는 한곳(DEPLOY_DIR/logs)에 모으고, logrotate가 크기·기간 기준으로 정리한다(deploy.sh).
      out_file: path.join(LOG_DIR, "app-out.log"),
      error_file: path.join(LOG_DIR, "app-error.log"),
      time: true,
      // 프로세스 번호(-0, -1, …)를 파일 이름에 붙이지 않고 한 파일에 모은다(배포마다 번호가 바뀌므로).
      merge_logs: true,
      env: {
        ...runtimeEnv,
        NODE_ENV: "production",
        PORT,
        // Loopback only — nginx is the only thing that reaches this
        // directly; the public internet only ever reaches nginx.
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
