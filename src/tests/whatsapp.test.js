import { describe, expect, it } from "vitest";
import {
  buildCartWhatsAppUrl,
  buildWhatsAppMessage,
} from "../features/whatsapp/whatsapp";

describe("whatsapp helpers", () => {
  it("builds a readable order message", () => {
    const message = buildWhatsAppMessage({
      items: [{ title: "React avancé", qty: 2, unitPrice: 30000 }],
      total: 60000,
      customerName: "I. Bah",
      phone: "+224661000000",
    });

    expect(message).toContain("React avancé");
    expect(message).toContain("I. Bah");
    expect(message).toContain("60");
    expect(message).toContain("GNF");
  });

  it("returns a wa.me url with encoded payload", () => {
    const url = buildCartWhatsAppUrl([
      { title: "Livre 1", qty: 1, unitPrice: 15000 },
    ]);
    expect(url).toContain("https://wa.me/");
    expect(url).toContain("text=");
  });
});
