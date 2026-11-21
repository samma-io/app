// Catalog of third-party ("external") scanners an org can connect.
// To offer a new external scanner, append an entry here. The price is copied
// onto each connection when it is made, so changing it here does not rewrite
// what existing connections are charged.
// apiUrl is where Samma calls the scanner (POST /scans, GET /scans/<uuid>);
// set EXTERNAL_SCANNER_URL_<ID> (e.g. EXTERNAL_SCANNER_URL_SAMMA_DEMO) to
// override it per environment. See samma-io/external-scanner for the API.

// Currency everything is billed and shown in.
export const BILLING_CURRENCY = "EUR";

export type ExternalScanner = {
  id: string;
  label: string;
  vendor: string;
  description: string;
  pricePerScanCents: number;
  currency: string;
  apiKeyHint: string;
  apiUrl: string;
};

export const EXTERNAL_SCANNERS: readonly ExternalScanner[] = [
  {
    id: "samma-demo",
    label: "Samma Demo Scanner",
    vendor: "Samma",
    description:
      "A demo external scanner for trying out the external scanner flow. Checks that each target answers over HTTPS.",
    pricePerScanCents: 100,
    currency: BILLING_CURRENCY,
    apiKeyHint: "sd_…",
    apiUrl: "http://external-scanner:8080",
  },
];

export function getExternalScanner(id: string): ExternalScanner | undefined {
  return EXTERNAL_SCANNERS.find((s) => s.id === id);
}

export function formatPrice(cents: number, currency = BILLING_CURRENCY): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
