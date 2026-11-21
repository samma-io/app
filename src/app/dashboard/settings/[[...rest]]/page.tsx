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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Name and logo, members and invitations, and billing for {org.name}.
        </p>
      </div>
      <OrgSettings billing={billing} canEdit={role === "OWNER"} />
    </div>
  );
}
