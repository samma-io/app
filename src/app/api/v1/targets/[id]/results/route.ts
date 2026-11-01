import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken, parseLimit } from "@/lib/api-auth";
import { getScannerDb } from "@/lib/scanner-db";
import { latestFindings, latestRuns, parseSeverities } from "@/lib/scan-results";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/targets/:id/results?scanner=&severity=CRITICAL,HIGH&limit=
 * Findings from the latest run of each scanner on the target.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiToken(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const sp = req.nextUrl.searchParams;
  const severities = parseSeverities(sp.get("severity"));
  if (severities === null) {
    return NextResponse.json({ error: "severity must be a comma list of CRITICAL, HIGH, MEDIUM, LOW, INFO" }, { status: 400 });
  }
  const scanner = sp.get("scanner")?.trim() || undefined;
  const limit = parseLimit(sp.get("limit"), 200, 500);

  const target = await prisma.target.findFirst({
    where: { id, profile: { organisationId: auth.organisationId } },
    select: { id: true, value: true },
  });
  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  const db = getScannerDb();
  if (!db) return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  try {
    const [runs, results] = await Promise.all([
      latestRuns(db, [target.id]),
      latestFindings(db, [target.id], {
        scanner,
        severities,
        limit,
        targetValues: new Map([[target.id, target.value]]),
      }),
    ]);
    return NextResponse.json({
      targetId: target.id,
      runs: scanner ? runs.filter((r) => r.scanner === scanner) : runs,
      results,
    });
  } catch (err) {
    console.error("[api] latest results failed:", err);
    return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  }
}
