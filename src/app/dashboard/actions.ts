"use server";

import { revalidatePath } from "next/cache";
import { getActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";
import { registerTargetWithOperator, removeTargetFromOperator } from "@/lib/operator";
import { isLocalTarget } from "@/lib/network";
import { checkReachability } from "@/lib/reachability";
import { getExternalScanner } from "@/lib/external-scanners";
import { startExternalScans } from "@/lib/external-scans";
import { encryptSecret, SecretBoxNotConfigured } from "@/lib/secret-box";
import { getSiemProvider } from "@/lib/siem";
import { targetsCreated } from "@/lib/metrics/instrument";
import { Prisma, type ProfileType, type SiemHosting } from "@prisma/client";

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function createProfile(name: string, type: ProfileType = "SMALL") {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const profile = await prisma.profile.create({
    data: { organisationId: org.id, name, type },
  });

  revalidatePath("/dashboard/profiles");
  revalidatePath("/dashboard");
  return profile;
}

export async function deleteProfile(profileId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, organisationId: org.id },
    include: { targets: true },
  });
  if (!profile) throw new Error("Profile not found");

  // Remove each target from the operator before deleting the profile so its
  // Scanner CRs are not left orphaned. "not_configured" (dev) and "removed"
  // do not block deletion; only a genuine operator failure aborts, keeping
  // the records available for retry.
  const failedRemovals: string[] = [];
  for (const target of profile.targets) {
    const result = await removeTargetFromOperator(target.value);
    if (result === "failed") failedRemovals.push(target.value);
  }

  if (failedRemovals.length > 0) {
    throw new Error(
      `Operator failed to remove scanners for: ${failedRemovals.join(", ")}. Profile was not deleted.`
    );
  }

  await prisma.profile.delete({ where: { id: profileId } });

  revalidatePath("/dashboard/profiles");
  revalidatePath("/dashboard");
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export async function addTarget(
  profileId: string,
  value: string,
  type: "ip" | "dns",
  label?: string,
  port?: number
) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, organisationId: org.id },
  });
  if (!profile) throw new Error("Profile not found");

  const local = await isLocalTarget(value, type);
  // Can samma.io reach it from outside? A LOCAL target cannot. Its port, or 443/80 (src/lib/reachability.ts).
  const reachabilityStatus = local ? "DOWN" : await checkReachability(value, type, port);

  const target = await prisma.target.create({
    data: {
      profileId,
      value,
      type,
      label: label ?? null,
      port: port ?? null,
      scannerStatus: local ? "LOCAL" : "READY_TO_DEPLOY",
      reachabilityStatus,
    },
  });
  targetsCreated.inc({ source: "dashboard" });

  if (local) {
    const updated = target;
    revalidatePath(`/dashboard/profiles/${profileId}`);
    revalidatePath("/dashboard");
    return updated;
  }

  const deployed = await registerTargetWithOperator(target.value, target.id, profile.type, profile.id)
    .catch((err) => { console.error("[operator] registration failed:", err); return false; });

  const updated = deployed
    ? await prisma.target.update({ where: { id: target.id }, data: { scannerStatus: "DEPLOYED" } })
    : target;

  await startExternalScans(target.id, "new-target")
    .catch((err) => console.error("[external-scans] start failed:", err instanceof Error ? err.message : err));

  revalidatePath(`/dashboard/profiles/${profileId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteTarget(targetId: string, profileId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const target = await prisma.target.findFirst({
    where: { id: targetId, profile: { organisationId: org.id } },
  });
  if (!target) throw new Error("Target not found");

  const result = await removeTargetFromOperator(target.value);
  if (result === "failed") {
    throw new Error(
      `Operator failed to remove scanners for target "${target.value}". Target was not deleted.`
    );
  }

  await prisma.target.delete({ where: { id: targetId } });

  revalidatePath(`/dashboard/profiles/${profileId}`);
  revalidatePath("/dashboard");
}

export async function deployTarget(targetId: string, profileId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const target = await prisma.target.findFirst({
    where: { id: targetId, profile: { id: profileId, organisationId: org.id } },
    include: { profile: true },
  });
  if (!target) throw new Error("Target not found");

  if (target.scannerStatus === "LOCAL") {
    throw new Error("Local targets cannot be deployed");
  }

  const local = await isLocalTarget(target.value, target.type);
  if (local) {
    console.error("[deployTarget] refused local target:", target.value);
    if (target.scannerStatus !== "DEPLOYED") {
      await prisma.target.update({
        where: { id: targetId },
        data: { scannerStatus: "LOCAL" },
      });
    }
    throw new Error("Local targets cannot be deployed");
  }

  const deployed = await registerTargetWithOperator(
    target.value, target.id, target.profile.type, target.profile.id
  ).catch((err) => { console.error("[operator] deploy failed:", err); return false; });

  await prisma.target.update({
    where: { id: targetId },
    data: { scannerStatus: deployed ? "DEPLOYED" : "READY_TO_DEPLOY" },
  });

  revalidatePath(`/dashboard/profiles/${profileId}`);
  revalidatePath("/dashboard");
}

export async function undeployTarget(targetId: string, profileId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const target = await prisma.target.findFirst({
    where: { id: targetId, profile: { organisationId: org.id } },
  });
  if (!target) throw new Error("Target not found");

  const result = await removeTargetFromOperator(target.value);
  if (result === "failed") {
    throw new Error(
      `Operator failed to remove scanners for target "${target.value}".`
    );
  }

  await prisma.target.update({
    where: { id: targetId },
    data: { scannerStatus: "READY_TO_DEPLOY" },
  });

  revalidatePath(`/dashboard/profiles/${profileId}`);
  revalidatePath("/dashboard");
}

// ─── API Tokens ───────────────────────────────────────────────────────────────

export async function createToken(name: string, readOnly = false): Promise<{ raw: string }> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const { raw, hash } = generateToken();

  await prisma.apiToken.create({
    data: { organisationId: org.id, name, tokenHash: hash, readOnly },
  });

  revalidatePath("/dashboard/tokens");

  return { raw };
}

export async function revokeToken(tokenId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const token = await prisma.apiToken.findFirst({
    where: { id: tokenId, organisationId: org.id },
  });
  if (!token) throw new Error("Token not found");

  await prisma.apiToken.delete({ where: { id: tokenId } });

  revalidatePath("/dashboard/tokens");
}

// ─── Clusters ─────────────────────────────────────────────────────────────────

// Forget a connected cluster. Its targets stay, without a cluster. A cluster
// that still calls the API with its name comes back on its next call.
export async function removeCluster(clusterId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const cluster = await prisma.cluster.findFirst({
    where: { id: clusterId, organisationId: org.id },
  });
  if (!cluster) throw new Error("Cluster not found");

  await prisma.cluster.delete({ where: { id: cluster.id } });

  revalidatePath("/dashboard/clusters");
}

// ─── External Scanners ────────────────────────────────────────────────────────

const MAX_API_KEY_LENGTH = 512;

// Connect an external scanner from the catalog. The vendor API key is
// encrypted before it is stored and is never returned to the client.
// Returns an error message instead of throwing so the form can show it.
export async function connectExternalScanner(input: {
  scannerId: string;
  name: string;
  apiKey: string;
}): Promise<{ error?: string }> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const scanner = getExternalScanner(input.scannerId);
  if (!scanner) return { error: "Unknown scanner" };

  const name = input.name.trim().slice(0, 100) || scanner.label;
  const apiKey = input.apiKey.trim();
  if (!apiKey) return { error: "API key is required" };
  if (apiKey.length > MAX_API_KEY_LENGTH) return { error: "API key is too long" };

  let apiKeyEncrypted: string;
  try {
    apiKeyEncrypted = encryptSecret(apiKey);
  } catch (err) {
    if (err instanceof SecretBoxNotConfigured) {
      return { error: "External scanners are not configured on this server (SCANNER_SECRET_KEY)." };
    }
    throw err;
  }

  try {
    await prisma.externalScannerConnection.create({
      data: {
        organisationId: org.id,
        scannerId: scanner.id,
        name,
        apiKeyEncrypted,
        apiKeyLast4: apiKey.slice(-4),
        pricePerScanCents: scanner.pricePerScanCents,
        currency: scanner.currency,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `A connection named "${name}" already exists` };
    }
    throw err;
  }

  revalidatePath("/dashboard/scanners");
  return {};
}

export async function removeExternalScanner(connectionId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const connection = await prisma.externalScannerConnection.findFirst({
    where: { id: connectionId, organisationId: org.id },
  });
  if (!connection) throw new Error("Connection not found");

  await prisma.externalScannerConnection.delete({ where: { id: connection.id } });

  revalidatePath("/dashboard/scanners");
  revalidatePath("/dashboard/profiles", "layout");
}

// Enable or disable an external scanner on a profile. Both must belong to the
// active organisation.
export async function setProfileExternalScanner(
  profileId: string,
  connectionId: string,
  enabled: boolean
) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const [profile, connection] = await Promise.all([
    prisma.profile.findFirst({ where: { id: profileId, organisationId: org.id } }),
    prisma.externalScannerConnection.findFirst({
      where: { id: connectionId, organisationId: org.id },
    }),
  ]);
  if (!profile) throw new Error("Profile not found");
  if (!connection) throw new Error("Connection not found");

  const key = { profileId_connectionId: { profileId: profile.id, connectionId: connection.id } };
  if (enabled) {
    await prisma.profileExternalScanner.upsert({ where: key, create: key.profileId_connectionId, update: {} });
  } else {
    await prisma.profileExternalScanner.deleteMany({ where: key.profileId_connectionId });
  }

  revalidatePath(`/dashboard/profiles/${profile.id}`);
  revalidatePath("/dashboard/scanners");
}

// Scan one target again with one external scanner. The target and connection
// must belong to the active organisation and the scanner must be enabled on
// the target's profile.
export async function rescanExternal(targetId: string, connectionId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const target = await prisma.target.findFirst({
    where: { id: targetId, profile: { organisationId: org.id } },
  });
  if (!target) throw new Error("Target not found");
  if (target.scannerStatus === "LOCAL") throw new Error("Local targets cannot be scanned");

  const enabled = await prisma.profileExternalScanner.findFirst({
    where: { profileId: target.profileId, connectionId, connection: { organisationId: org.id } },
  });
  if (!enabled) throw new Error("Scanner not found");

  await startExternalScans(target.id, "rescan", connectionId);

  revalidatePath(`/dashboard/profiles/${target.profileId}/targets/${target.id}`);
  revalidatePath("/dashboard/scanners");
}

// ─── SIEM ────────────────────────────────────────────────────────────────────

const SIEM_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/;
const SIEM_HOSTINGS: SiemHosting[] = ["ANKRA_SAMMA", "ANKRA_OWN", "CONNECTED"];

// The prefix makes a leaked SIEM key easy to recognise (and to tell apart from
// an /api/v1 token). Only SHA-256(raw) is stored.
function newSiemKey() {
  const raw = `samma_siem_${generateToken().raw}`;
  return { raw, hash: hashToken(raw), last4: raw.slice(-4) };
}

/**
 * Create a SIEM: a mocked Ankra deploy, or a connection to a SIEM the org
 * already runs. Either way the SIEM key is returned once and only its hash is
 * stored.
 */
export async function createSiemInstance(input: {
  name: string;
  hosting: string;
  provider?: string;
  region?: string;
}): Promise<{ error?: string; id?: string; key?: string }> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const name = input.name.trim();
  if (!SIEM_NAME_RE.test(name)) {
    return { error: "Use 1–64 letters, digits, spaces, dots, dashes or underscores." };
  }
  const hosting = SIEM_HOSTINGS.find((h) => h === input.hosting);
  if (!hosting) return { error: "Unknown hosting option" };

  let provider: string | null = null;
  let region: string | null = null;
  if (hosting === "ANKRA_OWN") {
    const p = getSiemProvider(input.provider);
    if (!p) return { error: "Choose a hosting provider" };
    if (!(p.regions as readonly string[]).includes(input.region ?? "")) {
      return { error: "Choose a region" };
    }
    provider = p.id;
    region = input.region!;
  }

  const key = newSiemKey();
  try {
    const siem = await prisma.siemInstance.create({
      data: {
        organisationId: org.id,
        name,
        hosting,
        provider,
        region,
        apiKeyHash: key.hash,
        apiKeyLast4: key.last4,
      },
    });
    revalidatePath("/dashboard/siem");
    return { id: siem.id, key: key.raw };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `A SIEM named "${name}" already exists` };
    }
    throw err;
  }
}

/** Replace a SIEM's key. The old key stops working; the new one is shown once. */
export async function rotateSiemKey(siemId: string): Promise<{ key: string }> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const siem = await prisma.siemInstance.findFirst({
    where: { id: siemId, organisationId: org.id },
  });
  if (!siem) throw new Error("SIEM not found");

  const key = newSiemKey();
  await prisma.siemInstance.update({
    where: { id: siem.id },
    data: { apiKeyHash: key.hash, apiKeyLast4: key.last4 },
  });

  revalidatePath(`/dashboard/siem/${siem.id}`);
  return { key: key.raw };
}

export async function removeSiemInstance(siemId: string) {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const siem = await prisma.siemInstance.findFirst({
    where: { id: siemId, organisationId: org.id },
  });
  if (!siem) throw new Error("SIEM not found");

  await prisma.siemInstance.delete({ where: { id: siem.id } });
  revalidatePath("/dashboard/siem");
}
