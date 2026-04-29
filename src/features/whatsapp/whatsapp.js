import { WA_NUMBER } from "../../config/constants";
import { formatGNF } from "../../utils/format";

function normalizeWaNumber(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("224")) return digits;
  if (digits.startsWith("0")) return `224${digits.slice(1)}`;
  return digits;
}

function buildWaLink(message) {
  const number = normalizeWaNumber(WA_NUMBER);
  const text = encodeURIComponent(String(message || "").trim());
  if (!number) return "#";
  return `https://wa.me/${number}?text=${text}`;
}

function normalizeCartItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item) => ({
      title: String(item.title || "Livre").trim() || "Livre",
      qty: Math.max(1, Number(item.qty || 1)),
      unitPrice: Number(item.unitPrice ?? item.price ?? 0) || 0,
    }));
}

export function buildWhatsAppMessage({
  items = [],
  total = 0,
  customerName = "",
  phone = "",
} = {}) {
  const normalizedItems = normalizeCartItems(items);
  const computedTotal = Number(total) > 0
    ? Number(total)
    : normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const lines = [
    "Bonjour Librairie YO,",
    "",
    "Je souhaite commander :",
    ...normalizedItems.map(
      (item) => `- ${item.title} x${item.qty} (${formatGNF(item.unitPrice)})`,
    ),
    "",
    `Total: ${formatGNF(computedTotal)}`,
  ];

  if (customerName) lines.push(`Nom: ${customerName}`);
  if (phone) lines.push(`Téléphone: ${phone}`);

  lines.push("", "Merci.");
  return lines.join("\n");
}

export function buildCartWhatsAppUrl(items = [], metadata = {}) {
  const normalizedItems = normalizeCartItems(items);
  const message = buildWhatsAppMessage({
    ...metadata,
    items: normalizedItems,
  });
  return buildWaLink(message);
}

export function buildBookWhatsAppUrl(book, qty = 1) {
  if (!book || typeof book !== "object") {
    return buildWaLink("Bonjour Librairie YO !");
  }

  return buildCartWhatsAppUrl([
    {
      title: book.title,
      qty: Math.max(1, Number(qty || 1)),
      unitPrice: Number(book.unitPrice ?? book.price ?? 0),
    },
  ]);
}

export function buildWhatsAppUrl(payload, qty = 1) {
  if (typeof payload === "string") {
    return buildWaLink(payload);
  }

  if (Array.isArray(payload)) {
    return buildCartWhatsAppUrl(payload);
  }

  if (payload && typeof payload === "object" && payload.title) {
    return buildBookWhatsAppUrl(payload, qty);
  }

  return buildWaLink("Bonjour Librairie YO !");
}
