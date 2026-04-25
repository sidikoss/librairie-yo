export function capitalize(str) {
  if (!str) return "";
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}

export function titleCase(str) {
  if (!str) return "";
  return String(str).split(" ").map(capitalize).join(" ");
}

export function camelCase(str) {
  if (!str) return "";
  return String(str)
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function snakeCase(str) {
  if (!str) return "";
  return String(str)
    .replace(/\W+/g, " ")
    .split(/ |\B[A-Z]/.source)
    .map((word) => word.toLowerCase())
    .join("_");
}

export function kebabCase(str) {
  if (!str) return "";
  return String(str)
    .replace(/\W+/g, " ")
    .split(/ |\B[A-Z]/.source)
    .map((word) => word.toLowerCase())
    .join("-");
}

export function pascalCase(str) {
  if (!str) return "";
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function truncate(str, length = 50, suffix = "...") {
  if (!str || String(str).length <= length) return str;
  return String(str).slice(0, length - suffix.length).trim() + suffix;
}

export function slugify(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function unslugify(str) {
  if (!str) return "";
  return String(str).replace(/-/g, " ");
}

export function initials(str, maxLength = 2) {
  if (!str) return "";
  const words = String(str).trim().split(/\s+/);
  const result = words
    .slice(0, maxLength)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return result;
}

export function mask(str, start = 3, end = 4, maskChar = "*") {
  if (!str) return "";
  const s = String(str);
  if (s.length <= start + end) return s;
  
  const startPart = s.slice(0, start);
  const endPart = s.slice(-end);
  const maskedLength = s.length - start - end;
  const masked = maskChar.repeat(Math.min(maskedLength, 10));
  
  return startPart + masked + endPart;
}

export function reverse(str) {
  if (!str) return "";
  return String(str).split("").reverse().join("");
}

export function randomString(length = 10, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function padStart(str, length = 2, char = "0") {
  return String(str).padStart(length, char);
}

export function padEnd(str, length = 2, char = "0") {
  return String(str).padEnd(length, char);
}

export function escapeRegex(str) {
  if (!str) return "";
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function removeAccents(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function countWords(str) {
  if (!str) return 0;
  return String(str).trim().split(/\s+/).filter(Boolean).length;
}

export function countLines(str) {
  if (!str) return 0;
  return String(str).split(/\r\n|\r|\n/).length;
}

export function firstLine(str) {
  if (!str) return "";
  return String(str).split("\n")[0];
}

export function lastLine(str) {
  if (!str) return "";
  const lines = String(str).split("\n");
  return lines[lines.length - 1];
}

export function extractEmails(str) {
  if (!str) return [];
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  return String(str).match(emailRegex) || [];
}

export function extractUrls(str) {
  if (!str) return [];
  const urlRegex = /https?:\/\/[^\s]+/g;
  return String(str).match(urlRegex) || [];
}