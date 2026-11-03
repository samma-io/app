import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Identity is handled by Clerk; the local `User` row (linked via `clerkId`)
 * stays the anchor for org memberships and everything else in the app.
 *
 * Returns the local user for the signed-in Clerk session, provisioning it on
 * first use. Returns null only when nobody is signed in.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  return provisionUser(userId);
});

/** For server components / pages: redirects to sign-in when signed out. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For server actions: throws when signed out. */
export async function requireUserForAction(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

async function provisionUser(clerkId: string): Promise<User> {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Clerk user not found");

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
    if (byEmail.clerkId && byEmail.clerkId !== clerkId) {
      throw new Error("This email is already linked to another account");
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkId, name: byEmail.name ?? name },
    });
  }

  try {
    return await prisma.user.create({
      data: { clerkId, email, name, emailVerified: new Date() },
    });
  } catch (e) {
    // Concurrent first requests for the same user: the other one won.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) return user;
    }
    throw e;
  }
}
