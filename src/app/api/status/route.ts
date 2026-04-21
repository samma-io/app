import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";

export const revalidate = 300;

export async function GET() {
  const targets = await prisma.target.count();

  let scannerRuns = 0;
  let critical = 0;
  let high = 0;

  const db = getScannerDb();
  if (db) {
    try {
      const [runsResult, criticalResult, highResult] = await Promise.all([
        db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) AS count FROM scan_results`,
        db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) AS count FROM scan_results WHERE raw->>'severity' = 'critical'`,
        db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) AS count FROM scan_results WHERE raw->>'severity' = 'high'`,
      ]);
      scannerRuns = Number(runsResult[0].count);
      critical = Number(criticalResult[0].count);
      high = Number(highResult[0].count);
    } catch {
      // scanner DB unavailable or schema mismatch — return zeroes
    }
  }

  return NextResponse.json({ targets, scannerRuns, critical, high });
}
