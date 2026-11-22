import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { provisionFromClerkUser } from "@/lib/users";
import { linkUserOrgsToClerk } from "@/lib/clerk-sync";

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

  const user =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ?? (await provisionUser());
  touchLastSeen(user);
  return user;
});

// How often an active user's lastSeenAt is moved: enough for daily/weekly/
// monthly active-user counts without a write on every request.
const LAST_SEEN_INTERVAL_MS = 5 * 60 * 1000;

/** Fire-and-forget, like ApiToken.lastUsedAt: a failed write never blocks a request. */
function touchLastSeen(user: User): void {
  const now = Date.now();
  if (user.lastSeenAt && now - user.lastSeenAt.getTime() < LAST_SEEN_INTERVAL_MS) return;
  prisma.user
    .update({ where: { id: user.id }, data: { lastSeenAt: new Date(now) } })
    .catch(() => {});
}

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

async function provisionUser(): Promise<User> {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Clerk user not found");
  const { user, linkedLegacy } = await provisionFromClerkUser(clerkUser);
  // A pre-Clerk user just linked: put their existing orgs into Clerk too.
  // Best effort; the user still gets in if Clerk is briefly unavailable.
  if (linkedLegacy) {
    await linkUserOrgsToClerk(user).catch((err) =>
      console.error("[clerk-sync] linking orgs for user failed:", err)
    );
  }
  return user;
}
