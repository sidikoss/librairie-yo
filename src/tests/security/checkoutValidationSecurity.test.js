import { describe, it, expect } from "vitest";
import { extractPaymentReference, validateCheckoutForm } from "../../features/checkout/checkoutValidation";

describe("🔐 SECURITY: Payment Reference Extraction", () => {
  describe("extractPaymentReference()", () => {
    it("should extract simple reference", () => {
      expect(extractPaymentReference("A58452")).toBe("A58452");
    });

    it("should extract from SMS format", () => {
      expect(extractPaymentReference("reference: A58452")).toBe("A58452");
      expect(extractPaymentReference("Ref: PP260417.2018.A58452")).toBe("A58452");
    });

    it("should sanitize script tags", () => {
      const result = extractPaymentReference('<script>alert(1)</script>A58452');
      expect(result).not.toContain("<script>");
    });

    it("should strip quotes", () => {
      expect(extractPaymentReference('"A58452"')).toBe("A58452");
    });

    it("should handle null/undefined", () => {
      expect(extractPaymentReference(null)).toBe("");
      expect(extractPaymentReference(undefined)).toBe("");
    });
  });

  describe("validateCheckoutForm()", () => {
    it("should reject empty name", () => {
      const errors = validateCheckoutForm({ name: "", phone: "224661862044", pin: "1234", mode: "orange_money" });
      expect(errors.name).toBeDefined();
    });

    it("should reject invalid phone", () => {
      const errors = validateCheckoutForm({ name: "John", phone: "123", pin: "1234", mode: "orange_money" });
      expect(errors.phone).toBeDefined();
    });

    it("should accept valid form", () => {
      const errors = validateCheckoutForm({ name: "John Doe", phone: "224661862044", pin: "1234", mode: "orange_money" });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

describe("🔐 SECURITY: Input Validation", () => {
  it("should handle long input", () => {
    const longRef = "A" + "5".repeat(100);
    const result = extractPaymentReference(longRef);
    expect(result.length).toBeLessThanOrEqual(50);
  });
});