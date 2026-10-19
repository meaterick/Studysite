import datetime
import importlib.util
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('collector', Path(__file__).parent / 'deploy/security-collector.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
    def test_journal_metadata_and_redaction(self):
        now = datetime.datetime.now(datetime.timezone.utc)
        row = {'_COMM': 'sshd', '__REALTIME_TIMESTAMP': str(int(now.timestamp() * 1_000_000)), '__CURSOR': 'opaque-cursor',
               'MESSAGE': 'Failed password for invalid user secret-user from 203.0.113.9 port 12345 ssh2'}
        event = collector.ssh_event(row, now)
        self.assertEqual(event['outcome'], 'failed')
        self.assertNotIn('secret-user', json.dumps(event))
        self.assertNotIn('opaque-cursor', json.dumps(event))
        self.assertIsNone(collector.ssh_event({**row, '_COMM': 'node'}, now))
        self.assertIsNone(collector.ssh_event({**row, '__REALTIME_TIMESTAMP': '0'}, now))
        root = collector.ssh_event({**row, 'MESSAGE': 'Accepted publickey for root from 2001:db8::1 port 12345 ssh2: ED25519 SHA256:SECRET'}, now)
        self.assertTrue(root['root'])
        self.assertNotIn('SECRET', json.dumps(root))

    def test_unreachable_drop_after_terminal_reject(self):
        rules = '-P INPUT ACCEPT\n-A INPUT -p tcp --dport 443 -j ACCEPT\n-A INPUT -j REJECT --reject-with icmp-host-prohibited\n-A INPUT -s 89.176.0.185/32 -j DROP\n'
        data = collector.firewall_rules(rules, 'ipv4')
        self.assertEqual(data['blockedIps'][0]['coverage'], 'unreachable')
        self.assertEqual(data['publicTcpPorts'], [443])

    def test_earlier_port_allow_and_first_ip_drop(self):
        partial = collector.firewall_rules('-A INPUT -p tcp --dport 80 -j ACCEPT\n-A INPUT -s 203.0.113.9/32 -j DROP', 'ipv4')
        self.assertEqual(partial['blockedIps'][0]['coverage'], 'partial')
        first = collector.firewall_rules('-A INPUT -s 2001:db8::1/128 -j DROP\n-A INPUT -p tcp --dport 22 -j ACCEPT', 'ipv6')
        self.assertEqual(first['blockedIps'][0]['coverage'], 'first')
        restricted = collector.firewall_rules('-A INPUT -s 203.0.113.9/32 -p tcp --dport 22 -j DROP', 'ipv4')
        self.assertEqual(restricted['blockedIps'][0]['coverage'], 'review')

    def test_loopback_and_restricted_source_are_not_public_port_rules(self):
        data = collector.firewall_rules('-A INPUT -i lo -p tcp --dport 3000 -j ACCEPT\n-A INPUT -s 10.0.0.0/8 -p tcp --dport 22 -j ACCEPT', 'ipv4')
        self.assertEqual(data['publicTcpPorts'], [])
        self.assertFalse(collector.firewall_rules(None, 'ipv6')['checked'])

    def test_collector_is_bounded_and_missing_sources_are_explicit(self):
        with patch.object(collector, 'command', return_value=None):
            data = collector.collect()
        self.assertFalse(data['sshChecked'])
        self.assertEqual(data['sshEvents'], [])
        self.assertFalse(data['firewalls'][0]['checked'])


if __name__ == '__main__':
    unittest.main()
