import { createHash, createPrivateKey, createPublicKey, KeyObject, sign, verify } from "crypto";

// Ed25519 keys of the Samma rule exchange (docs/siem-exchange.md).
//
// Two separate keys, so that a compromised app cannot ship rules:
// - SIEM_RULES_PUBLIC_KEY: public half of the OFFLINE rules key. The
//   detection-engine CI signs ruleset bundles with the private half; the app
//   only checks uploads against it.
// - SIEM_BLOCKLIST_SIGNING_KEY: private key the app signs the community
//   blocklist with. SIEMs pin its public half and accept only block/allow
//   entries with it, never rules.
//
// Either env var takes PEM (newlines literal or as "\n") or base64 DER
// (SPKI for the public key, PKCS8 for the private key). Unset = that half of
// the exchange is off.

function readKey(env: string, kind: "public" | "private"): KeyObject | null {
  const raw = process.env[env]?.trim();
  if (!raw) return null;
  try {
    const key = raw.includes("-----BEGIN")
      ? kind === "public"
        ? createPublicKey(raw.replace(/\\n/g, "\n"))
        : createPrivateKey(raw.replace(/\\n/g, "\n"))
      : kind === "public"
        ? createPublicKey({ key: Buffer.from(raw, "base64"), format: "der", type: "spki" })
        : createPrivateKey({ key: Buffer.from(raw, "base64"), format: "der", type: "pkcs8" });
    if (key.asymmetricKeyType !== "ed25519") {
      console.error(`${env} is not an Ed25519 key; the rule exchange ignores it`);
      return null;
    }
    return key;
  } catch {
    console.error(`${env} could not be parsed; the rule exchange ignores it`);
    return null;
  }
}

let rulesKey: KeyObject | null | undefined;
let blocklistKey: KeyObject | null | undefined;

export function rulesPublicKey(): KeyObject | null {
  if (rulesKey === undefined) rulesKey = readKey("SIEM_RULES_PUBLIC_KEY", "public");
  return rulesKey;
}

export function blocklistSigningKey(): KeyObject | null {
  if (blocklistKey === undefined) blocklistKey = readKey("SIEM_BLOCKLIST_SIGNING_KEY", "private");
  return blocklistKey;
}

/** Base64 SPKI DER of a public key, for the feed and the docs. */
export function publicKeyBase64(key: KeyObject): string {
  const pub = key.type === "private" ? createPublicKey(key) : key;
  return pub.export({ format: "der", type: "spki" }).toString("base64");
}

export function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Check a base64 Ed25519 signature over `data`. Never throws. */
export function verifyEd25519(data: Buffer, signatureB64: string, key: KeyObject): boolean {
  try {
    const sig = Buffer.from(signatureB64, "base64");
    if (sig.length !== 64) return false;
    return verify(null, data, key, sig);
  } catch {
    return false;
  }
}

export function signEd25519(data: Buffer | string, key: KeyObject): string {
  return sign(null, Buffer.isBuffer(data) ? data : Buffer.from(data), key).toString("base64");
}
