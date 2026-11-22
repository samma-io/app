import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/metrics/registry";
import { registerBusinessMetrics } from "@/lib/metrics/business";
import "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

registerBusinessMetrics();

/**
 * True when the request was addressed to an IP address or localhost.
 * Prometheus scrapes the pod IP directly; anything that comes through the
 * ingress is addressed to a public hostname, which is how a router picked it.
 */
function isInternalHost(value: string | null): boolean {
  if (!value) return false;
  let host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    host = host.slice(1, host.indexOf("]"));
  } else if (host.split(":").length === 2) {
    host = host.split(":")[0];
  }
  return host === "localhost" || isIP(host) !== 0;
}

/**
 * GET /api/metrics — Prometheus metrics. Answers 404 on the public hostnames,
 * so it is only reachable from inside the cluster.
 */
export async function GET(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (!isInternalHost(req.headers.get("host")) || (forwardedHost && !isInternalHost(forwardedHost))) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(await registry.metrics(), {
    headers: { "Content-Type": registry.contentType, "Cache-Control": "no-store" },
  });
}
