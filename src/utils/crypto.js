// src/utils/crypto.js
// Utilitaires de chiffrement pour protéger les données sensibles côté client

const encoder = new TextEncoder();

export async function hashPIN(pin) {
  const cleanPIN = String(pin || "").replace(/\D/g, "");
  if (cleanPIN.length !== 4) {
    throw new Error("Le PIN doit contenir exactement 4 chiffres");
  }
  const data = encoder.encode(cleanPIN);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function hashSensitiveData(data, salt = "librairie-yo") {
  const combined = encoder.encode(`${salt}:${data}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function validatePINFormat(pin) {
  if (!pin || typeof pin !== "string") {
    return { valid: false, error: "PIN requis" };
  }
  const cleanPIN = pin.replace(/[^\d]/g, "");
  if (cleanPIN.length !== 4) {
    return { valid: false, error: "Le PIN doit contenir 4 chiffres" };
  }
  if (!/^\d{4}$/.test(cleanPIN)) {
    return { valid: false, error: "Le PIN doit contenir uniquement des chiffres" };
  }
  return { valid: true, pin: cleanPIN };
}

export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}

export function secureCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}