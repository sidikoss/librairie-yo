export function formatGNF(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} GNF`;
}

export function sanitizeText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/[<>'"`\\]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

export function normalizePhone(value) {
  if (value == null) return "";
  return String(value).replace(/[^\d]/g, "");
}

export function isValidPhone(value) {
  if (value == null) return false;
  return /^\d{9,15}$/.test(normalizePhone(value));
}

export function clamp(value, min, max) {
  return Math.max(Number(min) || 0, Math.min(Number(max) || Number.MAX_SAFE_INTEGER, Number(value) || 0));
}

export function stripHtml(value) {
  if (value == null) return "";
  return String(value).replace(/<[^>]*>/g, "").replace(/[\x00-\x1F\x7F]/g, "").trim();
}