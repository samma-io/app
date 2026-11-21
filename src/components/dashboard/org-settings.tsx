"use client";

import { useState, useTransition } from "react";
import { OrganizationProfile } from "@clerk/nextjs";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBillingDetails } from "@/app/dashboard/settings/actions";
import type { BillingDetails } from "@/lib/billing-details";

export function OrgSettings({ billing, canEdit }: { billing: BillingDetails; canEdit: boolean }) {
  return (
    <OrganizationProfile
      path="/dashboard/settings"
      routing="path"
      afterLeaveOrganizationUrl="/dashboard"
      appearance={{ elements: { rootBox: "w-full", cardBox: "w-full max-w-none shadow-none border border-gray-200" } }}
    >
      <OrganizationProfile.Page label="general" />
      <OrganizationProfile.Page label="members" />
      <OrganizationProfile.Page
        label="Billing details"
        url="billing-details"
        labelIcon={<Receipt className="h-4 w-4" />}
      >
        <BillingDetailsForm initial={billing} canEdit={canEdit} />
      </OrganizationProfile.Page>
    </OrganizationProfile>
  );
}

const FIELDS: { key: keyof BillingDetails; label: string; placeholder?: string; type?: string; half?: boolean }[] = [
  { key: "billingName", label: "Company name" },
  { key: "billingEmail", label: "Invoice email", type: "email", placeholder: "billing@example.com" },
  { key: "billingAddress1", label: "Address" },
  { key: "billingAddress2", label: "Address line 2" },
  { key: "billingPostalCode", label: "Postal code", half: true },
  { key: "billingCity", label: "City", half: true },
  { key: "billingCountry", label: "Country", placeholder: "SE", half: true },
  { key: "billingVatId", label: "VAT number", placeholder: "SE556677889901", half: true },
];

function BillingDetailsForm({ initial, canEdit }: { initial: BillingDetails; canEdit: boolean }) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveBillingDetails(values);
      setMessage(res.ok ? { ok: true, text: "Billing details saved." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing details</h2>
        <p className="text-sm text-gray-500">
          Shown on your invoices. {canEdit ? "" : "Only organization admins can change them."}
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className={f.half ? "col-span-1" : "col-span-2"}>
            <span className="block text-sm font-medium text-gray-700">{f.label}</span>
            <input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              disabled={!canEdit || pending}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-samma-navy focus:outline-none disabled:bg-gray-50"
            />
          </label>
        ))}
        {canEdit && (
          <div className="col-span-2 flex items-center gap-3 pt-1">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            {message && (
              <span className={message.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>{message.text}</span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
