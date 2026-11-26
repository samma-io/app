import { isIP } from "net";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrivateIp } from "@/lib/network";
import { blocklistSigningKey, sha256Hex, signEd25519 } from "@/lib/siem-exchange-keys";

// The Samma rule exchange: signed rulesets and a community blocklist go down
// to SIEMs through a feed; attacker IPs come up from SIEMs that opted in.
// Contract: docs/siem-exchange.md. Keys: src/lib/siem-exchange-keys.ts.

export const LANE_RE = /^[a-z][a-z0-9-]{0,31}$/;
export const VERSION_RE = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,39}$/;
const RULE_ID_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
const CATEGORY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export const MAX_BUNDLE_BYTES = 5 * 1024 * 1024;
export const MAX_INDICATOR_BYTES = 256 * 1024;
export const MAX_INDICATORS = 500;

/** Reports older than this neither count for the blocklist nor are kept. */
export const INDICATOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** A blocklist snapshot is checked for changes at most this often. */
const BLOCKLIST_REFRESH_MS = 5 * 60 * 1000;
/** A snapshot is re-signed after this even if nothing changed, so it never expires while valid. */
const BLOCKLIST_RESIGN_MS = 12 * 60 * 60 * 1000;
/** SIEMs drop a snapshot's entries this long after it was generated. */
const BLOCKLIST_TTL_MS = 24 * 60 * 60 * 1000;
const BLOCKLIST_MAX_ENTRIES = 10_000;

/** Organisations that must report an IP before it is published. Default 3. */
export function blocklistMinOrgs(): number {
  const n = Number(process.env.SIEM_BLOCKLIST_MIN_ORGS ?? 3);
  return Number.isInteger(n) && n >= 1 ? n : 3;
}

/** The feed, bundles and blocklist are part of the rules subscription. */
export async function hasActiveSubscription(organisationId: string): Promise<boolean> {
  const sub = await prisma.siemSubscription.findUnique({ where: { organisationId } });
  return !!sub && sub.active && (!sub.renewsAt || sub.renewsAt > new Date());
}

// ─── Indicators ──────────────────────────────────────────────────────────────

export interface Indicator {
  ip: string;
  ruleId: string;
  category: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * A public unicast address, normalised, or null. Private, loopback,
 * link-local, CGNAT, multicast and reserved addresses are never accepted: they
 * say nothing about an attacker on the internet.
 */
export function publicIp(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 45) return null;
  const v = value.trim().toLowerCase();
  const family = isIP(v);
  if (!family || isPrivateIp(v)) return null;
  if (family === 4) {
    const first = Number(v.split(".")[0]);
    if (first >= 224) return null; // multicast + reserved + broadcast
  } else if (v.startsWith("ff") || v.startsWith("::ffff:") || v.startsWith("2001:db8")) {
    return null;
  }
  return v;
}

function parseTime(value: unknown): Date | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export type IndicatorParse =
  | { ok: true; indicators: Indicator[]; skipped: number }
  | { ok: false; error: string };

/**
 * Validate an indicator post. A malformed body is rejected as a whole; single
 * entries that are well-formed but not usable (private IP, too old) are
 * skipped and counted, so one odd address does not lose the whole batch.
 */
export function parseIndicators(body: unknown, now = new Date()): IndicatorParse {
  if (typeof body !== "object" || body === null || !Array.isArray((body as { indicators?: unknown }).indicators)) {
    return { ok: false, error: "expected {\"indicators\": [...]}" };
  }
  const list = (body as { indicators: unknown[] }).indicators;
  if (list.length > MAX_INDICATORS) return { ok: false, error: `at most ${MAX_INDICATORS} indicators per post` };

  const out = new Map<string, Indicator>();
  let skipped = 0;
  for (const [i, raw] of list.entries()) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: `indicators[${i}] is not an object` };
    const r = raw as Record<string, unknown>;
    if (typeof r.rule_id !== "string" || !RULE_ID_RE.test(r.rule_id)) return { ok: false, error: `indicators[${i}].rule_id is invalid` };
    if (typeof r.category !== "string" || !CATEGORY_RE.test(r.category)) return { ok: false, error: `indicators[${i}].category is invalid` };
    if (typeof r.count !== "number" || !Number.isInteger(r.count) || r.count < 1 || r.count > 1_000_000) {
      return { ok: false, error: `indicators[${i}].count must be an integer 1–1000000` };
    }
    const firstSeen = parseTime(r.first_seen);
    const lastSeen = parseTime(r.last_seen);
    if (!firstSeen || !lastSeen || firstSeen > lastSeen) return { ok: false, error: `indicators[${i}] has invalid first_seen/last_seen` };
    if (lastSeen.getTime() > now.getTime() + 5 * 60 * 1000) return { ok: false, error: `indicators[${i}].last_seen is in the future` };

    const ip = publicIp(r.ip);
    if (!ip || now.getTime() - lastSeen.getTime() > INDICATOR_WINDOW_MS) {
      skipped++;
      continue;
    }
    const key = `${ip}|${r.rule_id}`;
    const prev = out.get(key);
    out.set(key, prev
      ? { ...prev, count: prev.count + r.count, firstSeen: prev.firstSeen < firstSeen ? prev.firstSeen : firstSeen, lastSeen: prev.lastSeen > lastSeen ? prev.lastSeen : lastSeen }
      : { ip, ruleId: r.rule_id, category: r.category, count: r.count, firstSeen, lastSeen });
  }
  return { ok: true, indicators: [...out.values()], skipped };
}

/** Addresses one SIEM has shared that still count (last 7 days). */
export function countSharedIndicators(siemInstanceId: string): Promise<number> {
  return prisma.siemIndicator.count({
    where: { siemInstanceId, lastSeen: { gt: new Date(Date.now() - INDICATOR_WINDOW_MS) } },
  });
}

/** Add a SIEM's indicators: counts accumulate, the seen-window widens. */
export async function storeIndicators(siemInstanceId: string, organisationId: string, list: Indicator[]) {
  if (list.length === 0) return;
  const rows = list.map((x) =>
    Prisma.sql`(gen_random_uuid()::text, ${siemInstanceId}, ${organisationId}, ${x.ip}, ${x.ruleId}, ${x.category}, ${x.count}, ${x.firstSeen}, ${x.lastSeen}, now())`,
  );
  await prisma.$executeRaw`
    INSERT INTO "SiemIndicator" ("id", "siemInstanceId", "organisationId", "ip", "ruleId", "category", "count", "firstSeen", "lastSeen", "updatedAt")
    VALUES ${Prisma.join(rows)}
    ON CONFLICT ("siemInstanceId", "ip", "ruleId") DO UPDATE SET
      "category"  = EXCLUDED."category",
      "count"     = LEAST("SiemIndicator"."count"::bigint + EXCLUDED."count", 2147483647)::int,
      "firstSeen" = LEAST("SiemIndicator"."firstSeen", EXCLUDED."firstSeen"),
      "lastSeen"  = GREATEST("SiemIndicator"."lastSeen", EXCLUDED."lastSeen"),
      "updatedAt" = now()`;
}

// ─── Community blocklist ─────────────────────────────────────────────────────

interface BlockEntry {
  ip: string;
  category: string;
  rule_ids: string[];
  orgs: number;
}

/** IPv4 CIDRs from SIEM_BLOCKLIST_EXCLUDE (e.g. CDN ranges) that are never published. */
function excludedRanges(): Array<[number, number]> {
  return (process.env.SIEM_BLOCKLIST_EXCLUDE ?? "")
    .split(",")
    .map((s) => s.trim())
    .flatMap((cidr) => {
      const [addr, bits = "32"] = cidr.split("/");
      const n = Number(bits);
      if (isIP(addr) !== 4 || !Number.isInteger(n) || n < 0 || n > 32) return [];
      const mask = n === 0 ? 0 : (~0 << (32 - n)) >>> 0;
      return [[(ipv4ToInt(addr) & mask) >>> 0, mask] as [number, number]];
    });
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((a, o) => ((a << 8) | Number(o)) >>> 0, 0);
}

function isExcluded(ip: string, ranges: Array<[number, number]>): boolean {
  if (isIP(ip) !== 4) return false;
  const n = ipv4ToInt(ip);
  return ranges.some(([net, mask]) => ((n & mask) >>> 0) === net);
}

async function computeEntries() {
  const minOrgs = blocklistMinOrgs();
  const since = new Date(Date.now() - INDICATOR_WINDOW_MS);
  const rows = await prisma.$queryRaw<Array<{ ip: string; orgs: bigint; rule_ids: string[]; category: string }>>`
    SELECT "ip",
           count(DISTINCT "organisationId") AS orgs,
           array_agg(DISTINCT "ruleId" ORDER BY "ruleId") AS rule_ids,
           mode() WITHIN GROUP (ORDER BY "category") AS category
    FROM "SiemIndicator"
    WHERE "lastSeen" > ${since}
    GROUP BY "ip"
    HAVING count(DISTINCT "organisationId") >= ${minOrgs}
    ORDER BY orgs DESC, "ip"
    LIMIT ${BLOCKLIST_MAX_ENTRIES}`;
  const allows = await prisma.siemCommunityAllow.findMany({ orderBy: { ip: "asc" }, select: { ip: true, reason: true } });
  const allowed = new Set(allows.map((a) => a.ip));
  const ranges = excludedRanges();
  const block: BlockEntry[] = rows
    .filter((r) => !allowed.has(r.ip) && !isExcluded(r.ip, ranges))
    .map((r) => ({ ip: r.ip, category: r.category, rule_ids: r.rule_ids, orgs: Number(r.orgs) }));
  return { minOrgs, block, allow: allows };
}

let refreshing: Promise<void> | null = null;
let lastCheck = 0;

/**
 * Make sure a current, signed blocklist snapshot exists. Each app process
 * checks at most every 5 minutes (on feed and blocklist requests) and also
 * prunes old indicators then. A new snapshot is signed only when the entries
 * changed, or every 12 h so a valid list never expires. Does nothing when
 * SIEM_BLOCKLIST_SIGNING_KEY is unset.
 */
export async function ensureBlocklist(): Promise<void> {
  const key = blocklistSigningKey();
  if (!key || Date.now() - lastCheck < BLOCKLIST_REFRESH_MS) return;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    await prisma.siemIndicator.deleteMany({ where: { lastSeen: { lt: new Date(Date.now() - INDICATOR_WINDOW_MS) } } });
    const { minOrgs, block, allow } = await computeEntries();
    const digest = sha256Hex(JSON.stringify({ minOrgs, block, allow }));
    const latest = await prisma.siemBlocklistSnapshot.findFirst({
      orderBy: { version: "desc" },
      select: { version: true, digest: true, createdAt: true },
    });
    const unchanged = latest && latest.digest === digest && Date.now() - latest.createdAt.getTime() < BLOCKLIST_RESIGN_MS;
    if (!unchanged) {
      const version = (latest?.version ?? 0) + 1;
      const generatedAt = new Date();
      const body = JSON.stringify({
        schema: "samma.blocklist/1",
        version,
        generated_at: generatedAt.toISOString(),
        expires_at: new Date(generatedAt.getTime() + BLOCKLIST_TTL_MS).toISOString(),
        min_orgs: minOrgs,
        block,
        allow,
      });
      try {
        await prisma.siemBlocklistSnapshot.create({
          data: { version, body, digest, sha256: sha256Hex(body), signature: signEd25519(body, key), createdAt: generatedAt },
        });
      } catch (err) {
        // Another replica signed this version first; theirs is as good as ours.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
      }
    }
    lastCheck = Date.now();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// ─── Feed ────────────────────────────────────────────────────────────────────

function xml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The Atom feed: the latest ruleset per lane and the latest blocklist
 * snapshot. Entries are only an index; the payloads are fetched separately and
 * verified by signature. Links are root-relative to the app.
 */
export async function buildFeed(): Promise<string> {
  await ensureBlocklist();
  const releases = await prisma.siemRuleRelease.findMany({
    distinct: ["lane"],
    orderBy: [{ lane: "asc" }, { createdAt: "desc" }],
    select: { lane: true, version: true, sha256: true, signature: true, ruleCount: true, summary: true, createdAt: true },
  });
  const blocklist = blocklistSigningKey()
    ? await prisma.siemBlocklistSnapshot.findFirst({
        orderBy: { version: "desc" },
        select: { version: true, sha256: true, signature: true, createdAt: true },
      })
    : null;

  const times = [...releases.map((r) => r.createdAt), ...(blocklist ? [blocklist.createdAt] : [])];
  const updated = times.length ? new Date(Math.max(...times.map((t) => t.getTime()))) : new Date(0);

  const entries = releases.map((r) => {
    const href = `/api/v1/siem/bundles/${r.lane}/${encodeURIComponent(r.version)}`;
    return `  <entry>
    <id>urn:samma:ruleset:${r.lane}:${xml(r.version)}</id>
    <title>${xml(`${r.lane} ${r.version}`)}</title>
    <updated>${r.createdAt.toISOString()}</updated>
    <link rel="enclosure" type="application/gzip" href="${xml(href)}"/>
    <summary>${xml(r.summary)}</summary>
    <s:type>ruleset</s:type>
    <s:lane>${r.lane}</s:lane>
    <s:version>${xml(r.version)}</s:version>
    <s:rule-count>${r.ruleCount}</s:rule-count>
    <s:sha256>${r.sha256}</s:sha256>
    <s:sig>${r.signature}</s:sig>
  </entry>`;
  });
  if (blocklist) {
    entries.push(`  <entry>
    <id>urn:samma:blocklist:${blocklist.version}</id>
    <title>Community blocklist ${blocklist.version}</title>
    <updated>${blocklist.createdAt.toISOString()}</updated>
    <link rel="enclosure" type="application/json" href="/api/v1/siem/blocklist?version=${blocklist.version}"/>
    <s:type>blocklist</s:type>
    <s:version>${blocklist.version}</s:version>
    <s:sha256>${blocklist.sha256}</s:sha256>
    <s:sig>${blocklist.signature}</s:sig>
  </entry>`);
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:s="https://samma.io/ns/siem-feed/1">
  <id>urn:samma:siem-feed</id>
  <title>Samma detection rules</title>
  <updated>${updated.toISOString()}</updated>
${entries.join("\n")}
</feed>
`;
}
