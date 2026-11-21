import { prisma } from "@/lib/prisma";
import { formatExternalResult } from "@/lib/external-scans";
import { SEVERITIES, type Finding, type ScannerRun } from "@/lib/scan-results";

// External (partner) scanner results in the same shape as scan_results, so the
// /api/v1 read endpoints, and the operator's collector behind them, treat them
// like any other scanner. The scanner name is "external:<catalog id>".

const PREFIX = "external:";

function severityOf(raw: string): string {
  const s = raw.toUpperCase();
  return (SEVERITIES as readonly string[]).includes(s) ? s : "INFO";
}

/**
 * Latest finished run (COMPLETED or FAILED) of every external scanner
 * connection on each target, with its findings. Scoped to the organisation.
 */
export async function externalResultsForTargets(
  organisationId: string,
  targets: { id: string; value: string }[],
  opts: { scanner?: string; severities?: string[] } = {}
): Promise<{ runs: ScannerRun[]; results: Finding[] }> {
  if (targets.length === 0) return { runs: [], results: [] };
  if (opts.scanner && !opts.scanner.startsWith(PREFIX)) return { runs: [], results: [] };

  const rows = await prisma.externalScanRun.findMany({
    where: {
      organisationId,
      targetId: { in: targets.map((t) => t.id) },
      status: { in: ["COMPLETED", "FAILED"] },
      ...(opts.scanner ? { connection: { scannerId: opts.scanner.slice(PREFIX.length) } } : {}),
    },
    include: { connection: { select: { scannerId: true } } },
    orderBy: { finishedAt: "desc" },
  });

  const values = new Map(targets.map((t) => [t.id, t.value]));
  const seen = new Set<string>();
  const runs: ScannerRun[] = [];
  const results: Finding[] = [];

  for (const row of rows) {
    // Latest run per target and connection.
    const key = `${row.targetId}:${row.connectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const scanner = PREFIX + row.connection.scannerId;
    const time = (row.finishedAt ?? row.requestedAt).toISOString();
    const formatted = formatExternalResult(row.result);
    const findings = formatted && "findings" in formatted ? formatted.findings : [];

    const severity: Record<string, number> = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
    for (const f of findings) severity[severityOf(f.severity)]++;

    runs.push({
      targetId: row.targetId,
      scanner,
      runId: row.id,
      outcome: row.status === "COMPLETED" ? "succeeded" : "failed",
      finishedAt: time,
      lastSeenAt: time,
      findingCount: findings.length,
      severity,
    });

    const host = values.get(row.targetId);
    for (const f of findings) {
      const sev = severityOf(f.severity);
      if (opts.severities?.length && !opts.severities.includes(sev)) continue;
      results.push({
        time,
        targetId: row.targetId,
        target: host,
        scanner,
        runId: row.id,
        checkId: f.id || undefined,
        severity: sev,
        title: f.title,
        host,
        // Partner detail can hold what the scanner saw; evidence is never logged by the collector.
        evidence: f.detail || undefined,
      });
    }
  }
  return { runs, results };
}
