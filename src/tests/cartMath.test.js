import { describe, expect, it } from "vitest";
import { calculateCartTotal } from "../features/checkout/cartMath";

describe("calculateCartTotal", () => {
  it("computes the cart total with quantities", () => {
    const total = calculateCartTotal([
      { unitPrice: 10000, qty: 2 },
      { unitPrice: 15000, qty: 1 },
    ]);
    expect(total).toBe(35000);
  });
});
