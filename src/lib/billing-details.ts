// Billing details of an organisation: validation shared by the settings form
// action. Stored on Organisation (billing* columns).

export type BillingDetails = {
  billingName: string | null;
  billingEmail: string | null;
  billingAddress1: string | null;
  billingAddress2: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  billingCountry: string | null;
  billingVatId: string | null;
};

export const BILLING_FIELDS = [
  "billingName",
  "billingEmail",
  "billingAddress1",
  "billingAddress2",
  "billingPostalCode",
  "billingCity",
  "billingCountry",
  "billingVatId",
] as const;

const MAX: Record<keyof BillingDetails, number> = {
  billingName: 120,
  billingEmail: 254,
  billingAddress1: 120,
  billingAddress2: 120,
  billingPostalCode: 16,
  billingCity: 80,
  billingCountry: 64, // the format check below gives the useful message
  billingVatId: 20,
};

/** Returns the cleaned details, or an error message. Empty fields become null. */
export function parseBillingDetails(
  input: Record<string, unknown>
): { ok: true; data: BillingDetails } | { ok: false; error: string } {
  const data = {} as BillingDetails;
  for (const key of BILLING_FIELDS) {
    const raw = input[key];
    if (raw != null && typeof raw !== "string") return { ok: false, error: `Invalid ${key}` };
    let v = (raw ?? "").trim();
    if (key === "billingCountry" || key === "billingVatId") v = v.toUpperCase().replace(/\s+/g, "");
    if (v.length > MAX[key]) return { ok: false, error: `${label(key)} is too long` };
    data[key] = v || null;
  }
  if (data.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billingEmail)) {
    return { ok: false, error: "Billing email is not a valid address" };
  }
  if (data.billingCountry && !/^[A-Z]{2}$/.test(data.billingCountry)) {
    return { ok: false, error: "Country must be a two-letter code, e.g. SE" };
  }
  if (data.billingVatId && !/^[A-Z]{2}[A-Z0-9]{2,18}$/.test(data.billingVatId)) {
    return { ok: false, error: "VAT number must start with the country code, e.g. SE556677889901" };
  }
  return { ok: true, data };
}

function label(key: keyof BillingDetails): string {
  return key.replace(/^billing/, "").replace(/([A-Z0-9])/g, " $1").trim();
}
