"use server";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getActiveOrg, getUserOrgs, ACTIVE_ORG_COOKIE } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/token";
import { registerTargetWithOperator, removeTargetFromOperator } from "@/lib/operator";
import type { ProfileType } from "@prisma/client";

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
  });
  if (!profile) throw new Error("Profile not found");

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

  const target = await prisma.target.create({
    data: { profileId, value, type, label: label ?? null, port: port ?? null },
  });

  const deployed = await registerTargetWithOperator(target.value, target.id, profile.type, profile.id)
    .catch((err) => { console.error("[operator] registration failed:", err); return false; });

  const updated = deployed
    ? await prisma.target.update({ where: { id: target.id }, data: { scannerStatus: "DEPLOYED" } })
    : target;

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

  removeTargetFromOperator(target.value).catch(
    (err) => console.error("[operator] remove on delete failed:", err)
  );

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

  await removeTargetFromOperator(target.value).catch(
    (err) => console.error("[operator] undeploy failed:", err)
  );

  await prisma.target.update({
    where: { id: targetId },
    data: { scannerStatus: "READY_TO_DEPLOY" },
  });

  revalidatePath(`/dashboard/profiles/${profileId}`);
  revalidatePath("/dashboard");
}

// ─── API Tokens ───────────────────────────────────────────────────────────────

export async function createToken(name: string): Promise<{ raw: string }> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");

  const { raw, hash } = generateToken();

  await prisma.apiToken.create({
    data: { organisationId: org.id, name, tokenHash: hash },
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

// ─── Organisations ────────────────────────────────────────────────────────────

export async function createOrganisation(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const org = await prisma.organisation.create({
    data: {
      name,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
      profiles: {
        create: { name: "Default", type: "SMALL", isDefault: true },
      },
    },
  });

  // Auto-select the new org
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return org;
}

export async function setActiveOrgAction(organisationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Validate membership
  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId,
      },
    },
  });
  if (!membership) throw new Error("Not a member of this organization");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organisationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}

export async function getCurrentUserOrgs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return getUserOrgs(session.user.id);
}
