import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";
import { formatDate } from "@/lib/utils";
import { LOCAL_TARGET_HINT, reachabilityLabel, scannerLabel } from "@/lib/target-labels";
import {
  ScanResultsAccordion,
  type ScanResult,
} from "@/components/dashboard/scan-results-accordion";
import { ExternalScanResults } from "@/components/dashboard/external-scan-results";
import { refreshExternalScans } from "@/lib/external-scans";
import { latestRuns } from "@/lib/scan-results";
import { externalResultsForTargets } from "@/lib/external-results";
import { emptyCounts } from "@/lib/vulnerability-summary";
import { SeverityChips } from "@/components/dashboard/severity-tiles";

interface Props {
  params: Promise<{ id: string; targetId: string }>;
}

export default async function TargetDetailPage({ params }: Props) {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const { id: profileId, targetId } = await params;

  const target = await prisma.target.findFirst({
    where: {
      id: targetId,
      profile: { id: profileId, organisationId: org.id },
    },
    include: { profile: true },
  });

  if (!target) notFound();

  // ── External scanners ───────────────────────────────────────────────────────
  // Fetch results of runs still in progress before reading them.
  await refreshExternalScans(org.id, { targetId });
  const [enabledScanners, externalRuns] = await Promise.all([
    prisma.profileExternalScanner.findMany({
      where: { profileId: target.profileId, connection: { organisationId: org.id } },
      include: { connection: { select: { id: true, name: true } } },
      orderBy: { enabledAt: "asc" },
    }),
    prisma.externalScanRun.findMany({
      where: { targetId, organisationId: org.id },
      include: { connection: { select: { name: true } } },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
  ]);

  // ── Scanner DB ──────────────────────────────────────────────────────────────
  let results: ScanResult[] = [];
  try {
    const db = getScannerDb();
    if (db) {
      const rows = await db.$queryRaw<
        Array<{
          time: Date;
          host: string | null;
          port: string | null;
          status: string | null;
          type: string | null;
          scanner: string;
          tags: string | null;
          raw: unknown;
        }>
      >`
        SELECT time, host, port, status, type, scanner, tags, raw
        FROM scan_results
        WHERE samma_id = ${targetId}
        ORDER BY time DESC
        LIMIT 500
      `;
      results = rows.map((r) => ({ ...r, time: r.time.toISOString() }));
    }
  } catch {
    // Scanner DB unavailable — show empty state
  }

  // Open findings (latest run per scanner), internal and external.
  const openCounts = emptyCounts();
  {
    const db = getScannerDb();
    const internalRuns = db ? await latestRuns(db, [target.id]).catch(() => []) : [];
    const external = await externalResultsForTargets(org.id, [target]);
    for (const r of [...internalRuns, ...external.runs]) {
      for (const s of Object.keys(openCounts) as (keyof typeof openCounts)[]) openCounts[s] += r.severity[s] ?? 0;
    }
  }

  const grouped = results.reduce<Record<string, ScanResult[]>>((acc, row) => {
    const key = row.scanner ?? "unknown";
    (acc[key] ??= []).push(row);
    return acc;
  }, {});
  const scanners = Object.keys(grouped).sort();

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const typeBadgeClass =
    target.type === "ip" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";

  const scannerBadgeClass =
    target.scannerStatus === "DEPLOYED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600";

  const reachBadgeClass =
    target.reachabilityStatus === "UP"
      ? "bg-green-100 text-green-800"
      : target.reachabilityStatus === "DOWN"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href={`/dashboard/profiles/${profileId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {target.profile.name}
        </Link>

        <h1 className="text-2xl font-bold font-mono text-gray-900">{target.value}</h1>
        <Link
          href={`/dashboard/findings?target=${target.id}`}
          className="mt-3 inline-flex items-center gap-3 text-sm text-gray-500 hover:text-samma-navy"
        >
          <span>Open findings</span>
          <SeverityChips counts={openCounts} />
          <span>View findings →</span>
        </Link>
      </div>

      {/* Target metadata */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Target details</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-400 mb-0.5">Value</dt>
              <dd className="font-mono text-gray-900">{target.value}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Type</dt>
              <dd>
                <Badge className={typeBadgeClass}>{target.type.toUpperCase()}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Port</dt>
              <dd className="font-mono text-gray-900">{target.port ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Label</dt>
              <dd className="text-gray-900">{target.label ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Profile</dt>
              <dd className="text-gray-900">{target.profile.name}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Scanner status</dt>
              <dd>
                <Badge className={scannerBadgeClass}>{scannerLabel(target.scannerStatus)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Reachability</dt>
              <dd>
                <Badge className={reachBadgeClass}>{reachabilityLabel(target.reachabilityStatus)}</Badge>
              </dd>
            </div>
            {target.scannerStatus === "LOCAL" && (
              <div className="col-span-full">
                <dt className="text-gray-400 mb-0.5">Why not scanned</dt>
                <dd className="text-gray-600">{LOCAL_TARGET_HINT}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 mb-0.5">Created</dt>
              <dd className="text-gray-900">{formatDate(target.createdAt.toISOString())}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">Updated</dt>
              <dd className="text-gray-900">{formatDate(target.updatedAt.toISOString())}</dd>
            </div>
            <div>
              <dt className="text-gray-400 mb-0.5">ID</dt>
              <dd className="font-mono text-gray-400 text-xs">{target.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* External scans */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">External scans</h2>
        </CardHeader>
        <CardContent className="p-0">
          <ExternalScanResults
            targetId={target.id}
            canScan={target.scannerStatus !== "LOCAL"}
            scanners={enabledScanners.map((e) => ({ connectionId: e.connection.id, name: e.connection.name }))}
            runs={externalRuns.map((r) => ({
              id: r.id,
              connectionName: r.connection.name,
              status: r.status,
              trigger: r.trigger,
              requestedAt: r.requestedAt,
              finishedAt: r.finishedAt,
              result: r.result,
              findingCount: r.findingCount,
              error: r.error,
            }))}
          />
        </CardContent>
      </Card>

      {/* Scan results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Scan results</h2>
            {results.length > 0 && (
              <span className="text-sm text-gray-400">
                {results.length} {results.length === 1 ? "record" : "records"} · {scanners.length}{" "}
                {scanners.length === 1 ? "scanner" : "scanners"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScanResultsAccordion grouped={grouped} scanners={scanners} />
        </CardContent>
      </Card>
    </div>
  );
}
