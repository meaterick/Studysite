#!/usr/bin/env bash
# 앱·PM2 로그가 끝없이 커져 디스크를 채우지 않도록 logrotate를 매시간 돌린다(보안 검토 P2).
# 20MB를 넘거나 하루가 지나면 잘라 압축하고, 14개까지만 남긴다. copytruncate라 앱을 재시작하지 않는다.
# 사용법: DEPLOY_DIR=... logrotate.sh   (멱등 — 매 배포마다 실행해도 된다)
set -euo pipefail
: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
USER_NAME="$(whoami)"
GROUP_NAME="$(id -gn)"
PM2_HOME_DIR="${PM2_HOME:-$HOME/.pm2}"
CONF=/etc/aegis-ai-study/logrotate.conf
STATE=/var/lib/logrotate/aegis-ai-study.status

command -v logrotate >/dev/null 2>&1 || (sudo apt-get update -y && sudo apt-get install -y logrotate)
mkdir -p "$DEPLOY_DIR/logs"

TMP="$(mktemp)"
cat > "$TMP" <<CONF
# scripts/deploy/logrotate.sh가 만든다. 직접 고치지 말 것.
${DEPLOY_DIR}/logs/*.log ${PM2_HOME_DIR}/logs/*.log ${PM2_HOME_DIR}/pm2.log {
    su ${USER_NAME} ${GROUP_NAME}
    daily
    maxsize 20M
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
CONF
sudo mkdir -p /etc/aegis-ai-study /var/lib/logrotate
sudo install -m 644 "$TMP" "$CONF"
rm -f "$TMP"

# 시스템 logrotate(하루 한 번)와 상태 파일을 나눠, systemd 타이머로 매시간 따로 돌린다.
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  SVC="$(mktemp)"; TIMER="$(mktemp)"
  cat > "$SVC" <<UNIT
[Unit]
Description=Rotate Aegis AI study app/PM2 logs

[Service]
Type=oneshot
ExecStart=/usr/sbin/logrotate -s ${STATE} ${CONF}
UNIT
  cat > "$TIMER" <<UNIT
[Unit]
Description=Hourly log rotation for Aegis AI study

[Timer]
OnCalendar=hourly
RandomizedDelaySec=5min
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  sudo install -m 644 "$SVC" /etc/systemd/system/aegis-logrotate.service
  sudo install -m 644 "$TIMER" /etc/systemd/system/aegis-logrotate.timer
  rm -f "$SVC" "$TIMER"
  sudo systemctl daemon-reload
  sudo systemctl enable --now aegis-logrotate.timer >/dev/null
  WHERE="systemd timer aegis-logrotate.timer"
else
  HOURLY="$(mktemp)"
  printf '#!/bin/sh\nexec /usr/sbin/logrotate -s %s %s\n' "$STATE" "$CONF" > "$HOURLY"
  sudo mkdir -p /etc/cron.hourly
  sudo install -m 755 "$HOURLY" /etc/cron.hourly/aegis-ai-study-logrotate
  rm -f "$HOURLY"
  WHERE="/etc/cron.hourly"
fi
# 지난 배포들이 남긴 번호 붙은 로그(app-out-3.log 등)는 정리한다(이제 한 파일로 모인다).
rm -f "$DEPLOY_DIR"/logs/app-out-[0-9]*.log "$DEPLOY_DIR"/logs/app-error-[0-9]*.log

# 설정이 올바른지 확인(실제로 자르지는 않음).
sudo /usr/sbin/logrotate -d -s "$STATE" "$CONF" >/dev/null 2>&1 || { echo "::warning::logrotate 설정 검사 실패"; sudo /usr/sbin/logrotate -d -s "$STATE" "$CONF" || true; }
echo "log rotation: ${CONF} (hourly via ${WHERE})"
