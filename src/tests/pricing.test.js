import { describe, expect, it } from "vitest";
import { computeDynamicPrice } from "../features/catalog/bookModel";

describe("computeDynamicPrice", () => {
  it("returns 5 000 GNF for 0 to 150 pages", () => {
    expect(computeDynamicPrice(0)).toBe(5000);
    expect(computeDynamicPrice(150)).toBe(5000);
  });

  it("adds 5 000 GNF for each additional 100 pages tier", () => {
    expect(computeDynamicPrice(151)).toBe(10000);
    expect(computeDynamicPrice(250)).toBe(10000);
    expect(computeDynamicPrice(251)).toBe(15000);
  });

  it("caps the price at 25 000 GNF", () => {
    expect(computeDynamicPrice(451)).toBe(25000);
    expect(computeDynamicPrice(1200)).toBe(25000);
  });
});
