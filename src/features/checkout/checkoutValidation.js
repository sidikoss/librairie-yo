import { isValidPhone, sanitizeText } from "../../utils/format";

export function extractPaymentReference(value) {
  const raw = sanitizeText(value);
  if (!raw) return "";

  const referenceMatch = raw.match(/reference\s*:\s*([^\n\r]+)/i);
  if (!referenceMatch) {
    return raw;
  }

  const rawReference = String(referenceMatch[1] || "")
    .split(/orange money/i)[0]
    .replace(/["']/g, "")
    .trim();

  const segments = rawReference
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) {
    return raw;
  }

  const candidate = segments[segments.length - 1];
  const token = candidate.match(/[A-Za-z0-9_-]+$/);
  return token?.[0] || candidate;
}

export function validateCheckoutForm(form) {
  const errors = {};

  if (!sanitizeText(form.name)) {
    errors.name = "Nom requis";
  }

  if (!isValidPhone(form.phone)) {
    errors.phone = "Numéro de téléphone invalide";
  }

  if (form.mode === "whatsapp") {
    const referencePaiement = extractPaymentReference(form.txId);
    if (!referencePaiement) {
      errors.txId = "Référence de transaction requise";
    }

    if (!/^\d{4}$/.test(String(form.pin || ""))) {
      errors.pin = "PIN à 4 chiffres requis";
    }
  }

  return errors;
}
