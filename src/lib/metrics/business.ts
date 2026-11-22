import { prisma } from "@/lib/prisma";
import { getScannerDb } from "@/lib/scanner-db";
import { READY_WINDOW_MS } from "@/lib/clusters";
import { siemStatus } from "@/lib/siem";
import { gauge } from "@/lib/metrics/registry";

// Business gauges read from the app database and the scanner TimescaleDB.
//
// Totals across all organisations only: no organisation, user or target ever
// becomes a label. Prometheus scrapes every 30 s, so the queries run at most
// once per REFRESH_MS and every gauge of one scrape shares that refresh. A
// failing database never breaks /api/metrics: samma_app_business_metrics_up
// goes to 0 for it and the previous values stay.

const REFRESH_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);

let lastRefresh = 0;
let inflight: Promise<void> | null = null;

async function collect(): Promise<void> {
  if (Date.now() - lastRefresh < REFRESH_MS) return;
  inflight ??= refresh().finally(() => {
    lastRefresh = Date.now();
    inflight = null;
  });
  await inflight;
}

const up = gauge({
  name: "samma_app_business_metrics_up",
  help: "1 if the last business-metrics refresh from this database (app/scanner) succeeded.",
  labelNames: ["db"],
  collect,
});
const users = gauge({ name: "samma_app_users", help: "Users.", collect });
const organisations = gauge({
  name: "samma_app_organisations",
  help: "Organisations by state (active/locked; locked = deleted in Clerk).",
  labelNames: ["state"],
  collect,
});
const memberships = gauge({
  name: "samma_app_org_memberships",
  help: "Organisation memberships by role.",
  labelNames: ["role"],
  collect,
});
const profiles = gauge({
  name: "samma_app_profiles",
  help: "Scan profiles by type.",
  labelNames: ["type"],
  collect,
});
const targets = gauge({
  name: "samma_app_targets",
  help: "Targets by scanner status, reachability and type.",
  labelNames: ["scanner_status", "reachability", "type"],
  collect,
});
const clusters = gauge({
  name: "samma_app_clusters",
  help: "Connected clusters by state (ready = seen in the last 15 minutes, else down).",
  labelNames: ["state"],
  collect,
});
const apiTokens = gauge({
  name: "samma_app_api_tokens",
  help: "API tokens by access (read_only/read_write).",
  labelNames: ["access"],
  collect,
});
const apiTokensUsed = gauge({
  name: "samma_app_api_tokens_used_24h",
  help: "API tokens used in the last 24 hours.",
  collect,
});
const externalConnections = gauge({
  name: "samma_app_external_scanner_connections",
  help: "External scanner connections by catalog scanner.",
  labelNames: ["scanner"],
  collect,
});
const externalRuns = gauge({
  name: "samma_app_external_scan_runs",
  help: "External scan runs by catalog scanner, status and trigger.",
  labelNames: ["scanner", "status", "trigger"],
  collect,
});
const externalRevenue = gauge({
  name: "samma_app_external_scan_revenue_cents",
  help: "Price of all completed external scan runs, in cents, by currency. Only completed runs are charged.",
  labelNames: ["currency"],
  collect,
});
const externalOldestRunning = gauge({
  name: "samma_app_external_scan_oldest_running_seconds",
  help: "Age of the oldest external scan run still running (0 when none). Runs are polled when a page shows them, so this also grows while nobody looks.",
  collect,
});
const siemInstances = gauge({
  name: "samma_app_siem_instances",
  help: "SIEM instances by hosting and status.",
  labelNames: ["hosting", "status"],
  collect,
});
const siemSubscriptions = gauge({
  name: "samma_app_siem_subscriptions",
  help: "SIEM rule subscriptions by plan and whether they are active.",
  labelNames: ["plan", "active"],
  collect,
});
const scanResults = gauge({
  name: "samma_app_scan_results_24h",
  help: "Rows written to scan_results in the last 24 hours, by scanner.",
  labelNames: ["scanner"],
  collect,
});
const findings = gauge({
  name: "samma_app_findings_24h",
  help: "scan_results rows of the last 24 hours that carry a severity, by severity.",
  labelNames: ["severity"],
  collect,
});
const lastResultAge = gauge({
  name: "samma_app_scan_last_result_age_seconds",
  help: "Seconds since the newest scan_results row (looks back 30 days; NaN when there is none or it is unknown).",
  collect,
});
lastResultAge.set(NaN);

/** Prisma errors are multi-line; the last line says what went wrong. */
function reason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.split("\n").filter((l) => l.trim()).pop() ?? "unknown error";
}

async function refresh(): Promise<void> {
  await Promise.all([refreshApp(), refreshScanner()]);
}

async function refreshApp(): Promise<void> {
  try {
    const now = new Date();
    const [
      userCount,
      activeOrgs,
      lockedOrgs,
      membershipRows,
      profileRows,
      targetRows,
      clusterCount,
      readyClusters,
      tokenCount,
      readOnlyTokens,
      usedTokens,
      connections,
      runRows,
      oldestRunning,
      siems,
      subscriptionRows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organisation.count({ where: { deletedAt: null } }),
      prisma.organisation.count({ where: { deletedAt: { not: null } } }),
      prisma.orgMembership.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.profile.groupBy({ by: ["type"], _count: { _all: true } }),
      prisma.target.groupBy({
        by: ["scannerStatus", "reachabilityStatus", "type"],
        _count: { _all: true },
      }),
      prisma.cluster.count(),
      prisma.cluster.count({
        where: { lastSeenAt: { gte: new Date(now.getTime() - READY_WINDOW_MS) } },
      }),
      prisma.apiToken.count(),
      prisma.apiToken.count({ where: { readOnly: true } }),
      prisma.apiToken.count({ where: { lastUsedAt: { gte: new Date(now.getTime() - DAY_MS) } } }),
      prisma.externalScannerConnection.findMany({
        select: { id: true, scannerId: true, pricePerScanCents: true, currency: true },
      }),
      prisma.externalScanRun.groupBy({
        by: ["connectionId", "status", "trigger"],
        _count: { _all: true },
      }),
      prisma.externalScanRun.findFirst({
        where: { status: "RUNNING" },
        orderBy: { requestedAt: "asc" },
        select: { requestedAt: true },
      }),
      prisma.siemInstance.findMany({
        select: { hosting: true, createdAt: true, lastSeenAt: true },
      }),
      prisma.siemSubscription.groupBy({ by: ["plan", "active"], _count: { _all: true } }),
    ]);

    users.set(userCount);
    organisations.set({ state: "active" }, activeOrgs);
    organisations.set({ state: "locked" }, lockedOrgs);

    memberships.reset();
    for (const r of membershipRows) memberships.set({ role: r.role }, r._count._all);
    profiles.reset();
    for (const r of profileRows) profiles.set({ type: r.type }, r._count._all);
    targets.reset();
    for (const r of targetRows) {
      targets.set(
        { scanner_status: r.scannerStatus, reachability: r.reachabilityStatus, type: r.type },
        r._count._all
      );
    }

    clusters.set({ state: "ready" }, readyClusters);
    clusters.set({ state: "down" }, clusterCount - readyClusters);
    apiTokens.set({ access: "read_only" }, readOnlyTokens);
    apiTokens.set({ access: "read_write" }, tokenCount - readOnlyTokens);
    apiTokensUsed.set(usedTokens);

    const connectionById = new Map(connections.map((c) => [c.id, c]));
    externalConnections.reset();
    for (const c of connections) externalConnections.inc({ scanner: c.scannerId });
    externalRuns.reset();
    externalRevenue.reset();
    for (const r of runRows) {
      const c = connectionById.get(r.connectionId);
      if (!c) continue;
      externalRuns.inc({ scanner: c.scannerId, status: r.status, trigger: r.trigger }, r._count._all);
      // Same rule as src/lib/scanner-runs.ts: only a completed run is charged.
      if (r.status === "COMPLETED") {
        externalRevenue.inc({ currency: c.currency }, r._count._all * c.pricePerScanCents);
      }
    }
    externalOldestRunning.set(
      oldestRunning ? (now.getTime() - oldestRunning.requestedAt.getTime()) / 1000 : 0
    );

    siemInstances.reset();
    for (const s of siems) siemInstances.inc({ hosting: s.hosting, status: siemStatus(s, now) });
    siemSubscriptions.reset();
    for (const r of subscriptionRows) {
      siemSubscriptions.set({ plan: r.plan, active: String(r.active) }, r._count._all);
    }

    up.set({ db: "app" }, 1);
  } catch (err) {
    up.set({ db: "app" }, 0);
    console.warn("[metrics] app database refresh failed:", reason(err));
  }
}

async function refreshScanner(): Promise<void> {
  const db = getScannerDb();
  // Not configured (normal in development): report nothing for it.
  if (!db) return;
  try {
    // Always time-bounded: scan_results is a hypertable and grows without limit.
    const [byScanner, bySeverity, newest] = await Promise.all([
      db.$queryRaw<{ scanner: string | null; n: number }[]>`
        SELECT scanner, count(*)::int AS n
          FROM scan_results
         WHERE time > now() - interval '24 hours'
         GROUP BY scanner`,
      db.$queryRaw<{ severity: string | null; n: number }[]>`
        SELECT lower(raw->>'severity') AS severity, count(*)::int AS n
          FROM scan_results
         WHERE time > now() - interval '24 hours'
           AND raw->>'severity' IS NOT NULL
         GROUP BY 1`,
      db.$queryRaw<{ age: number | null }[]>`
        SELECT extract(epoch FROM now() - max(time))::float AS age
          FROM scan_results
         WHERE time > now() - interval '30 days'`,
    ]);

    scanResults.reset();
    for (const r of byScanner) scanResults.inc({ scanner: r.scanner || "unknown" }, r.n);
    findings.reset();
    for (const r of bySeverity) {
      // The value comes from scanner output: keep the label set fixed.
      const severity = r.severity && SEVERITIES.has(r.severity) ? r.severity : "other";
      findings.inc({ severity }, r.n);
    }
    const age = newest[0]?.age;
    lastResultAge.set(typeof age === "number" ? age : NaN);

    up.set({ db: "scanner" }, 1);
  } catch (err) {
    up.set({ db: "scanner" }, 0);
    console.warn("[metrics] scanner database refresh failed:", reason(err));
  }
}

/** Importing this module registers the gauges; the route calls this so the import is kept. */
export function registerBusinessMetrics(): void {}
