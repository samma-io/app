import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken, parseLimit } from "@/lib/api-auth";
import { getScannerDb } from "@/lib/scanner-db";
import { latestFindings, latestRuns, parseSeverities, SEVERITIES, type Finding } from "@/lib/scan-results";
import { externalResultsForTargets } from "@/lib/external-results";
import { refreshExternalScans } from "@/lib/external-scans";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/targets/:id/results?scanner=&severity=CRITICAL,HIGH&limit=
 * Findings from the latest run of each scanner on the target, internal
 * (scan_results) and external partner scanners ("external:<id>").
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

  // Fetch partner results still in progress, so the collector's poll brings
  // them in even when nobody opens the dashboard.
  await refreshExternalScans(auth.organisationId, { targetId: target.id });
  const external = await externalResultsForTargets(auth.organisationId, [target], { scanner, severities });

  const db = getScannerDb();
  if (!db) {
    // No scan results database here: the external scanners' results still are.
    if (external.runs.length === 0) {
      return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
    }
    return NextResponse.json({ targetId: target.id, runs: external.runs, results: sortFindings(external.results).slice(0, limit) });
  }
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
      runs: [...(scanner ? runs.filter((r) => r.scanner === scanner) : runs), ...external.runs],
      results: sortFindings([...results, ...external.results]).slice(0, limit),
    });
  } catch (err) {
    console.error("[api] latest results failed:", err);
    return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  }
}

// Most severe first, then newest, as latestFindings orders them.
function sortFindings(findings: Finding[]): Finding[] {
  const rank = (s?: string) => {
    const i = (SEVERITIES as readonly string[]).indexOf(s ?? "");
    return i === -1 ? SEVERITIES.length : i;
  };
  return [...findings].sort((a, b) => rank(a.severity) - rank(b.severity) || b.time.localeCompare(a.time));
}
