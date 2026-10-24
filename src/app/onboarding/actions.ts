"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveOnboardingDetails(
  name: string,
  orgName: string
) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) {
    throw new Error("Unauthorized");
  }
  const normalizedEmail = sessionEmail.trim().toLowerCase();
  await prisma.user.update({
    where: { email: sessionEmail },
    data: { email: normalizedEmail, name, pendingOrgName: orgName },
  });
}
