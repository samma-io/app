"use server";

import { prisma } from "@/lib/prisma";

export async function checkUserExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user !== null;
}
