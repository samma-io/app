// Deterministic demo runs for the scanner dashboard. Used for every external
// scanner (nothing runs them yet) and for internal scanners when the scanner
// TimescaleDB is not configured. The same inputs always give the same runs,
// so the page does not change on every reload.

export type DemoTarget = { id: string; value: string; profileId: string | null };

export type DemoRun = {
  time: Date;
  targetId: string;
  outcome: "completed" | "failed";
  findingCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Runs of one scanner against each target, one every `everyDays` over the
 * last `days` days, with a per-target offset so they don't all line up.
 */
export function demoRuns(
  seed: string,
  targets: DemoTarget[],
  opts: { days: number; everyDays: number; now?: Date }
): DemoRun[] {
  const now = (opts.now ?? new Date()).getTime();
  const runs: DemoRun[] = [];
  for (const t of targets) {
    const h = hash(`${seed}:${t.id}`);
    const offsetMs = (h % (opts.everyDays * 24)) * 60 * 60 * 1000;
    for (let at = now - offsetMs; at > now - opts.days * DAY_MS; at -= opts.everyDays * DAY_MS) {
      const r = hash(`${seed}:${t.id}:${Math.floor(at / DAY_MS)}`);
      runs.push({
        time: new Date(at),
        targetId: t.id,
        outcome: r % 17 === 0 ? "failed" : "completed",
        findingCount: r % 9,
      });
    }
  }
  return runs;
}

/** Placeholder targets for an org that has none yet, so the dashboard shows its shape. */
export const DEMO_TARGETS: DemoTarget[] = [
  { id: "demo-target-1", value: "demo.example.com", profileId: null },
  { id: "demo-target-2", value: "203.0.113.10", profileId: null },
];
