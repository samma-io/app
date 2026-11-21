import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge, SeverityChips, SeverityTiles } from "@/components/dashboard/severity-tiles";
import { getActiveOrg } from "@/lib/org";
import { formatDate } from "@/lib/utils";
import { scannerDisplayName } from "@/lib/constants";
import { getVulnerabilitySummary } from "@/lib/vulnerability-summary";

// Counts and scanner status depend on the time of the request.
export const dynamic = "force-dynamic";

const th = "px-6 py-3 text-left font-medium text-gray-500";

const STATUS_BADGE = {
  ok: { label: "OK", className: "bg-green-100 text-green-800" },
  stale: { label: "Stale", className: "bg-amber-100 text-amber-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

export default async function DashboardPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const summary = await getVulnerabilitySummary(org.id);
  const { totals, byTarget, scanners, topFindings, coverage, dbConfigured } = summary;
  const targetHref = (profileId: string, targetId: string) =>
    `/dashboard/profiles/${profileId}/targets/${targetId}`;
  const profileOf = new Map(byTarget.map((t) => [t.id, t.profileId]));

  const hasTargets = coverage.targets > 0;
  const hasResults = scanners.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">
          Open findings across your targets, from the latest run of each scanner.
        </p>
      </div>

      {!hasTargets ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            No targets yet.{" "}
            <Link href="/dashboard/profiles" className="text-samma-navy hover:underline">
              Add a target
            </Link>{" "}
            to start scanning.
          </CardContent>
        </Card>
      ) : (
        <>
          <SeverityTiles counts={totals} hrefFor={(s) => `/dashboard/findings?severity=${s}`} />

          {!dbConfigured && (
            <p className="text-sm text-amber-700">
              Scan results from Samma&apos;s scanners are not available here, so internal findings are
              not counted.
            </p>
          )}
          {dbConfigured && !hasResults && (
            <p className="text-sm text-gray-500">
              No scan results yet. Scans start when a target is added; results appear within a few
              minutes.
            </p>
          )}

          <div className="grid gap-6 xl:grid-cols-5">
            {/* Top findings */}
            <Card className="xl:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Top findings</h2>
                  <Link href="/dashboard/findings" className="text-sm text-samma-navy hover:underline">
                    View all findings →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {topFindings.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">
                    No critical, high or medium findings.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {topFindings.map((f, i) => {
                      const profileId = profileOf.get(f.targetId);
                      return (
                        <li key={`${f.targetId}-${f.scanner}-${f.checkId ?? i}`} className="flex items-center gap-3 px-6 py-3">
                          <SeverityBadge severity={f.severity} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-900">{f.title ?? f.checkId ?? "Finding"}</p>
                            <p className="text-xs text-gray-400">
                              {profileId ? (
                                <Link
                                  href={targetHref(profileId, f.targetId)}
                                  className="font-mono text-gray-600 hover:text-samma-navy hover:underline"
                                >
                                  {f.target ?? f.targetId}
                                </Link>
                              ) : (
                                <span className="font-mono">{f.target ?? f.targetId}</span>
                              )}{" "}
                              · {scannerDisplayName(f.scanner)}
                            </p>
                          </div>
                          <span className="hidden text-xs text-gray-400 sm:inline">{formatDate(f.time)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Scanner status */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Scanner status</h2>
                  <Link href="/dashboard/scanners" className="text-sm text-samma-navy hover:underline">
                    Scanners →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {scanners.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">No scanner has run yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {scanners.map((s) => (
                        <tr key={s.scanner}>
                          <td className="px-6 py-2.5">
                            <Link
                              href={`/dashboard/findings?scanner=${encodeURIComponent(s.scanner)}`}
                              className="text-gray-900 hover:text-samma-navy hover:underline"
                            >
                              {scannerDisplayName(s.scanner)}
                            </Link>
                            {s.kind === "external" && (
                              <Badge className="ml-2 bg-purple-100 text-purple-800">External</Badge>
                            )}
                            <p className="text-xs text-gray-400">
                              {s.targets} {s.targets === 1 ? "target" : "targets"} · {s.findings}{" "}
                              {s.findings === 1 ? "finding" : "findings"}
                              {s.lastRun && <> · {formatDate(s.lastRun)}</>}
                            </p>
                          </td>
                          <td className="px-6 py-2.5 text-right">
                            <Badge className={STATUS_BADGE[s.status].className}>
                              {STATUS_BADGE[s.status].label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Targets by risk */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Targets by risk</h2>
              <p className="text-sm text-gray-500 mt-1">
                {coverage.scanned} of {coverage.targets} {coverage.targets === 1 ? "target" : "targets"} scanned
                {coverage.local > 0 && <> · {coverage.local} local (not scanned)</>} · {coverage.profiles}{" "}
                <Link href="/dashboard/profiles" className="text-samma-navy hover:underline">
                  {coverage.profiles === 1 ? "profile" : "profiles"}
                </Link>
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className={th}>Target</th>
                    <th className={th}>Profile</th>
                    <th className={th}>
                      <span title="Critical · High · Medium · Low">C · H · M · L</span>
                    </th>
                    <th className={th}>Last scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byTarget.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link
                          href={targetHref(t.profileId, t.id)}
                          className="font-mono text-gray-900 hover:text-samma-navy hover:underline"
                        >
                          {t.value}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{t.profileName}</td>
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/findings?target=${t.id}`}>
                          <SeverityChips counts={t.counts} />
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {t.lastScanned ? formatDate(t.lastScanned) : "Not scanned"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
