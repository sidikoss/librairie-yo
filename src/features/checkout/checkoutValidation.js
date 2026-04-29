/**
 * Validate checkout form data
 * @param {Object} data - Form data
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCheckout(data) {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Le nom est requis');
  }

  if (!data.phone?.trim()) {
    errors.push('Le téléphone est requis');
  } else if (!/^224\d{8,}$/.test(data.phone)) {
    errors.push('Format téléphone invalide (doit commencer par 224)');
  }

  if (!data.pin?.trim()) {
    errors.push('Le PIN est requis');
  } else if (!/^\d{4}$/.test(data.pin)) {
    errors.push('Le PIN doit avoir 4 chiffres');
  }

  if (!data.items || data.items.length === 0) {
    errors.push('Le panier est vide');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Alias for validateCheckout
 */
export function validateCheckoutForm(data) {
  return validateCheckout(data);
}

/**
 * Extract payment reference from form data
 * @param {Object} data - Form data
 * @returns {string} Payment reference
 */
export function extractPaymentReference(data) {
  return data?.txId || data?.reference || '';
}
