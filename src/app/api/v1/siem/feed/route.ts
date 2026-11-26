import { NextRequest, NextResponse } from "next/server";
import { buildFeed } from "@/lib/siem-exchange";
import { sha256Hex } from "@/lib/siem-exchange-keys";
import { authSubscribedSiem, notModified } from "@/lib/siem-exchange-http";
import { siemExchange, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/siem/feed — Atom feed of the latest ruleset per lane and the
 * latest community blocklist. SIEM key + active rules subscription. Send
 * If-None-Match with the last ETag: an unchanged feed is a bodyless 304.
 */
async function handleGet(req: NextRequest) {
  const auth = await authSubscribedSiem(req, "feed");
  if (!auth.ok) return auth.response;

  const body = await buildFeed();
  const etag = `"${sha256Hex(body).slice(0, 32)}"`;
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
  if (notModified(req, etag)) {
    siemExchange.inc({ endpoint: "feed", result: "not_modified" });
    return new NextResponse(null, { status: 304, headers });
  }
  siemExchange.inc({ endpoint: "feed", result: "ok" });
  return new NextResponse(body, { headers: { ...headers, "Content-Type": "application/atom+xml; charset=utf-8" } });
}

export const GET = withMetrics("/api/v1/siem/feed", handleGet);
