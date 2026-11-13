import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const LEGACY_PRE_ROTATION_KEY = "efootball-market-default-encryption-secret-key-32b";

/**
 * Cryptographic Utilities for Game Account Credentials Vault
 *
 * Uses AES-256-GCM authenticated encryption stored as Base64 JSON { iv, tag, ciphertext }.
 * - Encryption strictly uses CREDENTIAL_ENCRYPTION_KEY in production.
 * - Decryption attempts CREDENTIAL_ENCRYPTION_KEY first and falls back to the pre-Nov-2026
 *   legacy key only if GCM authentication fails so historical October 2026 deliveries remain readable.
 */

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function getEncryptionKey(): Buffer {
  const configured = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  const isPlaceholderEnv = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").includes("placeholder-project");

  if (
    process.env.NODE_ENV === "production" &&
    !isPlaceholderEnv &&
    (!configured || configured.length < 24 || configured.includes("default-encryption-secret"))
  ) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: CREDENTIAL_ENCRYPTION_KEY must be set to a strong >=24-char secret in production."
    );
  }

  const secret = configured || "efootball-market-local-dev-only-key-not-for-prod";
  return deriveKey(secret);
}

function getDecryptionCandidateKeys(): Buffer[] {
  const keys: Buffer[] = [];
  const configured = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (configured && configured.length >= 24) {
    keys.push(deriveKey(configured));
  } else if (process.env.NODE_ENV !== "production") {
    keys.push(deriveKey("efootball-market-local-dev-only-key-not-for-prod"));
  }
  keys.push(deriveKey(LEGACY_PRE_ROTATION_KEY));
  return keys;
}

export interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
}

/**
 * Encrypts sensitive string using AES-256-GCM authenticated encryption.
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ciphertext: encrypted,
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decrypts AES-256-GCM ciphertext payload back to plaintext.
 */
export function decryptCredential(encryptedBase64: string): string {
  if (!encryptedBase64) return "";
  try {
    const raw = Buffer.from(encryptedBase64, "base64").toString("utf8");
    const payload: EncryptedPayload = JSON.parse(raw);
    const iv = Buffer.from(payload.iv, "hex");
    const tag = Buffer.from(payload.tag, "hex");

    const candidateKeys = getDecryptionCandidateKeys();
    for (const key of candidateKeys) {
      try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(payload.ciphertext, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      } catch {
        // Try next candidate key
      }
    }
  } catch {
    // Fall through to sanitized error below
  }

  console.error("Failed to decrypt credential payload: authentication tag mismatch or malformed payload.");
  throw new Error("Decryption failed. Credential payload was tampered with or key is invalid.");
}
