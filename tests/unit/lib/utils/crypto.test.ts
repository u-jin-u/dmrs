/**
 * Crypto Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env
const originalEnv = process.env;

describe("Crypto Utilities", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt data correctly", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const plaintext = "Hello, this is a secret message!";

      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertexts for same plaintext (random IV)", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt } = await import("@/lib/utils/crypto");
      const plaintext = "Same message";

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle JSON data", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const data = { username: "admin", password: "secret123" };
      const plaintext = JSON.stringify(data);

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it("should handle empty strings", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");

      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe("");
    });

    it("should handle unicode characters", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const plaintext = "Hello 世界! 🔐 Ümlauts: äöü";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw on invalid encrypted data (too short)", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { decrypt } = await import("@/lib/utils/crypto");

      expect(() => decrypt("AAAA")).toThrow("Invalid encrypted data");
    });

    it("should throw on tampered data", async () => {
      process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32c";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const encrypted = encrypt("test message");

      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted, "base64");
      tamperedBuffer[20] = tamperedBuffer[20] ^ 0xff; // Flip bits
      const tampered = tamperedBuffer.toString("base64");

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe("encryption key handling", () => {
    it("should throw if ENCRYPTION_KEY is not set", async () => {
      delete process.env.ENCRYPTION_KEY;

      const { encrypt } = await import("@/lib/utils/crypto");

      expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY environment variable is not set");
    });

    it("should accept hex-encoded keys", async () => {
      // 64 hex chars = 32 bytes
      process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const plaintext = "test";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should derive key from arbitrary string", async () => {
      process.env.ENCRYPTION_KEY = "my-simple-password";

      const { encrypt, decrypt } = await import("@/lib/utils/crypto");
      const plaintext = "test message";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("isEncryptionConfigured", () => {
    it("should return true when key is set", async () => {
      process.env.ENCRYPTION_KEY = "some-key";

      const { isEncryptionConfigured } = await import("@/lib/utils/crypto");

      expect(isEncryptionConfigured()).toBe(true);
    });

    it("should return false when key is not set", async () => {
      delete process.env.ENCRYPTION_KEY;

      const { isEncryptionConfigured } = await import("@/lib/utils/crypto");

      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe("generateKey", () => {
    it("should generate a valid 64-character hex key", async () => {
      process.env.ENCRYPTION_KEY = "dummy"; // Need to set for module to load

      const { generateKey } = await import("@/lib/utils/crypto");

      const key = generateKey();

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate unique keys each time", async () => {
      process.env.ENCRYPTION_KEY = "dummy";

      const { generateKey } = await import("@/lib/utils/crypto");

      const key1 = generateKey();
      const key2 = generateKey();

      expect(key1).not.toBe(key2);
    });
  });
});
