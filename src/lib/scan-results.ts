import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Read helpers for the scanner's TimescaleDB `scan_results` table, used by
 * the /api/v1 read endpoints (and the MCP server through them).
 *
 * "Latest results" means:
 *  - finding-v2 scanners (detect-*): the findings of the newest `kind: run`
 *    message per (target, scanner), joined on `runId`. A run that is still in
 *    progress (no run message yet) is not shown until it completes.
 *  - legacy scanners (nmap, nikto, tsunami; rows without `kind`): the rows
 *    within an hour of that scanner's newest row for the target.
 * Only the last LOOKBACK of data is considered, which keeps the hypertable
 * query on recent chunks. Scanners run weekly, so this is ample.
 */

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
const LOOKBACK = Prisma.sql`now() - interval '90 days'`;
const LEGACY_BATCH = Prisma.sql`interval '1 hour'`;

export type Finding = {
  time: string;
  targetId: string;
  target?: string;
  scanner: string;
  runId?: string;
  checkId?: string;
  severity?: string;
  title?: string;
  host?: string;
  port?: string;
  status?: string;
  type?: string;
  endpoint?: { host?: string; port?: string | number; scheme?: string };
  evidence?: string;
  remediation?: string;
  references?: string[];
  cveIds?: string[];
  compliance?: string[];
};

export type ScannerRun = {
  targetId: string;
  scanner: string;
  runId?: string;
  outcome?: string;
  finishedAt?: string;
  lastSeenAt?: string;
  findingCount: number;
  severity: Record<string, number>;
};

/** Parse "CRITICAL,high" into a validated, uppercased list ([] = no filter). */
export function parseSeverities(value: string | null): string[] | null {
  if (!value) return [];
  const list = value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (list.some((s) => !(SEVERITIES as readonly string[]).includes(s))) return null;
  return list;
}

function latestCtes(ids: string[]) {
  return Prisma.sql`
    runs AS (
      SELECT DISTINCT ON (samma_id, scanner) samma_id, scanner, time, raw
      FROM scan_results
      WHERE samma_id = ANY(${ids}::text[]) AND time > ${LOOKBACK} AND raw->>'kind' = 'run'
      ORDER BY samma_id, scanner, time DESC
    ),
    legacy AS (
      SELECT s.samma_id, s.scanner, max(s.time) AS last
      FROM scan_results s
      WHERE s.samma_id = ANY(${ids}::text[]) AND s.time > ${LOOKBACK} AND s.raw->>'kind' IS NULL
        AND NOT EXISTS (SELECT 1 FROM runs r WHERE r.samma_id = s.samma_id AND r.scanner = s.scanner)
      GROUP BY s.samma_id, s.scanner
    ),
    latest AS (
      SELECT s.time, s.samma_id, s.host, s.port, s.status, s.type, s.scanner, s.raw
      FROM scan_results s
      LEFT JOIN runs r ON r.samma_id = s.samma_id AND r.scanner = s.scanner
        AND s.raw->>'kind' = 'finding' AND s.raw->>'runId' = r.raw->>'runId'
      LEFT JOIN legacy l ON l.samma_id = s.samma_id AND l.scanner = s.scanner
        AND s.raw->>'kind' IS NULL AND s.time > l.last - ${LEGACY_BATCH}
      WHERE s.samma_id = ANY(${ids}::text[]) AND s.time > ${LOOKBACK}
        AND (r.samma_id IS NOT NULL OR l.samma_id IS NOT NULL)
    )`;
}

type Row = {
  time: Date;
  samma_id: string;
  host: string | null;
  port: string | null;
  status: string | null;
  type: string | null;
  scanner: string | null;
  raw: unknown;
};

const str = (v: unknown): string | undefined =>
  v === undefined || v === null || v === "" ? undefined : typeof v === "string" ? v : JSON.stringify(v);
const strList = (v: unknown): string[] | undefined =>
  Array.isArray(v) && v.length ? v.map((x) => str(x)).filter((x): x is string => !!x) : undefined;
const isoTime = (v: unknown): string | undefined => {
  if (typeof v !== "string" && !(v instanceof Date)) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

function toFinding(r: Row, targetValues?: Map<string, string>): Finding {
  const raw = (r.raw && typeof r.raw === "object" ? r.raw : {}) as Record<string, unknown>;
  const ep = raw.endpoint && typeof raw.endpoint === "object" ? (raw.endpoint as Record<string, unknown>) : null;
  return {
    time: r.time.toISOString(),
    targetId: r.samma_id,
    target: targetValues?.get(r.samma_id),
    scanner: r.scanner ?? str(raw.scanner) ?? "unknown",
    runId: str(raw.runId),
    checkId: str(raw.checkId),
    severity: str(raw.severity)?.toUpperCase(),
    title: str(raw.title),
    host: r.host ?? undefined,
    port: r.port ?? undefined,
    status: r.status ?? undefined,
    type: r.type ?? undefined,
    endpoint: ep
      ? {
          host: str(ep.host),
          port: typeof ep.port === "number" ? ep.port : str(ep.port),
          scheme: str(ep.scheme),
        }
      : undefined,
    evidence: str(raw.evidence),
    remediation: str(raw.remediation),
    references: strList(raw.references),
    cveIds: strList(raw.cveIds),
    compliance: strList(raw.compliance),
  };
}

const severityOrder = Prisma.sql`CASE upper(raw->>'severity')
  WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2
  WHEN 'LOW' THEN 3 WHEN 'INFO' THEN 4 ELSE 5 END`;

/** Latest findings for the given targets, most severe first. */
export async function latestFindings(
  db: PrismaClient,
  ids: string[],
  opts: { scanner?: string; severities?: string[]; since?: Date; limit: number; targetValues?: Map<string, string> }
): Promise<Finding[]> {
  if (ids.length === 0) return [];
  const filters: Prisma.Sql[] = [];
  if (opts.scanner) filters.push(Prisma.sql`scanner = ${opts.scanner}`);
  if (opts.severities?.length) filters.push(Prisma.sql`upper(raw->>'severity') = ANY(${opts.severities}::text[])`);
  if (opts.since) filters.push(Prisma.sql`time >= ${opts.since}`);
  const where = filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;

  const rows = await db.$queryRaw<Row[]>`
    WITH ${latestCtes(ids)}
    SELECT time, samma_id, host, port, status, type, scanner, raw
    FROM latest ${where}
    ORDER BY ${severityOrder}, time DESC
    LIMIT ${opts.limit}`;
  return rows.map((r) => toFinding(r, opts.targetValues));
}

/** Latest run per scanner for the given targets, with severity counts. */
export async function latestRuns(db: PrismaClient, ids: string[]): Promise<ScannerRun[]> {
  if (ids.length === 0) return [];
  const [runRows, countRows] = await Promise.all([
    db.$queryRaw<Array<{ samma_id: string; scanner: string; time: Date; raw: unknown; legacy: boolean }>>`
      WITH ${latestCtes(ids)}
      SELECT samma_id, scanner, time, raw, false AS legacy FROM runs
      UNION ALL
      SELECT samma_id, scanner, last AS time, NULL::jsonb AS raw, true AS legacy FROM legacy
      ORDER BY samma_id, scanner`,
    db.$queryRaw<Array<{ samma_id: string; scanner: string; severity: string | null; n: bigint }>>`
      WITH ${latestCtes(ids)}
      SELECT samma_id, scanner, upper(raw->>'severity') AS severity, count(*) AS n
      FROM latest GROUP BY 1, 2, 3`,
  ]);

  const counts = new Map<string, Record<string, number>>();
  for (const c of countRows) {
    const key = `${c.samma_id}\u0000${c.scanner}`;
    const m = counts.get(key) ?? {};
    m[c.severity ?? "NONE"] = (m[c.severity ?? "NONE"] ?? 0) + Number(c.n);
    counts.set(key, m);
  }

  return runRows.map((r) => {
    const severity = counts.get(`${r.samma_id}\u0000${r.scanner}`) ?? {};
    const total = Object.values(severity).reduce((a, b) => a + b, 0);
    if (r.legacy) {
      return { targetId: r.samma_id, scanner: r.scanner, lastSeenAt: r.time.toISOString(), findingCount: total, severity };
    }
    const raw = (r.raw ?? {}) as Record<string, unknown>;
    const fc = Number(raw.findingCount);
    return {
      targetId: r.samma_id,
      scanner: r.scanner,
      runId: str(raw.runId),
      outcome: str(raw.outcome),
      finishedAt: isoTime(raw.finishedAt) ?? r.time.toISOString(),
      lastSeenAt: r.time.toISOString(),
      findingCount: Number.isFinite(fc) ? fc : total,
      severity,
    };
  });
}
