import { generateSecureToken } from "../utils/crypto";

const CSRF_TOKEN_KEY = "yo_csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken() {
  return generateSecureToken(32);
}

export function getCsrfToken() {
  try {
    const stored = localStorage.getItem(CSRF_TOKEN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        return parsed.token;
      }
    }
  } catch {}
  
  const token = generateCsrfToken();
  localStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify({
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }));
  return token;
}

export function validateCsrfToken(submittedToken) {
  try {
    const stored = localStorage.getItem(CSRF_TOKEN_KEY);
    if (!stored) return false;
    
    const parsed = JSON.parse(stored);
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(CSRF_TOKEN_KEY);
      return false;
    }
    
    return parsed.token === submittedToken;
  } catch {
    return false;
  }
}

export function getCsrfHeader() {
  return {
    [CSRF_HEADER]: getCsrfToken(),
  };
}

export const CSRF_CONFIG = {
  headerName: CSRF_HEADER,
  tokenKey: CSRF_TOKEN_KEY,
  expiryMs: 24 * 60 * 60 * 1000,
};