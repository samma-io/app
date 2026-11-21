// Deterministic demo numbers for the SIEM dashboard. No SIEM reports to Samma
// yet, so alert counts and deployed rulesets are made up from a seed (the
// instance id, or the org id when it has no SIEM). Same seed, same numbers.

import { RULESETS, type RuleLevel } from "@/lib/siem-rules";

export const ALERT_LEVELS: RuleLevel[] = ["critical", "high", "medium", "low"];

export type AlertCounts = Record<RuleLevel, number>;

export interface DailyAlerts extends AlertCounts {
  day: string; // YYYY-MM-DD
}

export interface DemoSiemStats {
  last24h: AlertCounts;
  last7d: AlertCounts;
  daily: DailyAlerts[]; // last 14 days, oldest first
}

// FNV-1a, then a small PRNG (mulberry32) seeded from it.
function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Typical alerts per day for each level.
const DAILY_MEAN: AlertCounts = { critical: 0.6, high: 4, medium: 11, low: 18 };

function emptyCounts(): AlertCounts {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

export function sumCounts(list: AlertCounts[]): AlertCounts {
  const out = emptyCounts();
  for (const c of list) for (const l of ALERT_LEVELS) out[l] += c[l];
  return out;
}

export function demoSiemStats(seed: string, now: Date = new Date()): DemoSiemStats {
  const rand = rng(seedFrom(seed));
  const scale = 0.5 + rand(); // some SIEMs are busier than others
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const daily: DailyAlerts[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 86_400_000);
    const row = { day: day.toISOString().slice(0, 10), ...emptyCounts() };
    for (const l of ALERT_LEVELS) {
      row[l] = Math.floor(DAILY_MEAN[l] * scale * (0.4 + rand() * 1.2) + rand());
    }
    daily.push(row);
  }

  // "Last 24h" is today so far plus the share of yesterday still in the window.
  const fraction = (now.getTime() - today.getTime()) / 86_400_000;
  const [yesterday, todayRow] = daily.slice(-2);
  const last24h = emptyCounts();
  for (const l of ALERT_LEVELS) {
    last24h[l] = Math.round(todayRow[l] + yesterday[l] * (1 - fraction));
  }

  return { last24h, last7d: sumCounts(daily.slice(-7)), daily };
}

/** A demo deployed ruleset: the latest or up to two releases behind. */
export function demoRulesetVersion(seed: string): string {
  const behind = Math.floor(rng(seedFrom(`ruleset:${seed}`))() * 3);
  return RULESETS[Math.max(0, RULESETS.length - 1 - behind)].version;
}
