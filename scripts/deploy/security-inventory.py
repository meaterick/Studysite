#!/usr/bin/env python3
"""Read-only host configuration inventory. Never collect keys, environment or command lines."""
import datetime
import json
import os
import platform
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=8, check=False)
        return result.stdout if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def listeners(output, protocol):
    result = []
    for line in (output or "").splitlines():
        fields = line.split()
        if len(fields) < 5:
            continue
        address = fields[3]
        try:
            host, port = address.rsplit(":", 1)
            port = int(port)
        except ValueError:
            continue
        host = host.strip("[]").split("%", 1)[0]
        scope = "loopback" if host == "::1" or host.startswith("127.") else "all" if host in ("*", "0.0.0.0", "::") else "interface"
        # Intentionally discard addresses, PID, user names and process arguments.
        names = sorted(set(re.findall(r'\("([a-zA-Z0-9_.+-]{1,60})"', line)))
        row = {"protocol": protocol, "port": port, "scope": scope, "process": ", ".join(names) or "unknown"}
        if row not in result:
            result.append(row)
    return result


def collect():
    tcp = command(["sudo", "-n", "ss", "-H", "-lntp"])
    if tcp is None:
        tcp = command(["ss", "-H", "-lntp"])
    udp = command(["sudo", "-n", "ss", "-H", "-lnup"])
    if udp is None:
        udp = command(["ss", "-H", "-lnup"])
    ssh = command(["sudo", "-n", "/usr/sbin/sshd", "-T"])
    ssh_options = {}
    wanted = {"permitrootlogin", "passwordauthentication", "kbdinteractiveauthentication", "pubkeyauthentication", "allowtcpforwarding", "maxauthtries"}
    for line in (ssh or "").splitlines():
        key, _, value = line.partition(" ")
        if key in wanted:
            ssh_options[key] = value[:80]
    sudo = command(["sudo", "-n", "-l"])
    broad_sudo = None if sudo is None else bool(re.search(r"\(ALL(?:\s*:\s*ALL)?\)\s+NOPASSWD:\s*ALL(?:\s|$)", sudo))
    packages = {}
    for name in ("openssh-server", "nginx", "bind9"):
        version = command(["dpkg-query", "-W", "-f=${db:Status-Status} ${Version}", name])
        packages[name] = version.strip()[:120] if version else "not installed / unavailable"
    os_info = {}
    try:
        for line in Path("/etc/os-release").read_text().splitlines():
            key, _, value = line.partition("=")
            if key in ("NAME", "VERSION_ID"):
                os_info[key] = value.strip('"')[:80]
    except OSError:
        pass
    return {"version": 1, "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "os": os_info, "kernel": platform.release()[:100], "packages": packages,
            "listeners": sorted(listeners(tcp, "tcp") + listeners(udp, "udp"), key=lambda r: (r["port"], r["protocol"], r["scope"])),
            "tcpChecked": tcp is not None, "udpChecked": udp is not None,
            "ssh": ssh_options, "sshChecked": ssh is not None,
            "runnerIsRoot": os.geteuid() == 0, "runnerPasswordlessSudoAll": broad_sudo}


def main():
    data = collect()
    target = Path(sys.argv[1]) / "host-security.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".host-security-", dir=target.parent)
    try:
        with os.fdopen(fd, "w") as file:
            json.dump(data, file, ensure_ascii=False)
        os.replace(temporary, target)  # atomic, 0600 from mkstemp
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    # A small, non-secret review summary; never print raw command outputs.
    print("Host security inventory:", json.dumps({
        "tcp53": [r for r in data["listeners"] if r["port"] == 53 and r["protocol"] == "tcp"],
        "udp53": [r for r in data["listeners"] if r["port"] == 53 and r["protocol"] == "udp"],
        "tcpChecked": data["tcpChecked"], "udpChecked": data["udpChecked"],
        "appPorts": [r for r in data["listeners"] if r["port"] in (3000, 3001)],
        "ssh": data["ssh"], "packages": data["packages"],
        "runnerIsRoot": data["runnerIsRoot"], "runnerPasswordlessSudoAll": data["runnerPasswordlessSudoAll"]
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
