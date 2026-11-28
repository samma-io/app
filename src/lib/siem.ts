// SIEM section of the dashboard: SIEMs an org owns, their alert counts, lanes
// and the ruleset each one runs.
//
// A SIEM that runs the reporter posts to /api/v1/siem/report with its key; the
// latest report is stored on the SiemInstance and shown as is. A SIEM that has
// never reported has no numbers. Ankra deploys are still mocked: "Deploying"
// for a few minutes after createdAt, then waiting for the first report.

import type { SiemHosting, SiemInstance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DAILY_DAYS,
  parseSiemReport,
  type SiemReport,
  type SiemReportComponent,
  type SiemReportLane,
} from "@/lib/siem-report";
import {
  ALERT_LEVELS,
  emptyCounts,
  sumCounts,
  type AlertCounts,
  type DailyAlerts,
  type SiemStats,
} from "@/lib/siem-alerts";

export const HOSTING_LABEL: Record<SiemHosting, string> = {
  ANKRA_SAMMA: "Ankra · Samma hosting",
  ANKRA_OWN: "Ankra · your hosting",
  CONNECTED: "Connected",
};

// Where an Ankra deploy on "your hosting" can go. Ids are stored in
// SiemInstance.provider / .region, so only append.
export const SIEM_PROVIDERS = [
  { id: "aws", label: "AWS", regions: ["eu-north-1", "eu-central-1", "eu-west-1", "us-east-1"] },
  { id: "gcp", label: "Google Cloud", regions: ["europe-north1", "europe-west1", "us-central1"] },
  { id: "azure", label: "Azure", regions: ["swedencentral", "westeurope", "eastus"] },
  { id: "hetzner", label: "Hetzner", regions: ["hel1", "fsn1", "nbg1"] },
  { id: "own-k8s", label: "Your own Kubernetes", regions: ["on-premises"] },
] as const;

export function getSiemProvider(id: string | null | undefined) {
  return SIEM_PROVIDERS.find((p) => p.id === id);
}

// How long a mocked Ankra deploy shows as deploying.
export const MOCK_DEPLOY_MS = 3 * 60 * 1000;
// A connected SIEM that reported within this window is Running.
export const SIEM_SEEN_WINDOW_MS = 15 * 60 * 1000;

export type SiemStatus = "deploying" | "running" | "waiting" | "down";

export const STATUS_LABEL: Record<SiemStatus, string> = {
  deploying: "Deploying",
  running: "Running",
  waiting: "Waiting for first contact",
  down: "Not reporting",
};

export function siemStatus(
  s: Pick<SiemInstance, "hosting" | "createdAt" | "lastSeenAt">,
  now: Date = new Date()
): SiemStatus {
  if (s.lastSeenAt) {
    return now.getTime() - s.lastSeenAt.getTime() < SIEM_SEEN_WINDOW_MS ? "running" : "down";
  }
  if (s.hosting !== "CONNECTED" && now.getTime() - s.createdAt.getTime() < MOCK_DEPLOY_MS) return "deploying";
  return "waiting";
}

export interface SiemView {
  id: string;
  name: string;
  hosting: SiemHosting;
  provider: string | null;
  region: string | null;
  apiKeyLast4: string;
  createdAt: Date;
  status: SiemStatus;
  rulesetVersion: string | null; // as reported by the SIEM; null until it reports one
  stats: SiemStats | null; // null until the SIEM reports
  // From the SIEM's latest report; empty until it reports.
  lanes: SiemReportLane[];
  components: SiemReportComponent[];
  reportedAt: Date | null;
  shareIndicators: boolean; // opted in to sending attacker IPs (rule exchange)
  reporterVersion: string | null;
  intervalSeconds: number | null;
}

/** The last 14 days ending today, so several SIEMs line up day by day. */
function lastDays(now: Date, byDay: Map<string, AlertCounts> = new Map()): DailyAlerts[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daily: DailyAlerts[] = [];
  for (let i = DAILY_DAYS - 1; i >= 0; i--) {
    const day = new Date(today - i * 86_400_000).toISOString().slice(0, 10);
    const row = byDay.get(day);
    daily.push({ day, ...(row ? sumCounts([row]) : emptyCounts()) });
  }
  return daily;
}

/** Alert stats of a report. */
function reportStats(report: SiemReport, now: Date): SiemStats {
  const measured = report.lanes.flatMap((l) => (l.alerts ? [l.alerts] : []));
  const daily = lastDays(now, new Map(report.daily.map((d) => [d.day, d])));
  return {
    last24h: sumCounts(measured.map((a) => a.last24h)),
    last7d: sumCounts(measured.map((a) => a.last7d)),
    daily,
  };
}

/** Events per minute a lane evaluated over the last report interval, or null. */
export function laneEventsPerMinute(lane: SiemReportLane, intervalSeconds: number | null): number | null {
  if (lane.flow.eventsSinceLast === null || !intervalSeconds) return null;
  return Math.round((lane.flow.eventsSinceLast / intervalSeconds) * 60);
}

export function totalAlerts(c: AlertCounts): number {
  return ALERT_LEVELS.reduce((n, l) => n + c[l], 0);
}

function toView(s: SiemInstance, now: Date): SiemView {
  const status = siemStatus(s, now);
  // The stored report was validated on the way in; validate again on the way
  // out so an older shape can never break the page.
  const parsed = s.report === null ? null : parseSiemReport(s.report);
  const report = parsed?.ok ? parsed.report : null;
  return {
    id: s.id,
    name: s.name,
    hosting: s.hosting,
    provider: s.provider,
    region: s.region,
    apiKeyLast4: s.apiKeyLast4,
    createdAt: s.createdAt,
    status,
    rulesetVersion: report ? s.rulesetVersion : null,
    stats: report ? reportStats(report, now) : null,
    lanes: report?.lanes ?? [],
    components: report?.components ?? [],
    reportedAt: report ? s.lastSeenAt : null,
    shareIndicators: s.shareIndicators,
    reporterVersion: report?.reporterVersion ?? null,
    intervalSeconds: report?.intervalSeconds ?? null,
  };
}

export interface SiemOverview {
  instances: SiemView[];
  // Org-wide alerts, summed over the SIEMs that have reported.
  last24h: AlertCounts;
  last7d: AlertCounts;
  daily: DailyAlerts[];
  reporting: number; // SIEMs with a report
  latestRulesets: LatestRuleset[]; // newest published ruleset per lane
  subscription: { plan: string; active: boolean; renewsAt: Date | null } | null;
}

export interface LatestRuleset {
  lane: string;
  version: string;
  ruleCount: number;
  summary: string; // "" when none
  createdAt: Date;
}

export async function getSiemOverview(orgId: string): Promise<SiemOverview> {
  const now = new Date();
  const [rows, subscription, latestRulesets] = await Promise.all([
    prisma.siemInstance.findMany({ where: { organisationId: orgId }, orderBy: { createdAt: "asc" } }),
    prisma.siemSubscription.findUnique({ where: { organisationId: orgId } }),
    prisma.siemRuleRelease.findMany({
      distinct: ["lane"],
      orderBy: [{ lane: "asc" }, { createdAt: "desc" }],
      select: { lane: true, version: true, ruleCount: true, summary: true, createdAt: true },
    }),
  ]);
  const instances = rows.map((r) => toView(r, now));
  const stats = instances.flatMap((i) => (i.stats ? [i.stats] : []));
  const daily = lastDays(now).map((d, idx) => ({
    day: d.day,
    ...sumCounts([d, ...stats.map((s) => s.daily[idx])]),
  }));

  return {
    instances,
    last24h: sumCounts(stats.map((s) => s.last24h)),
    last7d: sumCounts(stats.map((s) => s.last7d)),
    daily,
    reporting: stats.length,
    latestRulesets,
    subscription: subscription
      ? { plan: subscription.plan, active: subscription.active, renewsAt: subscription.renewsAt }
      : null,
  };
}

/** One SIEM of the org, or null (callers return 404). */
export async function getSiemInstance(orgId: string, id: string): Promise<SiemView | null> {
  const row = await prisma.siemInstance.findFirst({ where: { id, organisationId: orgId } });
  return row ? toView(row, new Date()) : null;
}
