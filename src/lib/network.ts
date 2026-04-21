import { promises as dns } from "dns";

const PRIVATE_RANGES = [
  // loopback
  (p: number[]) => p[0] === 127,
  // RFC 1918
  (p: number[]) => p[0] === 10,
  (p: number[]) => p[0] === 172 && p[1] >= 16 && p[1] <= 31,
  (p: number[]) => p[0] === 192 && p[1] === 168,
  // link-local
  (p: number[]) => p[0] === 169 && p[1] === 254,
];

export function isPrivateIp(ip: string): boolean {
  // IPv6 loopback / ULA
  if (ip === "::1" || ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) {
    return true;
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  return PRIVATE_RANGES.some((check) => check(parts));
}

// Returns all IPv4 addresses that the host resolves to.
// Returns empty array on lookup failure.
export async function resolveHostIps(host: string): Promise<string[]> {
  try {
    return await dns.resolve4(host);
  } catch {
    try {
      const { address } = await dns.lookup(host, { family: 4 });
      return [address];
    } catch {
      return [];
    }
  }
}

// Returns true if every resolved IP for the host is private, or if
// resolution fails entirely (treat unresolvable hosts as local/invalid).
export async function isLocalTarget(value: string, type: "ip" | "dns"): Promise<boolean> {
  if (type === "ip") {
    return isPrivateIp(value);
  }
  const ips = await resolveHostIps(value);
  if (ips.length === 0) return false; // can't resolve — don't block, let operator decide
  return ips.every(isPrivateIp);
}
