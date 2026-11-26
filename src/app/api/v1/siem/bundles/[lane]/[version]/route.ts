import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LANE_RE, VERSION_RE } from "@/lib/siem-exchange";
import { authSubscribedSiem, fail } from "@/lib/siem-exchange-http";
import { siemExchange, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/siem/bundles/<lane>/<version> — one signed ruleset bundle.
 * The signature and hash are in the feed and repeated in the headers; the
 * SIEM must verify the bytes against its pinned rules key before use.
 */
async function handleGet(req: NextRequest, { params }: { params: Promise<{ lane: string; version: string }> }) {
  const auth = await authSubscribedSiem(req, "bundle");
  if (!auth.ok) return auth.response;

  const { lane, version } = await params;
  if (!LANE_RE.test(lane) || !VERSION_RE.test(version)) return fail("bundle", "not_found", 404, "Not found");
  const release = await prisma.siemRuleRelease.findUnique({ where: { lane_version: { lane, version } } });
  if (!release) return fail("bundle", "not_found", 404, "Not found");

  siemExchange.inc({ endpoint: "bundle", result: "ok" });
  return new NextResponse(new Uint8Array(release.bundle), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${lane}-${version}.tar.gz"`,
      "X-Samma-Sha256": release.sha256,
      "X-Samma-Signature": release.signature,
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}

export const GET = withMetrics("/api/v1/siem/bundles/[lane]/[version]", handleGet);
