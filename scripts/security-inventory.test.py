"""Offline parsing and failure checks; no server changes or network requests."""
import importlib.util
import unittest
import sys
sys.dont_write_bytecode = True
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("inventory", Path(__file__).parent / "deploy/security-inventory.py")
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class InventoryTests(unittest.TestCase):
    def test_ipv4_ipv6_and_udp_scope_without_addresses_or_pid(self):
        raw = ('LISTEN 0 4096 127.0.0.53:53 0.0.0.0:* users:(("systemd-resolve",pid=100,fd=4))\n'
               'LISTEN 0 128 [::]:22 [::]:* users:(("sshd",pid=200,fd=3))\n'
               'LISTEN 0 128 10.1.2.3:53 0.0.0.0:* users:(("named",pid=300,fd=3))\n'
               'malformed\n')
        rows = inventory.listeners(raw, "tcp")
        self.assertEqual([r["scope"] for r in rows], ["loopback", "all", "interface"])
        self.assertEqual(rows[0]["process"], "systemd-resolve")
        self.assertNotIn("pid", str(rows))
        self.assertNotIn("10.1.2.3", str(rows))
        self.assertEqual(inventory.listeners("UNCONN 0 0 [::1]:53 *:*", "udp")[0]["scope"], "loopback")

    def test_missing_tools_are_unknown_not_safe(self):
        with patch.object(inventory, "command", return_value=None):
            data = inventory.collect()
        self.assertFalse(data["tcpChecked"])
        self.assertFalse(data["udpChecked"])
        self.assertFalse(data["sshChecked"])
        self.assertIsNone(data["runnerPasswordlessSudoAll"])

    def test_selected_configuration_only_and_passwordless_sudo_detection(self):
        def fake(args):
            if args[-1] == "-l":
                return "(ALL : ALL) NOPASSWD: ALL\n"
            if args[-1] == "-T":
                return "passwordauthentication no\npermitrootlogin prohibit-password\nhostkey /private/path\nauthorizedkeyscommand secret-value\n"
            if args[0] == "dpkg-query":
                return "installed test-version"
            return ""
        with patch.object(inventory, "command", side_effect=fake):
            data = inventory.collect()
        self.assertTrue(data["runnerPasswordlessSudoAll"])
        self.assertEqual(data["ssh"], {"passwordauthentication": "no", "permitrootlogin": "prohibit-password"})
        self.assertNotIn("secret-value", str(data))
        self.assertNotIn("/private/path", str(data))


if __name__ == "__main__":
    unittest.main()
