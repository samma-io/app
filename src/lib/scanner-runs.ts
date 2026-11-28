import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";
import { latestRuns } from "@/lib/scan-results";
import { INTERNAL_SCANNERS } from "@/lib/constants";
import { BILLING_CURRENCY } from "@/lib/external-scanners";

// Everything the scanner dashboard shows, scoped to one organisation.
// Internal runs come from TimescaleDB (latest run per scanner and target);
// external runs come from ExternalScanRun (src/lib/external-scans.ts).

export type RunRow = {
  time: Date;
  scanner: string;
  scannerLabel: string;
  kind: "internal" | "external";
  targetId: string;
  targetValue: string;
  profileId: string | null;
  outcome: string;
  findingCount: number;
  costCents: number;
  currency: string;
};

export type ScannerSummary = {
  key: string;
  label: string;
  kind: "internal" | "external";
  lastRun: Date | null;
  targets: number;
  runs30d: number;
  pricePerScanCents: number;
  currency: string;
  spend30dCents: number;
};

export type ScannerDashboard = {
  scanners: ScannerSummary[];
  runs: RunRow[];
  internalUnavailable: boolean; // no scan results database, or the query failed
  totals30d: { runs: number; targets: number; activeScanners: number; spendCents: number };
};

const WINDOW_DAYS = 30;

export async function getScannerDashboard(organisationId: string): Promise<ScannerDashboard> {
  const [targets, connections, externalScanRuns] = await Promise.all([
    prisma.target.findMany({
      where: { profile: { organisationId } },
      select: { id: true, value: true, profileId: true },
    }),
    prisma.externalScannerConnection.findMany({
      where: { organisationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.externalScanRun.findMany({
      where: { organisationId, requestedAt: { gte: new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000) } },
      include: { target: { select: { id: true, value: true, profileId: true } } },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  const byId = new Map(targets.map((t) => [t.id, t]));
  const { runs: internalRuns, unavailable: internalUnavailable } = await getInternalRuns(targets, byId);

  const connectionsById = new Map(connections.map((c) => [c.id, c]));
  const externalRuns: RunRow[] = externalScanRuns.flatMap((r) => {
    const c = connectionsById.get(r.connectionId);
    if (!c) return [];
    return [{
      time: r.finishedAt ?? r.requestedAt,
      scanner: c.id,
      scannerLabel: c.name,
      kind: "external" as const,
      targetId: r.target.id,
      targetValue: r.target.value,
      profileId: r.target.profileId,
      outcome: r.status.toLowerCase(),
      findingCount: r.findingCount,
      // Only a completed run is charged.
      costCents: r.status === "COMPLETED" ? c.pricePerScanCents : 0,
      currency: c.currency,
    }];
  });

  const runs = [...internalRuns, ...externalRuns].sort((a, b) => b.time.getTime() - a.time.getTime());

  const since = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const summaries = new Map<string, ScannerSummary>();
  for (const c of connections) {
    summaries.set(c.id, {
      key: c.id,
      label: c.name,
      kind: "external",
      lastRun: null,
      targets: 0,
      runs30d: 0,
      pricePerScanCents: c.pricePerScanCents,
      currency: c.currency,
      spend30dCents: 0,
    });
  }
  const targetSets = new Map<string, Set<string>>();
  for (const r of runs) {
    let s = summaries.get(r.scanner);
    if (!s) {
      s = {
        key: r.scanner,
        label: r.scannerLabel,
        kind: r.kind,
        lastRun: null,
        targets: 0,
        runs30d: 0,
        pricePerScanCents: 0,
        currency: BILLING_CURRENCY,
        spend30dCents: 0,
      };
      summaries.set(r.scanner, s);
    }
    if (!s.lastRun || r.time > s.lastRun) s.lastRun = r.time;
    const set = targetSets.get(r.scanner) ?? new Set<string>();
    set.add(r.targetId);
    targetSets.set(r.scanner, set);
    if (r.time.getTime() >= since) {
      s.runs30d++;
      s.spend30dCents += r.costCents;
    }
  }
  for (const [k, set] of targetSets) summaries.get(k)!.targets = set.size;

  const scanners = [...summaries.values()].sort(
    (a, b) => (a.kind === b.kind ? a.label.localeCompare(b.label) : a.kind === "external" ? -1 : 1)
  );

  const recent = runs.filter((r) => r.time.getTime() >= since);
  const totals30d = {
    runs: recent.length,
    targets: new Set(recent.map((r) => r.targetId)).size,
    activeScanners: scanners.filter((s) => s.runs30d > 0).length,
    spendCents: recent.reduce((sum, r) => sum + r.costCents, 0),
  };

  return { scanners, runs, internalUnavailable, totals30d };
}

type TargetRef = { id: string; value: string; profileId: string | null };

async function getInternalRuns(
  targets: TargetRef[],
  byId: Map<string, TargetRef>
): Promise<{ runs: RunRow[]; unavailable: boolean }> {
  if (targets.length === 0) return { runs: [], unavailable: false };
  const db = getScannerDb();
  if (!db) return { runs: [], unavailable: true };
  try {
    const rows = await latestRuns(db, targets.map((t) => t.id));
    return {
      unavailable: false,
      runs: rows.flatMap((r) => {
        const t = byId.get(r.targetId);
        const at = r.finishedAt ?? r.lastSeenAt;
        if (!t || !at) return [];
        return [{
          time: new Date(at),
          scanner: r.scanner,
          scannerLabel: INTERNAL_SCANNERS[r.scanner] ?? r.scanner,
          kind: "internal" as const,
          targetId: t.id,
          targetValue: t.value,
          profileId: t.profileId,
          outcome: r.outcome ?? "completed",
          findingCount: r.findingCount,
          costCents: 0,
          currency: BILLING_CURRENCY,
        }];
      }),
    };
  } catch (err) {
    console.error("[scanner-runs] scan_results query failed:", err);
    return { runs: [], unavailable: true };
  }
}
