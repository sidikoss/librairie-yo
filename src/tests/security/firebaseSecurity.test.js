import { describe, it, expect } from "vitest";

describe("Security: Firebase API Path Validation", () => {
  const { validateApiPath, sanitizeApiInput } = require("../../utils/apiSecurity");

  describe("validateApiPath()", () => {
    it("should allow valid paths", () => {
      expect(validateApiPath("books").valid).toBe(true);
      expect(validateApiPath("orders").valid).toBe(true);
    });

    it("should block path traversal", () => {
      expect(validateApiPath("../admin").valid).toBe(false);
      expect(validateApiPath("books/../admin").valid).toBe(false);
    });

    it("should handle too long paths", () => {
      const longPath = "a".repeat(300);
      expect(validateApiPath(longPath).valid).toBe(false);
    });
  });

  describe("sanitizeApiInput()", () => {
    it("should limit length", () => {
      const long = "x".repeat(1000);
      expect(sanitizeApiInput(long).length).toBeLessThanOrEqual(500);
    });

    it("should strip control characters", () => {
      expect(sanitizeApiInput("test\u0000")).toBe("test");
    });

    it("should strip HTML tags", () => {
      expect(sanitizeApiInput("<script>")).not.toContain("<");
    });
  });
});