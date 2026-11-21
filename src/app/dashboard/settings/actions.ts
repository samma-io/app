"use server";

import { revalidatePath } from "next/cache";
import { getActiveOrg, getActiveOrgRole } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { parseBillingDetails } from "@/lib/billing-details";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Saves the active org's billing details. OWNERs only. */
export async function saveBillingDetails(input: Record<string, unknown>): Promise<SaveResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, error: "No active organization" };
  if ((await getActiveOrgRole()) !== "OWNER") {
    return { ok: false, error: "Only organization admins can change billing details" };
  }
  const parsed = parseBillingDetails(input);
  if (!parsed.ok) return parsed;

  await prisma.organisation.update({ where: { id: org.id }, data: parsed.data });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
