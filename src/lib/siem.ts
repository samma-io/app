// SIEM section of the dashboard: SIEMs an org owns, their (demo) alert counts
// and the ruleset each one runs.
//
// Nothing here talks to a SIEM yet. Ankra deploys are mocked (status derived
// from createdAt) and alert counts are demo data (src/data/mock-siem.ts) until
// SIEMs report in with their key.

import type { SiemHosting, SiemInstance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LATEST_RULESET } from "@/lib/siem-rules";
import {
  demoRulesetVersion,
  demoSiemStats,
  sumCounts,
  type AlertCounts,
  type DailyAlerts,
  type DemoSiemStats,
} from "@/data/mock-siem";

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
  if (s.hosting === "CONNECTED") return "waiting";
  return now.getTime() - s.createdAt.getTime() < MOCK_DEPLOY_MS ? "deploying" : "running";
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
  rulesetVersion: string | null; // null while deploying
  rulesetOutdated: boolean;
  stats: DemoSiemStats | null; // null while deploying
  demo: boolean;
}

function toView(s: SiemInstance, now: Date): SiemView {
  const status = siemStatus(s, now);
  const deploying = status === "deploying";
  // Ankra deploys are managed by Samma and get the latest ruleset; a connected
  // SIEM runs whatever it reports (demo until it reports).
  const rulesetVersion = deploying
    ? null
    : s.rulesetVersion ?? (s.hosting === "CONNECTED" ? demoRulesetVersion(s.id) : LATEST_RULESET.version);
  return {
    id: s.id,
    name: s.name,
    hosting: s.hosting,
    provider: s.provider,
    region: s.region,
    apiKeyLast4: s.apiKeyLast4,
    createdAt: s.createdAt,
    status,
    rulesetVersion,
    rulesetOutdated: rulesetVersion !== null && rulesetVersion !== LATEST_RULESET.version,
    stats: deploying ? null : demoSiemStats(s.id, now),
    demo: true,
  };
}

export interface SiemOverview {
  instances: SiemView[];
  // Org-wide alerts. With no SIEM yet these are example numbers (example: true).
  last24h: AlertCounts;
  last7d: AlertCounts;
  daily: DailyAlerts[];
  example: boolean;
  subscription: { plan: string; active: boolean; renewsAt: Date | null } | null;
}

export async function getSiemOverview(orgId: string): Promise<SiemOverview> {
  const now = new Date();
  const [rows, subscription] = await Promise.all([
    prisma.siemInstance.findMany({ where: { organisationId: orgId }, orderBy: { createdAt: "asc" } }),
    prisma.siemSubscription.findUnique({ where: { organisationId: orgId } }),
  ]);
  const instances = rows.map((r) => toView(r, now));
  const withStats = instances.flatMap((i) => (i.stats ? [i.stats] : []));

  const example = instances.length === 0;
  const stats = example ? [demoSiemStats(orgId, now)] : withStats;
  const daily = (stats[0]?.daily ?? demoSiemStats(orgId, now).daily).map((d, idx) => ({
    day: d.day,
    ...sumCounts(stats.map((s) => s.daily[idx])),
  }));

  return {
    instances,
    last24h: sumCounts(stats.map((s) => s.last24h)),
    last7d: sumCounts(stats.map((s) => s.last7d)),
    daily,
    example,
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
