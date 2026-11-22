import client from "prom-client";

// Prometheus metrics for the app, served by GET /api/metrics and scraped by
// the PodMonitor in chart/templates/podmonitor.yaml.
//
// Next loads a module once per bundle (route handlers, server actions, RSC),
// so the registry lives on globalThis and every metric is created through the
// get-or-create helpers below. Server-only: never import from a client
// component or from middleware (edge runtime).

const globalForMetrics = globalThis as unknown as { sammaMetricsRegistry?: client.Registry };

function createRegistry(): client.Registry {
  const registry = new client.Registry();
  // Unprefixed process_* / nodejs_* so the community Node.js dashboard works.
  client.collectDefaultMetrics({ register: registry });
  return registry;
}

export const registry: client.Registry = (globalForMetrics.sammaMetricsRegistry ??= createRegistry());

export function counter<T extends string>(
  config: Omit<client.CounterConfiguration<T>, "registers">
): client.Counter<T> {
  return (
    (registry.getSingleMetric(config.name) as client.Counter<T> | undefined) ??
    new client.Counter({ ...config, registers: [registry] })
  );
}

export function gauge<T extends string>(
  config: Omit<client.GaugeConfiguration<T>, "registers">
): client.Gauge<T> {
  return (
    (registry.getSingleMetric(config.name) as client.Gauge<T> | undefined) ??
    new client.Gauge({ ...config, registers: [registry] })
  );
}

export function histogram<T extends string>(
  config: Omit<client.HistogramConfiguration<T>, "registers">
): client.Histogram<T> {
  return (
    (registry.getSingleMetric(config.name) as client.Histogram<T> | undefined) ??
    new client.Histogram({ ...config, registers: [registry] })
  );
}
