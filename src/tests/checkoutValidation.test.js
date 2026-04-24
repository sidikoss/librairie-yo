import { describe, expect, it } from "vitest";
import { extractPaymentReference } from "../features/checkout/checkoutValidation";

describe("extractPaymentReference", () => {
  it("keeps plain reference values unchanged", () => {
    expect(extractPaymentReference("A58452")).toBe("A58452");
  });

  it("extracts the last reference segment from a full Orange Money SMS", () => {
    const sms =
      "Bonjour, Envoi de:50000GNF vers le 613908784, reference:PP234567.019.A58452. Orange Money vous remercie";
    expect(extractPaymentReference(sms)).toBe("A58452");
  });
});

import { validateCheckoutForm } from "../features/checkout/checkoutValidation";

describe("validateCheckoutForm", () => {
  it("should return errors for empty form", () => {
    const errors = validateCheckoutForm({ name: "", phone: "" });
    expect(errors.name).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it("should validate phone format", () => {
    const errors = validateCheckoutForm({ name: "Mory", phone: "123" });
    expect(errors.phone).toBeDefined();
  });

  it("should require PIN and reference for orange_money mode", () => {
    const errors = validateCheckoutForm({ 
      name: "Mory", 
      phone: "+224611111111", 
      mode: "orange_money",
      txId: "",
      pin: "" 
    });
    expect(errors.txId).toBeDefined();
    expect(errors.pin).toBeDefined();
  });
});
