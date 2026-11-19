#!/usr/bin/env bash
# 서버에 스왑 파일(/swapfile)을 만들어 켜고, 재부팅 뒤에도 켜지도록 /etc/fstab에 적는다.
# 사용법: swap.sh [크기 MB, 기본 2048]   (멱등 — 스왑이 이미 켜져 있으면 아무것도 바꾸지 않는다)
#
# 서버는 RAM이 1GB뿐이다. 무중단 배포(deploy.sh)는 옛 버전과 새 버전을
# 잠시 함께 띄우는데, 그 옆에서 self-hosted 러너·PM2·nginx도 돈다. 스왑이 없으면 이때 메모리가 바닥나
# VM 전체가 멈춘다: 러너가 GitHub에 응답하지 못해 job이 끝나지 않은 채 실패하고(lost communication),
# nginx도 응답하지 않아 사이트가 내려간다. 스왑이 있으면 잠깐의 초과분을 디스크로 넘겨 버틴다.
set -euo pipefail

SIZE_MB="${1:-2048}"
SWAPFILE=/swapfile
[[ "$SIZE_MB" =~ ^[0-9]+$ ]] && (( SIZE_MB >= 256 )) || { echo "invalid swap size"; exit 1; }

if [ -n "$(swapon --noheadings --show=NAME)" ]; then
  echo "swap already on"
  swapon --show
  exit 0
fi

create_swapfile() {
  sudo rm -f "$SWAPFILE"
  # 스왑 파일이 디스크를 거의 다 채우면 DB·로그 쓰기가 실패하므로, 만든 뒤에도 2GB 이상 남을 때만 만든다.
  local avail_mb
  avail_mb=$(( $(df --output=avail -k / | tail -n 1) / 1024 ))
  if (( avail_mb < SIZE_MB + 2048 )); then
    echo "::error::디스크 여유 공간(${avail_mb}MB)이 부족해 ${SIZE_MB}MB 스왑 파일을 만들 수 없습니다. 스왑 없이 두 버전을 함께 띄우면 서버가 멈출 수 있어 배포를 중단합니다(사이트는 이전 버전으로 계속 동작). 디스크를 비운 뒤 다시 실행하세요."
    exit 1
  fi
  # fallocate가 지원되지 않거나 만든 파일을 swapon이 거부하는 파일 시스템이면 dd로 채워서 만든다.
  if [ "${1:-}" = "dd" ] || ! sudo fallocate -l "${SIZE_MB}M" "$SWAPFILE" 2>/dev/null; then
    sudo dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SIZE_MB" status=none
  fi
  sudo chmod 600 "$SWAPFILE"
  sudo mkswap "$SWAPFILE" >/dev/null
}

[ -f "$SWAPFILE" ] || create_swapfile
if ! sudo swapon "$SWAPFILE" 2>/dev/null; then
  create_swapfile dd
  sudo swapon "$SWAPFILE"
fi
grep -qE "^${SWAPFILE}[[:space:]]" /etc/fstab || echo "${SWAPFILE} none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null

echo "swap enabled (${SIZE_MB}MB at ${SWAPFILE})"
swapon --show
free -m
