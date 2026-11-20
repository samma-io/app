// Catalog of third-party ("external") scanners an org can connect.
// To offer a new external scanner, append an entry here. The price is copied
// onto each connection when it is made, so changing it here does not rewrite
// what existing connections are charged.

export type ExternalScanner = {
  id: string;
  label: string;
  vendor: string;
  description: string;
  pricePerScanCents: number;
  currency: string;
  apiKeyHint: string;
};

export const EXTERNAL_SCANNERS: readonly ExternalScanner[] = [
  {
    id: "samma-demo",
    label: "Samma Demo Scanner",
    vendor: "Samma",
    description:
      "A demo external scanner for trying out the external scanner flow. Runs are simulated.",
    pricePerScanCents: 500,
    currency: "USD",
    apiKeyHint: "sd_…",
  },
];

export function getExternalScanner(id: string): ExternalScanner | undefined {
  return EXTERNAL_SCANNERS.find((s) => s.id === id);
}

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
