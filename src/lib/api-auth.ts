import { NextRequest, NextResponse } from "next/server";
import type { ApiToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";
import { clusterClaim, touchCluster } from "@/lib/clusters";
import { apiTokenAuth } from "@/lib/metrics/instrument";

export type ApiAuth =
  | {
      ok: true;
      token: ApiToken;
      organisationId: string;
      /** Id of the cluster named by X-Samma-Cluster, or null. Started for every call, awaited only by routes that store it. */
      clusterId: Promise<string | null>;
    }
  | { ok: false; response: NextResponse };

/**
 * Authenticate a request by its `Authorization: Bearer <token>` header.
 * Pass `{ write: true }` for mutating endpoints: read-only tokens get 403.
 */
export async function authenticateApiToken(
  req: NextRequest,
  opts: { write?: boolean } = {}
): Promise<ApiAuth> {
  const authHeader = req.headers.get("authorization") ?? "";
  const raw = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!raw) {
    apiTokenAuth.inc({ result: "unauthorized" });
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Indexed lookup on the SHA-256 hash; raw tokens are never stored.
  const found = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { organisation: { select: { deletedAt: true } } },
  });
  // A locked (deleted in Clerk) org's tokens stop working.
  if (!found || found.organisation.deletedAt) {
    apiTokenAuth.inc({ result: "unauthorized" });
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { organisation, ...token } = found;
  void organisation;

  if (opts.write && token.readOnly) {
    apiTokenAuth.inc({ result: "read_only" });
    return {
      ok: false,
      response: NextResponse.json({ error: "This API token is read-only" }, { status: 403 }),
    };
  }

  apiTokenAuth.inc({ result: "ok" });

  // Fire-and-forget so lookups stay fast.
  prisma.apiToken
    .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  // A cluster heartbeat is allowed for read-only tokens too: it only records
  // that the token's own cluster is alive (src/lib/clusters.ts).
  const claim = clusterClaim(req);
  const clusterId = claim
    ? touchCluster(token.organisationId, claim.name, claim.version).catch((err) => {
        console.error("[clusters] heartbeat failed:", err);
        return null;
      })
    : Promise.resolve(null);

  return { ok: true, token, organisationId: token.organisationId, clusterId };
}

/** Parse a positive integer query param, clamped to [1, max]. */
export function parseLimit(value: string | null, def: number, max: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}
