function asCleanString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function trimQuotes(value) {
  return value.replace(/^["']+|["']+$/g, "");
}

const STOPWORDS = new Set([
  "payment",
  "reference",
  "ref",
  "orange",
  "money",
  "transaction",
]);

export function extractPaymentReference(input) {
  let raw = trimQuotes(asCleanString(input));
  if (!raw) return "";

  const dotSegments = raw
    .split(".")
    .map((part) => trimQuotes(part.trim()))
    .filter(Boolean);

  if (dotSegments.length > 1) {
    raw = dotSegments[dotSegments.length - 1];
  }

  if (/^[A-Za-z0-9_-]+$/.test(raw)) {
    return raw;
  }

  const matches = raw.match(/[A-Za-z0-9_-]+/g) || [];
  if (!matches.length) return "";

  const withDigits = matches.filter((token) => /\d/.test(token));
  const preferred = (withDigits.length ? withDigits : matches).find(
    (token) => !STOPWORDS.has(token.toLowerCase()),
  );

  return preferred || "";
}

export function validateCheckoutForm(form) {
  const data = form || {};
  const errors = {};

  if (!asCleanString(data.name)) {
    errors.name = "Nom requis";
  }

  const phoneDigits = asCleanString(data.phone).replace(/[^\d]/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    errors.phone = "Numéro de téléphone invalide";
  }

  const needsPin =
    data.mode === "orange_money" ||
    data.mode === "whatsapp";

  if (needsPin && !/^\d{4}$/.test(asCleanString(data.pin))) {
    errors.pin = "PIN à 4 chiffres requis";
  }

  return errors;
}
