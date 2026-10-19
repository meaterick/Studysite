import { isIP } from "node:net";

/** One exact canonical IP only: no ports, CIDR ranges, zone IDs, hostnames or lists. */
export function normalizeIp(raw: unknown): string {
  if (typeof raw !== "string" || raw.includes("%")) return "";
  const value = raw.trim();
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6) return "";
  const ip = new URL(`http://[${value}]`).hostname.slice(1, -1).toLowerCase();
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);
  if (!mapped) return ip;
  const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

/** Never ban local, private, link-local or multicast infrastructure addresses. */
export function isBannableIp(raw: unknown): boolean {
  const ip = normalizeIp(raw);
  if (!ip) return false;
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127));
  }
  // Require global-unicast space (2000::/3). IPv4-mapped values were normalized above.
  const first = parseInt(ip.split(":")[0], 16);
  return first >= 0x2000 && first <= 0x3fff;
}
