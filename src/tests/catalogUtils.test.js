import { describe, expect, it } from "vitest";
import { normalizeBook } from "../features/catalog/bookModel";
import { buildSalesByBookMap } from "../services/orderService";

describe("Catalog Utils", () => {
  describe("normalizeBook", () => {
    it("should handle missing data with defaults", () => {
      const book = normalizeBook({});
      expect(book.title).toBe("Livre sans titre");
      expect(book.pages).toBe(120);
      expect(book.price).toBe(5000); // Base price for 120 pages
    });

    it("should prioritize manual price when enabled", () => {
      const book = normalizeBook({
        manualPrice: "10000",
        manualPriceEnabled: true,
        pages: 300
      });
      expect(book.price).toBe(10000);
    });

    it("should calculate dynamic price based on pages when manual is disabled", () => {
      const book = normalizeBook({
        manualPrice: "10000",
        manualPriceEnabled: false,
        pages: 300 // (300 - 150) / 100 = 2 extra tiers -> 5000 + 2*5000 = 15000
      });
      expect(book.price).toBe(15000);
    });

    it("should sync sales count with approved orders", () => {
      const book = normalizeBook({ salesCount: 5 }, 12);
      expect(book.salesCount).toBe(12);
    });
  });

  describe("buildSalesByBookMap", () => {
    it("should count items only from approved orders", () => {
      const orders = [
        { status: "approved", items: [{ bookId: "A", qty: 2 }, { bookId: "B", qty: 1 }] },
        { status: "pending", items: [{ bookId: "A", qty: 10 }] },
        { status: "approved", items: [{ bookId: "A", qty: 1 }] }
      ];
      const salesMap = buildSalesByBookMap(orders);
      expect(salesMap["A"]).toBe(3);
      expect(salesMap["B"]).toBe(1);
    });
  });
});
