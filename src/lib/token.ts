import { createHash, randomBytes } from "crypto";

/**
 * Generate a cryptographically random bearer token.
 * Returns both the raw token (shown once to the user) and its SHA-256 hash
 * (stored in the database).
 */
export function generateToken(): { raw: string; hash: string } {
  // 32 bytes = 256 bits of entropy, hex-encoded = 64 chars
  const raw = randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

/**
 * Hash a raw token for database storage or lookup.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
