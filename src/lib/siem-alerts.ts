// Alert-count shapes shared by the SIEM report, the SIEM pages and the chart.
// Kept free of server-only imports so client components can use it.

export type RuleLevel = "critical" | "high" | "medium" | "low";

export const ALERT_LEVELS: RuleLevel[] = ["critical", "high", "medium", "low"];

export type AlertCounts = Record<RuleLevel, number>;

export interface DailyAlerts extends AlertCounts {
  day: string; // YYYY-MM-DD
}

export interface SiemStats {
  last24h: AlertCounts;
  last7d: AlertCounts;
  daily: DailyAlerts[]; // last 14 days, oldest first
}

export function emptyCounts(): AlertCounts {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

export function sumCounts(list: AlertCounts[]): AlertCounts {
  const out = emptyCounts();
  for (const c of list) for (const l of ALERT_LEVELS) out[l] += c[l];
  return out;
}
