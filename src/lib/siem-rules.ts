// Samma detection rules: what the rules subscription delivers.
//
// DEMO CATALOG. The real rules are Sigma files in samma-io/detection-engine
// (rules/<lane>/*.yml), baked into the engine image, with no ruleset version or
// release yet. Until that exists, this file stands in for the release feed so
// the dashboard can show "latest rules" and which ruleset a SIEM runs.
// Kept free of server-only imports so client components can use it.

export type RuleLevel = "critical" | "high" | "medium" | "low";

export interface Ruleset {
  version: string; // YYYY.MM.N
  releasedAt: string; // ISO date
  ruleCount: number; // rules in this ruleset
}

export interface CatalogRule {
  id: string; // Sigma rule id
  title: string;
  level: RuleLevel;
  lane: string; // detection-engine lane, e.g. "k8s"
  addedIn: string; // ruleset version that first shipped it
  cve?: string;
  description: string;
}

// Oldest first. The first ruleset is the detection-engine baseline.
export const RULESETS: Ruleset[] = [
  { version: "2026.10.1", releasedAt: "2026-10-06", ruleCount: 129 },
  { version: "2026.10.2", releasedAt: "2026-10-20", ruleCount: 131 },
  { version: "2026.11.1", releasedAt: "2026-11-03", ruleCount: 133 },
  { version: "2026.11.2", releasedAt: "2026-11-12", ruleCount: 135 },
  { version: "2026.11.3", releasedAt: "2026-11-19", ruleCount: 138 },
];

export const LATEST_RULESET = RULESETS[RULESETS.length - 1];

// Rules added after the baseline, newest first.
export const RECENT_RULES: CatalogRule[] = [
  {
    id: "b7e2c1a4-5f3d-4e8a-9c61-2d7f0a9e4b13",
    title: "React Server Components RCE attempt (React2Shell)",
    level: "critical",
    lane: "alb",
    addedIn: "2026.11.3",
    cve: "CVE-2025-55182",
    description: "Crafted RSC Flight payloads in POST requests to Next.js / React server endpoints.",
  },
  {
    id: "4a9d6e2f-1b7c-4f05-8e3a-6c2b9d1f7a40",
    title: "Next.js middleware bypass header",
    level: "high",
    lane: "alb",
    addedIn: "2026.11.3",
    cve: "CVE-2025-29927",
    description: "Requests carrying x-middleware-subrequest from outside, used to skip auth middleware.",
  },
  {
    id: "e1f0c3b8-7d2a-4c69-b5e4-0a8f3d6c2e91",
    title: "Kubernetes pod with hostPID and privileged container",
    level: "high",
    lane: "k8s",
    addedIn: "2026.11.3",
    description: "A pod that shares the host PID namespace and runs privileged: a container escape path.",
  },
  {
    id: "9c3b7a1e-2d4f-4b8c-a6e0-5f1d9b3c7e28",
    title: "SharePoint ToolShell exploitation",
    level: "critical",
    lane: "wazuh",
    addedIn: "2026.11.2",
    cve: "CVE-2025-53770",
    description: "w3wp.exe spawning a shell or writing an .aspx file into the LAYOUTS folder.",
  },
  {
    id: "2f6e8d0a-9b1c-4e37-8d5a-7c0b2e4f9a16",
    title: "OpenSSH signal handler race (regreSSHion) probing",
    level: "high",
    lane: "osquery",
    addedIn: "2026.11.2",
    cve: "CVE-2024-6387",
    description: "Bursts of unauthenticated sshd connections hitting LoginGraceTime from one source.",
  },
  {
    id: "6d1a4f9b-3e8c-4a2d-b0f7-1e9c5a3d8b74",
    title: "Citrix NetScaler session token reuse (Citrix Bleed)",
    level: "critical",
    lane: "workspace",
    addedIn: "2026.11.1",
    cve: "CVE-2023-4966",
    description: "One session used from two distant IP addresses within minutes of each other.",
  },
  {
    id: "c8b5e2d7-0a4f-4e1b-9d36-8f2a7c1e5b09",
    title: "1Password vault exported",
    level: "medium",
    lane: "onepassword",
    addedIn: "2026.11.1",
    description: "A full vault export by a user who has not exported in the last 90 days.",
  },
  {
    id: "3e7a0c5f-8d2b-4f96-a1e4-9b6d3f0c2a85",
    title: "xz/liblzma backdoored version installed",
    level: "critical",
    lane: "osquery",
    addedIn: "2026.10.2",
    cve: "CVE-2024-3094",
    description: "Package inventory reports xz-utils 5.6.0 or 5.6.1.",
  },
  {
    id: "a0d4b8e1-6f3c-4d72-8e5b-2c9a1f7d3e60",
    title: "GitHub branch protection removed on default branch",
    level: "medium",
    lane: "github",
    addedIn: "2026.10.2",
    description: "protected_branch.destroy on a repository's default branch.",
  },
];

export function getRuleset(version: string | null | undefined): Ruleset | undefined {
  return RULESETS.find((r) => r.version === version);
}

/** Rules a SIEM on `version` is missing compared with the latest ruleset. */
export function rulesMissingFrom(version: string): CatalogRule[] {
  const idx = RULESETS.findIndex((r) => r.version === version);
  if (idx === -1) return RECENT_RULES;
  const newer = new Set(RULESETS.slice(idx + 1).map((r) => r.version));
  return RECENT_RULES.filter((r) => newer.has(r.addedIn));
}

/** Recently added rules included in `version`. */
export function rulesIncludedIn(version: string): CatalogRule[] {
  const missing = new Set(rulesMissingFrom(version).map((r) => r.id));
  return RECENT_RULES.filter((r) => !missing.has(r.id));
}
