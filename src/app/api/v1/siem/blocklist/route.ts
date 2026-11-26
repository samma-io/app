import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlocklist } from "@/lib/siem-exchange";
import { blocklistSigningKey } from "@/lib/siem-exchange-keys";
import { authSubscribedSiem, fail, notModified } from "@/lib/siem-exchange-http";
import { siemExchange, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/siem/blocklist[?version=N] — the signed community blocklist
 * (latest, or the version named in the feed). The body is exactly the signed
 * bytes; the signature is in X-Samma-Signature and in the feed.
 */
async function handleGet(req: NextRequest) {
  const auth = await authSubscribedSiem(req, "blocklist");
  if (!auth.ok) return auth.response;
  if (!blocklistSigningKey()) return fail("blocklist", "disabled", 404, "The community blocklist is not enabled");

  const v = req.nextUrl.searchParams.get("version");
  let snap;
  if (v !== null) {
    const version = Number(v);
    if (!Number.isInteger(version) || version < 1) return fail("blocklist", "not_found", 404, "Not found");
    snap = await prisma.siemBlocklistSnapshot.findUnique({ where: { version } });
  } else {
    await ensureBlocklist();
    snap = await prisma.siemBlocklistSnapshot.findFirst({ orderBy: { version: "desc" } });
  }
  if (!snap) return fail("blocklist", "not_found", 404, "Not found");

  const etag = `"bl-${snap.version}"`;
  const headers = { ETag: etag, "X-Samma-Sha256": snap.sha256, "X-Samma-Signature": snap.signature, "Cache-Control": "private, no-cache" };
  if (notModified(req, etag)) {
    siemExchange.inc({ endpoint: "blocklist", result: "not_modified" });
    return new NextResponse(null, { status: 304, headers });
  }
  siemExchange.inc({ endpoint: "blocklist", result: "ok" });
  return new NextResponse(snap.body, { headers: { ...headers, "Content-Type": "application/json" } });
}

export const GET = withMetrics("/api/v1/siem/blocklist", handleGet);
