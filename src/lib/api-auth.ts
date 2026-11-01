import { NextRequest, NextResponse } from "next/server";
import type { ApiToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export type ApiAuth =
  | { ok: true; token: ApiToken; organisationId: string }
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
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Indexed lookup on the SHA-256 hash; raw tokens are never stored.
  const token = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (opts.write && token.readOnly) {
    return {
      ok: false,
      response: NextResponse.json({ error: "This API token is read-only" }, { status: 403 }),
    };
  }

  // Fire-and-forget so lookups stay fast.
  prisma.apiToken
    .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { ok: true, token, organisationId: token.organisationId };
}

/** Parse a positive integer query param, clamped to [1, max]. */
export function parseLimit(value: string | null, def: number, max: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}
