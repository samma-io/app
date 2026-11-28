// The report a SIEM's reporter posts to /api/v1/siem/report (schema 1), and
// its validator. Counts and versions only: no rule names, hosts or alert
// content ever reach the dashboard.
//
// The validator builds a new object from known fields, so what is stored is
// exactly this shape and nothing else the sender included.
// Kept free of server-only imports so client components can use the types.

import { ALERT_LEVELS, type AlertCounts, type DailyAlerts } from "@/lib/siem-alerts";

export const SIEM_REPORT_SCHEMA = 1;
export const MAX_REPORT_BYTES = 64 * 1024;
export const MAX_LANES = 32;
export const MAX_COMPONENTS = 64;
export const DAILY_DAYS = 14;

export const COMPONENT_KINDS = ["Deployment", "StatefulSet", "DaemonSet"] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

export interface SiemReportLane {
  name: string; // detection lane, e.g. "osquery"
  engine: {
    version: string | null; // detection-engine build, null when it did not answer
    ready: boolean;
    rules: AlertCounts; // rules loaded per level
  };
  flow: {
    eventsSinceLast: number | null; // events evaluated since the previous report
    pending: number | null; // events waiting for the engine (consumer lag)
  };
  alerts: { last24h: AlertCounts; last7d: AlertCounts } | null; // null: not measured
}

export interface SiemReportComponent {
  name: string;
  kind: ComponentKind;
  ready: number;
  desired: number;
  version: string | null; // image tag
}

export interface SiemReport {
  schema: typeof SIEM_REPORT_SCHEMA;
  reporterVersion: string | null;
  intervalSeconds: number;
  lanes: SiemReportLane[];
  daily: DailyAlerts[]; // alerts per day, all lanes; may be empty
  components: SiemReportComponent[];
}

export type ParsedReport = { ok: true; report: SiemReport } | { ok: false; error: string };

const LANE_RE = /^[a-z0-9]([a-z0-9_-]{0,30}[a-z0-9])?$/;
const NAME_RE = /^[a-z0-9]([a-z0-9.-]{0,61}[a-z0-9])?$/;
const VERSION_RE = /^[A-Za-z0-9._+-]{1,64}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_COUNT = 1_000_000_000_000;

class Invalid extends Error {}

function fail(message: string): never {
  throw new Invalid(message);
}

function obj(v: unknown, at: string): Record<string, unknown> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) fail(`${at} must be an object`);
  return v as Record<string, unknown>;
}

function list(v: unknown, at: string, max: number): unknown[] {
  if (!Array.isArray(v)) fail(`${at} must be an array`);
  if (v.length > max) fail(`${at} has more than ${max} entries`);
  return v;
}

function count(v: unknown, at: string, max = MAX_COUNT): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > max) {
    fail(`${at} must be a non-negative integer`);
  }
  return v;
}

function countOrNull(v: unknown, at: string): number | null {
  return v === null || v === undefined ? null : count(v, at);
}

function text(v: unknown, at: string, re: RegExp): string {
  if (typeof v !== "string" || !re.test(v)) fail(`${at} is not valid`);
  return v;
}

function textOrNull(v: unknown, at: string, re: RegExp): string | null {
  return v === null || v === undefined ? null : text(v, at, re);
}

// A missing level is 0, so a sender can omit levels it has nothing for.
function counts(v: unknown, at: string): AlertCounts {
  const o = obj(v, at);
  const out = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const l of ALERT_LEVELS) if (o[l] !== undefined) out[l] = count(o[l], `${at}.${l}`);
  return out;
}

function lane(v: unknown, at: string): SiemReportLane {
  const o = obj(v, at);
  const engine = obj(o.engine, `${at}.engine`);
  const flow = o.flow === undefined || o.flow === null ? {} : obj(o.flow, `${at}.flow`);
  let alerts: SiemReportLane["alerts"] = null;
  if (o.alerts !== undefined && o.alerts !== null) {
    const a = obj(o.alerts, `${at}.alerts`);
    alerts = {
      last24h: counts(a.last24h, `${at}.alerts.last24h`),
      last7d: counts(a.last7d, `${at}.alerts.last7d`),
    };
  }
  if (typeof engine.ready !== "boolean") fail(`${at}.engine.ready must be a boolean`);
  return {
    name: text(o.name, `${at}.name`, LANE_RE),
    engine: {
      version: textOrNull(engine.version, `${at}.engine.version`, VERSION_RE),
      ready: engine.ready,
      rules: engine.rules === undefined ? counts({}, "") : counts(engine.rules, `${at}.engine.rules`),
    },
    flow: {
      eventsSinceLast: countOrNull(flow.eventsSinceLast, `${at}.flow.eventsSinceLast`),
      pending: countOrNull(flow.pending, `${at}.flow.pending`),
    },
    alerts,
  };
}

function component(v: unknown, at: string): SiemReportComponent {
  const o = obj(v, at);
  if (!COMPONENT_KINDS.includes(o.kind as ComponentKind)) fail(`${at}.kind is not valid`);
  return {
    name: text(o.name, `${at}.name`, NAME_RE),
    kind: o.kind as ComponentKind,
    ready: count(o.ready, `${at}.ready`, 10_000),
    desired: count(o.desired, `${at}.desired`, 10_000),
    version: textOrNull(o.version, `${at}.version`, VERSION_RE),
  };
}

function day(v: unknown, at: string): DailyAlerts {
  const o = obj(v, at);
  return { day: text(o.day, `${at}.day`, DAY_RE), ...counts(o, at) };
}

function unique(names: string[], at: string) {
  if (new Set(names).size !== names.length) fail(`${at} has duplicates`);
}

/** Validate an untrusted report body. Also used to read a stored report back. */
export function parseSiemReport(input: unknown): ParsedReport {
  try {
    const o = obj(input, "report");
    if (o.schema !== SIEM_REPORT_SCHEMA) fail(`schema must be ${SIEM_REPORT_SCHEMA}`);

    const reporter = o.reporter === undefined || o.reporter === null ? {} : obj(o.reporter, "reporter");
    const lanes = list(o.lanes, "lanes", MAX_LANES).map((l, i) => lane(l, `lanes[${i}]`));
    const daily = list(o.daily ?? [], "daily", DAILY_DAYS).map((d, i) => day(d, `daily[${i}]`));
    const components = list(o.components ?? [], "components", MAX_COMPONENTS).map((c, i) =>
      component(c, `components[${i}]`)
    );
    unique(lanes.map((l) => l.name), "lanes");
    unique(daily.map((d) => d.day), "daily");
    unique(components.map((c) => `${c.kind}/${c.name}`), "components");

    const intervalSeconds = count(o.intervalSeconds, "intervalSeconds", 86_400);
    if (intervalSeconds < 1) fail("intervalSeconds must be at least 1");

    return {
      ok: true,
      report: {
        schema: SIEM_REPORT_SCHEMA,
        // Stored reports carry reporterVersion; incoming ones carry reporter.version.
        reporterVersion: textOrNull(reporter.version ?? o.reporterVersion, "reporter.version", VERSION_RE),
        intervalSeconds,
        lanes,
        daily,
        components,
      },
    };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: err.message };
    throw err;
  }
}
