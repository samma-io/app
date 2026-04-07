import { PrismaClient } from "@prisma/client";

let _client: PrismaClient | null = null;

/**
 * Returns a Prisma client for the scanner TimescaleDB, or null if
 * SCANNER_DATABASE_URL is not configured.
 */
export function getScannerDb(): PrismaClient | null {
  if (!process.env.SCANNER_DATABASE_URL) return null;
  if (!_client) {
    _client = new PrismaClient({
      datasources: { db: { url: process.env.SCANNER_DATABASE_URL } },
      log: ["error"],
    });
  }
  return _client;
}
