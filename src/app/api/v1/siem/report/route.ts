import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateSiemKey } from "@/lib/siem-auth";
import { MAX_REPORT_BYTES, parseSiemReport } from "@/lib/siem-report";
import { siemReports, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

// A reporter posts every few minutes; anything faster is a misconfiguration.
const MIN_INTERVAL_MS = 20 * 1000;

function reject(result: "invalid" | "throttled", status: number, error: string, headers?: HeadersInit) {
  siemReports.inc({ result });
  return NextResponse.json({ error }, { status, headers });
}

/**
 * POST /api/v1/siem/report — a SIEM reports its lanes, component health and
 * alert counts. Authenticated by the SIEM key, which selects the SiemInstance:
 * a report can only ever update the SIEM the key belongs to.
 */
async function handlePost(req: NextRequest) {
  const auth = await authenticateSiemKey(req);
  if (!auth.ok) {
    siemReports.inc({ result: "unauthorized" });
    return auth.response;
  }
  const { siem } = auth;

  if (siem.lastSeenAt && Date.now() - siem.lastSeenAt.getTime() < MIN_INTERVAL_MS) {
    return reject("throttled", 429, "Reporting too often", { "Retry-After": "20" });
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_REPORT_BYTES) {
    return reject("invalid", 413, "Report too large");
  }
  const body = await req.text();
  if (Buffer.byteLength(body) > MAX_REPORT_BYTES) return reject("invalid", 413, "Report too large");

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return reject("invalid", 400, "Invalid JSON body");
  }
  const parsed = parseSiemReport(json);
  if (!parsed.ok) return reject("invalid", 400, `Invalid report: ${parsed.error}`);

  await prisma.siemInstance.update({
    where: { id: siem.id },
    data: { report: parsed.report as unknown as Prisma.InputJsonValue, lastSeenAt: new Date() },
  });

  siemReports.inc({ result: "ok" });
  return new NextResponse(null, { status: 204 });
}

export const POST = withMetrics("/api/v1/siem/report", handlePost);
