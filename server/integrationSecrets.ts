import crypto from "node:crypto";

const PREFIX = "enc:v1:";

function key() {
  return crypto.createHash("sha256").update(process.env.JWT_SECRET || "leadflow-development-key").digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  const raw = Buffer.from(value.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskSecret(value: string | null | undefined) {
  const plain = decryptSecret(value);
  if (!plain) return "";
  if (plain.length <= 8) return "••••••••";
  return `${plain.slice(0, 4)}••••••••${plain.slice(-4)}`;
}
