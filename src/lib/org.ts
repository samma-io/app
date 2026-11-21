import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import type { Organisation, OrgRole, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureClerkOrg } from "@/lib/clerk-sync";

export const ACTIVE_ORG_COOKIE = "active-org-id";

export async function getActiveOrg() {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (orgId) {
    const membership = await prisma.orgMembership.findUnique({
      where: {
        userId_organisationId: {
          userId: user.id,
          organisationId: orgId,
        },
      },
      include: { organisation: true },
    });
    if (membership && !membership.organisation.deletedAt) {
      return linkToClerk(membership.organisation, membership.role, user);
    }
  }

  // Auto-select when user has exactly one org (no cookie needed)
  const memberships = await userMemberships(user.id);
  if (memberships.length === 1) {
    return linkToClerk(memberships[0].organisation, memberships[0].role, user);
  }

  return null;
}

/**
 * An org created before Clerk Organizations gets its Clerk org the first time
 * an OWNER opens it (members are added then, or when they first sign in).
 * Best effort: the dashboard works without the link.
 */
async function linkToClerk(org: Organisation, role: OrgRole, user: User): Promise<Organisation> {
  if (org.clerkOrgId || role !== "OWNER" || !user.clerkId) return org;
  try {
    const clerkOrgId = await ensureClerkOrg(org, user.clerkId);
    return { ...org, clerkOrgId };
  } catch (err) {
    console.error(`[clerk-sync] linking org ${org.id} failed:`, err);
    return org;
  }
}

function userMemberships(userId: string) {
  return prisma.orgMembership.findMany({
    where: { userId, organisation: { deletedAt: null } },
    include: { organisation: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserOrgs(userId: string) {
  const memberships = await userMemberships(userId);
  return memberships.map((m) => m.organisation);
}

export async function requireOrgRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  if (!orgId) throw new Error("No active organization");

  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organisationId: {
        userId: user.id,
        organisationId: orgId,
      },
    },
  });
  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("Insufficient role");
  }

  return membership;
}
