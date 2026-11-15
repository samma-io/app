import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Connected clusters.
 *
 * The samma operator and collector send `X-Samma-Cluster: <name>` (and
 * `X-Samma-Version`) on their API calls. A call with a valid name records the
 * cluster in the token's organisation and moves its lastSeenAt; the collector
 * polls every few minutes, so lastSeenAt is the cluster's heartbeat. The name
 * is the token holder's claim: it can only label clusters inside that token's
 * own organisation.
 */

/** A DNS-label-like name: lowercase letters, digits, dots and dashes, 1-63 chars. */
export const CLUSTER_NAME_RE = /^[a-z0-9]([a-z0-9.-]{0,61}[a-z0-9])?$/;
const VERSION_RE = /^[A-Za-z0-9._+-]{1,64}$/;

/** A cluster is Ready while it was seen within this window: 3 × the collector's 300 s default poll. */
export const READY_WINDOW_MS = 15 * 60 * 1000;

export type ClusterStatus = "READY" | "DOWN";

export function clusterStatus(lastSeenAt: Date, now: Date = new Date()): ClusterStatus {
  return now.getTime() - lastSeenAt.getTime() <= READY_WINDOW_MS ? "READY" : "DOWN";
}

/** The cluster a request claims to come from, or null when the header is missing or invalid. */
export function clusterClaim(req: NextRequest): { name: string; version: string | null } | null {
  const name = (req.headers.get("x-samma-cluster") ?? "").trim();
  if (!CLUSTER_NAME_RE.test(name)) return null;
  const version = (req.headers.get("x-samma-version") ?? "").trim();
  return { name, version: VERSION_RE.test(version) ? version : null };
}

/** Create or refresh the cluster in the organisation and return its id. */
export async function touchCluster(
  organisationId: string,
  name: string,
  version: string | null
): Promise<string> {
  const now = new Date();
  const data = { lastSeenAt: now, ...(version ? { version } : {}) };
  const where = { organisationId_name: { organisationId, name } };
  try {
    const c = await prisma.cluster.upsert({
      where,
      update: data,
      create: { organisationId, name, ...data },
      select: { id: true },
    });
    return c.id;
  } catch {
    // Two first calls at once: one create wins the unique index, the other updates.
    const c = await prisma.cluster.update({ where, data, select: { id: true } });
    return c.id;
  }
}
