export function formatGNF(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} GNF`;
}

export function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

export function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export function isValidPhone(value) {
  return /^\d{9,15}$/.test(normalizePhone(value));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
