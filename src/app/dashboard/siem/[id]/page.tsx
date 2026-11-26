import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiemAlertsChart } from "@/components/dashboard/siem-alerts-chart";
import { RotateSiemKeyButton } from "@/components/dashboard/rotate-siem-key-button";
import { RemoveSiemButton } from "@/components/dashboard/remove-siem-button";
import { SiemSharingToggle } from "@/components/dashboard/siem-sharing-toggle";
import {
  AlertTiles,
  DemoBadge,
  LevelBadge,
  RulesetBadge,
  SiemStatusBadge,
} from "@/components/dashboard/siem-ui";
import { getActiveOrg, getActiveOrgRole } from "@/lib/org";
import { countSharedIndicators } from "@/lib/siem-exchange";
import {
  getSiemInstance,
  getSiemProvider,
  HOSTING_LABEL,
  laneEventsPerMinute,
  totalAlerts,
} from "@/lib/siem";
import { ALERT_LEVELS } from "@/data/mock-siem";
import { getRuleset, LATEST_RULESET, rulesIncludedIn, rulesMissingFrom } from "@/lib/siem-rules";
import { formatDate, formatDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

const th = "px-6 py-3 text-left font-medium text-gray-500";
const td = "px-6 py-3";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`mr-2 inline-block h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
      aria-hidden
    />
  );
}

export default async function SiemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const { id } = await params;
  const siem = await getSiemInstance(org.id, id);
  if (!siem) notFound();

  const [role, shared] = await Promise.all([
    getActiveOrgRole(),
    countSharedIndicators(siem.id),
  ]);
  const provider = getSiemProvider(siem.provider);
  const ruleset = getRuleset(siem.rulesetVersion);
  const missing = siem.rulesetVersion ? rulesMissingFrom(siem.rulesetVersion) : [];
  const included = siem.rulesetVersion ? rulesIncludedIn(siem.rulesetVersion) : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/siem" className="text-sm text-gray-500 hover:text-samma-navy">
          ← SIEM
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{siem.name}</h1>
          <SiemStatusBadge status={siem.status} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-gray-500">Hosting</p>
            <p className="mt-1 text-gray-900">{HOSTING_LABEL[siem.hosting]}</p>
            {provider && (
              <p className="text-xs text-gray-400">
                {provider.label} · {siem.region}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500">{siem.reportedAt ? "Last report" : "Ruleset"}</p>
            {siem.reportedAt ? (
              <>
                <p className="mt-1 text-gray-900">{formatDate(siem.reportedAt.toISOString())}</p>
                {siem.reporterVersion && (
                  <p className="font-mono text-xs text-gray-400">reporter {siem.reporterVersion}</p>
                )}
              </>
            ) : (
              <p className="mt-1">
                <RulesetBadge version={siem.rulesetVersion} />
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500">SIEM key</p>
            <p className="mt-1 font-mono text-gray-900">••••{siem.apiKeyLast4}</p>
          </div>
          <div>
            <p className="text-gray-500">Added</p>
            <p className="mt-1 text-gray-900">{formatDate(siem.createdAt.toISOString())}</p>
          </div>
        </CardContent>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100">
          <RotateSiemKeyButton siemId={siem.id} />
          <RemoveSiemButton siemId={siem.id} siemName={siem.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Share attackers with Samma</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${siem.shareIndicators ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
            >
              {siem.shareIndicators ? "On" : "Off"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            When on, this SIEM sends the source IP and rule of each attack it detects. Nothing about the host or
            request that was attacked is sent. An address reported by several organisations goes on the community
            blocklist that every subscriber can use. Reports are kept for 7 days.
          </p>
          {siem.shareIndicators && (
            <p className="text-gray-900">
              {shared} {shared === 1 ? "address" : "addresses"} shared in the last 7 days.
            </p>
          )}
          <SiemSharingToggle siemId={siem.id} on={siem.shareIndicators} canChange={role === "OWNER"} />
        </CardContent>
      </Card>

      {siem.status === "deploying" ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            Ankra is deploying this SIEM. Alerts and the ruleset show up here when it is running.
          </CardContent>
        </Card>
      ) : (
        siem.stats && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Alerts</h2>
              {siem.demo && <DemoBadge />}
            </div>
            {siem.status === "down" && !siem.demo && (
              <p className="text-sm text-red-700">
                This SIEM stopped reporting. The numbers below are from its last report.
              </p>
            )}
            <AlertTiles primary={siem.stats.last24h} secondary={siem.stats.last7d} />
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Alerts per day, last 14 days</h3>
              </CardHeader>
              <CardContent>
                <SiemAlertsChart daily={siem.stats.daily} />
              </CardContent>
            </Card>
          </section>
        )
      )}

      {siem.lanes.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Detection lanes</h2>
            <p className="mt-1 text-sm text-gray-500">
              One detection engine per log source, with the version it runs and what it saw.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className={th}>Lane</th>
                  <th className={th}>Engine version</th>
                  <th className={th}>Rules</th>
                  <th className={th}>Alerts (24h)</th>
                  <th className={th}>Events / min</th>
                  <th className={th}>Waiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {siem.lanes.map((l) => {
                  const perMinute = laneEventsPerMinute(l, siem.intervalSeconds);
                  return (
                    <tr key={l.name}>
                      <td className={`${td} font-medium text-gray-900`}>
                        <Dot ok={l.engine.ready} />
                        {l.name}
                        {!l.engine.ready && <span className="ml-2 text-xs text-red-700">not ready</span>}
                      </td>
                      <td className={`${td} font-mono text-gray-900`}>{l.engine.version ?? "—"}</td>
                      <td className={td}>
                        <span className="text-gray-900">{totalAlerts(l.engine.rules)}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {ALERT_LEVELS.filter((lv) => l.engine.rules[lv] > 0)
                            .map((lv) => `${l.engine.rules[lv]} ${lv}`)
                            .join(" · ")}
                        </span>
                      </td>
                      <td className={td}>
                        {l.alerts ? (
                          <>
                            <span className="text-gray-900">{totalAlerts(l.alerts.last24h)}</span>
                            <span className="ml-2 text-xs text-gray-400">
                              {ALERT_LEVELS.filter((lv) => l.alerts!.last24h[lv] > 0)
                                .map((lv) => `${l.alerts!.last24h[lv]} ${lv}`)
                                .join(" · ")}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`${td} text-gray-900`}>{perMinute ?? "—"}</td>
                      <td className={`${td} text-gray-900`}>{l.flow.pending ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {siem.components.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Ingest components</h2>
            <p className="mt-1 text-sm text-gray-500">
              The workloads that receive, store and route events in this SIEM.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className={th}>Component</th>
                  <th className={th}>Kind</th>
                  <th className={th}>Ready</th>
                  <th className={th}>Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {siem.components.map((c) => {
                  const stopped = c.desired === 0;
                  return (
                    <tr key={`${c.kind}/${c.name}`}>
                      <td className={`${td} font-medium text-gray-900`}>
                        {stopped ? (
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gray-300" aria-hidden />
                        ) : (
                          <Dot ok={c.ready >= c.desired} />
                        )}
                        {c.name}
                      </td>
                      <td className={`${td} text-gray-500`}>{c.kind}</td>
                      <td className={`${td} text-gray-900`}>
                        {stopped ? <span className="text-gray-400">Scaled to 0</span> : `${c.ready}/${c.desired}`}
                      </td>
                      <td className={`${td} font-mono text-gray-900`}>{c.version ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {siem.rulesetVersion && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Deployed ruleset</h2>
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-mono">{siem.rulesetVersion}</span>
              {ruleset && (
                <>
                  {" "}
                  · {ruleset.ruleCount} rules · released {formatDay(ruleset.releasedAt)}
                </>
              )}
              {missing.length > 0 && (
                <>
                  {" "}
                  · <span className="font-mono">{LATEST_RULESET.version}</span> adds {missing.length}{" "}
                  rule{missing.length === 1 ? "" : "s"}
                </>
              )}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-50">
              {missing.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 bg-orange-50/50 px-6 py-3 text-sm">
                  <LevelBadge level={r.level} />
                  <span className="text-gray-900">{r.title}</span>
                  {r.cve && <span className="font-mono text-xs text-gray-500">{r.cve}</span>}
                  <span className="ml-auto text-xs text-orange-700">Not deployed · in {r.addedIn}</span>
                </li>
              ))}
              {included.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 px-6 py-3 text-sm">
                  <LevelBadge level={r.level} />
                  <span className="text-gray-900">{r.title}</span>
                  {r.cve && <span className="font-mono text-xs text-gray-500">{r.cve}</span>}
                  <span className="ml-auto text-xs text-green-700">Deployed · {r.addedIn}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
