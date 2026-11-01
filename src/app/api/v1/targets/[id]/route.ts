import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken } from "@/lib/api-auth";
import { targetSelect } from "@/lib/api-targets";
import { getScannerDb } from "@/lib/scanner-db";
import { latestRuns } from "@/lib/scan-results";

export const dynamic = "force-dynamic";

/** GET /api/v1/targets/:id — one target plus the latest run of each scanner. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiToken(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const target = await prisma.target.findFirst({
    where: { id, profile: { organisationId: auth.organisationId } },
    select: targetSelect,
  });
  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  const db = getScannerDb();
  if (!db) return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  try {
    const scanners = await latestRuns(db, [target.id]);
    return NextResponse.json({ target, scanners });
  } catch (err) {
    console.error("[api] latestRuns failed:", err);
    return NextResponse.json({ error: "Scan results unavailable" }, { status: 503 });
  }
}
