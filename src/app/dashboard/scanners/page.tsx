import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, CircleDollarSign, Radar, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ConnectExternalScannerForm } from "@/components/dashboard/connect-external-scanner-form";
import { RemoveExternalScannerButton } from "@/components/dashboard/remove-external-scanner-button";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { GUIDE_LINKS } from "@/lib/constants";
import { formatPrice, getExternalScanner } from "@/lib/external-scanners";
import { isSecretBoxConfigured } from "@/lib/secret-box";
import { getScannerDashboard } from "@/lib/scanner-runs";
import { refreshExternalScans } from "@/lib/external-scans";

// Run times and the 30-day window depend on the time of the request.
export const dynamic = "force-dynamic";

const RECENT_RUNS = 50;

const th = "px-6 py-3 text-left font-medium text-gray-500";
const td = "px-6 py-3";

function KindBadge({ kind }: { kind: "internal" | "external" }) {
  return (
    <Badge
      className={
        kind === "external" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
      }
    >
      {kind === "external" ? "External" : "Internal"}
    </Badge>
  );
}

function DemoBadge() {
  return <Badge className="bg-amber-100 text-amber-800">Demo data</Badge>;
}

export default async function ScannersPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  // Fetch results of external runs still in progress before reading them.
  await refreshExternalScans(org.id);

  const [connections, dashboard] = await Promise.all([
    prisma.externalScannerConnection.findMany({
      where: { organisationId: org.id },
      include: { profiles: { include: { profile: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    getScannerDashboard(org.id),
  ]);

  const { scanners, runs, internalIsDemo, totals30d } = dashboard;
  const configured = isSecretBoxConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanners</h1>
        <p className="text-gray-500 mt-1">
          Internal and external scanners, when they ran, against which targets, and what they cost.
        </p>
      </div>

      {/* Connect external scanners */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Connect external scanners</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add a third-party scanner with its API key. To run it, create a new profile (target
                group), add the targets you want scanned, and enable the scanner on that profile.{" "}
                <a
                  href={GUIDE_LINKS.externalScanners}
                  target="_blank"
                  rel="noreferrer"
                  className="text-samma-navy hover:underline"
                >
                  Read the guide
                </a>
                .
              </p>
              {!configured && (
                <p className="text-sm text-amber-700 mt-2">
                  This server has no <code className="text-xs bg-amber-50 px-1 rounded">SCANNER_SECRET_KEY</code>,
                  so API keys cannot be stored yet.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <ConnectExternalScannerForm />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {connections.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No external scanners connected yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Scanner</th>
                  <th className={th}>API key</th>
                  <th className={th}>Price</th>
                  <th className={th}>Profiles</th>
                  <th className={th}>Connected</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {connections.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className={`${td} text-gray-900`}>{c.name}</td>
                    <td className={`${td} text-gray-500`}>
                      {getExternalScanner(c.scannerId)?.label ?? c.scannerId}
                    </td>
                    <td className={`${td} font-mono text-gray-500`}>••••{c.apiKeyLast4}</td>
                    <td className={`${td} text-gray-500`}>
                      {formatPrice(c.pricePerScanCents, c.currency)} / scan
                    </td>
                    <td className={td}>
                      {c.profiles.length === 0 ? (
                        <span className="text-gray-400">Not enabled on any profile</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.profiles.map(({ profile }) => (
                            <Link
                              key={profile.id}
                              href={`/dashboard/profiles/${profile.id}`}
                              className="text-samma-navy hover:underline"
                            >
                              {profile.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${td} text-gray-400`}>
                      {formatDate(c.createdAt.toISOString())}
                    </td>
                    <td className={`${td} text-right`}>
                      <RemoveExternalScannerButton connectionId={c.id} connectionName={c.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active scanners (30 days)" value={totals30d.activeScanners} icon={Radar} />
        <StatCard label="Runs (30 days)" value={totals30d.runs} icon={Activity} />
        <StatCard label="Targets covered" value={totals30d.targets} icon={Target} />
        <StatCard
          label="External spend (30 days)"
          value={formatPrice(totals30d.spendCents)}
          icon={CircleDollarSign}
        />
      </div>

      {/* Scanners */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Scanners</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className={th}>Scanner</th>
                <th className={th}>Type</th>
                <th className={th}>Last run</th>
                <th className={th}>Targets</th>
                <th className={th}>Runs (30d)</th>
                <th className={th}>Price / scan</th>
                <th className={th}>Spend (30d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scanners.map((s) => (
                <tr key={s.key} className="hover:bg-gray-50">
                  <td className={`${td} text-gray-900`}>
                    <span className="mr-2">{s.label}</span>
                    {s.demo && <DemoBadge />}
                  </td>
                  <td className={td}>
                    <KindBadge kind={s.kind} />
                  </td>
                  <td className={`${td} text-gray-400`}>
                    {s.lastRun ? formatDate(s.lastRun.toISOString()) : "Never"}
                  </td>
                  <td className={`${td} text-gray-500`}>{s.targets}</td>
                  <td className={`${td} text-gray-500`}>{s.runs30d}</td>
                  <td className={`${td} text-gray-500`}>
                    {s.kind === "internal" ? "Included" : formatPrice(s.pricePerScanCents, s.currency)}
                  </td>
                  <td className={`${td} text-gray-900`}>
                    {s.kind === "internal" ? "—" : formatPrice(s.spend30dCents, s.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent runs */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Recent runs</h2>
          <p className="text-sm text-gray-500 mt-1">
            {internalIsDemo
              ? "No scan results database here, so internal runs are demo data. "
              : "Internal runs show the latest run per scanner and target. "}
            External runs show every run; running ones are checked again each time this page opens.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {runs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No runs yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Scanner</th>
                  <th className={th}>Target</th>
                  <th className={th}>Outcome</th>
                  <th className={th}>Findings</th>
                  <th className={th}>Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {runs.slice(0, RECENT_RUNS).map((r, i) => (
                  <tr key={`${r.scanner}-${r.targetId}-${r.time.getTime()}-${i}`} className="hover:bg-gray-50">
                    <td className={`${td} text-gray-400`}>{formatDate(r.time.toISOString())}</td>
                    <td className={td}>
                      <span className="mr-2 text-gray-900">{r.scannerLabel}</span>
                      <KindBadge kind={r.kind} />
                    </td>
                    <td className={`${td} font-mono`}>
                      {r.profileId ? (
                        <Link
                          href={`/dashboard/profiles/${r.profileId}/targets/${r.targetId}`}
                          className="text-gray-900 hover:text-samma-navy hover:underline"
                        >
                          {r.targetValue}
                        </Link>
                      ) : (
                        <span className="text-gray-500">{r.targetValue}</span>
                      )}
                    </td>
                    <td className={td}>
                      <Badge
                        className={
                          r.outcome === "failed"
                            ? "bg-red-100 text-red-800"
                            : r.outcome === "running"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {r.outcome}
                      </Badge>
                    </td>
                    <td className={`${td} text-gray-500`}>{r.findingCount}</td>
                    <td className={`${td} text-gray-900`}>
                      {r.kind === "internal" ? "—" : formatPrice(r.costCents, r.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
