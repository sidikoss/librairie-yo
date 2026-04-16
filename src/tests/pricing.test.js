import { describe, expect, it } from "vitest";
import { computeDynamicPrice } from "../features/catalog/bookModel";

describe("computeDynamicPrice", () => {
  it("applies the locked formula base + (pages / 10 * factor)", () => {
    const price = computeDynamicPrice(200, {
      base: 10000,
      pageDivider: 10,
      factor: 1500,
    });
    expect(price).toBe(40000);
  });

  it("guards against missing pages", () => {
    const price = computeDynamicPrice(undefined, {
      base: 10000,
      pageDivider: 10,
      factor: 1500,
    });
    expect(price).toBeGreaterThan(10000);
  });
});
