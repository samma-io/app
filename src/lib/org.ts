import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import type { OrgRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkUnlinkedOrgs, resolveSessionOrg } from "@/lib/clerk-sync";

/**
 * The organisation the user is working in: the active org of their Clerk
 * session (picked with the org switcher), mapped to the local org. Membership
 * is checked against the local OrgMembership mirror (see resolveSessionOrg).
 * Returns null when no org is active; the dashboard then shows the org list.
 */
export const getActiveOrg = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { orgId, orgRole } = await auth();
  if (!orgId) {
    // No org picked yet: make sure the user's pre-Clerk orgs exist in Clerk
    // so they show up in the list. Best effort.
    await linkUnlinkedOrgs(user).catch((err) =>
      console.error(`[clerk-sync] linking orgs for user ${user.id} failed:`, err)
    );
    return null;
  }

  return resolveSessionOrg(user, orgId, orgRole ?? null);
});

/** The user's role in the active org, or null. */
export async function getActiveOrgRole(): Promise<OrgRole | null> {
  const [user, org] = await Promise.all([getCurrentUser(), getActiveOrg()]);
  if (!user || !org) return null;
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organisationId: { userId: user.id, organisationId: org.id } },
  });
  return membership?.role ?? null;
}
