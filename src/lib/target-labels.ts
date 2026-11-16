import type { ReachabilityStatus, ScannerStatus } from "@prisma/client";

/** Dashboard wording for a target's scanner status. */
export function scannerLabel(status: ScannerStatus): string {
  if (status === "DEPLOYED") return "Deployed";
  if (status === "LOCAL") return "Not scanned";
  return "Ready to deploy";
}

/** Dashboard wording for a target's reachability from samma.io. */
export function reachabilityLabel(status: ReachabilityStatus): string {
  if (status === "UP") return "Reachable";
  if (status === "DOWN") return "Unreachable";
  return "Unknown";
}

/** Why a LOCAL target is neither reachable nor scanned. */
export const LOCAL_TARGET_HINT =
  "Resolves to a private address or does not resolve publicly: samma.io cannot reach it from the internet, so no scanners run.";
