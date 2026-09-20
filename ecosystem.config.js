// PM2 process definition for the Aegis AI 스터디 site.
// Usage on the server: pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: "aegis-ai-study",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p " + (process.env.PORT || 3000),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
