#!/usr/bin/env bash
# Install a fixed root-owned read-only collector; app gets read access to sanitized output only.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
GROUP_NAME="$(id -gn)"
sudo install -d -m 755 -o root -g root /usr/local/lib/aegis-security
sudo install -m 755 -o root -g root "$HERE/security-collector.py" /usr/local/lib/aegis-security/collector.py
sudo install -d -m 750 -o root -g "$GROUP_NAME" /var/lib/aegis-security
SVC="$(mktemp)"; TIMER="$(mktemp)"
trap 'rm -f "$SVC" "$TIMER"' EXIT
cat > "$SVC" <<'UNIT'
[Unit]
Description=Read-only Aegis SSH and firewall security telemetry
[Service]
Type=oneshot
User=root
ExecStart=/usr/bin/python3 -I /usr/local/lib/aegis-security/collector.py
TimeoutStartSec=40
UMask=0027
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=full
ProtectHome=yes
ProtectKernelTunables=yes
ProtectControlGroups=yes
UNIT
cat > "$TIMER" <<'UNIT'
[Unit]
Description=Refresh Aegis security telemetry every minute
[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
AccuracySec=5s
Persistent=true
[Install]
WantedBy=timers.target
UNIT
sudo install -m 644 -o root -g root "$SVC" /etc/systemd/system/aegis-security-collector.service
sudo install -m 644 -o root -g root "$TIMER" /etc/systemd/system/aegis-security-collector.timer
sudo systemctl daemon-reload
sudo systemctl enable --now aegis-security-collector.timer
sudo systemctl start aegis-security-collector.service
# Check readability as the deployment/app account. Never print authentication messages.
test -r /var/lib/aegis-security/telemetry.json
echo 'Read-only SSH/firewall collector installed; sanitized snapshot is readable.'
python3 - <<'PY_CHECK'
import json
from pathlib import Path
v = json.loads(Path('/var/lib/aegis-security/telemetry.json').read_text())
print('Collector source status:', json.dumps({'sshReadable': v['sshChecked'], 'sshEvents': len(v['sshEvents']), 'sshTruncated': v['sshTruncated'], 'firewalls': [{'family': f['family'], 'readable': f['checked'], 'ipRules': len(f['blockedIps']), 'unreachableRules': sum(r['coverage'] == 'unreachable' for r in f['blockedIps'])} for f in v['firewalls']]}))
PY_CHECK
