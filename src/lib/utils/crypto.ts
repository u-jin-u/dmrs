/**
 * Cryptographic utilities for secure credential storage
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment
 * Throws if not configured properly
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "This is required for secure credential storage."
    );
  }

  // If key is hex-encoded (64 chars for 32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }

  // If key is base64-encoded
  if (key.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(key)) {
    const decoded = Buffer.from(key, "base64");
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }
  }

  // Derive a key from the string using PBKDF2
  // Using a fixed salt is acceptable since each encryption uses a random IV
  const salt = "dmrs-credential-key-derivation";
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Base64-encoded string containing IV + ciphertext + authTag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, "utf8");
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (16) + ciphertext (variable) + authTag (16)
  const combined = Buffer.concat([iv, ciphertext, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypt data using AES-256-GCM
 * @param encrypted - Base64-encoded string from encrypt()
 * @returns The decrypted plaintext
 * @throws Error if decryption fails (tampered data, wrong key, etc.)
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encrypted, "base64");

  // Minimum length: IV (16) + auth tag (16) = 32 bytes (empty plaintext case)
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short");
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);

  return plaintext.toString("utf8");
}

/**
 * Generate a secure random encryption key
 * Use this to generate a new ENCRYPTION_KEY value
 * @returns Hex-encoded 256-bit key
 */
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Check if the encryption key is configured
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}
