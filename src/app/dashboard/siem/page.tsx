import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, PlusCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiemAlertsChart } from "@/components/dashboard/siem-alerts-chart";
import { AlertTiles, RulesetBadge, SiemStatusBadge } from "@/components/dashboard/siem-ui";
import { getActiveOrg } from "@/lib/org";
import { getSiemOverview, getSiemProvider, HOSTING_LABEL } from "@/lib/siem";
import { GITHUB_ORG_URL } from "@/lib/constants";
import { formatDate, formatDay } from "@/lib/utils";

// Status and the alert windows depend on the time of the request.
export const dynamic = "force-dynamic";

const th = "px-6 py-3 text-left font-medium text-gray-500";
const td = "px-6 py-3";

export default async function SiemPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const overview = await getSiemOverview(org.id);
  const { instances, subscription, latestRulesets } = overview;
  const subscribed = subscription?.active ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SIEM</h1>
          <p className="mt-1 text-gray-500">
            Your SIEMs, their alerts, and the detection rules they run.
          </p>
        </div>
        <Link href="/dashboard/siem/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New SIEM
        </Link>
      </div>

      {/* Alerts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Alerts</h2>
        </div>
        {overview.reporting === 0 ? (
          <p className="text-sm text-gray-500">
            {instances.length === 0
              ? "No SIEM yet. Alerts show up here once one reports in."
              : "No SIEM has reported yet. Alerts show up here after the first report."}
          </p>
        ) : (
          overview.reporting < instances.length && (
            <p className="text-sm text-gray-500">
              From {overview.reporting} of {instances.length} SIEMs; the others have not reported yet.
            </p>
          )
        )}
        <AlertTiles primary={overview.last24h} secondary={overview.last7d} />
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Alerts per day, last 14 days</h3>
          </CardHeader>
          <CardContent>
            <SiemAlertsChart daily={overview.daily} />
          </CardContent>
        </Card>
      </section>

      {/* SIEMs */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Your SIEMs</h2>
        </CardHeader>
        <CardContent className="p-0">
          {instances.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No SIEMs yet.{" "}
              <Link href="/dashboard/siem/new" className="text-samma-navy hover:underline">
                Deploy one with Ankra or connect one you run
              </Link>
              .
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Hosting</th>
                  <th className={th}>Status</th>
                  <th className={th}>Ruleset / lanes</th>
                  <th className={th}>Alerts (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {instances.map((s) => {
                  const provider = getSiemProvider(s.provider);
                  const alerts = s.stats
                    ? s.stats.last24h.critical + s.stats.last24h.high + s.stats.last24h.medium + s.stats.last24h.low
                    : null;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className={td}>
                        <Link
                          href={`/dashboard/siem/${s.id}`}
                          className="font-medium text-gray-900 hover:text-samma-navy hover:underline"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className={`${td} text-gray-500`}>
                        {HOSTING_LABEL[s.hosting]}
                        {provider && (
                          <span className="block text-xs text-gray-400">
                            {provider.label} · {s.region}
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        <SiemStatusBadge status={s.status} />
                      </td>
                      <td className={td}>
                        {s.lanes.length > 0 ? (
                          <span className="font-mono text-xs text-gray-700">
                            {s.lanes.map((l) => `${l.name} ${l.engine.version ?? "?"}`).join(" · ")}
                          </span>
                        ) : (
                          <RulesetBadge version={s.rulesetVersion} />
                        )}
                      </td>
                      <td className={`${td} text-gray-900`}>
                        {alerts === null ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <>
                            {alerts}
                            {s.stats && s.stats.last24h.critical > 0 && (
                              <span className="ml-2 text-xs font-semibold text-severity-critical">
                                {s.stats.last24h.critical} critical
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest rules */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-samma-navy" />
              <h2 className="text-base font-semibold text-gray-900">Latest rulesets</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              The newest signed ruleset Samma has published for each detection lane.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {latestRulesets.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No rulesets published yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {latestRulesets.map((r) => (
                  <li key={r.lane} className="px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{r.lane}</span>
                      <span className="font-mono text-sm text-gray-700">{r.version}</span>
                      <span className="text-xs text-gray-400">
                        {r.ruleCount} rules · {formatDay(r.createdAt.toISOString())}
                      </span>
                    </div>
                    {r.summary && <p className="mt-1 text-sm text-gray-500">{r.summary}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-samma-navy" />
              <h2 className="text-base font-semibold text-gray-900">Rules subscription</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {subscribed && subscription ? (
              <>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <p className="text-gray-600">
                  Plan <span className="font-mono">{subscription.plan}</span>. Every SIEM in this
                  organisation gets new rulesets as they are released.
                </p>
                {subscription.renewsAt && (
                  <p className="text-gray-400">Renews {formatDate(subscription.renewsAt.toISOString())}</p>
                )}
              </>
            ) : (
              <>
                <Badge className="bg-gray-100 text-gray-700">Not subscribed</Badge>
                <p className="text-gray-600">
                  Subscribe to get Samma&apos;s detection rules as we write them: new attack
                  techniques and new CVEs, tested and shipped to your SIEMs.
                </p>
                <a
                  href={GITHUB_ORG_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Contact us
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
