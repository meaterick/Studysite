#!/usr/bin/env python3
"""Root-owned, fixed read-only collector. No network scans, firewall writes or app imports."""
import datetime
import hashlib
import ipaddress
import json
import os
import re
import shlex
import subprocess
import tempfile
from pathlib import Path

DIRECTORY = Path('/var/lib/aegis-security')


def command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=8, check=False)
        return result.stdout[:1024 * 1024] if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def ssh_event(row, now):
    # Trusted journal metadata, not a caller-supplied identifier or a copied log line.
    if row.get('_COMM') not in ('sshd', 'sshd-session'):
        return None
    message = row.get('MESSAGE')
    if not isinstance(message, str) or len(message) > 4096:
        return None
    match = re.match(r'^(Failed|Accepted) (password|publickey) for (?:invalid user )?(\S+) from ([0-9a-fA-F:.]+) port \d+(?: ssh2)?(?:[: ].*)?$', message)
    if not match:
        return None
    try:
        ip = str(ipaddress.ip_address(match[4]))
        at = datetime.datetime.fromtimestamp(int(row['__REALTIME_TIMESTAMP']) / 1_000_000, datetime.timezone.utc)
    except (ValueError, KeyError, TypeError, OverflowError, OSError):
        return None
    if not 0 <= (now - at).total_seconds() <= 900:
        return None
    identifier = str(row.get('__CURSOR', ''))[:512] or str(row['__REALTIME_TIMESTAMP']) + message
    return {'id': hashlib.sha256(identifier.encode(errors="replace")).hexdigest()[:32], 'at': at.isoformat(), 'ip': ip,
            'outcome': 'failed' if match[1] == 'Failed' else 'accepted',
            'method': match[2], 'root': match[3] == 'root'}


def firewall_rules(output, family):
    if output is None:
        return {'family': family, 'checked': False, 'policy': 'unknown', 'publicTcpPorts': [], 'blockedIps': [], 'truncated': False}
    rules, policy, public, blocked = [], 'unknown', set(), []
    for line in output.splitlines():
        try:
            tokens = shlex.split(line)
        except ValueError:
            continue
        if tokens[:2] == ['-P', 'INPUT'] and len(tokens) == 3:
            policy = tokens[2]
        if tokens[:2] == ['-A', 'INPUT']:
            rules.append(tokens)
    terminal = False
    prior_ports = set()
    for index, tokens in enumerate(rules[:512], 1):
        def option(name, default=''):
            try:
                return tokens[tokens.index(name) + 1]
            except (ValueError, IndexError):
                return default
        target, source = option('-j'), option('-s')
        any_source = source in ('', '0.0.0.0/0', '::/0') and '!' not in tokens
        any_interface = not option('-i') and not option('-d') and '!' not in tokens
        port = option('--dport')
        if target == 'ACCEPT' and any_source and any_interface and option('-p') == 'tcp' and port.isdecimal():
            if not terminal:
                public.add(int(port))
                prior_ports.add(int(port))
        if target in ('DROP', 'REJECT') and source and not any_source:
            try:
                network = ipaddress.ip_network(source, strict=False)
                exact = network.prefixlen == network.max_prefixlen
            except ValueError:
                exact = False
            if exact:
                blocked.append({'ip': str(network.network_address), 'position': index,
                                'coverage': 'unreachable' if terminal else 'partial' if prior_ports else 'first' if index == 1 and not any(x in tokens for x in ('-p', '-i', '-d', '--dport', '-m', '!')) else 'review',
                                'earlierAllowedPorts': sorted(prior_ports)[:32]})
        conditions = any(x in tokens for x in ('-i', '-o', '-p', '--dport', '--dports', '--sport', '--sports', '--state', '--ctstate', '--match-set', '--limit', '!', '-g'))
        if target in ('ACCEPT', 'DROP', 'REJECT', 'RETURN') and any_source and not option('-d') and not conditions and not any(x in tokens for x in ('-m', '--tcp-flags')):
            terminal = True
    return {'family': family, 'checked': True, 'policy': policy, 'publicTcpPorts': sorted(public)[:64], 'blockedIps': blocked[:200], 'truncated': len(rules) > 512 or len(blocked) > 200}


def collect():
    now = datetime.datetime.now(datetime.timezone.utc)
    raw = command(['/usr/bin/journalctl', '-u', 'ssh.service', '-u', 'sshd.service', '--since', '15 minutes ago', '-n', '1000', '-o', 'json', '--no-pager'])
    lines = (raw or '').splitlines()
    events = []
    for line in lines:
        try:
            event = ssh_event(json.loads(line), now)
            if event:
                events.append(event)
        except (ValueError, TypeError, AttributeError):
            continue
    events.sort(key=lambda e: (e['at'], e['id']))
    return {'version': 1, 'checkedAt': now.isoformat(), 'sshChecked': raw is not None,
            'sshTruncated': len(lines) >= 1000 or len(events) > 200, 'sshEvents': events[-200:],
            'firewalls': [firewall_rules(command(['/usr/sbin/iptables', '-S', 'INPUT']), 'ipv4'),
                          firewall_rules(command(['/usr/sbin/ip6tables', '-S', 'INPUT']), 'ipv6')]}


def main():
    snapshot = collect()
    # DIRECTORY and this installed program must be root-owned, never writable by app/runner.
    fd, temporary = tempfile.mkstemp(prefix='.telemetry-', dir=DIRECTORY)
    try:
        os.fchown(fd, 0, DIRECTORY.stat().st_gid)
        os.fchmod(fd, 0o640)
        with os.fdopen(fd, 'w') as file:
            json.dump(snapshot, file, ensure_ascii=False)
        os.replace(temporary, DIRECTORY / 'telemetry.json')
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == '__main__':
    main()
