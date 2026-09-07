/**
 * Field-Level Encryption at Rest (AES-256-GCM) for ClearMed
 * 
 * Target encrypted fields:
 * - Patient membership number
 * - Medical justification text (diagnosis notes, clinical reasonings)
 * - Uploaded documents (content data / document paths)
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Fallback key for development if FIELD_ENCRYPTION_KEY environment variable is not defined
const MASTER_KEY_STRING =
  process.env.FIELD_ENCRYPTION_KEY ??
  "clearmed_field_level_encryption_secret_key_32_bytes!!";

function getEncryptionKey(): Buffer {
  // Ensure 256-bit (32 bytes) key length via SHA-256 hashing of master key string
  return crypto.createHash("sha256").update(MASTER_KEY_STRING).digest();
}

/**
 * Encrypts a sensitive string payload using AES-256-GCM.
 * Output format: `enc:gcm:iv_hex:tag_hex:ciphertext_hex`
 */
export function encryptField(plainText: string | null | undefined): string {
  if (plainText === null || plainText === undefined || plainText === "") {
    return plainText ?? "";
  }

  // Check if text is already encrypted to prevent double-encryption
  if (typeof plainText === "string" && plainText.startsWith("enc:gcm:")) {
    return plainText;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  const ivHex = iv.toString("hex");

  return `enc:gcm:${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a sensitive string payload encrypted via AES-256-GCM.
 */
export function decryptField(cipherText: string | null | undefined): string {
  if (cipherText === null || cipherText === undefined || cipherText === "") {
    return cipherText ?? "";
  }

  if (typeof cipherText !== "string" || !cipherText.startsWith("enc:gcm:")) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(":");
    if (parts.length !== 5) {
      return cipherText;
    }

    const [, , ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Field decryption failed:", error);
    return cipherText;
  }
}

/**
 * Helper to encrypt Patient membership number before storage.
 */
export function encryptMembershipNumber(membershipNumber: string): string {
  return encryptField(membershipNumber);
}

/**
 * Helper to decrypt Patient membership number for display.
 */
export function decryptMembershipNumber(encryptedMembershipNumber: string): string {
  return decryptField(encryptedMembershipNumber);
}

/**
 * Helper to encrypt medical justification text (diagnosis notes).
 */
export function encryptMedicalJustification(notes: string): string {
  return encryptField(notes);
}

/**
 * Helper to decrypt medical justification text (diagnosis notes).
 */
export function decryptMedicalJustification(encryptedNotes: string): string {
  return decryptField(encryptedNotes);
}

/**
 * Helper to encrypt uploaded document content or path.
 */
export function encryptUploadedDocument(documentData: string): string {
  return encryptField(documentData);
}

/**
 * Helper to decrypt uploaded document content or path.
 */
export function decryptUploadedDocument(encryptedDocumentData: string): string {
  return decryptField(encryptedDocumentData);
}
