"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveOnboardingDetails(
  name: string,
  orgName: string
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const normalizedEmail = email.trim().toLowerCase();

  await prisma.user.update({
    where: { email },
    data: { email: normalizedEmail, name, pendingOrgName: orgName },
  });
}
