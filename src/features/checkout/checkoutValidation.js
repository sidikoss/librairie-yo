import { isValidPhone, sanitizeText, stripHtml } from "../../utils/format";

function sanitizePaymentReference(value) {
  if (!value) return "";
  const stripped = stripHtml(value);
  return stripped
    .replace(/[<>'"\\`]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/(\.)\1+/g, "$1")
    .replace(/\.\./g, ".")
    .trim()
    .slice(0, 50);
}

export function extractPaymentReference(value) {
  const raw = sanitizePaymentReference(value);
  if (!raw) return "";

  const referenceMatch = raw.match(/reference\s*:\s*([^\n\r]+)/i);
  const rawReference = referenceMatch
    ? String(referenceMatch[1] || "").split(/orange money/i)[0]
    : raw;

  const cleaned = rawReference.replace(/["']/g, "").trim();

  const segments = cleaned.split(".").map((s) => s.trim()).filter(Boolean);
  if (segments.length > 1) {
    const token = segments[segments.length - 1].match(/[A-Za-z0-9_-]+$/);
    return sanitizePaymentReference(token?.[0] || segments[segments.length - 1]);
  }

  const token = cleaned.match(/[A-Za-z0-9_-]+$/);
  return sanitizePaymentReference(token?.[0] || cleaned);
}

export function validateCheckoutForm(form) {
  const errors = {};

  if (!sanitizeText(form.name)) {
    errors.name = "Nom requis";
  }

  if (!isValidPhone(form.phone)) {
    errors.phone = "Numéro de téléphone invalide";
  }

  if (form.mode === "whatsapp" || form.mode === "orange_money") {
    if (!/^\d{4}$/.test(String(form.pin || ""))) {
      errors.pin = "PIN à 4 chiffres requis";
    }
  }

  return errors;
}
