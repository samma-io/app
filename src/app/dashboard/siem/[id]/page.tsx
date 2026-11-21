import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiemAlertsChart } from "@/components/dashboard/siem-alerts-chart";
import { RotateSiemKeyButton } from "@/components/dashboard/rotate-siem-key-button";
import { RemoveSiemButton } from "@/components/dashboard/remove-siem-button";
import {
  AlertTiles,
  DemoBadge,
  LevelBadge,
  RulesetBadge,
  SiemStatusBadge,
} from "@/components/dashboard/siem-ui";
import { getActiveOrg } from "@/lib/org";
import { getSiemInstance, getSiemProvider, HOSTING_LABEL } from "@/lib/siem";
import { getRuleset, LATEST_RULESET, rulesIncludedIn, rulesMissingFrom } from "@/lib/siem-rules";
import { formatDate, formatDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SiemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");

  const { id } = await params;
  const siem = await getSiemInstance(org.id, id);
  if (!siem) notFound();

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
            <p className="text-gray-500">Ruleset</p>
            <p className="mt-1">
              <RulesetBadge version={siem.rulesetVersion} />
            </p>
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
              <DemoBadge />
            </div>
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
