import type { ExternalScannerConnection } from "@prisma/client";
import { decryptSecret } from "@/lib/secret-box";
import { getExternalScanner } from "@/lib/external-scanners";

// HTTP client for an external scanner (API: samma-io/external-scanner).
// Server-only: it decrypts the connection's API key. Never log the key or the
// Authorization header; errors carry the status code only.

const TIMEOUT_MS = 10_000;
const MAX_RESULT_BYTES = 1_000_000;
export const RESULT_CONTENT_TYPE = "application/json";

export type ScanResultResponse =
  | { state: "running" }
  | { state: "done"; contentType: string; result: unknown }
  | { state: "failed"; error: string };

/** Base URL for a catalog scanner: EXTERNAL_SCANNER_URL_<ID> overrides the catalog. */
export function scannerApiUrl(scannerId: string): string | null {
  const envKey = `EXTERNAL_SCANNER_URL_${scannerId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const url = process.env[envKey] || getExternalScanner(scannerId)?.apiUrl;
  return url ? url.replace(/\/$/, "") : null;
}

type Conn = Pick<ExternalScannerConnection, "scannerId" | "apiKeyEncrypted">;

function request(conn: Conn, path: string, init: RequestInit = {}) {
  const base = scannerApiUrl(conn.scannerId);
  if (!base) throw new Error(`No API URL configured for scanner "${conn.scannerId}"`);
  return fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      ...init.headers,
      Authorization: `Bearer ${decryptSecret(conn.apiKeyEncrypted)}`,
    },
  });
}

/** Starts a scan; returns the scanner's uuid for it. Throws on any failure. */
export async function startScan(
  conn: Conn,
  target: { id: string; value: string; port: number | null }
): Promise<string> {
  const res = await request(conn, "/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: target.value, port: target.port ?? undefined, samma_id: target.id }),
  });
  if (res.status !== 202 && res.status !== 200) {
    throw new Error(`Scanner refused the scan (HTTP ${res.status})`);
  }
  const body = (await res.json().catch(() => null)) as { uuid?: unknown } | null;
  if (typeof body?.uuid !== "string" || !/^[0-9a-f-]{36}$/i.test(body.uuid)) {
    throw new Error("Scanner did not return a scan uuid");
  }
  return body.uuid;
}

/** Asks for a scan's result. Network errors throw (the run stays running and is retried). */
export async function getScanResult(conn: Conn, externalId: string): Promise<ScanResultResponse> {
  const res = await request(conn, `/scans/${encodeURIComponent(externalId)}`);
  if (res.status === 202) return { state: "running" };
  if (res.status === 404) return { state: "failed", error: "Scanner does not know this scan" };
  if (res.status !== 200) throw new Error(`Scanner answered HTTP ${res.status}`);

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== RESULT_CONTENT_TYPE) {
    return { state: "failed", error: `Unsupported result type "${contentType || "none"}"` };
  }
  const text = await res.text();
  if (text.length > MAX_RESULT_BYTES) return { state: "failed", error: "Result is too large" };
  try {
    return { state: "done", contentType, result: JSON.parse(text) };
  } catch {
    return { state: "failed", error: "Result is not valid JSON" };
  }
}
