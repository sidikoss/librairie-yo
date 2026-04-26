/**
 * Librairie YO - Validation Utilities
 * @module utils/validation
 * @description fonctions de validation des données utilisateur
 */

/**
 * Valide un numéro de téléphone guinéen
 * @param {string} phone - Numéro de téléphone
 * @returns {boolean} true si valide
 */
export function isValidPhone(phone) {
  const phoneRegex = /^224[0-9]{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Valide une adresse email
 * @param {string} email - Adresse email
 * @returns {boolean} true si valide
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide le prix d'un livre
 * @param {number} price - Prix en GNF
 * @returns {boolean} true si valide
 */
export function isValidPrice(price) {
  return typeof price === "number" && price >= 0 && price <= 1000000;
}

/**
 * Valide le titre d'un livre
 * @param {string} title - Titre du livre
 * @returns {boolean} true si valide
 */
export function isValidTitle(title) {
  return typeof title === "string" && title.trim().length >= 2 && title.length <= 200;
}

/**
 * Valide les informations de commande
 * @param {Object} order - Informations de commande
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateOrder(order) {
  const errors = [];

  if (!order.name?.trim()) {
    errors.push("Le nom est requis");
  }

  if (!isValidPhone(order.phone)) {
    errors.push("Numéro de téléphone invalide");
  }

  if (!order.address?.trim()) {
    errors.push("L'adresse est requise");
  }

  if (!order.items?.length) {
    errors.push("Le panier est vide");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Nettoie et formate un numéro de téléphone
 * @param {string} phone - Numéro de téléphone brut
 * @returns {string} Numéro formaté
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/[^\d]/g, "");
  return cleaned.startsWith("224") ? cleaned : `224${cleaned}`;
}

/**
 * Nettoie les entrées utilisateur pour éviter XSS
 * @param {string} input - Entrée utilisateur
 * @returns {string} Entrée nettoyée
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .trim();
}