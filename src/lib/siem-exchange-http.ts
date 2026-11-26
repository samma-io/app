import { NextRequest, NextResponse } from "next/server";
import { authenticateSiemKey, type SiemAuth } from "@/lib/siem-auth";
import { hasActiveSubscription } from "@/lib/siem-exchange";
import { siemExchange } from "@/lib/metrics/instrument";

export type Endpoint = "releases" | "feed" | "bundle" | "blocklist" | "indicators";

export function fail(endpoint: Endpoint, result: string, status: number, error: string, headers?: HeadersInit) {
  siemExchange.inc({ endpoint, result });
  return NextResponse.json({ error }, { status, headers });
}

/**
 * SIEM key + an active rules subscription, for the routes that hand out
 * rules and the blocklist. Without a subscription the answer is 403: the key
 * is valid, the product is not included.
 */
export async function authSubscribedSiem(req: NextRequest, endpoint: Endpoint): Promise<SiemAuth> {
  const auth = await authenticateSiemKey(req);
  if (!auth.ok) {
    siemExchange.inc({ endpoint, result: "unauthorized" });
    return auth;
  }
  if (!(await hasActiveSubscription(auth.organisationId))) {
    return { ok: false, response: fail(endpoint, "no_subscription", 403, "No active rules subscription for this organisation") };
  }
  return auth;
}

/** Weak-enough ETag handling for GETs whose body is already in hand. */
export function notModified(req: NextRequest, etag: string): boolean {
  const inm = req.headers.get("if-none-match");
  return !!inm && inm.split(",").some((t) => t.trim().replace(/^W\//, "") === etag);
}
