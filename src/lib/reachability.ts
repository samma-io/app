import { connect, isIP } from "net";
import { isPrivateIp, resolveHostIps } from "@/lib/network";
import { reachabilityChecks } from "@/lib/metrics/instrument";

/**
 * Can samma.io reach a target from the internet?
 *
 * A TCP handshake to the target's port, or to 443 and 80 when it has none.
 * Any port that accepts the connection makes the target UP; none within the
 * timeout makes it DOWN. The handshake is all: nothing is sent and the socket
 * is closed at once, so the check works for any service, not only HTTP, and
 * nothing the target returns is read or stored.
 *
 * SSRF: the check connects to the addresses it resolved and validated itself,
 * never to the name again, so a DNS answer that changes in between cannot
 * point it inside the network. A private, loopback or link-local address, or a
 * name that does not resolve, gives UNKNOWN without any connection. Callers
 * still run isLocalTarget first and skip LOCAL targets.
 */

export type Reachability = "UP" | "DOWN" | "UNKNOWN";

export const DEFAULT_PORTS = [443, 80] as const;
export const CONNECT_TIMEOUT_MS = 3000;
const MAX_ADDRESSES = 4;

function tcpConnect(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: ip, port, timeout: timeoutMs });
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

export async function checkReachability(
  value: string,
  type: "ip" | "dns",
  port?: number | null,
  timeoutMs: number = CONNECT_TIMEOUT_MS
): Promise<Reachability> {
  const result = await probe(value, type, port, timeoutMs);
  reachabilityChecks.inc({ result });
  return result;
}

async function probe(
  value: string,
  type: "ip" | "dns",
  port: number | null | undefined,
  timeoutMs: number
): Promise<Reachability> {
  const ips = type === "ip" ? (isIP(value) ? [value] : []) : await resolveHostIps(value);
  if (ips.length === 0 || ips.some(isPrivateIp)) return "UNKNOWN";

  const ports =
    port && Number.isInteger(port) && port > 0 && port <= 65535 ? [port] : [...DEFAULT_PORTS];
  const attempts = ips
    .slice(0, MAX_ADDRESSES)
    .flatMap((ip) => ports.map((p) => tcpConnect(ip, p, timeoutMs)));

  // UP as soon as one attempt connects; DOWN when all have failed.
  return new Promise((resolve) => {
    let pending = attempts.length;
    for (const attempt of attempts) {
      attempt.then((ok) => {
        if (ok) resolve("UP");
        else if (--pending === 0) resolve("DOWN");
      });
    }
  });
}
