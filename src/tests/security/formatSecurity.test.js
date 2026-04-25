import { describe, it, expect } from "vitest";
import { 
  sanitizeText, 
  normalizePhone, 
  isValidPhone,
  clamp,
  stripHtml 
} from "../../utils/format";

describe("Security: XSS Prevention", () => {
  describe("sanitizeText()", () => {
    it("should remove dangerous characters", () => {
      const result = sanitizeText("<script>alert(1)</script>");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should remove quotes", () => {
      expect(sanitizeText('"test"')).not.toContain('"');
      expect(sanitizeText("'test'")).not.toContain("'");
    });

    it("should handle null/undefined", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
    });
  });

  describe("stripHtml()", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<b>bold</b>")).toBe("bold");
    });
  });
});

describe("Security: Phone Validation", () => {
  describe("normalizePhone()", () => {
    it("should remove non-digits", () => {
      expect(normalizePhone("+224 661 862 044")).toBe("224661862044");
    });

    it("should handle null", () => {
      expect(normalizePhone(null)).toBe("");
    });
  });

  describe("isValidPhone()", () => {
    it("should accept valid Guinean numbers", () => {
      expect(isValidPhone("224661862044")).toBe(true);
    });

    it("should reject invalid", () => {
      expect(isValidPhone("123")).toBe(false);
    });
  });
});