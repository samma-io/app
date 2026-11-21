import { redirect } from "next/navigation";
import { getActiveOrg, getActiveOrgRole } from "@/lib/org";
import { BILLING_FIELDS, type BillingDetails } from "@/lib/billing-details";
import { OrgSettings } from "@/components/dashboard/org-settings";

// Organization settings: Clerk's org profile (general, members and invites,
// billing plans) plus Samma's own "Billing details" page.
export default async function SettingsPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/dashboard");
  const role = await getActiveOrgRole();

  const billing = Object.fromEntries(BILLING_FIELDS.map((k) => [k, org[k]])) as BillingDetails;

  // Clerk's profile has its own title and navigation; no page header here.
  return <OrgSettings billing={billing} canEdit={role === "OWNER"} />;
}
