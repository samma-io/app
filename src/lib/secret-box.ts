import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Encrypts outbound secrets (e.g. an external scanner vendor's API key) that
// Samma must be able to send back to the vendor, so they cannot be hashed.
// AES-256-GCM, key from SCANNER_SECRET_KEY (32 bytes, base64). Server-side only.
// Stored format: base64(iv):base64(tag):base64(ciphertext).

export class SecretBoxNotConfigured extends Error {
  constructor() {
    super("SCANNER_SECRET_KEY is not configured");
  }
}

function key(): Buffer {
  const raw = process.env.SCANNER_SECRET_KEY;
  if (!raw) throw new SecretBoxNotConfigured();
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new SecretBoxNotConfigured();
  return k;
}

export function isSecretBoxConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString("base64")).join(":");
}

export function decryptSecret(blob: string): string {
  const [iv, tag, ct] = blob.split(":").map((p) => Buffer.from(p, "base64"));
  if (!iv || !tag || !ct) throw new Error("Malformed secret");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
