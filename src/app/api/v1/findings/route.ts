import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken, parseLimit } from "@/lib/api-auth";
import { getScannerDb } from "@/lib/scanner-db";
import { latestFindings, parseSeverities } from "@/lib/scan-results";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/findings?severity=CRITICAL,HIGH&since=<RFC3339>&limit=
 * Latest findings across all of the organisation's targets, most severe first.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiToken(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const severities = parseSeverities(sp.get("severity"));
  if (severities === null) {
    return NextResponse.json({ error: "severity must be a comma list of CRITICAL, HIGH, MEDIUM, LOW, INFO" }, { status: 400 });
  }
  let since: Date | undefined;
  const sinceRaw = sp.get("since");
  if (sinceRaw) {
    since = new Date(sinceRaw);
    if (Number.isNaN(since.getTime())) {
      return NextResponse.json({ error: "since must be an RFC 3339 timestamp" }, { status: 400 });
    }
  }
  const limit = parseLimit(sp.get("limit"), 100, 500);

  const targets = await prisma.target.findMany({
    where: { profile: { organisationId: auth.organisationId } },
    select: { id: true, value: true },
  });
  if (targets.length === 0) return NextResponse.json({ findings: [] });

  const db = getScannerDb();
  if (!db) return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  try {
    const findings = await latestFindings(db, targets.map((t) => t.id), {
      severities,
      since,
      limit,
      targetValues: new Map(targets.map((t) => [t.id, t.value])),
    });
    return NextResponse.json({ findings });
  } catch (err) {
    console.error("[api] findings failed:", err);
    return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  }
}
