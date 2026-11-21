import type { User as ClerkUser } from "@clerk/nextjs/server";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Finds or creates the local `User` for a Clerk user. Used by the session path
 * (getCurrentUser) and by Clerk webhooks (a user who accepted an invite before
 * ever opening the dashboard).
 *
 * `linkedLegacy` is true when a pre-Clerk (NextAuth) user was linked by email
 * on this call, so the caller can bring that user's orgs into Clerk.
 */
export async function provisionFromClerkUser(
  clerkUser: ClerkUser
): Promise<{ user: User; linkedLegacy: boolean }> {
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (existing) return { user: existing, linkedLegacy: false };

  const primary = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );
  // Only a verified email may be linked to (or create) a local account —
  // otherwise signing up with someone else's address would take over their orgs.
  if (!primary || primary.verification?.status !== "verified") {
    throw new Error("A verified primary email address is required");
  }

  const email = primary.emailAddress.trim().toLowerCase();
  const name =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;

  // Link a pre-Clerk (NextAuth) user with the same email so they keep their orgs.
  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (byEmail) {
    if (byEmail.clerkId && byEmail.clerkId !== clerkUser.id) {
      throw new Error("This email is already linked to another account");
    }
    const user = await prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkId: clerkUser.id, name: byEmail.name ?? name },
    });
    return { user, linkedLegacy: true };
  }

  try {
    const user = await prisma.user.create({
      data: { clerkId: clerkUser.id, email, name, emailVerified: new Date() },
    });
    return { user, linkedLegacy: false };
  } catch (e) {
    // Concurrent first requests for the same user: the other one won.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
      if (user) return { user, linkedLegacy: false };
    }
    throw e;
  }
}
