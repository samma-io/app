import { counter, histogram } from "@/lib/metrics/registry";

// Request, dependency and event metrics. Labels are fixed, small sets: never
// an organisation, user, target or token — findings and targets are customer
// data and must not leak into Prometheus.

const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

const httpDuration = histogram({
  name: "samma_app_http_request_duration_seconds",
  help: "API route handler duration by route template, method and status class.",
  labelNames: ["route", "method", "status_class"],
  buckets: BUCKETS,
});

const dependencyDuration = histogram({
  name: "samma_app_dependency_request_duration_seconds",
  help: "Outbound call duration by dependency, operation and result (ok/error).",
  labelNames: ["dependency", "op", "result"],
  buckets: BUCKETS,
});

/**
 * Wraps a route handler so its duration and status class are recorded under
 * the route template (never the raw URL).
 */
export function withMetrics<A extends unknown[]>(
  route: string,
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const method = (args[0] as Request | undefined)?.method ?? "GET";
    const end = httpDuration.startTimer({ route, method });
    try {
      const res = await handler(...args);
      end({ status_class: `${Math.floor(res.status / 100)}xx` });
      return res;
    } catch (err) {
      end({ status_class: "5xx" });
      throw err;
    }
  };
}

/**
 * Times an outbound call. A throw is an error; `isOk` decides for a call that
 * returned (for example an HTTP status).
 */
export async function timed<T>(
  dependency: string,
  op: string,
  fn: () => Promise<T>,
  isOk: (value: T) => boolean = () => true
): Promise<T> {
  const end = dependencyDuration.startTimer({ dependency, op });
  try {
    const value = await fn();
    end({ result: isOk(value) ? "ok" : "error" });
    return value;
  } catch (err) {
    end({ result: "error" });
    throw err;
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export const targetsCreated = counter({
  name: "samma_app_targets_created_total",
  help: "Targets created, by source (dashboard/api).",
  labelNames: ["source"],
});

export const scansStarted = counter({
  name: "samma_app_scans_started_total",
  help: "Scans started: internal = target registered with the operator, external = run started on an external scanner.",
  labelNames: ["kind", "trigger"],
});

export const apiTokenAuth = counter({
  name: "samma_app_api_token_auth_total",
  help: "API token authentications on /api/v1 by result (ok/unauthorized/read_only).",
  labelNames: ["result"],
});

export const siemReports = counter({
  name: "samma_app_siem_reports_total",
  help: "SIEM reports posted to /api/v1/siem/report by result (ok/unauthorized/invalid/throttled).",
  labelNames: ["result"],
});

export const reachabilityChecks = counter({
  name: "samma_app_reachability_checks_total",
  help: "Outside-in reachability checks of new targets by result (UP/DOWN/UNKNOWN).",
  labelNames: ["result"],
});

export const requestErrors = counter({
  name: "samma_app_request_errors_total",
  help: "Uncaught server errors reported by Next.js, by kind (render/route/action/middleware).",
  labelNames: ["kind"],
});
