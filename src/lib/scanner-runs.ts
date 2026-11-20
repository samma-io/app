import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";
import { latestRuns } from "@/lib/scan-results";
import { INTERNAL_SCANNERS } from "@/lib/constants";
import { DEMO_TARGETS, demoRuns, type DemoTarget } from "@/data/mock-scanner-runs";

// Everything the scanner dashboard shows, scoped to one organisation.
// Internal runs come from TimescaleDB (latest run per scanner and target);
// external runs are demo data until external scanners are actually run.

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
  demo: boolean;
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
  demo: boolean;
};

export type ScannerDashboard = {
  scanners: ScannerSummary[];
  runs: RunRow[];
  internalIsDemo: boolean;
  totals30d: { runs: number; targets: number; activeScanners: number; spendCents: number };
};

const WINDOW_DAYS = 30;

export async function getScannerDashboard(organisationId: string): Promise<ScannerDashboard> {
  const [targets, connections] = await Promise.all([
    prisma.target.findMany({
      where: { profile: { organisationId } },
      select: { id: true, value: true, profileId: true },
    }),
    prisma.externalScannerConnection.findMany({
      where: { organisationId },
      include: { profiles: { include: { profile: { select: { targets: { select: { id: true, value: true, profileId: true } } } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byId = new Map(targets.map((t) => [t.id, t]));
  const { runs: internalRuns, demo: internalIsDemo } = await getInternalRuns(targets, byId);

  const externalRuns: RunRow[] = [];
  for (const c of connections) {
    const profileTargets = new Map<string, DemoTarget>(
      c.profiles.flatMap((p) => p.profile.targets).map((t) => [t.id, t])
    );
    for (const r of demoRuns(c.id, [...profileTargets.values()], { days: WINDOW_DAYS, everyDays: 7 })) {
      const t = profileTargets.get(r.targetId)!;
      externalRuns.push({
        time: r.time,
        scanner: c.id,
        scannerLabel: c.name,
        kind: "external",
        targetId: t.id,
        targetValue: t.value,
        profileId: t.profileId,
        outcome: r.outcome,
        findingCount: r.findingCount,
        // A failed run is not charged.
        costCents: r.outcome === "completed" ? c.pricePerScanCents : 0,
        currency: c.currency,
        demo: true,
      });
    }
  }

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
      demo: true,
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
        currency: "USD",
        spend30dCents: 0,
        demo: r.demo,
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

  return { scanners, runs, internalIsDemo, totals30d };
}

async function getInternalRuns(
  targets: DemoTarget[],
  byId: Map<string, DemoTarget>
): Promise<{ runs: RunRow[]; demo: boolean }> {
  const db = getScannerDb();
  if (db && targets.length > 0) {
    try {
      const rows = await latestRuns(db, targets.map((t) => t.id));
      return {
        demo: false,
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
            currency: "USD",
            demo: false,
          }];
        }),
      };
    } catch (err) {
      console.error("[scanner-runs] scan_results query failed, using demo data:", err);
    }
  }

  // No scanner DB in this environment: show the shape with demo runs.
  const demoTargets = targets.length > 0 ? targets : DEMO_TARGETS;
  const demoById = new Map(demoTargets.map((t) => [t.id, t]));
  const runs: RunRow[] = [];
  for (const [scanner, label] of Object.entries(INTERNAL_SCANNERS).filter(([k]) => k.startsWith("detect-"))) {
    for (const r of demoRuns(scanner, demoTargets, { days: WINDOW_DAYS, everyDays: 1 })) {
      const t = demoById.get(r.targetId)!;
      runs.push({
        time: r.time,
        scanner,
        scannerLabel: label,
        kind: "internal",
        targetId: t.id,
        targetValue: t.value,
        profileId: t.profileId,
        outcome: r.outcome,
        findingCount: r.findingCount,
        costCents: 0,
        currency: "USD",
        demo: true,
      });
    }
  }
  return { runs, demo: true };
}
