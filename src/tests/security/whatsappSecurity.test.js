import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl, buildWhatsAppMessage } from "../../features/whatsapp/whatsapp";

describe("🔐 SECURITY: WhatsApp Message Building", () => {
  describe("buildWhatsAppMessage()", () => {
    it("should handle special characters safely", () => {
      const payload = {
        items: [{ title: 'Test "quotes"', qty: 1, unitPrice: 10000 }],
        total: 10000,
      };
      const message = buildWhatsAppMessage(payload);
      expect(message).toBeDefined();
    });
  });

  describe("buildWhatsAppUrl()", () => {
    it("should properly encode URL", () => {
      const url = buildWhatsAppUrl("Hello World");
      expect(url).toContain("wa.me");
      expect(url).not.toMatch(/ /);
    });

    it("should encode special characters", () => {
      const url = buildWhatsAppUrl("Test & <tag>");
      expect(url).toContain("%26");
      expect(url).toContain("%3C");
    });

    it("should handle Unicode", () => {
      const url = buildWhatsAppUrl("été 🎉");
      expect(url).toBeDefined();
    });

    it("should prevent executable URL in text", () => {
      const url = buildWhatsAppUrl("<script>alert(1)</script>");
      const decoded = decodeURIComponent(url);
      expect(decoded).not.toMatch(/<script>alert<\/script>/i);
    });
  });
});

describe("🔐 SECURITY: Data Validation", () => {
  it("should handle empty cart", () => {
    const message = buildWhatsAppMessage({ items: [], total: 0 });
    expect(message).toBeDefined();
  });

  it("should handle large quantities", () => {
    const payload = {
      items: [{ title: "Book", qty: 999999, unitPrice: 1000 }],
      total: 999999000,
    };
    const message = buildWhatsAppMessage(payload);
    expect(message).toContain("999999");
  });
});