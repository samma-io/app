"use server";

import { prisma } from "@/lib/prisma";

export async function saveOnboardingDetails(
  email: string,
  name: string,
  orgName: string
) {
  await prisma.user.upsert({
    where: { email },
    create: { email, name, pendingOrgName: orgName },
    update: { name, pendingOrgName: orgName },
  });
}
