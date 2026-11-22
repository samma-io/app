import type { Instrumentation } from "next";

// Counts uncaught server errors. prom-client is Node-only, so it is imported
// lazily: this file is also loaded in the edge runtime (middleware).
export const onRequestError: Instrumentation.onRequestError = async (_err, _request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { requestErrors } = await import("@/lib/metrics/instrument");
  requestErrors.inc({ kind: context.routeType });
};
