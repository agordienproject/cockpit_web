import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.DB_CONN_SECRET || "";
  if (!secret) {
    throw new Error("DB_CONN_SECRET is not set");
  }
  // Derive a 32-byte key from the secret string
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptConnection(plain: string): string {
  if (!plain) return "";
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    enc.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

export function decryptConnection(token: string): string {
  if (!token) return "";
  const [version, ivB64, encB64, tagB64] = token.split(":");
  if (version !== "v1" || !ivB64 || !encB64 || !tagB64) {
    throw new Error("Invalid encrypted connection format");
  }
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function maskConnection(plain: string): string {
  if (!plain) return "";
  // Mask password in DSN-like strings: postgres://user:pass@host -> postgres://user:***@host
  return plain.replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/i, "$1***$2");
}

export function isMaskedConnection(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.includes("***");
}
