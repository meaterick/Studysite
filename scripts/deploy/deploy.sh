#!/usr/bin/env bash
# 무중단(블루·그린) 배포. 사용법: DEPLOY_DIR=... DOMAIN=... deploy.sh <새 번들 폴더(.next/standalone)>
#
#  1. 새 번들을 DEPLOY_DIR/releases/<실행 id>에 복사한다(지금 돌고 있는 버전의 파일은 건드리지 않는다).
#  2. 지금 쓰지 않는 포트(3000 ↔ 3001)에 새 버전을 PM2로 띄운다.
#  3. /api/health가 응답할 때까지 기다린다. 끝내 응답하지 않으면 새 버전만 지우고 실패한다(사이트는 옛 버전으로 계속 동작).
#  4. nginx를 새 포트로 돌린다(reload는 기존 연결을 끊지 않는다).
#  5. 옛 버전이 처리 중인 요청을 마치도록 잠시 기다린 뒤 끈다. 오래된 release 폴더는 최근 3개만 남긴다.
set -euo pipefail

BUNDLE="${1:?usage: deploy.sh <standalone bundle dir>}"
: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
: "${DOMAIN:?DOMAIN is required}"
HERE="$(cd "$(dirname "$0")" && pwd)"
RELEASES="$DEPLOY_DIR/releases"
STATE_PORT="$DEPLOY_DIR/active-port"
STATE_NAME="$DEPLOY_DIR/active-name"
BASE_NAME="aegis-ai-study"

# 지금 트래픽을 받는 버전. 처음 이 방식으로 배포할 때는 예전 방식의 앱(이름 aegis-ai-study, 3000번)이다.
ACTIVE_PORT="$(cat "$STATE_PORT" 2>/dev/null || echo 3000)"
ACTIVE_NAME="$(cat "$STATE_NAME" 2>/dev/null || echo "$BASE_NAME")"
if [ "$ACTIVE_PORT" = "3000" ]; then NEW_PORT=3001; else NEW_PORT=3000; fi
NEW_NAME="${BASE_NAME}-${NEW_PORT}"
RELEASE="$RELEASES/${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-$(date +%s)}"

echo "active: ${ACTIVE_NAME} @ ${ACTIVE_PORT} -> new: ${NEW_NAME} @ ${NEW_PORT}"

mkdir -p "$RELEASES" "$DEPLOY_DIR/logs"
rm -rf "$RELEASE"
cp -a "$BUNDLE" "$RELEASE"
# cp -a는 원본 시각을 그대로 두므로, 아래 "최근 3개" 정리가 배포 순서를 알 수 있게 시각을 새로 찍는다.
touch "$RELEASE"

# 이전에 실패한 배포가 남긴 같은 이름의 프로세스가 있으면 먼저 지운다(트래픽을 받지 않는 쪽이다).
if [ "$NEW_NAME" != "$ACTIVE_NAME" ]; then
  pm2 delete "$NEW_NAME" >/dev/null 2>&1 || true
fi
APP_NAME="$NEW_NAME" APP_PORT="$NEW_PORT" APP_DIR="$RELEASE" pm2 start "$DEPLOY_DIR/ecosystem.config.js"

echo "waiting for ${NEW_NAME} to become healthy..."
healthy=0
for _ in $(seq 1 60); do
  if curl -fsS -m 3 "http://127.0.0.1:${NEW_PORT}/api/health" >/dev/null 2>&1; then healthy=1; break; fi
  sleep 1
done
if [ "$healthy" != 1 ]; then
  echo "::error::새 버전이 60초 안에 응답하지 않아 배포를 취소합니다. 사이트는 이전 버전(${ACTIVE_NAME})으로 계속 동작합니다."
  pm2 logs "$NEW_NAME" --lines 40 --nostream || true
  pm2 delete "$NEW_NAME" || true
  rm -rf "$RELEASE"
  exit 1
fi

# nginx를 새 포트로 돌린다. 실패하면 새 버전만 지우고 끝낸다(nginx는 이전 설정 그대로).
if ! DOMAIN="$DOMAIN" bash "$HERE/nginx-site.sh" "$NEW_PORT"; then
  pm2 delete "$NEW_NAME" || true
  rm -rf "$RELEASE"
  exit 1
fi
echo "$NEW_PORT" > "$STATE_PORT"
echo "$NEW_NAME" > "$STATE_NAME"

# 옛 버전이 받던 요청(채팅 스트림 포함)을 정리할 시간을 준다. 채팅 창은 끊기면 자동으로 새 버전에 다시 붙는다.
sleep 10
if [ "$ACTIVE_NAME" != "$NEW_NAME" ]; then
  pm2 delete "$ACTIVE_NAME" >/dev/null 2>&1 || true
fi
pm2 save

# 예전 방식(DEPLOY_DIR/.next)의 번들은 그 앱을 끈 뒤에 지운다.
rm -rf "$DEPLOY_DIR/.next"
# release는 최근 3개만 남긴다(지금 쓰는 것 포함).
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +4 | while read -r old; do
  case "$old" in "$RELEASE"/) ;; *) rm -rf "$old" ;; esac
done
echo "deployed ${NEW_NAME} @ ${NEW_PORT} (${RELEASE})"
