import { WA_NUMBER } from "../../config/constants";
import { formatGNF, normalizePhone } from "../../utils/format";
import { calculateCartTotal } from "../checkout/cartMath";

export function buildWhatsAppMessage(orderPayload) {
  const lines = [
    "Bonjour Librairie YO 👋",
    "Je souhaite commander les livres suivants :",
    "",
  ];

  (orderPayload.items || []).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.title} x${item.qty} — ${formatGNF(
        Number(item.unitPrice || 0) * Number(item.qty || 0),
      )}`,
    );
  });

  lines.push("");
  lines.push(`Total : ${formatGNF(orderPayload.total || 0)}`);

  if (orderPayload.customerName) {
    lines.push(`Nom : ${orderPayload.customerName}`);
  }

  if (orderPayload.phone) {
    lines.push(`Téléphone : +${normalizePhone(orderPayload.phone)}`);
  }

  if (orderPayload.txId) {
    lines.push(`Transaction OM : ${orderPayload.txId}`);
  }

  lines.push("");
  lines.push("Merci.");

  return lines.join("\n");
}

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildBookWhatsAppUrl(book, quantity = 1) {
  const message = buildWhatsAppMessage({
    items: [
      {
        title: book.title,
        qty: Number(quantity || 1),
        unitPrice: Number(book.price || 0),
      },
    ],
    total: Number(book.price || 0) * Number(quantity || 1),
  });

  return buildWhatsAppUrl(message);
}

export function buildCartWhatsAppUrl(items, customer = {}) {
  const total = calculateCartTotal(items);

  const message = buildWhatsAppMessage({
    items,
    total,
    customerName: customer.name,
    phone: customer.phone,
    txId: customer.txId,
  });

  return buildWhatsAppUrl(message);
}
