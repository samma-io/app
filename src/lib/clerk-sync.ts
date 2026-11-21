import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { Prisma, type OrgRole, type Organisation, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { provisionFromClerkUser } from "@/lib/users";

// Keeps local organisations in step with Clerk Organizations.
//
// Clerk owns who is in which org and with what role (members, invites).
// The local DB owns everything the org has (profiles, targets, tokens, runs)
// and stays the authorisation check: OrgMembership is mirrored from Clerk,
// never trusted from a cookie or a session claim alone.
//
// Link between the two: Organisation.clerkOrgId, plus privateMetadata.sammaOrgId
// on the Clerk side for orgs Samma created, so a webhook that arrives before
// we stored clerkOrgId links instead of creating a duplicate.

const CLERK_ADMIN = "org:admin";
const CLERK_MEMBER = "org:member";

export const toLocalRole = (clerkRole: string): OrgRole =>
  clerkRole === CLERK_ADMIN ? "OWNER" : "MEMBER";
export const toClerkRole = (role: OrgRole): string =>
  role === "OWNER" ? CLERK_ADMIN : CLERK_MEMBER;

type OrganizationJSON = Extract<WebhookEvent, { type: "organization.created" | "organization.updated" }>["data"];
type OrganizationMembershipJSON = Extract<
  WebhookEvent,
  { type: "organizationMembership.created" | "organizationMembership.deleted" | "organizationMembership.updated" }
>["data"];

type ClerkOrgRef = { id: string; name: string; sammaOrgId?: string };

function fromJson(o: OrganizationJSON): ClerkOrgRef {
  const meta = (o.private_metadata ?? {}) as Record<string, unknown>;
  return { id: o.id, name: o.name, sammaOrgId: typeof meta.sammaOrgId === "string" ? meta.sammaOrgId : undefined };
}

/** A new org always starts with a Default profile. */
export async function createLocalOrg(name: string, clerkOrgId?: string) {
  return prisma.organisation.create({
    data: {
      name,
      clerkOrgId,
      profiles: { create: { name: "Default", type: "SMALL", isDefault: true } },
    },
  });
}

/** Finds (or creates) the local org for a Clerk org. Idempotent. */
async function resolveLocalOrg(ref: ClerkOrgRef): Promise<Organisation> {
  const linked = await prisma.organisation.findUnique({ where: { clerkOrgId: ref.id } });
  if (linked) return linked;

  if (ref.sammaOrgId) {
    const local = await prisma.organisation.findUnique({ where: { id: ref.sammaOrgId } });
    if (local && !local.clerkOrgId) {
      return prisma.organisation.update({ where: { id: local.id }, data: { clerkOrgId: ref.id } });
    }
    if (local) throw new Error(`Org ${local.id} is already linked to another Clerk org`);
  }

  try {
    return await createLocalOrg(ref.name, ref.id);
  } catch (e) {
    // A concurrent webhook created it first.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const org = await prisma.organisation.findUnique({ where: { clerkOrgId: ref.id } });
      if (org) return org;
    }
    throw e;
  }
}

/** organization.created / organization.updated */
export async function upsertOrgFromClerk(o: OrganizationJSON) {
  const ref = fromJson(o);
  const org = await resolveLocalOrg(ref);
  if (org.name !== ref.name) {
    await prisma.organisation.update({ where: { id: org.id }, data: { name: ref.name } });
  }
}

/** organization.deleted: keep every row, lock the org. */
export async function lockOrg(clerkOrgId: string) {
  await prisma.organisation.updateMany({
    where: { clerkOrgId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/** organizationMembership.created / .updated */
export async function upsertMembershipFromClerk(m: OrganizationMembershipJSON) {
  const org = await resolveLocalOrg(fromJson(m.organization));
  const clerkUserId = m.public_user_data.user_id;

  let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) {
    const client = await clerkClient();
    try {
      user = (await provisionFromClerkUser(await client.users.getUser(clerkUserId))).user;
    } catch (err) {
      // No verified email yet: the membership is mirrored when they first sign in.
      console.warn(`[clerk-sync] membership for ${clerkUserId} not mirrored:`, (err as Error).message);
      return;
    }
  }

  const role = toLocalRole(m.role);
  await prisma.orgMembership.upsert({
    where: { userId_organisationId: { userId: user.id, organisationId: org.id } },
    create: { userId: user.id, organisationId: org.id, role },
    update: { role },
  });
}

/** organizationMembership.deleted */
export async function removeMembership(clerkOrgId: string, clerkUserId: string) {
  await prisma.orgMembership.deleteMany({
    where: { organisation: { clerkOrgId }, user: { clerkId: clerkUserId } },
  });
}

async function addClerkMembership(organizationId: string, userId: string, role: OrgRole) {
  const client = await clerkClient();
  try {
    await client.organizations.createOrganizationMembership({
      organizationId,
      userId,
      role: toClerkRole(role),
    });
  } catch (err) {
    if (isClerkAPIResponseError(err) && err.errors.some((e) => e.code === "already_a_member_in_organization")) {
      return;
    }
    throw err;
  }
}

/**
 * Creates the Clerk org for a local org that has none, with `creatorClerkId`
 * (an OWNER) as its admin, and adds every other member who has signed in with
 * Clerk. Members who sign in later are added by linkUserOrgsToClerk.
 * Only an OWNER may be the creator: the creator becomes a Clerk admin.
 */
export async function ensureClerkOrg(org: Organisation, creatorClerkId: string): Promise<string> {
  if (org.clerkOrgId) return org.clerkOrgId;

  const client = await clerkClient();
  const created = await client.organizations.createOrganization({
    name: org.name,
    createdBy: creatorClerkId,
    privateMetadata: { sammaOrgId: org.id },
  });

  // Link only if nobody linked it meanwhile; otherwise drop the extra Clerk org.
  const { count } = await prisma.organisation.updateMany({
    where: { id: org.id, clerkOrgId: null },
    data: { clerkOrgId: created.id },
  });
  if (count === 0) {
    await client.organizations.deleteOrganization(created.id).catch(() => {});
    const current = await prisma.organisation.findUniqueOrThrow({ where: { id: org.id } });
    return current.clerkOrgId!;
  }

  const members = await prisma.orgMembership.findMany({
    where: { organisationId: org.id, user: { clerkId: { not: null } } },
    include: { user: true },
  });
  for (const m of members) {
    if (m.user.clerkId === creatorClerkId) continue;
    await addClerkMembership(created.id, m.user.clerkId!, m.role);
  }
  return created.id;
}

/**
 * Brings a user's local orgs into Clerk: creates the Clerk org if the user owns
 * it and it has none yet, otherwise adds the user to the existing Clerk org.
 */
export async function linkUserOrgsToClerk(user: User) {
  if (!user.clerkId) return;
  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id, organisation: { deletedAt: null } },
    include: { organisation: true },
  });
  for (const m of memberships) {
    if (m.organisation.clerkOrgId) {
      await addClerkMembership(m.organisation.clerkOrgId, user.clerkId, m.role);
    } else if (m.role === "OWNER") {
      await ensureClerkOrg(m.organisation, user.clerkId);
    }
  }
}
