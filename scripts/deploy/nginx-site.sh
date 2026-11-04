#!/usr/bin/env bash
# nginx 사이트 설정을 통째로 만들어 적용한다. 사용법: DOMAIN=... nginx-site.sh <앱 포트>
#
# - 인증서가 이미 있으면 HTTPS(443) 서버까지 직접 써서, 배포 때마다 HTTP 전용 설정으로 덮어썼다가
#   certbot이 다시 HTTPS를 붙이기 전까지 HTTPS가 끊기던 문제를 없앤다. 인증서가 아직 없을 때(첫 배포)만
#   HTTP 설정을 쓰고, 이어지는 certbot --nginx 단계가 인증서를 받아 HTTPS를 붙인다.
# - IP별 요청 빈도·동시 연결 제한, 느린 요청(slowloris) 타임아웃, HSTS, 클라이언트가 보낸
#   X-Forwarded-Host 무시(실제 $host로 덮어쓰기)를 건다(보안 검토 P0-2, P1-5).
# - 새 설정이 nginx -t를 통과하지 못하면 이전 설정으로 되돌리고 실패한다(사이트는 계속 이전 설정으로 동작).
set -euo pipefail

PORT="${1:?usage: nginx-site.sh <app port>}"
: "${DOMAIN:?DOMAIN is required}"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || { echo "invalid app port"; exit 1; }
[[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo "invalid domain"; exit 1; }
# nginx master writes; the app's group can only read this dedicated, query-free log.
SECURITY_LOG=/var/log/aegis-security/events.log
sudo install -d -m 750 -o root -g "$(id -gn)" /var/log/aegis-security
sudo touch "$SECURITY_LOG"
sudo chown "root:$(id -gn)" "$SECURITY_LOG"
sudo chmod 640 "$SECURITY_LOG"
CONF=/etc/nginx/sites-available/aegis-ai-study.conf
LIVE="/etc/letsencrypt/live/${DOMAIN}"

# /etc/letsencrypt/live는 root만 읽을 수 있어서, 러너 사용자로 [ -f ]를 하면 인증서가 있어도 "없음"이 된다.
# (그러면 HTTP 전용 설정을 써서 HTTPS가 잠시 끊긴다.) 존재 확인은 sudo로 한다.
exists() { sudo test -f "$1"; }
HAS_CERT=0
if exists "${LIVE}/fullchain.pem" && exists "${LIVE}/privkey.pem"; then HAS_CERT=1; fi

common_server() {
  cat <<NGINX
    server_tokens off;
    access_log ${SECURITY_LOG} aegis_security buffer=32k flush=5s if=\$aegis_security_loggable;
    client_max_body_size 10m;            # 과제 첨부(합계 9MB) — next.config.ts의 bodySizeLimit과 맞춤
    client_header_timeout 15s;
    client_body_timeout 30s;
    send_timeout 30s;
    keepalive_timeout 30s;

    limit_req_status 429;
    limit_conn_status 429;
    # 공격으로 제한이 수없이 걸려도 error.log가 디스크를 채우지 않도록 기본 로그 수준(error)보다 낮춘다.
    limit_req_log_level info;
    limit_conn_log_level info;

    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$aegis_connection_upgrade;

    # 빌드 산출물·편집기 파일은 요청이 많고 가벼우므로 빈도 제한에서 뺀다(연결 수 제한만).
    location /_next/static/ {
        limit_conn aegis_conn 60;
        proxy_pass http://aegis_app;
    }
    location /vendor/ {
        limit_conn aegis_conn 60;
        proxy_pass http://aegis_app;
    }

    # 채팅 실시간 스트림(SSE): 응답을 모아 두지 않고, 오래 열려 있도록 한다. IP당 동시 연결 수를 따로 제한한다.
    location = /api/chat/stream {
        limit_conn aegis_sse 20;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 1h;
        proxy_pass http://aegis_app;
    }

    location / {
        limit_conn aegis_conn 60;
        limit_req zone=aegis_req burst=150 nodelay;
        limit_req zone=aegis_post burst=30 nodelay;
        proxy_pass http://aegis_app;
    }
NGINX
}

render() {
  cat <<NGINX
# 이 파일은 배포(scripts/deploy/nginx-site.sh)가 매번 새로 만든다. 직접 고치지 말 것.
# Do not log request_uri, args, cookies, referrers or OAuth codes.
log_format aegis_security escape=json '{"at":"\$time_iso8601","ip":"\$remote_addr","method":"\$request_method","path":"\$uri","status":\$status}';
map \$status \$aegis_security_loggable {
    ~^[45] 1;
    default 0;
}

upstream aegis_app {
    server 127.0.0.1:${PORT};
    keepalive 16;
}

map \$http_upgrade \$aegis_connection_upgrade {
    default upgrade;
    ''      '';
}

# IP별 제한. 같은 공유기(학교·카페 NAT)를 쓰는 여러 명이 한 IP로 보일 수 있어 넉넉하게 잡았다.
map \$request_method \$aegis_post_limit_key {
    POST    \$binary_remote_addr;
    default "";
}
limit_req_zone \$binary_remote_addr zone=aegis_req:10m rate=30r/s;
limit_req_zone \$aegis_post_limit_key zone=aegis_post:10m rate=5r/s;
limit_conn_zone \$binary_remote_addr zone=aegis_conn:10m;
limit_conn_zone \$binary_remote_addr zone=aegis_sse:10m;
NGINX

  if [ "$HAS_CERT" = 1 ]; then
    cat <<NGINX

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    server_tokens off;
    # certbot 갱신(nginx 플러그인)이 /.well-known/acme-challenge/<토큰> 위치를 잠시 추가해 쓴다.
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate ${LIVE}/fullchain.pem;
    ssl_certificate_key ${LIVE}/privkey.pem;
NGINX
    exists /etc/letsencrypt/options-ssl-nginx.conf && echo "    include /etc/letsencrypt/options-ssl-nginx.conf;"
    exists /etc/letsencrypt/ssl-dhparams.pem && echo "    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
    cat <<NGINX
    add_header Strict-Transport-Security "max-age=31536000" always;

$(common_server)
}
NGINX
  else
    cat <<NGINX

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

$(common_server)
}
NGINX
  fi
}

TMP="$(mktemp)"
render > "$TMP"
BACKUP=""
if [ -f "$CONF" ]; then
  BACKUP="$(mktemp)"
  sudo cp "$CONF" "$BACKUP"
fi
sudo install -m 644 "$TMP" "$CONF"
rm -f "$TMP"
sudo ln -sf "$CONF" /etc/nginx/sites-enabled/aegis-ai-study.conf
sudo rm -f /etc/nginx/sites-enabled/default

if ! sudo nginx -t; then
  echo "::error::새 nginx 설정이 검사를 통과하지 못해 이전 설정으로 되돌립니다."
  if [ -n "$BACKUP" ]; then sudo install -m 644 "$BACKUP" "$CONF"; else sudo rm -f "$CONF" /etc/nginx/sites-enabled/aegis-ai-study.conf; fi
  exit 1
fi
[ -n "$BACKUP" ] && rm -f "$BACKUP"
sudo systemctl enable --now nginx >/dev/null 2>&1 || true
# reload는 기존 연결을 끊지 않고 새 설정으로 넘어간다(무중단).
sudo systemctl reload nginx
echo "nginx -> 127.0.0.1:${PORT} ($( [ "$HAS_CERT" = 1 ] && echo https || echo http-only))"
