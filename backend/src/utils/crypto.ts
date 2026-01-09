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

export type PostgresConnectionParts = {
  host: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
};

export function parsePostgresConnection(dsn: string | null | undefined): PostgresConnectionParts | undefined {
  if (!dsn) return undefined;
  try {
    const url = new URL(dsn);
    return {
      host: url.hostname,
      port: url.port || undefined,
      database: url.pathname ? url.pathname.replace(/^\//, "") : undefined,
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    };
  } catch {
    return undefined;
  }
}

export function buildPostgresConnection(parts: PostgresConnectionParts): string {
  if (!parts.host) throw new Error("Connection host is required");
  if (!parts.user) throw new Error("Connection user is required");
  if (!parts.password) throw new Error("Connection password is required");
  const user = encodeURIComponent(parts.user);
  const password = encodeURIComponent(parts.password);
  const creds = `${user}:${password}`;
  const port = parts.port ? `:${parts.port}` : "";
  const db = parts.database ? `/${parts.database}` : "";
  return `postgresql://${creds}@${parts.host}${port}${db}`;
}

export function mergeMaskedConnection(existingPlain: string, masked: string): string {
  try {
    const from = new URL(existingPlain);
    const to = new URL(masked);
    const merged = new URL(existingPlain);
    // Preserve protocol
    merged.protocol = from.protocol;
    // Username: take from masked (so user can change it)
    merged.username = to.username || from.username;
    // Password: always from existing plain (masked does not contain it)
    merged.password = from.password;
    // Host/port/db: take from masked
    merged.hostname = to.hostname || from.hostname;
    merged.port = to.port || from.port;
    merged.pathname = to.pathname || from.pathname;
    merged.search = to.search || from.search;
    return merged.toString();
  } catch {
    // Fallback: if parsing fails, return existingPlain unchanged
    return existingPlain;
  }
}
