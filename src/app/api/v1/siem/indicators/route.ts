import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateSiemKey } from "@/lib/siem-auth";
import { MAX_INDICATOR_BYTES, parseIndicators, storeIndicators } from "@/lib/siem-exchange";
import { fail } from "@/lib/siem-exchange-http";
import { siemExchange, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

const MIN_INTERVAL_MS = 20 * 1000;

/**
 * POST /api/v1/siem/indicators — a SIEM that opted in reports attacker IPs:
 *   {"indicators": [{"ip", "rule_id", "category", "count", "first_seen", "last_seen"}]}
 * `count` is the number of new alerts since the previous post; counts add up.
 * Only public addresses seen in the last 7 days are kept; others are skipped
 * and counted in the answer. Nothing about the attacked host is accepted.
 * A SIEM that has not opted in gets 403.
 */
async function handlePost(req: NextRequest) {
  const auth = await authenticateSiemKey(req);
  if (!auth.ok) {
    siemExchange.inc({ endpoint: "indicators", result: "unauthorized" });
    return auth.response;
  }
  const { siem } = auth;
  if (!siem.shareIndicators) {
    return fail("indicators", "not_shared", 403, "Sharing is off for this SIEM; an owner can turn it on in the dashboard");
  }
  if (siem.lastIndicatorsAt && Date.now() - siem.lastIndicatorsAt.getTime() < MIN_INTERVAL_MS) {
    return fail("indicators", "throttled", 429, "Posting too often", { "Retry-After": "20" });
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_INDICATOR_BYTES) {
    return fail("indicators", "invalid", 413, "Body too large");
  }
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_INDICATOR_BYTES) return fail("indicators", "invalid", 413, "Body too large");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail("indicators", "invalid", 400, "Invalid JSON body");
  }
  const parsed = parseIndicators(json);
  if (!parsed.ok) return fail("indicators", "invalid", 400, `Invalid indicators: ${parsed.error}`);

  await storeIndicators(siem.id, siem.organisationId, parsed.indicators);
  await prisma.siemInstance.update({ where: { id: siem.id }, data: { lastIndicatorsAt: new Date() } });

  siemExchange.inc({ endpoint: "indicators", result: "ok" });
  return NextResponse.json({ accepted: parsed.indicators.length, skipped: parsed.skipped });
}

export const POST = withMetrics("/api/v1/siem/indicators", handlePost);
