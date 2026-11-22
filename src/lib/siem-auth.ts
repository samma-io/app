import { NextRequest, NextResponse } from "next/server";
import type { SiemInstance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export const SIEM_KEY_PREFIX = "samma_siem_";

export type SiemAuth =
  | { ok: true; siem: SiemInstance; organisationId: string }
  | { ok: false; response: NextResponse };

function unauthorized(): SiemAuth {
  return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

/**
 * Authenticate a SIEM by its `Authorization: Bearer samma_siem_…` key.
 *
 * A SIEM key identifies one SiemInstance and is only accepted by the SIEM
 * report route. It is not an ApiToken: authenticateApiToken() never matches
 * it, so it cannot read findings or targets.
 */
export async function authenticateSiemKey(req: NextRequest): Promise<SiemAuth> {
  const header = req.headers.get("authorization") ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw.startsWith(SIEM_KEY_PREFIX)) return unauthorized();

  // Indexed lookup on the SHA-256 hash; raw keys are never stored.
  const found = await prisma.siemInstance.findUnique({
    where: { apiKeyHash: hashToken(raw) },
    include: { organisation: { select: { deletedAt: true } } },
  });
  // A locked (deleted in Clerk) org's SIEM keys stop working.
  if (!found || found.organisation.deletedAt) return unauthorized();

  const { organisation, ...siem } = found;
  void organisation;
  return { ok: true, siem, organisationId: siem.organisationId };
}
