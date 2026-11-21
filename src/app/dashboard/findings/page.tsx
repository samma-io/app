import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FindingsList } from "@/components/dashboard/findings-list";
import { SeverityBadge, severityLabel } from "@/components/dashboard/severity-tiles";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";
import { latestFindings, parseSeverities, SEVERITIES, type Finding } from "@/lib/scan-results";
import { externalResultsForTargets } from "@/lib/external-results";
import { emptyCounts, sortFindings, toFindingRows } from "@/lib/vulnerability-summary";
import { scannerDisplayName } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIMIT = 500;

interface Props {
  searchParams: Promise<{ severity?: string; scanner?: string; target?: string }>;
}

export default async function FindingsPage({ searchParams }: Props) {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const sp = await searchParams;
  const severities = parseSeverities(sp.severity ?? null) ?? [];
  const scanner = sp.scanner || undefined;

  // Every target of the org, or the one asked for — which must be the org's.
  const targets = await prisma.target.findMany({
    where: { profile: { organisationId: org.id }, ...(sp.target ? { id: sp.target } : {}) },
    select: { id: true, value: true, profileId: true },
  });
  if (sp.target && targets.length === 0) notFound();

  const ids = targets.map((t) => t.id);
  const targetValues = new Map(targets.map((t) => [t.id, t.value]));

  let internal: Finding[] = [];
  let dbAvailable = getScannerDb() !== null;
  const db = getScannerDb();
  if (db && ids.length > 0 && !scanner?.startsWith("external:")) {
    try {
      internal = await latestFindings(db, ids, { scanner, limit: LIMIT, targetValues });
    } catch (err) {
      console.error("[findings] scan_results query failed:", err);
      dbAvailable = false;
    }
  }
  const external = await externalResultsForTargets(org.id, targets, { scanner });

  const all = sortFindings([...internal, ...external.results]);
  const counts = emptyCounts();
  for (const f of all) {
    const s = (f.severity ?? "").toUpperCase() as keyof typeof counts;
    if (s in counts) counts[s]++;
  }
  const shown = severities.length ? all.filter((f) => severities.includes((f.severity ?? "").toUpperCase())) : all;
  const scanners = [...new Set(all.map((f) => f.scanner))].sort();

  const rows = toFindingRows(
    shown,
    new Map(targets.map((t) => [t.id, t.profileId])),
    scannerDisplayName
  );

  // Build a link that keeps the other filters.
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const next = { severity: sp.severity, scanner: sp.scanner, target: sp.target, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    const s = q.toString();
    return `/dashboard/findings${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-sm",
      active ? "border-samma-navy bg-samma-navy text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
    );

  const targetName = sp.target ? targets[0]?.value : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Overview
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Findings{targetName && <span className="font-mono text-gray-500"> · {targetName}</span>}
        </h1>
        <p className="text-gray-500 mt-1">
          Open findings: the results of the latest run of each scanner on each target.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href({ severity: undefined })} className={chip(severities.length === 0)}>
            All <span className="opacity-70">{all.length}</span>
          </Link>
          {SEVERITIES.map((s) => (
            <Link
              key={s}
              href={href({ severity: s })}
              className={chip(severities.length === 1 && severities[0] === s)}
            >
              {severityLabel(s)} <span className="opacity-70">{counts[s]}</span>
            </Link>
          ))}
        </div>
        {scanners.length > 1 || scanner ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-400">Scanner</span>
            <Link href={href({ scanner: undefined })} className={chip(!scanner)}>
              Any
            </Link>
            {(scanner && !scanners.includes(scanner) ? [...scanners, scanner] : scanners).map((s) => (
              <Link key={s} href={href({ scanner: s })} className={chip(scanner === s)}>
                {scannerDisplayName(s)}
              </Link>
            ))}
          </div>
        ) : null}
        {sp.target && (
          <p className="text-sm">
            <Link href={href({ target: undefined })} className="text-samma-navy hover:underline">
              Show all targets
            </Link>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {severities.length === 1 && <SeverityBadge severity={severities[0]} />}
            <h2 className="text-base font-semibold text-gray-900">
              {shown.length} {shown.length === 1 ? "finding" : "findings"}
            </h2>
          </div>
          {!dbAvailable && (
            <p className="mt-1 text-sm text-amber-700">
              Scan results from Samma&apos;s scanners are not available here; only external scanner
              results are shown.
            </p>
          )}
          {internal.length >= LIMIT && (
            <p className="mt-1 text-sm text-gray-500">Showing the {LIMIT} most severe internal findings.</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <FindingsList rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
