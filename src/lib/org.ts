import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_ORG_COOKIE = "active-org-id";

export async function getActiveOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (orgId) {
    const membership = await prisma.orgMembership.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: orgId,
        },
      },
      include: { organisation: true },
    });
    if (membership) return membership.organisation;
  }

  // Auto-select when user has exactly one org (no cookie needed)
  const orgs = await getUserOrgs(session.user.id);
  if (orgs.length === 1) return orgs[0];

  return null;
}

export async function getUserOrgs(userId: string) {
  const memberships = await prisma.orgMembership.findMany({
    where: { userId },
    include: { organisation: true },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => m.organisation);
}
