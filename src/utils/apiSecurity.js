

const BLOCKED_PATH_PATTERNS = /\.\.|\/\.|\/\.\/|~\s|\/\s/;
const ALLOWED_PATHS = [
  "books",
  "catalog",
  "orders",
  "promoCodes",
  "book-files",
  "users",
  "settings",
];

function isPathTraversalAttempt(path) {
  return BLOCKED_PATH_PATTERNS.test(path);
}

function isPathAllowed(path) {
  const basePath = path.split("/")[0].split(".")[0];
  return ALLOWED_PATHS.includes(basePath);
}

export function validateApiPath(path) {
  if (!path || typeof path !== "string") {
    return { valid: false, error: "Chemin invalide" };
  }

  const trimmed = path.trim().split("?")[0].split("#")[0];

  if (trimmed.length > 200) {
    return { valid: false, error: "Chemin trop long" };
  }

  if (isPathTraversalAttempt(trimmed)) {
    console.warn("[security] Blocked path traversal attempt:", trimmed);
    return { valid: false, error: "Chemin non autorisé" };
  }

  if (!isPathAllowed(trimmed)) {
    console.warn("[security] Blocked unknown path:", trimmed);
    return { valid: false, error: "Chemin non autorisé" };
  }

  return { valid: true };
}

export function sanitizeApiInput(input, maxLength = 500) {
  if (input == null) return "";
  
  const str = String(input);
  
  if (str.length > maxLength) {
    return str.slice(0, maxLength);
  }
  
  return str
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/<[^>]*>/g, "");
}