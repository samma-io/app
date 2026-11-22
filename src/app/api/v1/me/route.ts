import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken } from "@/lib/api-auth";
import { withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

/** GET /api/v1/me — which organisation and token this request is using. */
async function handleGet(req: NextRequest) {
  const auth = await authenticateApiToken(req);
  if (!auth.ok) return auth.response;

  const org = await prisma.organisation.findUnique({
    where: { id: auth.organisationId },
    select: { id: true, name: true },
  });
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    organisation: org,
    token: { name: auth.token.name, readOnly: auth.token.readOnly },
  });
}

export const GET = withMetrics("/api/v1/me", handleGet);
