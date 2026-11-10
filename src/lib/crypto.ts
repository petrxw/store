import "server-only";
import crypto from "node:crypto";

function key(): Buffer {
  const raw = process.env.CODE_ENCRYPTION_KEY;
  if (!raw) throw new Error("CODE_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("CODE_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return buf;
}

/** Format: v1:<iv>:<tag>:<ciphertext>, each part base64. Must match scripts/load-codes.mjs. */
export function encryptCode(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

export function decryptCode(payload: string): string {
  const [version, iv, tag, data] = payload.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unsupported code format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
