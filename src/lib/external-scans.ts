import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getScanResult, startScan } from "@/lib/external-scanner-client";
import { scansStarted } from "@/lib/metrics/instrument";

// Runs of external scanners (see ExternalScanRun in prisma/schema.prisma).
// Started when a target is added to a profile with the scanner enabled, or on
// Rescan; results are fetched when a page that shows them is opened.

export type ScanTrigger = "new-target" | "rescan";

const POLL_INTERVAL_MS = 5_000;
const RUN_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const POLL_CONCURRENCY = 5;

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError") return "Scanner did not answer in time";
    return err.message.slice(0, 300);
  }
  return "Unknown error";
}

/**
 * Starts a scan of the target on every external scanner enabled on its profile
 * (or just `onlyConnectionId`). The target is loaded by id and its org is taken
 * from its profile, so callers must have checked ownership already. LOCAL
 * targets are never scanned. Returns the number of runs started.
 */
export async function startExternalScans(
  targetId: string,
  trigger: ScanTrigger,
  onlyConnectionId?: string
): Promise<number> {
  const target = await prisma.target.findUnique({
    where: { id: targetId },
    include: {
      profile: {
        include: {
          organisation: { select: { deletedAt: true } },
          externalScanners: {
            where: onlyConnectionId ? { connectionId: onlyConnectionId } : undefined,
            include: { connection: true },
          },
        },
      },
    },
  });
  // Locked orgs (deleted in Clerk) start nothing.
  if (!target || target.scannerStatus === "LOCAL" || target.profile.organisation.deletedAt) return 0;

  const organisationId = target.profile.organisationId;
  let started = 0;
  await Promise.all(
    target.profile.externalScanners.map(async ({ connection }) => {
      // Belt and braces: the connection must be the target's org's.
      if (connection.organisationId !== organisationId) return;
      try {
        const externalId = await startScan(connection, target);
        await prisma.externalScanRun.create({
          data: { organisationId, connectionId: connection.id, targetId: target.id, externalId, trigger },
        });
        started++;
        scansStarted.inc({ kind: "external", trigger });
      } catch (err) {
        console.error(`[external-scans] start failed for connection ${connection.id}: ${errorMessage(err)}`);
        await prisma.externalScanRun.create({
          data: {
            organisationId,
            connectionId: connection.id,
            targetId: target.id,
            trigger,
            status: "FAILED",
            finishedAt: new Date(),
            error: errorMessage(err),
          },
        });
      }
    })
  );
  return started;
}

/**
 * Fetches results for the org's running runs (optionally one target's) that
 * were not polled in the last 5 s. Called from pages before they render.
 * Never throws.
 */
export async function refreshExternalScans(
  organisationId: string,
  opts: { targetId?: string } = {}
): Promise<void> {
  try {
    const runs = await prisma.externalScanRun.findMany({
      where: {
        organisationId,
        status: "RUNNING",
        ...(opts.targetId ? { targetId: opts.targetId } : {}),
        OR: [{ lastPolledAt: null }, { lastPolledAt: { lt: new Date(Date.now() - POLL_INTERVAL_MS) } }],
      },
      include: { connection: true },
      orderBy: { requestedAt: "asc" },
      take: 50,
    });

    for (let i = 0; i < runs.length; i += POLL_CONCURRENCY) {
      await Promise.all(runs.slice(i, i + POLL_CONCURRENCY).map(refreshRun));
    }
  } catch (err) {
    console.error(`[external-scans] refresh failed: ${errorMessage(err)}`);
  }
}

async function refreshRun(run: Prisma.ExternalScanRunGetPayload<{ include: { connection: true } }>) {
  const now = new Date();
  const timedOut = now.getTime() - run.requestedAt.getTime() > RUN_TIMEOUT_MS;

  if (!run.externalId) {
    await prisma.externalScanRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: now, error: "No scan id" },
    });
    return;
  }

  let data: Prisma.ExternalScanRunUpdateInput = { lastPolledAt: now };
  try {
    const res = await getScanResult(run.connection, run.externalId);
    if (res.state === "done") {
      const result = res.result as { status?: unknown; findings?: unknown; error?: unknown } | null;
      const failed = result?.status === "failed";
      data = {
        ...data,
        status: failed ? "FAILED" : "COMPLETED",
        finishedAt: now,
        contentType: res.contentType,
        result: res.result as Prisma.InputJsonValue,
        findingCount: Array.isArray(result?.findings) ? result.findings.length : 0,
        error: failed ? String(result?.error ?? "Scanner reported the scan as failed").slice(0, 300) : null,
      };
    } else if (res.state === "failed") {
      data = { ...data, status: "FAILED", finishedAt: now, error: res.error };
    } else if (timedOut) {
      data = { ...data, status: "FAILED", finishedAt: now, error: "Timed out" };
    }
  } catch (err) {
    console.error(`[external-scans] poll failed for run ${run.id}: ${errorMessage(err)}`);
    if (timedOut) data = { ...data, status: "FAILED", finishedAt: now, error: "Timed out" };
  }
  await prisma.externalScanRun.update({ where: { id: run.id }, data });
}

export type FormattedFinding = { id: string; title: string; severity: string; detail: string };
export type FormattedResult = { findings: FormattedFinding[] } | { raw: string } | null;

/** The one place the result format is interpreted: a findings list when there is one, raw JSON otherwise. */
export function formatExternalResult(result: unknown): FormattedResult {
  if (result === null || result === undefined) return null;
  const findings = (result as { findings?: unknown }).findings;
  if (Array.isArray(findings)) {
    return {
      findings: findings.map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (typeof v === "string" ? v : v === undefined ? "" : JSON.stringify(v));
        return { id: str(o.id), title: str(o.title) || "Finding", severity: str(o.severity) || "info", detail: str(o.detail) };
      }),
    };
  }
  return { raw: JSON.stringify(result, null, 2) };
}
