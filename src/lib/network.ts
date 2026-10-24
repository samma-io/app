import { promises as dns } from "dns";
import { isIP } from "net";

const PRIVATE_RANGES = [
  // "this" network 0/8
  (p: number[]) => p[0] === 0,
  // loopback
  (p: number[]) => p[0] === 127,
  // RFC 1918
  (p: number[]) => p[0] === 10,
  (p: number[]) => p[0] === 172 && p[1] >= 16 && p[1] <= 31,
  (p: number[]) => p[0] === 192 && p[1] === 168,
  // CGNAT 100.64/10
  (p: number[]) => p[0] === 100 && p[1] >= 64 && p[1] <= 127,
  // link-local
  (p: number[]) => p[0] === 169 && p[1] === 254,
];

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  return PRIVATE_RANGES.some((check) => check(parts));
}

export function isPrivateIp(ip: string): boolean {
  const value = ip.toLowerCase();
  // unspecified address ::
  if (value === "::") {
    return true;
  }
  // IPv6 loopback / ULA
  if (value === "::1" || value.startsWith("fc") || value.startsWith("fd")) {
    return true;
  }
  // fe80::/10 link-local (first hextet 0xfe80-0xfebf)
  const first = parseInt(value.split(":")[0], 16);
  if (!isNaN(first) && first >= 0xfe80 && first <= 0xfebf) {
    return true;
  }
  // IPv4-mapped IPv6 (::ffff:a.b.c.d or ::ffff:aabb:ccdd)
  if (value.startsWith("::ffff:")) {
    const embedded = value.slice("::ffff:".length);
    if (embedded.includes(":")) {
      const groups = embedded.split(":");
      const hi = parseInt(groups[0], 16);
      const lo = parseInt(groups[1], 16);
      if (isNaN(hi) || isNaN(lo)) {
        return true;
      }
      return isPrivateIpv4(`${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`);
    }
    return isPrivateIpv4(embedded);
  }
  return isPrivateIpv4(value);
}

// Returns all addresses (A and AAAA) that the host resolves to.
// Returns empty array when neither record type resolves.
export async function resolveHostIps(host: string): Promise<string[]> {
  const [v4, v6] = await Promise.all([
    dns.resolve4(host).catch(() => [] as string[]),
    dns.resolve6(host).catch(() => [] as string[]),
  ]);
  return [...v4, ...v6];
}

// Fail-closed SSRF guard:
// - type "ip": the value must be a literal IPv4/IPv6 address (net.isIP);
//   anything that is not a valid IP — and any private/internal IP — is blocked.
// - type "dns": the host is blocked when any resolved A/AAAA address is
//   private, or when nothing resolves (unresolvable names are treated as local).
// Callers reject the target when this returns true.
export async function isLocalTarget(value: string, type: "ip" | "dns"): Promise<boolean> {
  if (type === "ip") {
    if (isIP(value) === 0) return true;
    return isPrivateIp(value);
  }
  const ips = await resolveHostIps(value);
  if (ips.length === 0) return true;
  return ips.some(isPrivateIp);
}
