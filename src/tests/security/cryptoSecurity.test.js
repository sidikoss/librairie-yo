import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePINFormat, generateSecureToken, secureCompare, hashPIN } from "../../utils/crypto";

describe("🔐 SECURITY: PIN Validation", () => {
  describe("validatePINFormat()", () => {
    it("should accept valid 4-digit PIN", () => {
      const result = validatePINFormat("1234");
      expect(result.valid).toBe(true);
      expect(result.pin).toBe("1234");
    });

    it("should reject PIN with non-digits", () => {
      const result = validatePINFormat("12a4");
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\d/);
    });

    it("should reject PIN too short", () => {
      const result = validatePINFormat("123");
      expect(result.valid).toBe(false);
    });

    it("should reject PIN too long", () => {
      const result = validatePINFormat("12345");
      expect(result.valid).toBe(false);
    });

    it("should reject empty/null PIN", () => {
      expect(validatePINFormat("").valid).toBe(false);
      expect(validatePINFormat(null).valid).toBe(false);
      expect(validatePINFormat(undefined).valid).toBe(false);
    });

    it("should strip non-digits from input", () => {
      const result = validatePINFormat("12a34");
      expect(result.valid).toBe(true);
      expect(result.pin).toBe("1234");
    });
  });
});

describe("🔐 SECURITY: Secure Token Generation", () => {
  describe("generateSecureToken()", () => {
    it("should generate tokens of correct length", () => {
      expect(generateSecureToken(16).length).toBe(16);
      expect(generateSecureToken(32).length).toBe(32);
      expect(generateSecureToken(8).length).toBe(8);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken(16));
      }
      expect(tokens.size).toBe(100);
    });

    it("should only contain hex characters", () => {
      const token = generateSecureToken(32);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate non-predictable tokens", () => {
      const tokens = [];
      for (let i = 0; i < 50; i++) {
        tokens.push(generateSecureToken(16));
      }
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(50);
    });
  });
});

describe("🔐 SECURITY: Constant-Time Comparison", () => {
  describe("secureCompare()", () => {
    it("should return true for identical strings", () => {
      expect(secureCompare("test", "test")).toBe(true);
    });

    it("should return false for different strings", () => {
      expect(secureCompare("test", "TEST")).toBe(false);
      expect(secureCompare("test", "test1")).toBe(false);
      expect(secureCompare("test", "")).toBe(false);
    });

    it("should handle different lengths safely", () => {
      expect(secureCompare("a", "ab")).toBe(false);
      expect(secureCompare("ab", "a")).toBe(false);
    });

    it("should handle null/undefined safely", () => {
      expect(secureCompare(null, "test")).toBe(false);
      expect(secureCompare("test", null)).toBe(false);
      expect(secureCompare(undefined, "test")).toBe(false);
      expect(secureCompare("test", undefined)).toBe(false);
    });

    it("should perform constant-time comparison", () => {
      const short = "a";
      const long = "aaaaaaaaaaaaaaa";
      const start = performance.now();
      secureCompare(short, long);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);
    });
  });
});

describe("🔐 SECURITY: PIN Hashing", () => {
  describe("hashPIN()", () => {
    it("should hash a valid PIN", async () => {
      const hash = await hashPIN("1234");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should produce consistent hashes", async () => {
      const hash1 = await hashPIN("1234");
      const hash2 = await hashPIN("1234");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different PINs", async () => {
      const hash1 = await hashPIN("1234");
      const hash2 = await hashPIN("5678");
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });

    it("should reject invalid PINs", async () => {
      await expect(hashPIN("")).rejects.toThrow();
      await expect(hashPIN("12")).rejects.toThrow();
      await expect(hashPIN("12345")).rejects.toThrow();
      await expect(hashPIN("abc")).rejects.toThrow();
    });

    it("should return 64-char hex hash", async () => {
      const hash = await hashPIN("0000");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});