import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LANE_RE, MAX_BUNDLE_BYTES, VERSION_RE } from "@/lib/siem-exchange";
import { rulesPublicKey, sha256Hex, verifyEd25519 } from "@/lib/siem-exchange-keys";
import { fail } from "@/lib/siem-exchange-http";
import { siemExchange, withMetrics } from "@/lib/metrics/instrument";

export const dynamic = "force-dynamic";

/** Constant-time check of `Authorization: Bearer <SIEM_PUBLISH_TOKEN>`. */
function publisherOk(req: NextRequest): boolean {
  const expected = process.env.SIEM_PUBLISH_TOKEN?.trim();
  if (!expected || expected.length < 32) return false;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(sha256Hex(given), "hex");
  const b = Buffer.from(sha256Hex(expected), "hex");
  return timingSafeEqual(a, b);
}

/**
 * POST /api/v1/siem/releases — the detection-engine CI publishes a signed
 * ruleset bundle for one lane. Body: the tar.gz itself. Headers:
 *   Authorization: Bearer <SIEM_PUBLISH_TOKEN>
 *   X-Samma-Lane, X-Samma-Version, X-Samma-Rule-Count, X-Samma-Signature
 *   (base64 Ed25519 over the body, made with the offline rules key),
 *   optional X-Samma-Summary (one line, ≤ 300 chars).
 * The signature is checked against SIEM_RULES_PUBLIC_KEY before anything is
 * stored, so a leaked publish token alone cannot ship rules. A version is
 * immutable: publishing it again is 409.
 */
async function handlePost(req: NextRequest) {
  if (!publisherOk(req)) return fail("releases", "unauthorized", 401, "Unauthorized");
  const key = rulesPublicKey();
  if (!key) return fail("releases", "disabled", 503, "Rule publishing is not configured");

  const lane = req.headers.get("x-samma-lane") ?? "";
  const version = req.headers.get("x-samma-version") ?? "";
  const signature = req.headers.get("x-samma-signature") ?? "";
  const ruleCount = Number(req.headers.get("x-samma-rule-count"));
  const summary = (req.headers.get("x-samma-summary") ?? "").slice(0, 300);
  if (!LANE_RE.test(lane)) return fail("releases", "invalid", 400, "Invalid X-Samma-Lane");
  if (!VERSION_RE.test(version)) return fail("releases", "invalid", 400, "Invalid X-Samma-Version");
  if (!Number.isInteger(ruleCount) || ruleCount < 0 || ruleCount > 100_000) {
    return fail("releases", "invalid", 400, "Invalid X-Samma-Rule-Count");
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BUNDLE_BYTES) {
    return fail("releases", "invalid", 413, "Bundle too large");
  }
  const bundle = Buffer.from(await req.arrayBuffer());
  if (bundle.length === 0) return fail("releases", "invalid", 400, "Empty bundle");
  if (bundle.length > MAX_BUNDLE_BYTES) return fail("releases", "invalid", 413, "Bundle too large");
  // gzip magic: catches a wrong file before the signature does.
  if (bundle[0] !== 0x1f || bundle[1] !== 0x8b) return fail("releases", "invalid", 400, "Bundle is not gzip");

  if (!verifyEd25519(bundle, signature, key)) {
    return fail("releases", "bad_signature", 400, "Signature does not verify with the rules key");
  }

  const sha256 = sha256Hex(bundle);
  // Checked first so a CI re-run is a quiet 409; the unique index still
  // decides a race.
  const exists = await prisma.siemRuleRelease.findUnique({ where: { lane_version: { lane, version } }, select: { id: true } });
  if (exists) return fail("releases", "conflict", 409, `${lane} ${version} is already published`);
  try {
    await prisma.siemRuleRelease.create({
      data: { lane, version, sha256, signature, ruleCount, summary, bundle },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return fail("releases", "conflict", 409, `${lane} ${version} is already published`);
    }
    throw err;
  }
  siemExchange.inc({ endpoint: "releases", result: "ok" });
  return NextResponse.json({ lane, version, sha256 }, { status: 201 });
}

export const POST = withMetrics("/api/v1/siem/releases", handlePost);
